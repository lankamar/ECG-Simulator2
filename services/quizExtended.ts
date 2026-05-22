import { QuizQuestion } from '../types';

const extended: Record<string, QuizQuestion[]> = {
  nsr: [
    { question: '¿En qué derivación la onda P es típicamente más visible y positiva?', options: ['V1', 'aVR', 'DII', 'aVL'], correctAnswer: 2, explanation: 'La onda P es más prominente y positiva en DII porque el eje de despolarización auricular apunta hacia esa derivación (+60°).' },
    { question: '¿Cuál es la duración máxima normal del complejo QRS?', options: ['0.08 s', '0.10 s', '0.12 s', '0.14 s'], correctAnswer: 2, explanation: 'El QRS normal dura ≤ 0.12 segundos (3 cuadros chicos). Más de 0.12 s indica trastorno de conducción intraventricular.' },
    { question: '¿Qué significa una onda T invertida en un ECG normal?', options: ['Siempre es patológica', 'Puede ser normal en V1-V3 y en atletas', 'Indica infarto', 'Es un artefacto'], correctAnswer: 1, explanation: 'La inversión de la onda T en V1-V3 puede ser normal, especialmente en niños, jóvenes y atletas (patrón de repolarización temprana).' },
    { question: '¿Cuál es el rango normal del eje eléctrico del QRS en el adulto?', options: ['-30° a +90°', '0° a +90°', '+90° a +180°', '-90° a 0°'], correctAnswer: 1, explanation: 'El eje QRS normal en adultos está entre 0° y +90°. Desviaciones fuera de este rango sugieren hipertrofia, bloqueos o infarto.' },
  ],
  sinus_brady: [
    { question: '¿Por qué los atletas suelen tener bradicardia sinusal?', options: ['Por aumento del tono simpático', 'Por aumento del tono vagal', 'Por hipertrofia ventricular', 'Por isquemia'], correctAnswer: 1, explanation: 'El entrenamiento aeróbico aumenta el tono vagal (parasimpático), lo que enlentece la frecuencia de descarga del nodo sinusal en reposo.' },
    { question: '¿Cuál es el límite inferior para considerar bradicardia sinusal fisiológica?', options: ['50 lpm', '40 lpm', '30 lpm', '20 lpm'], correctAnswer: 1, explanation: 'En atletas de élite, frecuencias de 40-50 lpm durante el sueño son normales. Por debajo de 40 lpm sintomática requiere evaluación.' },
  ],
  sinus_tachy: [
    { question: '¿Cuál es la causa más común de taquicardia sinusal en emergencias?', options: ['Infarto', 'Fiebre e hipovolemia', 'Bloqueo AV', 'Hiperpotasemia'], correctAnswer: 1, explanation: 'La fiebre aumenta la frecuencia cardíaca aproximadamente 10 lpm por cada grado Celsius. La hipovolemia activa el sistema simpático.' },
    { question: '¿Cuándo se debe tratar farmacológicamente una taquicardia sinusal?', options: ['Siempre', 'Cuando la FC > 150 lpm', 'Nunca, solo tratar la causa', 'Con adenosina'], correctAnswer: 2, explanation: 'La taquicardia sinusal es una respuesta compensatoria. Tratar solo la causa subyacente. Usar beta-bloqueantes solo si es inapropiada.' },
  ],
  afib_moderate: [
    { question: '¿Cuál es la puntuación CHA2DS2-VASc y para qué se utiliza?', options: ['Para decidir anticoagulación en FA', 'Para diagnosticar FA', 'Para medir la frecuencia ventricular', 'Para evaluar la función hepática'], correctAnswer: 0, explanation: 'CHA2DS2-VASc estima el riesgo de ACV en pacientes con FA y guía la decisión de anticoagulación.' },
    { question: '¿Qué electrodo busca ondas f para confirmar FA?', options: ['DI y aVL', 'V5 y V6', 'V1 y DII', 'aVR y aVL'], correctAnswer: 2, explanation: 'Las ondas fibrilatorias (ondas f) suelen ser más visibles en V1 y DII, donde la actividad auricular desorganizada se proyecta mejor.' },
  ],
  vtach: [
    { question: '¿Cuál es el signo ECG más específico de TV vs TSV con aberrancia?', options: ['QRS > 0.14 s', 'Disociación AV', 'Complejos de fusión', 'Todas las anteriores'], correctAnswer: 3, explanation: 'La disociación AV, los complejos de fusión, y un QRS muy ancho (>0.14s) son signos específicos de TV.' },
    { question: '¿Qué criterio de Brugada se utiliza para diferenciar TV de TSV?', options: ['R en V1 > 0.04 s', 'Ausencia de RS en V1-V6', 'RS > 100 ms en precordiales', 'Todos son criterios de Brugada'], correctAnswer: 3, explanation: 'Los criterios de Brugada incluyen: 1) ausencia de RS en precordiales, 2) RS > 100 ms, 3) disociación AV, 4) morfología específica en V1-V2.' },
  ],
  av_block_3: [
    { question: '¿Cuál es el tratamiento definitivo para el BAV completo sintomático?', options: ['Atropina', 'Isoproterenol', 'Marcapasos definitivo', 'Cardioversión'], correctAnswer: 2, explanation: 'El BAV completo sintomático requiere marcapasos definitivo. El marcapasos transcutáneo y la atropina son medidas temporales.' },
    { question: '¿Qué riesgo inmediato tiene un BAV completo?', options: ['Fibrilación auricular', 'TV/FV y paro cardíaco', 'Hipertensión', 'Edema pulmonar'], correctAnswer: 1, explanation: 'La asistolia o la FV pueden ocurrir si el escape ventricular falla, causando paro cardíaco súbito.' },
  ],
  wpw: [
    { question: '¿Qué electrocardiográficamente caracteriza al WPW?', options: ['PR largo + QRS ancho', 'PR corto + onda delta + QRS ancho', 'Ausencia de P + QRS estrecho', 'PR normal + onda T invertida'], correctAnswer: 1, explanation: 'La tríada clásica del WPW es: PR corto (<0.12s), onda delta (empinamiento inicial del QRS), y QRS ancho (>0.10s) por preexcitación ventricular.' },
    { question: '¿Cuál es el riesgo de una FA en paciente con WPW?', options: ['Hipotensión leve', 'FV por conducción rápida por la vía accesoria', 'Bradicardia severa', 'No tiene riesgo'], correctAnswer: 1, explanation: 'Si un paciente con WPW desarrolla FA, los impulsos pueden conducirse muy rápidamente por la vía accesoria (>300 lpm), degenerando en FV.' },
  ],
  torsades: [
    { question: '¿Cuál es la causa más común de QT prolongado adquirido?', options: ['Genético', 'Fármacos (antiarrítmicos, antipsicóticos)', 'Ejercicio', 'Hipotermia'], correctAnswer: 1, explanation: 'Fármacos como los antiarrítmicos clase IA/III, antipsicóticos, y algunos antibióticos pueden prolongar el QT y precipitar Torsades.' },
    { question: '¿El sulfato de magnesio funciona en Torsades aunque el magnesio sérico sea normal?', options: ['Sí', 'No'], correctAnswer: 0, explanation: 'El magnesio estabiliza la membrana miocárdica independientemente de los niveles séricos, por lo que es el tratamiento de primera línea.' },
  ],
  pvc: [
    { question: '¿Cuándo se considera una CVP como "compleja" o de alto riesgo?', options: ['Aislada y asintomática', 'Frecuente (> 10/hora), polimórfica, en salvas, o con fenómeno R sobre T', 'Bigeminada', 'Monocromática'], correctAnswer: 1, explanation: 'CVP frecuentes, polimórficas, en rachas (no sostenida), o con fenómeno R sobre T tienen mayor riesgo de desencadenar TV/FV.' },
    { question: '¿Qué es el fenómeno "R sobre T"?', options: ['Una CVP que cae sobre la onda T del latido previo', 'Una CVP con QRS muy ancho', 'CVP con pausa compensatoria', 'CVP con T invertida'], correctAnswer: 0, explanation: 'El fenómeno R sobre T ocurre cuando una CVP cae en la fase vulnerable de la repolarización (onda T), pudiendo desencadenar TV o FV.' },
  ],
  rbbb: [
    { question: '¿Cuál es el criterio diagnóstico principal de RBBB?', options: ['QRS < 0.10 s', 'QRS ≥ 0.12 s con rSR\' en V1-V2', 'Onda delta', 'PR corto'], correctAnswer: 1, explanation: 'El RBBB requiere QRS ≥ 0.12 s con morfología rSR\' (en "oreja de conejo") en V1-V2 y S ancha en DI, V5-V6.' },
    { question: '¿El RBBB puede ser un hallazgo normal?', options: ['Sí, en personas jóvenes sin cardiopatía', 'No, siempre es patológico', 'Solo en ancianos', 'Solo en atletas'], correctAnswer: 0, explanation: 'El RBBB puede ser un hallazgo incidental benigno en personas sin cardiopatía estructural, especialmente si el eje QRS es normal.' },
  ],
  lbbb: [
    { question: '¿Qué patrón de QRS se espera en V5-V6 en un LBBB completo?', options: ['rSR\'', 'QS profunda', 'R mellada (M-shaped)', 'RS normal'], correctAnswer: 2, explanation: 'En LBBB, V5-V6 muestran una R ancha y mellada (en "M") por la activación tardía del ventrículo izquierdo.' },
    { question: '¿Por qué el LBBB tiene peor pronóstico que el RBBB?', options: ['Siempre es más sintomático', 'Suele asociarse a cardiopatía estructural', 'Causa más arritmias', 'Es más difícil de diagnosticar'], correctAnswer: 1, explanation: 'El LBBB frecuentemente se asocia a cardiopatía estructural subyacente (HTA, cardiopatía isquémica, miocardiopatía), empeorando el pronóstico.' },
  ],
};

export const getExtendedQuestions = (id: string): QuizQuestion[] => {
  return extended[id] || [];
};
