export interface ControlPoint {
  x: number
  y: number
  isSmooth: boolean
  isFixed: boolean
  fixedY?: boolean
}

export interface BaseParameters {
  outerDiameter: number
  height: number
  wallThickness: number
  maxHeight: number
}
