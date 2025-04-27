import * as THREE from "three"
import type { ControlPoint } from "@/types/curve"

// Generate a profile curve from control points
export function generateProfileCurve(controlPoints: ControlPoint[]): THREE.Vector2[] {
  // Create a smooth curve through the points using CatmullRomCurve3
  const points3D = controlPoints.map((point) => new THREE.Vector3(point.x, point.y, 0))
  const curve = new THREE.CatmullRomCurve3(points3D, false, "catmullrom", 0.5)

  // Sample many points along the curve for smoothness
  const sampledPoints = curve.getPoints(100)

  // Convert to Vector2 for lathe geometry
  return sampledPoints.map((p) => new THREE.Vector2(p.x, p.y))
}

// Generate an offset curve based on wall thickness
export function generateOffsetCurve(profilePoints: THREE.Vector2[], wallThickness: number): THREE.Vector2[] {
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

  // Create offset points
  return profilePoints.map((point, i) => {
    // For a vessel, we want to offset inward (negative normal)
    return point.clone().sub(normals[i].clone().multiplyScalar(wallThickness))
  })
}

// Create a closed profile by connecting outer and inner curves
export function createClosedProfile(outerPoints: THREE.Vector2[], innerPoints: THREE.Vector2[]): THREE.Vector2[] {
  const closedProfile = [...outerPoints]

  // Add the inner points in reverse order
  for (let i = innerPoints.length - 1; i >= 0; i--) {
    closedProfile.push(innerPoints[i])
  }

  // Close the loop by adding the first outer point again
  closedProfile.push(outerPoints[0].clone())

  return closedProfile
}
