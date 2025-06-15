"use client"

import type React from "react"
import { createContext, useState, useEffect, useContext, type Dispatch, type SetStateAction } from "react"

interface Timer {
  id: string
  description: string
  startTime: string
  endTime?: string
}

interface TimeTrackingContextProps {
  timers: Timer[]
  setTimers: Dispatch<SetStateAction<Timer[]>>
  activeTimer: Timer | null
  setActiveTimer: Dispatch<SetStateAction<Timer | null>>
  startTimer: (description: string) => void
  stopTimer: () => void
  elapsedTime: number
}

const TimeTrackingContext = createContext<TimeTrackingContextProps>({
  timers: [],
  setTimers: () => {},
  activeTimer: null,
  setActiveTimer: () => {},
  startTimer: () => {},
  stopTimer: () => {},
  elapsedTime: 0,
})

interface TimeTrackingProviderProps {
  children: React.ReactNode
}

export const TimeTrackingProvider: React.FC<TimeTrackingProviderProps> = ({ children }) => {
  const [timers, setTimers] = useState<Timer[]>([])
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (activeTimer) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000)
        setElapsedTime(elapsed)
      }, 1000)
    } else {
      setElapsedTime(0)
    }
    return () => clearInterval(interval)
  }, [activeTimer])

  const startTimer = (description: string) => {
    const newTimer: Timer = {
      id: Date.now().toString(),
      description,
      startTime: new Date().toISOString(),
    }
    setTimers([...timers, newTimer])
    setActiveTimer(newTimer)
  }

  const stopTimer = () => {
    if (activeTimer) {
      const updatedTimer = {
        ...activeTimer,
        endTime: new Date().toISOString(),
      }
      setTimers(timers.map((timer) => (timer.id === activeTimer.id ? updatedTimer : timer)))
      setActiveTimer(null)
    }
  }

  const value = {
    timers,
    setTimers,
    activeTimer,
    setActiveTimer,
    startTimer,
    stopTimer,
    elapsedTime,
  }

  return <TimeTrackingContext.Provider value={value}>{children}</TimeTrackingContext.Provider>
}

export const useTimeTracking = () => useContext(TimeTrackingContext)
