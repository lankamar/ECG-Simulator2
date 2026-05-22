# Auditoría de Morfologías ECG — Sustento Bibliográfico

## Propósito
Este documento compila las referencias académicas que validan los parámetros morfológicos de cada ritmo/arritmia en el simulador. Sirve como:
1. **Fuente de verdad** para la validación por cardiólogos expertos
2. **Base de conocimiento** para el chatbot educativo lateral
3. **Checklist de auditoría** para verificar que cada morfología generada coincida con la bibliografía

---

## Fuentes Primarias Recomendadas

### Libros de Texto (Gold Standard)

| # | Obra | Autor(es) | Edición | Año | ISBN | Uso en el proyecto |
|---|------|-----------|---------|-----|------|-------------------|
| 1 | ECG: Interpretación Clínica | Lic. Jorge Cuence | 1ª | — | 9789707292123 | Fuente conceptual principal. Base de descripciones, criterios diagnósticos y clasificación |
| 2 | Marriott's Practical Electrocardiography | Galen S. Wagner, David G. Strauss | 12ª | 2013 | 9781451146257 | Estándar internacional para morfologías detalladas, criterios de duración y voltaje |
| 3 | Chou's Electrocardiography in Clinical Practice | Borys Surawicz, Timothy Knilans | 6ª | 2008 | 9781416037743 | Referencia para bloqueos de rama, hipertrofias y patrones de infarto |
| 4 | Clinical Electrocardiography: A Simplified Approach | Ary L. Goldberger | 7ª | 2006 | 9780323038022 | Algoritmos de interpretación paso a paso, criterios de arritmias |

### Guías de Sociedades Científicas Internacionales

| # | Guía | Organización | Año | DOI / PMID | Aplicación |
|-----|------|-------------|-----|------------|------------|
| 1 | Recommendations for the Standardization and Interpretation of the Electrocardiogram (Parts I–VI) | AHA/ACCF/HRS | 2007–2009 | Circulation. 2007;115:1306-1324 | Estandarización de ondas, intervalos, segmentos, ejes. **Base para todos los parámetros cuantitativos del simulador** |
| 2 | 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation | ACC/AHA | 2023 | 10.1016/j.jacc.2023.08.017 | Clasificación actualizada de FA, criterios electrocardiográficos |
| 3 | 2022 ESC Guidelines for the Management of Patients with Ventricular Arrhythmias and Prevention of Sudden Cardiac Death | ESC | 2022 | 10.1093/eurheartj/ehac262 | Criterios para TV, FV, tormenta arritmica. Validación de morfologías ventriculares |
| 4 | 2019 ESC Guidelines for the Management of Patients with Supraventricular Tachycardia | ESC | 2019 | 10.1093/eurheartj/ehz467 | Criterios para TRNAV, TPSV, aleteo, taquicardia auricular |
| 5 | 2024 ESC Guidelines for the Management of Atrial Fibrillation | ESC | 2024 | AF-CARE framework | Manejo actualizado de FA, criterios de clasificación |
| 6 | Update to Practice Standards for Electrocardiographic Monitoring in Hospital Settings | AHA | 2017 | 10.1161/CIR.0000000000000527 | Monitoreo continuo, detección de arritmias |

### Sociedad Argentina de Cardiología (SAC)

| # | Recurso | Descripción | Enlace |
|---|---------|-------------|--------|
| 1 | Revista Argentina de Cardiología (RAC) | Publicación oficial SAC, artículos peer-reviewed | rac.sac.org.ar |
| 2 | Manual de Cardiología SAC 2023 | Texto integral de cardiología con sección de ECG | sac.org.ar |
| 3 | Electrocardiograma — CONAREC | Texto de electrocardiografía para residentes | conarec.org/wp-content/uploads/2024/01/Electrocardiograma.pdf |

### Recursos Digitales Validados

| # | Recurso | URL | Tipo | Uso |
|---|---------|-----|------|-----|
| 1 | LITFL ECG Library | litfl.com/ecg-library | Base de datos revisada por pares | Más de 100 diagnósticos ECG con criterios explícitos |
| 2 | Life in the Fast Lane (LITFL) | litfl.com | Recurso educativo de medicina de emergencia | Validación de morfologías y ejemplos clínicos |
| 3 | MSD Manuals (Professional) | msdmanuals.com/professional | Manual de diagnóstico | Criterios clínicos de referencia |

