import React from 'react';
import { motion } from 'motion/react';
import { Smartphone, Monitor, CheckCircle2 } from 'lucide-react';
import { AppMode } from '../types';

interface ModeSelectorProps {
  onSelect: (mode: AppMode) => void;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 z-[200] bg-slate-950 flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/20 blur-[120px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full relative z-10"
      >
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="inline-block p-3 bg-indigo-500/10 rounded-2xl mb-6 border border-indigo-500/20"
          >
            <CheckCircle2 className="text-indigo-400 w-8 h-8" />
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight">
            SELECT YOUR <span className="text-indigo-400">INTERFACE</span>
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Choose the optimized view for your current hardware setup. You can switch this later in settings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mobile Mode Option */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('mobile')}
            className="group relative bg-slate-900/50 border border-slate-800 hover:border-indigo-500/50 p-8 rounded-[32px] text-left transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Smartphone size={120} />
            </div>
            
            <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Smartphone className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Mobile App</h3>
            <p className="text-slate-400 leading-relaxed">
              Optimized for touch interfaces, vertical layouts, and field diagnostics. Perfect for smartphones and tablets.
            </p>
            
            <div className="mt-8 flex items-center text-indigo-400 font-semibold text-sm uppercase tracking-wider">
              Select Mobile View
              <motion.span 
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="ml-2"
              >
                →
              </motion.span>
            </div>
          </motion.button>

          {/* System Mode Option */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -5 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect('system')}
            className="group relative bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 p-8 rounded-[32px] text-left transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Monitor size={120} />
            </div>
            
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
              <Monitor className="w-8 h-8" />
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">System Type</h3>
            <p className="text-slate-400 leading-relaxed">
              Full-width dashboard for desktop monitors. Multi-pane analysis, advanced telemetry grids, and deep trace tools.
            </p>
            
            <div className="mt-8 flex items-center text-emerald-400 font-semibold text-sm uppercase tracking-wider">
              Select System View
              <motion.span 
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="ml-2"
              >
                →
              </motion.span>
            </div>
          </motion.button>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            OSM Live v2.5.0 • Secure CAN-Bus Bridge
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ModeSelector;
