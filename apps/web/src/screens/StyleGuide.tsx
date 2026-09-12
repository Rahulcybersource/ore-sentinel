import React from 'react';
import { motion } from 'framer-motion';
import { motionPresets } from '../theme/tokens';

export const StyleGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 p-8 md:p-12">
      <motion.div 
        variants={motionPresets.slideUp} 
        initial="initial" 
        animate="animate"
        className="max-w-4xl mx-auto space-y-16"
      >
        <header className="border-b border-navy-700 pb-6">
          <h1 className="text-3xl font-bold text-teal-500 mb-2">Design System / Style Guide</h1>
          <p className="text-slate-400">Tokens, Typography, and Motion Presets</p>
        </header>

        {/* Colors */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-l-4 border-teal-500 pl-3">Color Palette</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Navy */}
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-navy-900 border border-navy-700 shadow-md flex items-end p-3">
                <span className="font-mono text-xs text-slate-400">navy-900</span>
              </div>
              <div className="h-12 rounded-lg bg-navy-800 border border-navy-700 flex items-end p-2">
                <span className="font-mono text-xs text-slate-400">navy-800</span>
              </div>
              <div className="h-12 rounded-lg bg-navy-700 flex items-end p-2">
                <span className="font-mono text-xs text-slate-400">navy-700</span>
              </div>
            </div>

            {/* Teal */}
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-teal-500 flex items-end p-3">
                <span className="font-mono text-xs text-navy-900 font-bold">teal-500 (Primary)</span>
              </div>
              <div className="h-12 rounded-lg bg-teal-400 flex items-end p-2">
                <span className="font-mono text-xs text-navy-900">teal-400</span>
              </div>
              <div className="h-12 rounded-lg bg-teal-600 flex items-end p-2">
                <span className="font-mono text-xs text-navy-900">teal-600</span>
              </div>
            </div>

            {/* Amber */}
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-amber-500 flex items-end p-3">
                <span className="font-mono text-xs text-navy-900 font-bold">amber-500 (Alert)</span>
              </div>
              <div className="h-12 rounded-lg bg-amber-400 flex items-end p-2">
                <span className="font-mono text-xs text-navy-900">amber-400</span>
              </div>
              <div className="h-12 rounded-lg bg-amber-600 flex items-end p-2">
                <span className="font-mono text-xs text-navy-900">amber-600</span>
              </div>
            </div>

            {/* Danger */}
            <div className="space-y-2">
              <div className="h-24 rounded-lg bg-danger-500 flex items-end p-3">
                <span className="font-mono text-xs text-white font-bold">danger-500 (Risk)</span>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-l-4 border-amber-500 pl-3">Typography</h2>
          
          <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-8">
            <div className="space-y-2">
              <span className="text-xs font-mono text-teal-500 uppercase tracking-wider">Heading 1 (Sans)</span>
              <h1 className="text-4xl font-bold text-white">Balaghat Mine Complex</h1>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-mono text-teal-500 uppercase tracking-wider">Heading 2 (Sans)</span>
              <h2 className="text-2xl font-semibold text-slate-200">Production Overview</h2>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-mono text-teal-500 uppercase tracking-wider">Body Text (Sans)</span>
              <p className="text-slate-300 max-w-2xl leading-relaxed">
                The geological survey indicates stable ore reserves in the northern sector. Equipment deployment remains optimal, though scheduled maintenance is pending for excavator units 3 and 4.
              </p>
            </div>
            
            <div className="space-y-2">
              <span className="text-xs font-mono text-amber-500 uppercase tracking-wider">Data Labels (Mono)</span>
              <div className="flex gap-8">
                <div className="font-mono">
                  <div className="text-slate-400 text-sm">TONNAGE_YTD</div>
                  <div className="text-3xl text-teal-400 mt-1">1,245.8<span className="text-lg text-slate-500 ml-1">t</span></div>
                </div>
                <div className="font-mono">
                  <div className="text-slate-400 text-sm">SHORTFALL_RISK</div>
                  <div className="text-3xl text-danger-500 mt-1">14.2<span className="text-lg text-slate-500 ml-1">%</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Motion Presets */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold text-white border-l-4 border-danger-500 pl-3">Motion Presets</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 flex flex-col items-center justify-center h-48">
              <span className="text-sm text-slate-400 mb-4 font-mono">motionPresets.fadeIn</span>
              <motion.div 
                variants={motionPresets.fadeIn}
                initial="initial"
                whileInView="animate"
                viewport={{ once: false }}
                className="w-16 h-16 bg-teal-500 rounded-lg"
              />
            </div>

            <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 flex flex-col items-center justify-center h-48">
              <span className="text-sm text-slate-400 mb-4 font-mono">motionPresets.slideUp</span>
              <motion.div 
                variants={motionPresets.slideUp}
                initial="initial"
                whileInView="animate"
                viewport={{ once: false }}
                className="w-16 h-16 bg-amber-500 rounded-lg"
              />
            </div>

            <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 flex flex-col items-center justify-center h-48">
              <span className="text-sm text-slate-400 mb-4 font-mono">motionPresets.pulseAlert</span>
              <motion.div 
                variants={motionPresets.pulseAlert}
                initial="initial"
                animate="animate"
                className="w-16 h-16 bg-danger-500 rounded-lg shadow-[0_0_15px_rgba(255,69,0,0.5)]"
              />
            </div>
          </div>
        </section>

      </motion.div>
    </div>
  );
};
