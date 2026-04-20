import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize, Minimize, Camera, CameraOff, Settings2, Share2, Check } from 'lucide-react';
import { ParticleEngine, ShapeType } from './lib/ParticleEngine';
import { HandTracker } from './lib/HandTracker';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<ParticleEngine | null>(null);
  const trackerRef = useRef<HandTracker | null>(null);
  
  const [showWelcome, setShowWelcome] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [copied, setCopied] = useState(false);
  
  const [shape, setShape] = useState<ShapeType>('sphere');
  const [color, setColor] = useState('#00ffff');
  const [particleSize, setParticleSize] = useState(0.02);
  const [openness, setOpenness] = useState(0);

  useEffect(() => {
    if (!containerRef.current) return;
    
    const engine = new ParticleEngine(containerRef.current);
    engineRef.current = engine;
    
    return () => {
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setShape(shape);
    }
  }, [shape]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setColor(color);
    }
  }, [color]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setParticleSize(particleSize);
    }
  }, [particleSize]);

  const toggleCamera = async () => {
    if (!videoRef.current || isCameraLoading) return;
    
    setIsCameraLoading(true);
    setCameraError(null);
    try {
      if (isCameraActive) {
        trackerRef.current?.stop();
        setIsCameraActive(false);
      } else {
        if (!trackerRef.current) {
          trackerRef.current = new HandTracker(videoRef.current);
          trackerRef.current.onHandGesture = (isOpen, openVal, x, y) => {
            setOpenness(openVal);
            engineRef.current?.updateHandGesture(isOpen, openVal);
            engineRef.current?.updateHandPosition(x, y);
          };
        }
        await trackerRef.current.start();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.error("Camera toggle failed:", err);
      setIsCameraActive(false);
      if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
        setCameraError("Camera access denied. This often happens inside preview frames. Please try opening the app in a new tab.");
      } else {
        setCameraError("Failed to access camera. Make sure it's not used by another app.");
      }
    } finally {
      setIsCameraLoading(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
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
            transition={{ duration: 1.5 }}
            className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto"
          >
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="flex flex-col items-center"
            >
              <span className="block text-gray-400 text-2xl md:text-4xl mb-8 font-light tracking-wide">Welcome to</span>
              
              <div className="mb-12 relative">
                <img 
                  src="/Portfolio-IP/signature.png" 
                  alt="Celest 凱棋 Signature" 
                  className="h-24 md:h-32 lg:h-40 object-contain drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]"
                />
              </div>

              <span className="block text-gray-400 text-2xl md:text-4xl mb-12 font-light tracking-wide">Interactive Particles</span>

              <button 
                onClick={() => setShowWelcome(false)}
                className="group relative px-8 py-3 rounded-full border border-blue-500/50 bg-blue-950/30 hover:bg-blue-900/40 hover:border-blue-400 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 via-blue-400/10 to-blue-600/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                <span className="relative text-gray-200 text-sm md:text-base tracking-[0.2em] uppercase font-medium">
                  Click to Enter
                </span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="pointer-events-auto">
            <button 
              onClick={() => setShowWelcome(true)}
              className="group flex flex-col items-start focus:outline-none"
            >
              <motion.img 
                src="/Portfolio-IP/signature.png" 
                alt="Celest Chin Signature"
                initial={{ filter: 'drop-shadow(0px 0px 0px rgba(0, 255, 255, 0))' }}
                animate={{ filter: 'drop-shadow(0px 0px 8px rgba(0, 255, 255, 0.6))' }}
                transition={{ duration: 3, delay: 0.5, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" }}
                className="h-10 md:h-12 object-contain transition-transform group-hover:scale-105"
              />
              <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] mt-1 ml-1">Interactive Particles</p>
            </button>
          </div>
          
          <div className="flex gap-4 pointer-events-auto">
            <button 
              onClick={handleShare}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md relative group"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} />}
            </button>
            <button 
              onClick={() => setShowControls(!showControls)}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md"
            >
              <Settings2 size={20} />
            </button>
            <button 
              onClick={toggleFullscreen}
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md"
            >
              {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
            </button>
          </div>
        </div>
      </div>
      <video ref={videoRef} className="hidden" playsInline muted />
    </div>
  );
}
