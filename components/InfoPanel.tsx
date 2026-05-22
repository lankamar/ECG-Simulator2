import React, { useState, useMemo } from 'react';
import { Arrhythmia, QuizQuestion, InterpretationStep } from '../types';
import { BookOpenIcon, BeakerIcon, QuestionMarkCircleIcon } from '../constants';
import { getArrhythmiaInterpretation } from '../services/interpretation';
import { getExtendedQuestions } from '../services/quizExtended';

interface InfoPanelProps {
  arrhythmia: Arrhythmia;
}

type Tab = 'theory' | 'criteria' | 'interpretation' | 'quiz';

const InfoPanel: React.FC<InfoPanelProps> = ({ arrhythmia }) => {
  const [activeTab, setActiveTab] = useState<Tab>('theory');

  const renderContent = () => {
    switch (activeTab) {
      case 'theory':
        return <TheoryTab description={arrhythmia.description} />;
      case 'criteria':
        return <CriteriaTab criteria={arrhythmia.criteria} />;
      case 'interpretation':
        return <InterpretationTab id={arrhythmia.id} />;
      case 'quiz':
        return <QuizTab questions={arrhythmia.quiz} arrhythmiaId={arrhythmia.id} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg flex flex-col h-full overflow-hidden">
      <div className="flex gap-2 justify-end overflow-x-auto scrollbar-none">
        <TabButton icon={<BookOpenIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>} label="Teoría" isActive={activeTab === 'theory'} onClick={() => setActiveTab('theory')} />
        <TabButton icon={<BeakerIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>} label="Criterios" isActive={activeTab === 'criteria'} onClick={() => setActiveTab('criteria')} />
        <TabButton icon={<span className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 flex items-center justify-center font-bold text-xs">ECG</span>} label="Interpretación" isActive={activeTab === 'interpretation'} onClick={() => setActiveTab('interpretation')} />
        <TabButton icon={<QuestionMarkCircleIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2"/>} label="Quiz" isActive={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} />
      </div>
      <div className="p-6 overflow-y-auto flex-grow">{renderContent()}</div>
    </div>
  );
};

interface TabButtonProps {
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center px-3 sm:px-5 py-2 sm:py-3 whitespace-nowrap rounded-lg font-semibold text-xs sm:text-sm transition-all duration-300 focus:outline-none border border-slate-600 ${
        isActive ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50' : 'bg-gradient-to-r from-slate-700 to-slate-600 text-slate-100 hover:bg-slate-500 hover:text-white hover:shadow-lg hover:border-slate-400'
        }`}
    >
        
        {label}
    </button>
);


const TheoryTab: React.FC<{ description: string }> = ({ description }) => (
  <div className="prose prose-invert max-w-none text-slate-300">
    <p>{description}</p>
  </div>
);

const InterpretationTab: React.FC<{ id: string }> = ({ id }) => {
  const steps = getArrhythmiaInterpretation(id);
  return (
    <div className="space-y-3">
      {steps.map(s => (
        <details key={s.step} className="bg-slate-700/50 rounded-lg overflow-hidden">
          <summary className="p-3 cursor-pointer font-semibold text-slate-200 hover:bg-slate-600/50 transition-colors">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold mr-2">{s.step}</span>
            {s.title}
          </summary>
          <div className="px-4 pb-3 space-y-1 text-sm">
            <p><span className="text-slate-400">Evaluar: </span><span className="text-slate-200">{s.finding}</span></p>
            <p><span className="text-green-400">Normal: </span><span className="text-green-300">{s.normal}</span></p>
            <p><span className="text-red-400">Hallazgo: </span><span className="text-red-300">{s.pathological}</span></p>
          </div>
        </details>
      ))}
      <p className="text-xs text-slate-500 mt-4 text-center">Siga los pasos en orden para una interpretación sistemática del ECG</p>
    </div>
  );
};

const CriteriaTab: React.FC<{ criteria: Arrhythmia['criteria'] }> = ({ criteria }) => (
  <ul className="space-y-3">
    {Object.entries(criteria).map(([key, value]) => {
        const labels: {[key: string]: string} = {
            rhythm: "Ritmo",
            rhythmAnalysis: "Análisis del Ritmo",
            rate: "Frecuencia",
            pWave: "Onda P",
            prInterval: "Intervalo PR",
            qrs: "Complejo QRS",
        }
        return (
             <li key={key} className="flex justify-between items-center bg-slate-700/50 p-3 rounded-md">
                <span className="font-semibold text-slate-300">{labels[key] || key}</span>
                <span className="text-cyan-400 font-mono text-right">{value}</span>
            </li>
        )
    })}
  </ul>
);

const useStudentProgress = (arrhythmiaId: string) => {
  const storageKey = 'ecg_simulator_progress';
  const loadProgress = (): Record<string, { viewed: boolean; correct: number; total: number }> => {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || '{}');
    } catch { return {}; }
  };
  const saveProgress = (data: Record<string, { viewed: boolean; correct: number; total: number }>) => {
    localStorage.setItem(storageKey, JSON.stringify(data));
  };
  const progress = loadProgress();
  const record = progress[arrhythmiaId] || { viewed: true, correct: 0, total: 0 };
  if (!progress[arrhythmiaId]) {
    progress[arrhythmiaId] = record;
    saveProgress(progress);
  }
  return { record, save: (correct: boolean) => {
    const p = loadProgress();
    const r = p[arrhythmiaId] || { viewed: true, correct: 0, total: 0 };
    r.viewed = true;
    r.total++;
    if (correct) r.correct++;
    p[arrhythmiaId] = r;
    saveProgress(p);
  }};
};

const QuizTab: React.FC<{ questions: QuizQuestion[]; arrhythmiaId: string }> = ({ questions, arrhythmiaId }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
    const { record, save } = useStudentProgress(arrhythmiaId);
    const allQuestions = useMemo(() => [...questions, ...getExtendedQuestions(arrhythmiaId)], [questions, arrhythmiaId]);
  
    if (!allQuestions || allQuestions.length === 0) {
      return <p>No hay quiz disponible para este ritmo.</p>;
    }
  
    const question = allQuestions[currentQuestionIndex];
    const correctOption = question.options[question.correctAnswer];
    const isCorrect = selectedOption === correctOption;
  
    const handleOptionClick = (option: string) => {
      if(showFeedback) return;
      setSelectedOption(option);
      setShowFeedback(true);
      if (option === correctOption) save(true); else save(false);
    };

    const handleNext = () => {
        setShowFeedback(false);
        setSelectedOption(null);
        setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
    }

    const scorePct = record.total > 0 ? Math.round(record.correct / record.total * 100) : 0;
  
    return (
      <div>
        <div className="flex justify-between items-center mb-3 text-xs">
          <span className="text-slate-400">Progreso: {record.total} respuestas</span>
          <span className={`font-bold ${scorePct >= 70 ? 'text-green-400' : scorePct >= 40 ? 'text-yellow-400' : 'text-red-400'}`}>
            {scorePct}% aciertos
          </span>
        </div>
        <div className="w-full bg-slate-600 rounded-full h-1.5 mb-4">
          <div className={`h-1.5 rounded-full ${scorePct >= 70 ? 'bg-green-500' : scorePct >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{width: `${scorePct}%`}}></div>
        </div>
        <h3 className="text-lg font-semibold mb-4 text-slate-200">{question.question}</h3>
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleOptionClick(option)}
              disabled={showFeedback}
              className={`w-full text-left p-3 rounded-lg border-2 transition-all duration-200 ${
                showFeedback && option === correctOption ? 'bg-green-500/20 border-green-500 text-white' :
                showFeedback && option === selectedOption && !isCorrect ? 'bg-red-500/20 border-red-500 text-white' :
                'border-slate-600 hover:border-cyan-500 hover:bg-slate-700/50 disabled:cursor-not-allowed'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
  
        {showFeedback && (
          <div className={`mt-4 p-4 rounded-lg text-white ${isCorrect ? 'bg-green-600/80' : 'bg-red-600/80'}`}>
            <h4 className="font-bold">{isCorrect ? '¡Correcto!' : 'Incorrecto'}</h4>
            <p className="text-sm mt-1">{question.explanation}</p>
            <button onClick={handleNext} className="mt-4 bg-white/20 hover:bg-white/30 px-4 py-1 rounded text-sm font-semibold">
                Siguiente Pregunta
            </button>
          </div>
        )}
      </div>
    );
  };

export default InfoPanel;
