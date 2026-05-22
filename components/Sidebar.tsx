import React, { useState, useEffect, useMemo } from 'react';
import { Arrhythmia, ArrhythmiaCategory } from '../types';
import { HeartIcon, MagnifyingGlassIcon } from '../constants';

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

type CategoryFilter = 'all' | ArrhythmiaCategory;

const Sidebar: React.FC<SidebarProps> = ({ arrhythmias, selectedArrhythmia, onSelectArrhythmia }) => {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

  const filteredArrhythmias = useMemo(() => {
    return arrhythmias.filter(a => {
      if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
      if (searchQuery && !a.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [arrhythmias, searchQuery, categoryFilter]);

  const groupedArrhythmias = groupArrhythmias(filteredArrhythmias);

  useEffect(() => {
    if (selectedArrhythmia) {
      setExpandedCategory(selectedArrhythmia.category);
    }
  }, [selectedArrhythmia]);

  useEffect(() => {
    if (searchQuery && filteredArrhythmias.length > 0) {
      const cats = Object.keys(groupedArrhythmias);
      if (cats.length === 1) setExpandedCategory(cats[0]);
    }
  }, [searchQuery, filteredArrhythmias]);

  const toggleCategory = (category: string) => {
    setExpandedCategory(prev => (prev === category ? null : category));
  };
  
  const categoryOrder = [
    ArrhythmiaCategory.SUPRAVENTRICULARES,
    ArrhythmiaCategory.VENTRICULARES,
  ];

  const filterTabs: { label: string; value: CategoryFilter }[] = [
    { label: 'Todas', value: 'all' },
    { label: 'Supraventriculares', value: ArrhythmiaCategory.SUPRAVENTRICULARES },
    { label: 'Ventriculares', value: ArrhythmiaCategory.VENTRICULARES },
  ];

  return (
    <aside className="w-72 bg-slate-800 p-4 flex flex-col flex-shrink-0">
      <h1 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center">
        <HeartIcon className="w-8 h-8 mr-2 text-red-500" />
        ECG Simulator
      </h1>

      <div className="relative mb-3">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          placeholder="Buscar arritmia..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-700 text-slate-200 text-sm placeholder-slate-500 border border-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      <div className="flex gap-1 mb-4">
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setCategoryFilter(tab.value)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-colors ${
              categoryFilter === tab.value
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <nav className="flex-grow overflow-y-auto pr-2">
        {categoryOrder.map(category => (
            groupedArrhythmias[category] && groupedArrhythmias[category].length > 0 && (
                <div key={category} className="mb-2">
                    <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex justify-between items-center text-xs font-bold uppercase text-slate-400 px-3 py-2 tracking-wider hover:bg-slate-700/50 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                        <span>{category} ({groupedArrhythmias[category].length})</span>
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
        {filteredArrhythmias.length === 0 && (
          <p className="text-slate-500 text-sm text-center mt-8">Sin resultados</p>
        )}
      </nav>
    <p className="text-xs">Diseñador y Desarrollador: Marcelo Omar Lancry Kamycki (@lankamar).</p>
    <p className="text-xs">© 2025 Marcelo Omar Lancry Kamycki.</p>
    </aside>
  );
};

export default Sidebar;