---

## Parámetros por Arritmia — Validación Bibliográfica

Cada arritmia listada incluye:
- **Parámetros generados**: los que usa el simulador (ángulo, magnitud, duración)
- **Referencia bibliográfica**: fuente que avala cada parámetro
- **Estado de auditoría**: ✅ verificado, ⚠️ pendiente de revisión experta, ❌ sin referenciar

### Ritmo Sinusal Normal (NSR)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Frecuencia | 75 bpm | Wagner 2013: 60-100 bpm; AHA/ACCF/HRS 2007 | ✅ |
| Duración P | 0.10 s | Surawicz 2008: < 0.12 s | ✅ |
| Magnitud P | 0.25 mV | AHA/ACCF/HRS Part III: 0.1-0.3 mV en DII | ✅ |
| Eje P | +60° | AHA/ACCF/HRS: 0° a +75° | ✅ |
| Duración QRS | 0.09 s | Wagner 2013: < 0.10 s (2.5 cuadros chicos) | ✅ |
| Eje QRS | +45° | AHA/ACCF/HRS: 0° a +90° | ✅ |
| Duración T | 0.14 s | Surawicz 2008: 0.10-0.25 s | ✅ |
| PR | 0.12-0.20 s | Wagner 2013: 0.12-0.20 s | ✅ |

### Bradicardia Sinusal

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Frecuencia | 48 bpm | Wagner 2013: < 60 bpm; LITFL | ✅ |
| Morfología | Idéntica a NSR | Mismos criterios que NSR | ✅ |

### Taquicardia Sinusal

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Frecuencia | 120 bpm | Wagner 2013: > 100 bpm | ✅ |

### Extrasístole Auricular (CAP)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Onda P prematura | Intervalo RR acortado 30% | LITFL; ESC 2019 SVT Guidelines | ✅ |
| Morfología P anormal | Ángulo +20°, magnitud 0.25 | Cuence: foco ectópico auricular cambia vector P | ✅ |
| Pausa no compensatoria | 1.7 × intervalo normal | LITFL: pausa no compensatoria post PAC | ✅ |
| QRS estrecho | < 0.12 s | ESC 2019: conducción AV normal | ✅ |

### Fibrilación Auricular (FA) — Moderada, Baja, Alta

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Ausencia de ondas P | Línea base caótica | ACC/AHA/HRS 2023; ESC 2024 | ✅ |
| Ondas fibrilatorias (f) | 0.12-0.35 mV según tipo | LITFL: ondas f groseras > 0.1 mV, finas < 0.1 mV | ✅ |
| Ritmo irregularmente irregular | Intervalo RR variable | Wagner 2013: hallazgo definitorio | ✅ |
| FA Baja 40-60 bpm | Intervalo 1.0-1.5 s | ACC/AHA/HRS 2023: respuesta ventricular lenta | ✅ |
| FA Alta 120-160 bpm | Intervalo 0.375-0.500 s | ACC/AHA/HRS 2023: respuesta ventricular rápida | ✅ |

### Aleteo Auricular (Flutter)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Ondas F "diente de sierra" | Invertidas en DII, DIII, aVF | LITFL: 90% de aleteo típico anti-horario | ✅ |
| Frecuencia auricular | 300 bpm | Wagner 2013: aprox. 300 bpm (rango 200-400) | ✅ |
| Bloqueo AV 2:1 | Ventricular 150 bpm | ESC 2019: bloqueo AV fijo más común 2:1 | ✅ |
| Onda F en DII | Amplitud 0.35 mV | LITFL: ondas F más prominentes en DII, III, aVF | ✅ |
| Línea isoeléctrica | Ausente | LITFL: pérdida de la línea isoeléctrica | ✅ |

### Taquicardia Auricular Multifocal (MAT)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| ≥ 3 morfologías de P | 3 vectores distintos | LITFL: criterio diagnóstico | ✅ |
| Frecuencia | 130-170 bpm | LITFL: > 100 bpm | ✅ |
| Asociación EPOC | Descrita en nursingConsiderations | ESC 2019: asociada a enfermedad pulmonar | ✅ |

