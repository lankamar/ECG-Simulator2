import React, { useState } from 'react';
import { Arrhythmia, QuizQuestion } from '../types';
import { BookOpenIcon, BeakerIcon, QuestionMarkCircleIcon } from '../constants';

interface InfoPanelProps {
  arrhythmia: Arrhythmia;
}

type Tab = 'theory' | 'criteria' | 'quiz';

const InfoPanel: React.FC<InfoPanelProps> = ({ arrhythmia }) => {
  const [activeTab, setActiveTab] = useState<Tab>('theory');

  const renderContent = () => {
    switch (activeTab) {
      case 'theory':
        return <TheoryTab description={arrhythmia.description} />;
      case 'criteria':
        return <CriteriaTab criteria={arrhythmia.criteria} />;
      case 'quiz':
        return <QuizTab questions={arrhythmia.quiz} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg flex flex-col h-full overflow-hidden">
      <div className="flex border-b border-slate-700">
        <TabButton icon={<BookOpenIcon className="w-5 h-5 mr-2"/>} label="Teoría" isActive={activeTab === 'theory'} onClick={() => setActiveTab('theory')} />
        <TabButton icon={<BeakerIcon className="w-5 h-5 mr-2"/>} label="Criterios" isActive={activeTab === 'criteria'} onClick={() => setActiveTab('criteria')} />
        <TabButton icon={<QuestionMarkCircleIcon className="w-5 h-5 mr-2"/>} label="Quiz" isActive={activeTab === 'quiz'} onClick={() => setActiveTab('quiz')} />
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
        className={`flex items-center justify-center px-4 py-3 font-medium text-sm transition-colors duration-200 focus:outline-none flex-1 ${
        isActive ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-slate-400 hover:bg-slate-700'
        }`}
    >
        {icon}
        {label}
    </button>
);


const TheoryTab: React.FC<{ description: string }> = ({ description }) => (
  <div className="prose prose-invert max-w-none text-slate-300">
    <p>{description}</p>
  </div>
);

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

const QuizTab: React.FC<{ questions: QuizQuestion[] }> = ({ questions }) => {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);
  
    if (!questions || questions.length === 0) {
      return <p>No hay quiz disponible para este ritmo.</p>;
    }
  
    const question = questions[currentQuestionIndex];
    const correctOption = question.options[question.correctAnswer];
    const isCorrect = selectedOption === correctOption;
  
    const handleOptionClick = (option: string) => {
      if(showFeedback) return;
      setSelectedOption(option);
      setShowFeedback(true);
    };

    const handleNext = () => {
        setShowFeedback(false);
        setSelectedOption(null);
        setCurrentQuestionIndex((prev) => (prev + 1) % questions.length);
    }
  
    return (
      <div>
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
