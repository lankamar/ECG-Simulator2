import React, { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { ECGPoint } from '../types';

interface RhythmStripProps {
  data: ECGPoint[];
  timeOffset: number;
  windowSeconds: number;
}

const RhythmStrip: React.FC<RhythmStripProps> = ({ data, timeOffset, windowSeconds }) => {

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

  return (
    <div className="flex flex-col">
      <h3 className="text-lg font-semibold text-slate-200 mb-2">Tira de Ritmo - Derivación II (D2)</h3>
      <div className="bg-white rounded-md p-2 shadow-lg" style={{
        backgroundImage: `
          linear-gradient(rgba(255, 0, 0, 0.2) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 0, 0, 0.2) 1px, transparent 1px),
          linear-gradient(rgba(255, 0, 0, 0.4) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255, 0, 0, 0.4) 1px, transparent 1px)
        `,
        backgroundSize: `5px 5px, 5px 5px, 25px 25px, 25px 25px`,
        // Paper speed: 25 mm/s -> 1 large square (5mm) is 0.2s
        // Paper gain: 10 mm/mV -> 1 large square (5mm) is 0.5mV
        // To maintain this, the aspect ratio of a 1s x 1mV block should be (25mm / 20mm) = 1.25
        // Chart window is 8s wide. Voltage is -1.5 to 1.5 (3mV).
        // Width = 8s * 25mm/s = 200mm. Height = 3mV * 10mm/mV = 30mm. Aspect Ratio ~6.67
        aspectRatio: '6.67 / 1',
      }}>
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
      </div>
    </div>
  );
};

export default RhythmStrip;
