import React, { useMemo } from 'react';
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

const MiniLeadChart: React.FC<{ data: ECGPoint[], timeOffset: number, window: number, leadName: string }> = ({ data, timeOffset, window, leadName }) => {
    
    const gridProps = {
        stroke: "#1a533b",
        strokeWidth: 0.5,
    };
    
    const majorGridProps = {
        ...gridProps,
        stroke: "#3e886d",
    };

    return (
        <div className="w-full h-full relative">
            <span className="absolute top-1 left-2 text-green-400 font-mono text-xs z-10">{leadName}</span>
             <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <CartesianGrid {...gridProps} horizontalCoordinatesGenerator={(props) => Array.from({length: 11}, (_, i) => (props.offset.top || 0) + i * 10)} verticalCoordinatesGenerator={(props) => Array.from({length: 51}, (_, i) => (props.offset.left || 0) + i * 10)} />
                    <CartesianGrid {...majorGridProps} horizontalCoordinatesGenerator={(props) => Array.from({length: 3}, (_, i) => (props.offset.top || 0) + i * 50)} verticalCoordinatesGenerator={(props) => Array.from({length: 11}, (_, i) => (props.offset.left || 0) + i * 50)} />
                    <XAxis type="number" dataKey="time" domain={[timeOffset, timeOffset + window]} hide={true} allowDataOverflow={true} />
                    <YAxis domain={[-1.5, 1.5]} hide={true} />
                    <Line type="monotone" dataKey="value" stroke="#00ff00" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
interface ECGMonitorProps {
  data: Record<string, ECGPoint[]>;
  heartRate: string;
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
    timeOffset, 
    windowSeconds,
    isPlaying,
    playbackSpeed,
    setIsPlaying,
    setPlaybackSpeed,
    onZoomLead
}) => {
  
  const heartRateValue = useMemo(() => {
     if (!heartRate) return '---';
     if(heartRate.includes('~')) return heartRate.replace('~','');
     const rate = parseInt(heartRate, 10);
     if (!isNaN(rate)) return rate;
     if (heartRate.includes('<') || heartRate.includes('>')) return parseInt(heartRate.replace(/[^0-9]/g, ''), 10);
     if(heartRate.toLowerCase().includes('variable') || heartRate.toLowerCase().includes('depende')) return '---';
     if(heartRate === '0 L/m') return 0;
     const match = heartRate.match(/(\d+)\s*a\s*(\d+)/) || heartRate.match(/(\d+)-(\d+)/);
     if(match) return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
     return '---';
  }, [heartRate]);

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
            </div>
            <div className="text-right">
                <span className="text-xs sm:text-sm block text-gray-400">HR</span>
                <span className="text-2xl sm:text-4xl font-bold text-green-300">{heartRateValue}</span>
            </div>
        </div>

      <div className="flex-grow w-full grid grid-cols-4 gap-1">
        {leadOrder.flat().map(leadName => (
            <div key={leadName} className="relative h-24 sm:h-32 bg-black border border-slate-800 rounded group">
                <MiniLeadChart 
                    data={data[leadName] || []}
                    timeOffset={timeOffset}
                    window={windowSeconds}
                    leadName={leadName}
                />
                <button
                    onClick={() => onZoomLead(leadName)}
                    className="absolute top-1 right-1 bg-slate-700/50 p-1 rounded-full text-green-400 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                    aria-label={`Zoom ${leadName}`}
                >
                    <MagnifyingGlassIcon className="w-4 h-4" />
                </button>
            </div>
        ))}
      </div>
       <div className="text-center text-green-500 text-xs font-mono mt-2">25 mm/s | 10 mm/mV</div>
    </div>
  );
};

export default ECGMonitor;