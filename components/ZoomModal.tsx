import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ECGPoint } from '../types';

interface ZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  allEcgData: Record<string, ECGPoint[]>;
  initialLeads: string[];
  timeOffset: number;
  windowSeconds: number;
}

const DetailedLeadChart: React.FC<{
  data: ECGPoint[];
  leadName: string;
  timeOffset: number;
  windowSeconds: number;
}> = ({ data, leadName, timeOffset, windowSeconds }) => {
    return (
        <div className="w-full h-full relative bg-white rounded" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 0, 0, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 0, 0, 0.2) 1px, transparent 1px),
              linear-gradient(rgba(255, 0, 0, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 0, 0, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: `5px 5px, 5px 5px, 25px 25px, 25px 25px`,
            aspectRatio: '4 / 1',
        }}>
            <span className="absolute top-1 left-2 text-black font-bold text-sm z-10">{leadName}</span>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                    <XAxis type="number" dataKey="time" domain={[timeOffset, timeOffset + windowSeconds]} hide={true} allowDataOverflow={true} />
                    <YAxis domain={[-1.5, 1.5]} hide={true} allowDataOverflow={true} />
                    <Line type="monotone" dataKey="value" stroke="#000000" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};


const LeadSelector: React.FC<{
    allLeads: string[];
    selectedLead: string | null;
    onSelectLead: (lead: string | null) => void;
    label: string;
}> = ({ allLeads, selectedLead, onSelectLead, label }) => {
    return (
        <div className="flex flex-col">
            <label htmlFor={label} className="text-xs text-slate-400 mb-1">{label}</label>
            <select
                id={label}
                value={selectedLead || ''}
                onChange={(e) => onSelectLead(e.target.value === '' ? null : e.target.value)}
                className="bg-slate-700 border border-slate-600 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
                <option value="">{label === "Derivación 1" ? "Seleccionar" : "Ninguna"}</option>
                {allLeads.map(lead => (
                    <option key={lead} value={lead}>{lead}</option>
                ))}
            </select>
        </div>
    );
};


const ZoomModal: React.FC<ZoomModalProps> = ({ isOpen, onClose, allEcgData, initialLeads, timeOffset, windowSeconds }) => {
  const [lead1, setLead1] = useState<string | null>(null);
  const [lead2, setLead2] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLead1(initialLeads[0] || 'DII');
      setLead2(initialLeads[1] || null);
    }
  }, [isOpen, initialLeads]);
  
  const allLeadNames = useMemo(() => Object.keys(allEcgData), [allEcgData]);

  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
        onClick={onClose}
    >
      <div 
        className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-cyan-400">Análisis Detallado (Lupa)</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <LeadSelector allLeads={allLeadNames} selectedLead={lead1} onSelectLead={setLead1} label="Derivación 1" />
            <LeadSelector allLeads={allLeadNames} selectedLead={lead2} onSelectLead={setLead2} label="Derivación 2 (Comparación)" />
        </div>

        <div className="space-y-4">
            {lead1 && allEcgData[lead1] && (
                <DetailedLeadChart 
                    data={allEcgData[lead1]}
                    leadName={lead1}
                    timeOffset={timeOffset}
                    windowSeconds={windowSeconds}
                />
            )}
            {lead2 && allEcgData[lead2] && (
                 <DetailedLeadChart 
                    data={allEcgData[lead2]}
                    leadName={lead2}
                    timeOffset={timeOffset}
                    windowSeconds={windowSeconds}
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default ZoomModal;
