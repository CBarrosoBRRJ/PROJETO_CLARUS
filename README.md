# Clarus (Fase 0)
Monorepo do SaaS Clarus.

## Estrutura
clarus/
├─ apps/
│  ├─ api/   (FastAPI + SQLModel)
│  └─ web/   (React + Vite + Tailwind + shadcn/ui)
├─ infra/
│  ├─ docker-compose.yml
│  └─ .gitlab-ci.yml
└─ .env.example

## Dev rápido
1) Copie .env.example para .env e preencha variáveis.
2) docker compose -f infra\docker-compose.yml up --build
