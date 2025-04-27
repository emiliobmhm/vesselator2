"use client"

import { useState, useEffect } from "react"
import ControlPanel from "@/components/ControlPanel"
import Viewer3D from "@/components/Viewer3D"
import { Button } from "@/components/ui/button"
import { PanelRightOpen, PanelRightClose } from "lucide-react"
import type { ControlPoint, BaseParameters } from "@/types/curve"
import { colors, typography } from "@/styles/theme"

export default function Home() {
  // Base cylinder parameters with updated ranges (now in mm)
  const [baseParams, setBaseParams] = useState<BaseParameters>({
    outerDiameter: 100, // mm (default 100mm)
    height: 5, // mm (default 5mm)
    wallThickness: 2, // mm (0.2cm = 2mm)
    maxHeight: 150, // mm (maximum total height including base)
  })

  // Control points for the profile curve (now in mm)
  const [controlPoints, setControlPoints] = useState<ControlPoint[]>([
    { x: 50, y: 0, isSmooth: true, isFixed: true },
    { x: 70, y: 50, isSmooth: true, isFixed: false },
    { x: 60, y: 100, isSmooth: true, isFixed: false },
    { x: 40, y: 150, isSmooth: true, isFixed: true },
  ])

  // Panel visibility state for mobile
  const [isPanelVisible, setIsPanelVisible] = useState(true)

  // Initialize control points properly
  useEffect(() => {
    // Ensure the first point matches the base cylinder diameter
    // and the last point is at maxHeight
    const initialPoints = [...controlPoints]

    initialPoints[0] = {
      ...initialPoints[0],
      x: baseParams.outerDiameter / 2,
      y: 0,
    }

    const lastIndex = initialPoints.length - 1
    initialPoints[lastIndex] = {
      ...initialPoints[lastIndex],
      y: baseParams.maxHeight,
    }

    setControlPoints(initialPoints)
  }, [])

  // Handle base parameter changes
  const handleBaseParamChange = (newParams: BaseParameters) => {
    // If outer diameter changes, update the first control point
    if (newParams.outerDiameter !== baseParams.outerDiameter) {
      const newPoints = [...controlPoints]
      newPoints[0] = {
        ...newPoints[0],
        x: newParams.outerDiameter / 2,
      }
      setControlPoints(newPoints)
    }

    // If maxHeight changes, update the last control point
    if (newParams.maxHeight !== baseParams.maxHeight) {
      const newPoints = [...controlPoints]
      const lastIndex = newPoints.length - 1
      newPoints[lastIndex] = {
        ...newPoints[lastIndex],
        y: newParams.maxHeight,
      }
      setControlPoints(newPoints)
    }

    setBaseParams(newParams)
  }

  // Toggle panel visibility
  const togglePanel = () => {
    setIsPanelVisible(!isPanelVisible)
  }

  return (
    <main className="flex min-h-screen flex-col" style={{ backgroundColor: colors.background, color: colors.text }}>
      {/* Mobile panel toggle button */}
      <div className="md:hidden fixed top-4 right-4 z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={togglePanel}
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          {isPanelVisible ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row h-screen">
        {/* Control panel */}
        <div
          className={`${
            isPanelVisible ? "w-full" : "hidden"
          } md:w-1/3 p-4 border-r overflow-y-auto transition-all duration-300 ease-in-out`}
          style={{ backgroundColor: colors.panel, borderColor: colors.border }}
        >
          <div className="sticky top-0">
            <h1
              className="text-2xl font-bold mb-4 font-mono tracking-tighter"
              style={{ color: colors.primary, fontFamily: typography.fontFamily }}
            >
              PARAMETRIC VESSEL DESIGNER V4
            </h1>
            <p
              className="text-sm mb-6 font-mono"
              style={{ color: colors.textSecondary, fontFamily: typography.fontFamily }}
            >
              Design your vessel by adjusting the base parameters and profile curve. All dimensions in millimeters (mm).
            </p>
            <ControlPanel
              baseParams={baseParams}
              setBaseParams={handleBaseParamChange}
              controlPoints={controlPoints}
              setControlPoints={setControlPoints}
            />
          </div>
        </div>

        {/* 3D viewer */}
        <div className={`${isPanelVisible ? "hidden md:block" : "block"} w-full md:w-2/3 h-[500px] md:h-screen`}>
          <Viewer3D baseParams={baseParams} controlPoints={controlPoints} />
        </div>
      </div>
    </main>
  )
}
