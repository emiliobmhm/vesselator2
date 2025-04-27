import * as THREE from "three"
import type { ControlPoint, BaseParameters } from "@/types/curve"

// Generate a profile curve from control points
function generateProfileCurve(controlPoints: ControlPoint[]): THREE.Vector2[] {
  // Create a smooth curve through the points using CatmullRomCurve3
  const points3D = controlPoints.map((point) => new THREE.Vector3(point.x, point.y, 0))
  const curve = new THREE.CatmullRomCurve3(points3D, false, "catmullrom", 0.5)

  // Sample many points along the curve for smoothness
  const sampledPoints = curve.getPoints(100)

  // Convert to Vector2 for lathe geometry
  return sampledPoints.map((p) => new THREE.Vector2(p.x, p.y))
}

// Generate an offset curve based on wall thickness (inward offset)
function generateOffsetCurve(profilePoints: THREE.Vector2[], wallThickness: number): THREE.Vector2[] {
  // Calculate normals for each point
  const normals: THREE.Vector2[] = []

  for (let i = 0; i < profilePoints.length; i++) {
    const normal = new THREE.Vector2()

    if (i === 0) {
      // First point - use direction to next point
      const next = profilePoints[i + 1]
      const dir = next.clone().sub(profilePoints[i])
      normal.set(-dir.y, dir.x).normalize()
    } else if (i === profilePoints.length - 1) {
      // Last point - use direction from previous point
      const prev = profilePoints[i - 1]
      const dir = profilePoints[i].clone().sub(prev)
      normal.set(-dir.y, dir.x).normalize()
    } else {
      // Middle points - average of adjacent segments
      const prev = profilePoints[i - 1]
      const next = profilePoints[i + 1]

      const dir1 = profilePoints[i].clone().sub(prev)
      const dir2 = next.clone().sub(profilePoints[i])

      const normal1 = new THREE.Vector2(-dir1.y, dir1.x).normalize()
      const normal2 = new THREE.Vector2(-dir2.y, dir2.x).normalize()

      normal.addVectors(normal1, normal2).normalize()
    }

    normals.push(normal)
  }

  // Create offset points - inward offset for interior wall
  return profilePoints.map((point, i) => {
    // For a vessel, we want to offset inward (negative normal)
    return point.clone().sub(normals[i].clone().multiplyScalar(wallThickness))
  })
}

// Create a closed profile by connecting outer and inner curves
function createClosedProfile(outerPoints: THREE.Vector2[], innerPoints: THREE.Vector2[]): THREE.Vector2[] {
  const closedProfile = [...outerPoints]

  // Add the inner points in reverse order
  for (let i = innerPoints.length - 1; i >= 0; i--) {
    closedProfile.push(innerPoints[i])
  }

  // Close the loop by adding the first outer point again
  closedProfile.push(outerPoints[0].clone())

  return closedProfile
}

// Generate the vessel geometry
export function generateVesselGeometry(
  controlPoints: ControlPoint[],
  baseParams: BaseParameters,
): THREE.BufferGeometry {
  try {
    // Generate the profile curve
    const profilePoints = generateProfileCurve(controlPoints)

    // Generate the offset curve for wall thickness
    const offsetPoints = generateOffsetCurve(profilePoints, baseParams.wallThickness)

    // Create a closed profile
    const closedProfile = createClosedProfile(profilePoints, offsetPoints)

    // Create the lathe geometry
    const latheGeometry = new THREE.LatheGeometry(
      closedProfile,
      64, // Segments for smooth curves
      0, // phiStart
      Math.PI * 2, // phiLength (full circle)
    )

    // Compute vertex normals for proper shading
    latheGeometry.computeVertexNormals()

    return latheGeometry
  } catch (error) {
    console.error("Error generating vessel geometry:", error)
    // Return an empty geometry as fallback
    return new THREE.BufferGeometry()
  }
}

// Generate the base cylinder geometry with wall thickness
export function generateBaseCylinderGeometry(baseParams: BaseParameters): THREE.BufferGeometry {
  try {
    // Create outer cylinder
    const outerGeometry = new THREE.CylinderGeometry(
      baseParams.outerDiameter / 2, // top radius
      baseParams.outerDiameter / 2, // bottom radius
      baseParams.height, // height
      64, // radial segments
      1, // height segments
      false, // open ended
    )

    // Create inner cylinder (hollow part)
    const innerRadius = baseParams.outerDiameter / 2 - baseParams.wallThickness
    if (innerRadius > 0) {
      const innerGeometry = new THREE.CylinderGeometry(
        innerRadius, // top radius
        innerRadius, // bottom radius
        baseParams.height - baseParams.wallThickness, // slightly shorter to ensure top is closed
        64, // radial segments
        1, // height segments
        false, // open ended
      )

      // Position the inner cylinder to create a closed top
      innerGeometry.translate(0, baseParams.wallThickness / 2, 0)

      // Create a BSP subtraction (not available in Three.js core)
      // Instead, we'll return just the outer cylinder for now
      // In a full implementation, you would use CSG operations
      return outerGeometry
    }

    return outerGeometry
  } catch (error) {
    console.error("Error generating base cylinder:", error)
    // Return a simple cylinder as fallback
    return new THREE.CylinderGeometry(baseParams.outerDiameter / 2, baseParams.outerDiameter / 2, baseParams.height, 32)
  }
}
