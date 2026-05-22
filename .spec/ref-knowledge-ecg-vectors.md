# Reference: ECG Vector Knowledge Base

Fuentes clínicamente validadas para el motor de vectores cardíacos.

---

## 1. Sistema Hexaxial (Ángulos de Derivaciones)

Plano frontal. Cada derivación tiene un ángulo en el plano frontal:

| Derivación | Ángulo | Pared cardíaca |
|-----------|--------|---------------|
| I | 0° | Lateral izquierda |
| II | +60° | Inferior |
| III | +120° | Inferior |
| aVR | -150° | (cavidad) |
| aVL | -30° | Lateral alta |
| aVF | +90° | Inferior |

Derivaciones perpendiculares: I ⊥ aVF, II ⊥ aVL, III ⊥ aVR.

Fuente: Wikipedia - Hexaxial reference system; LITFL - ECG Axis Interpretation; Physiopedia - Determining Cardiac Axis

---

## 2. Ejes Cardíacos Normales

| Onda | Eje normal (grados) |
|------|---------------------|
| P | 0° a +75° |
| QRS | -30° a +90° |
| T | 0° a +90° (usualmente cercano al QRS) |

Desviaciones:
- Normal: I positivo, aVF positivo
- Desviación izquierda (LAD): I positivo, aVF negativo, II negativo ( -30° a -90° )
- Desviación derecha (RAD): I negativo, aVF positivo, III positivo ( +90° a +180° )
- Eje extremo: I negativo, aVF negativo ( -90° a -180° )

Fuente: LITFL - ECG Axis Interpretation; StatPearls - Electrical Right and Left Axis Deviation; Deranged Physiology - The QRS axis

---

## 3. Intervalos Normales

| Intervalo | Duración (ms) | En papel 25mm/s |
|-----------|---------------|-----------------|
| P wave | ≤ 110 ms (0.11s) | ≤ 2.7 cuadros chicos |
| PR interval | 120-200 ms (0.12-0.20s) | 3-5 cuadros chicos |
| QRS duration | 80-120 ms (0.08-0.12s) | 2-3 cuadros chicos |
| QT interval | ≤ 420 ms a 60 bpm | Variable por FC |
| T wave | ~160 ms | ~4 cuadros chicos |

Fuente: Medscape - Normal Electrocardiography Intervals; University of Nottingham - Normal Duration Times; ACLS Medical Training - Basics of ECG

---

## 4. Vectores P/QRS/T Normales

### Onda P (despolarización auricular)
- Vector normal: dirección inferior-izquierda, aprox +60°
- Positiva en I, II, aVF, V1-V6
- Negativa en aVR
- Amplitud ≤ 2.5 mm (0.25 mV)
- Duración ≤ 0.11s
- Morfología: suave, redondeada, simétrica
- Eje anormal (>75° o <0°) se asocia con FA, crecimiento auricular

### Complejo QRS (despolarización ventricular)
- Vector normal: dirección inferior-izquierda, 0° a +90° (promedio ~+60°)
- Positivo en I, II, aVL, V5-V6
- Negativo en aVR, V1-V2 (transición V3-V4)
- Amplitud: variable por derivación (0.5-2.0 mV en limb, hasta 3.0 mV en precordiales)
- Morfología normal: Q pequeña septal en I, V5-V6; R creciente V1-V6; S decreciente V1-V6

### Onda T (repolarización ventricular)
- Vector: concordante con QRS (misma dirección general)
- Positiva en I, II, V2-V6
- Negativa en aVR (normal)
- Puede ser negativa en III, aVL (variante normal)
- Asimétrica: ascenso lento, descenso rápido
- Amplitud: < 5mm en limb, < 10mm en precordiales

Fuente: ECGwaves - Characteristics of the Normal ECG; ACLS Medical Training - Basics of ECG; Healio - P Wave, QRS Complex, T Wave

---

## 5. Fórmula de Proyección Vectorial

Para proyectar un vector cardíaco a una derivación:

```
valor_lead = magnitude * cos((vector_angle - lead_angle) * PI / 180)
```

Donde:
- `magnitude`: amplitud del vector (0.1-2.0)
- `vector_angle`: dirección del vector en grados
- `lead_angle`: ángulo de la derivación en plano frontal
- `cos()`: coseno en radianes (convertir grados a radianes)

### Vector resultante (Novosel formula)
Para calcular el eje QRS medio desde derivaciones I y aVF:
```
tan(θ) = (2 * V_aVF) / (sqrt(3) * V_I)
```

Fuente: Physiological Society - Trigonometry of the ECG; Novosel et al. 1999

---

## 6. Morfologías Específicas

### RBBB (Right Bundle Branch Block)
- **QRS > 120ms** (criterio mayor)
- **V1-V2**: patrón rsR' ("orejas de conejo", M-shaped)
- **V5-V6, I, aVL**: S ancha y slurred
- **T discordante** en V1-V3 (inversión normal)
- **Eje**: normal (no se desvía en RBBB aislado)
- Mecanismo: VD se activa tarde desde el VI a través del septo

Fuente: LITFL - RBBB ECG Library; Healio - RBBB Review; Geeky Medics - Bundle Branch Block

