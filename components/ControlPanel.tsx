"use client"

import type React from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { exportToSTL } from "@/utils/exportSTL"
import type { ControlPoint, BaseParameters } from "@/types/curve"
import { PlusIcon, MinusIcon } from "lucide-react"
import { colors, typography } from "@/styles/theme"
import CurveEditor2D from "./CurveEditor2D"

interface ControlPanelProps {
  baseParams: BaseParameters
  setBaseParams: (params: BaseParameters) => void
  controlPoints: ControlPoint[]
  setControlPoints: (points: ControlPoint[]) => void
}

export default function ControlPanel({
  baseParams,
  setBaseParams,
  controlPoints,
  setControlPoints,
}: ControlPanelProps) {
  // Handle base parameter changes
  const handleBaseParamChange = (param: keyof BaseParameters, value: number) => {
    const newParams = { ...baseParams, [param]: value }

    // If we're changing the outer diameter, update the first control point
    if (param === "outerDiameter") {
      const newPoints = [...controlPoints]
      newPoints[0] = {
        ...newPoints[0],
        x: value / 2,
      }
      setControlPoints(newPoints)
    }

    // If we're changing the maxHeight, update the last control point
    if (param === "maxHeight") {
      const newPoints = [...controlPoints]
      const lastIndex = newPoints.length - 1
      newPoints[lastIndex] = {
        ...newPoints[lastIndex],
        y: value,
      }
      setControlPoints(newPoints)
    }

    setBaseParams(newParams)
  }

  // Handle control point changes
  const handlePointChange = (index: number, axis: "x" | "y", value: number) => {
    const newPoints = [...controlPoints]

    // Don't allow changing the first point's X value (it must match the base cylinder)
    if (index === 0 && axis === "x") {
      return
    }

    // Don't allow changing the last point's Y value (it must be at maxHeight)
    if (index === controlPoints.length - 1 && axis === "y") {
      return
    }

    // Apply constraints
    if (axis === "x") {
      // Limit X movement based on requirements
      const maxOutward = baseParams.outerDiameter / 2 + 50 // Max 50mm outward
      const maxInward = baseParams.outerDiameter / 6 // Max 1/3 of radius inward from centerline
      value = Math.max(maxInward, Math.min(maxOutward, value))
    } else if (axis === "y") {
      // Ensure points don't go below the one below or above the one above
      if (index > 0) {
        value = Math.max(value, controlPoints[index - 1].y + 1)
      }
      if (index < controlPoints.length - 1) {
        value = Math.min(value, controlPoints[index + 1].y - 1)
      }

      // Ensure no point exceeds the maximum height
      value = Math.min(value, baseParams.maxHeight)
    }

    newPoints[index][axis] = value
    setControlPoints(newPoints)
  }

  // Add a new control point
  const addControlPoint = () => {
    if (controlPoints.length >= 7) return // Max 7 points

    // Get the last two points to calculate a good position for the new point
    const lastPoint = controlPoints[controlPoints.length - 1]
    const secondLastPoint = controlPoints[controlPoints.length - 2]

    // The new point should be inserted before the last point (which is fixed at maxHeight)
    const newY = (lastPoint.y + secondLastPoint.y) / 2
    const newX = (lastPoint.x + secondLastPoint.x) / 2

    const newPoint = {
      x: newX,
      y: newY,
      isSmooth: true,
      isFixed: false,
    }

    // Insert the new point before the last point
    const newPoints = [...controlPoints]
    newPoints.splice(controlPoints.length - 1, 0, newPoint)

    setControlPoints(newPoints)
  }

  // Remove a control point (but not the first or last)
  const removeControlPoint = () => {
    if (controlPoints.length <= 3) return // Min 3 points

    // Remove the second-to-last point (preserving first and last fixed points)
    const newPoints = [...controlPoints]
    newPoints.splice(controlPoints.length - 2, 1)

    setControlPoints(newPoints)
  }

  // Reset to defaults
  const resetToDefaults = () => {
    const defaultBaseParams = {
      outerDiameter: 100,
      height: 5,
      wallThickness: 2,
      maxHeight: 150,
    }

    setBaseParams(defaultBaseParams)

    const defaultControlPoints = [
      { x: defaultBaseParams.outerDiameter / 2, y: 0, isSmooth: true, isFixed: true },
      { x: defaultBaseParams.outerDiameter / 2 + 20, y: 50, isSmooth: true, isFixed: false },
      {
        x: defaultBaseParams.outerDiameter / 2 + 10,
        y: 100,
        isSmooth: true,
        isFixed: false,
      },
      {
        x: defaultBaseParams.outerDiameter / 2 - 10,
        y: defaultBaseParams.maxHeight,
        isSmooth: true,
        isFixed: true,
      },
    ]

    setControlPoints(defaultControlPoints)
  }

  // Common styles
  const cardStyle = {
    backgroundColor: colors.panel,
    borderColor: colors.border,
  }

  const titleStyle = {
    color: colors.primary,
    fontFamily: typography.fontFamily,
  }

  const labelStyle = {
    fontFamily: typography.fontFamily,
    fontSize: typography.fontSizes.small,
  }

  // Custom slider style
  const sliderStyle = {
    "--slider-thumb": colors.controls.slider.thumb,
    "--slider-track": colors.controls.slider.track,
    "--slider-range": colors.controls.slider.active,
  } as React.CSSProperties

  return (
    <div className="space-y-6">
      <Card style={cardStyle}>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono tracking-tighter" style={titleStyle}>
            BASE CYLINDER
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="outer-diameter" className="font-mono text-xs" style={labelStyle}>
                BASE DIAMETER: {baseParams.outerDiameter} MM
              </Label>
            </div>
            <Slider
              id="outer-diameter"
              min={50}
              max={200}
              step={1}
              value={[baseParams.outerDiameter]}
              onValueChange={(value) => handleBaseParamChange("outerDiameter", value[0])}
              style={sliderStyle}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="height" className="font-mono text-xs" style={labelStyle}>
                BASE HEIGHT: {baseParams.height} MM
              </Label>
            </div>
            <Slider
              id="height"
              min={1}
              max={20}
              step={1}
              value={[baseParams.height]}
              onValueChange={(value) => handleBaseParamChange("height", value[0])}
              style={sliderStyle}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="wall-thickness" className="font-mono text-xs" style={labelStyle}>
                WALL THICKNESS: {baseParams.wallThickness} MM
              </Label>
            </div>
            <Slider
              id="wall-thickness"
              min={1}
              max={10}
              step={1}
              value={[baseParams.wallThickness]}
              onValueChange={(value) => handleBaseParamChange("wallThickness", value[0])}
              style={sliderStyle}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="max-height" className="font-mono text-xs" style={labelStyle}>
                MAX TOTAL HEIGHT: {baseParams.maxHeight} MM
              </Label>
            </div>
            <Slider
              id="max-height"
              min={50}
              max={300}
              step={1}
              value={[baseParams.maxHeight]}
              onValueChange={(value) => handleBaseParamChange("maxHeight", value[0])}
              style={sliderStyle}
            />
          </div>
        </CardContent>
      </Card>

      <Card style={cardStyle}>
        <CardHeader className="pb-2">
          <CardTitle className="font-mono tracking-tighter flex justify-between items-center" style={titleStyle}>
            <span>PROFILE CURVE ({controlPoints.length})</span>
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={addControlPoint}
                disabled={controlPoints.length >= 7}
                style={{
                  borderColor: colors.border,
                  color: colors.primary,
                }}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={removeControlPoint}
                disabled={controlPoints.length <= 3}
                style={{
                  borderColor: colors.border,
                  color: colors.primary,
                }}
              >
                <MinusIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="sliders" className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="sliders" style={{ color: colors.text }}>
                SLIDERS
              </TabsTrigger>
              <TabsTrigger value="editor" style={{ color: colors.text }}>
                CURVE EDITOR
              </TabsTrigger>
            </TabsList>
            <TabsContent value="sliders" className="p-4 space-y-4">
              {controlPoints.map((point, index) => (
                <Card
                  key={index}
                  style={{
                    ...cardStyle,
                    borderColor: index === 0 || index === controlPoints.length - 1 ? colors.primary : colors.border,
                  }}
                >
                  <CardHeader className="py-2">
                    <CardTitle className="text-sm font-mono tracking-tighter" style={titleStyle}>
                      {index === 0
                        ? "BOTTOM POINT (FIXED)"
                        : index === controlPoints.length - 1
                          ? "TOP POINT (FIXED HEIGHT)"
                          : `POINT ${index}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="py-2 space-y-2">
                    {index === 0 ? (
                      <div className="text-xs font-mono" style={{ ...labelStyle, color: colors.textSecondary }}>
                        POSITION FIXED TO MATCH BASE CYLINDER: X={point.x} MM, Y=0 MM
                      </div>
                    ) : index === controlPoints.length - 1 ? (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`x-${index}`} className="text-xs font-mono" style={labelStyle}>
                              X: {point.x.toFixed(1)} MM
                            </Label>
                          </div>
                          <Slider
                            id={`x-${index}`}
                            min={baseParams.outerDiameter / 6}
                            max={baseParams.outerDiameter / 2 + 50}
                            step={1}
                            value={[point.x]}
                            onValueChange={(value) => handlePointChange(index, "x", value[0])}
                            style={sliderStyle}
                          />
                        </div>
                        <div className="text-xs font-mono" style={{ ...labelStyle, color: colors.textSecondary }}>
                          Y POSITION FIXED AT MAXIMUM HEIGHT: {baseParams.maxHeight} MM
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`x-${index}`} className="text-xs font-mono" style={labelStyle}>
                              X: {point.x.toFixed(1)} MM
                            </Label>
                          </div>
                          <Slider
                            id={`x-${index}`}
                            min={baseParams.outerDiameter / 6}
                            max={baseParams.outerDiameter / 2 + 50}
                            step={1}
                            value={[point.x]}
                            onValueChange={(value) => handlePointChange(index, "x", value[0])}
                            style={sliderStyle}
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <Label htmlFor={`y-${index}`} className="text-xs font-mono" style={labelStyle}>
                              Y: {point.y.toFixed(1)} MM
                            </Label>
                          </div>
                          <Slider
                            id={`y-${index}`}
                            min={index > 0 ? controlPoints[index - 1].y + 1 : 0}
                            max={
                              index < controlPoints.length - 1 ? controlPoints[index + 1].y - 1 : baseParams.maxHeight
                            }
                            step={1}
                            value={[point.y]}
                            onValueChange={(value) => handlePointChange(index, "y", value[0])}
                            style={sliderStyle}
                          />
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
            <TabsContent value="editor" className="h-[400px]">
              <CurveEditor2D
                baseParams={baseParams}
                controlPoints={controlPoints}
                setControlPoints={setControlPoints}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Separator style={{ backgroundColor: colors.border }} />

      <div className="flex flex-col space-y-2">
        <Button
          onClick={() => exportToSTL(baseParams, controlPoints)}
          className="w-full font-mono"
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
            fontFamily: typography.fontFamily,
          }}
        >
          EXPORT AS STL
        </Button>
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="w-full font-mono"
          style={{
            borderColor: colors.border,
            color: colors.primary,
            fontFamily: typography.fontFamily,
          }}
        >
          RESET TO DEFAULTS
        </Button>
      </div>
    </div>
  )
}
