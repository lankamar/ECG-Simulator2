import React, { useState, useEffect } from 'react';
import { Arrhythmia, ArrhythmiaCategory } from '../types';
import { HeartIcon } from '../constants';

interface SidebarProps {
  arrhythmias: Arrhythmia[];
  selectedArrhythmia: Arrhythmia;
  onSelectArrhythmia: (arrhythmia: Arrhythmia) => void;
}

const groupArrhythmias = (arrhythmias: Arrhythmia[]) => {
  return arrhythmias.reduce((acc, arrhythmia) => {
    const category = arrhythmia.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(arrhythmia);
    return acc;
  }, {} as Record<string, Arrhythmia[]>);
};

const Sidebar: React.FC<SidebarProps> = ({ arrhythmias, selectedArrhythmia, onSelectArrhythmia }) => {
  const groupedArrhythmias = groupArrhythmias(arrhythmias);
  
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Automatically expand the category of the selected arrhythmia
    // This provides a good user experience when the app loads or selection changes
    if (selectedArrhythmia) {
      setExpandedCategory(selectedArrhythmia.category);
    }
  }, [selectedArrhythmia]);

  const toggleCategory = (category: string) => {
    setExpandedCategory(prev => (prev === category ? null : category));
  };
  
  const categoryOrder = [
    ArrhythmiaCategory.SUPRAVENTRICULARES,
    ArrhythmiaCategory.VENTRICULARES,
  ];

  return (
    <aside className="w-72 bg-slate-800 p-4 flex flex-col flex-shrink-0">
      <h1 className="text-2xl font-bold text-cyan-400 mb-6 flex items-center">
        <HeartIcon className="w-8 h-8 mr-2 text-red-500" />
        ECG Simulator
      </h1>
      <nav className="flex-grow overflow-y-auto pr-2">
        {categoryOrder.map(category => (
            groupedArrhythmias[category] && (
                <div key={category} className="mb-2">
                    <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex justify-between items-center text-xs font-bold uppercase text-slate-400 px-3 py-2 tracking-wider hover:bg-slate-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <span>{category}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-200 ${expandedCategory === category ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {expandedCategory === category && (
                        <ul className="pt-2 pl-2 border-l border-slate-700 ml-3">
                        {groupedArrhythmias[category].map((arrhythmia) => (
                            <li key={arrhythmia.id} className="mb-1">
                            <button
                                onClick={() => onSelectArrhythmia(arrhythmia)}
                                className={`w-full text-left px-4 py-2 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm ${
                                selectedArrhythmia.id === arrhythmia.id
                                    ? 'bg-cyan-500 text-white font-semibold shadow-lg'
                                    : 'text-slate-300 hover:bg-slate-700'
                                }`}
                            >
                                {arrhythmia.name}
                            </button>
                            </li>
                        ))}
                        </ul>
                    )}
                </div>
            )
        ))}
      </nav>
      <div className="text-xs text-slate-500 mt-4 text-center">
        <p>Basado en "Lectura del Electrocardiograma" de J. A. Cuence.</p>
        <p>&copy; 2024 - Educational Tool</p>
      </div>
    </aside>
  );
};

export default Sidebar;
