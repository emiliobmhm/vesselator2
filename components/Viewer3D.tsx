"use client"

import type React from "react"

import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Grid, Environment, Text } from "@react-three/drei"
import VesselGeometry from "./VesselGeometry"
import type { ControlPoint, BaseParameters } from "@/types/curve"
import { colors } from "@/styles/theme"

interface Viewer3DProps {
  baseParams: BaseParameters
  controlPoints: ControlPoint[]
}

export default function Viewer3D({ baseParams, controlPoints }: Viewer3DProps) {
  return (
    <Canvas shadows className="w-full h-full">
      <color attach="background" args={[colors.background]} />
      <PerspectiveCamera makeDefault position={[0, 150, 300]} fov={40} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[100, 100, 100]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <spotLight position={[-100, 100, 100]} intensity={0.8} angle={0.5} penumbra={1} castShadow />

      {/* Add error boundary to catch and log any rendering errors */}
      <ErrorBoundary>
        <VesselGeometry baseParams={baseParams} controlPoints={controlPoints} />
      </ErrorBoundary>

      <Grid
        args={[500, 500]}
        cellSize={10}
        cellThickness={0.5}
        cellColor="#CCCCCC" // Light gray grid lines
        position={[0, -0.1, 0]}
        infiniteGrid
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={50}
        maxDistance={500}
        target={[0, baseParams.maxHeight / 2, 0]}
      />
      <Environment preset="studio" />

      {/* Add axes helper */}
      <axesHelper args={[50]} />

      {/* Add a scale indicator */}
      <group position={[-100, 0, 0]}>
        <mesh position={[0, 50, 0]}>
          <boxGeometry args={[1, 100, 1]} />
          <meshStandardMaterial color="#CCCCCC" />
        </mesh>
        <Text position={[15, 0, 0]} fontSize={10} color="#CCCCCC" font="/fonts/GeistMono-Bold.ttf">
          100MM
        </Text>
      </group>
    </Canvas>
  )
}

// Simple error boundary component to catch and log rendering errors
function ErrorBoundary({ children }: { children: React.ReactNode }) {
  try {
    return <>{children}</>
  } catch (error) {
    console.error("Error rendering 3D scene:", error)
    return (
      <Text position={[0, 0, 0]} fontSize={20} color="red">
        Error rendering 3D scene. Check console for details.
      </Text>
    )
  }
}
