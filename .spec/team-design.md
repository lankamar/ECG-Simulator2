# Diseño del Equipo de Subagentes — ECG Simulator 2

## Flujo de Trabajo
Cada sprint comienza con un ticket en `.spec/`. El coordinador (yo) lo descompone en tareas y las asigna a los agentes. Cada agente produce código + spec de verificación. QA-verifier corre antes de cada commit.

---

## 1. ecg-engineer (Motor Cardiaco)

**Archivos que domina:**
- `services/arrhythmiaData.ts` (generación de ondas, vectores, morphologías)
- `types.ts` (interfaces Arrhythmia, ECGPoint, Vector)
- `constants.tsx` (LEAD_ANGLES, vectores base)

**Responsabilidades:**
- Definir y ajustar vectores P/QRS/T para cada arritmia
- Implementar morphologías RBBB, LBBB (rSR' en V1, S ancha en V6, etc.)
- Implementar Torsades (twisting, axis modulation)
- Implementar FA (ondas f, factor de derivación)
- Implementar WPW (onda delta), aflutter (sawtooth)
- Implementar ritmos de escape (IVR, AIVR, junctional)
- Ajustar frecuencias (approximateBpm) para cada arritmia
- No toca componentes React ni configuración de build

**Input:** Spec de arritmia desde `.spec/`  
**Output:** Código en `arrhythmiaData.ts` + verificación en checklist  
**Verificación:** Que cada arritmia tenga id, name, category, criteria, approximateBpm, quiz, generateECGData

---

## 2. react-architect (Frontend)

**Archivos que domina:**
- `App.tsx` (estado global, loop, selección)
- `components/ECGMonitor.tsx` (grilla 12 derivaciones, FC)
- `components/RhythmStrip.tsx` (tira DII, papel ECG)
- `components/ZoomModal.tsx` (zoom comparativo)
- `components/*` (InfoPanel, TabButton, etc.)
- `index.tsx` (entry point)
- `index.html` (estructura HTML)

**Responsabilidades:**
- Conectar datos de arritmias a la UI
- Calcular y mostrar frecuencia cardíaca real desde approximateBpm
- Implementar zoom, pause, navegación entre derivaciones
- Manejar estados (selección, reproducción, pausa)
- No toca lógica vectorial ni generación de ondas

**Input:** Spec de UI desde `.spec/`  
**Output:** Código en componentes React  
**Verificación:** Que la UI refleje fielmente los datos de arrhythmiaData

---

## 3. tooling-ops (Build & Encoding)

**Archivos que domina:**
- `vite.config.ts`
- `tsconfig.json`
- `package.json`
- `vercel.json`
- `.gitignore`
- `package-lock.json`

**Responsabilidades:**
- Configurar Vite, esbuild, TypeScript
- Garantizar encoding UTF-8 en todos los archivos fuente
- Manejar line endings (CRLF/LF)
- Optimizar build (chunks, code splitting)
- Configurar Vercel para deploy automático
- Cache headers (no-cache HTML, immutable assets)
- No toca lógica ECG ni componentes React

**Input:** Spec de build/encoding desde `.spec/`  
**Output:** Archivos de configuración  
**Verificación:** `npx vite build` exitoso + 0 U+FFFD en .ts/.tsx

---

## 4. qa-verifier (Quality Gate)

**Archivos que domina:**
- `CHECKLIST.md`
- `services/arrhythmiaData.ts` (solo lectura/verificación)
- `types.ts` (verificación de interfaces)

**Responsabilidades:**
- Correr `npx vite build` antes de cada commit
- Contar arritmias (mínimo 30 + cuadrigeminia)
- Verificar 0 U+FFFD en todos los archivos fuente
- Verificar que cada arritmia tenga: id, name, category, criteria, approximateBpm, quiz, generateECGData
- Verificar que approximateBpm esté fuera de criteria
- Verificar que no haya comentarios `//` en código minificado
- Actualizar CHECKLIST.md

**Input:** Código de otros agentes  
**Output:** Reporte de calidad + CHECKLIST actualizado  
**Verificación:** Script automático que corre todas las verificaciones

---

## 5. git-ops (GitHub)

**Archivos que domina:**
- `.github/workflows/*.yml`
- `README.md` (sección de CI/CD)

**Responsabilidades:**
- Crear y mantener GitHub Actions workflows
- Commits: mensajes descriptivos siguiendo convención del repo
- Push a main (solo tras aprobación)
- Manejar ramas si es necesario
- No toca código fuente ni build config

**Input:** Instrucción de commit/push desde coordinador  
**Output:** Commits + pushes + workflows  
**Verificación:** `git log` limpio, Actions pasan

---

## 6. vercel-monitor (Post-Deploy)

**Archivos que domina:**
- `vercel.json`
- Logs de Vercel (externo)

**Responsabilidades:**
- Verificar que el deploy en Vercel refleje el commit actual
- Monitorear HTTP 200 en la URL de producción
- Verificar que no haya errores de runtime (console.error)
- Reportar si el deploy se ve distinto a lo esperado
- Sugerir rollback si hay regresión visual
- No toca código fuente

**Input:** URL de Vercel  
**Output:** Reporte de salud del deploy  
**Verificación:** Script que hace fetch a la URL y verifica contenido

---

## Matriz de Comunicación

| De \ Para | ecg-engineer | react-architect | tooling-ops | qa-verifier | git-ops | vercel-monitor |
|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| Coordinador | Asigna tickets | Asigna tickets | Asigna tickets | Ordena verificar | Ordena commit | Reporta salud |
| ecg-engineer | — | Envía spec de datos | — | Envía código a verificar | — | — |
| react-architect | Recibe spec de datos | — | — | Envía código a verificar | — | — |
| tooling-ops | — | — | — | Envía config a verificar | — | Envía URL build |
| qa-verifier | Reporta errores | Reporta errores | Reporta errores | — | Aprueba/bloquea commit | — |
| git-ops | — | — | — | Recibe aprobación | — | — |
| vercel-monitor | — | — | — | — | Reporta estado deploy | — |