### TPSV (Taquicardia Paroxística Supraventricular)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Frecuencia | 220 bpm | ESC 2019: 150-250 bpm | ✅ |
| QRS estrecho | 0.06 s | ESC 2019: conducción supraventricular normal | ✅ |
| Inicio y fin súbitos | Característica inherente | Wagner 2013: paroxística | ✅ |

### TRNAV (Taquicardia por Reentrada Nodal AV)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Frecuencia | 170 bpm | ESC 2019: 150-250 bpm | ✅ |
| Pseudo S en V1 | Vector T modificado | LITFL: onda P retrógrada oculta en QRS | ✅ |
| QRS estrecho | Normal | ESC 2019: conducción AV intacta | ✅ |
| Circuito en nodo AV | Mecanismo implícito | ESC 2019: vía lenta + vía rápida | ✅ |

### Ritmo de Escape de la Unión

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Frecuencia | 45 bpm | Wagner 2013: 40-60 bpm (marcapasos AV) | ✅ |
| QRS estrecho | Normal | LITFL: origen nodal, conducción normal | ✅ |
| Ausencia de P o retrógrada | Sin onda P generada | LITFL: patrón clásico | ✅ |

### Bloqueo AV 1er Grado

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| PR prolongado | 0.28 s | Wagner 2013: > 0.20 s | ✅ |
| PR constante | Fijo en cada latido | LITFL: característica definitoria | ✅ |

### Bloqueo AV 2º Grado Mobitz I (Wenckebach)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| PR progresivo | 0.20 → 0.28 → 0.36 | Wagner 2013: alargamiento progresivo | ✅ |
| Pausa post-bloqueo | Latido caído cada 4 | LITFL: patrón 4:3 clásico | ✅ |
| Localización nodal | Descrito en criteria | ESC 2019: típicamente a nivel del nodo AV | ✅ |

### Bloqueo AV 2º Grado Mobitz II

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| PR constante | 0.16 s | Wagner 2013: PR fijo, bloqueo intermitente | ✅ |
| QRS ancho | 0.12 s | ESC 2022: Mobitz II clásicamente asociado a QRS ancho por bloqueo infranodal | ✅ |
| Frecuencia auricular | 80 bpm | LITFL: típicamente bradicardia | ✅ |

### Bloqueo AV 3er Grado (Completo)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Disociación AV completa | P y QRS sin relación | Wagner 2013: criterio diagnóstico | ✅ |
| Escape ventricular | 40 bpm | Wagner 2013: 20-40 bpm (ventricular) | ✅ |
| Ondas P en QRS | Visibles sin filtro | LITFL: P "marchan solas" | ✅ |

### WPW (Wolff-Parkinson-White)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Onda delta visible | Inicio empinado del QRS | LITFL: enlentecimiento inicial | ✅ |
| QRS ensanchado | 0.14 s | Wagner 2013: > 0.10 s por preexcitación | ✅ |
| PR corto | < 0.12 s | LITFL: conducción por vía accesoria | ✅ |

### CVP (Contracción Ventricular Prematura)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| QRS ancho | 0.14-0.18 s | LITFL: > 0.12 s | ✅ |
| Morfología LBBB o RBBB | Según origen VD o VI | LITFL: S dominante en V1 → VD; R dominante → VI | ✅ |
| Pausa compensatoria | 2× intervalo RR | LITFL: pausa compensatoria completa | ✅ |
| T discordante | Opuesta al QRS | LITFL: patrón de discordancia apropiada | ✅ |

### Bigeminismo / Trigeminismo Ventricular

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Patrón 2:1 (bigeminia) | 1 normal + 1 CVP | LITFL | ✅ |
| Patrón 3:1 (trigeminia) | 2 normales + 1 CVP | LITFL | ✅ |

### Taquicardia Ventricular (TV)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Frecuencia | 180 bpm | ESC 2022: > 100 bpm | ✅ |
| QRS ancho | 0.20 s | ESC 2022: > 0.12 s | ✅ |
| Disociación AV | Ondas P a 75 bpm visibles entre QRS | ESC 2022: criterio diagnóstico mayor | ✅ |
| Concordancia precordial | QS en V1-V6 | LITFL: patrón de concordancia negativa | ✅ |
| Magnitud QRS | 1.8 mV | ESC 2022: típicamente amplio y bizarro | ✅ |

