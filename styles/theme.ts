// Simplified theme configuration for the parametric vessel designer

// Color palette
export const colors = {
  // Primary brand colors
  primary: "#FF69B4", // Hot pink - main brand color
  primaryLight: "#FFD1E0", // Light pink for backgrounds/accents

  // UI colors
  background: "#FFFFFF", // White background
  panel: "#F5F5F5", // Light gray panel background
  border: "#E0E0E0", // Border color

  // Text colors
  text: "#333333", // Main text color
  textSecondary: "#666666", // Secondary text

  // 3D view colors
  vessel: "#FF69B4", // Vessel color (pink)
  grid: "#CCCCCC", // Grid color

  // UI controls
  controls: {
    slider: {
      track: "#E0E0E0",
      thumb: "#FF69B4",
      active: "#FF69B4",
    },
    switch: {
      active: "#FF69B4",
    },
  },
}

// Typography
export const typography = {
  fontFamily: "monospace",
  fontSizes: {
    small: "0.75rem",
    normal: "0.875rem",
    large: "1.25rem",
    heading: "1.5rem",
  },
}

// Material properties
export const materials = {
  vessel: {
    roughness: 0.2,
    metalness: 0.3,
    emissive: "#FFB6C1",
  },
}

// Export the entire theme as a default object
const theme = {
  colors,
  typography,
  materials,
}

export default theme
