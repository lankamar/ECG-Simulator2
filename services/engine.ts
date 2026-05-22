import { ECGPoint } from '../types';

export const LEAD_ANGLES: Record<string, number> = {
  DI: 0, DII: 60, DIII: 120, aVR: -150, aVL: -30, aVF: 90,
};

export const generateComponent = (startTime: number, duration: number, points: [number, number][]): ECGPoint[] => {
  return points.map(([timePerc, value]) => ({
    time: startTime + timePerc * duration,
    value: value,
  }));
};

export type BeatMorphology = 'lbbb' | 'rbbb' | 'vt';

export interface Vector {
    magnitude: number;
    angle: number;
    duration: number;
    points: [number, number][];
}

export const generatePWaveOnly = (startTime: number, pVector: Vector): Record<string, ECGPoint[]> => {
    const leads = ['DI', 'DII', 'DIII', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
    const pWaveData: Record<string, ECGPoint[]> = Object.fromEntries(leads.map(l => [l, []]));
    const pMagPrecordial: Record<string, number> = { V1: 0.15, V2: 0.18, V3: 0.22, V4: 0.25, V5: 0.22, V6: 0.18 };
    Object.keys(LEAD_ANGLES).forEach(lead => {
        const leadAngle = LEAD_ANGLES[lead];
        const rawProjection = Math.cos((pVector.angle - leadAngle) * Math.PI / 180);
        const projection = Math.abs(rawProjection) < 0.15 ? 0.35 * Math.sign(rawProjection + 0.01) : rawProjection;
        pWaveData[lead].push(...generateComponent(startTime, pVector.duration, pVector.points.map(([t,v]) => [t, v * pVector.magnitude * projection])));
    });
    ['V1','V2','V3','V4','V5','V6'].forEach(lead => {
        const pMag = pMagPrecordial[lead] || 0.15;
        pWaveData[lead].push(...generateComponent(startTime, pVector.duration, pVector.points.map(([t,v]) => [t, v * pMag])));
    });
    return pWaveData;
};

export const create12LeadBeat = (startTime: number, pVector: Vector | null, qrsVector: Vector, tVector: Vector, prInterval: number = 0.16, morphology?: BeatMorphology) => {
    const leads = ['DI', 'DII', 'DIII', 'aVR', 'aVL', 'aVF', 'V1', 'V2', 'V3', 'V4', 'V5', 'V6'];
    const beatData: Record<string, ECGPoint[]> = Object.fromEntries(leads.map(l => [l, []]));
    const pDuration = pVector ? pVector.duration : 0;
    const actualPR = Math.max(prInterval, pDuration);
    const qrsStartTime = startTime + (pVector ? actualPR - pDuration + pDuration : 0);
    const tStartTime = qrsStartTime + qrsVector.duration + 0.08;

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
    
    const rWaveProgression = { V1: 0.1, V2: 0.3, V3: 0.6, V4: 1.0, V5: 1.2, V6: 1.0 };
    const sWaveProgression = { V1: -1.0, V2: -1.2, V3: -1.0, V4: -0.6, V5: -0.2, V6: -0.1 };

    leads.forEach(lead => {
        if (LEAD_ANGLES[lead] !== undefined) {
            const leadAngle = LEAD_ANGLES[lead];
            const qrsProjection = Math.cos((qrsVector.angle - leadAngle) * Math.PI / 180);
            const tProjection = Math.cos((tVector.angle - leadAngle) * Math.PI / 180);
            beatData[lead].push(...generateComponent(qrsStartTime, qrsVector.duration, qrsVector.points.map(([t, v]) => [t, v * qrsVector.magnitude * qrsProjection])));
            beatData[lead].push(...generateComponent(tStartTime, tVector.duration, tVector.points.map(([t,v]) => [t, v * tVector.magnitude * tProjection])));
        } else {
            let qrsPoints: [number, number][];
            let tMag: number;
            
            if (morphology === 'lbbb') {
                const isLateral = lead.match(/V[5-6]/);
                const isSeptal = lead.match(/V[1-2]/);
                if (isSeptal) qrsPoints = [[0,0], [0.1, -0.2], [0.5, -1.2], [1,0]];
                else if (isLateral) qrsPoints = [[0,0], [0.2, 0.2], [0.6, 1.2], [1,0]];
                else qrsPoints = [ [0,0], [0.5, -0.5], [1, 0]];
                tMag = isLateral ? -0.4 : 0.2;
            } else if (morphology === 'rbbb') {
                 const isLateral = lead.match(/V[5-6]/);
                 const isRight = lead.match(/V[1-2]/);
                 if (isRight) qrsPoints = [[0,0], [0.2, 0.4], [0.4, -0.3], [0.8, 1.0], [1, 0]];
                 else if(isLateral) qrsPoints = [[0,0], [0.3, 0.8], [0.8, -0.6], [1, 0]];
                 else qrsPoints = [ [0,0], [0.1, sWaveProgression[lead as keyof typeof sWaveProgression] * 0.2], [0.4, rWaveProgression[lead as keyof typeof rWaveProgression]], [0.7, sWaveProgression[lead as keyof typeof sWaveProgression]], [1, 0]];
                 tMag = isRight ? -0.3 : 0.3;
             } else if (morphology === 'vt') {
                 qrsPoints = [[0,0], [0.15, -0.3], [0.35, -1.2], [0.55, -0.8], [0.75, -0.3], [1,0]];
                 tMag = 0.3;
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

const gaussPoints = (n: number, sigma: number): [number, number][] => Array.from({length: n + 1}, (_, i): [number, number] => {
    const t = i / n;
    const v = Math.exp(-((t - 0.5) ** 2) / (2 * sigma ** 2));
    return [t, v];
});

export const P_WAVE_POINTS: [number, number][] = gaussPoints(40, 0.20);

export const NORMAL_P_VECTOR: Vector = { magnitude: 0.25, angle: 60, duration: 0.10, points: P_WAVE_POINTS };
export const NORMAL_QRS_VECTOR: Vector = { magnitude: 1.0, angle: 45, duration: 0.09, points: [[0,0], [0.1, -0.2], [0.4, 1.0], [0.7, -0.4], [1, 0]] };
export const NORMAL_T_VECTOR: Vector = { magnitude: 0.3, angle: 45, duration: 0.14, points: gaussPoints(40, 0.18) };
export const VT_QRS_VECTOR: Vector = { magnitude: 1.8, angle: -90, duration: 0.20, points: [[0,0], [0.2, 0.4], [0.35, 1.4], [0.5, -1.2], [0.7, 0.6], [1,0]]};
export const VT_T_VECTOR: Vector = { magnitude: 0.4, angle: 90, duration: 0.18, points: [[0,0], [0.5, -1], [1,0]]};
export const RBBB_QRS_VECTOR: Vector = { magnitude: 1.1, angle: 100, duration: 0.14, points: [[0,0], [0.4, 1.0], [0.7, -0.4], [1, 0]] };
export const RBBB_T_VECTOR: Vector = { magnitude: 0.3, angle: -60, duration: 0.16, points: [[0,0], [0.5, -1], [1,0]]};
export const LBBB_QRS_VECTOR: Vector = { magnitude: 1.2, angle: -60, duration: 0.14, points: [[0,0], [0.5, 1.0], [1, 0]] };
export const LBBB_T_VECTOR: Vector = { magnitude: 0.4, angle: 120, duration: 0.16, points: [[0,0], [0.5, -1], [1,0]]};
export const IVR_QRS_VECTOR: Vector = { magnitude: 1.2, angle: -80, duration: 0.24, points: [[0,0], [0.15, 0.3], [0.3, 1.0], [0.5, -0.8], [0.75, 0.4], [1,0]]};
export const IVR_T_VECTOR: Vector = { magnitude: 0.3, angle: 100, duration: 0.18, points: [[0,0], [0.5, -1], [1,0]]};
