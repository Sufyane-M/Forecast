import React, { useState, useEffect, useRef } from 'react'
import {
  Copy,
  Clipboard,
  ArrowDown,
  Save,
  X,
  MoreHorizontal,
  Check,
  AlertCircle
} from 'lucide-react'

interface FloatingToolbarProps {
  visible: boolean
  x: number
  y: number
  onClose: () => void
  onCopy?: () => void
  onPaste?: () => void
  onFillDown?: () => void
  onSave?: () => void
  onConfirm?: () => void
  onMarkError?: () => void
  canPaste?: boolean
  canFillDown?: boolean
  selectedCellsCount?: number
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  visible,
  x,
  y,
  onClose,
  onCopy,
  onPaste,
  onFillDown,
  onSave,
  onConfirm,
  onMarkError,
  canPaste = false,
  canFillDown = false,
  selectedCellsCount = 0
}) => {
  const [showMore, setShowMore] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Chiudi quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (toolbarRef.current && !toolbarRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [visible, onClose])

  // Gestisci ESC per chiudere
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (visible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, onClose])

  if (!visible) return null

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <>
      {/* Overlay per catturare i click */}
      <div className="fixed inset-0 z-40" onClick={onClose} />
      
      {/* Toolbar */}
      <div
        ref={toolbarRef}
        className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg"
        style={{ left: x, top: y }}
      >
        {/* Header con info selezione */}
        {selectedCellsCount > 0 && (
          <div className="px-3 py-2 border-b border-gray-100 bg-gray-50 rounded-t-lg">
            <span className="text-xs text-gray-600">
              {selectedCellsCount} cella{selectedCellsCount > 1 ? 'e' : ''} selezionata{selectedCellsCount > 1 ? 'e' : ''}
            </span>
          </div>
        )}
        
        {/* Azioni principali */}
        <div className="flex items-center p-1">
          {onCopy && (
            <button
              onClick={() => handleAction(onCopy)}
              className="p-2 hover:bg-gray-100 rounded text-gray-600 transition-colors"
              title="Copia (Ctrl+C)"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}
          
          {onPaste && (
            <button
              onClick={() => handleAction(onPaste)}
              disabled={!canPaste}
              className="p-2 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Incolla (Ctrl+V)"
            >
              <Clipboard className="w-4 h-4" />
            </button>
          )}
          
          {onFillDown && (
            <button
              onClick={() => handleAction(onFillDown)}
              disabled={!canFillDown}
              className="p-2 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Riempi in basso (Ctrl+D)"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
          
          {onSave && (
            <button
              onClick={() => handleAction(onSave)}
              className="p-2 hover:bg-gray-100 rounded text-blue-600 transition-colors"
              title="Salva ora (Ctrl+S)"
            >
              <Save className="w-4 h-4" />
            </button>
          )}
          
          {/* Separatore */}
          {(onConfirm || onMarkError) && (
            <div className="w-px h-6 bg-gray-200 mx-1" />
          )}
          
          {/* Azioni di stato */}
          {onConfirm && (
            <button
              onClick={() => handleAction(onConfirm)}
              className="p-2 hover:bg-green-100 rounded text-green-600 transition-colors"
              title="Conferma valore"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          
          {onMarkError && (
            <button
              onClick={() => handleAction(onMarkError)}
              className="p-2 hover:bg-red-100 rounded text-red-600 transition-colors"
              title="Segna come errore"
            >
              <AlertCircle className="w-4 h-4" />
            </button>
          )}
          
          {/* Menu più opzioni */}
          <div className="relative">
            <button
              onClick={() => setShowMore(!showMore)}
              className="p-2 hover:bg-gray-100 rounded text-gray-400 transition-colors"
              title="Più opzioni"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            
            {showMore && (
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('0')
                    setShowMore(false)
                    onClose()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Copia "0"
                </button>
                <button
                  onClick={() => {
                    // Logica per selezionare tutte le celle della colonna
                    setShowMore(false)
                    onClose()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Seleziona colonna
                </button>
                <button
                  onClick={() => {
                    // Logica per selezionare tutte le celle della riga
                    setShowMore(false)
                    onClose()
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                >
                  Seleziona riga
                </button>
              </div>
            )}
          </div>
          
          {/* Pulsante chiudi */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded text-gray-400 transition-colors ml-1"
            title="Chiudi (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Footer con shortcuts */}
        <div className="px-3 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Ctrl+C: Copia • Ctrl+V: Incolla</div>
            <div>Ctrl+D: Riempi • Ctrl+S: Salva</div>
          </div>
        </div>
      </div>
    </>
  )
}

export default FloatingToolbar