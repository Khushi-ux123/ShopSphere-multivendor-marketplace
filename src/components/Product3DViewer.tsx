/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { RotateCw, ZoomIn, ZoomOut, Eye, Minimize2, Sparkles, Box } from 'lucide-react';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Face {
  indices: number[];
  color: string;
}

interface Product3DViewerProps {
  productTitle: string;
  category: string;
  imageUrl?: string;
}

export const Product3DViewer: React.FC<Product3DViewerProps> = ({ productTitle, category, imageUrl }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  
  // Interactive 3D states
  const [zoom, setZoom] = useState<number>(1.2);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.015);
  const [viewMode, setViewMode] = useState<'solid' | 'neon' | 'wire'>('solid');
  const [lightIntensity, setLightIntensity] = useState<number>(0.8);

  const angleXRef = useRef<number>(0.5);
  const angleYRef = useRef<number>(0.5);
  const isDraggingRef = useRef<boolean>(false);
  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Generate 3D geometry vertices and faces based on product category
  const getGeometry = (): { vertices: Point3D[]; faces: Face[] } => {
    const titleLower = productTitle.toLowerCase();
    
    // 1. Headphones Geometry
    if (category.includes('audio') || titleLower.includes('phone') || titleLower.includes('ear')) {
      const vertices: Point3D[] = [];
      const faces: Face[] = [];
      
      // Left Earcup (cylinder)
      for (let i = 0; i < 8; i++) {
        const theta = (i * Math.PI) / 4;
        const x = Math.cos(theta) * 0.8;
        const y = Math.sin(theta) * 0.8;
        vertices.push({ x: -1.2, y, z: x - 0.2 }); // Outer face earcup 1
        vertices.push({ x: -0.8, y: y * 0.9, z: x * 0.9 - 0.2 }); // Inner face earcup 1
      }
      
      // Right Earcup
      for (let i = 0; i < 8; i++) {
        const theta = (i * Math.PI) / 4;
        const x = Math.cos(theta) * 0.8;
        const y = Math.sin(theta) * 0.8;
        vertices.push({ x: 0.8, y: y * 0.9, z: x * 0.9 - 0.2 }); // Inner face earcup 2
        vertices.push({ x: 1.2, y, z: x - 0.2 }); // Outer face earcup 2
      }

      // Headband Arc
      const headbandStartIndex = vertices.length;
      const arcSteps = 10;
      for (let i = 0; i < arcSteps; i++) {
        const alpha = (i * Math.PI) / (arcSteps - 1);
        const hx = Math.cos(alpha) * 1.1;
        const hy = -Math.sin(alpha) * 1.1 - 0.2;
        vertices.push({ x: hx, y: hy, z: -0.1 });
        vertices.push({ x: hx, y: hy, z: 0.1 });
      }

      // Construct Earcup faces
      for (let i = 0; i < 8; i++) {
        const next = (i + 1) % 8;
        // Left earcup sides
        faces.push({ indices: [i * 2, next * 2, next * 2 + 1, i * 2 + 1], color: '#312e81' });
        // Right earcup sides
        faces.push({ indices: [16 + i * 2, 16 + next * 2, 16 + next * 2 + 1, 16 + i * 2 + 1], color: '#312e81' });
      }

      // Headband link faces
      for (let i = 0; i < arcSteps - 1; i++) {
        const idx = headbandStartIndex + i * 2;
        faces.push({ indices: [idx, idx + 1, idx + 3, idx + 2], color: '#4f46e5' });
      }

      return { vertices, faces };
    }

    // 2. Ceramic / Mug / Vase Geometry (Cylinder with handle)
    if (category.includes('home') || titleLower.includes('mug') || titleLower.includes('cup') || titleLower.includes('ceramic') || titleLower.includes('vase')) {
      const vertices: Point3D[] = [];
      const faces: Face[] = [];
      
      const segments = 10;
      const height = 1.6;
      const radius = 0.6;
      
      // Top & Bottom circular vertices
      for (let i = 0; i < segments; i++) {
        const theta = (i * 2 * Math.PI) / segments;
        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;
        vertices.push({ x, y: -height / 2, z }); // Top
        vertices.push({ x, y: height / 2, z });  // Bottom
      }
      
      // Cylinder walls
      for (let i = 0; i < segments; i++) {
        const next = (i + 1) % segments;
        faces.push({
          indices: [i * 2, next * 2, next * 2 + 1, i * 2 + 1],
          color: '#d97706' // Warm terracotta/ceramic
        });
      }

      // Add a handle
      const hindex = vertices.length;
      vertices.push({ x: 0.8, y: -0.4, z: 0 });
      vertices.push({ x: 1.1, y: -0.2, z: 0 });
      vertices.push({ x: 1.1, y: 0.2, z: 0 });
      vertices.push({ x: 0.8, y: 0.4, z: 0 });

      faces.push({
        indices: [hindex, hindex + 1, hindex + 2, hindex + 3],
        color: '#b45309'
      });

      return { vertices, faces };
    }

    // 3. Books / Journals Geometry (Chiseled cuboid with pages)
    if (category.includes('stationery') || titleLower.includes('diary') || titleLower.includes('journal') || titleLower.includes('book')) {
      const vertices: Point3D[] = [
        // Front Cover (Z = -0.15)
        { x: -0.7, y: -1.0, z: -0.15 },
        { x: 0.7, y: -1.0, z: -0.15 },
        { x: 0.7, y: 1.0, z: -0.15 },
        { x: -0.7, y: 1.0, z: -0.15 },
        // Back Cover (Z = 0.15)
        { x: -0.7, y: -1.0, z: 0.15 },
        { x: 0.7, y: -1.0, z: 0.15 },
        { x: 0.7, y: 1.0, z: 0.15 },
        { x: -0.7, y: 1.0, z: 0.15 },
      ];

      const faces: Face[] = [
        { indices: [0, 1, 2, 3], color: '#166534' }, // Forest Green cover
        { indices: [5, 4, 7, 6], color: '#166534' }, // Back
        { indices: [0, 4, 5, 1], color: '#f5f5f4' }, // Top pages edge
        { indices: [1, 5, 6, 2], color: '#e7e5e4' }, // Outer pages edge
        { indices: [2, 6, 7, 3], color: '#f5f5f4' }, // Bottom pages edge
        { indices: [4, 0, 3, 7], color: '#15803d' }, // Binder spine
      ];

      return { vertices, faces };
    }

    // Default: Polyhedral Diamond Core / Jewelry Shape
    const vertices: Point3D[] = [
      { x: 0, y: -1.0, z: 0 }, // Top Apex
      { x: 0.8 * Math.cos(0), y: 0, z: 0.8 * Math.sin(0) },
      { x: 0.8 * Math.cos(2 * Math.PI / 5), y: 0, z: 0.8 * Math.sin(2 * Math.PI / 5) },
      { x: 0.8 * Math.cos(4 * Math.PI / 5), y: 0, z: 0.8 * Math.sin(4 * Math.PI / 5) },
      { x: 0.8 * Math.cos(6 * Math.PI / 5), y: 0, z: 0.8 * Math.sin(6 * Math.PI / 5) },
      { x: 0.8 * Math.cos(8 * Math.PI / 5), y: 0, z: 0.8 * Math.sin(8 * Math.PI / 5) },
      { x: 0, y: 1.0, z: 0 }, // Bottom Apex
    ];

    const faces: Face[] = [
      // Top halves
      { indices: [0, 1, 2], color: '#4338ca' },
      { indices: [0, 2, 3], color: '#4f46e5' },
      { indices: [0, 3, 4], color: '#6366f1' },
      { indices: [0, 4, 5], color: '#818cf8' },
      { indices: [0, 5, 1], color: '#4f46e5' },
      // Bottom halves
      { indices: [6, 2, 1], color: '#312e81' },
      { indices: [6, 3, 2], color: '#3730a3' },
      { indices: [6, 4, 3], color: '#4338ca' },
      { indices: [6, 5, 4], color: '#4f46e5' },
      { indices: [6, 1, 5], color: '#312e81' },
    ];

    return { vertices, faces };
  };

  // Drag listeners
  const startDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    setAutoRotate(false);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const handleDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - lastMousePosRef.current.x;
    const deltaY = clientY - lastMousePosRef.current.y;

    angleYRef.current += deltaX * 0.007;
    angleXRef.current += deltaY * 0.007;

    lastMousePosRef.current = { x: clientX, y: clientY };
  };

  const stopDrag = () => {
    isDraggingRef.current = false;
  };

  // Core render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      // Auto rotation logic
      if (autoRotate && !isDraggingRef.current) {
        angleYRef.current += rotationSpeed;
      }

      // Update 3D image rotation style!
      if (imgRef.current) {
        // Convert radians to degrees for CSS rotation
        const degY = (angleYRef.current * 180 / Math.PI) % 360;
        const degX = (angleXRef.current * 180 / Math.PI) % 360;
        
        // Gentle float bouncing over time
        const bounce = Math.sin(Date.now() / 800) * 8;
        
        // Apply perspective transform
        imgRef.current.style.transform = `perspective(800px) rotateY(${degY}deg) rotateX(${degX}deg) translateY(${bounce}px) scale(${zoom})`;
      }

      // Draw neat ambient grid pattern in background
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.03)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      const { vertices, faces } = getGeometry();

      // Transform and project points
      const radX = angleXRef.current;
      const radY = angleYRef.current;

      const cosX = Math.cos(radX);
      const sinX = Math.sin(radX);
      const cosY = Math.cos(radY);
      const sinY = Math.sin(radY);

      const projected: { x: number; y: number; originalZ: number }[] = [];

      vertices.forEach((vert) => {
        // Rotate around Y axis (yaw)
        let x1 = vert.x * cosY - vert.z * sinY;
        let z1 = vert.x * sinY + vert.z * cosY;

        // Rotate around X axis (pitch)
        let y2 = vert.y * cosX - z1 * sinX;
        let z2 = vert.y * sinX + z1 * cosX;

        // Apply scale & Perspective projection matrix
        const scaleFactor = 110 * zoom;
        const d = 3.5; // distance from projection screen
        const xp = (x1 * scaleFactor) / (z2 + d) + cx;
        const yp = (y2 * scaleFactor) / (z2 + d) + cy;

        projected.push({ x: xp, y: yp, originalZ: z2 });
      });

      // Shading light vector
      const light = { x: 0.5, y: -1.0, z: -1.5 };
      const len = Math.sqrt(light.x * light.x + light.y * light.y + light.z * light.z);
      light.x /= len;
      light.y /= len;
      light.z /= len;

      // Collect faces with depth for painter's algorithm sorting
      const sortedFaces = faces.map((face) => {
        // Find average depth Z
        let sumZ = 0;
        face.indices.forEach((idx) => {
          sumZ += projected[idx].originalZ;
        });
        const avgZ = sumZ / face.indices.length;
        return { face, avgZ };
      });

      // Sort back-to-front (depth test)
      sortedFaces.sort((a, b) => b.avgZ - a.avgZ);

      // Render faces
      sortedFaces.forEach(({ face }) => {
        if (face.indices.length < 3) return;

        // Draw solid or neon mesh
        ctx.beginPath();
        ctx.moveTo(projected[face.indices[0]].x, projected[face.indices[0]].y);
        for (let j = 1; j < face.indices.length; j++) {
          ctx.lineTo(projected[face.indices[j]].x, projected[face.indices[j]].y);
        }
        ctx.closePath();

        if (viewMode === 'solid') {
          // Calculate procedural shading intensity based on normal vector
          const p0 = vertices[face.indices[0]];
          const p1 = vertices[face.indices[1]];
          const p2 = vertices[face.indices[2]];

          // Cross product to get normal vector of original face
          const ux = p1.x - p0.x;
          const uy = p1.y - p0.y;
          const uz = p1.z - p0.z;
          const vx = p2.x - p0.x;
          const vy = p2.y - p0.y;
          const vz = p2.z - p0.z;

          const nx = uy * vz - uz * vy;
          const ny = uz * vx - ux * vz;
          const nz = ux * vy - uy * vx;
          const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

          let intensity = 0.5;
          if (nLen > 0) {
            const normal = { x: nx / nLen, y: ny / nLen, z: nz / nLen };
            // Dot product with light source
            const dot = normal.x * light.x + normal.y * light.y + normal.z * light.z;
            intensity = Math.max(0.15, Math.min(1.0, 0.4 + Math.abs(dot) * lightIntensity));
          }

          // Shading & Fill
          ctx.fillStyle = face.color;
          ctx.fill();

          // Smooth lighting overlay
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, intensity - 0.4) * 0.35})`;
          ctx.fill();
          ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, 0.6 - intensity) * 0.4})`;
          ctx.fill();

          // Stroke edges lightly for volume definitions
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.lineWidth = 1.2;
          ctx.stroke();

        } else if (viewMode === 'neon') {
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.85)';
          ctx.lineWidth = 2.5;
          ctx.shadowColor = 'rgba(99, 102, 241, 0.6)';
          ctx.shadowBlur = 10;
          ctx.stroke();
          ctx.shadowBlur = 0; // reset
          ctx.fillStyle = 'rgba(99, 102, 241, 0.05)';
          ctx.fill();
        } else {
          // Wireframe only
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      });

      // Draw sparkling particle points at vertices
      if (viewMode === 'neon' || viewMode === 'solid') {
        projected.forEach((pt) => {
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
          ctx.fill();
        });
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [category, productTitle, zoom, viewMode, rotationSpeed, autoRotate, lightIntensity]);

  return (
    <div className="bg-slate-950 dark:bg-black p-5 rounded-[2.5rem] border border-neutral-800 shadow-2xl relative overflow-hidden group select-none text-white">
      {/* Background glass glows */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl" />
      <div className="absolute bottom-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl" />

      {/* Controller HUD Toolbar */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
            <Box className="h-4 w-4 animate-bounce" />
          </span>
          <div>
            <h4 className="text-xs font-black font-display tracking-wide uppercase">ShopSphere 3D Viewer</h4>
            <p className="text-[9px] text-indigo-300 font-mono tracking-widest uppercase">Interactive Silicon Mesh</p>
          </div>
        </div>
        
        <div className="flex gap-1">
          <button
            onClick={() => setViewMode(prev => prev === 'solid' ? 'neon' : prev === 'neon' ? 'wire' : 'solid')}
            className="p-1.5 bg-white/5 hover:bg-white/15 rounded-lg border border-white/10 text-neutral-300 hover:text-white transition cursor-pointer text-[10px] font-bold flex items-center gap-1"
            title="Toggle shading physics model"
          >
            <Eye className="h-3 w-3 text-indigo-400" />
            <span>{viewMode === 'solid' ? 'Render solid' : viewMode === 'neon' ? 'Neon wire' : 'Simple line'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Drag Stage */}
      <div
        onMouseDown={startDrag}
        onMouseMove={handleDrag}
        onMouseUp={stopDrag}
        onMouseLeave={stopDrag}
        onTouchStart={startDrag}
        onTouchMove={handleDrag}
        onTouchEnd={stopDrag}
        className="w-full h-64 md:h-72 bg-gradient-to-b from-slate-950/60 to-slate-900/80 rounded-2xl border border-white/5 flex items-center justify-center relative cursor-grab active:cursor-grabbing overflow-hidden"
      >
        {imageUrl && (
          <img
            ref={imgRef}
            src={imageUrl}
            alt={productTitle}
            className="absolute w-32 h-32 md:w-36 md:h-36 object-contain rounded-2xl drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)] border border-white/10 p-2.5 bg-slate-950/45 backdrop-blur-sm pointer-events-none select-none z-0"
            referrerPolicy="no-referrer"
          />
        )}
        <canvas
          ref={canvasRef}
          width={380}
          height={280}
          className="relative z-10 max-w-full drop-shadow-[0_20px_40px_rgba(99,102,241,0.25)] pointer-events-none"
        />

        {/* Floating guidance banner */}
        <span className="absolute bottom-3 text-[9px] font-mono text-neutral-450 tracking-wider flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/5 pointer-events-none uppercase">
          <RotateCw className="h-2.5 w-2.5 animate-spin" style={{ animationDuration: '4s' }} />
          Hold &amp; Drag outer mesh to rotate orbit
        </span>
      </div>

      {/* Adjusters Toolbar */}
      <div className="relative z-10 grid grid-cols-2 gap-4 mt-4 bg-white/5 p-3 rounded-xl border border-white/5">
        
        {/* Zoom controls */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[8px] font-mono text-indigo-300 uppercase tracking-widest font-black">Camera Zoom</span>
          <div className="flex gap-1.5 items-center">
            <button
              onClick={() => setZoom(z => Math.max(0.6, z - 0.15))}
              className="p-1 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold border border-white/10 transition cursor-pointer flex items-center gap-0.5"
            >
              <ZoomOut className="h-3.5 w-3.5 text-neutral-400" />
              <span>Out</span>
            </button>
            <button
              onClick={() => setZoom(z => Math.min(2.2, z + 0.15))}
              className="p-1 px-3 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold border border-white/10 transition cursor-pointer flex items-center gap-0.5 animate-pulse"
            >
              <ZoomIn className="h-3.5 w-3.5 text-yellow-400" />
              <span>In</span>
            </button>
          </div>
        </div>

        {/* Physics controls */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[8px] font-mono text-indigo-300 uppercase tracking-widest font-black">Auto Orbit Rotations</span>
          <div className="flex items-center justify-between gap-1">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className={`p-1 px-2 text-[10px] font-bold rounded-lg border transition cursor-pointer ${
                autoRotate ? 'bg-indigo-600 text-white border-transparent' : 'bg-white/5 border-white/10 text-neutral-400'
              }`}
            >
              {autoRotate ? 'Orbit ACTIVE' : 'Orbit PAUSED'}
            </button>

            <input
              type="range"
              min={0.005}
              max={0.05}
              step={0.005}
              value={rotationSpeed}
              onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
              disabled={!autoRotate}
              className="w-16 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 opacity-60 hover:opacity-100"
              title="Rotation Speed slider"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