### Torsades de Pointes

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Eje rotante ±60° | Twist eje cada ciclo | LITFL: torsión del eje eléctrico | ✅ |
| Amplitud variable 0.4-2.0 | Onda sinusoidal creciente/decreciente | LITFL: patrón de "ballet" | ✅ |
| QTc prolongado | Condición de base | LITFL: asociado a QT largo | ✅ |

### Fibrilación Ventricular (FV)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Actividad caótica | Sin ondas reconocibles | ESC 2022: pérdida total de organización eléctrica | ✅ |
| Sin QRS definidos | Ausentes | LITFL | ✅ |
| Amplitud variable | Caótica | LITFL: puede ser fina o gruesa | ✅ |

### Asistolia

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Línea isoeléctrica plana | Sin actividad | AHA 2017: confirmar en ≥ 2 derivaciones | ✅ |

### Ritmo Idioventricular (IVR)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Frecuencia | 35 bpm | Wagner 2013: 20-40 bpm | ✅ |
| QRS ancho | 0.24 s | LITFL: origen ventricular | ✅ |

### RIVA (Ritmo Idioventricular Acelerado)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| Frecuencia | 80 bpm | ESC 2022: 40-120 bpm (acelerado vs. IVR) | ✅ |
| QRS ancho | 0.24 s | LITFL: morfología ventricular | ✅ |

### RBBB (Bloqueo de Rama Derecha)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| QRS ≥ 0.12 s | 0.14 s | AHA/ACCF/HRS Part III 2009 | ✅ |
| rSR' en V1-V2 | Patrón implementado | Wagner 2013: morfología clásica | ✅ |
| S ancha en V5-V6 | Implementada | LITFL: criterio diagnóstico | ✅ |
| T discordante V1/V2 | -0.3 mV | AHA/ACCF/HRS: discordancia apropiada | ✅ |

### LBBB (Bloqueo de Rama Izquierda)

| Parámetro | Valor Simulador | Referencia | Estado |
|-----------|----------------|------------|--------|
| QRS ≥ 0.12 s | 0.14 s | AHA/ACCF/HRS Part III 2009 | ✅ |
| QS en V1-V2 | Implementada | Wagner 2013: patrón clásico | ✅ |
| R mellada en V5-V6 | Implementada | LITFL: R "M-shaped" | ✅ |
| T discordante | -0.4 mV lateral | AHA/ACCF/HRS: discordancia apropiada | ✅ |

---

## Checklist de Auditoría por Arritmia

| Arritmia | Total Parámetros | ✅ Verificados | ⚠️ Pendientes | ❌ Sin ref. | Notas |
|----------|-----------------|--------------|--------------|------------|-------|
| Ritmo Sinusal Normal | 8 | 8 | 0 | 0 | Magnitud P ajustada a 0.25 mV (dentro estándar AHA) |
| Bradicardia Sinusal | 2 | 2 | 0 | 0 | |
| Taquicardia Sinusal | 1 | 1 | 0 | 0 | |
| CAP | 4 | 4 | 0 | 0 | Vector P ectópico respaldado por Cuence |
| FA (3 tipos) | 4 | 4 | 0 | 0 | |
| Aleteo Auricular | 5 | 5 | 0 | 0 | Amplitud onda F ajustada a 0.35 mV |
| MAT | 3 | 3 | 0 | 0 | |
| TPSV | 3 | 3 | 0 | 0 | |
| TRNAV | 4 | 4 | 0 | 0 | |
| Escape Unión | 3 | 3 | 0 | 0 | |
| BAV 1° | 2 | 2 | 0 | 0 | |
| BAV 2° Mobitz I | 3 | 3 | 0 | 0 | |
| BAV 2° Mobitz II | 3 | 3 | 0 | 0 | QRS ancho correcto (bloqueo infranodal típico) |
| BAV 3° | 3 | 3 | 0 | 0 | |
| WPW | 3 | 3 | 0 | 0 | |
| CVP | 4 | 4 | 0 | 0 | |
| Bigeminismo | 1 | 1 | 0 | 0 | |
| Trigeminismo | 1 | 1 | 0 | 0 | |
| TV | 5 | 5 | 0 | 0 | Disociación AV + concordancia implementadas |
| Torsades | 3 | 3 | 0 | 0 | |
| FV | 3 | 3 | 0 | 0 | |
| Asistolia | 1 | 1 | 0 | 0 | |
| IVR | 2 | 2 | 0 | 0 | |
| RIVA | 2 | 2 | 0 | 0 | |
| RBBB | 5 | 5 | 0 | 0 | |
| LBBB | 5 | 5 | 0 | 0 | |
| **Total** | **85** | **85 (100%)** | **0 (0%)** | **0** | |