### LBBB (Left Bundle Branch Block)
- **QRS > 120ms** (criterio mayor)
- **V1-V2**: QS profunda o rs (deflexión negativa)
- **V5-V6, I, aVL**: R monofásica ancha (sin Q septal), mellada/notched
- **T discordante**: ST/T opuesto al QRS
- **Eje**: desviación izquierda frecuente
- Mecanismo: activación secuencial: septo → VD → VI (lento, vía miocardio)

Regla mnemotécnica:
- LBBB: W en V1, M en V6 (WiLLiam)
- RBBB: M en V1, W en V6 (MoRRoW)

Fuente: LITFL - LBBB; Healio - LBBB Review; Geeky Medics - Bundle Branch Block; ECGbook - LBBB

### WPW (Wolff-Parkinson-White)
- **PR < 120ms** (corto)
- **Delta wave**: slurring inicial del QRS (upstroke lento)
- **QRS > 100ms** (ensanchado por pre-excitación)
- **T secundariamente alterada**
- Vector delta: dirección variable según vía accesoria

Fuente: Healio - WPW Review; ECGwaves - Pre-excitation

### IVR (Idioventricular Rhythm)
- **FC: 20-40 bpm**
- **QRS > 120ms** (ancho y bizarro, típicamente 0.24s)
- **No P waves** (o disociadas)
- **Regular**
- Ritmo de escape ventricular: marcapasos más lento del corazón
- Origen focal ventricular (no Purkinje)

Fuente: PracticalClinicalSkills - Idioventricular Rhythm; Healio - Idioventricular Rhythms Review; EKG.academy

### AIVR (Accelerated Idioventricular Rhythm)
- **FC: 50-110 bpm** (usualmente 60-100)
- **QRS > 120ms** (ancho)
- **Monomórfico** (3+ latidos consecutivos)
- **Inicio/terminación gradual**
- **Fusion beats** ocasionales
- Común en reperfusión post-IAM
- NO requiere tratamiento (benigno, autolimitado)

Fuente: PMC - AIVR Diagnosis (Gildea & Levis, 2018); Healio - Idioventricular Rhythms Review; The Permanente Journal

### Torsades de Pointes
- **Polimórfica**: QRS cambia de eje y amplitud (twisting)
- **FC: 160-250 bpm**
- **QT prolongado** (basal, antes del evento)
- Asociado: hipomagnesemia, hipokalemia, fármacos (antiarrítmicos clase III)
- Ciclo de torsión: ~10-20 latidos
- Amplitud: varía sinusoidalmente (peak-valley-peak ~0.5-2.0 mV)

Fuente: LITFL - Torsades de Pointes; Healio - Polymorphic VT; ACLS Medical Training

### FA (Fibrilación Auricular)
- **No P waves**: ondas f (fibrilatorias) caóticas
- **R-R irregularmente irregular**
- **QRS**: estrecho (si no hay bloqueo)
- Ondas f: mejor visibles en V1, DII
- FA Baja: ondas f finas (< 0.1 mV) — 40-60 bpm
- FA Alta: ondas f prominentes (0.2-0.5 mV) — 120-160 bpm

Fuente: ECGwaves - Atrial Fibrillation; Healio - Atrial Fibrillation Review

### Aflutter (Atrial Flutter)
- **Ondas F**: patrón diente de sierra (sawtooth)
- **Frecuencia auricular: ~300/min** (250-350)
- **Mejor visibles**: DII, III, aVF
- **Conducción AV**: variable (2:1, 3:1, 4:1)
- Aislada en aVR (negativa por ser vista desde cavidad)

Fuente: LITFL - Atrial Flutter; ECGwaves - Atrial Flutter; Healio - Atrial Flutter Review

---

## 7. Factores Precordiales (V1-V6)

Las derivaciones precordiales tienen factores de proximidad:
- V1-V2: cerca del VD y septo (factores 0.8-1.0 para ondas f, por ej.)
- V3-V4: transición septo — pared libre (factor 0.5-0.6)
- V5-V6: cerca del VI, pared lateral (factor 0.15-0.3)

La transición R/S normal ocurre entre V3-V4 (onda R se vuelve > S).
Si ocurre antes (V2): rotación contraria (counterclockwise)
Si ocurre después (V5): rotación horaria (clockwise)

Fuente: ECGwaves - The ECG Leads; GE Healthcare - Lead Placement; The Student Physiologist - ECG Leads

---

## 8. Fuentes Primarias

| Fuente | Tipo | URL |
|--------|------|-----|
| LITFL (Life In The Fast Lane) | Biblioteca ECG | https://litfl.com/ecg-library/ |
| ECGwaves | Curso ECG | https://ecgwaves.com/ |
| Healio - Learn the Heart | ECG Reviews | https://www.healio.com/cardiology/learn-the-heart |
| StatPearls (NCBI) | Artículos revisados | https://www.ncbi.nlm.nih.gov/books/NBK470532/ |
| Medscape | Referencia clínica | https://emedicine.medscape.com/article/2172196-overview |
| Physiopedia | Recursos estudiante | https://thephysiologist.org/study-materials/ |
| Geeky Medics | Tutoriales ECG | https://geekymedics.com/how-to-read-an-ecg/ |
| ACLS Medical Training | ECG Básico | https://www.aclsmedicaltraining.com/basics-of-ecg |
| Novosel et al. 1999 | Fórmula eje cardíaco | Trigonometry of the ECG — Physiological Society |
