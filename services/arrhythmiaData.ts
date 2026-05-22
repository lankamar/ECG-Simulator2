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


    // --- P Wave: Frontal + Precordial Projection ---
    if (pVector) {
        const pMagPrecordial: Record<string, number> = { V1: 0.15, V2: 0.18, V3: 0.22, V4: 0.25, V5: 0.22, V6: 0.18 };
        Object.keys(LEAD_ANGLES).forEach(lead => {
            const leadAngle = LEAD_ANGLES[lead];
            const rawProjection = Math.cos((pVector.angle - leadAngle) * Math.PI / 180);
            const projection = Math.abs(rawProjection) < 0.15 ? 0.35 * Math.sign(rawProjection + 0.01) : rawProjection;
            beatData[lead].push(...generateComponent(startTime, pVector.duration, pVector.points.map(([t,v]) => [t, v * pVector.magnitude * projection])));
        });
        ['V1','V2','V3','V4','V5','V6'].forEach(lead => {
            const pMag = pMagPrecordial[lead] || 0.15;
            beatData[lead].push(...generateComponent(startTime, pVector.duration, pVector.points.map(([t,v]) => [t, v * pMag])));
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
const NORMAL_P_VECTOR: Vector = { magnitude: 0.35, angle: 60, duration: 0.10, points: [[0,0], [0.4, 0.6], [0.5, 1], [0.6, 0.6], [1,0]]};
const NORMAL_QRS_VECTOR: Vector = { magnitude: 1.0, angle: 45, duration: 0.09, points: [[0,0], [0.1, -0.2], [0.4, 1.0], [0.7, -0.4], [1, 0]] };
const NORMAL_T_VECTOR: Vector = { magnitude: 0.3, angle: 45, duration: 0.14, points: [[0,0], [0.5, 1], [1,0]]};
const VT_QRS_VECTOR: Vector = { magnitude: 1.8, angle: -90, duration: 0.20, points: [[0,0], [0.2, 0.4], [0.35, 1.4], [0.5, -1.2], [0.7, 0.6], [1,0]]};
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
    description: 'Ritmo card�aco normal, frecuencia 60�100/min, onda P precede cada QRS, regular.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '60 a 100 L/m', pWave: 'Presente, precede cada QRS', prInterval: '0,12 a 0,20 Seg', qrs: 'Normal (< 0,12 Seg)', axis: 'Normal (0� a +90�)' },
    approximateBpm: 75,
    quiz: [
        { question: '�Cu�l es el rango de frecuencia card�aca para un Ritmo Sinusal Normal?', options: ['< 60 lpm', '60 a 100 lpm', '> 100 lpm', 'Variable'], correctAnswer: 1, explanation: 'El Ritmo Sinusal Normal se define por una frecuencia card�aca entre 60 y 100 latidos por minuto.'},
        { question: 'En un Ritmo Sinusal Normal, la relaci�n entre la onda P y el complejo QRS es:', options: ['Una onda P por cada QRS', 'Ausencia de ondas P', 'M�s ondas P que QRS', 'Ondas P despu�s del QRS'], correctAnswer: 0, explanation: 'La caracter�stica clave del ritmo sinusal es que cada impulso se origina en el nodo sinusal y se conduce a los ventr�culos, resultando en una onda P seguida de un complejo QRS.'},
        { question: '�Cu�l es la duraci�n normal del intervalo PR?', options: ['< 0,12 s', '0,12 a 0,20 s', '0,20 a 0,24 s', '> 0,24 s'], correctAnswer: 1, explanation: 'Un intervalo PR normal, que representa el tiempo de conducci�n desde las aur�culas a los ventr�culos, dura entre 0,12 y 0,20 segundos (3 a 5 cuadros peque�os).'},
    ],
    generateECGData: (duration) => generateSinusRhythm(duration, 75),
  },
  {
    id: 'sinus_brady',
    name: 'Bradicardia Sinusal',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Frecuencia inferior a 60/min, ritmo regular, ondas P normales.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '< 60 L/m', pWave: 'Normal', prInterval: '0,12-0,20s', qrs: '< 0,12s', axis: 'Normal' },
    approximateBpm: 48,
    quiz: [
        { question: 'La Bradicardia Sinusal se define por una frecuencia card�aca:', options: ['Entre 60-80 lpm', 'Menor a 60 lpm', 'Mayor a 100 lpm', 'Irregular'], correctAnswer: 1, explanation: 'El prefijo "bradi-" significa lento. La Bradicardia Sinusal es un ritmo sinusal con una frecuencia inferior a 60 latidos por minuto.'},
        { question: '�Cu�l de las siguientes es una causa fisiol�gica com�n de bradicardia sinusal?', options: ['Fiebre', 'Ansiedad', 'Atletas bien entrenados', 'Hipovolemia'], correctAnswer: 2, explanation: 'Los atletas a menudo tienen un tono vagal aumentado en reposo, lo que ralentiza el nodo sinusal, siendo un hallazgo normal y eficiente para ellos.'},
        { question: '�Cu�ndo se debe tratar la bradicardia sinusal?', options: ['Siempre que se detecta', 'Solo si la frecuencia es < 40 lpm', 'Solo si el paciente presenta s�ntomas', 'Si el QRS es ancho'], correctAnswer: 2, explanation: 'La bradicardia sinusal solo requiere tratamiento (p. ej., con atropina) si el paciente est� sintom�tico (mareos, s�ncope, hipotensi�n). De lo contrario, puede ser benigna.'},
    ],
    generateECGData: (duration) => generateSinusRhythm(duration, 48),
  },
  {
    id: 'sinus_tachy',
    name: 'Taquicardia Sinusal',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Frecuencia mayor a 100/min, ritmo regular, ondas P normales.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '> 100 L/m', pWave: 'Normal', prInterval: '0,12-0,20s', qrs: '< 0,12s', axis: 'Normal' },
    approximateBpm: 120,
    quiz: [
        { question: 'La Taquicardia Sinusal se define por una frecuencia card�aca:', options: ['Mayor a 100 lpm', 'Entre 80-100 lpm', 'Menor a 60 lpm', 'Irregular'], correctAnswer: 0, explanation: 'El prefijo "taqui-" significa r�pido. La Taquicardia Sinusal es un ritmo sinusal con una frecuencia superior a 100 latidos por minuto.'},
        { question: '�Cu�l de las siguientes es una causa com�n de taquicardia sinusal?', options: ['Hipotermia', 'Hipotiroidismo', 'Ejercicio o fiebre', 'Uso de beta-bloqueantes'], correctAnswer: 2, explanation: 'El ejercicio, la fiebre, el dolor, la ansiedad y la hipovolemia son causas comunes que aumentan la descarga del nodo sinusal.'},
        { question: 'El tratamiento primario para la taquicardia sinusal es:', options: ['Administrar adenosina', 'Realizar cardioversi�n', 'Tratar la causa subyacente', 'Administrar amiodarona'], correctAnswer: 2, explanation: 'La taquicardia sinusal es una respuesta fisiol�gica a un estr�s. El tratamiento debe enfocarse en resolver la causa de base (p. ej., administrar fluidos para la deshidrataci�n, analg�sicos para el dolor).'},
    ],
    generateECGData: (duration) => generateSinusRhythm(duration, 120),
  },
  {
    id: 'pac',
    name: 'Extras�stole Auricular (CAP)',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Latido prematuro originado en un foco ect�pico de las aur�culas. La onda P es prematura y tiene una morfolog�a diferente a la sinusal, seguida generalmente de un QRS estrecho.',
    criteria: { rhythm: 'Irregular por latido prematuro', rhythmAnalysis: 'Irregular', rate: 'Depende del ritmo de base', pWave: 'Prematura, forma anormal', prInterval: 'Variable', qrs: 'Normal (< 0,12s)' },
    approximateBpm: 70,
    clinicalSignificance: 'Generalmente benignas en corazones sanos, pero pueden ser precursoras de taquiarritmias como FA o aleteo si son frecuentes.',
    nursingConsiderations: 'Monitorizar frecuencia y s�ntomas (palpitaciones). Evaluar factores desencadenantes como cafe�na, estr�s o alcohol. Registrar en la historia cl�nica.',
    emergencyProtocol: 'No requiere tratamiento de emergencia a menos que cause inestabilidad hemodin�mica o desencadene una taquicardia sostenida.',
    quiz: [
        { question: '�Cu�l es la caracter�stica clave de una CAP en el ECG?', options: ['QRS ancho', 'Onda P prematura y anormal', 'Ausencia de onda P', 'Intervalo PR corto'], correctAnswer: 1, explanation: 'La CAP se define por una onda P que aparece antes de lo esperado y tiene una forma diferente a la del ritmo sinusal.'},
        { question: 'El complejo QRS que sigue a una CAP es t�picamente:', options: ['Ancho y bizarro', 'Estrecho y normal', 'Ausente', 'Variable'], correctAnswer: 1, explanation: 'Como el impulso se conduce normalmente a trav�s de los ventr�culos, el QRS suele ser estrecho.'},
        { question: 'La pausa que sigue a una CAP suele ser:', options: ['Compensatoria completa', 'No compensatoria', 'Variable', 'Ausente'], correctAnswer: 1, explanation: 'La despolarizaci�n auricular prematura generalmente resetea el n�dulo sinusal, haciendo que el siguiente latido sinusal ocurra antes de lo esperado, resultando en una pausa no compensatoria.'},
    ],
    generateECGData: (duration) => {
        const bpm = 70;
        const normalInterval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        let beatCount = 0;
        const pacPVector: Vector = { ...NORMAL_P_VECTOR, angle: 20, magnitude: 0.25 };
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
    name: 'Fibrilaci�n Auricular Moderada',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ritmo totalmente irregular, sin ondas P claras, QRS de intervalo variable, actividad auricular ca�tica.',
    criteria: { rhythm: 'Irregularmente irregular', rhythmAnalysis: 'Irregularmente irregular', rate: 'Variable (ej. 60-100 L/m)', pWave: 'Ausente (ondas fibrilatorias)', prInterval: 'No medible', qrs: '< 0,12s', axis: 'Variable' },
    approximateBpm: 80,
    quiz: [
        { question: '�Cu�l es la caracter�stica que define el ritmo en la Fibrilaci�n Auricular?', options: ['Regular', 'Regularmente irregular', 'Irregularmente irregular', 'Lento'], correctAnswer: 2, explanation: 'La FA se caracteriza por un ritmo ventricular ca�tico y completamente impredecible, conocido como "irregularmente irregular".'},
        { question: 'En un ECG con Fibrilaci�n Auricular, �qu� reemplaza a las ondas P normales?', options: ['Ondas en diente de sierra', 'Ondas U', 'L�nea isoel�ctrica plana', 'Ondas fibrilatorias (ondas f)'], correctAnswer: 3, explanation: 'En la FA, la actividad auricular es ca�tica, lo que genera una l�nea de base ondulada y desorganizada conocida como ondas fibrilatorias o "ondas f".'},
        { question: '�Cu�l es la complicaci�n cl�nica m�s grave asociada a la Fibrilaci�n Auricular?', options: ['S�ncope', 'Accidente cerebrovascular (ACV)', 'Infarto de miocardio', 'Insuficiencia respiratoria'], correctAnswer: 1, explanation: 'La falta de contracci�n auricular efectiva puede causar estasis de sangre y formaci�n de co�gulos en la aur�cula, aumentando significativamente el riesgo de un ACV emb�lico.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        let time = 0;
        const fLeadFactor: Record<string, number> = { V1: 1.0, V2: 0.8, V3: 0.5, V4: 0.3, V5: 0.2, V6: 0.15, DII: 0.5, DIII: 0.4, aVF: 0.4, DI: 0.2, aVL: 0.15, aVR: 0.1 };
        while(time < duration) {
            const interval = 0.6 + Math.random() * 0.4; // 0.6-1.0 sec ? 60-100 lpm
            const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
            for(const lead in beat) {
                data[lead].push(...beat[lead]);
                const factor = fLeadFactor[lead] || 0.3;
                for (let t = time; t < time + interval; t += 0.03) {
                     if (!data[lead].some(p => Math.abs(p.time - t) < 0.01)) {
                        data[lead].push({time: t, value: (Math.random() - 0.5) * 0.12 * factor});
                    }
                }
            }
            time += interval;
        }
        for(const lead in data) data[lead].sort((a,b) => a.time - b.time);
        return data;
    }
  },
      {
    id: 'afib_low', name: 'Fibrilaci�n Auricular Baja', category: ArrhythmiaCategory.SUPRAVENTRICULARES, description: 'Fibrilaci�n auricular con respuesta ventricular lenta (40-60 lpm), ondas f finas y menos visibles.', criteria: { rhythm: 'Irregularmente irregular', rhythmAnalysis: 'Irregularmente irregular', rate: '40 a 60 L/m', pWave: 'Ausente (ondas f finas)', prInterval: 'No medible', qrs: '< 0,12s', axis: 'Variable' },
    approximateBpm: 50,
    quiz: [ { question: '�Cu�l es el rango de frecuencia para Fibrilaci�n Auricular Baja?', options: ['20-40 lpm', '40-60 lpm', '60-100 lpm', '>100 lpm'], correctAnswer: 1, explanation: 'La Fibrilaci�n Auricular Baja presenta una respuesta ventricular lenta entre 40 y 60 latidos por minuto.' }, { question: '�C�mo se caracterizan las ondas f en FA Baja?', options: ['Prominentes y ca�ticas', 'Finas y menos visibles', 'Ausentes completamente', 'Regulares y organizadas'], correctAnswer: 1, explanation: 'Las ondas fibrilatorias en FA Baja son finas y menos visibles, indicando menor actividad auricular desorganizada.' }, { question: '�Cu�l es la complicaci�n principal de FA Baja?', options: ['Taquicardia extrema', 'Insuficiencia card�aca por gasto bajo', 'Fibrilaci�n ventricular', 'Bloqueo AV completo'], correctAnswer: 1, explanation: 'La respuesta ventricular lenta puede resultar en gasto card�aco inadecuado, causando s�ntomas de bajo gasto card�aco.' } ], generateECGData: (duration) => { let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []])); const fLeadFactor: Record<string, number> = { V1: 1.0, V2: 0.8, V3: 0.5, V4: 0.3, V5: 0.2, V6: 0.15, DII: 0.5, DIII: 0.4, aVF: 0.4, DI: 0.2, aVL: 0.15, aVR: 0.1 }; let time = 0; while(time < duration) { const interval = 1.0 + Math.random() * 0.5; const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR); for(const lead in beat) { data[lead].push(...beat[lead]); const factor = fLeadFactor[lead] || 0.3; for (let t = time; t < time + interval; t += 0.03) { if (!data[lead].some(p => Math.abs(p.time - t) < 0.01)) { data[lead].push({time: t, value: (Math.random() - 0.5) * 0.12 * factor}); } } } time += interval; } for(const lead in data) data[lead].sort((a,b) => a.time - b.time); return data; } },
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             { id: 'afib_high', name: 'Fibrilaci�n Auricular Alta', category: ArrhythmiaCategory.SUPRAVENTRICULARES, description: 'Fibrilaci�n auricular con respuesta ventricular r�pida (120-160 lpm), ondas f prominentes y ca�ticas.', criteria: { rhythm: 'Irregularmente irregular', rhythmAnalysis: 'Irregularmente irregular', rate: '120 a 160 L/m', pWave: 'Ausente (ondas f prominentes)', prInterval: 'No medible', qrs: '< 0,12s', axis: 'Variable' },
    approximateBpm: 140,
    quiz: [ { question: '�Cu�l es el rango de frecuencia para Fibrilaci�n Auricular Alta?', options: ['60-100 lpm', '100-120 lpm', '120-160 lpm', '>160 lpm'], correctAnswer: 2, explanation: 'La Fibrilaci�n Auricular Alta presenta una respuesta ventricular r�pida entre 120 y 160 latidos por minuto.' }, { question: '�C�mo son las ondas f en FA Alta?', options: ['Finas y sutiles', 'Medianas', 'Prominentes y muy visibles', 'Ausentes'], correctAnswer: 2, explanation: 'Las ondas fibrilatorias en FA Alta son prominentes y f�cilmente visibles, indicando actividad auricular muy desorganizada.' }, { question: '�Cu�l es el principal riesgo de FA Alta?', options: ['Bradicardia severa', 'Inestabilidad hemoddin�mica y angina', 'Bloqueo AV', 'Ritmo idioventricular'], correctAnswer: 1, explanation: 'La respuesta ventricular muy r�pida puede causar inestabilidad hemoddin�mica, sincope, y en pacientes con cardiopat�a, angina o infarto.' } ], generateECGData: (duration) => { let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []])); const fLeadFactor: Record<string, number> = { V1: 1.0, V2: 0.8, V3: 0.5, V4: 0.3, V5: 0.2, V6: 0.15, DII: 0.5, DIII: 0.4, aVF: 0.4, DI: 0.2, aVL: 0.15, aVR: 0.1 }; let time = 0; while(time < duration) { const interval = 0.375 + Math.random() * 0.125; const beat = create12LeadBeat(time, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR); for(const lead in beat) { data[lead].push(...beat[lead]); const factor = fLeadFactor[lead] || 0.3; for (let t = time; t < time + interval; t += 0.03) { if (!data[lead].some(p => Math.abs(p.time - t) < 0.01)) { data[lead].push({time: t, value: (Math.random() - 0.5) * 0.35 * factor}); } } } time += interval; } for(const lead in data) data[lead].sort((a,b) => a.time - b.time); return data; } },
   {
    id: 'aflutter',
    name: 'Aleteo Auricular',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ondas auriculares "en dientes de sierra" (ondas F), ritmo regular o irregular seg�n conducci�n AV. Frecuencia auricular ~300/min.',
    criteria: { rhythm: 'Regular (con bloqueo fijo)', rhythmAnalysis: 'Regular', rate: 'Ventricular ~150 L/m (2:1)', pWave: 'Ondas F "en sierra"', prInterval: 'No medible', qrs: '< 0,12s', axis: 'Variable' },
    approximateBpm: 150,
    quiz: [
        { question: '�Cu�l es la morfolog�a cl�sica de la actividad auricular en el Aleteo Auricular?', options: ['Ondas P normales', 'Ondas fibrilatorias', 'L�nea plana', 'Ondas en "dientes de sierra"'], correctAnswer: 3, explanation: 'El Aleteo Auricular se caracteriza por las ondas F, que tienen un patr�n regular y repetitivo que se asemeja a los dientes de una sierra.'},
        { question: 'La frecuencia auricular t�pica en un Aleteo Auricular es de aproximadamente:', options: ['60-100 lpm', '100-150 lpm', '150-250 lpm', '250-350 lpm'], correctAnswer: 3, explanation: 'El circuito de reentrada auricular en el aleteo es muy r�pido y organizado, generando impulsos a una frecuencia de alrededor de 300 lpm.'},
        { question: 'Si la frecuencia auricular es de 300 lpm y hay un bloqueo AV 2:1, �cu�l ser� la frecuencia ventricular?', options: ['300 lpm', '150 lpm', '100 lpm', '75 lpm'], correctAnswer: 1, explanation: 'Con un bloqueo 2:1, el nodo AV solo permite que uno de cada dos impulsos auriculares pase a los ventr�culos. Por lo tanto, la frecuencia ventricular ser� la mitad de la auricular (300 / 2 = 150 lpm).'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        const atrialRate = 300;
        const block = 2;
        const atrialInterval = 60 / atrialRate;
        const ventricularInterval = atrialInterval * block;
        const flutterVector: Vector = { magnitude: 0.5, angle: 90, duration: atrialInterval, points: [[0,0],[0.25,-0.3],[0.5,-1],[0.75,-0.5],[1,0]]};

        for(let time = 0; time < duration; time += atrialInterval) {
            Object.keys(LEAD_ANGLES).forEach(lead => {
                 const leadAngle = LEAD_ANGLES[lead];
                 const projection = Math.cos((flutterVector.angle - leadAngle) * Math.PI / 180);
                 const flutterWaveMagnitude = (lead === 'DII' || lead === 'DIII' || lead === 'aVF') ? 0.6 : 0.2;
                 data[lead].push(...generateComponent(time, atrialInterval, [[0,0],[0.25, 0.1 * flutterWaveMagnitude],[0.5, -flutterWaveMagnitude],[0.75, -0.3 * flutterWaveMagnitude],[1,0.05 * flutterWaveMagnitude]]));
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
    id: 'aflutter_variable',
    name: 'Aleteo Auricular con Bloqueo Variable',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Aleteo auricular con conducci�n AV variable (2:1, 3:1, 4:1). Ondas F "en dientes de sierra" regulares, pero el intervalo R-R var�a seg�n el bloqueo, generando un ritmo ventricular irregular.',
    criteria: { rhythm: 'Irregular por bloqueo variable', rhythmAnalysis: 'Irregular', rate: 'Ventricular variable (~60-150 L/m)', pWave: 'Ondas F "en sierra" regulares', prInterval: 'No medible', qrs: '< 0,12s', axis: 'Variable' },
    approximateBpm: 100,
    clinicalSignificance: 'El bloqueo AV variable puede deberse a f�rmacos que afectan el nodo AV (digoxina, betabloqueantes) o a enfermedad del nodo AV. La respuesta ventricular irregular puede causar s�ntomas de bajo gasto.',
    nursingConsiderations: 'Monitorizar frecuencia ventricular y estabilidad hemodin�mica. Evaluar medicamentos que afectan la conducci�n AV. Documentar el patr�n de bloqueo.',
    emergencyProtocol: 'Si hay inestabilidad hemodin�mica por respuesta ventricular r�pida, se puede considerar cardioversi�n el�ctrica sincronizada. Si es lenta y sintom�tica, considerar marcapasos.',
    quiz: [
        { question: '�Qu� caracteriza al Aleteo Auricular con Bloqueo Variable?', options: ['Frecuencia auricular irregular', 'Intervalo R-R irregular por cambios en el bloqueo AV', 'Ausencia de ondas F', 'QRS ancho permanentemente'], correctAnswer: 1, explanation: 'La frecuencia auricular es regular (ondas F a ~300/min), pero el bloqueo AV variable hace que la respuesta ventricular sea irregular.'},
        { question: '�Qu� f�rmaco puede causar bloqueo AV variable en aleteo?', options: ['Lidoca�na', 'Digoxina', 'Adrenalina', 'Atropina'], correctAnswer: 1, explanation: 'La digoxina aumenta el tono vagal y enlentece la conducci�n AV, pudiendo causar bloqueo variable en pacientes con aleteo auricular.'},
        { question: '�Cu�l es el riesgo de un bloqueo 1:1 en aleteo?', options: ['Bradicardia severa', 'Respuesta ventricular muy r�pida (~300 lpm) que causa inestabilidad', 'Asistolia', 'No tiene riesgos'], correctAnswer: 1, explanation: 'Si el bloqueo AV pasa a 1:1, la frecuencia ventricular ser�a de ~300 lpm, lo que es hemodin�micamente muy mal tolerado y puede degenerar en FV.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        const atrialRate = 300;
        const atrialInterval = 60 / atrialRate;
        const flutterVector: Vector = { magnitude: 0.5, angle: 90, duration: atrialInterval, points: [[0,0],[0.25,-0.3],[0.5,-1],[0.75,-0.5],[1,0]]};

        for(let time = 0; time < duration; time += atrialInterval) {
            Object.keys(LEAD_ANGLES).forEach(lead => {
                 const leadAngle = LEAD_ANGLES[lead];
                 const projection = Math.cos((flutterVector.angle - leadAngle) * Math.PI / 180);
                 const flutterWaveMagnitude = (lead === 'DII' || lead === 'DIII' || lead === 'aVF') ? 0.6 : 0.2;
                 data[lead].push(...generateComponent(time, atrialInterval, [[0,0],[0.25, 0.1 * flutterWaveMagnitude],[0.5, -flutterWaveMagnitude],[0.75, -0.3 * flutterWaveMagnitude],[1,0.05 * flutterWaveMagnitude]]));
            });
        }

        let qrsTime = 0;
        while(qrsTime < duration) {
            const blockRatio = [2, 3, 4][Math.floor(Math.random() * 3)]; // Random 2:1, 3:1, or 4:1
            const ventricularInterval = atrialInterval * blockRatio;
            const beat = create12LeadBeat(qrsTime, null, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
             for(const lead in beat) {
                data[lead].push(...beat[lead]);
            }
            qrsTime += ventricularInterval;
        }
        for(const lead in data) data[lead].sort((a,b) => a.time - b.time);
        return data;
    }
  },
  {
    id: 'wandering_pacemaker',
    name: 'Marcapaso Migratorio (Errante)',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ritmo auricular irregular donde el marcapaso migra entre el nodo sinusal, las aur�culas y la uni�n AV. Presenta al menos 3 morfolog�as de onda P distintas, intervalos PR variables y frecuencia < 100 lpm.',
    criteria: { rhythm: 'Irregularmente irregular', rhythmAnalysis: 'Irregular', rate: '< 100 L/m', pWave: 'Al menos 3 formas distintas', prInterval: 'Variable', qrs: 'Normal (< 0,12s)'},
    clinicalSignificance: 'Suele ser un ritmo benigno, frecuentemente observado en j�venes, atletas, o durante el sue�o por aumento del tono vagal. Tambi�n puede asociarse a enfermedad del nodo sinusal.',
    nursingConsiderations: 'Evaluar si el paciente presenta s�ntomas. Monitorizar la frecuencia card�aca. Generalmente no requiere tratamiento. Documentar el ritmo y su relaci�n con la actividad del paciente.',
    emergencyProtocol: 'No requiere tratamiento de emergencia. Si es sintom�tico (raro), se trata la causa subyacente.',
    approximateBpm: 75,
    quiz: [
        { question: '�Qu� caracteriza al Marcapaso Migratorio?', options: ['Frecuencia > 100 lpm con ondas P id�nticas', 'Migraci�n del marcapaso con al menos 3 morfolog�as de P y frecuencia < 100 lpm', 'Ausencia completa de ondas P', 'QRS ancho y bizarro'], correctAnswer: 1, explanation: 'Se distingue de la MAT por tener una frecuencia card�aca < 100 lpm, pero comparte la presencia de m�ltiples morfolog�as de onda P.'},
        { question: '�Cu�l es la principal diferencia entre Marcapaso Migratorio y MAT?', options: ['La morfolog�a del QRS', 'La frecuencia card�aca (< 100 vs > 100 lpm)', 'La presencia de ondas P', 'El intervalo QT'], correctAnswer: 1, explanation: 'Electrocardiogr�ficamente son iguales (m�ltiples morfolog�as P, PR variable), pero el Marcapaso Migratorio tiene frecuencia < 100 lpm mientras que la MAT es > 100 lpm.'},
        { question: 'El Marcapaso Migratorio suele ser:', options: ['Una emergencia m�dica', 'Un ritmo benigno', 'Precursor de fibrilaci�n ventricular', 'Indicaci�n de marcapasos'], correctAnswer: 1, explanation: 'Generalmente es un hallazgo benigno, especialmente en personas j�venes y atletas, y no requiere tratamiento.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        const pVectors: Vector[] = [
            {...NORMAL_P_VECTOR, angle: 60},
            {...NORMAL_P_VECTOR, angle: 20, magnitude: 0.12},
            {...NORMAL_P_VECTOR, angle: 100, magnitude: 0.1},
        ];
        while(time < duration) {
            const interval = 60 / (60 + Math.random() * 35); // Rate 60-95 bpm, < 100
            const p = pVectors[Math.floor(Math.random() * pVectors.length)];
            const variablePR = 0.12 + Math.random() * 0.14; // PR variable 0.12-0.26s
            const beat = create12LeadBeat(time, p, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR, variablePR);
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
    id: 'mat',
    name: 'Taquicardia Auricular Multifocal',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ritmo auricular r�pido e irregular caracterizado por al menos 3 morfolog�as de ondas P distintas, intervalos PR variables y una frecuencia card�aca superior a 100 lpm.',
    criteria: { rhythm: 'Irregularmente irregular', rhythmAnalysis: 'Irregular', rate: '> 100 L/m', pWave: 'Al menos 3 formas distintas', prInterval: 'Variable', qrs: 'Normal (< 0,12s)' },
    approximateBpm: 120,
    clinicalSignificance: 'Frecuentemente asociada a enfermedades pulmonares graves (EPOC, embolia pulmonar) o desequilibrios electrol�ticos. Puede ser un precursor de la fibrilaci�n auricular.',
    nursingConsiderations: 'Evaluar el estado respiratorio del paciente y los electrolitos. La monitorizaci�n continua es crucial. Tratar la causa subyacente es la prioridad.',
    emergencyProtocol: 'El tratamiento se centra en la condici�n subyacente. Si hay inestabilidad, se pueden usar bloqueadores de los canales de calcio o beta-bloqueantes con precauci�n.',
    quiz: [
        { question: '�Cu�l es el n�mero m�nimo de morfolog�as de onda P distintas para diagnosticar MAT?', options: ['Dos', 'Tres', 'Cuatro', 'Cinco'], correctAnswer: 1, explanation: 'El diagn�stico de MAT requiere al menos tres morfolog�as de onda P diferentes en el mismo trazado ECG.'},
        { question: 'La MAT se asocia com�nmente con:', options: ['Enfermedad coronaria', 'Enfermedad pulmonar severa', 'Hipertensi�n', 'Atletas entrenados'], correctAnswer: 1, explanation: 'La hipoxia y el aumento del tono simp�tico en enfermedades como la EPOC son causas comunes de MAT.'},
        { question: 'El ritmo en la MAT es:', options: ['Regular', 'Regularmente irregular', 'Irregularmente irregular', 'Variable'], correctAnswer: 2, explanation: 'Debido a los m�ltiples focos auriculares que compiten por el control, el ritmo es ca�tico e irregular.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        const pVectors: Vector[] = [
            {...NORMAL_P_VECTOR, angle: 60},
            {...NORMAL_P_VECTOR, angle: -30, magnitude: 0.25},
            {...NORMAL_P_VECTOR, angle: 100, magnitude: 0.20},
        ];
        while(time < duration) {
            const interval = 60 / (130 + Math.random() * 40); // Rate 130-170 bpm
            const p = pVectors[Math.floor(Math.random() * pVectors.length)];
            const variablePR = 0.12 + Math.random() * 0.16; // PR variable 0.12-0.28s
            const beat = create12LeadBeat(time, p, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR, variablePR);
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
    name: 'Taquicardia Parox�stica Supraventricular (TPSV)',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'T�rmino general para taquicardias r�pidas y regulares que se originan por encima de los ventr�culos. T�picamente presenta un complejo QRS estrecho y una frecuencia de 150 a 250 lpm, con inicio y fin s�bitos.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '150 a 250 L/m', pWave: 'A menudo no visible (oculta)', prInterval: 'No medible', qrs: 'Normal (< 0,12s)' },
    approximateBpm: 190,
    clinicalSignificance: 'Puede causar s�ntomas como palpitaciones, mareos, disnea o s�ncope. Aunque rara vez es mortal en corazones sanos, puede provocar isquemia en pacientes con enfermedad coronaria.',
    nursingConsiderations: 'Evaluar la estabilidad hemodin�mica del paciente. Intentar maniobras vagales (Valsalva, masaje carot�deo si est� indicado). Preparar adenosina IV.',
    emergencyProtocol: 'Maniobras vagales. Si no son efectivas y el paciente est� estable, administrar Adenosina IV (bolo r�pido). Si est� inestable, realizar cardioversi�n el�ctrica sincronizada.',
    quiz: [
        { question: '�Cu�l es la frecuencia card�aca t�pica durante una TPSV?', options: ['60-100 lpm', '100-140 lpm', '150-250 lpm', 'M�s de 250 lpm'], correctAnswer: 2, explanation: 'La TPSV se caracteriza por una frecuencia ventricular muy r�pida pero regular.'},
        { question: 'El complejo QRS en una TPSV es generalmente:', options: ['Ancho', 'Estrecho', 'Ausente', 'Polim�rfico'], correctAnswer: 1, explanation: 'Como el origen es supraventricular, la conducci�n a trav�s de los ventr�culos es normal, resultando en un QRS estrecho.'},
        { question: '�Cu�l es el tratamiento farmacol�gico de primera l�nea para una TPSV estable?', options: ['Amiodarona', 'Lidoca�na', 'Adenosina', 'Digoxina'], correctAnswer: 2, explanation: 'La adenosina bloquea transitoriamente el nodo AV, lo que interrumpe la mayor�a de los circuitos de reentrada de la TPSV.'},
    ],
    generateECGData: (duration) => {
        const bpm = 220;
        const interval = 60 / bpm;
        const psvtQRS: Vector = {...NORMAL_QRS_VECTOR, duration: 0.06};
        let data: Record<string, ECGPoint[]> = {};
        for (let time = 0; time < duration; time += interval) {
            const beat = create12LeadBeat(time, null, psvtQRS, NORMAL_T_VECTOR);
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
    description: 'Es el tipo m�s com�n de TPSV. Se debe a un circuito de reentrada dentro del nodo AV. Se caracteriza por una taquicardia regular de QRS estrecho, con ondas P retr�gradas que a menudo se ocultan en el QRS o aparecen justo despu�s como una pseudo-S o pseudo-R\'.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '150 a 250 L/m', pWave: 'Retr�grada, oculta o pseudo-onda', prInterval: 'No aplicable', qrs: 'Normal (< 0,12s)' },
    approximateBpm: 170,
    clinicalSignificance: 'Similar a otras TPSV, generalmente sintom�tica pero bien tolerada en pacientes sin cardiopat�a estructural. La recurrencia es com�n.',
    nursingConsiderations: 'La evaluaci�n y el manejo inicial son id�nticos a los de la TPSV. La documentaci�n del inicio y fin, y la respuesta a las maniobras es clave para el diagn�stico.',
    emergencyProtocol: 'Id�ntico al de la TPSV: maniobras vagales, seguidas de adenosina para pacientes estables y cardioversi�n para inestables.',
    quiz: [
        { question: '�D�nde se localiza el circuito de reentrada en la TRNAV?', options: ['En las aur�culas', 'En los ventr�culos', 'Dentro del nodo AV', 'En una v�a accesoria'], correctAnswer: 2, explanation: 'La TRNAV se debe a la existencia de una v�a lenta y una v�a r�pida dentro del propio nodo auriculoventricular.'},
        { question: 'Una onda P retr�grada que crea una "pseudo-R\'" en V1 es un signo cl�sico de:', options: ['Fibrilaci�n auricular', 'TRNAV', 'Taquicardia ventricular', 'Bloqueo de rama'], correctAnswer: 1, explanation: 'La onda P retr�grada puede deformar el final del QRS, creando una peque�a onda positiva adicional en V1.'},
        { question: '�Es la TRNAV una causa com�n de palpitaciones en personas j�venes y sanas?', options: ['S�', 'No', 'Solo en ancianos', 'Solo en deportistas'], correctAnswer: 0, explanation: 'Es la arritmia parox�stica regular m�s frecuente y a menudo se presenta en personas sin otra enfermedad card�aca.'},
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
    name: 'Ritmo de Escape de la Uni�n',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ritmo de escape que se origina en la uni�n AV cuando el n�dulo sinusal falla. Frecuencia lenta, QRS estrecho, y ondas P ausentes o retr�gradas.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '40 a 60 L/m', pWave: 'Ausente o invertida/retr�grada', prInterval: 'No aplicable', qrs: '< 0,12s', axis: 'Normal' },
    approximateBpm: 45,
    quiz: [
        { question: '�Cu�l es la frecuencia card�aca caracter�stica de un Ritmo de Escape de la Uni�n?', options: ['< 40 lpm', '40 a 60 lpm', '60 a 100 lpm', '> 100 lpm'], correctAnswer: 1, explanation: 'El marcapasos intr�nseco de la uni�n AV tiene una frecuencia de 40 a 60 latidos por minuto.'},
        { question: 'En un ritmo de la uni�n, �d�nde se espera encontrar la onda P si es visible?', options: ['Siempre antes del QRS', 'Despu�s del QRS (retr�grada)', 'Ausente o invertida', 'Normal y positiva'], correctAnswer: 2, explanation: 'Como el impulso se origina en la uni�n AV, las aur�culas se despolarizan de forma retr�grada, lo que puede resultar en una onda P invertida antes del QRS, oculta dentro de �l, o visible justo despu�s.'},
        { question: 'Un ritmo de escape de la uni�n es un mecanismo:', options: ['De reentrada', 'Patol�gico y anormal', 'De protecci�n (seguridad)', 'Inducido por f�rmacos'], correctAnswer: 2, explanation: 'Los ritmos de escape son mecanismos de seguridad que se activan cuando los marcapasos superiores (como el nodo sinusal) fallan, evitando as� la asistolia.'},
    ],
    generateECGData: (duration) => {
        const bpm = 45;
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
    description: 'Prolongaci�n fija del intervalo PR > 0,20 segundos.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Variable', pWave: 'Normal', prInterval: '> 0,20s (fijo)', qrs: '< 0,12s', axis: 'Normal' },
    approximateBpm: 70,
    quiz: [
        { question: '�Cu�l es el hallazgo ECG definitorio del Bloqueo AV de 1er Grado?', options: ['QRS ancho', 'Ausencia de ondas P', 'Intervalo PR > 0,20 segundos', 'Ritmo irregular'], correctAnswer: 2, explanation: 'El Bloqueo AV de 1er Grado se define �nicamente por un retraso en la conducci�n AV, lo que se traduce en un intervalo PR prolongado y constante (>0.20s).'},
        { question: 'En este tipo de bloqueo, �cada onda P es seguida por un complejo QRS?', options: ['S�, siempre', 'No, algunas se bloquean', 'Solo la mitad', 'Depende de la frecuencia'], correctAnswer: 0, explanation: 'A diferencia de los bloqueos de segundo o tercer grado, en el de primer grado todos los impulsos auriculares se conducen a los ventr�culos, solo que lo hacen m�s lentamente.'},
        { question: 'Cl�nicamente, el Bloqueo AV de 1er Grado aislado es generalmente considerado:', options: ['Una emergencia m�dica', 'Precursor de infarto', 'Benigno y asintom�tico', 'Una indicaci�n para marcapasos'], correctAnswer: 2, explanation: 'Por s� solo, el Bloqueo AV de 1er Grado no suele tener repercusi�n hemodin�mica y es a menudo un hallazgo incidental sin necesidad de tratamiento.'},
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
    name: 'Bloqueo AV 2� Grado Mobitz I (Wenckebach)',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Bloqueo AV caracterizado por una prolongaci�n progresiva del intervalo PR en latidos consecutivos, hasta que una onda P finalmente no es conducida y el ciclo se reinicia. Causa un ritmo "regularmente irregular".',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Agrupamiento de latidos', rate: 'Bradic�rdica', pWave: 'Normal, algunas no conducen', prInterval: 'Se alarga progresivamente', qrs: 'Normal (< 0,12s)' },
    approximateBpm: 45,
    clinicalSignificance: 'Generalmente es un bloqueo benigno y transitorio localizado en el nodo AV. Rara vez progresa a bloqueo completo y a menudo es asintom�tico.',
    nursingConsiderations: 'Monitorizar al paciente, especialmente si es nuevo o si est� tomando medicamentos que afectan el nodo AV (beta-bloqueantes, digoxina). Observar si hay progresi�n del bloqueo.',
    emergencyProtocol: 'No suele requerir tratamiento de emergencia. Si causa bradicardia sintom�tica, se debe considerar atropina y la suspensi�n de los f�rmacos causantes.',
    quiz: [
        { question: '�Qu� le sucede al intervalo PR en un bloqueo de Wenckebach?', options: ['Es constante', 'Se acorta progresivamente', 'Se alarga progresivamente', 'Es variable sin patr�n'], correctAnswer: 2, explanation: 'La caracter�stica distintiva es el alargamiento progresivo del PR hasta que una P se bloquea.'},
        { question: '�El ritmo en Mobitz I se describe mejor como?', options: ['Regular', 'Irregularmente irregular', 'Regularmente irregular', 'Ca�tico'], correctAnswer: 2, explanation: 'La pausa del latido ca�do crea un patr�n de agrupamiento de latidos que es predeciblemente irregular.'},
        { question: '�D�nde suele localizarse el bloqueo en un Mobitz I?', options: ['En el nodo sinusal', 'En el nodo AV', 'En el haz de His', 'En las ramas del haz'], correctAnswer: 1, explanation: 'El Wenckebach es t�picamente un problema de conducci�n a nivel del nodo AV, por lo que suele ser m�s benigno que el Mobitz II.'},
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
    name: 'Bloqueo AV 2� Grado Mobitz II',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Ondas P bloqueadas s�bitamente sin prolongaci�n previa del PR. PR constante en los latidos conducidos. Puede ser peligroso.',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Regularmente irregular', rate: 'Bradic�rdica', pWave: 'Normal, algunas no conducen', prInterval: 'Constante en latidos conducidos', qrs: 'Puede ser ancho', axis: 'Variable' },
    approximateBpm: 45,
    quiz: [
        { question: 'A diferencia del Mobitz I, el intervalo PR en los latidos conducidos de un Mobitz II es:', options: ['Progresivamente m�s largo', 'Progresivamente m�s corto', 'Constante', 'Variable'], correctAnswer: 2, explanation: 'La caracter�stica clave del Mobitz II es que el intervalo PR permanece constante antes y despu�s de la onda P bloqueada.'},
        { question: 'El bloqueo en Mobitz II suele localizarse en el sistema de His-Purkinje. Esto hace que el QRS sea a menudo:', options: ['Estrecho', 'Ausente', 'Ancho', 'Variable'], correctAnswer: 2, explanation: 'Un bloqueo infranodal (por debajo del nodo AV) a menudo se asocia con un trastorno de conducci�n intraventricular, resultando en un complejo QRS ancho.'},
        { question: '�Cu�l es el principal riesgo de un bloqueo Mobitz II?', options: ['Progresi�n a fibrilaci�n auricular', 'Progresi�n a bloqueo AV completo (3er grado)', 'Causar hipertensi�n severa', 'No tiene riesgos significativos'], correctAnswer: 1, explanation: 'El Mobitz II es considerado un bloqueo inestable y peligroso debido a su alto riesgo de progresar s�bitamente a un bloqueo AV de tercer grado, lo que puede causar un paro card�aco.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        let time = 0;
        let beatCount = 0;
        const interval = 60 / 80;
        while(time < duration) {
            beatCount++;
            const beat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR, 0.16);
            for(const lead in beat) {
                data[lead].push(...beat[lead].filter(p => p.time < time + NORMAL_P_VECTOR.duration));
                if(beatCount % 4 !== 0) {
                    data[lead].push(...beat[lead].filter(p => p.time >= time + NORMAL_P_VECTOR.duration));
                }
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
    description: 'Disociaci�n AV completa. Las aur�culas y los ventr�culos laten de forma independiente.',
    criteria: { rhythm: 'Regular P-P, Regular R-R', rhythmAnalysis: 'Regular', rate: 'Ventricular 20-40 L/m', pWave: 'No relacionadas con QRS', prInterval: 'Variable', qrs: 'Ancho (>0,12s)', axis: 'Variable' },
    approximateBpm: 38,
    quiz: [
        { question: '�Qu� significa "disociaci�n AV" en el Bloqueo de 3er Grado?', options: ['Las aur�culas laten m�s lento que los ventr�culos', 'No hay actividad auricular', 'Las aur�culas y los ventr�culos laten de forma independiente', 'El QRS es estrecho'], correctAnswer: 2, explanation: 'En el bloqueo completo, ning�n impulso auricular llega a los ventr�culos. Las aur�culas son controladas por el nodo sinusal y los ventr�culos por un marcapasos de escape inferior, sin ninguna relaci�n entre ellos.'},
        { question: 'En el bloqueo completo, la frecuencia auricular (ondas P) es generalmente ________ que la frecuencia ventricular (QRS).', options: ['M�s r�pida', 'M�s lenta', 'Igual', 'El doble'], correctAnswer: 0, explanation: 'La frecuencia sinusal normal (60-100 lpm) es m�s r�pida que la frecuencia de un ritmo de escape ventricular (20-40 lpm).'},
        { question: 'El tratamiento definitivo para un Bloqueo AV de 3er Grado sintom�tico es:', options: ['Administraci�n de adenosina', 'Cardioversi�n el�ctrica', 'Implantaci�n de un marcapasos permanente', 'Ablaci�n por cat�ter'], correctAnswer: 2, explanation: 'Debido a la bradicardia severa y el riesgo de asistolia, el tratamiento est�ndar y definitivo es la implantaci�n de un marcapasos para asegurar una frecuencia card�aca adecuada.'},
    ],
    generateECGData: (duration) => {
        let data: Record<string, ECGPoint[]> = Object.fromEntries(Object.keys(LEAD_ANGLES).concat(['V1','V2','V3','V4','V5','V6']).map(l => [l, []]));
        const atrialInterval = 60 / 78;
        const ventricularInterval = 60 / 38;

        for(let time = 0; time < duration; time += atrialInterval) {
            const pWaveBeat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
            for(const lead in pWaveBeat) data[lead].push(...(pWaveBeat[lead].filter(p => p.time < time + NORMAL_P_VECTOR.duration)));
        }

        for(let time = 0.3; time < duration; time += ventricularInterval) {
            const beat = create12LeadBeat(time, null, VT_QRS_VECTOR, VT_T_VECTOR);
            for(const lead in beat) {
                data[lead].push(...beat[lead]);
            }
        }
        for(const lead in data) data[lead].sort((a,b) => a.time - b.time);
        return data;
    }
  },
  {
    id: 'wpw',
    name: 'S�ndrome de WPW',
    category: ArrhythmiaCategory.SUPRAVENTRICULARES,
    description: 'Pre-excitaci�n ventricular a trav�s de una v�a accesoria. Causa un intervalo PR corto y una onda delta al inicio del QRS.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Variable', pWave: 'Normal', prInterval: '< 0,12s', qrs: 'Ancho con onda Delta', axis: 'Variable seg�n v�a' },
    approximateBpm: 80,
    quiz: [
        { question: '�Cu�les son los dos hallazgos ECG cl�sicos del s�ndrome de WPW?', options: ['PR largo y QRS estrecho', 'PR corto y onda Delta', 'Ausencia de onda P y ritmo irregular', 'Ondas T picudas y QRS ancho'], correctAnswer: 1, explanation: 'El WPW se caracteriza por un intervalo PR corto (<0.12s) y una onda Delta (un empastamiento inicial del complejo QRS) debido a la pre-excitaci�n ventricular.'},
        { question: 'La causa subyacente del WPW es:', options: ['Un bloqueo en el nodo AV', 'Una v�a de conducci�n accesoria', 'Un foco ect�pico auricular', 'Isquemia mioc�rdica'], correctAnswer: 1, explanation: 'El WPW es causado por la presencia de una v�a el�ctrica an�mala (v�a accesoria o Haz de Kent) que conecta directamente las aur�culas y los ventr�culos, evitando el nodo AV.'},
        { question: '�Cu�l es el principal riesgo asociado al s�ndrome de WPW?', options: ['Bradicardia severa', 'Desarrollo de taquiarritmias r�pidas', 'Bloqueo AV completo', 'Hipertensi�n pulmonar'], correctAnswer: 1, explanation: 'La v�a accesoria puede facilitar circuitos de reentrada que conducen a taquicardias muy r�pidas, como una fibrilaci�n auricular pre-excitada, que puede ser potencialmente mortal.'},
    ],
    generateECGData: (duration) => {
        const bpm = 80;
        const interval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        const wpwQRS: Vector = {...NORMAL_QRS_VECTOR, duration: 0.14, points: [[0,0], [0.35, 0.15], [0.45, 0.5], [0.55, -0.3], [0.7, 1.0], [0.85, -0.4], [1, 0]]}; // Delta wave: slow initial upstroke
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
    name: 'Contracci�n Ventricular Prematura',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Un latido ect�pico originado en los ventr�culos. Causa un QRS ancho y bizarro, sin onda P precedente, seguido por una pausa compensatoria.',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Irregular (latido prematuro)', rate: 'Depende del ritmo base', pWave: 'Ausente antes del PVC', prInterval: 'No aplicable al PVC', qrs: 'Ancho (>0,12s), bizarro', axis: 'Variable' },
    approximateBpm: 70,
    quiz: [
        { question: '�Cu�l es la caracter�stica principal del complejo QRS en una CVP?', options: ['Estrecho y normal', 'Ausente', 'Ancho y de morfolog�a bizarra', 'Precedido por una onda P normal'], correctAnswer: 2, explanation: 'Debido a que el impulso se origina en un foco ventricular, se propaga lentamente por el miocardio, resultando en un complejo QRS ancho (>0.12s) y de forma anormal.'},
        { question: 'La pausa que t�picamente sigue a una CVP se denomina:', options: ['Pausa no compensatoria', 'Pausa sinusal', 'Pausa compensatoria completa', 'Bloqueo de salida'], correctAnswer: 2, explanation: 'La CVP no suele interferir con el ritmo del nodo sinusal. El siguiente impulso sinusal llega cuando los ventr�culos est�n refractarios, por lo que se bloquea, y el latido siguiente aparece en su momento esperado, creando una pausa completa.'},
        { question: '�Cu�l de las siguientes condiciones puede causar CVPs frecuentes?', options: ['Hipercalemia', 'Hipoxia', 'Alcalosis', 'Hipotermia'], correctAnswer: 1, explanation: 'La hipoxia, al igual que los desequilibrios electrol�ticos (hipokalemia, hipomagnesemia) y la isquemia, aumenta la irritabilidad del miocardio ventricular y puede provocar CVPs.'},
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
    description: 'Ritmo en el que cada latido sinusal normal es seguido por una Contracci�n Ventricular Prematura (CVP), creando un patr�n repetitivo de "normal-ect�pico".',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Patr�n 1:1', rate: 'Depende del ritmo base', pWave: 'Presente en latidos sinusales', prInterval: 'Normal en latidos sinusales', qrs: 'Normal y ancho (CVP) alternados' },
    approximateBpm: 70,
    clinicalSignificance: 'Puede ser benigno, pero si es frecuente o en el contexto de una cardiopat�a estructural, puede aumentar el riesgo de arritmias sostenidas como la TV.',
    nursingConsiderations: 'Evaluar los electrolitos del paciente (potasio, magnesio) y la oxigenaci�n. Notificar al m�dico si el patr�n es nuevo o si el paciente presenta s�ntomas.',
    emergencyProtocol: 'Generalmente no es una emergencia. El tratamiento se enfoca en corregir la causa subyacente. Si causa inestabilidad hemodin�mica (raro), se trata como una TV.',
    quiz: [
        { question: '�C�mo se define el bigeminismo ventricular?', options: ['Una CVP cada dos latidos', 'Una CVP despu�s de cada latido normal', 'Dos CVPs seguidas', 'Una CVP cada tres latidos'], correctAnswer: 1, explanation: 'El patr�n es un latido normal seguido de una CVP, de forma repetida (1:1).'},
        { question: 'El QRS de la CVP en el bigeminismo es t�picamente:', options: ['Estrecho', 'Ancho', 'Igual al sinusal', 'Ausente'], correctAnswer: 1, explanation: 'Al originarse en los ventr�culos, la conducci�n es anormal y lenta, lo que resulta en un QRS ancho.'},
        { question: '�Cu�l es una causa reversible com�n de bigeminismo?', options: ['Infarto de miocardio antiguo', 'Hipopotasemia', 'Hipertensi�n arterial', 'Estenosis a�rtica'], correctAnswer: 1, explanation: 'Los desequilibrios electrol�ticos, especialmente de potasio y magnesio, son causas comunes y corregibles de ectopia ventricular.'},
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
    description: 'Ritmo en el que cada dos latidos sinusales normales son seguidos por una Contracci�n Ventricular Prematura (CVP), creando un patr�n repetitivo de "normal-normal-ect�pico".',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Patr�n 2:1', rate: 'Depende del ritmo base', pWave: 'Presente en latidos sinusales', prInterval: 'Normal en latidos sinusales', qrs: 'Dos normales, uno ancho (CVP)' },
    approximateBpm: 75,
    clinicalSignificance: 'Similar al bigeminismo, su importancia cl�nica depende del contexto (presencia de cardiopat�a, s�ntomas, frecuencia).',
    nursingConsiderations: 'La evaluaci�n y el manejo son similares a los del bigeminismo. Es importante documentar la frecuencia del patr�n y cualquier s�ntoma asociado.',
    emergencyProtocol: 'No es una emergencia por s� mismo. El tratamiento se dirige a la causa subyacente. La intervenci�n urgente solo es necesaria si desencadena arritmias m�s peligrosas.',
    quiz: [
        { question: '�Cu�l es el patr�n caracter�stico del trigeminismo ventricular?', options: ['Normal, CVP, Normal...', 'Normal, Normal, CVP...', 'Normal, CVP, CVP...', 'Tres CVPs seguidas'], correctAnswer: 1, explanation: 'El patr�n del trigeminismo es dos latidos normales seguidos de una CVP, que se repite.'},
        { question: 'En comparaci�n con el bigeminismo, una tira de trigeminismo tendr�:', options: ['M�s CVPs', 'Menos CVPs', 'El mismo n�mero de CVPs', 'Solo CVPs'], correctAnswer: 1, explanation: 'En trigeminismo, 1 de cada 3 latidos es una CVP, mientras que en bigeminismo es 1 de cada 2, por lo que hay menos CVPs en total.'},
        { question: 'La importancia cl�nica del trigeminismo depende principalmente de:', options: ['La edad del paciente', 'La hora del d�a', 'La presencia de cardiopat�a estructural y s�ntomas', 'El g�nero del paciente'], correctAnswer: 2, explanation: 'En un coraz�n sano, el trigeminismo suele ser benigno. Sin embargo, en un paciente con una enfermedad card�aca subyacente (como un infarto previo), puede ser un marcador de mayor riesgo.'},
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
    id: 'quadrigeminy',
    name: 'Cuadrigeminia Ventricular',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Ritmo en el que cada tres latidos sinusales normales son seguidos por una Contracci�n Ventricular Prematura (CVP), creando un patr�n repetitivo de "normal-normal-normal-ect�pico".',
    criteria: { rhythm: 'Regularmente irregular', rhythmAnalysis: 'Patr�n 3:1', rate: 'Depende del ritmo base', pWave: 'Presente en latidos sinusales', prInterval: 'Normal en latidos sinusales', qrs: 'Tres normales, uno ancho (CVP)' },
    approximateBpm: 75,
    clinicalSignificance: 'Similar al bigeminismo y trigeminismo, su importancia cl�nica depende del contexto (presencia de cardiopat�a, s�ntomas, frecuencia).',
    nursingConsiderations: 'Evaluar los electrolitos del paciente y la oxigenaci�n. Documentar la frecuencia del patr�n y cualquier s�ntoma asociado.',
    emergencyProtocol: 'No es una emergencia por s� mismo. El tratamiento se dirige a la causa subyacente.',
    quiz: [
        { question: '�Cu�l es el patr�n caracter�stico de la cuadrigeminia ventricular?', options: ['Normal, CVP, Normal, Normal...', 'Normal, Normal, Normal, CVP...', 'Normal, Normal, CVP, Normal...', 'Cuatro CVPs seguidas'], correctAnswer: 1, explanation: 'El patr�n de cuadrigeminia es tres latidos normales seguidos de una CVP, que se repite.'},
        { question: 'En cuadrigeminia, �cada cu�ntos latidos ocurre una CVP?', options: ['Cada 2', 'Cada 3', 'Cada 4', 'Cada 5'], correctAnswer: 2, explanation: 'En cuadrigeminia, 1 de cada 4 latidos es una CVP (tres normales, uno ect�pico).'},
        { question: '�Cu�ndo la cuadrigeminia ventricular requiere tratamiento?', options: ['Siempre', 'Nunca', 'Si es sintom�tica o en contexto de cardiopat�a estructural', 'Solo si la FC > 100'], correctAnswer: 2, explanation: 'Al igual que otros patrones de ectopia ventricular, el tratamiento se reserva para pacientes sintom�ticos o con cardiopat�a estructural subyacente.'},
    ],
    generateECGData: (duration) => {
        const bpm = 75;
        const normalInterval = 60 / bpm;
        let data: Record<string, ECGPoint[]> = {};
        let time = 0;
        let beatInCycle = 0;
        while(time < duration) {
            if (beatInCycle < 3) {
                 const beat = create12LeadBeat(time, NORMAL_P_VECTOR, NORMAL_QRS_VECTOR, NORMAL_T_VECTOR);
                 for(const lead in beat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...beat[lead]);
                }
                time += normalInterval;
            } else {
                const pvcTime = time - normalInterval * 0.3;
                const pvcBeat = create12LeadBeat(pvcTime, null, VT_QRS_VECTOR, VT_T_VECTOR);
                 for(const lead in pvcBeat) {
                    if(!data[lead]) data[lead] = [];
                    data[lead].push(...pvcBeat[lead]);
                }
                time += normalInterval * 1.7;
            }
            beatInCycle = (beatInCycle + 1) % 4;
        }
        return data;
    },
  },
  {
    id: 'vtach',
    name: 'Taquicardia Ventricular',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Ritmo r�pido (>100/min) de origen ventricular, con QRS ancho y regular.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '100 a 270 L/m', pWave: 'No visible', prInterval: 'No medible', qrs: 'Ancho (> 0,12s)', axis: 'Extremo/Indeterminado' },
    approximateBpm: 180,
    quiz: [
        { question: '�Cu�les son los tres criterios clave para identificar una Taquicardia Ventricular?', options: ['FC < 60, QRS estrecho, ritmo irregular', 'FC > 100, QRS ancho, ritmo regular', 'FC 60-100, QRS estrecho, ondas P visibles', 'FC > 150, QRS estrecho, ritmo regular'], correctAnswer: 1, explanation: 'La TV se define cl�sicamente por ser una taquicardia de complejo ancho y regular.'},
        { question: 'La Taquicardia Ventricular sostenida es una emergencia m�dica porque puede:', options: ['Causar hipertensi�n severa', 'Progresar a un bloqueo AV', 'Degenerar en Fibrilaci�n Ventricular', 'Ser asintom�tica'], correctAnswer: 2, explanation: 'La TV puede causar inestabilidad hemodin�mica grave y es un precursor com�n de la Fibrilaci�n Ventricular, que es un ritmo de paro card�aco.'},
        { question: '�Cu�l es el tratamiento de elecci�n para un paciente con TV y sin pulso?', options: ['Administrar atropina', 'Realizar un masaje carot�deo', 'Desfibrilaci�n inmediata', 'Administrar adenosina'], correctAnswer: 2, explanation: 'La TV sin pulso se trata como un paro card�aco. La intervenci�n clave, junto con la RCP de alta calidad, es la desfibrilaci�n lo antes posible.'},
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
    description: 'Taquicardia ventricular polim�rfica caracterizada por complejos QRS que parecen girar alrededor de la l�nea isoel�ctrica. Asociada a un intervalo QT prolongado.',
    criteria: { rhythm: 'Irregular', rhythmAnalysis: 'Irregular', rate: '150 a 250 L/m', pWave: 'No visible', prInterval: 'No medible', qrs: 'Ancho, polim�rfico, "torsi�n"', axis: 'Variable' },
    approximateBpm: 200,
    quiz: [
        { question: 'La morfolog�a caracter�stica de Torsades de Pointes es:', options: ['QRS ancho y monom�rfico', 'QRS estrecho y regular', 'QRS que cambia de amplitud y eje (gira)', 'Ausencia de QRS'], correctAnswer: 2, explanation: 'El nombre "Torsades de Pointes" significa "torsi�n de las puntas", que describe c�mo los picos de los complejos QRS parecen girar alrededor de la l�nea isoel�ctrica.'},
        { question: 'Esta arritmia est� com�nmente asociada con un hallazgo ECG subyacente, que es:', options: ['Intervalo PR corto', 'Intervalo QT prolongado', 'Onda U prominente', 'Bloqueo de rama'], correctAnswer: 1, explanation: 'La prolongaci�n del intervalo QT, ya sea cong�nita o adquirida (por f�rmacos, electrolitos), es el principal factor de riesgo para desarrollar Torsades de Pointes.'},
        { question: '�Cu�l es el tratamiento farmacol�gico de primera l�nea para Torsades de Pointes?', options: ['Amiodarona', 'Lidoca�na', 'Sulfato de Magnesio', 'Adenosina'], correctAnswer: 2, explanation: 'El sulfato de magnesio intravenoso es el tratamiento de elecci�n, ya que estabiliza la membrana mioc�rdica y puede acortar el intervalo QT, terminando la arritmia.'},
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
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '20 a 40 L/m', pWave: 'Ausente o disociada', prInterval: 'No aplicable', qrs: 'Ancho (> 0,12s)', axis: 'Indeterminado' },
    approximateBpm: 32,
    quiz: [
        { question: '�Cu�l es la frecuencia intr�nseca de un Ritmo Idioventricular?', options: ['60-100 lpm', '40-60 lpm', '20-40 lpm', '>100 lpm'], correctAnswer: 2, explanation: 'El marcapasos intr�nseco de los ventr�culos es el m�s lento del coraz�n, con una frecuencia de 20 a 40 latidos por minuto. Funciona como un mecanismo de seguridad.'},
        { question: 'Un Ritmo Idioventricular generalmente indica:', options: ['Un coraz�n sano y atl�tico', 'Una falla de los marcapasos superiores (sinusal y de la uni�n)', 'Una respuesta al estr�s o la cafe�na', 'Una arritmia de reentrada'], correctAnswer: 1, explanation: 'Este ritmo de escape solo aparece cuando el nodo sinusal y el nodo AV han fallado en generar un impulso, lo que lo convierte en un ritmo de �ltimo recurso.'},
        { question: 'El tratamiento para un paciente sintom�tico con Ritmo Idioventricular podr�a incluir:', options: ['Administrar un beta-bloqueante', 'Estimulaci�n con marcapasos y atropina', 'Realizar cardioversi�n', 'Administrar lidoca�na'], correctAnswer: 1, explanation: 'No se deben suprimir los ritmos de escape. El objetivo es acelerar la frecuencia card�aca, lo que se puede lograr con atropina o, de manera m�s definitiva, con un marcapasos externo o interno.'},
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
    description: 'Ritmo ventricular regular con una frecuencia entre 40 y 120 lpm. Es m�s r�pido que un ritmo de escape ventricular pero m�s lento que una taquicardia ventricular. A menudo se observa durante la reperfusi�n en un infarto de miocardio.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: '40 a 120 L/m', pWave: 'Ausente o disociada', prInterval: 'No aplicable', qrs: 'Ancho (> 0,12s)' },
    approximateBpm: 80,
    clinicalSignificance: 'Generalmente es un ritmo benigno y autolimitado, considerado un marcador de reperfusi�n exitosa tras una angioplastia. No suele requerir tratamiento.',
    nursingConsiderations: 'Monitorizar al paciente y no confundirlo con una TV lenta. Evaluar el contexto cl�nico (post-IAM). El tratamiento antiarr�tmico suele ser innecesario e incluso perjudicial.',
    emergencyProtocol: 'No se trata como una emergencia. Si causa hipotensi�n (raro), se puede intentar aumentar la frecuencia sinusal con atropina para "sobreestimular" el ritmo ventricular.',
    quiz: [
        { question: '�Cu�l es el rango de frecuencia card�aca para el RIVA?', options: ['20-40 lpm', '40-120 lpm', '120-150 lpm', '>150 lpm'], correctAnswer: 1, explanation: 'La frecuencia del RIVA se sit�a entre la de un ritmo de escape ventricular y una taquicardia ventricular.'},
        { question: 'El complejo QRS en el RIVA es t�picamente:', options: ['Estrecho', 'Ancho', 'Variable', 'Normal'], correctAnswer: 1, explanation: 'Al tener un origen ventricular, la despolarizaci�n es lenta y anormal, lo que genera un QRS ancho.'},
        { question: 'El RIVA es un marcador com�n de:', options: ['Isquemia severa', 'Reperfusi�n coronaria', 'Insuficiencia card�aca', 'Hiperpotasemia'], correctAnswer: 1, explanation: 'La aparici�n de RIVA durante o despu�s de una angioplastia a menudo indica que el flujo sangu�neo a la arteria bloqueada se ha restablecido.'},
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
    name: 'Fibrilaci�n Ventricular',
    category: ArrhythmiaCategory.VENTRICULARES,
    description: 'Actividad el�ctrica ventricular ca�tica, sin QRS identificables. Paro card�aco.',
    criteria: { rhythm: 'Ca�tico', rhythmAnalysis: 'Ca�tico', rate: '>300/min', pWave: 'Ausente', prInterval: 'No medible', qrs: 'Ausente (ondas fibrilatorias)', axis: 'Indeterminado' },
    approximateBpm: 300,
    quiz: [
        { question: '�C�mo se describe la actividad el�ctrica en la Fibrilaci�n Ventricular?', options: ['Regular y r�pida', 'Organizada pero lenta', 'Ca�tica y desorganizada', 'Ausente'], correctAnswer: 2, explanation: 'La FV es una actividad el�ctrica ventricular completamente ca�tica, sin complejos QRS identificables, lo que impide cualquier contracci�n card�aca efectiva.'},
        { question: 'Un paciente en Fibrilaci�n Ventricular siempre estar�:', options: ['Asintom�tico', 'Mareado pero consciente', 'En paro card�aco (sin pulso)', 'Hipertenso'], correctAnswer: 2, explanation: 'La FV no produce gasto card�aco. Es un ritmo de paro card�aco que requiere intervenci�n inmediata.'},
        { question: '�Cu�l es el tratamiento m�s importante y urgente para la Fibrilaci�n Ventricular?', options: ['Administrar atropina', 'RCP de alta calidad y desfibrilaci�n', 'Implantar un marcapasos', 'Administrar ox�geno'], correctAnswer: 1, explanation: 'La �nica forma de detener la FV es con una descarga el�ctrica (desfibrilaci�n). Cada minuto de retraso en la desfibrilaci�n disminuye dr�sticamente la probabilidad de supervivencia.'},
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
    description: 'Ausencia de actividad el�ctrica. "L�nea plana".',
    criteria: { rhythm: 'Ausente', rhythmAnalysis: 'Ausente', rate: '0 L/m', pWave: 'Ausente', prInterval: 'No aplicable', qrs: 'Ausente', axis: 'No aplicable' },
    approximateBpm: 0,
    quiz: [
        { question: '�Qu� se observa en el monitor durante la Asistolia?', options: ['Ondas r�pidas y ca�ticas', 'Complejos QRS anchos', 'Una l�nea plana', 'Ondas en diente de sierra'], correctAnswer: 2, explanation: 'La Asistolia es la ausencia total de actividad el�ctrica card�aca, lo que se traduce en una l�nea plana en el monitor de ECG.'},
        { question: '�La Asistolia es un ritmo "desfibrilable"?', options: ['S�, es la prioridad', 'No, la desfibrilaci�n no es efectiva', 'Solo si es de onda fina', 'Depende de la causa'], correctAnswer: 1, explanation: 'No se puede desfibrilar la ausencia de actividad el�ctrica. El tratamiento para la asistolia se centra en la RCP de alta calidad y la administraci�n de f�rmacos como la epinefrina para intentar restaurar la actividad el�ctrica.'},
        { question: 'Antes de confirmar el diagn�stico de asistolia, �qu� es crucial hacer?', options: ['Administrar un bolo de fluidos', 'Verificar en dos derivaciones y aumentar la ganancia', 'Iniciar una infusi�n de amiodarona', 'Preparar para la cardioversi�n'], correctAnswer: 1, explanation: 'Es fundamental confirmar que no se trata de una FV de onda muy fina o de un problema t�cnico (como un cable desconectado). Esto se hace verificando el ritmo en al menos dos derivaciones perpendiculares y aumentando la ganancia (tama�o) de la se�al en el monitor.'},
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
    description: 'Estimulaci�n ventricular. Espiga de marcapasos seguida de un QRS ancho.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Programada (ej. 70 L/m)', pWave: 'Ausente o disociada', prInterval: 'No aplicable', qrs: 'Ancho, precedido por espiga', axis: 'Extremo (superior izquierdo)' },
    approximateBpm: 70,
    quiz: [
        { question: '�Cu�l es el signo caracter�stico de un ritmo marcapaseado en el ECG?', options: ['Una onda P invertida', 'Un QRS estrecho', 'Una espiga vertical antes del QRS', 'Un intervalo QT corto'], correctAnswer: 2, explanation: 'El artefacto el�ctrico generado por el marcapasos aparece como una espiga fina y vertical justo antes del complejo que est� estimulando (en este caso, el QRS ventricular).'},
        { question: 'El complejo QRS en un ritmo con marcapasos ventricular es ancho porque:', options: ['La frecuencia es muy r�pida', 'La estimulaci�n se origina en el ventr�culo', 'Hay un bloqueo AV asociado', 'La espiga interfiere con la medici�n'], correctAnswer: 1, explanation: 'Al igual que una CVP, la estimulaci�n se origina en un punto del ventr�culo y se propaga lentamente por el miocardio, no por el sistema de conducci�n r�pido, lo que resulta en un QRS ancho.'},
        { question: 'El modo "VVI" de un marcapasos significa que:', options: ['Estimula y detecta en la aur�cula', 'Estimula en la aur�cula y el ventr�culo', 'Estimula y detecta en el ventr�culo, y se inhibe si detecta un latido propio', 'Es un modo de frecuencia fija'], correctAnswer: 2, explanation: 'VVI significa: Ventr�culo estimulado (paced), Ventr�culo detectado (sensed), y modo de respuesta Inhibido (Inhibited). Es decir, el marcapasos solo dispara si no detecta un latido ventricular propio dentro de un intervalo de tiempo determinado.'},
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
    description: 'Bloqueo en la rama derecha. QRS ancho, patr�n rSR\' en V1 ("orejas de conejo"), y S ancha y empastada en derivaciones laterales.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Variable', pWave: 'Normal', prInterval: '0,12-0,20s', qrs: '>0,12s, rSR\' en V1, S ancha en V6', axis: 'Normal o desviado a la derecha' },
    approximateBpm: 75,
    quiz: [
        { question: '�Cu�l es el criterio principal para la duraci�n del QRS en un bloqueo de rama completo?', options: ['< 0,10 s', '0,10 - 0,12 s', '= 0,12 s', 'Variable'], correctAnswer: 2, explanation: 'Un bloqueo de rama completo, ya sea derecho o izquierdo, se define por una duraci�n del complejo QRS de 0,12 segundos o m�s.'},
        { question: 'El patr�n morfol�gico cl�sico del Bloqueo de Rama Derecha en la derivaci�n V1 es:', options: ['Una onda QS profunda', 'Una onda R alta y monof�sica', 'Un patr�n rSR\' ("orejas de conejo")', 'Un QRS estrecho'], correctAnswer: 2, explanation: 'El patr�n rSR\' en V1 es el sello distintivo del RBBB, representando la activaci�n tard�a del ventr�culo derecho.'},
        { question: 'En las derivaciones laterales (I, aVL, V5, V6), un RBBB se caracteriza por:', options: ['Una onda Q profunda', 'Una onda S ancha y empastada', 'Ausencia de onda S', 'Un intervalo PR corto'], correctAnswer: 1, explanation: 'La activaci�n tard�a del ventr�culo derecho, que se aleja de las derivaciones laterales, produce una onda S final ancha y arrastrada en estas derivaciones.'},
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
    description: 'Bloqueo de la conducci�n en la rama izquierda del haz de His, causando una despolarizaci�n ventricular anormal. El QRS es ancho, con S profunda en V1 y R ancha/mellada en V6.',
    criteria: { rhythm: 'Regular', rhythmAnalysis: 'Regular', rate: 'Variable', pWave: 'Normal', prInterval: '0,12-0,20s', qrs: '>0,12s, S dominante en V1, R ancha en V6', axis: 'A menudo desviado a la izquierda' },
    approximateBpm: 75,
    quiz: [
        { question: 'La duraci�n del QRS en un Bloqueo de Rama Izquierda completo es t�picamente:', options: ['< 0,12 s', 'Variable', 'Normal', '= 0,12 s'], correctAnswer: 3, explanation: 'Al igual que el RBBB, un LBBB completo se define por una duraci�n del QRS de 0,12 segundos o m�s.'},
        { question: 'En la derivaci�n V1, el patr�n t�pico de un LBBB es:', options: ['Un patr�n rSR\'', 'Una onda R alta', 'Una onda S ancha y profunda (patr�n QS o rS)', 'Un QRS normal'], correctAnswer: 2, explanation: 'En el LBBB, el impulso se aleja de V1 durante toda la despolarizaci�n ventricular, creando una onda predominantemente negativa (una S ancha y profunda).'},
        { question: 'En las derivaciones laterales como V6, el LBBB se caracteriza por:', options: ['Una onda S profunda', 'Una onda R ancha, mellada o monof�sica', 'Ondas Q patol�gicas', 'Una onda T picuda'], correctAnswer: 1, explanation: 'La activaci�n lenta y anormal del ventr�culo izquierdo hacia las derivaciones laterales produce una onda R ancha, a menudo con una muesca o melladura, y sin onda Q septal.'},
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