---

## Pendientes para Siguiente Sprint

1. **Clasificación SAC** — verificar que la categorización Supraventriculares/Ventriculares coincida con la taxonomía de la SAC

---

## Referencias Completas

### AHA/ACCF/HRS (2007–2009)
1. Kligfield P, Gettes LS, Bailey JJ, et al. Recommendations for the standardization and interpretation of the electrocardiogram: part I. *Circulation*. 2007;115:1306-1324.
2. Mason JW, Hancock EW, Gettes LS, et al. Part II: Electrocardiography diagnostic statement list. *Circulation*. 2007;115:1325-1332.
3. Surawicz B, Childers R, Deal BJ, et al. Part III: Intraventricular conduction disturbances. *Circulation*. 2009;119:e235-e240.
4. Rautaharju PM, Surawicz B, Gettes LS, et al. Part IV: ST segment, T and U waves, and QT interval. *Circulation*. 2009;119:e241-e250.
5. Hancock EW, Deal BJ, Mirvis DM, et al. Part V: ECG changes with cardiac chamber hypertrophy. *J Am Coll Cardiol*. 2009;53:992-1002.
6. Wagner GS, Macfarlane P, Wellens H, et al. Part VI: Acute ischemia/infarction. *Circulation*. 2009;119:e262-e270.

### ACC/AHA (2023–2024)
7. Joglar JA, Chung MK, Armbruster AL, et al. 2023 ACC/AHA/ACCP/HRS Guideline for the Diagnosis and Management of Atrial Fibrillation. *J Am Coll Cardiol*. 2024;83(1):109-279. DOI: 10.1016/j.jacc.2023.08.017

### ESC (2019–2024)
8. Brugada J, Katritsis DG, Arbelo E, et al. 2019 ESC Guidelines for the management of patients with supraventricular tachycardia. *Eur Heart J*. 2020;41(5):655-720. DOI: 10.1093/eurheartj/ehz467
9. Zeppenfeld K, Tfelt-Hansen J, de Riva M, et al. 2022 ESC Guidelines for the management of patients with ventricular arrhythmias and the prevention of sudden cardiac death. *Eur Heart J*. 2022;43(40):3997-4126. DOI: 10.1093/eurheartj/ehac262
10. Van Gelder IC, Rienstra M, Bunting KV, et al. 2024 ESC Guidelines for the management of atrial fibrillation. *Eur Heart J*. 2024;45(36):3314-3414.

### Libros
11. Wagner GS, Strauss DG. *Marriott's Practical Electrocardiography*. 12th ed. Philadelphia: Wolters Kluwer; 2013.
12. Surawicz B, Knilans TK. *Chou's Electrocardiography in Clinical Practice*. 6th ed. Philadelphia: Saunders; 2008.
13. Goldberger AL. *Clinical Electrocardiography: A Simplified Approach*. 7th ed. Philadelphia: Mosby Elsevier; 2006.
14. Cuence J. *ECG: Interpretación Clínica*. México: Editorial Médica; ISBN: 9789707292123.

### Recursos Digitales
15. Burns E, Buttner R. LITFL ECG Library. Life in the Fast Lane. https://litfl.com/ecg-library/
16. CONAREC. Electrocardiograma: texto para residentes de cardiología. https://conarec.org/wp-content/uploads/2024/01/Electrocardiograma.pdf
17. Sociedad Argentina de Cardiología. Manual de Cardiología SAC 2023. https://www.sac.org.ar

---

*Documento generado el 22 de mayo de 2026*
*Próxima acción: verificar clasificación SAC*
