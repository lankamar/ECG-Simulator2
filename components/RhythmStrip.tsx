import React, { useMemo, useRef, useState, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { ECGPoint } from '../types';

interface MeasPoint { x: number; y: number; }

const dataToSvg = (container: HTMLElement, p: MeasPoint, timeOffset: number, windowSec: number, yMin: number, yMax: number, pad: number, marginT: number, marginR: number, marginL: number, marginB: number) => {
  const w = container.offsetWidth - pad * 2;
  const h = container.offsetHeight - pad * 2;
  const chartW = w - marginL - marginR;
  const chartH = h - marginT - marginB;
  const sx = pad + marginL + ((p.x - timeOffset) / windowSec) * chartW;
  const sy = pad + marginT + ((yMax - p.y) / (yMax - yMin)) * chartH;
  return { sx, sy };
};

const measDirection = (dx: number, dy: number): 'h' | 'v' | 'both' => {
  if (dx > dy * 1.5) return 'h';
  if (dy > dx * 1.5) return 'v';
  return 'both';
};

interface RhythmStripProps {
  data: ECGPoint[];
  timeOffset: number;
  windowSeconds: number;
  isMeasMode?: boolean;
  title?: string;
}

const RhythmStrip: React.FC<RhythmStripProps> = ({ data, timeOffset, windowSeconds, isMeasMode, title }) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const [measPoints, setMeasPoints] = useState<MeasPoint[]>([]);

  const yMin = -1.5;
  const yMax = 1.5;
  const margin = { t: 5, r: 10, l: 10, b: 20 };
  const pad = 8;

  const calibrationPulse = useMemo(() => [
    { time: -0.5, value: 0 },
    { time: -0.4, value: 0 },
    { time: -0.4, value: 1 },
    { time: -0.2, value: 1 },
    { time: -0.2, value: 0 },
    { time: 0, value: 0 },
  ], []);

  const combinedData = useMemo(() => [...calibrationPulse, ...data], [calibrationPulse, data]);

  const xAxisTicks = useMemo(() => {
    const ticks = [];
    const startTime = Math.floor(timeOffset);
    const endTime = Math.ceil(timeOffset + windowSeconds);
    for (let i = startTime; i <= endTime; i++) {
      ticks.push(i);
    }
    return ticks;
  }, [timeOffset, windowSeconds]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMeasMode || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const w = rect.width - pad * 2;
    const h = rect.height - pad * 2;
    const chartW = w - margin.l - margin.r;
    const chartH = h - margin.t - margin.b;
    const relX = (e.clientX - rect.left - pad - margin.l) / chartW;
    const relY = (e.clientY - rect.top - pad - margin.t) / chartH;
    const x = timeOffset + relX * windowSeconds;
    const y = yMax - relY * (yMax - yMin);
    setMeasPoints(prev => prev.length >= 2 ? [{ x, y }] : [...prev, { x, y }]);
  }, [isMeasMode, timeOffset, windowSeconds]);

  const m = measPoints.length === 2 ? measPoints : null;
  const dx = m ? Math.abs(m[1].x - m[0].x) : 0;
  const dy = m ? Math.abs(m[1].y - m[0].y) : 0;
  const dir = m ? measDirection(dx, dy) : null;
  const timeDiff = dx;
  const ampDiff = dy;
  const bpm = dx > 0 ? Math.round(60 / dx) : 0;

  const toSvg = (p: MeasPoint) => {
    if (!containerRef.current) return { sx: 0, sy: 0 };
    return dataToSvg(containerRef.current, p, timeOffset, windowSeconds, yMin, yMax, pad, margin.t, margin.r, margin.l, margin.b);
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold text-slate-200 mb-2">{title || 'Tira de Ritmo'} - Derivación II (D2)</h3>
      <div ref={containerRef} className="bg-white rounded-md p-2 shadow-lg relative" style={{
        backgroundImage: `
          linear-gradient(rgba(255, 0, 0, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 0, 0, 0.2) 1px, transparent 1px),
          linear-gradient(rgba(255, 0, 0, 0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 0, 0, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: `5px 5px, 5px 5px, 25px 25px, 25px 25px`,
        aspectRatio: '6.67 / 1',
        cursor: isMeasMode ? 'crosshair' : 'default',
      }} onClick={handleClick}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={combinedData} margin={margin}>
            <CartesianGrid stroke="none" />
            <XAxis 
              type="number" 
              dataKey="time" 
              domain={[timeOffset, timeOffset + windowSeconds]} 
              allowDataOverflow={true}
              axisLine={false}
              tickLine={{ stroke: '#444' }}
              tick={{ fill: '#333', fontSize: 10 }}
              ticks={xAxisTicks}
              label={{ value: 'Tiempo (s)', position: 'insideBottom', offset: -5, fill: '#333', fontSize: 12 }}
            />
            <YAxis 
              domain={[yMin, yMax]}
              allowDataOverflow={true}
              axisLine={false}
              tickLine={{ stroke: '#444' }}
              tickFormatter={(value) => `${value.toFixed(1)}`}
              tick={{ fill: '#333', fontSize: 10 }}
              label={{ value: 'mV', angle: -90, position: 'insideLeft', fill: '#333', fontSize: 12 }}
            />
            <Line type="monotone" dataKey="value" stroke="#000000" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            <ReferenceLine x={0} stroke="#aaa" strokeDasharray="3 3" />
          </LineChart>
        </ResponsiveContainer>
        {isMeasMode && measPoints.length >= 1 && (
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
                      <text x={midX} y={topY - 8} fill="#eab308" fontSize={dir === 'h' ? 13 : 10} textAnchor="middle" fontWeight="bold">
                        {dir === 'h' ? `${bpm} BPM` : `${timeDiff.toFixed(2)}s`}
                      </text>
                    </>
                  )}
                  {(dir === 'v' || dir === 'both') && (
                    <>
                      <line x1={p2.sx} y1={p2.sy} x2={p2.sx} y2={p1.sy} stroke="#06b6d4" strokeWidth={1} />
                      <text x={rightX + 8} y={midY} fill="#06b6d4" fontSize={dir === 'v' ? 13 : 10} textAnchor="start" dominantBaseline="middle" fontWeight="bold">
                        {ampDiff.toFixed(2)} mV
                      </text>
                    </>
                  )}
                </>
              );
            })()}
          </svg>
        )}
        {isMeasMode && measPoints.length >= 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); setMeasPoints([]); }}
            className="absolute bottom-2 right-3 z-30 bg-slate-700 text-white text-xs px-2 py-0.5 rounded"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

export default RhythmStrip;
