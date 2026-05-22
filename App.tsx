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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMeasMode, setIsMeasMode] = useState(false);
  const [isClassMode, setIsClassMode] = useState(false);

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
    <div className="flex h-screen bg-slate-900 font-sans overflow-hidden">
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="fixed top-4 left-4 z-50 sm:hidden bg-slate-800 p-2 rounded-lg shadow-lg border border-slate-700"
        aria-label="Abrir menú"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className={`fixed inset-0 z-40 bg-black/50 sm:hidden transition-opacity ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMobileMenuOpen(false)} />

      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 sm:static sm:transform-none sm:z-auto ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar 
          arrhythmias={arrhythmias} 
          selectedArrhythmia={selectedArrhythmia} 
          onSelectArrhythmia={(a) => { handleSelectArrhythmia(a); setIsMobileMenuOpen(false); }}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />
      </div>
      <main className="flex-grow p-2 sm:p-4 md:p-8 grid grid-cols-1 gap-4 sm:gap-8 overflow-y-auto pt-16 sm:pt-4 md:pt-8">
        <div className="flex flex-col min-h-0">
          <h2 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-4 text-slate-100 flex-shrink-0">{selectedArrhythmia.name}</h2>
          
            <div className="flex-grow mb-6 min-h-[400px]">
            <ECGMonitor 
              data={ecgData} 
              heartRate={selectedArrhythmia.criteria.rate}
              approximateBpm={selectedArrhythmia.approximateBpm}
              timeOffset={timeOffset}
              windowSeconds={MONITOR_WINDOW_SECONDS}
              isPlaying={isPlaying}
              playbackSpeed={playbackSpeed}
              setIsPlaying={setIsPlaying}
              setPlaybackSpeed={setPlaybackSpeed}
              onZoomLead={handleZoomLead}
              isMeasMode={isMeasMode}
              isClassMode={isClassMode}
              setIsMeasMode={setIsMeasMode}
              setIsClassMode={setIsClassMode}
            />
          </div>

          <div className="mb-8">
            <RhythmStrip
              data={ecgData['DII'] || []}
              timeOffset={timeOffset}
              windowSeconds={RHYTHM_STRIP_WINDOW_SECONDS}
              isMeasMode={isMeasMode}
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
        isMeasMode={isMeasMode}
      />
    </div>
  );
};

export default App;
