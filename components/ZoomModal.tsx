import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ECGPoint } from '../types';

interface MeasPoint { x: number; y: number; }

interface ZoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  allEcgData: Record<string, ECGPoint[]>;
  initialLeads: string[];
  timeOffset: number;
  windowSeconds: number;
  isMeasMode?: boolean;
}

const dataToSvg = (container: HTMLElement, p: MeasPoint, timeOffset: number, windowSec: number, yMin: number, yMax: number, marginT: number, marginR: number, marginL: number, marginB: number) => {
  const w = container.offsetWidth;
  const h = container.offsetHeight;
  const chartW = w - marginL - marginR;
  const chartH = h - marginT - marginB;
  return {
    sx: marginL + ((p.x - timeOffset) / windowSec) * chartW,
    sy: marginT + ((yMax - p.y) / (yMax - yMin)) * chartH,
  };
};

const measDirection = (dx: number, dy: number): 'h' | 'v' | 'both' => {
  if (dx > dy * 1.5) return 'h';
  if (dy > dx * 1.5) return 'v';
  return 'both';
};

const DetailedLeadChart: React.FC<{
  data: ECGPoint[];
  leadName: string;
  timeOffset: number;
  windowSeconds: number;
  measMode?: boolean;
  measPoints: MeasPoint[];
  onAddPoint: (p: MeasPoint) => void;
  onClear: () => void;
}> = ({ data, leadName, timeOffset, windowSeconds, measMode, measPoints, onAddPoint, onClear }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const yMin = -1.5;
    const yMax = 1.5;
    const margin = { t: 10, r: 10, l: 0, b: 5 };

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!measMode || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const chartW = rect.width - margin.l - margin.r;
      const chartH = rect.height - margin.t - margin.b;
      const relX = (e.clientX - rect.left - margin.l) / chartW;
      const relY = (e.clientY - rect.top - margin.t) / chartH;
      const x = timeOffset + relX * windowSeconds;
      const y = yMax - relY * (yMax - yMin);
      onAddPoint({ x, y });
    }, [measMode, timeOffset, windowSeconds, onAddPoint]);

    const m = measPoints.length === 2 ? measPoints : null;
    const dx = m ? Math.abs(m[1].x - m[0].x) : 0;
    const dy = m ? Math.abs(m[1].y - m[0].y) : 0;
    const dir = m ? measDirection(dx, dy) : null;
    const timeDiff = dx;
    const ampDiff = dy;
    const bpm = dx > 0 ? Math.round(60 / dx) : 0;

    const toSvg = (p: MeasPoint) => {
      if (!containerRef.current) return { sx: 0, sy: 0 };
      return dataToSvg(containerRef.current, p, timeOffset, windowSeconds, yMin, yMax, margin.t, margin.r, margin.l, margin.b);
    };

    return (
        <div ref={containerRef} className="w-full h-full relative bg-white rounded" style={{
            backgroundImage: `
              linear-gradient(rgba(255, 0, 0, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 0, 0, 0.2) 1px, transparent 1px),
              linear-gradient(rgba(255, 0, 0, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255, 0, 0, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: `5px 5px, 5px 5px, 25px 25px, 25px 25px`,
            aspectRatio: '4 / 1',
            cursor: measMode ? 'crosshair' : 'default',
        }} onClick={handleClick}>
            <span className="absolute top-1 left-2 text-black font-bold text-sm z-10">{leadName}</span>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={margin}>
                    <XAxis type="number" dataKey="time" domain={[timeOffset, timeOffset + windowSeconds]} hide={true} allowDataOverflow={true} />
                    <YAxis domain={[yMin, yMax]} hide={true} allowDataOverflow={true} />
                    <Line type="monotone" dataKey="value" stroke="#000000" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
            {measMode && measPoints.length >= 1 && (
              <svg className="absolute inset-0 pointer-events-none z-20">
                {measPoints.map((p, i) => {
                  const { sx, sy } = toSvg(p);
                  return <circle key={i} cx={sx} cy={sy} r={5} fill={i === 0 ? '#eab308' : '#06b6d4'} />;
                })}
                {m && (() => {
                  const p1 = toSvg(m[0]);
                  const p2 = toSvg(m[1]);
                  const midX = (p1.sx + p2.sx) / 2;
                  const midY = (p1.sy + p2.sy) / 2;
                  const topY = Math.min(p1.sy, p2.sy);
                  const rightX = Math.max(p1.sx, p2.sx);
                  return (
                    <>
                      <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#333" strokeWidth={1} strokeDasharray="4 2" />
                      {(dir === 'h' || dir === 'both') && (
                        <>
                          <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p1.sy} stroke="#eab308" strokeWidth={1} />
                          <text x={midX} y={topY - 8} fill="#eab308" fontSize={dir === 'h' ? 14 : 10} textAnchor="middle" fontWeight="bold">
                            {dir === 'h' ? `${bpm} BPM` : `${timeDiff.toFixed(2)}s`}
                          </text>
                        </>
                      )}
                      {(dir === 'v' || dir === 'both') && (
                        <>
                          <line x1={p2.sx} y1={p2.sy} x2={p2.sx} y2={p1.sy} stroke="#06b6d4" strokeWidth={1} />
                          <text x={rightX + 8} y={midY} fill="#06b6d4" fontSize={dir === 'v' ? 14 : 10} textAnchor="start" dominantBaseline="middle" fontWeight="bold">
                            {ampDiff.toFixed(2)} mV
                          </text>
                        </>
                      )}
                    </>
                  );
                })()}
              </svg>
            )}
            {measMode && measPoints.length >= 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); onClear(); }}
                className="absolute bottom-2 right-2 z-30 bg-slate-700 text-white text-xs px-2 py-0.5 rounded"
              >
                ✕
              </button>
            )}
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


const ZoomModal: React.FC<ZoomModalProps> = ({ isOpen, onClose, allEcgData, initialLeads, timeOffset, windowSeconds, isMeasMode }) => {
  const [lead1, setLead1] = useState<string | null>(null);
  const [lead2, setLead2] = useState<string | null>(null);
  const [measL1, setMeasL1] = useState<MeasPoint[]>([]);
  const [measL2, setMeasL2] = useState<MeasPoint[]>([]);

  useEffect(() => {
    if (isOpen) {
      setLead1(initialLeads[0] || 'DII');
      setLead2(initialLeads[1] || null);
      setMeasL1([]);
      setMeasL2([]);
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
            <LeadSelector allLeads={allLeadNames} selectedLead={lead1} onSelectLead={(v) => { setLead1(v); setMeasL1([]); }} label="Derivación 1" />
            <LeadSelector allLeads={allLeadNames} selectedLead={lead2} onSelectLead={(v) => { setLead2(v); setMeasL2([]); }} label="Derivación 2 (Comparación)" />
        </div>

        <div className="space-y-4">
            {lead1 && allEcgData[lead1] && (
                <DetailedLeadChart 
                    data={allEcgData[lead1]}
                    leadName={lead1}
                    timeOffset={timeOffset}
                    windowSeconds={windowSeconds}
                    measMode={isMeasMode}
                    measPoints={measL1}
                    onAddPoint={(p) => setMeasL1(prev => prev.length >= 2 ? [p] : [...prev, p])}
                    onClear={() => setMeasL1([])}
                />
            )}
            {lead2 && allEcgData[lead2] && (
                 <DetailedLeadChart 
                    data={allEcgData[lead2]}
                    leadName={lead2}
                    timeOffset={timeOffset}
                    windowSeconds={windowSeconds}
                    measMode={isMeasMode}
                    measPoints={measL2}
                    onAddPoint={(p) => setMeasL2(prev => prev.length >= 2 ? [p] : [...prev, p])}
                    onClear={() => setMeasL2([])}
                />
            )}
        </div>
      </div>
    </div>
  );
};

export default ZoomModal;
