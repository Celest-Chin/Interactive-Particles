import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export class HandTracker {
  private handLandmarker: HandLandmarker | null = null;
  private videoElement: HTMLVideoElement;
  private isRunning = false;
  private lastVideoTime = -1;
  
  public onHandGesture?: (isOpen: boolean, openness: number, x: number, y: number) => void;
  
  constructor(videoElement: HTMLVideoElement) {
    this.videoElement = videoElement;
  }
  
  public async initialize() {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    
    this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
        delegate: "GPU"
      },
      runningMode: "VIDEO",
      numHands: 2
    });
  }
  
  public async start() {
    try {
      // Request camera FIRST to keep the user gesture context valid
      // Some browsers (like Safari) will deny permission if too much time passes
      // between the click event and the getUserMedia call.
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      this.videoElement.srcObject = stream;
      
      // Now initialize the model if needed (this might take a few seconds)
      if (!this.handLandmarker) {
        await this.initialize();
      }
      
      // Wait for video metadata to load
      await new Promise<void>((resolve) => {
        if (this.videoElement.readyState >= 1) { // HAVE_METADATA or higher
          resolve();
        } else {
          this.videoElement.onloadedmetadata = () => {
            resolve();
          };
        }
      });
      
      await this.videoElement.play();
      this.isRunning = true;
      this.detectFrame();
    } catch (err) {
      console.error("Error accessing webcam:", err);
      throw err;
    }
  }
  
  public stop() {
    this.isRunning = false;
    const stream = this.videoElement.srcObject as MediaStream;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    this.videoElement.srcObject = null;
  }
  
  private detectFrame = () => {
    if (!this.isRunning || !this.handLandmarker) return;
    
    // Ensure video has valid dimensions before passing to MediaPipe
    if (this.videoElement.videoWidth === 0 || this.videoElement.videoHeight === 0) {
      requestAnimationFrame(this.detectFrame);
      return;
    }
    
    if (this.videoElement.currentTime !== this.lastVideoTime) {
      this.lastVideoTime = this.videoElement.currentTime;
      
      try {
        const results = this.handLandmarker.detectForVideo(this.videoElement, performance.now());
        
        if (results.landmarks && results.landmarks.length > 0) {
          // Process first hand
          const landmarks = results.landmarks[0];
        
        // Calculate openness based on a scale-invariant ratio
        // We compare the distance of fingertips to the wrist vs the distance of finger bases (MCP) to the wrist.
        const wrist = landmarks[0];
        
        // Use 2D distance for more stable results from webcam
        const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
        
        // Average distance from wrist to fingertips
        const avgTipDist = (
          dist(wrist, landmarks[8]) +  // Index tip
          dist(wrist, landmarks[12]) + // Middle tip
          dist(wrist, landmarks[16]) + // Ring tip
          dist(wrist, landmarks[20])   // Pinky tip
        ) / 4;
        
        // Average distance from wrist to MCP joints (base of fingers)
        const avgMcpDist = (
          dist(wrist, landmarks[5]) +  // Index MCP
          dist(wrist, landmarks[9]) +  // Middle MCP
          dist(wrist, landmarks[13]) + // Ring MCP
          dist(wrist, landmarks[17])   // Pinky MCP
        ) / 4;
        
        // The ratio of tip distance to MCP distance is scale-invariant!
        // Open hand: fingers extended, tips are far away, ratio is typically > 2.0
        // Closed fist: fingers curled in, tips are close to palm, ratio is typically < 1.2
        const ratio = avgTipDist / avgMcpDist;
        
        // Map ratio to 0-1 openness (1.2 becomes 0%, 2.0 becomes 100%)
        let openness = (ratio - 1.2) / 0.8;
        openness = Math.max(0, Math.min(1, openness));
        
        const isOpen = openness > 0.5;
        
        if (this.onHandGesture) {
          // Invert X because the video element is mirrored via CSS (scale-x-[-1])
          this.onHandGesture(isOpen, openness, 1.0 - wrist.x, wrist.y);
        }
      }
      } catch (e) {
        console.error("MediaPipe detection error:", e);
      }
    }
    
    requestAnimationFrame(this.detectFrame);
  }
}
