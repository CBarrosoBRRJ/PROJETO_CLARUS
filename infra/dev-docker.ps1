function CleanOld {
  # imagens em uso por QUALQUER container
  $usedImageIds = @()
  $cids = docker ps -aq
  if ($cids) {
    $usedImageIds = $cids | ForEach-Object { docker inspect -f '{{.Image}}' $_ } |
      ForEach-Object { $_ -replace '^sha256:' } | Sort-Object -Unique
  }

  $apps = @("clarus/api","clarus/web")
  foreach ($app in $apps) {
    # só tags de release (v*)
    $tags = docker images --format "{{.Repository}}:{{.Tag}}" |
            Where-Object { $_ -like "$app:v*" }

    # montar lista [Ref, Created (RFC3339), Id]
    $items = foreach ($ref in $tags) {
      try {
        $insp = docker image inspect $ref --format "{{.Created}}|{{.Id}}"
        if (-not $insp) { continue }
        $parts = $insp -split '\|'
        $created = [datetimeoffset]::Parse($parts[0], [Globalization.CultureInfo]::InvariantCulture).UtcDateTime
        $imgId = ($parts[1] -replace '^sha256:')
        [pscustomobject]@{ Ref=$ref; Created=$created; Id=$imgId }
      } catch {
        [pscustomobject]@{ Ref=$ref; Created=[datetime]::MinValue; Id="" }
      }
    }

    if (-not $items) { continue }

    $ordered  = $items | Sort-Object Created -Descending
    $toRemove = if ($ordered.Count -gt $Keep) { $ordered[$Keep..($ordered.Count-1)] } else { @() }

    foreach ($it in $toRemove) {
      # SAFEGUARDS extra (além de já filtrar v*):
      if ($it.Ref -match ":latest$") { continue }
      if ($env:APP_VERSION -and $it.Ref -like "*:$env:APP_VERSION") { continue }

      if ($usedImageIds -contains $it.Id) {
        Write-Host "⛔ Em uso, mantendo: $($it.Ref)"
      } else {
        Write-Host "🗑️ Removendo: $($it.Ref)"
        docker rmi -f $it.Ref 2>$null | Out-Null
      }
    }
  }

  Write-Host "Limpeza concluída. Mantidas $Keep versões por app (sem remover imagens em uso)."
}
