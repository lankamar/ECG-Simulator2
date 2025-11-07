import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ECGMonitor from './components/ECGMonitor';
import InfoPanel from './components/InfoPanel';
import RhythmStrip from './components/RhythmStrip';
import ZoomModal from './components/ZoomModal';
import { arrhythmias } from './services/arrhythmiaData';
import { Arrhythmia } from './types';

const App: React.FC = () => {
  const [selectedArrhythmia, setSelectedArrhythmia] = useState<Arrhythmia>(arrhythmias[0]);
  
  const [timeOffset, setTimeOffset] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [zoomedLeads, setZoomedLeads] = useState<string[]>(['DII']);

  const ecgData = useMemo(() => {
    return selectedArrhythmia.generateECGData(20); // Generate 20 seconds of data
  }, [selectedArrhythmia]);
  
  const TOTAL_DURATION = ecgData['DI']?.length > 0 ? ecgData['DI'][ecgData['DI'].length - 1].time : 0;
  const MONITOR_WINDOW_SECONDS = 3;
  const RHYTHM_STRIP_WINDOW_SECONDS = 8;
  const ZOOM_WINDOW_SECONDS = 4;

  useEffect(() => {
    if (!isPlaying || TOTAL_DURATION <= MONITOR_WINDOW_SECONDS) {
      return;
    }

    const interval = setInterval(() => {
      setTimeOffset(prevOffset => {
        const loopWindow = Math.max(MONITOR_WINDOW_SECONDS, RHYTHM_STRIP_WINDOW_SECONDS);
        const nextOffset = prevOffset + (0.05 * playbackSpeed);
        return nextOffset >= TOTAL_DURATION - loopWindow ? 0 : nextOffset;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, TOTAL_DURATION]);

  const handleSelectArrhythmia = (arrhythmia: Arrhythmia) => {
    setSelectedArrhythmia(arrhythmia);
    setTimeOffset(0);
    setIsPlaying(true);
  };

  const handleZoomLead = (leadName: string) => {
    setZoomedLeads([leadName]);
    setIsZoomModalOpen(true);
  };

  const handleCloseZoom = () => {
    setIsZoomModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-slate-900 font-sans">
      <Sidebar 
        arrhythmias={arrhythmias} 
        selectedArrhythmia={selectedArrhythmia} 
        onSelectArrhythmia={handleSelectArrhythmia} 
      />
      <main className="flex-grow p-4 md:p-8 grid grid-cols-1 gap-8 overflow-y-auto">
        <div className="flex flex-col min-h-0">
          <h2 className="text-3xl font-bold mb-4 text-slate-100 flex-shrink-0">{selectedArrhythmia.name}</h2>
          
          <div className="flex-grow mb-6 min-h-[400px]">
            <ECGMonitor 
              data={ecgData} 
              heartRate={selectedArrhythmia.criteria.rate}
              timeOffset={timeOffset}
              windowSeconds={MONITOR_WINDOW_SECONDS}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              setIsPlaying={setIsPlaying}
              setPlaybackSpeed={setPlaybackSpeed}
              onZoomLead={handleZoomLead}
            />
          </div>

          <div className="mb-8">
            <RhythmStrip
              data={ecgData['DII'] || []}
              timeOffset={timeOffset}
              windowSeconds={RHYTHM_STRIP_WINDOW_SECONDS}
            />
          </div>

          <div className="flex-shrink-0">
             <InfoPanel arrhythmia={selectedArrhythmia} />
          </div>
        </div>
      </main>
      <ZoomModal
        isOpen={isZoomModalOpen}
        onClose={handleCloseZoom}
        allEcgData={ecgData}
        initialLeads={zoomedLeads}
        timeOffset={timeOffset}
        windowSeconds={ZOOM_WINDOW_SECONDS}
      />
    </div>
  );
};

export default App;