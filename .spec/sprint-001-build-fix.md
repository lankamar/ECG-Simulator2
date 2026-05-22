# Sprint 001: Fix Build + Encoding + Restaurar Fixes Perdidos

## Problema
El working tree actual NO compila (27 errores `approximateBpm` dentro de `criteria`). Además, los fixes de FA Alta 0.35, IVR/AIVR vectors y Cuadrigeminia existen en commits remotos pero con encoding corrupto, y no están en el working tree.

## Objetivo
Obtener un `arrhythmiaData.ts` que:
1. Compile con `npx vite build`
2. Tenga encoding UTF-8 limpio (0 U+FFFD)
3. Incluya todos los fixes: FA Alta 0.35, IVR/AIVR vectors, Cuadrigeminia

## No Objetivo
- Modificar otros archivos
- Agregar nuevas arritmias
- Cambiar UI o componentes

## Estrategia
Tomar el archivo del commit `3cd5c09` (que compila y tiene todos los fixes) y reparar su encoding corruption (705 U+FFFD → caracteres acentuados correctos).

## Acceptance Criteria
1. `npx vite build` exitoso
2. `[regex]::Matches($text, "\uFFFD").Count` = 0 en `arrhythmiaData.ts`
3. `IVR_QRS_VECTOR` presente en vectores
4. `id: 'quadrigeminy'` presente en arrhythmias
5. `0.35 * factor` presente en `afib_high`
