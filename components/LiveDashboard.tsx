
import React, { useState, useRef, useEffect } from 'react';
import { Menu, X, Bluetooth, Zap, LayoutDashboard, Database, Send, BarChart3, Activity, ArrowLeft, ShieldCheck, Settings2, Smartphone, Cpu, PlayCircle } from 'lucide-react';
import { CANFrame, ConnectionStatus, ConversionLibrary, SignalAnalysis, TransmitFrame, AppMode } from '../types.ts';
import CANMonitor from './CANMonitor.tsx';
import LibraryPanel from './LibraryPanel.tsx';
import TransmitPanel from './TransmitPanel.tsx';
import LiveVisualizerDashboard from './LiveVisualizerDashboard.tsx';
import TraceAnalysisDashboard from './TraceAnalysisDashboard.tsx';

interface LiveDashboardProps {
  status: ConnectionStatus;
  frames: CANFrame[];
  library: ConversionLibrary;
  latestFrames: Record<string, CANFrame>;
  onDisconnect: () => void;
  isSimulated?: boolean;
  // Transmit handlers
  onSendMessage: (id: string, dlc: number, data: string[]) => void;
  onScheduleMessage: (frame: TransmitFrame) => void;
  onStopMessage: (id: string) => void;
  activeSchedules: Record<string, TransmitFrame>;
  // State for Trace
  isPaused: boolean;
  isSaving: boolean;
  autoSaveEnabled: boolean;
  onToggleAutoSave: () => void;
  onClearTrace: () => void;
  onSaveTrace: () => void;
  // State for Decoded Data
  onSaveDecoded: () => void;
  isSavingDecoded: boolean;
  // Analysis Props
  selectedAnalysisSignals: string[];
  setSelectedAnalysisSignals: React.Dispatch<React.SetStateAction<string[]>>;
  selectedVisualizerSignals: string[];
  setSelectedVisualizerSignals: React.Dispatch<React.SetStateAction<string[]>>;
  watcherActive: boolean;
  setWatcherActive: React.Dispatch<React.SetStateAction<boolean>>;
  lastAiAnalysis: (SignalAnalysis & { isAutomatic?: boolean }) | null;
  aiLoading: boolean;
  onManualAnalyze: () => void;
  appMode: AppMode;
}

