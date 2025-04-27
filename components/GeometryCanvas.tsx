"use client"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Grid, Environment } from "@react-three/drei"
import VesselGeometry from "./VesselGeometry"
import type { PointData } from "@/types"

interface GeometryCanvasProps {
  controlPoints: PointData[]
}

export default function GeometryCanvas({ controlPoints }: GeometryCanvasProps) {
  return (
    <Canvas shadows>
      <color attach="background" args={["#f5f5f5"]} />
      <PerspectiveCamera makeDefault position={[0, 1, 5]} />
      <ambientLight intensity={0.3} />
      <directionalLight
        position={[5, 5, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <VesselGeometry controlPoints={controlPoints} />
      <Grid
        args={[10, 10]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#a0a0a0"
        position={[0, -0.01, 0]}
        infiniteGrid
      />
      <OrbitControls enableDamping dampingFactor={0.05} minDistance={2} maxDistance={10} />
      <Environment preset="studio" />
    </Canvas>
  )
}
