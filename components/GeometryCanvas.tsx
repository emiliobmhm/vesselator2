'use client';

import { Canvas } from '@react-three/fiber';
import { useState, useEffect } from 'react';
import Scene from './Scene'; // Asegurate que el import de tu escena esté bien

export default function CanvasWrapper() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-center p-4">Loading 3D view...</div>;
  }

  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
    >
      <Scene />
    </Canvas>
  );
}
