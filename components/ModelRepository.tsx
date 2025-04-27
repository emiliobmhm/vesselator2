"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { colors } from "@/styles/theme"
import type { ControlPoint, BaseParameters } from "@/types/curve"

interface ModelData {
  id: string
  timestamp: string
  thumbnail: string
  baseParams: BaseParameters
  controlPoints: ControlPoint[]
}

interface ModelRepositoryProps {
  onLoadModel: (baseParams: BaseParameters, controlPoints: ControlPoint[]) => void
}

export default function ModelRepository({ onLoadModel }: ModelRepositoryProps) {
  const [models, setModels] = useState<ModelData[]>([])

  // Load models from local storage
  useEffect(() => {
    try {
      const modelsJSON = localStorage.getItem("vessel-models")
      if (modelsJSON) {
        const loadedModels = JSON.parse(modelsJSON)
        setModels(loadedModels)
      }
    } catch (error) {
      console.error("Error loading models from repository:", error)
    }
  }, [])

  // Load a model
  const handleLoadModel = (model: ModelData) => {
    onLoadModel(model.baseParams, model.controlPoints)
  }

  // Delete a model
  const handleDeleteModel = (id: string) => {
    try {
      // Filter out the model to delete
      const updatedModels = models.filter((model) => model.id !== id)

      // Update state
      setModels(updatedModels)

      // Save to local storage
      localStorage.setItem("vessel-models", JSON.stringify(updatedModels))
    } catch (error) {
      console.error("Error deleting model:", error)
    }
  }

  // Clear all models
  const handleClearAll = () => {
    if (confirm("Are you sure you want to delete all saved models?")) {
      setModels([])
      localStorage.removeItem("vessel-models")
    }
  }

  if (models.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="font-mono text-sm" style={{ color: colors.textSecondary }}>
          No saved models yet. Export an STL to save a model.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="font-mono text-lg" style={{ color: colors.primary }}>
          SAVED MODELS ({models.length})
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleClearAll}
          style={{ borderColor: colors.border, color: colors.primary }}
        >
          CLEAR ALL
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {models.map((model) => (
          <Card key={model.id} style={{ borderColor: colors.border }}>
            <CardContent className="p-2 space-y-2">
              <div className="aspect-square bg-gray-100 relative">
                <img
                  src={model.thumbnail || "/placeholder.svg"}
                  alt="Model thumbnail"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-xs font-mono" style={{ color: colors.textSecondary }}>
                {new Date(model.timestamp).toLocaleString()}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleLoadModel(model)}
                  style={{
                    backgroundColor: colors.primary,
                    color: colors.background,
                  }}
                >
                  LOAD
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteModel(model.id)}
                  style={{
                    borderColor: colors.border,
                    color: colors.primary,
                  }}
                >
                  DELETE
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
