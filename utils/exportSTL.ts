import * as THREE from "three"
import { STLExporter } from "three/examples/jsm/exporters/STLExporter"
import type { ControlPoint, BaseParameters } from "@/types/curve"
import { generateVesselGeometry, generateBaseCylinderGeometry } from "./generateGeometry"

// Updated exportToSTL function with correct rotation
export function exportToSTL(baseParams: BaseParameters, controlPoints: ControlPoint[]) {
  try {
    // Generate the base cylinder geometry
    const baseCylinderGeometry = generateBaseCylinderGeometry(baseParams)
    baseCylinderGeometry.translate(0, baseParams.height / 2, 0)

    // Generate the vessel profile geometry
    // Ensure the first control point matches the base cylinder's top edge
    // and the last point is at maxHeight
    const adjustedControlPoints = [...controlPoints]

    // Fix first point to match base cylinder
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

    const profileGeometry = generateVesselGeometry(adjustedControlPoints, baseParams)
    profileGeometry.translate(0, baseParams.height, 0)

    // Create meshes for each part
    const baseMesh = new THREE.Mesh(baseCylinderGeometry)
    const profileMesh = new THREE.Mesh(profileGeometry)

    // Create a group to hold all parts
    const group = new THREE.Group()
    group.add(baseMesh)
    group.add(profileMesh)

    // Rotate the group 90 degrees around the X axis (positive rotation)
    group.rotation.x = Math.PI / 2

    // Create an exporter
    const exporter = new STLExporter()

    // Export the group to STL format with binary format for smaller file size
    const stl = exporter.parse(group, { binary: true })

    // Create a blob from the STL data
    const blob = new Blob([stl], { type: "application/octet-stream" })

    // Create a URL for the blob
    const url = URL.createObjectURL(blob)

    // Create a link element to trigger the download
    const link = document.createElement("a")
    link.href = url
    link.download = "parametric-vessel.stl"

    // Append the link to the body
    document.body.appendChild(link)

    // Click the link to trigger the download
    link.click()

    // Remove the link from the body
    document.body.removeChild(link)

    // Revoke the URL to free up memory
    URL.revokeObjectURL(url)

    // Save a thumbnail and model data to the repository
    saveModelToRepository(baseParams, controlPoints)
  } catch (error) {
    console.error("Error exporting STL:", error)
    alert("There was an error exporting the STL file. Please check the console for details.")
  }
}

// Function to save the model to the repository
function saveModelToRepository(baseParams: BaseParameters, controlPoints: ControlPoint[]) {
  try {
    // Generate a thumbnail (in a real app, this would be a screenshot of the 3D view)
    // For now, we'll use a placeholder
    const thumbnail = "/placeholder.svg?height=200&width=200"

    // Create a model data object
    const modelData = {
      id: `model-${Date.now()}`,
      timestamp: new Date().toISOString(),
      thumbnail,
      baseParams: { ...baseParams },
      controlPoints: controlPoints.map((point) => ({ ...point })),
    }

    // Get existing models from localStorage
    let models = []
    try {
      const modelsJSON = localStorage.getItem("vessel-models")
      if (modelsJSON) {
        models = JSON.parse(modelsJSON)
      }
    } catch (e) {
      console.error("Error loading existing models:", e)
    }

    // Add the new model
    models.push(modelData)

    // Save back to localStorage
    localStorage.setItem("vessel-models", JSON.stringify(models))
  } catch (error) {
    console.error("Error saving model to repository:", error)
  }
}
