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
      {/* 3D Canvas Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* Welcome Overlay */}
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

      {/* UI Controls */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        
        {/* Top Bar */}
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
              title="Share App"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} />}
              {copied && (
                <span className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-green-500 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap">
                  Link Copied!
                </span>
              )}
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

        {/* Bottom Controls */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="pointer-events-auto flex flex-col md:flex-row gap-6 items-end justify-between"
            >
              {/* Control Panel */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-full md:w-auto max-w-md shadow-2xl">
                
                <div className="space-y-6">
                  {/* Shape Selector */}
                  <div>
                    <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Model</label>
                    <div className="flex gap-2 bg-black/50 p-1 rounded-lg border border-white/5">
                      {(['sphere', 'cube', 'torus', 'plane'] as ShapeType[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => setShape(s)}
                          className={`flex-1 py-2 px-3 rounded-md text-sm capitalize transition-all ${
                            shape === s 
                              ? 'bg-white/20 text-white shadow-sm' 
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color & Size */}
                  <div className="flex gap-6">
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Color</label>
                      <div className="flex items-center gap-3">
                        <input 
                          type="color" 
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                        />
                        <span className="text-sm font-mono text-gray-300">{color}</span>
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <label className="text-xs text-gray-400 uppercase tracking-wider mb-3 block">Size</label>
                      <input 
                        type="range" 
                        min="0.005" 
                        max="0.1" 
                        step="0.005"
                        value={particleSize}
                        onChange={(e) => setParticleSize(parseFloat(e.target.value))}
                        className="w-full accent-cyan-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Camera Widget */}
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex flex-col items-center gap-4 shadow-2xl">
                <div className="relative w-48 h-36 bg-black/80 rounded-lg overflow-hidden border border-white/5">
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover transform scale-x-[-1]" 
                    playsInline 
                    muted 
                  />
                  {!isCameraActive && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500 flex-col gap-2">
                      <CameraOff size={24} />
                      <span className="text-xs">Camera Off</span>
                    </div>
                  )}
                  {isCameraActive && (
                    <div className="absolute bottom-2 right-2 bg-black/60 px-2 py-1 rounded text-[10px] font-mono text-cyan-400 border border-cyan-400/30">
                      Openness: {(openness * 100).toFixed(0)}%
                    </div>
                  )}
                </div>
                
                {cameraError && (
                  <div className="text-xs text-red-400 text-center bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex flex-col gap-2">
                    <p>{cameraError}</p>
                    <button 
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="bg-red-500/20 hover:bg-red-500/30 text-red-300 py-1.5 px-3 rounded border border-red-500/30 transition-colors mt-1"
                    >
                      Open in New Tab
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={toggleCamera}
                  disabled={isCameraLoading}
                  className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                    isCameraLoading 
                      ? 'opacity-50 cursor-not-allowed bg-gray-500/20 text-gray-400 border border-gray-500/30' 
                      : isCameraActive 
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30' 
                        : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'
                  }`}
                >
                  <Camera size={16} />
                  {isCameraLoading ? 'Loading...' : isCameraActive ? 'Stop Tracking' : 'Start Hand Tracking'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
