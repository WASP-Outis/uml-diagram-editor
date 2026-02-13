import { useMemo, useState } from 'react'
import { parseDiagramText } from '../utils/DiagramParser'

export const DIAGRAM_SAMPLES = {
  usecase: `کاربر -> (ورود به سیستم)
Admin -> (ManageUsers)
Admin -> (GenerateReport)`,
  sequence: `Alice -> Bob: Hello
activate Bob
Bob --> Alice: Ack
deactivate Bob
Alice -> Bob: Follow up`,
  class: `class User {
+name: string
+login(password: string): boolean
}

class Admin {
+permissions: string[]
+ban(userId: number): void
}

User <|-- Admin
User *-- Profile`,
  state: `[*] -> [Idle]
[Idle] -> [Active]: start
[Active] -> [Paused]: hold
[Paused] -> [Active]: resume
[Active] -> [*]: done`,
}

const defaultSettings = {
  primaryColor: '#2563eb',
  strokeWidth: 2,
}

export function useDiagramEngine() {
  const [text, setText] = useState(DIAGRAM_SAMPLES.usecase)
  const [selectedType, setSelectedType] = useState('auto')
  const [settings, setSettings] = useState(defaultSettings)

  const parsed = useMemo(() => parseDiagramText(text), [text])

  const activeType = useMemo(() => {
    if (selectedType !== 'auto') {
      return selectedType
    }
    if (parsed.type === 'mixed') {
      return parsed.detectedTypes[0] ?? 'unknown'
    }
    return parsed.type
  }, [parsed, selectedType])

  const setStrokeWidth = (value) => {
    const width = Number(value)
    setSettings((previous) => ({
      ...previous,
      strokeWidth: Number.isNaN(width) ? previous.strokeWidth : width,
    }))
  }

  const loadSample = (type) => {
    if (DIAGRAM_SAMPLES[type]) {
      setText(DIAGRAM_SAMPLES[type])
      setSelectedType(type)
    }
  }

  return {
    text,
    setText,
    parsed,
    selectedType,
    setSelectedType,
    activeType,
    settings,
    setSettings,
    setStrokeWidth,
    loadSample,
  }
}
