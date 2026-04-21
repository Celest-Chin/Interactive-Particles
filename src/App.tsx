import signatureImg from '../signature.png';
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Maximize, Minimize, Share2, Check, Camera, CameraOff } from 'lucide-react';
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
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [shape, setShape] = useState<'sphere' | 'cube' | 'torus' | 'plane'>('sphere');
  const [color, setColor] = useState('#3b82f6');
  const [particleSize, setParticleSize] = useState(0.05);

  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new ParticleEngine(containerRef.current);
    engineRef.current = engine;
    return () => engine.dispose();
  }, []);
 useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateSettings?.({
        shape,
        color,
        size: particleSize,
      });
    }
  }, [shape, color, particleSize]);
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

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
            <img src={signatureImg} alt="Signature" className="h-32 mb-12" />
            <span className="text-gray-400 text-2xl mb-12">Interactive Particles</span>
            <button onClick={() => { setShowWelcome(false); setShowCameraModal(true); }} className="px-8 py-3 rounded-full border border-blue-500 bg-blue-900/30 uppercase tracking-widest text-sm font-medium hover:bg-blue-800/40 transition-colors">
              Click to Enter
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <button onClick={() => setShowWelcome(true)} className="pointer-events-auto">
            <img src={signatureImg} alt="Logo" className="h-10" />
          </button>
          
          <div className="flex gap-4 pointer-events-auto">
            <button onClick={toggleCamera} className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md">
              {isCameraActive ? <CameraOff size={20} /> : <Camera size={20} />}
            </button>
            <button 
              onClick={async () => {
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: 'Interactive Particles',
                      text: '看看这个超酷的 3D 粒子效果！',
                      url: window.location.href,
                    });
                  } catch (err) {
                    console.log('用户取消分享');
                  }
                } else {
                  await navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }} 
              className="p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors backdrop-blur-md"
            >
              {copied ? <Check size={20} className="text-green-400" /> : <Share2 size={20} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showCameraModal && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md pointer-events-auto">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#1A1A1A] border border-white/10 p-8 rounded-2xl max-w-sm text-center shadow-2xl">
              <h3 className="text-xl font-bold mb-4">Camera access request</h3>
              <p className="text-gray-400 text-sm mb-8 leading-relaxed">This app requests access to Camera to work properly. Do you want to allow Camera access?</p>
              <div className="flex gap-4 justify-center">
                <button onClick={() => setShowCameraModal(false)} className="px-6 py-2 text-sm text-gray-400 hover:text-white transition-colors">Disallow</button>
                <button onClick={() => { setShowCameraModal(false); toggleCamera(); }} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors">Allow Camera access</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-10 left-10 z-20 pointer-events-auto p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl min-w-[280px]">
        <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-4">Model</p>
        <div className="flex gap-2 mb-6">
          {['Sphere', 'Cube', 'Torus', 'Plane'].map((m) => (
            <button 
              key={m} 
              onClick={() => setShape(m.toLowerCase() as any)}
              className={`px-4 py-1.5 rounded-md text-xs transition-all ${shape === m.toLowerCase() ? 'bg-white text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Color</p>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded bg-transparent cursor-pointer border border-white/20" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">Size</p>
            <input type="range" min="0.01" max="0.1" step="0.01" value={particleSize} onChange={(e) => setParticleSize(parseFloat(e.target.value))} className="w-full accent-blue-500 mt-2" />
          </div>
        </div>
      </div>
{/* 右下角相机控制面板 - 修正后的完整块 */}
      <div className="absolute bottom-10 right-10 z-20 pointer-events-auto">
        <div className="flex flex-col items-center gap-2 p-6 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl text-center">
          {isCameraActive ? (
            <Camera size={24} className="text-blue-400 mb-2" />
          ) : (
            <CameraOff size={24} className="text-gray-500 mb-2" />
          )}
          <span className="text-xs text-gray-400">
            {isCameraActive ? "Hand Tracking Active" : "Camera Off"}
          </span>
          <button 
            onClick={toggleCamera} 
            className={`mt-4 px-6 py-2 border rounded-lg text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${
              isCameraActive 
                ? 'bg-red-600/20 border-red-500/50 text-red-400 hover:bg-red-600/30' 
                : 'bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/30'
            }`}
          >
            {isCameraActive ? <><CameraOff size={14} /> Stop Tracking</> : <><Camera size={14} /> Start Tracking</>}
          </button>
        </div>
      </div>

      <video ref={videoRef} className="hidden" playsInline muted />
    </div>
  );
}
