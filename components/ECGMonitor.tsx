import React, { useMemo, useRef, useState, useCallback } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ECGPoint } from '../types';
import { MagnifyingGlassIcon } from '../constants';

const PlayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1H8zm3 0a1 1 0 00-1 1v4a1 1 0 001 1h1a1 1 0 001-1V8a1 1 0 00-1-1h-1z" clipRule="evenodd" />
  </svg>
);

type MeasPoint = { x: number; y: number };

const SpeedButton: React.FC<{ speed: number; currentSpeed: number; setSpeed: (speed: number) => void; }> = ({ speed, currentSpeed, setSpeed }) => (
    <button
        onClick={() => setSpeed(speed)}
        className={`px-2 py-0.5 rounded text-xs ${
            currentSpeed === speed
                ? 'bg-green-500 text-black font-bold'
                : 'bg-slate-700 text-green-400 hover:bg-slate-600'
        } transition-colors`}
    >
        {speed}x
    </button>
);

const MeasIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M21.707 3.293a1 1 0 010 1.414l-2 2a1 1 0 01-1.414 0L17 5.414l-4.293 4.293a3 3 0 01-4.243 4.243L3.293 8.707a1 1 0 111.414-1.414l5.171 5.171a1 1 0 001.414-1.414L5.414 4.707a1 1 0 111.414-1.414l6.172 6.171a1 1 0 001.414-1.414L14 5.414l-1.293-1.293a1 1 0 010-1.414l2-2a1 1 0 011.414 0L18 2.586 20.293.293a1 1 0 111.414 1.414L20 4l1.707 1.707a1 1 0 010 1.414l-2 2a1 1 0 01-1.414 0L17 8.414l-2.586 2.586a3 3 0 00.586 3.514l5.5 5.5a1 1 0 01-1.414 1.414l-5.5-5.5a3 3 0 00-3.514-.586L4.293 18H3v-1.293l3.086-3.086a1 1 0 111.414 1.414L6 16.586V17h.414l2.672-2.672a1 1 0 011.414-1.414l3.086 3.086a1 1 0 01-1.414 1.414L10 16.414 7.414 19H19a1 1 0 110 2H5a1 1 0 01-1-1v-5.586l4.293-4.293a1 1 0 011.414 1.414L7 15.586V17h.586l3.5-3.5a1 1 0 011.414 1.414l-2.086 2.086H17a1 1 0 110 2H8.414L6 20.414V21a1 1 0 01-1 1H3a1 1 0 01-1-1v-3.586l4.293-4.293a1 1 0 011.414 0l4.293 4.293a1 1 0 010 1.414l-2 2a1 1 0 01-1.414 0L7 19.414 5.414 21H6v-1.586l3.086-3.086a1 1 0 011.414 1.414L8 19.586V20h.586l1.5-1.5a1 1 0 011.414 0l2.5 2.5a1 1 0 01-1.414 1.414L11 21.414 9.414 23H11a1 1 0 110 2H5a1 1 0 01-1-1v-3.586l4.293-4.293a3 3 0 004.243-4.243L17 7.414l1.293 1.293a1 1 0 010 1.414l-2 2a1 1 0 01-1.414 0L13 9.414l-3.293 3.293a3 3 0 00-.586 3.514L11 18.414V19a1 1 0 01-1 1H9v-1.586l2.672-2.672a1 1 0 111.414 1.414L12 18.586V18h-.414l-2.5-2.5a1 1 0 01.586-1.707c.276 0 .5.224.5.5v.207l1.293 1.293a1 1 0 001.414-1.414L11.414 13.5a.5.5 0 01.707 0l2.5 2.5a.5.5 0 11-.707.707L13 15.914 12.586 16H14a1 1 0 110 2h-1.586l1.5 1.5a1 1 0 01-1.414 1.414L10 18.586V19a1 1 0 01-1 1H7a1 1 0 010-2h1.586l-2-2a1 1 0 010-1.414l2-2a1 1 0 011.414 0l2 2a1 1 0 010 1.414l-2 2a1 1 0 01-1.414 0L7 16.586V17h.586l1.5-1.5a1 1 0 011.414 0l1.5 1.5a1 1 0 01-1.414 1.414L9 18.586 8.586 19H10a1 1 0 110 2H7a1 1 0 01-1-1v-2.586L9.293 13.5l4.293-4.293a3 3 0 004.243-4.243L21.707 3.293z"/>
  </svg>
);

