"use client"

import { useRef, useMemo } from "react"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"
import type { ControlPoint, BaseParameters } from "@/types/curve"
import { generateVesselGeometry, generateBaseCylinderGeometry } from "@/utils/generateGeometry"
import { colors, materials } from "@/styles/theme"
import { Text } from "@react-three/drei"

interface VesselGeometryProps {
  baseParams: BaseParameters
  controlPoints: ControlPoint[]
}

export default function VesselGeometry({ baseParams, controlPoints }: VesselGeometryProps) {
  const groupRef = useRef<THREE.Group>(null)

  // Generate the base cylinder geometry
  const baseCylinderGeometry = useMemo(() => {
    return generateBaseCylinderGeometry(baseParams)
  }, [baseParams])

  // Generate the vessel profile geometry with wall thickness
  const profileGeometry = useMemo(() => {
    try {
      if (!controlPoints || controlPoints.length < 2) {
        console.warn("Not enough control points to generate vessel geometry.")
        return new THREE.BufferGeometry()
      }

      const adjustedControlPoints = [...controlPoints]

      // Fix first point to match base cylinder
      adjustedControlPoints[0] = {
        ...adjustedControlPoints[0],
        x: baseParams.outerDiameter / 2,
        y: 0,
      }

      // Fix last point to maxHeight
      const lastIndex = adjustedControlPoints.length - 1
      adjustedControlPoints[lastIndex] = {
        ...adjustedControlPoints[lastIndex],
        y: baseParams.maxHeight,
      }

      return generateVesselGeometry(adjustedControlPoints, baseParams)
    } catch (error) {
      console.error("Error in vessel profile geometry generation:", error)
      return new THREE.BufferGeometry()
    }
  }, [controlPoints, baseParams])

  // Position the geometries correctly
  useMemo(() => {
    baseCylinderGeometry.translate(0, baseParams.height / 2, 0)
  }, [baseCylinderGeometry, baseParams.height])

  // Gentle rotation animation
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001
    }
  })

  // Create a material for all vessel parts
  const vesselMaterial = (
    <meshStandardMaterial
      color={colors.vessel}
      roughness={materials.vessel.roughness}
      metalness={materials.vessel.metalness}
      emissive={materials.vessel.emissive}
      side={THREE.DoubleSide}
    />
  )

  const hasGeometry = controlPoints && controlPoints.length >= 2

  return (
    <group ref={groupRef}>
      {hasGeometry ? (
        <>
          {/* Base cylinder */}
          <mesh geometry={baseCylinderGeometry} castShadow receiveShadow>
            {vesselMaterial}
          </mesh>

          {/* Profile geometry - positioned at the top of the base cylinder */}
          <mesh geometry={profileGeometry} castShadow receiveShadow position={[0, baseParams.height, 0]}>
            {vesselMaterial}
          </mesh>
        </>
      ) : (
        <Text position={[0, 20, 0]} fontSize={10} color="red">
          Generating vessel...
        </Text>
      )}
    </group>
  )
}