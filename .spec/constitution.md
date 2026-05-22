# Constitution — ECG Simulator 2

## Principios del Proyecto
1. **Spec-Driven Development (SDD):** Toda implementación comienza con especificación. El código es un artefacto derivado de la spec.
2. **Build siempre verde:** `npx vite build` debe pasar antes de cualquier commit.
3. **Encoding UTF-8 obligatorio:** Prohibido usar PowerShell `Set-Content`/`Out-File` o `[System.IO.File]::ReadAllText/WriteAllText` por riesgo de corrupción de acentos. Usar solo `cmd /c "git show ... > archivo"` o byte-level con `[System.Text.Encoding]::UTF8.GetBytes/GetString`.
4. **Un archivo fuente a la vez:** `services/arrhythmiaData.ts` es el único archivo modificado en esta iteración.

## Stack Tecnológico
- **Frontend:** React 19 + TypeScript 5.8
- **Build:** Vite 6 + esbuild
- **Gráficos:** Recharts 3.3
- **Estilos:** TailwindCDN
- **Hosting:** Vercel (auto-deploy desde main)
- **Node:** ^18

## Reglas de Código
- Sin comentarios `//` dentro de código (excepto en JSX)
- `approximateBpm` siempre fuera de `criteria` (propiedad directa de Arrhythmia)
- Vectores ECG: `magnitude`, `angle`, `duration`, `points` siempre presentes
- Variables en inglés, descripciones/quizzes en español

## Convenciones de Nomenclatura
- **Archivos:** camelCase (`arrhythmiaData.ts`)
- **Componentes:** PascalCase (`ECGMonitor.tsx`)
- **Interfaces:** PascalCase (`Arrhythmia`, `ECGPoint`)
- **Vectores:** UPPER_SNAKE_CASE (`NORMAL_QRS_VECTOR`)
- **Arritmias:** snake_case id (`afib_low`, `torsades`)

## Flujo SDD
0. **Constitution** — Reglas y principios (este archivo)
1. **Specify** — `sprint-N-feature.md` con QUÉ y POR QUÉ
2. **Clarify** — Resolver ambigüedades contra el PRD
3. **Plan** — `plan-feature.md` con HOW
4. **Tasks** — `tasks-feature.md` con descomposición atómica
5. **Implement & Iterate** — build por cada task