const MeasurableLeadChart: React.FC<{
  data: ECGPoint[]; timeOffset: number; window: number; leadName: string;
  measMode: boolean; measPoints: MeasPoint[]; onAddPoint: (lead: string, p: MeasPoint) => void;
  onClear: (lead: string) => void;
}> = ({ data, timeOffset, window, leadName, measMode, measPoints, onAddPoint, onClear }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const gridProps = { stroke: "#1a533b", strokeWidth: 0.5 };
    const majorGridProps = { ...gridProps, stroke: "#3e886d" };

    const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      if (!measMode || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const marginTop = 10;
      const chartH = rect.height - marginTop;
      const chartW = rect.width;
      const relX = (e.clientX - rect.left) / chartW;
      const relY = (e.clientY - rect.top - marginTop) / chartH;
      const x = timeOffset + relX * window;
      const y = 1.2 - relY * 2.4;
      onAddPoint(leadName, { x, y });
    }, [measMode, timeOffset, window, leadName, onAddPoint]);

    const m = measPoints.length === 2 ? measPoints : null;
    const timeDiff = m ? Math.abs(m[1].x - m[0].x) : 0;
    const ampDiff = m ? Math.abs(m[1].y - m[0].y) : 0;
    const bpm = timeDiff > 0 ? Math.round(60 / timeDiff) : 0;

    return (
      <div ref={containerRef} className="w-full h-full relative" onClick={handleClick} style={{ cursor: measMode ? 'crosshair' : 'default' }}>
        <span className="absolute top-0.5 left-1 sm:top-1 sm:left-2 text-green-400 font-mono text-[10px] sm:text-xs z-10">{leadName}</span>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid {...gridProps} horizontalCoordinatesGenerator={(props) => Array.from({length: 11}, (_, i) => (props.offset.top || 0) + i * 10)} verticalCoordinatesGenerator={(props) => Array.from({length: 51}, (_, i) => (props.offset.left || 0) + i * 10)} />
            <CartesianGrid {...majorGridProps} horizontalCoordinatesGenerator={(props) => Array.from({length: 3}, (_, i) => (props.offset.top || 0) + i * 50)} verticalCoordinatesGenerator={(props) => Array.from({length: 11}, (_, i) => (props.offset.left || 0) + i * 50)} />
            <XAxis type="number" dataKey="time" domain={[timeOffset, timeOffset + window]} hide={true} allowDataOverflow={true} />
            <YAxis domain={[-1.2, 1.2]} hide={true} />
            <Line type="monotone" dataKey="value" stroke="#00ff00" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
        {measPoints.length >= 1 && measMode && (
          <svg className="absolute inset-0 pointer-events-none z-20">
            {measPoints.map((p, i) => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return null;
              const marginTop = 10;
              const chartH = rect.height - marginTop;
              const chartW = rect.width;
              const sx = ((p.x - timeOffset) / window) * chartW;
              const sy = marginTop + ((1.2 - p.y) / 2.4) * chartH;
              return <circle key={i} cx={sx} cy={sy} r={4} fill={i === 0 ? '#ff0' : '#0ff'} />;
            })}
            {m && (() => {
              const rect = containerRef.current?.getBoundingClientRect();
              if (!rect) return null;
              const marginTop = 10;
              const chartH = rect.height - marginTop;
              const chartW = rect.width;
              const sx1 = ((m[0].x - timeOffset) / window) * chartW;
              const sy1 = marginTop + ((1.2 - m[0].y) / 2.4) * chartH;
              const sx2 = ((m[1].x - timeOffset) / window) * chartW;
              const sy2 = marginTop + ((1.2 - m[1].y) / 2.4) * chartH;
              return (
                <>
                  <line x1={sx1} y1={sy1} x2={sx2} y2={sy2} stroke="#fff" strokeWidth={1} strokeDasharray="4 2" />
                  <line x1={sx1} y1={sy1} x2={sx2} y2={sy1} stroke="#ff0" strokeWidth={0.5} strokeDasharray="2 2" />
                  <line x1={sx2} y1={sy2} x2={sx2} y2={sy1} stroke="#0ff" strokeWidth={0.5} strokeDasharray="2 2" />
                  <text x={(sx1 + sx2) / 2} y={sy1 - 6} fill="#ff0" fontSize={9} textAnchor="middle">
                    {timeDiff.toFixed(2)}s | {bpm} BPM
                  </text>
                  <text x={sx2 + 6} y={(sy1 + sy2) / 2} fill="#0ff" fontSize={9} textAnchor="start" dominantBaseline="middle">
                    {ampDiff.toFixed(2)}mV
                  </text>
                </>
              );
            })()}
          </svg>
        )}
        {measPoints.length >= 1 && measMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onClear(leadName); }}
            className="absolute bottom-1 right-1 z-30 bg-slate-800/80 text-white text-[10px] px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        )}
      </div>
    );
}
interface ECGMonitorProps {
  data: Record<string, ECGPoint[]>;
  heartRate: string;
  approximateBpm?: number;
  timeOffset: number;
  windowSeconds: number;
  isPlaying: boolean;
  playbackSpeed: number;
  setIsPlaying: (isPlaying: boolean) => void;
  setPlaybackSpeed: (speed: number) => void;
  onZoomLead: (leadName: string) => void;
}

