import * as THREE from 'three';

export type ShapeType = 'sphere' | 'cube' | 'torus' | 'plane';

export class ParticleEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private particles: THREE.Points;
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  
  private particleCount = 10000;
  private currentShape: ShapeType = 'sphere';
  
  private positions: Float32Array;
  private targetPositions: Float32Array;
  private originalTargetPositions: Float32Array;
  private velocities: Float32Array;
  
  private animationFrameId: number = 0;
  
  // Interaction parameters
  private handScale: number = 1.0;
  private handSpread: number = 0.0; // 0 to 1
  private targetHandScale: number = 1.0;
  private targetHandSpread: number = 0.0;
  
  private targetHandX: number = 0.5;
  private targetHandY: number = 0.5;
  private currentHandX: number = 0.5;
  private currentHandY: number = 0.5;
  
  constructor(container: HTMLElement) {
    this.container = container;
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.camera.position.z = 5;
    
    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(this.renderer.domElement);
    
    this.positions = new Float32Array(this.particleCount * 3);
    this.targetPositions = new Float32Array(this.particleCount * 3);
    this.originalTargetPositions = new Float32Array(this.particleCount * 3);
    this.velocities = new Float32Array(this.particleCount * 3);
    
    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    
    this.material = new THREE.PointsMaterial({
      size: 0.02,
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    
    this.particles = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.particles);
    
    this.generateShape('sphere');
    
    window.addEventListener('resize', this.onWindowResize);
    
    this.animate();
  }
  
  public setShape(shape: ShapeType) {
    this.currentShape = shape;
    this.generateShape(shape);
  }
  
  public setColor(color: string) {
    this.material.color.set(color);
  }
  
  public setParticleSize(size: number) {
    this.material.size = size;
  }
  
  public updateHandPosition(x: number, y: number) {
    this.targetHandX = x;
    this.targetHandY = y;
  }
  
  public updateHandGesture(isOpen: boolean, openness: number) {
    // openness is roughly 0 (closed) to 1 (fully open)
    // When open -> particles diffuse/spread
    // When closed -> particles contract
    
    // Map openness to spread and scale
    this.targetHandSpread = openness;
    // Make the scale difference much more dramatic: 0.3 (closed) to 2.5 (open)
    this.targetHandScale = 0.3 + openness * 2.2; 
  }
  
  private generateShape(shape: ShapeType) {
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      let x = 0, y = 0, z = 0;
      
      if (shape === 'sphere') {
        const phi = Math.acos(-1 + (2 * i) / this.particleCount);
        const theta = Math.sqrt(this.particleCount * Math.PI) * phi;
        const r = 2;
        x = r * Math.cos(theta) * Math.sin(phi);
        y = r * Math.sin(theta) * Math.sin(phi);
        z = r * Math.cos(phi);
      } else if (shape === 'cube') {
        x = (Math.random() - 0.5) * 3;
        y = (Math.random() - 0.5) * 3;
        z = (Math.random() - 0.5) * 3;
      } else if (shape === 'torus') {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        const R = 1.5;
        const r = 0.5;
        x = (R + r * Math.cos(v)) * Math.cos(u);
        y = (R + r * Math.cos(v)) * Math.sin(u);
        z = r * Math.sin(v);
      } else if (shape === 'plane') {
        x = (Math.random() - 0.5) * 4;
        y = (Math.random() - 0.5) * 4;
        z = 0;
      }
      
      this.originalTargetPositions[i3] = x;
      this.originalTargetPositions[i3 + 1] = y;
      this.originalTargetPositions[i3 + 2] = z;
    }
  }
  
  private animate = () => {
    this.animationFrameId = requestAnimationFrame(this.animate);
    
    // Smoothly interpolate hand parameters
    this.handScale += (this.targetHandScale - this.handScale) * 0.1;
    this.handSpread += (this.targetHandSpread - this.handSpread) * 0.1;
    
    this.currentHandX += (this.targetHandX - this.currentHandX) * 0.05;
    this.currentHandY += (this.targetHandY - this.currentHandY) * 0.05;
    
    const time = performance.now() * 0.001;
    
    // Rotate the whole system slowly
    this.particles.rotation.y = time * 0.2;
    this.particles.rotation.x = time * 0.1;
    
    // Move the entire particle system based on hand position
    // Map normalized coordinates [0, 1] to world space
    this.particles.position.x = (this.currentHandX - 0.5) * 12;
    this.particles.position.y = -(this.currentHandY - 0.5) * 8;
    
    const positions = this.geometry.attributes.position.array as Float32Array;
    
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      
      // Base target position
      let tx = this.originalTargetPositions[i3];
      let ty = this.originalTargetPositions[i3 + 1];
      let tz = this.originalTargetPositions[i3 + 2];
      
      // Apply overall scale FIRST
      tx *= this.handScale;
      ty *= this.handScale;
      tz *= this.handScale;
      
      // Apply spread (noise/diffusion) based on hand openness
      if (this.handSpread > 0.01) {
        // Make the noise more chaotic and larger
        const spreadFactor = this.handSpread * 3.0;
        const noiseX = Math.sin(time * 3.0 + i * 0.13) * spreadFactor;
        const noiseY = Math.cos(time * 2.5 + i * 0.17) * spreadFactor;
        const noiseZ = Math.sin(time * 4.0 + i * 0.11) * spreadFactor;
        
        tx += noiseX;
        ty += noiseY;
        tz += noiseZ;
      }
      
      // Move current position towards target (make it slightly faster to respond)
      positions[i3] += (tx - positions[i3]) * 0.1;
      positions[i3 + 1] += (ty - positions[i3 + 1]) * 0.1;
      positions[i3 + 2] += (tz - positions[i3 + 2]) * 0.1;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    
    this.renderer.render(this.scene, this.camera);
  };
  
  private onWindowResize = () => {
    if (!this.container) return;
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
  };
  
  public dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    cancelAnimationFrame(this.animationFrameId);
    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();
    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
