import React, { useState, useRef, useEffect } from 'react'
import { Smile, Search } from 'lucide-react'
import { Button } from './ui/Button'

// Emoji categories con emoji comuni
const EMOJI_CATEGORIES = {
  smileys: {
    name: 'Smileys & Emotion',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐']
  },
  gestures: {
    name: 'People & Body',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏', '🙌', '🤲', '🤝', '🙏', '✍️', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋']
  },
  objects: {
    name: 'Objects',
    emojis: ['📱', '💻', '🖥️', '🖨️', '⌨️', '🖱️', '🖲️', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '⏰', '🕰️', '⏱️', '⏲️', '⏰', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛']
  },
  symbols: {
    name: 'Symbols',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
  }
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  onClose: () => void
  isOpen: boolean
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose, isOpen }) => {
  const [activeCategory, setActiveCategory] = useState('smileys')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredEmojis, setFilteredEmojis] = useState<string[]>([])
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (searchTerm) {
      const allEmojis = Object.values(EMOJI_CATEGORIES).flatMap(cat => cat.emojis)
      setFilteredEmojis(allEmojis.filter(emoji => 
        emoji.includes(searchTerm) || 
        getEmojiName(emoji).toLowerCase().includes(searchTerm.toLowerCase())
      ))
    } else {
      setFilteredEmojis([])
    }
  }, [searchTerm])

  const getEmojiName = (emoji: string) => {
    // Mapping semplificato emoji -> nome
    const emojiNames: { [key: string]: string } = {
      '😀': 'grinning face',
      '😃': 'grinning face with big eyes',
      '😄': 'grinning face with smiling eyes',
      '😁': 'beaming face with smiling eyes',
      '😆': 'grinning squinting face',
      '😅': 'grinning face with sweat',
      '🤣': 'rolling on the floor laughing',
      '😂': 'face with tears of joy',
      '🙂': 'slightly smiling face',
      '🙃': 'upside down face',
      '😉': 'winking face',
      '😊': 'smiling face with smiling eyes',
      '😇': 'smiling face with halo',
      '🥰': 'smiling face with hearts',
      '😍': 'smiling face with heart eyes',
      '🤩': 'star struck',
      '😘': 'face blowing a kiss',
      '👍': 'thumbs up',
      '👎': 'thumbs down',
      '👌': 'ok hand',
      '✌️': 'victory hand',
      '🤞': 'crossed fingers',
      '🤟': 'love you gesture',
      '🤘': 'sign of the horns',
      '🤙': 'call me hand',
      '👏': 'clapping hands',
      '🙌': 'raising hands',
      '🤝': 'handshake',
      '🙏': 'folded hands',
      '❤️': 'red heart',
      '💙': 'blue heart',
      '💚': 'green heart',
      '💛': 'yellow heart',
      '💜': 'purple heart',
      '🧡': 'orange heart',
      '🖤': 'black heart',
      '🤍': 'white heart',
      '💔': 'broken heart',
      '✅': 'check mark',
      '❌': 'cross mark',
      '⭕': 'heavy large circle',
      '❗': 'exclamation mark',
      '❓': 'question mark',
      '💯': 'hundred points',
      '🔥': 'fire',
      '⚡': 'high voltage',
      '💪': 'flexed biceps',
      '🎉': 'party popper',
      '🎊': 'confetti ball'
    }
    return emojiNames[emoji] || emoji
  }

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      ref={pickerRef}
      className="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
    >
      {/* Header con ricerca */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca emoji..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
          />
        </div>
      </div>

      {/* Categorie */}
      {!searchTerm && (
        <div className="flex border-b border-gray-200">
          {Object.entries(EMOJI_CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeCategory === key
                  ? 'bg-[#0D3F85] text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {category.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Grid emoji */}
      <div className="p-3 max-h-64 overflow-y-auto">
        <div className="grid grid-cols-8 gap-1">
          {(searchTerm ? filteredEmojis : EMOJI_CATEGORIES[activeCategory as keyof typeof EMOJI_CATEGORIES]?.emojis || []).map((emoji, index) => (
            <button
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
              title={getEmojiName(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
        
        {searchTerm && filteredEmojis.length === 0 && (
          <div className="text-center text-gray-500 py-4">
            Nessun emoji trovato
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
        Clicca su un emoji per aggiungerlo
      </div>
    </div>
  )
}

export default EmojiPicker