# Sprint 002: Auditoría + Equipo SDD

## Objetivo
Establecer línea de base del repositorio y diseñar el equipo de subagentes antes de cualquier modificación.

## Plan por Fases (no implementar hasta aprobación)

### Fase 1 — Inventario (una sola tarea)
Listar cada archivo del repo con:
- Estado (OK / obsoleto / por revisar)
- Dependencias
- Si se usa o no
- Problemas detectados

### Fase 2 — Diseño del Equipo
Definir subagentes OpenCode con:
- Rol, expertise, herramientas
- Archivos a cargo
- Criterios de aceptación

Propuesta inicial:
| Agente | Rol | Domina |
|--------|-----|--------|
| ecg-engineer | Motor de ondas | Vectores, morphologías, arritmias |
| react-architect | Frontend | Componentes, Recharts, estado |
| tooling-ops | Build + encoding | Vite, UTF-8, git, package.json |
| qa-verifier | Testing | Build, encoding, checklist, regresiones |
| git-ops | GitHub | Commits, branches, PRs, Actions |
| vercel-monitor | Deploy | Monitoreo, logs, rollback |

### Fase 3 — Limpieza (post-aprobación)
- Eliminar archivos obsoletos (deploy.yml, incident report?)
- Actualizar .gitignore
- Verificar package.json

### Fase 4 — CI/CD
- GitHub Actions workflow funcional
- Health check endpoint o script de verificación post-deploy

## Reglas
- Una fase a la vez
- Discutir antes de implementar
- QA gatekeeper antes de cada commit