const ECGMonitor: React.FC<ECGMonitorProps> = ({ 
    data, 
    heartRate, 
    approximateBpm,
    timeOffset, 
    windowSeconds,
    isPlaying,
    playbackSpeed,
    setIsPlaying,
    setPlaybackSpeed,
    onZoomLead
}) => {
  
  const [isMeasMode, setIsMeasMode] = useState(false);
  const [isClassMode, setIsClassMode] = useState(false);
  const [measPoints, setMeasPoints] = useState<Record<string, MeasPoint[]>>({});

  const handleAddPoint = useCallback((lead: string, p: MeasPoint) => {
    setMeasPoints(prev => {
      const current = prev[lead] || [];
      if (current.length >= 2) return { ...prev, [lead]: [p] };
      return { ...prev, [lead]: [...current, p] };
    });
  }, []);

  const handleClear = useCallback((lead: string) => {
    setMeasPoints(prev => {
      const next = { ...prev };
      delete next[lead];
      return next;
    });
  }, []);

  const heartRateValue = useMemo(() => {
     if (isClassMode) return '???';
     if (approximateBpm !== undefined && approximateBpm !== null) return approximateBpm;
     if (!heartRate) return '---';
     const rate = parseInt(heartRate, 10);
     if (!isNaN(rate)) return rate;
     if (heartRate.includes('<') || heartRate.includes('>')) return parseInt(heartRate.replace(/[^0-9]/g, ''), 10);
     if(heartRate.toLowerCase().includes('variable') || heartRate.toLowerCase().includes('depende')) return '---';
     if(heartRate === '0 L/m') return 0;
     const match = heartRate.match(/(\d+)\s*a\s*(\d+)/) || heartRate.match(/(\d+)-(\d+)/);
     if(match) return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
     return '---';
  }, [heartRate, approximateBpm, isClassMode]);

  const leadOrder = [
    ['DI', 'aVR', 'V1', 'V4'],
    ['DII', 'aVL', 'V2', 'V5'],
    ['DIII', 'aVF', 'V3', 'V6'],
  ];

  return (
    <div className="bg-black rounded-lg shadow-2xl p-2 sm:p-4 flex flex-col h-full">
        <div className="flex justify-between items-center text-green-400 font-mono mb-2 px-2">
            <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-sm sm:text-lg">12-LEAD ECG</span>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-slate-700 text-green-400 hover:bg-slate-600 p-1.5 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </button>
                <div className="flex items-center space-x-1 sm:space-x-2 text-xs">
                    <SpeedButton speed={0.5} currentSpeed={playbackSpeed} setSpeed={setPlaybackSpeed} />
                    <SpeedButton speed={1} currentSpeed={playbackSpeed} setSpeed={setPlaybackSpeed} />
                    <SpeedButton speed={2} currentSpeed={playbackSpeed} setSpeed={setPlaybackSpeed} />
                </div>
                <button
                  onClick={() => { setIsMeasMode(m => !m); if (isMeasMode) setMeasPoints({}); }}
                  className={`p-1.5 rounded text-xs transition-colors ${isMeasMode ? 'bg-amber-500 text-black' : 'bg-slate-700 text-green-400 hover:bg-slate-600'}`}
                  aria-label="Medir"
                  title="Medir (BPM / mV)"
                >
                  <MeasIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsClassMode(m => !m)}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${isClassMode ? 'bg-red-500 text-white' : 'bg-slate-700 text-green-400 hover:bg-slate-600'}`}
                  title="Modo Clase: oculta el BPM automático"
                >
                  {isClassMode ? 'CLASE' : 'CLASE'}
                </button>
            </div>
            <div className="text-right">
                <span className="text-xs sm:text-sm block text-gray-400">Latidos</span>
                <span className={`text-xl sm:text-2xl md:text-4xl font-bold ${isClassMode ? 'text-red-400' : 'text-green-300'}`}>{heartRateValue}</span>
            </div>
        </div>

      <div className="flex-grow w-full grid grid-cols-2 sm:grid-cols-4 gap-0.5 sm:gap-1">
        {leadOrder.flat().map(leadName => (
            <div key={leadName} className="relative h-16 sm:h-20 md:h-24 bg-black border border-slate-800 rounded group">
                <MeasurableLeadChart 
                    data={data[leadName] || []}
                    timeOffset={timeOffset}
                    window={windowSeconds}
                    leadName={leadName}
                    measMode={isMeasMode}
                    measPoints={measPoints[leadName] || []}
                    onAddPoint={handleAddPoint}
                    onClear={handleClear}
                />
                {!isMeasMode && (
                  <button
                      onClick={() => onZoomLead(leadName)}
                      className="absolute top-1 right-1 bg-slate-700/50 p-1 rounded-full text-green-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                      aria-label={`Zoom ${leadName}`}
                  >
                      <MagnifyingGlassIcon className="w-4 h-4" />
                  </button>
                )}
            </div>
        ))}
      </div>
       <div className="text-center text-green-500 text-xs font-mono mt-2">25 mm/s | 10 mm/mV</div>
    </div>
  );
};

export default ECGMonitor;
