import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import debounce from 'lodash.debounce'

interface AutoSaveOptions {
  delay?: number // Delay in milliseconds (default: 30000 = 30 seconds)
  onSaveStart?: () => void
  onSaveSuccess?: () => void
  onSaveError?: (error: any) => void
}

interface PendingChange {
  id: string
  data: Record<string, any>
  timestamp: number
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export const useAutoSave = <T extends { id: string }>(
  tableName: string,
  options: AutoSaveOptions = {}
) => {
  const {
    delay = 30000,
    onSaveStart,
    onSaveSuccess,
    onSaveError
  } = options

  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map())
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Funzione per salvare le modifiche
  const saveChanges = useCallback(async () => {
    if (pendingChanges.size === 0) return

    setSaveStatus('saving')
    onSaveStart?.()

    try {
      const updates = Array.from(pendingChanges.values()).map(change => ({
        id: change.id,
        ...change.data,
        updated_at: new Date().toISOString()
      }))

      const { error } = await supabase
        .from(tableName)
        .upsert(updates)

      if (error) throw error

      setPendingChanges(new Map())
      setSaveStatus('saved')
      setLastSaveTime(new Date())
      onSaveSuccess?.()
      
      // Reset status dopo 2 secondi
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (error) {
      console.error('Errore nel salvataggio:', error)
      setSaveStatus('error')
      onSaveError?.(error)
      
      // Reset status dopo 5 secondi in caso di errore
      setTimeout(() => setSaveStatus('idle'), 5000)
    }
  }, [pendingChanges, tableName, onSaveStart, onSaveSuccess, onSaveError])

  // Debounced save function
  const debouncedSave = useCallback(
    debounce(saveChanges, delay),
    [saveChanges, delay]
  )

  // Funzione per aggiungere una modifica
  const addChange = useCallback((id: string, data: Partial<T>) => {
    setPendingChanges(prev => {
      const newMap = new Map(prev)
      const existing = newMap.get(id)
      
      newMap.set(id, {
        id,
        data: existing ? { ...existing.data, ...data } : data,
        timestamp: Date.now()
      })
      
      return newMap
    })
  }, [])

  // Funzione per salvare immediatamente
  const saveNow = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    debouncedSave.cancel()
    await saveChanges()
  }, [saveChanges, debouncedSave])

  // Funzione per cancellare le modifiche pending
  const clearPendingChanges = useCallback(() => {
    setPendingChanges(new Map())
    debouncedSave.cancel()
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }, [debouncedSave])

  // Effect per gestire l'autosave
  useEffect(() => {
    if (pendingChanges.size > 0) {
      debouncedSave()
    }
    
    return () => {
      debouncedSave.cancel()
    }
  }, [pendingChanges, debouncedSave])

  // Effect per cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      debouncedSave.cancel()
    }
  }, [])

  // Calcola il tempo dall'ultimo salvataggio
  const getTimeSinceLastSave = useCallback(() => {
    if (!lastSaveTime) return null
    return Math.floor((Date.now() - lastSaveTime.getTime()) / 1000)
  }, [lastSaveTime])

  // Calcola il tempo fino al prossimo salvataggio
  const getTimeToNextSave = useCallback(() => {
    if (pendingChanges.size === 0) return null
    
    const oldestChange = Math.min(
      ...Array.from(pendingChanges.values()).map(c => c.timestamp)
    )
    
    const timeElapsed = Date.now() - oldestChange
    const timeRemaining = Math.max(0, delay - timeElapsed)
    
    return Math.ceil(timeRemaining / 1000)
  }, [pendingChanges, delay])

  return {
    // State
    saveStatus,
    pendingChangesCount: pendingChanges.size,
    lastSaveTime,
    
    // Actions
    addChange,
    saveNow,
    clearPendingChanges,
    
    // Computed
    getTimeSinceLastSave,
    getTimeToNextSave,
    
    // Flags
    hasUnsavedChanges: pendingChanges.size > 0,
    isSaving: saveStatus === 'saving'
  }
}

export default useAutoSave