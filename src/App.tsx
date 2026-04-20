import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize, Minimize, Settings2, Share2, Check, Camera, CameraOff } from 'lucide-react';
import { ParticleEngine } from './lib/ParticleEngine';
import { HandTracker } from './lib/HandTracker';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new ParticleEngine(containerRef.current);
    engineRef.current = engine;
    return () => engine.dispose();
  }, []);

  const toggleCamera = async () => {
    if (!videoRef.current) return;
    try {
      if (isCameraActive) {
        trackerRef.current?.stop();
        setIsCameraActive(false);
      } else {
        if (!trackerRef.current) {
          trackerRef.current = new HandTracker(videoRef.current);
          trackerRef.current.onHandGesture = (isOpen, openVal, x, y) => {
            engineRef.current?.updateHandGesture(isOpen, openVal);
            engineRef.current?.updateHandPosition(x, y);
          };
        }
        await trackerRef.current.start();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.error("Camera failed:", err);
    }
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden text-white">
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      <AnimatePresence>
        {showWelcome && (
          <motion.div exit={{ opacity: 0 }} className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
            <span className="text-gray-400 text-2xl mb-8">Welcome to</span>
            {/* Remove the dot below */}
            <img src="/Interactive-Particles/signature.png" alt="Signature" className="h-32 mb-12" />
            <span className="text-gray-400 text-2xl mb-12">Interactive Particles</span>
            <button onClick={() => setShowWelcome(false)} className="px-8 py-3 rounded-full border border-blue-500 bg-blue-900/30 uppercase tracking-widest">
              Click to Enter
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <button onClick={() => setShowWelcome(true)} className="pointer-events-auto">
            <img src="/Interactive-Particles/signature.png" alt="Logo" className="h-10" />
          </button>
          
          <div className="flex gap-4 pointer-events-auto">
            <button onClick={toggleCamera} className="p-3 rounded-full bg-white/5 border border-white/10">
              {isCameraActive ? <CameraOff size={20} /> : <Camera size={20} />}
            </button>
            <button onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }} className="p-3 rounded-full bg-white/5 border border-white/10">
              {copied ? <Check size={20} /> : <Share2 size={20} />}
            </button>
          </div>
        </div>
      </div>
      {/* Required for hand tracking */}
      <video ref={videoRef} className="hidden" playsInline muted />
    </div>
  );
}
