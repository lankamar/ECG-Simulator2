import { Arrhythmia, ECGPoint, ArrhythmiaCategory } from '../types';

// --- 12-Lead Vectorial Generation Engine ---

const LEAD_ANGLES: Record<string, number> = {
  DI: 0, DII: 60, DIII: 120, aVR: -150, aVL: -30, aVF: 90,
};

const generateComponent = (startTime: number, duration: number, points: [number, number][]): ECGPoint[] => {
  return points.map(([timePerc, value]) => ({
    time: startTime + timePerc * duration,
    value: value,
  }));
};

interface Vector {
    magnitude: number;
    angle: number;
    duration: number;
    points: [number, number][];
}

const create12LeadBeat = (startTime: number, pVector: Vector | null, qrsVector: Vector, tVector: Vector, prInterval: number = 0.16, morphology?: 'lbbb' | 'rbbb') => {
    const leads = ['DI', 'DII', 'DIII', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
    const beatData: Record<string, ECGPoint[]> = Object.fromEntries(leads.map(l => [l, []]));
    const pDuration = pVector ? pVector.duration : 0;
    const actualPR = Math.max(prInterval, pDuration);
    const qrsStartTime = startTime + (pVector ? actualPR - pDuration + pDuration : 0);
    const tStartTime = qrsStartTime + qrsVector.duration + 0.08;


    // --- Frontal Leads Projection ---
    if (pVector) {
        Object.keys(LEAD_ANGLES).forEach(lead => {
            const leadAngle = LEAD_ANGLES[lead];
            const projection = Math.cos((pVector.angle - leadAngle) * Math.PI / 180);
            beatData[lead].push(...generateComponent(startTime, pVector.duration, pVector.points.map(([t,v]) => [t, v * pVector.magnitude * projection])));
        });
    }
    
    // --- Precordial R-Wave Progression for QRS ---
    const rWaveProgression = { V1: 0.1, V2: 0.3, V3: 0.6, V4: 1.0, V5: 1.2, V6: 1.0 };
    const sWaveProgression = { V1: -1.0, V2: -1.2, V3: -1.0, V4: -0.6, V5: -0.2, V6: -0.1 };

    leads.forEach(lead => {
        if (LEAD_ANGLES[lead] !== undefined) { // Frontal leads
            const leadAngle = LEAD_ANGLES[lead];
            const qrsProjection = Math.cos((qrsVector.angle - leadAngle) * Math.PI / 180);
            const tProjection = Math.cos((tVector.angle - leadAngle) * Math.PI / 180);
            beatData[lead].push(...generateComponent(qrsStartTime, qrsVector.duration, qrsVector.points.map(([t, v]) => [t, v * qrsVector.magnitude * qrsProjection])));
            beatData[lead].push(...generateComponent(tStartTime, tVector.duration, tVector.points.map(([t,v]) => [t, v * tVector.magnitude * tProjection])));
        } else { // Precordial leads
            let qrsPoints: [number, number][];
            let tMag: number;
            
            if (morphology === 'lbbb') {
                const isLateral = lead.match(/V[5-6]/);
                const isSeptal = lead.match(/V[1-2]/);
                if (isSeptal) qrsPoints = [[0,0], [0.1, -0.2], [0.5, -1.2], [1,0]]; // Deep QS
                else if (isLateral) qrsPoints = [[0,0], [0.2, 0.2], [0.6, 1.2], [1,0]]; // Broad notched R
                else qrsPoints = [ [0,0], [0.5, -0.5], [1, 0]]; // Transition
                tMag = isLateral ? -0.4 : 0.2; // Discordant T
            } else if (morphology === 'rbbb') {
                 const isLateral = lead.match(/V[5-6]/);
                 const isRight = lead.match(/V[1-2]/);
                 if (isRight) qrsPoints = [[0,0], [0.2, 0.4], [0.4, -0.3], [0.8, 1.0], [1, 0]]; // rSR'
                 else if(isLateral) qrsPoints = [[0,0], [0.3, 0.8], [0.8, -0.6], [1, 0]]; // qRS with wide S
                 else qrsPoints = [ [0,0], [0.1, sWaveProgression[lead as keyof typeof sWaveProgression] * 0.2], [0.4, rWaveProgression[lead as keyof typeof rWaveProgression]], [0.7, sWaveProgression[lead as keyof typeof sWaveProgression]], [1, 0]];
                 tMag = isRight ? -0.3 : 0.3; // Discordant T in V1/V2
            } else {
                 qrsPoints = [ [0,0], [0.1, sWaveProgression[lead as keyof typeof sWaveProgression] * 0.2], [0.4, rWaveProgression[lead as keyof typeof rWaveProgression]], [0.7, sWaveProgression[lead as keyof typeof sWaveProgression]], [1, 0]];
                 tMag = lead.match(/V[4-6]/) ? 0.4 : 0.2;
            }

            beatData[lead].push(...generateComponent(qrsStartTime, qrsVector.duration, qrsPoints.map(([t,v]) => [t, v * qrsVector.magnitude])));
            beatData[lead].push(...generateComponent(tStartTime, tVector.duration, tVector.points.map(([t,v]) => [t, v * tMag])));
        }
    });

    return beatData;
};


// --- Beat Templates ---
const NORMAL_P_VECTOR: Vector = { magnitude: 0.15, angle: 60, duration: 0.08, points: [[0,0], [0.5, 1], [1,0]]};
const NORMAL_QRS_VECTOR: Vector = { magnitude: 1.0, angle: 45, duration: 0.09, points: [[0,0], [0.1, -0.2], [0.4, 1.0], [0.7, -0.4], [1, 0]] };
const NORMAL_T_VECTOR: Vector = { magnitude: 0.3, angle: 45, duration: 0.14, points: [[0,0], [0.5, 1], [1,0]]};
const VT_QRS_VECTOR: Vector = { magnitude: 1.5, angle: -90, duration: 0.16, points: [[0,0], [0.25, 1.2], [0.5, -1.0], [0.75, 0.4], [1,0]]};
const VT_T_VECTOR: Vector = { magnitude: 0.4, angle: 90, duration: 0.18, points: [[0,0], [0.5, -1], [1,0]]};
const RBBB_QRS_VECTOR: Vector = { magnitude: 1.1, angle: 100, duration: 0.14, points: [[0,0], [0.4, 1.0], [0.7, -0.4], [1, 0]] };
const RBBB_T_VECTOR: Vector = { magnitude: 0.3, angle: -60, duration: 0.16, points: [[0,0], [0.5, -1], [1,0]]};
const LBBB_QRS_VECTOR: Vector = { magnitude: 1.2, angle: -60, duration: 0.14, points: [[0,0], [0.5, 1.0], [1, 0]] };
const LBBB_T_VECTOR: Vector = { magnitude: 0.4, angle: 120, duration: 0.16, points: [[0,0], [0.5, -1], [1,0]]};


// --- Arrhythmia Definitions ---

const generateSinusRhythm = (duration: number, bpm: number) => {
    const baseInterval = 60 / bpm;
    let data: Record<string, ECGPoint[]> = {};
    let time = 0;
    while(time < duration) {
        const intervalJitter = (Math.random() - 0.5) * baseInterval * 0.05; // +/- 2.5% interval variation
        const interval = baseInterval + intervalJitter;
        
        const magnitudeJitter = 1 + (Math.random() - 0.5) * 0.1; // +/- 5% magnitude variation
        const p = {...NORMAL_P_VECTOR, magnitude: NORMAL_P_VECTOR.magnitude * magnitudeJitter};
        const qrs = {...NORMAL_QRS_VECTOR, magnitude: NORMAL_QRS_VECTOR.magnitude * magnitudeJitter};
        const t = {...NORMAL_T_VECTOR, magnitude: NORMAL_T_VECTOR.magnitude * magnitudeJitter};

        const beat = create12LeadBeat(time, p, qrs, t);
        for(const lead in beat) {
            if(!data[lead]) data[lead] = [];
            data[lead].push(...beat[lead]);
        }
        time += interval;
    }
    return data;
}

export const arrhythmias: Arrhythmia[] = [
  // --- SUPRAVENTRICULARES ---
  {
    id: 'nsr',
    name: 'Ritmo Sinusal Normal',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ritmo cardíaco normal, frecuencia 60–100/min, onda P precede cada QRS, regular.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '60 a 100 L/m', pWave: 'Presente, precede cada QRS', prInterval: '0,12 a 0,20 Seg', qrs: 'Normal (< 0,12 Seg)', axis: 'Normal (0° a +90°)'},
    quiz: [
        { question: '¿Cuál es el rango de frecuencia cardíaca para un Ritmo Sinusal Normal?', options: ['< 60 lpm', '60 a 100 lpm', '> 100 lpm', 'Variable'], correctAnswer: 1, explanation: 'El Ritmo Sinusal Normal se define por una frecuencia cardíaca entre 60 y 100 latidos por minuto.'},
        { question: 'En un Ritmo Sinusal Normal, la relación entre la onda P y el complejo QRS es:', options: ['Una onda P por cada QRS', 'Ausencia de ondas P', 'Más ondas P que QRS', 'Ondas P después del QRS'], correctAnswer: 0, explanation: 'La característica clave del ritmo sinusal es que cada impulso se origina en el nodo sinusal y se conduce a los ventrículos, resultando en una onda P seguida de un complejo QRS.'},
        { question: '¿Cuál es la duración normal del intervalo PR?', options: ['< 0,12 s', '0,12 a 0,20 s', '0,20 a 0,24 s', '> 0,24 s'], correctAnswer: 1, explanation: 'Un intervalo PR normal, que representa el tiempo de conducción desde las aurículas a los ventrículos, dura entre 0,12 y 0,20 segundos (3 a 5 cuadros pequeños).'},
    ],
    generateECGData: (duration) => generateSinusRhythm(duration, 75),
  },
  {
    id: 'sinus_brady',
    name: 'Bradicardia Sinusal',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Frecuencia inferior a 60/min, ritmo regular, ondas P normales.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '< 60 L/m', pWave: 'Normal', prInterval: '0,12-0,20s', qrs: '< 0,12s', axis: 'Normal'},
    quiz: [
        { question: 'La Bradicardia Sinusal se define por una frecuencia cardíaca:', options: ['Entre 60-80 lpm', 'Menor a 60 lpm', 'Mayor a 100 lpm', 'Irregular'], correctAnswer: 1, explanation: 'El prefijo "bradi-" significa lento. La Bradicardia Sinusal es un ritmo sinusal con una frecuencia inferior a 60 latidos por minuto.'},
        { question: '¿Cuál de las siguientes es una causa fisiológica común de bradicardia sinusal?', options: ['Fiebre', 'Ansiedad', 'Atletas bien entrenados', 'Hipovolemia'], correctAnswer: 2, explanation: 'Los atletas a menudo tienen un tono vagal aumentado en reposo, lo que ralentiza el nodo sinusal, siendo un hallazgo normal y eficiente para ellos.'},
        { question: '¿Cuándo se debe tratar la bradicardia sinusal?', options: ['Siempre que se detecta', 'Solo si la frecuencia es < 40 lpm', 'Solo si el paciente presenta síntomas', 'Si el QRS es ancho'], correctAnswer: 2, explanation: 'La bradicardia sinusal solo requiere tratamiento (p. ej., con atropina) si el paciente está sintomático (mareos, síncope, hipotensión). De lo contrario, puede ser benigna.'},
    ],
    generateECGData: (duration) => generateSinusRhythm(duration, 48),
  },
  {
    id: 'sinus_tachy',
    name: 'Taquicardia Sinusal',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Frecuencia mayor a 100/min, ritmo regular, ondas P normales.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '> 100 L/m', pWave: 'Normal', prInterval: '0,12-0,20s', qrs: '< 0,12s', axis: 'Normal'},
    quiz: [
        { question: 'La Taquicardia Sinusal se define por una frecuencia cardíaca:', options: ['Mayor a 100 lpm', 'Entre 80-100 lpm', 'Menor a 60 lpm', 'Irregular'], correctAnswer: 0, explanation: 'El prefijo "taqui-" significa rápido. La Taquicardia Sinusal es un ritmo sinusal con una frecuencia superior a 100 latidos por minuto.'},
        { question: '¿Cuál de las siguientes es una causa común de taquicardia sinusal?', options: ['Hipotermia', 'Hipotiroidismo', 'Ejercicio o fiebre', 'Uso de beta-bloqueantes'], correctAnswer: 2, explanation: 'El ejercicio, la fiebre, el dolor, la ansiedad y la hipovolemia son causas comunes que aumentan la descarga del nodo sinusal.'},
        { question: 'El tratamiento primario para la taquicardia sinusal es:', options: ['Administrar adenosina', 'Realizar cardioversión', 'Tratar la causa subyacente', 'Administrar amiodarona'], correctAnswer: 2, explanation: 'La taquicardia sinusal es una respuesta fisiológica a un estrés. El tratamiento debe enfocarse en resolver la causa de base (p. ej., administrar fluidos para la deshidratación, analgésicos para el dolor).'},
    ],
    generateECGData: (duration) => generateSinusRhythm(duration, 120),
  },
  {
    id: 'pac',
    name: 'Extrasístole Auricular (CAP)',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Latido prematuro originado en un foco ectópico de las aurículas. La onda P es prematura y tiene una morfología diferente a la sinusal, seguida generalmente de un QRS estrecho.',
    criteria: { rhythm: 'Irregular por latido prematuro', rhythmAnalysis: 'Irregular', rate: 'Depende del ritmo de base', pWave: 'Prematura, forma anormal', prInterval: 'Variable', qrs: 'Normal (< 0,12s)'},
    clinicalSignificance: 'Generalmente benignas en corazones sanos, pero pueden ser precursoras de taquiarritmias como FA o aleteo si son frecuentes.',
    nursingConsiderations: 'Monitorizar frecuencia y síntomas (palpitaciones). Evaluar factores desencadenantes como cafeína, estrés o alcohol. Registrar en la historia clínica.',
    emergencyProtocol: 'No requiere tratamiento de emergencia a menos que cause inestabilidad hemodinámica o desencadene una taquicardia sostenida.',
    quiz: [
        { question: '¿Cuál es la característica clave de una CAP en el ECG?', options: ['QRS ancho', 'Onda P prematura y anormal', 'Ausencia de onda P', 'Intervalo PR corto'], correctAnswer: 1, explanation: 'La CAP se define por una onda P que aparece antes de lo esperado y tiene una forma diferente a la del ritmo sinusal.'},
        { question: 'El complejo QRS que sigue a una CAP es típicamente:', options: ['Ancho y bizarro', 'Estrecho y normal', 'Ausente', 'Variable'], correctAnswer: 1, explanation: 'Como el impulso se conduce normalmente a través de los ventrículos, el QRS suele ser estrecho.'},
        { question: 'La pausa que sigue a una CAP suele ser:', options: ['Compensatoria completa', 'No compensatoria', 'Variable', 'Ausente'], correctAnswer: 1, explanation: 'La despolarización auricular prematura generalmente resetea el nódulo sinusal, haciendo que el siguiente latido sinusal ocurra antes de lo esperado, resultando en una pausa no compensatoria.'},
    ],
    generateECGData: (duration) => {
        const bpm = 70;
        const normalInterval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        let beatCount = 0;
        const pacPVector: Vector = { ...NORMAL_P_VECTOR, angle: 20, magnitude: 0.1 };
        while(time < duration) {
            beatCount++;
            if (beatCount % 6 === 0) { // Insert PAC as 6th beat
                const pacTime = time - normalInterval * 0.3; // Premature
                const pacBeat = create12LeadBeat(pacTime, pacPVector, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
                 for(const lead in pacBeat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...pacBeat[lead]);
                }
                time += normalInterval * 1.7; // non-compensatory pause
            } else {
                 const beat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
                 for(const lead in beat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...beat[lead]);
                }
                time += normalInterval;
            }
        }
        return data;
    },
  },
  {
    id: 'afib_moderate',
    name: 'Fibrilación Auricular Moderada',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ritmo totalmente irregular, sin ondas P claras, QRS de intervalo variable, actividad auricular caótica.',
    criteria: { rhythm: 'Irregularmente irregular', rhythmAnalysis: 'Irregularmente irregular', rate: 'Variable (ej. 60-100 L/m)', pWave: 'Ausente (ondas fibrilatorias)', prInterval: 'No medible', qrs: '< 0,12s', axis: 'Variable'},
    quiz: [
        { question: '¿Cuál es la característica que define el ritmo en la Fibrilación Auricular?', options: ['Regular', 'Regularmente irregular', 'Irregularmente irregular', 'Lento'], correctAnswer: 2, explanation: 'La FA se caracteriza por un ritmo ventricular caótico y completamente impredecible, conocido como "irregularmente irregular".'},
        { question: 'En un ECG con Fibrilación Auricular, ¿qué reemplaza a las ondas P normales?', options: ['Ondas en diente de sierra', 'Ondas U', 'Línea isoeléctrica plana', 'Ondas fibrilatorias (ondas f)'], correctAnswer: 3, explanation: 'En la FA, la actividad auricular es caótica, lo que genera una línea de base ondulada y desorganizada conocida como ondas fibrilatorias o "ondas f".'},
        { question: '¿Cuál es la complicación clínica más grave asociada a la Fibrilación Auricular?', options: ['Síncope', 'Accidente cerebrovascular (ACV)', 'Infarto de miocardio', 'Insuficiencia respiratoria'], correctAnswer: 1, explanation: 'La falta de contracción auricular efectiva puede causar estasis de sangre y formación de coágulos en la aurícula, aumentando significativamente el riesgo de un ACV embólico.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        let time = 0;
        while(time < duration) {
            const interval = 0.4 + Math.random() * 0.5; // R-R irregular
            const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
            for(const lead in beat) {
                data[lead].push(...beat[lead]);
                // Add fibrillation waves
                for (let t = time; t < time + interval; t += 0.03) {
                     if (!data[lead].some(p => Math.abs(p.time - t) < 0.01)) {
                        data[lead].push({time: t, value: (Math.random() - 0.5) * 0.1});
                    }
                }
            }
            time += interval;
        }
        for(const lead in data) data[lead].sort((a,b) => a.time - b.time);
        return data;
    }
  },
      { id: 'afib_low', name: 'Fibrilación Auricular Baja', category: ArrhythmiaCategory.SUPRAVENTRICULARES, description: 'Fibrilación auricular con respuesta ventricular lenta (40-60 lpm), ondas f finas y menos visibles.', criteria: { rhythm: 'Irregularmente irregular', rhythmAnalysis: 'Irregularmente irregular', rate: '40 a 60 L/m', pWave: 'Ausente (ondas f finas)', prInterval: 'No medible', qrs: '< 0,12s', axis: 'Variable' }, quiz: [ { question: '¿Cuál es el rango de frecuencia para Fibrilación Auricular Baja?', options: ['20-40 lpm', '40-60 lpm', '60-100 lpm', '>100 lpm'], correctAnswer: 1, explanation: 'La Fibrilación Auricular Baja presenta una respuesta ventricular lenta entre 40 y 60 latidos por minuto.' }, { question: '¿Cómo se caracterizan las ondas f en FA Baja?', options: ['Prominentes y caóticas', 'Finas y menos visibles', 'Ausentes completamente', 'Regulares y organizadas'], correctAnswer: 1, explanation: 'Las ondas fibrilatorias en FA Baja son finas y menos visibles, indicando menor actividad auricular desorganizada.' }, { question: '¿Cuál es la complicación principal de FA Baja?', options: ['Taquicardia extrema', 'Insuficiencia cardíaca por gasto bajo', 'Fibrilación ventricular', 'Bloqueo AV completo'], correctAnswer: 1, explanation: 'La respuesta ventricular lenta puede resultar en gasto cardíaco inadecuado, causando síntomas de bajo gasto cardíaco.' } ], generateECGData: (duration) => { let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []])); let time = 0; while(time < duration) { const interval = 0.6 + Math.random() * 0.4; // 0.6-1.0 sec → 60-100 lpm const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR); for(const lead in beat) { data[lead].push(...beat[lead]); for (let t = time; t < time + interval; t += 0.03) { if (!data[lead].some(p => Math.abs(p.time - t) < 0.01)) { data[lead].push({time: t, value: (Math.random() - 0.5) * 0.05}); } } } time += interval; } for(const lead in data) data[lead].sort((a,b) => a.time - b.time); return data; } },
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             { id: 'afib_high', name: 'Fibrilación Auricular Alta', category: ArrhythmiaCategory.SUPRAVENTRICULARES, description: 'Fibrilación auricular con respuesta ventricular rápida (120-160 lpm), ondas f prominentes y caóticas.', criteria: { rhythm: 'Irregularmente irregular', rhythmAnalysis: 'Irregularmente irregular', rate: '120 a 160 L/m', pWave: 'Ausente (ondas f prominentes)', prInterval: 'No medible', qrs: '< 0,12s', axis: 'Variable' }, quiz: [ { question: '¿Cuál es el rango de frecuencia para Fibrilación Auricular Alta?', options: ['60-100 lpm', '100-120 lpm', '120-160 lpm', '>160 lpm'], correctAnswer: 2, explanation: 'La Fibrilación Auricular Alta presenta una respuesta ventricular rápida entre 120 y 160 latidos por minuto.' }, { question: '¿Cómo son las ondas f en FA Alta?', options: ['Finas y sutiles', 'Medianas', 'Prominentes y muy visibles', 'Ausentes'], correctAnswer: 2, explanation: 'Las ondas fibrilatorias en FA Alta son prominentes y fácilmente visibles, indicando actividad auricular muy desorganizada.' }, { question: '¿Cuál es el principal riesgo de FA Alta?', options: ['Bradicardia severa', 'Inestabilidad hemoddinámica y angina', 'Bloqueo AV', 'Ritmo idioventricular'], correctAnswer: 1, explanation: 'La respuesta ventricular muy rápida puede causar inestabilidad hemoddinámica, sincope, y en pacientes con cardiopatía, angina o infarto.' } ], generateECGData: (duration) => { let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []])); let time = 0; while(time < duration) { const interval = 0.25 + Math.random() * 0.25; // 0.25-0.5 sec → 120-240 lpm const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR); for(const lead in beat) { data[lead].push(...beat[lead]); for (let t = time; t < time + interval; t += 0.03) { if (!data[lead].some(p => Math.abs(p.time - t) < 0.01)) { data[lead].push({time: t, value: (Math.random() - 0.5) * 0.15}); } } } time += interval; } for(const lead in data) data[lead].sort((a,b) => a.time - b.time); return data; } },
   {
    id: 'aflutter',
    name: 'Aleteo Auricular',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ondas auriculares "en dientes de sierra" (ondas F), ritmo regular o irregular según conducción AV. Frecuencia auricular ~300/min.',
    criteria: { rhythm: 'Regular (con bloqueo fijo)', rhythmAnalysis: 'Regular', rate: 'Ventricular ~150 L/m (2:1)', pWave: 'Ondas F "en sierra"', prInterval: 'No medible', qrs: '< 0,12s', axis: 'Variable'},
    quiz: [
        { question: '¿Cuál es la morfología clásica de la actividad auricular en el Aleteo Auricular?', options: ['Ondas P normales', 'Ondas fibrilatorias', 'Línea plana', 'Ondas en "dientes de sierra"'], correctAnswer: 3, explanation: 'El Aleteo Auricular se caracteriza por las ondas F, que tienen un patrón regular y repetitivo que se asemeja a los dientes de una sierra.'},
        { question: 'La frecuencia auricular típica en un Aleteo Auricular es de aproximadamente:', options: ['60-100 lpm', '100-150 lpm', '150-250 lpm', '250-350 lpm'], correctAnswer: 3, explanation: 'El circuito de reentrada auricular en el aleteo es muy rápido y organizado, generando impulsos a una frecuencia de alrededor de 300 lpm.'},
        { question: 'Si la frecuencia auricular es de 300 lpm y hay un bloqueo AV 2:1, ¿cuál será la frecuencia ventricular?', options: ['300 lpm', '150 lpm', '100 lpm', '75 lpm'], correctAnswer: 1, explanation: 'Con un bloqueo 2:1, el nodo AV solo permite que uno de cada dos impulsos auriculares pase a los ventrículos. Por lo tanto, la frecuencia ventricular será la mitad de la auricular (300 / 2 = 150 lpm).'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        const atrialRate = 300;
        const block = 2;
        const atrialInterval = 60 / atrialRate;
        const ventricularInterval = atrialInterval * block;
        const flutterVector: Vector = { magnitude: 0.3, angle: 90, duration: atrialInterval, points: [[0,0],[0.5,-1],[1,0]]};

        for(let time = 0; time < duration; time += atrialInterval) {
            Object.keys(LEAD_ANGLES).forEach(lead => {
                 const leadAngle = LEAD_ANGLES[lead];
                 const projection = Math.cos((flutterVector.angle - leadAngle) * Math.PI / 180);
                 const flutterWaveMagnitude = (lead === 'DII' || lead === 'DIII' || lead === 'aVF') ? -0.3 : 0.1;
                 data[lead].push(...generateComponent(time, atrialInterval, [[0,0],[0.5, flutterWaveMagnitude * projection],[1,0]]));
            });
        }
        for(let time = atrialInterval * (block - 1); time < duration; time += ventricularInterval) {
            const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
             for(const lead in beat) {
                data[lead].push(...beat[lead]);
            }
        }
        for(const lead in data) data[lead].sort((a,b) => a.time - b.time);
        return data;
    }
  },
  {
    id: 'mat',
    name: 'Taquicardia Auricular Multifocal',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ritmo auricular rápido e irregular caracterizado por al menos 3 morfologías de ondas P distintas, intervalos PR variables y una frecuencia cardíaca superior a 100 lpm.',
    criteria: { rhythm: 'Irregularmente irregular', rhythmAnalysis: 'Irregular', rate: '> 100 L/m', pWave: 'Al menos 3 formas distintas', prInterval: 'Variable', qrs: 'Normal (< 0,12s)'},
    clinicalSignificance: 'Frecuentemente asociada a enfermedades pulmonares graves (EPOC, embolia pulmonar) o desequilibrios electrolíticos. Puede ser un precursor de la fibrilación auricular.',
    nursingConsiderations: 'Evaluar el estado respiratorio del paciente y los electrolitos. La monitorización continua es crucial. Tratar la causa subyacente es la prioridad.',
    emergencyProtocol: 'El tratamiento se centra en la condición subyacente. Si hay inestabilidad, se pueden usar bloqueadores de los canales de calcio o beta-bloqueantes con precaución.',
    quiz: [
        { question: '¿Cuál es el número mínimo de morfologías de onda P distintas para diagnosticar MAT?', options: ['Dos', 'Tres', 'Cuatro', 'Cinco'], correctAnswer: 1, explanation: 'El diagnóstico de MAT requiere al menos tres morfologías de onda P diferentes en el mismo trazado ECG.'},
        { question: 'La MAT se asocia comúnmente con:', options: ['Enfermedad coronaria', 'Enfermedad pulmonar severa', 'Hipertensión', 'Atletas entrenados'], correctAnswer: 1, explanation: 'La hipoxia y el aumento del tono simpático en enfermedades como la EPOC son causas comunes de MAT.'},
        { question: 'El ritmo en la MAT es:', options: ['Regular', 'Regularmente irregular', 'Irregularmente irregular', 'Variable'], correctAnswer: 2, explanation: 'Debido a los múltiples focos auriculares que compiten por el control, el ritmo es caótico e irregular.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        const pVectors: Vector[] = [
            {...NORMAL_P_VECTOR, angle: 60},
            {...NORMAL_P_VECTOR, angle: 20, magnitude: 0.12},
            {...NORMAL_P_VECTOR, angle: 80, magnitude: 0.18},
        ];
        while(time < duration) {
            const interval = 60 / (110 + Math.random() * 20); // Rate > 100, irregular
            const p = pVectors[Math.floor(Math.random() * pVectors.length)];
            const beat = create12LeadBeat(time, p, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
            time += interval;
        }
        return data;
    },
  },
  {
    id: 'psvt',
    name: 'Taquicardia Paroxística Supraventricular (TPSV)',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Término general para taquicardias rápidas y regulares que se originan por encima de los ventrículos. Típicamente presenta un complejo QRS estrecho y una frecuencia de 150 a 250 lpm, con inicio y fin súbitos.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '150 a 250 L/m', pWave: 'A menudo no visible (oculta)', prInterval: 'No medible', qrs: 'Normal (< 0,12s)'},
    clinicalSignificance: 'Puede causar síntomas como palpitaciones, mareos, disnea o síncope. Aunque rara vez es mortal en corazones sanos, puede provocar isquemia en pacientes con enfermedad coronaria.',
    nursingConsiderations: 'Evaluar la estabilidad hemodinámica del paciente. Intentar maniobras vagales (Valsalva, masaje carotídeo si está indicado). Preparar adenosina IV.',
    emergencyProtocol: 'Maniobras vagales. Si no son efectivas y el paciente está estable, administrar Adenosina IV (bolo rápido). Si está inestable, realizar cardioversión eléctrica sincronizada.',
    quiz: [
        { question: '¿Cuál es la frecuencia cardíaca típica durante una TPSV?', options: ['60-100 lpm', '100-140 lpm', '150-250 lpm', 'Más de 250 lpm'], correctAnswer: 2, explanation: 'La TPSV se caracteriza por una frecuencia ventricular muy rápida pero regular.'},
        { question: 'El complejo QRS en una TPSV es generalmente:', options: ['Ancho', 'Estrecho', 'Ausente', 'Polimórfico'], correctAnswer: 1, explanation: 'Como el origen es supraventricular, la conducción a través de los ventrículos es normal, resultando en un QRS estrecho.'},
        { question: '¿Cuál es el tratamiento farmacológico de primera línea para una TPSV estable?', options: ['Amiodarona', 'Lidocaína', 'Adenosina', 'Digoxina'], correctAnswer: 2, explanation: 'La adenosina bloquea transitoriamente el nodo AV, lo que interrumpe la mayoría de los circuitos de reentrada de la TPSV.'},
    ],
    generateECGData: (duration) => {
        const bpm = 190;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
  {
    id: 'avnrt',
    name: 'Taquicardia por Reentrada Nodal AV (TRNAV)',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Es el tipo más común de TPSV. Se debe a un circuito de reentrada dentro del nodo AV. Se caracteriza por una taquicardia regular de QRS estrecho, con ondas P retrógradas que a menudo se ocultan en el QRS o aparecen justo después como una pseudo-S o pseudo-R\'.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '150 a 250 L/m', pWave: 'Retrógrada, oculta o pseudo-onda', prInterval: 'No aplicable', qrs: 'Normal (< 0,12s)'},
    clinicalSignificance: 'Similar a otras TPSV, generalmente sintomática pero bien tolerada en pacientes sin cardiopatía estructural. La recurrencia es común.',
    nursingConsiderations: 'La evaluación y el manejo inicial son idénticos a los de la TPSV. La documentación del inicio y fin, y la respuesta a las maniobras es clave para el diagnóstico.',
    emergencyProtocol: 'Idéntico al de la TPSV: maniobras vagales, seguidas de adenosina para pacientes estables y cardioversión para inestables.',
    quiz: [
        { question: '¿Dónde se localiza el circuito de reentrada en la TRNAV?', options: ['En las aurículas', 'En los ventrículos', 'Dentro del nodo AV', 'En una vía accesoria'], correctAnswer: 2, explanation: 'La TRNAV se debe a la existencia de una vía lenta y una vía rápida dentro del propio nodo auriculoventricular.'},
        { question: 'Una onda P retrógrada que crea una "pseudo-R\'" en V1 es un signo clásico de:', options: ['Fibrilación auricular', 'TRNAV', 'Taquicardia ventricular', 'Bloqueo de rama'], correctAnswer: 1, explanation: 'La onda P retrógrada puede deformar el final del QRS, creando una pequeña onda positiva adicional en V1.'},
        { question: '¿Es la TRNAV una causa común de palpitaciones en personas jóvenes y sanas?', options: ['Sí', 'No', 'Solo en ancianos', 'Solo en deportistas'], correctAnswer: 0, explanation: 'Es la arritmia paroxística regular más frecuente y a menudo se presenta en personas sin otra enfermedad cardíaca.'},
    ],
    generateECGData: (duration) => {
        const bpm = 170;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        // Simulate pseudo S-wave by slightly altering T-wave start
        // FIX: Add explicit type `Vector` to fix TypeScript inference issue with the `points` array.
        const avnrt_T_VECTOR: Vector = {...NORMAL_T_VECTOR, points: [[-0.1, -0.2], [0,0], [0.5, 1], [1,0]]};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, avnrt_T_VECTOR);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
  {
    id: 'junctional_escape',
    name: 'Ritmo de Escape de la Unión',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ritmo de escape que se origina en la unión AV cuando el nódulo sinusal falla. Frecuencia lenta, QRS estrecho, y ondas P ausentes o retrógradas.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '40 a 60 L/m', pWave: 'Ausente o invertida/retrógrada', prInterval: 'No aplicable', qrs: '< 0,12s', axis: 'Normal'},
    quiz: [
        { question: '¿Cuál es la frecuencia cardíaca característica de un Ritmo de Escape de la Unión?', options: ['< 40 lpm', '40 a 60 lpm', '60 a 100 lpm', '> 100 lpm'], correctAnswer: 1, explanation: 'El marcapasos intrínseco de la unión AV tiene una frecuencia de 40 a 60 latidos por minuto.'},
        { question: 'En un ritmo de la unión, ¿dónde se espera encontrar la onda P si es visible?', options: ['Siempre antes del QRS', 'Después del QRS (retrógrada)', 'Ausente o invertida', 'Normal y positiva'], correctAnswer: 2, explanation: 'Como el impulso se origina en la unión AV, las aurículas se despolarizan de forma retrógrada, lo que puede resultar en una onda P invertida antes del QRS, oculta dentro de él, o visible justo después.'},
        { question: 'Un ritmo de escape de la unión es un mecanismo:', options: ['De reentrada', 'Patológico y anormal', 'De protección (seguridad)', 'Inducido por fármacos'], correctAnswer: 2, explanation: 'Los ritmos de escape son mecanismos de seguridad que se activan cuando los marcapasos superiores (como el nodo sinusal) fallan, evitando así la asistolia.'},
    ],
    generateECGData: (duration) => {
        const bpm = 52;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
  {
    id: 'avb_1st_degree',
    name: 'Bloqueo AV de 1er Grado',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Prolongación fija del intervalo PR > 0,20 segundos.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Variable', pWave: 'Normal', prInterval: '> 0,20s (fijo)', qrs: '< 0,12s', axis: 'Normal'},
    quiz: [
        { question: '¿Cuál es el hallazgo ECG definitorio del Bloqueo AV de 1er Grado?', options: ['QRS ancho', 'Ausencia de ondas P', 'Intervalo PR > 0,20 segundos', 'Ritmo irregular'], correctAnswer: 2, explanation: 'El Bloqueo AV de 1er Grado se define únicamente por un retraso en la conducción AV, lo que se traduce en un intervalo PR prolongado y constante (>0.20s).'},
        { question: 'En este tipo de bloqueo, ¿cada onda P es seguida por un complejo QRS?', options: ['Sí, siempre', 'No, algunas se bloquean', 'Solo la mitad', 'Depende de la frecuencia'], correctAnswer: 0, explanation: 'A diferencia de los bloqueos de segundo o tercer grado, en el de primer grado todos los impulsos auriculares se conducen a los ventrículos, solo que lo hacen más lentamente.'},
        { question: 'Clínicamente, el Bloqueo AV de 1er Grado aislado es generalmente considerado:', options: ['Una emergencia médica', 'Precursor de infarto', 'Benigno y asintomático', 'Una indicación para marcapasos'], correctAnswer: 2, explanation: 'Por sí solo, el Bloqueo AV de 1er Grado no suele tener repercusión hemodinámica y es a menudo un hallazgo incidental sin necesidad de tratamiento.'},
    ],
    generateECGData: (duration) => {
        const bpm = 70;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR, 0.28);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
    {
    id: 'avb_2nd_degree_mobitz_I',
    name: 'Bloqueo AV 2º Grado Mobitz I (Wenckebach)',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Bloqueo AV caracterizado por una prolongación progresiva del intervalo PR en latidos consecutivos, hasta que una onda P finalmente no es conducida y el ciclo se reinicia. Causa un ritmo "regularmente irregular".',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Agrupamiento de latidos', rate: 'Bradicárdica', pWave: 'Normal, algunas no conducen', prInterval: 'Se alarga progresivamente', qrs: 'Normal (< 0,12s)'},
    clinicalSignificance: 'Generalmente es un bloqueo benigno y transitorio localizado en el nodo AV. Rara vez progresa a bloqueo completo y a menudo es asintomático.',
    nursingConsiderations: 'Monitorizar al paciente, especialmente si es nuevo o si está tomando medicamentos que afectan el nodo AV (beta-bloqueantes, digoxina). Observar si hay progresión del bloqueo.',
    emergencyProtocol: 'No suele requerir tratamiento de emergencia. Si causa bradicardia sintomática, se debe considerar atropina y la suspensión de los fármacos causantes.',
    quiz: [
        { question: '¿Qué le sucede al intervalo PR en un bloqueo de Wenckebach?', options: ['Es constante', 'Se acorta progresivamente', 'Se alarga progresivamente', 'Es variable sin patrón'], correctAnswer: 2, explanation: 'La característica distintiva es el alargamiento progresivo del PR hasta que una P se bloquea.'},
        { question: '¿El ritmo en Mobitz I se describe mejor como?', options: ['Regular', 'Irregularmente irregular', 'Regularmente irregular', 'Caótico'], correctAnswer: 2, explanation: 'La pausa del latido caído crea un patrón de agrupamiento de latidos que es predeciblemente irregular.'},
        { question: '¿Dónde suele localizarse el bloqueo en un Mobitz I?', options: ['En el nodo sinusal', 'En el nodo AV', 'En el haz de His', 'En las ramas del haz'], correctAnswer: 1, explanation: 'El Wenckebach es típicamente un problema de conducción a nivel del nodo AV, por lo que suele ser más benigno que el Mobitz II.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        let beatInCycle = 0;
        const cycleLength = 4; // 4:3 block
        const baseInterval = 60 / 60;
        const prIntervals = [0.20, 0.28, 0.36];
        while(time < duration) {
            const isDroppedBeat = (beatInCycle + 1) % cycleLength === 0;
            const beat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR, prIntervals[beatInCycle]);
            
            // Add P wave for all beats
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...(beat[lead].filter(p => p.time < time + NORMAL_P_VECTOR.duration)));
            }

            if(!isDroppedBeat) {
                 for(const lead in beat) {
                     data[lead].push(...beat[lead].filter(p => p.time >= time + NORMAL_P_VECTOR.duration));
                 }
            }
            time += baseInterval;
            beatInCycle = (beatInCycle + 1) % cycleLength;
        }
        for(const lead in data) data[lead].sort((a,b) => a.time - b.time);
        return data;
    }
  },
    {
    id: 'avb_2nd_degree_mobitz_II',
    name: 'Bloqueo AV 2º Grado Mobitz II',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ondas P bloqueadas súbitamente sin prolongación previa del PR. PR constante en los latidos conducidos. Puede ser peligroso.',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Regularmente irregular', rate: 'Bradicárdica', pWave: 'Normal, algunas no conducen', prInterval: 'Constante en latidos conducidos', qrs: 'Puede ser ancho', axis: 'Variable'},
    quiz: [
        { question: 'A diferencia del Mobitz I, el intervalo PR en los latidos conducidos de un Mobitz II es:', options: ['Progresivamente más largo', 'Progresivamente más corto', 'Constante', 'Variable'], correctAnswer: 2, explanation: 'La característica clave del Mobitz II es que el intervalo PR permanece constante antes y después de la onda P bloqueada.'},
        { question: 'El bloqueo en Mobitz II suele localizarse en el sistema de His-Purkinje. Esto hace que el QRS sea a menudo:', options: ['Estrecho', 'Ausente', 'Ancho', 'Variable'], correctAnswer: 2, explanation: 'Un bloqueo infranodal (por debajo del nodo AV) a menudo se asocia con un trastorno de conducción intraventricular, resultando en un complejo QRS ancho.'},
        { question: '¿Cuál es el principal riesgo de un bloqueo Mobitz II?', options: ['Progresión a fibrilación auricular', 'Progresión a bloqueo AV completo (3er grado)', 'Causar hipertensión severa', 'No tiene riesgos significativos'], correctAnswer: 1, explanation: 'El Mobitz II es considerado un bloqueo inestable y peligroso debido a su alto riesgo de progresar súbitamente a un bloqueo AV de tercer grado, lo que puede causar un paro cardíaco.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        let time = 0;
        let beatCount = 0;
        const interval = 60 / 68;
        while(time < duration) {
            beatCount++;
            const pWaveBeat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR, 0.20);
            for(const lead in pWaveBeat) data[lead].push(...(pWaveBeat[lead].filter(p => p.time < time + NORMAL_P_VECTOR.duration)));

            if(beatCount % 3 !== 0) { // Drop every 3rd beat's QRS-T
                 const qrstBeat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR, 0.20);
                 for(const lead in qrstBeat) data[lead].push(...qrstBeat[lead].filter(p => p.time >= time + NORMAL_P_VECTOR.duration));
            }
            time += interval;
        }
        for(const lead in data) data[lead].sort((a,b) => a.time - b.time);
        return data;
    }
  },
    {
    id: 'avb_3rd_degree',
    name: 'Bloqueo AV 3er Grado (Completo)',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Disociación AV completa. Las aurículas y los ventrículos laten de forma independiente.',
    criteria: { rhythm: 'Regular P-P, Regular R-R', rhythmAnalysis: 'Regular', rate: 'Ventricular 20-40 L/m', pWave: 'No relacionadas con QRS', prInterval: 'Variable', qrs: 'Ancho (>0,12s)', axis: 'Variable'},
    quiz: [
        { question: '¿Qué significa "disociación AV" en el Bloqueo de 3er Grado?', options: ['Las aurículas laten más lento que los ventrículos', 'No hay actividad auricular', 'Las aurículas y los ventrículos laten de forma independiente', 'El QRS es estrecho'], correctAnswer: 2, explanation: 'En el bloqueo completo, ningún impulso auricular llega a los ventrículos. Las aurículas son controladas por el nodo sinusal y los ventrículos por un marcapasos de escape inferior, sin ninguna relación entre ellos.'},
        { question: 'En el bloqueo completo, la frecuencia auricular (ondas P) es generalmente ________ que la frecuencia ventricular (QRS).', options: ['Más rápida', 'Más lenta', 'Igual', 'El doble'], correctAnswer: 0, explanation: 'La frecuencia sinusal normal (60-100 lpm) es más rápida que la frecuencia de un ritmo de escape ventricular (20-40 lpm).'},
        { question: 'El tratamiento definitivo para un Bloqueo AV de 3er Grado sintomático es:', options: ['Administración de adenosina', 'Cardioversión eléctrica', 'Implantación de un marcapasos permanente', 'Ablación por catéter'], correctAnswer: 2, explanation: 'Debido a la bradicardia severa y el riesgo de asistolia, el tratamiento estándar y definitivo es la implantación de un marcapasos para asegurar una frecuencia cardíaca adecuada.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        const atrialInterval = 60 / 78;
        const ventricularInterval = 60 / 38;

        for(let time = 0; time < duration; time += atrialInterval) {
            const pWaveBeat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
            for(const lead in pWaveBeat) data[lead].push(...(pWaveBeat[lead].filter(p => p.time < time + NORMAL_P_VECTOR.duration)));
        }

        for(let time = 0.5; time < duration; time += ventricularInterval) {
            const beat = create12LeadBeat(time, null, VT_QRS_VECTOR, VT_T_VECTOR);
            for(const lead in beat) {
                // Remove any p-waves that fall within the QRS
                data[lead] = data[lead].filter(p => p.time < time || p.time > time + VT_QRS_VECTOR.duration);
                data[lead].push(...beat[lead]);
            }
        }
        for(const lead in data) data[lead].sort((a,b) => a.time - b.time);
        return data;
    }
  },
  {
    id: 'wpw',
    name: 'Síndrome de WPW',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Pre-excitación ventricular a través de una vía accesoria. Causa un intervalo PR corto y una onda delta al inicio del QRS.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Variable', pWave: 'Normal', prInterval: '< 0,12s', qrs: 'Ancho con onda Delta', axis: 'Variable según vía'},
    quiz: [
        { question: '¿Cuáles son los dos hallazgos ECG clásicos del síndrome de WPW?', options: ['PR largo y QRS estrecho', 'PR corto y onda Delta', 'Ausencia de onda P y ritmo irregular', 'Ondas T picudas y QRS ancho'], correctAnswer: 1, explanation: 'El WPW se caracteriza por un intervalo PR corto (<0.12s) y una onda Delta (un empastamiento inicial del complejo QRS) debido a la pre-excitación ventricular.'},
        { question: 'La causa subyacente del WPW es:', options: ['Un bloqueo en el nodo AV', 'Una vía de conducción accesoria', 'Un foco ectópico auricular', 'Isquemia miocárdica'], correctAnswer: 1, explanation: 'El WPW es causado por la presencia de una vía eléctrica anómala (vía accesoria o Haz de Kent) que conecta directamente las aurículas y los ventrículos, evitando el nodo AV.'},
        { question: '¿Cuál es el principal riesgo asociado al síndrome de WPW?', options: ['Bradicardia severa', 'Desarrollo de taquiarritmias rápidas', 'Bloqueo AV completo', 'Hipertensión pulmonar'], correctAnswer: 1, explanation: 'La vía accesoria puede facilitar circuitos de reentrada que conducen a taquicardias muy rápidas, como una fibrilación auricular pre-excitada, que puede ser potencialmente mortal.'},
    ],
    generateECGData: (duration) => {
        const bpm = 80;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        const wpwQRS: Vector = {...NORMAL_QRS_VECTOR, duration: 0.13, points: [[0,0], [0.2, 0.3], [0.3, -0.2], [0.6, 1.0], [0.8, -0.4], [1, 0]]}; // Added delta wave
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, NORMAL_P_VECTOR, wpwQRS, NORMAL_T_VECTOR, 0.10);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
  // --- VENTRICULARES ---
   {
    id: 'pvc',
    name: 'Contracción Ventricular Prematura',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Un latido ectópico originado en los ventrículos. Causa un QRS ancho y bizarro, sin onda P precedente, seguido por una pausa compensatoria.',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Irregular (latido prematuro)', rate: 'Depende del ritmo base', pWave: 'Ausente antes del PVC', prInterval: 'No aplicable al PVC', qrs: 'Ancho (>0,12s), bizarro', axis: 'Variable'},
    quiz: [
        { question: '¿Cuál es la característica principal del complejo QRS en una CVP?', options: ['Estrecho y normal', 'Ausente', 'Ancho y de morfología bizarra', 'Precedido por una onda P normal'], correctAnswer: 2, explanation: 'Debido a que el impulso se origina en un foco ventricular, se propaga lentamente por el miocardio, resultando en un complejo QRS ancho (>0.12s) y de forma anormal.'},
        { question: 'La pausa que típicamente sigue a una CVP se denomina:', options: ['Pausa no compensatoria', 'Pausa sinusal', 'Pausa compensatoria completa', 'Bloqueo de salida'], correctAnswer: 2, explanation: 'La CVP no suele interferir con el ritmo del nodo sinusal. El siguiente impulso sinusal llega cuando los ventrículos están refractarios, por lo que se bloquea, y el latido siguiente aparece en su momento esperado, creando una pausa completa.'},
        { question: '¿Cuál de las siguientes condiciones puede causar CVPs frecuentes?', options: ['Hipercalemia', 'Hipoxia', 'Alcalosis', 'Hipotermia'], correctAnswer: 1, explanation: 'La hipoxia, al igual que los desequilibrios electrolíticos (hipokalemia, hipomagnesemia) y la isquemia, aumenta la irritabilidad del miocardio ventricular y puede provocar CVPs.'},
    ],
    generateECGData: (duration) => {
        const bpm = 70;
        const normalInterval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        let beatCount = 0;
        while(time < duration) {
            beatCount++;
            if (beatCount % 5 === 0) { // Insert PVC as 5th beat
                const pvcTime = time - normalInterval * 0.4; // Premature
                const pvcBeat = create12LeadBeat(pvcTime, null, VT_QRS_VECTOR, VT_T_VECTOR);
                 for(const lead in pvcBeat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...pvcBeat[lead]);
                }
                time += normalInterval * 1.6; // Compensatory pause
            } else {
                 const beat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
                 for(const lead in beat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...beat[lead]);
                }
                time += normalInterval;
            }
        }
        return data;
    },
  },
   {
    id: 'bigeminy',
    name: 'Bigeminismo Ventricular',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Ritmo en el que cada latido sinusal normal es seguido por una Contracción Ventricular Prematura (CVP), creando un patrón repetitivo de "normal-ectópico".',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Patrón 1:1', rate: 'Depende del ritmo base', pWave: 'Presente en latidos sinusales', prInterval: 'Normal en latidos sinusales', qrs: 'Normal y ancho (CVP) alternados'},
    clinicalSignificance: 'Puede ser benigno, pero si es frecuente o en el contexto de una cardiopatía estructural, puede aumentar el riesgo de arritmias sostenidas como la TV.',
    nursingConsiderations: 'Evaluar los electrolitos del paciente (potasio, magnesio) y la oxigenación. Notificar al médico si el patrón es nuevo o si el paciente presenta síntomas.',
    emergencyProtocol: 'Generalmente no es una emergencia. El tratamiento se enfoca en corregir la causa subyacente. Si causa inestabilidad hemodinámica (raro), se trata como una TV.',
    quiz: [
        { question: '¿Cómo se define el bigeminismo ventricular?', options: ['Una CVP cada dos latidos', 'Una CVP después de cada latido normal', 'Dos CVPs seguidas', 'Una CVP cada tres latidos'], correctAnswer: 1, explanation: 'El patrón es un latido normal seguido de una CVP, de forma repetida (1:1).'},
        { question: 'El QRS de la CVP en el bigeminismo es típicamente:', options: ['Estrecho', 'Ancho', 'Igual al sinusal', 'Ausente'], correctAnswer: 1, explanation: 'Al originarse en los ventrículos, la conducción es anormal y lenta, lo que resulta en un QRS ancho.'},
        { question: '¿Cuál es una causa reversible común de bigeminismo?', options: ['Infarto de miocardio antiguo', 'Hipopotasemia', 'Hipertensión arterial', 'Estenosis aórtica'], correctAnswer: 1, explanation: 'Los desequilibrios electrolíticos, especialmente de potasio y magnesio, son causas comunes y corregibles de ectopia ventricular.'},
    ],
    generateECGData: (duration) => {
        const bpm = 70;
        const normalInterval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        let isNormalBeat = true;
        while(time < duration) {
            if (isNormalBeat) {
                 const beat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
                 for(const lead in beat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...beat[lead]);
                }
                time += normalInterval;
            } else {
                const pvcTime = time - normalInterval * 0.2; // Slightly premature
                const pvcBeat = create12LeadBeat(pvcTime, null, VT_QRS_VECTOR, VT_T_VECTOR);
                 for(const lead in pvcBeat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...pvcBeat[lead]);
                }
                time += normalInterval * 0.8; // Maintain average rate
            }
            isNormalBeat = !isNormalBeat;
        }
        return data;
    },
  },
  {
    id: 'trigeminy',
    name: 'Trigeminismo Ventricular',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Ritmo en el que cada dos latidos sinusales normales son seguidos por una Contracción Ventricular Prematura (CVP), creando un patrón repetitivo de "normal-normal-ectópico".',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Patrón 2:1', rate: 'Depende del ritmo base', pWave: 'Presente en latidos sinusales', prInterval: 'Normal en latidos sinusales', qrs: 'Dos normales, uno ancho (CVP)'},
    clinicalSignificance: 'Similar al bigeminismo, su importancia clínica depende del contexto (presencia de cardiopatía, síntomas, frecuencia).',
    nursingConsiderations: 'La evaluación y el manejo son similares a los del bigeminismo. Es importante documentar la frecuencia del patrón y cualquier síntoma asociado.',
    emergencyProtocol: 'No es una emergencia por sí mismo. El tratamiento se dirige a la causa subyacente. La intervención urgente solo es necesaria si desencadena arritmias más peligrosas.',
    quiz: [
        { question: '¿Cuál es el patrón característico del trigeminismo ventricular?', options: ['Normal, CVP, Normal...', 'Normal, Normal, CVP...', 'Normal, CVP, CVP...', 'Tres CVPs seguidas'], correctAnswer: 1, explanation: 'El patrón del trigeminismo es dos latidos normales seguidos de una CVP, que se repite.'},
        { question: 'En comparación con el bigeminismo, una tira de trigeminismo tendrá:', options: ['Más CVPs', 'Menos CVPs', 'El mismo número de CVPs', 'Solo CVPs'], correctAnswer: 1, explanation: 'En trigeminismo, 1 de cada 3 latidos es una CVP, mientras que en bigeminismo es 1 de cada 2, por lo que hay menos CVPs en total.'},
        { question: 'La importancia clínica del trigeminismo depende principalmente de:', options: ['La edad del paciente', 'La hora del día', 'La presencia de cardiopatía estructural y síntomas', 'El género del paciente'], correctAnswer: 2, explanation: 'En un corazón sano, el trigeminismo suele ser benigno. Sin embargo, en un paciente con una enfermedad cardíaca subyacente (como un infarto previo), puede ser un marcador de mayor riesgo.'},
    ],
    generateECGData: (duration) => {
        const bpm = 75;
        const normalInterval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        let beatInCycle = 0;
        while(time < duration) {
            if (beatInCycle < 2) { // First two beats are normal
                 const beat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
                 for(const lead in beat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...beat[lead]);
                }
                time += normalInterval;
            } else { // Third beat is a PVC
                const pvcTime = time - normalInterval * 0.3; // Premature
                const pvcBeat = create12LeadBeat(pvcTime, null, VT_QRS_VECTOR, VT_T_VECTOR);
                 for(const lead in pvcBeat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...pvcBeat[lead]);
                }
                time += normalInterval * 1.7; // Compensatory pause
            }
            beatInCycle = (beatInCycle + 1) % 3;
        }
        return data;
    },
  },
  {
    id: 'vtach',
    name: 'Taquicardia Ventricular',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Ritmo rápido (>100/min) de origen ventricular, con QRS ancho y regular.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '100 a 270 L/m', pWave: 'No visible', prInterval: 'No medible', qrs: 'Ancho (> 0,12s)', axis: 'Extremo/Indeterminado'},
    quiz: [
        { question: '¿Cuáles son los tres criterios clave para identificar una Taquicardia Ventricular?', options: ['FC < 60, QRS estrecho, ritmo irregular', 'FC > 100, QRS ancho, ritmo regular', 'FC 60-100, QRS estrecho, ondas P visibles', 'FC > 150, QRS estrecho, ritmo regular'], correctAnswer: 1, explanation: 'La TV se define clásicamente por ser una taquicardia de complejo ancho y regular.'},
        { question: 'La Taquicardia Ventricular sostenida es una emergencia médica porque puede:', options: ['Causar hipertensión severa', 'Progresar a un bloqueo AV', 'Degenerar en Fibrilación Ventricular', 'Ser asintomática'], correctAnswer: 2, explanation: 'La TV puede causar inestabilidad hemodinámica grave y es un precursor común de la Fibrilación Ventricular, que es un ritmo de paro cardíaco.'},
        { question: '¿Cuál es el tratamiento de elección para un paciente con TV y sin pulso?', options: ['Administrar atropina', 'Realizar un masaje carotídeo', 'Desfibrilación inmediata', 'Administrar adenosina'], correctAnswer: 2, explanation: 'La TV sin pulso se trata como un paro cardíaco. La intervención clave, junto con la RCP de alta calidad, es la desfibrilación lo antes posible.'},
    ],
    generateECGData: (duration) => {
        const bpm = 180;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, null, VT_QRS_VECTOR, VT_T_VECTOR);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
  {
    id: 'torsades',
    name: 'Torsades de Pointes',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Taquicardia ventricular polimórfica caracterizada por complejos QRS que parecen girar alrededor de la línea isoeléctrica. Asociada a un intervalo QT prolongado.',
    criteria: { rhythm: 'Irregular', rhythmAnalysis: 'Irregular', rate: '150 a 250 L/m', pWave: 'No visible', prInterval: 'No medible', qrs: 'Ancho, polimórfico, "torsión"', axis: 'Variable'},
    quiz: [
        { question: 'La morfología característica de Torsades de Pointes es:', options: ['QRS ancho y monomórfico', 'QRS estrecho y regular', 'QRS que cambia de amplitud y eje (gira)', 'Ausencia de QRS'], correctAnswer: 2, explanation: 'El nombre "Torsades de Pointes" significa "torsión de las puntas", que describe cómo los picos de los complejos QRS parecen girar alrededor de la línea isoeléctrica.'},
        { question: 'Esta arritmia está comúnmente asociada con un hallazgo ECG subyacente, que es:', options: ['Intervalo PR corto', 'Intervalo QT prolongado', 'Onda U prominente', 'Bloqueo de rama'], correctAnswer: 1, explanation: 'La prolongación del intervalo QT, ya sea congénita o adquirida (por fármacos, electrolitos), es el principal factor de riesgo para desarrollar Torsades de Pointes.'},
        { question: '¿Cuál es el tratamiento farmacológico de primera línea para Torsades de Pointes?', options: ['Amiodarona', 'Lidocaína', 'Sulfato de Magnesio', 'Adenosina'], correctAnswer: 2, explanation: 'El sulfato de magnesio intravenoso es el tratamiento de elección, ya que estabiliza la membrana miocárdica y puede acortar el intervalo QT, terminando la arritmia.'},
    ],
    generateECGData: (duration) => {
        const avgBpm = 200;
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        while(time < duration) {
            const interval = 60 / (avgBpm + (Math.random() - 0.5) * 40);
            const amplitudeModulation = Math.sin(time * Math.PI * 0.5); // Twisting amplitude
            const modulatedQRS: Vector = {...VT_QRS_VECTOR, magnitude: 1.0 + 0.6 * amplitudeModulation};
            const modulatedT: Vector = {...VT_T_VECTOR, magnitude: 0.3 + 0.2 * amplitudeModulation};

            const beat = create12LeadBeat(time, null, modulatedQRS, modulatedT);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
            time += interval;
        }
        return data;
    },
  },
  {
    id: 'ivr',
    name: 'Ritmo Idioventricular',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Ritmo de escape ventricular muy lento (20-40 lpm) con QRS ancho. Ocurre cuando fallan los marcapasos superiores.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '20 a 40 L/m', pWave: 'Ausente o disociada', prInterval: 'No aplicable', qrs: 'Ancho (> 0,12s)', axis: 'Indeterminado'},
    quiz: [
        { question: '¿Cuál es la frecuencia intrínseca de un Ritmo Idioventricular?', options: ['60-100 lpm', '40-60 lpm', '20-40 lpm', '>100 lpm'], correctAnswer: 2, explanation: 'El marcapasos intrínseco de los ventrículos es el más lento del corazón, con una frecuencia de 20 a 40 latidos por minuto. Funciona como un mecanismo de seguridad.'},
        { question: 'Un Ritmo Idioventricular generalmente indica:', options: ['Un corazón sano y atlético', 'Una falla de los marcapasos superiores (sinusal y de la unión)', 'Una respuesta al estrés o la cafeína', 'Una arritmia de reentrada'], correctAnswer: 1, explanation: 'Este ritmo de escape solo aparece cuando el nodo sinusal y el nodo AV han fallado en generar un impulso, lo que lo convierte en un ritmo de último recurso.'},
        { question: 'El tratamiento para un paciente sintomático con Ritmo Idioventricular podría incluir:', options: ['Administrar un beta-bloqueante', 'Estimulación con marcapasos y atropina', 'Realizar cardioversión', 'Administrar lidocaína'], correctAnswer: 1, explanation: 'No se deben suprimir los ritmos de escape. El objetivo es acelerar la frecuencia cardíaca, lo que se puede lograr con atropina o, de manera más definitiva, con un marcapasos externo o interno.'},
    ],
    generateECGData: (duration) => {
        const bpm = 32;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, null, VT_QRS_VECTOR, VT_T_VECTOR);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
  {
    id: 'aivr',
    name: 'Ritmo Idioventricular Acelerado (RIVA)',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Ritmo ventricular regular con una frecuencia entre 40 y 120 lpm. Es más rápido que un ritmo de escape ventricular pero más lento que una taquicardia ventricular. A menudo se observa durante la reperfusión en un infarto de miocardio.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '40 a 120 L/m', pWave: 'Ausente o disociada', prInterval: 'No aplicable', qrs: 'Ancho (> 0,12s)'},
    clinicalSignificance: 'Generalmente es un ritmo benigno y autolimitado, considerado un marcador de reperfusión exitosa tras una angioplastia. No suele requerir tratamiento.',
    nursingConsiderations: 'Monitorizar al paciente y no confundirlo con una TV lenta. Evaluar el contexto clínico (post-IAM). El tratamiento antiarrítmico suele ser innecesario e incluso perjudicial.',
    emergencyProtocol: 'No se trata como una emergencia. Si causa hipotensión (raro), se puede intentar aumentar la frecuencia sinusal con atropina para "sobreestimular" el ritmo ventricular.',
    quiz: [
        { question: '¿Cuál es el rango de frecuencia cardíaca para el RIVA?', options: ['20-40 lpm', '40-120 lpm', '120-150 lpm', '>150 lpm'], correctAnswer: 1, explanation: 'La frecuencia del RIVA se sitúa entre la de un ritmo de escape ventricular y una taquicardia ventricular.'},
        { question: 'El complejo QRS en el RIVA es típicamente:', options: ['Estrecho', 'Ancho', 'Variable', 'Normal'], correctAnswer: 1, explanation: 'Al tener un origen ventricular, la despolarización es lenta y anormal, lo que genera un QRS ancho.'},
        { question: 'El RIVA es un marcador común de:', options: ['Isquemia severa', 'Reperfusión coronaria', 'Insuficiencia cardíaca', 'Hiperpotasemia'], correctAnswer: 1, explanation: 'La aparición de RIVA durante o después de una angioplastia a menudo indica que el flujo sanguíneo a la arteria bloqueada se ha restablecido.'},
    ],
    generateECGData: (duration) => {
        const bpm = 80; // Faster than IVR, slower than VT
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, null, VT_QRS_VECTOR, VT_T_VECTOR);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
    {
    id: 'vfib',
    name: 'Fibrilación Ventricular',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Actividad eléctrica ventricular caótica, sin QRS identificables. Paro cardíaco.',
    criteria: { rhythm: 'Caótico', rhythmAnalysis: 'Caótico', rate: '>300/min', pWave: 'Ausente', prInterval: 'No medible', qrs: 'Ausente (ondas fibrilatorias)', axis: 'Indeterminado'},
    quiz: [
        { question: '¿Cómo se describe la actividad eléctrica en la Fibrilación Ventricular?', options: ['Regular y rápida', 'Organizada pero lenta', 'Caótica y desorganizada', 'Ausente'], correctAnswer: 2, explanation: 'La FV es una actividad eléctrica ventricular completamente caótica, sin complejos QRS identificables, lo que impide cualquier contracción cardíaca efectiva.'},
        { question: 'Un paciente en Fibrilación Ventricular siempre estará:', options: ['Asintomático', 'Mareado pero consciente', 'En paro cardíaco (sin pulso)', 'Hipertenso'], correctAnswer: 2, explanation: 'La FV no produce gasto cardíaco. Es un ritmo de paro cardíaco que requiere intervención inmediata.'},
        { question: '¿Cuál es el tratamiento más importante y urgente para la Fibrilación Ventricular?', options: ['Administrar atropina', 'RCP de alta calidad y desfibrilación', 'Implantar un marcapasos', 'Administrar oxígeno'], correctAnswer: 1, explanation: 'La única forma de detener la FV es con una descarga eléctrica (desfibrilación). Cada minuto de retraso en la desfibrilación disminuye drásticamente la probabilidad de supervivencia.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        for(const lead in data) {
            let lastValue = 0;
            for (let time = 0; time < duration; time += 0.02) {
                let randomChange = (Math.random() - 0.5) * 0.9;
                let newValue = lastValue + randomChange;
                if (newValue > 1.2 || newValue < -1.2) {
                newValue = lastValue * -0.7;
                }
                data[lead].push({ time, value: newValue });
                lastValue = newValue;
            }
        }
        return data;
    },
  },
  {
    id: 'asystole',
    name: 'Asistolia',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Ausencia de actividad eléctrica. "Línea plana".',
    criteria: { rhythm: 'Ausente', rhythmAnalysis: 'Ausente', rate: '0 L/m', pWave: 'Ausente', prInterval: 'No aplicable', qrs: 'Ausente', axis: 'No aplicable'},
    quiz: [
        { question: '¿Qué se observa en el monitor durante la Asistolia?', options: ['Ondas rápidas y caóticas', 'Complejos QRS anchos', 'Una línea plana', 'Ondas en diente de sierra'], correctAnswer: 2, explanation: 'La Asistolia es la ausencia total de actividad eléctrica cardíaca, lo que se traduce en una línea plana en el monitor de ECG.'},
        { question: '¿La Asistolia es un ritmo "desfibrilable"?', options: ['Sí, es la prioridad', 'No, la desfibrilación no es efectiva', 'Solo si es de onda fina', 'Depende de la causa'], correctAnswer: 1, explanation: 'No se puede desfibrilar la ausencia de actividad eléctrica. El tratamiento para la asistolia se centra en la RCP de alta calidad y la administración de fármacos como la epinefrina para intentar restaurar la actividad eléctrica.'},
        { question: 'Antes de confirmar el diagnóstico de asistolia, ¿qué es crucial hacer?', options: ['Administrar un bolo de fluidos', 'Verificar en dos derivaciones y aumentar la ganancia', 'Iniciar una infusión de amiodarona', 'Preparar para la cardioversión'], correctAnswer: 1, explanation: 'Es fundamental confirmar que no se trata de una FV de onda muy fina o de un problema técnico (como un cable desconectado). Esto se hace verificando el ritmo en al menos dos derivaciones perpendiculares y aumentando la ganancia (tamaño) de la señal en el monitor.'},
    ],
     generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        for(const lead in data) {
             for(let time = 0; time < duration; time += 0.02){
                data[lead].push({time: time, value: (Math.random() - 0.5) * 0.02});
            }
        }
        return data;
    },
  },
  {
    id: 'v_paced',
    name: 'Ritmo de Marcapasos (VVI)',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Estimulación ventricular. Espiga de marcapasos seguida de un QRS ancho.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Programada (ej. 70 L/m)', pWave: 'Ausente o disociada', prInterval: 'No aplicable', qrs: 'Ancho, precedido por espiga', axis: 'Extremo (superior izquierdo)'},
    quiz: [
        { question: '¿Cuál es el signo característico de un ritmo marcapaseado en el ECG?', options: ['Una onda P invertida', 'Un QRS estrecho', 'Una espiga vertical antes del QRS', 'Un intervalo QT corto'], correctAnswer: 2, explanation: 'El artefacto eléctrico generado por el marcapasos aparece como una espiga fina y vertical justo antes del complejo que está estimulando (en este caso, el QRS ventricular).'},
        { question: 'El complejo QRS en un ritmo con marcapasos ventricular es ancho porque:', options: ['La frecuencia es muy rápida', 'La estimulación se origina en el ventrículo', 'Hay un bloqueo AV asociado', 'La espiga interfiere con la medición'], correctAnswer: 1, explanation: 'Al igual que una CVP, la estimulación se origina en un punto del ventrículo y se propaga lentamente por el miocardio, no por el sistema de conducción rápido, lo que resulta en un QRS ancho.'},
        { question: 'El modo "VVI" de un marcapasos significa que:', options: ['Estimula y detecta en la aurícula', 'Estimula en la aurícula y el ventrículo', 'Estimula y detecta en el ventrículo, y se inhibe si detecta un latido propio', 'Es un modo de frecuencia fija'], correctAnswer: 2, explanation: 'VVI significa: Ventrículo estimulado (paced), Ventrículo detectado (sensed), y modo de respuesta Inhibido (Inhibited). Es decir, el marcapasos solo dispara si no detecta un latido ventricular propio dentro de un intervalo de tiempo determinado.'},
    ],
    generateECGData: (duration) => {
        const bpm = 70;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        const pacedQRS: Vector = {...VT_QRS_VECTOR, angle: -60};
        const pacedT: Vector = {...VT_T_VECTOR, angle: 120};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, null, pacedQRS, pacedT);
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                // Add pacemaker spike
                data[lead].push({time: time, value: 0}, {time: time + 0.005, value: -0.5}, {time: time + 0.01, value: 0});
                data[lead].push(...beat[lead]);
            }
        }
        for(const lead in data) data[lead].sort((a,b) => a.time - b.time);
        return data;
    },
  },
  {
    id: 'rbbb',
    name: 'Bloqueo de Rama Derecha',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Bloqueo en la rama derecha. QRS ancho, patrón rSR\' en V1 ("orejas de conejo"), y S ancha y empastada en derivaciones laterales.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Variable', pWave: 'Normal', prInterval: '0,12-0,20s', qrs: '>0,12s, rSR\' en V1, S ancha en V6', axis: 'Normal o desviado a la derecha'},
    quiz: [
        { question: '¿Cuál es el criterio principal para la duración del QRS en un bloqueo de rama completo?', options: ['< 0,10 s', '0,10 - 0,12 s', '≥ 0,12 s', 'Variable'], correctAnswer: 2, explanation: 'Un bloqueo de rama completo, ya sea derecho o izquierdo, se define por una duración del complejo QRS de 0,12 segundos o más.'},
        { question: 'El patrón morfológico clásico del Bloqueo de Rama Derecha en la derivación V1 es:', options: ['Una onda QS profunda', 'Una onda R alta y monofásica', 'Un patrón rSR\' ("orejas de conejo")', 'Un QRS estrecho'], correctAnswer: 2, explanation: 'El patrón rSR\' en V1 es el sello distintivo del RBBB, representando la activación tardía del ventrículo derecho.'},
        { question: 'En las derivaciones laterales (I, aVL, V5, V6), un RBBB se caracteriza por:', options: ['Una onda Q profunda', 'Una onda S ancha y empastada', 'Ausencia de onda S', 'Un intervalo PR corto'], correctAnswer: 1, explanation: 'La activación tardía del ventrículo derecho, que se aleja de las derivaciones laterales, produce una onda S final ancha y arrastrada en estas derivaciones.'},
    ],
    generateECGData: (duration) => {
        const bpm = 75;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, NORMAL_P_VECTOR, RBBB_QRS_VECTOR, RBBB_T_VECTOR, 0.16, 'rbbb');
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
  {
    id: 'lbbb',
    name: 'Bloqueo de Rama Izquierda',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Bloqueo de la conducción en la rama izquierda del haz de His, causando una despolarización ventricular anormal. El QRS es ancho, con S profunda en V1 y R ancha/mellada en V6.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Variable', pWave: 'Normal', prInterval: '0,12-0,20s', qrs: '>0,12s, S dominante en V1, R ancha en V6', axis: 'A menudo desviado a la izquierda'},
    quiz: [
        { question: 'La duración del QRS en un Bloqueo de Rama Izquierda completo es típicamente:', options: ['< 0,12 s', 'Variable', 'Normal', '≥ 0,12 s'], correctAnswer: 3, explanation: 'Al igual que el RBBB, un LBBB completo se define por una duración del QRS de 0,12 segundos o más.'},
        { question: 'En la derivación V1, el patrón típico de un LBBB es:', options: ['Un patrón rSR\'', 'Una onda R alta', 'Una onda S ancha y profunda (patrón QS o rS)', 'Un QRS normal'], correctAnswer: 2, explanation: 'En el LBBB, el impulso se aleja de V1 durante toda la despolarización ventricular, creando una onda predominantemente negativa (una S ancha y profunda).'},
        { question: 'En las derivaciones laterales como V6, el LBBB se caracteriza por:', options: ['Una onda S profunda', 'Una onda R ancha, mellada o monofásica', 'Ondas Q patológicas', 'Una onda T picuda'], correctAnswer: 1, explanation: 'La activación lenta y anormal del ventrículo izquierdo hacia las derivaciones laterales produce una onda R ancha, a menudo con una muesca o melladura, y sin onda Q septal.'},
    ],
    generateECGData: (duration) => {
        const bpm = 75;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, NORMAL_P_VECTOR, LBBB_QRS_VECTOR, LBBB_T_VECTOR, 0.16, 'lbbb');
            for(const lead in beat) {
                if(!data[lead]) data[lead] = [];
                data[lead].push(...beat[lead]);
            }
        }
        return data;
    },
  },
];
