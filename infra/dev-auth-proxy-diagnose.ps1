param(
  [string]$ProjectRoot,
  [string]$ApiFallback,
  [switch]$FixViteProxy
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ====== Defaults ======
if (-not $ProjectRoot) {
  if ($PSScriptRoot) { $ProjectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path }
  else { $ProjectRoot = (Get-Location).Path }
}
if (-not $ApiFallback) { $ApiFallback = 'http://localhost:8000' }  # sua API publica 8000

function Read-Dotenv {
  param([string]$Path)
  $dict = @{}
  if (Test-Path $Path) {
    Get-Content $Path | ForEach-Object {
      if ($_ -match '^\s*#') { return }
      if ($_ -match '^\s*$') { return }
      $kv = $_ -split '=',2
      if ($kv.Count -eq 2) { $dict[$kv[0].Trim()] = $kv[1].Trim() }
    }
  }
  return $dict
}

Write-Host "=== Clarus Dev Diagnose: Auth/Login via Vite Proxy ===`n" -ForegroundColor Cyan

$webPath   = Join-Path $ProjectRoot 'apps\web'
$apiPath   = Join-Path $ProjectRoot 'apps\api'
$infraPath = Join-Path $ProjectRoot 'infra'

if (!(Test-Path $webPath)) { throw "Pasta web não encontrada: $webPath" }
if (!(Test-Path $infraPath)) { New-Item -ItemType Directory -Force -Path $infraPath | Out-Null }

# 1) Descobrir API_URL via .env.* ou fallback
$envFiles = @(
  Join-Path $webPath '.env.development.local',
  Join-Path $webPath '.env.local',
  Join-Path $webPath '.env'
)
$envData = @{}
foreach ($f in $envFiles) {
  $d = Read-Dotenv -Path $f
  foreach ($k in $d.Keys) { $envData[$k] = $d[$k] }
}
$apiUrl = $envData['VITE_API_URL']
if ([string]::IsNullOrWhiteSpace($apiUrl)) { $apiUrl = $ApiFallback }

Write-Host ("VITE deve proxiar /auth para: {0}" -f $apiUrl) -ForegroundColor Yellow

# 2) Validar conectividade
try { $uri = [Uri]$apiUrl } catch { throw "VITE_API_URL inválida: $apiUrl" }
$apiHost = $uri.Host
$apiPort = if ($uri.Port -gt 0) { $uri.Port } else { if ($uri.Scheme -eq 'https') {443} else {80} }

Write-Host ("Testando TCP para {0}:{1} ..." -f $apiHost, $apiPort)
$tcp = Test-NetConnection -ComputerName $apiHost -Port $apiPort -WarningAction SilentlyContinue
if (-not $tcp.TcpTestSucceeded) { Write-Host ("[X] Porta inacessível: {0}:{1}" -f $apiHost, $apiPort) -ForegroundColor Red }
else { Write-Host ("[OK] Porta acessível: {0}:{1}" -f $apiHost, $apiPort) -ForegroundColor Green }

# 3) Testes de health (se não existir, pode dar 404 mesmo)
$healthUrls = @(
  ($apiUrl.TrimEnd('/') + '/health'),
  ($apiUrl.TrimEnd('/') + '/healthz'),
  ($apiUrl.TrimEnd('/') + '/api/health'),
  ($apiUrl.TrimEnd('/') + '/docs')    # FastAPI docs - costuma existir
) | Select-Object -Unique

$okHealth = $false
foreach ($u in $healthUrls) {
  try {
    Write-Host "GET $u"
    $r = Invoke-WebRequest -Uri $u -UseBasicParsing -TimeoutSec 5
    Write-Host "→ Status: $($r.StatusCode)"
    if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) { $okHealth = $true; break }
  } catch { Write-Host "→ Falhou: $($_.Exception.Message)" }
}

# 4) Proxy do Vite
$viteConfig = Join-Path $webPath 'vite.config.ts'
$proxyOk = $false
if (Test-Path $viteConfig) {
  $content = Get-Content $viteConfig -Raw
  if ($content -match '/auth' -and $content -match 'proxy') {
    $m = [regex]::Match($content, 'target:\s*["'']([^"'''']+)["'']')
    if ($m.Success) {
      $target = $m.Groups[1].Value
      Write-Host ("`nProxy atual aponta para: {0}" -f $target)
      if ($target -eq $apiUrl) { $proxyOk = $true }
    } else {
      Write-Host "Não consegui extrair 'target' do proxy no vite.config.ts"
    }
  } else {
    Write-Host 'vite.config.ts sem proxy de /auth (ou não identificado).'
  }

  if ($FixViteProxy.IsPresent) {
    Write-Host ("`nAplicando fix no vite.config.ts para usar {0} ..." -f $apiUrl) -ForegroundColor Cyan
    $new = [regex]::Replace($content, 'target:\s*["''][^"'''']+["'']', ("target: '{0}'" -f $apiUrl))
    if ($new -ne $content) {
      Set-Content -Path $viteConfig -Value $new -Encoding UTF8
      Write-Host 'vite.config.ts atualizado.'
      $proxyOk = $true
    } else {
      Write-Host 'Não foi possível atualizar automaticamente; revise manualmente.' -ForegroundColor Yellow
    }
  }
} else {
  Write-Host "vite.config.ts não encontrado em $viteConfig" -ForegroundColor Yellow
}

Write-Host "`n=== Resultado ==="
if ($okHealth -and $proxyOk) {
  Write-Host '✅ API responde e proxy do Vite parece correto. Tente logar novamente.' -ForegroundColor Green
} elseif ($okHealth -and -not $proxyOk) {
  Write-Host '✅ API responde, mas o proxy do Vite pode estar errado. Rode com -FixViteProxy ou ajuste manualmente.' -ForegroundColor Yellow
} elseif (-not $okHealth -and $proxyOk) {
  Write-Host '❌ Proxy ok, mas API não responde em /health (pode ser normal). Verifique /docs ou rotas reais.' -ForegroundColor Red
} else {
  Write-Host '❌ Sem confirmação de health e proxy possivelmente incorreto. Confira portas/rotas.' -ForegroundColor Red
}

Write-Host "`nDicas:"
Write-Host '- Sua API está publicada em 8000 (docker compose port api 8000).'
Write-Host '- O proxy do Vite deve apontar para http://localhost:8000.'
Write-Host '- Ajuste VITE_API_URL em apps\web\.env.development.local se necessário.'
Write-Host '- Garanta no Auth0 os callbacks de http://localhost:5174.'
