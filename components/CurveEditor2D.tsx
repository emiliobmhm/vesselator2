"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import type { ControlPoint, BaseParameters } from "@/types/curve"
import { colors, typography } from "@/styles/theme"

interface CurveEditor2DProps {
  baseParams: BaseParameters
  controlPoints: ControlPoint[]
  setControlPoints: (points: ControlPoint[]) => void
}

export default function CurveEditor2D({ baseParams, controlPoints, setControlPoints }: CurveEditor2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const [scale, setScale] = useState(1) // pixels per mm (adjusted for mm units)
  const [offset, setOffset] = useState({ x: 100, y: 50 }) // canvas offset in pixels
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  // Convert mm to pixels
  const mmToPixels = (mm: number, axis: "x" | "y") => {
    if (axis === "x") {
      return mm * scale + offset.x
    } else {
      // Invert Y axis so that higher Y values are higher on the canvas
      return canvasSize.height - (mm * scale + offset.y)
    }
  }

  // Convert pixels to mm
  const pixelsToMm = (pixels: number, axis: "x" | "y") => {
    if (axis === "x") {
      return (pixels - offset.x) / scale
    } else {
      // Invert Y axis
      return (canvasSize.height - pixels - offset.y) / scale
    }
  }

  // Draw the curve and control points
  const drawCurve = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid
    ctx.strokeStyle = "#CCCCCC" // Light gray grid
    ctx.lineWidth = 0.5

    // Draw vertical grid lines (every 10mm)
    for (let x = 0; x <= baseParams.outerDiameter + 100; x += 10) {
      ctx.beginPath()
      ctx.moveTo(mmToPixels(x, "x"), 0)
      ctx.lineTo(mmToPixels(x, "x"), canvas.height)
      ctx.stroke()
    }

    // Draw horizontal grid lines (every 10mm)
    for (let y = 0; y <= baseParams.maxHeight + 30; y += 10) {
      ctx.beginPath()
      ctx.moveTo(0, mmToPixels(y, "y"))
      ctx.lineTo(canvas.width, mmToPixels(y, "y"))
      ctx.stroke()
    }

    // Draw base cylinder outline
    ctx.strokeStyle = colors.primary
    ctx.lineWidth = 2
    ctx.beginPath()

    // Left side
    ctx.moveTo(mmToPixels(0, "x"), mmToPixels(0, "y"))
    ctx.lineTo(mmToPixels(0, "x"), mmToPixels(baseParams.height, "y"))

    // Top
    ctx.lineTo(mmToPixels(baseParams.outerDiameter / 2, "x"), mmToPixels(baseParams.height, "y"))

    // Right side
    ctx.moveTo(mmToPixels(baseParams.outerDiameter, "x"), mmToPixels(baseParams.height, "y"))
    ctx.lineTo(mmToPixels(baseParams.outerDiameter, "x"), mmToPixels(0, "y"))

    // Bottom
    ctx.lineTo(mmToPixels(0, "x"), mmToPixels(0, "y"))

    ctx.stroke()

    // Draw centerline
    ctx.strokeStyle = colors.textSecondary
    ctx.setLineDash([2, 2])
    ctx.beginPath()
    ctx.moveTo(mmToPixels(baseParams.outerDiameter / 2, "x"), 0)
    ctx.lineTo(mmToPixels(baseParams.outerDiameter / 2, "x"), canvas.height)
    ctx.stroke()
    ctx.setLineDash([])

    // Draw maximum height line
    ctx.strokeStyle = colors.primary
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.moveTo(0, mmToPixels(baseParams.maxHeight, "y"))
    ctx.lineTo(canvas.width, mmToPixels(baseParams.maxHeight, "y"))
    ctx.stroke()
    ctx.setLineDash([])

    // Label for maximum height
    ctx.fillStyle = colors.primary
    ctx.font = `${typography.fontSizes.small} ${typography.fontFamily}`
    ctx.textAlign = "left"
    ctx.textBaseline = "bottom"
    ctx.fillText(`MAX HEIGHT: ${baseParams.maxHeight} MM`, 10, mmToPixels(baseParams.maxHeight, "y") - 5)

    // Ensure the first control point matches the base cylinder's top edge
    // and the last point is at maxHeight
    const adjustedControlPoints = [...controlPoints]
    adjustedControlPoints[0] = {
      ...adjustedControlPoints[0],
      x: baseParams.outerDiameter / 2,
      y: 0, // Will be positioned at baseParams.height
    }

    // Fix last point to maxHeight
    const lastIndex = adjustedControlPoints.length - 1
    adjustedControlPoints[lastIndex] = {
      ...adjustedControlPoints[lastIndex],
      y: baseParams.maxHeight,
    }

    // Draw profile curve (red)
    if (adjustedControlPoints.length >= 2) {
      // Create a smooth curve through the points
      const points3D = adjustedControlPoints.map((point) => ({ x: point.x, y: point.y + baseParams.height }))

      // Draw the curve
      ctx.strokeStyle = colors.primary // Use primary color instead of red
      ctx.lineWidth = 2
      ctx.beginPath()

      // Start at the first control point (at the top of the base cylinder)
      ctx.moveTo(mmToPixels(points3D[0].x, "x"), mmToPixels(points3D[0].y, "y"))

      // Draw curve segments
      for (let i = 1; i < points3D.length; i++) {
        const prevPoint = points3D[i - 1]
        const currPoint = points3D[i]

        if (adjustedControlPoints[i].isSmooth && i < points3D.length - 1) {
          // For smooth points, use quadratic curves
          const nextPoint = points3D[i + 1]
          const cpX = mmToPixels(currPoint.x, "x")
          const cpY = mmToPixels(currPoint.y, "y")

          // Calculate control points for the curve
          const cp1x = (mmToPixels(prevPoint.x, "x") + cpX) / 2
          const cp1y = (mmToPixels(prevPoint.y, "y") + cpY) / 2
          const cp2x = (cpX + mmToPixels(nextPoint.x, "x")) / 2
          const cp2y = (cpY + mmToPixels(nextPoint.y, "y")) / 2

          ctx.quadraticCurveTo(cpX, cpY, cp2x, cp2y)
        } else {
          // For sharp points, use lines
          ctx.lineTo(mmToPixels(currPoint.x, "x"), mmToPixels(currPoint.y, "y"))
        }
      }

      ctx.stroke()
    }

    // Draw control points
    adjustedControlPoints.forEach((point, index) => {
      // Different colors for different point types
      if (index === 0) {
        ctx.fillStyle = colors.primary // Base point (fixed)
      } else if (index === adjustedControlPoints.length - 1) {
        ctx.fillStyle = colors.primary // Top point (fixed height)
      } else {
        ctx.fillStyle = point.isSmooth ? colors.primaryLight : colors.primary // Smooth or sharp
      }

      ctx.beginPath()
      ctx.arc(mmToPixels(point.x, "x"), mmToPixels(point.y + baseParams.height, "y"), 6, 0, Math.PI * 2)
      ctx.fill()

      // Draw point index
      ctx.fillStyle = "#ffffff"
      ctx.font = `${typography.fontSizes.small} ${typography.fontFamily}`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(index.toString(), mmToPixels(point.x, "x"), mmToPixels(point.y + baseParams.height, "y"))

      // Draw coordinates
      ctx.fillStyle = colors.primary
      ctx.font = `${typography.fontSizes.small} ${typography.fontFamily}`
      ctx.textAlign = "left"
      ctx.textBaseline = "bottom"
      ctx.fillText(
        `(${point.x.toFixed(0)}, ${point.y.toFixed(0)})`,
        mmToPixels(point.x, "x") + 10,
        mmToPixels(point.y + baseParams.height, "y") - 10,
      )
    })
  }

  // Handle mouse events for dragging control points
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Check if we clicked on a control point
    for (let i = 0; i < controlPoints.length; i++) {
      const pointX = mmToPixels(controlPoints[i].x, "x")
      const pointY = mmToPixels(controlPoints[i].y + baseParams.height, "y")

      const distance = Math.sqrt(Math.pow(mouseX - pointX, 2) + Math.pow(mouseY - pointY, 2))

      if (distance <= 10) {
        // Don't allow dragging the first point (it must match the base cylinder)
        if (i === 0) {
          return
        }

        // Don't allow dragging the last point vertically (it must be at maxHeight)
        if (i === controlPoints.length - 1) {
          // Only allow horizontal dragging
          setIsDragging(i)
        } else {
          setIsDragging(i)
        }
        return
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging === null) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top

    // Convert mouse position to mm
    const mmX = pixelsToMm(mouseX, "x")
    const mmY = pixelsToMm(mouseY, "y") - baseParams.height

    // Apply constraints
    let constrainedX = mmX
    let constrainedY = mmY

    // X constraints
    const maxOutward = baseParams.outerDiameter / 2 + 50 // Max 50mm outward
    const maxInward = baseParams.outerDiameter / 6 // Max 1/3 of radius inward from centerline
    constrainedX = Math.max(maxInward, Math.min(maxOutward, constrainedX))

    // Y constraints
    // If this is the last point, don't update Y (fixed at maxHeight)
    if (isDragging === controlPoints.length - 1) {
      constrainedY = baseParams.maxHeight
    } else {
      if (isDragging > 0) {
        constrainedY = Math.max(controlPoints[isDragging - 1].y + 1, constrainedY)
      }
      if (isDragging < controlPoints.length - 1) {
        constrainedY = Math.min(controlPoints[isDragging + 1].y - 1, constrainedY)
      }

      // Ensure no point exceeds the maximum height
      constrainedY = Math.min(constrainedY, baseParams.maxHeight)
    }

    // Update the control point
    const newPoints = [...controlPoints]
    newPoints[isDragging] = {
      ...newPoints[isDragging],
      x: constrainedX,
      y: constrainedY,
    }

    setControlPoints(newPoints)
  }

  const handleMouseUp = () => {
    setIsDragging(null)
  }

  // Handle canvas resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return

      canvas.width = canvas.clientWidth
      canvas.height = canvas.clientHeight

      setCanvasSize({ width: canvas.width, height: canvas.height })
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Redraw when parameters change
  useEffect(() => {
    drawCurve()
  }, [baseParams, controlPoints, scale, offset, canvasSize])

  return (
    <div className="w-full h-full relative" style={{ backgroundColor: colors.background }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      <div className="absolute bottom-4 right-4 flex space-x-2">
        <button
          className="p-2 rounded-full font-mono"
          onClick={() => setScale(scale + 0.2)}
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
            fontFamily: typography.fontFamily,
          }}
        >
          +
        </button>
        <button
          className="p-2 rounded-full font-mono"
          onClick={() => setScale(Math.max(0.2, scale - 0.2))}
          style={{
            backgroundColor: colors.primary,
            color: colors.background,
            fontFamily: typography.fontFamily,
          }}
        >
          -
        </button>
      </div>
    </div>
  )
}
