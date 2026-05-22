import React, { useMemo, useRef, useState, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { ECGPoint } from '../types';

interface MeasPoint { x: number; y: number; }

interface RhythmStripProps {
  data: ECGPoint[];
  timeOffset: number;
  windowSeconds: number;
  isMeasMode?: boolean;
}

const RhythmStrip: React.FC<RhythmStripProps> = ({ data, timeOffset, windowSeconds, isMeasMode }) => {

  const containerRef = useRef<HTMLDivElement>(null);
  const [measPoints, setMeasPoints] = useState<MeasPoint[]>([]);

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
    const marginTop = 5;
    const marginLeft = 10;
    const chartH = rect.height - marginTop - 20;
    const chartW = rect.width - marginLeft - 10;
    const relX = (e.clientX - rect.left - marginLeft) / chartW;
    const relY = (e.clientY - rect.top - marginTop) / chartH;
    const x = timeOffset + relX * windowSeconds;
    const y = 1.5 - relY * 3;
    setMeasPoints(prev => prev.length >= 2 ? [{ x, y }] : [...prev, { x, y }]);
  }, [isMeasMode, timeOffset, windowSeconds]);

  const m = measPoints.length === 2 ? measPoints : null;
  const timeDiff = m ? Math.abs(m[1].x - m[0].x) : 0;
  const ampDiff = m ? Math.abs(m[1].y - m[0].y) : 0;
  const bpm = timeDiff > 0 ? Math.round(60 / timeDiff) : 0;

  const toSvg = (p: MeasPoint) => {
    if (!containerRef.current) return { sx: 0, sy: 0 };
    const marginTop = 5;
    const marginLeft = 10;
    const chartH = containerRef.current.offsetHeight - marginTop - 20;
    const chartW = containerRef.current.offsetWidth - marginLeft - 10;
    return {
      sx: marginLeft + ((p.x - timeOffset) / windowSeconds) * chartW,
      sy: marginTop + ((1.5 - p.y) / 3) * chartH,
    };
  };

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Tira de Ritmo - Derivación II (D2)</h3>
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
          <LineChart data={combinedData} margin={{ top: 5, right: 10, left: 10, bottom: 20 }}>
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
              domain={[-1.5, 1.5]} 
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
          <svg className="absolute inset-0 pointer-events-none z-20" style={{ padding: '2px' }}>
            {measPoints.map((p, i) => {
              const { sx, sy } = toSvg(p);
              return <circle key={i} cx={sx} cy={sy} r={5} fill={i === 0 ? '#eab308' : '#06b6d4'} />;
            })}
            {m && (() => {
              const p1 = toSvg(m[0]);
              const p2 = toSvg(m[1]);
              return (
                <>
                  <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p2.sy} stroke="#333" strokeWidth={1} strokeDasharray="4 2" />
                  <line x1={p1.sx} y1={p1.sy} x2={p2.sx} y2={p1.sy} stroke="#eab308" strokeWidth={0.5} strokeDasharray="2 2" />
                  <line x1={p2.sx} y1={p2.sy} x2={p2.sx} y2={p1.sy} stroke="#06b6d4" strokeWidth={0.5} strokeDasharray="2 2" />
                  <text x={(p1.sx + p2.sx) / 2} y={Math.min(p1.sy, p2.sy) - 6} fill="#eab308" fontSize={12} textAnchor="middle">
                    {timeDiff.toFixed(2)}s | {bpm} BPM
                  </text>
                  <text x={Math.max(p1.sx, p2.sx) + 6} y={(p1.sy + p2.sy) / 2} fill="#06b6d4" fontSize={12} textAnchor="start" dominantBaseline="middle">
                    {ampDiff.toFixed(2)}mV
                  </text>
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
