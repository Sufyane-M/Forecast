import React, { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

interface UserMentionInputProps {
  value: string
  onChange: (value: string, mentionedUsers: User[]) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

export const UserMentionInput: React.FC<UserMentionInputProps> = ({
  value,
  onChange,
  placeholder = 'Scrivi un commento... Usa @ per menzionare utenti',
  className = '',
  disabled = false
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState<User[]>([])
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionPosition, setMentionPosition] = useState(0)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [mentionedUsers, setMentionedUsers] = useState<User[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)
  const { profile } = useAuthStore()

  // Carica utenti per le suggestions
  const loadUsers = useCallback(async (query: string = '') => {
    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .neq('id', profile?.id) // Escludi l'utente corrente
        .limit(10)
        .order('full_name')

      // Se c'è una query, filtra per nome o email
      if (query && query.length > 0) {
        queryBuilder = queryBuilder.or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
      }

      const { data, error } = await queryBuilder

      if (error) throw error
      setSuggestions(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
      setSuggestions([])
    }
  }, [profile?.id])

  // Gestisce il cambio di testo
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    const cursorPosition = e.target.selectionStart

    // Cerca @ prima del cursore
    const textBeforeCursor = newValue.substring(0, cursorPosition)
    const mentionMatch = textBeforeCursor.match(/@([^\s@]*)$/)

    if (mentionMatch) {
      const query = mentionMatch[1]
      setMentionQuery(query)
      setMentionPosition(mentionMatch.index! + 1) // +1 per saltare @
      setShowSuggestions(true)
      setSelectedIndex(0)
      
      // Se la query è vuota (appena digitato @), carica tutti gli utenti
      if (query === '') {
        loadUsers() // Carica tutti gli utenti disponibili
      } else {
        loadUsers(query) // Filtra per query
      }
    } else {
      setShowSuggestions(false)
      setSuggestions([])
      setMentionQuery('')
    }

    // Aggiorna le mention attive
    updateMentionedUsers(newValue)
    onChange(newValue, mentionedUsers)
  }

  // Aggiorna la lista degli utenti menzionati
  const updateMentionedUsers = (text: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const mentions: User[] = []
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      const [, name, userId] = match
      const user = mentionedUsers.find(u => u.id === userId)
      if (user) {
        mentions.push(user)
      }
    }

    setMentionedUsers(mentions)
  }

  // Inserisce una mention
  const insertMention = (user: User) => {
    if (!textareaRef.current) return

    const textarea = textareaRef.current
    const cursorPosition = textarea.selectionStart
    const textBeforeCursor = value.substring(0, cursorPosition)
    const textAfterCursor = value.substring(cursorPosition)
    
    // Trova l'inizio della mention (@)
    const mentionStart = textBeforeCursor.lastIndexOf('@')
    const beforeMention = value.substring(0, mentionStart)
    
    // Formato: @[Nome Utente](user_id)
    const mentionText = `@[${user.full_name}](${user.id})`
    const newValue = beforeMention + mentionText + ' ' + textAfterCursor
    
    // Aggiorna il valore
    const newMentionedUsers = [...mentionedUsers]
    if (!newMentionedUsers.find(u => u.id === user.id)) {
      newMentionedUsers.push(user)
    }
    
    setMentionedUsers(newMentionedUsers)
    onChange(newValue, newMentionedUsers)
    
    // Nascondi suggestions
    setShowSuggestions(false)
    setSuggestions([])
    
    // Riposiziona il cursore
    setTimeout(() => {
      const newCursorPosition = beforeMention.length + mentionText.length + 1
      textarea.setSelectionRange(newCursorPosition, newCursorPosition)
      textarea.focus()
    }, 0)
  }

  // Gestisce i tasti
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => {
          const newIndex = (prev + 1) % suggestions.length
          // Scroll automatico per mantenere l'elemento selezionato visibile
          setTimeout(() => {
            const selectedElement = suggestionsRef.current?.children[newIndex] as HTMLElement
            selectedElement?.scrollIntoView({ block: 'nearest' })
          }, 0)
          return newIndex
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => {
          const newIndex = (prev - 1 + suggestions.length) % suggestions.length
          // Scroll automatico per mantenere l'elemento selezionato visibile
          setTimeout(() => {
            const selectedElement = suggestionsRef.current?.children[newIndex] as HTMLElement
            selectedElement?.scrollIntoView({ block: 'nearest' })
          }, 0)
          return newIndex
        })
        break
      case 'Enter':
      case 'Tab':
        e.preventDefault()
        if (suggestions[selectedIndex]) {
          insertMention(suggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        setShowSuggestions(false)
        setSuggestions([])
        setMentionQuery('')
        break
    }
  }

  // Chiudi suggestions quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Renderizza il testo con le mention evidenziate
  const renderTextWithMentions = (text: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    const parts = []
    let lastIndex = 0
    let match

    while ((match = mentionRegex.exec(text)) !== null) {
      // Testo prima della mention
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index))
      }
      
      // La mention
      parts.push(
        <span key={match.index} className="bg-blue-100 text-blue-800 px-1 rounded">
          @{match[1]}
        </span>
      )
      
      lastIndex = match.index + match[0].length
    }
    
    // Testo rimanente
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex))
    }
    
    return parts
  }

  return (
    <div className="relative">
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent resize-none transition-all duration-200 ${className} ${showSuggestions ? 'ring-2 ring-[#0D3F85] border-transparent' : ''}`}
        rows={3}
      />

      {/* Preview delle mention (opzionale) */}
      {mentionedUsers.length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded-md border">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-gray-600">Utenti menzionati:</span>
            <span className="text-xs text-gray-500">({mentionedUsers.length})</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {mentionedUsers.map(user => (
              <span
                key={user.id}
                className="inline-flex items-center px-2 py-1 bg-[#0D3F85] text-white text-xs rounded-full shadow-sm"
              >
                {user.full_name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto"
          style={{
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          }}
        >
          {suggestions.length > 0 ? (
            suggestions.map((user, index) => {
              // Evidenzia il testo che corrisponde alla query
              const highlightText = (text: string, query: string) => {
                if (!query) return text
                const regex = new RegExp(`(${query})`, 'gi')
                const parts = text.split(regex)
                return parts.map((part, i) => 
                  regex.test(part) ? 
                    <span key={i} className="bg-yellow-200 font-medium">{part}</span> : 
                    part
                )
              }

              return (
                <button
                  key={user.id}
                  onClick={() => insertMention(user)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors duration-150 first:rounded-t-lg last:rounded-b-lg ${
                    index === selectedIndex ? 'bg-[#0D3F85] text-white' : ''
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                     index === selectedIndex ? 'bg-white text-[#0D3F85]' : 'bg-[#0D3F85] text-white'
                   }`}>
                     {user.full_name.charAt(0).toUpperCase()}
                   </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm truncate ${
                      index === selectedIndex ? 'text-white' : 'text-gray-900'
                    }`}>
                      {highlightText(user.full_name, mentionQuery)}
                    </div>
                    <div className={`text-xs truncate ${
                      index === selectedIndex ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {highlightText(user.email, mentionQuery)} • {user.role}
                    </div>
                  </div>
                  {index === selectedIndex && (
                    <div className="text-blue-100 text-xs">
                      ↵
                    </div>
                  )}
                </button>
              )
            })
          ) : (
            <div className="px-3 py-4 text-center text-gray-500 text-sm">
              {mentionQuery ? (
                <>
                  <div className="mb-1">Nessun utente trovato per "{mentionQuery}"</div>
                  <div className="text-xs">Prova con un nome o email diverso</div>
                </>
              ) : (
                'Caricamento utenti...'
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserMentionInput