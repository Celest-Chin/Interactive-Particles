import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize, Minimize, Settings2, Share2, Check } from 'lucide-react';
import { ParticleEngine } from './lib/ParticleEngine';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new ParticleEngine(containerRef.current);
    engineRef.current = engine;
    return () => engine.dispose();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden font-sans text-white">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
          >
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col items-center">
              <span className="text-gray-400 text-2xl mb-8">Welcome to</span>
              <img src="./signature.png" alt="Signature" className="h-32 mb-12" />
              <span className="text-gray-400 text-2xl mb-12">Interactive Particles</span>
              <button 
                onClick={() => setShowWelcome(false)}
                className="px-8 py-3 rounded-full border border-blue-500 bg-blue-900/30 text-gray-200 uppercase tracking-widest"
              >
                Click to Enter
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="pointer-events-auto">
            <button onClick={() => setShowWelcome(true)} className="flex flex-col items-start focus:outline-none">
              <img src="./signature.png" alt="Logo" className="h-10" />
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Interactive Particles</p>
            </button>
          </div>
          
          <div className="flex gap-4 pointer-events-auto">
            <button onClick={handleShare} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10">
              {copied ? <Check size={20} /> : <Share2 size={20} />}
            </button>
            <button onClick={toggleFullscreen} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10">
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
