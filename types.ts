export interface ECGPoint {
  time: number;
  value: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // Changed from string to number
  explanation: string;
}

export enum ArrhythmiaCategory {
  SUPRAVENTRICULARES = "Supraventriculares",
  VENTRICULARES = "Ventriculares",
}

export interface Arrhythmia {
  id: string;
  name: string;
  category: ArrhythmiaCategory;
  description: string;
  criteria: {
    rhythm: string;
    rhythmAnalysis: string;
    rate: string;
    pWave: string;
    prInterval: string;
    qrs: string;
    axis?: string;
  };
  quiz: QuizQuestion[];
  generateECGData: (durationSeconds: number) => Record<string, ECGPoint[]>;
  clinicalSignificance?: string;
  nursingConsiderations?: string;
  emergencyProtocol?: string;
}