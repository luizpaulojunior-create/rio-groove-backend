# Baseline oficial — Fase 3 estável

> Checkpoint arquitetural. **Não alterar esta tag.** Próximas evoluções em branch separada.

| Campo | Valor |
|-------|-------|
| **Tag** | `baseline-fase3-estavel` |
| **SHA** | `fbf282e` |
| **Deploy** | Render — `https://rio-groove-backend.onrender.com` |
| **Data** | maio/2026 |

## Escopo congelado

- JWT admin (`require-admin-auth`)
- CRUD protegido; GET catálogo público
- Contratos Fase 2 intactos
- Legado Fase 3 removido (scripts one-off, rota debug shipping)

## Rollback

```powershell
git checkout baseline-fase3-estavel
git push origin main --force-with-lease  # somente se necessário e autorizado
```

Render redeploy automático após push em `main`.