const LiveDashboard: React.FC<LiveDashboardProps> = (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [tab, setTab] = useState<'trace' | 'data' | 'tx_tool' | 'visualizer' | 'analysis'>('trace');

  const menuItems = [
    { id: 'trace', label: 'Live Trace', icon: LayoutDashboard },
    { id: 'data', label: 'Data', icon: Database },
    { id: 'tx_tool', label: 'TX Tool', icon: Send },
    { id: 'visualizer', label: 'Visualizer', icon: Activity },
    { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  ];

  return (
    <div className="h-full w-full flex flex-row bg-white overflow-hidden relative">
      {/* Permanent Sidebar for System Mode */}
      {props.appMode === 'system' && (
        <aside className="w-64 bg-slate-50 border-r flex flex-col shrink-0">
          <div className="p-6 border-b bg-white">
            <h1 className="text-sm font-orbitron font-black text-indigo-600 uppercase tracking-widest">OSM_SYSTEM</h1>
            <p className="text-[8px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">Diagnostic_Workstation</p>
          </div>
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map(item => (
              <button 
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-[9px] font-orbitron font-black uppercase transition-all text-left ${tab === item.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200/50'}`}
              >
                <item.icon size={16} /> {item.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t bg-white">
            <button 
              onClick={props.onDisconnect}
              className="w-full flex items-center gap-3 p-3 rounded-xl text-[9px] font-orbitron font-black uppercase text-red-500 hover:bg-red-50 transition-all text-left"
            >
              <X size={16} /> Terminate
            </button>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header matching Data Decoder style */}
        <header className="h-16 md:h-20 bg-white border-b flex items-center justify-between px-4 md:px-8 shrink-0 z-[110] shadow-sm">
          {props.appMode === 'mobile' && (
            <button 
              onClick={() => setIsMenuOpen(true)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-all active:scale-95 text-slate-600"
            >
              <Menu size={24} />
            </button>
          )}
          
          {props.appMode === 'system' && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Cpu size={20} />
              </div>
              <div className="hidden sm:block">
                <h3 className="text-xs font-bold text-slate-900">Workstation_Node</h3>
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Active_Session</p>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col items-center min-w-0">
            <h2 className={`text-[10px] md:text-[12px] font-orbitron font-black uppercase tracking-[0.3em] truncate ${props.isSimulated ? 'text-amber-600' : 'text-indigo-600'}`}>
              {props.isSimulated ? 'HARDWARE_SIMULATION_ACTIVE' : 'HARDWARE_LIVE_SESSION'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
               <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${props.isSimulated ? 'bg-amber-500' : 'bg-emerald-500'}`} />
               <span className="text-[8px] font-mono text-slate-400 font-bold uppercase tracking-widest">
                 {props.isSimulated ? 'Simulating_Internal_Bus' : 'Linked_to_Bus'}
               </span>
            </div>
          </div>

          {props.appMode === 'mobile' ? (
            <button 
              onClick={props.onDisconnect}
              className="p-2 hover:bg-red-50 rounded-xl transition-all active:scale-95 text-red-400"
              title="Terminate Link"
            >
              <X size={24} />
            </button>
          ) : (
            <div className="flex items-center gap-4">
               <div className="text-right hidden md:block">
                 <p className="text-[9px] font-bold text-slate-900">{props.status.toUpperCase()}</p>
                 <p className="text-[7px] text-slate-400 font-bold tracking-tighter">BRIDGE_STATUS</p>
               </div>
               <div className={`w-2 h-2 rounded-full ${props.status === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
            </div>
          )}
        </header>

        {/* Hamburger Sidebar (Mobile Only) */}
        {isMenuOpen && props.appMode === 'mobile' && (
        <div className="fixed inset-0 z-[200] flex">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
          <aside className="relative w-72 md:w-80 bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b flex items-center justify-between">
              <span className="text-[10px] font-orbitron font-black text-indigo-600 uppercase tracking-widest">Bridge_Menu</span>
              <button onClick={() => setIsMenuOpen(false)} className="p-1 text-slate-400"><X size={20} /></button>
            </div>
            
            <nav className="flex-1 overflow-y-auto p-4 space-y-2">
              {menuItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => { setTab(item.id as any); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-orbitron font-black uppercase transition-all text-left ${tab === item.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  <item.icon size={18} /> {item.label}
                </button>
              ))}

              <div className="h-px bg-slate-100 my-4"></div>
              
              <button 
                onClick={() => { setIsMenuOpen(false); props.onDisconnect(); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl text-[10px] font-orbitron font-black uppercase text-red-500 hover:bg-red-50 transition-all text-left"
              >
                <X size={18} /> {props.isSimulated ? 'Stop Simulation' : 'Terminate Link'}
              </button>
            </nav>
            <div className="p-6 bg-slate-50 border-t">
              <div className="flex items-center gap-2 text-[8px] font-orbitron font-black text-slate-400 uppercase tracking-widest">
                <ShieldCheck size={12} /> {props.isSimulated ? 'simulator_v4.2_active' : 'hardware_link_v12.0_enc'}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col min-h-0 bg-white">
        {tab === 'trace' && (
          <div className="flex-1 p-4 md:p-6 overflow-hidden">
            <CANMonitor 
              frames={props.frames}
              isPaused={props.isPaused}
              library={props.library}
              onClearTrace={props.onClearTrace}
              onSaveTrace={props.onSaveTrace}
              isSaving={props.isSaving}
              autoSaveEnabled={props.autoSaveEnabled}
              onToggleAutoSave={props.onToggleAutoSave}
            />
          </div>
        )}

        {tab === 'data' && (
          <LibraryPanel 
            library={props.library}
            onUpdateLibrary={() => {}} // Read-only in live dashboard
            latestFrames={props.latestFrames}
            onSaveDecoded={props.onSaveDecoded}
            isSavingDecoded={props.isSavingDecoded}
          />
        )}

        {tab === 'tx_tool' && (
          <TransmitPanel 
            onSendMessage={props.onSendMessage}
            onScheduleMessage={props.onScheduleMessage}
            onStopMessage={props.onStopMessage}
            activeSchedules={props.activeSchedules}
          />
        )}

        {tab === 'visualizer' && (
          <LiveVisualizerDashboard 
            frames={props.frames}
            library={props.library}
            latestFrames={props.latestFrames}
            selectedSignalNames={props.selectedVisualizerSignals}
            setSelectedSignalNames={props.setSelectedVisualizerSignals}
          />
        )}

        {tab === 'analysis' && (
          <TraceAnalysisDashboard 
            frames={props.frames}
            library={props.library}
            latestFrames={props.latestFrames}
            selectedSignalNames={props.selectedAnalysisSignals}
            setSelectedSignalNames={props.setSelectedAnalysisSignals}
            watcherActive={props.watcherActive}
            setWatcherActive={props.setWatcherActive}
            lastAiAnalysis={props.lastAiAnalysis}
            aiLoading={props.aiLoading}
            onManualAnalyze={props.onManualAnalyze}
          />
        )}
      </main>
      
      <div className="h-6 bg-slate-100 border-t flex items-center justify-between px-6 text-[8px] font-orbitron font-black text-slate-400 uppercase tracking-widest shrink-0">
         <div className="flex gap-6"><span>{props.frames.length.toLocaleString()} Pkts_{props.isSimulated ? 'Sim' : 'Live'}</span><span>{props.isSimulated ? 'INTERNAL_EMULATOR' : 'BRIDGE_ACTIVE_LINK'}</span></div>
         <div className="flex items-center gap-2">HARDWARE_TELEMETRY_ENGINE</div>
      </div>
      </div>
    </div>
  );
};

export default LiveDashboard;
