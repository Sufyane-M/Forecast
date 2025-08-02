import React, { useState, useRef } from 'react'
import { Upload, X, File, Image, FileText, Download, Eye } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { Button } from './ui/Button'

interface FileAttachment {
  id?: string
  file?: File
  file_name: string
  file_size: number
  file_type: string
  storage_path?: string
  preview_url?: string
  uploaded?: boolean
  uploading?: boolean
}

interface FileUploadProps {
  attachments: FileAttachment[]
  onAttachmentsChange: (attachments: FileAttachment[]) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
  allowedTypes?: string[]
  disabled?: boolean
}

export const FileUpload: React.FC<FileUploadProps> = ({
  attachments,
  onAttachmentsChange,
  maxFiles = 5,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx', '.xls', '.xlsx'],
  disabled = false
}) => {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { profile } = useAuthStore()

  const handleFileSelect = (files: FileList | null) => {
    if (!files || disabled) return

    const newAttachments: FileAttachment[] = []
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      // Controlla il numero massimo di file
      if (attachments.length + newAttachments.length >= maxFiles) {
        alert(`Massimo ${maxFiles} file consentiti`)
        break
      }
      
      // Controlla la dimensione del file
      if (file.size > maxFileSize) {
        alert(`Il file "${file.name}" è troppo grande. Dimensione massima: ${formatFileSize(maxFileSize)}`)
        continue
      }
      
      // Controlla il tipo di file
      if (!isFileTypeAllowed(file, allowedTypes)) {
        alert(`Tipo di file "${file.type}" non consentito per "${file.name}"`)
        continue
      }
      
      const attachment: FileAttachment = {
        file,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        uploaded: false,
        uploading: false
      }
      
      // Genera preview per immagini
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          attachment.preview_url = e.target?.result as string
          onAttachmentsChange([...attachments, ...newAttachments, attachment])
        }
        reader.readAsDataURL(file)
      } else {
        newAttachments.push(attachment)
      }
    }
    
    if (newAttachments.length > 0) {
      onAttachmentsChange([...attachments, ...newAttachments])
    }
  }

  const uploadFile = async (attachment: FileAttachment, index: number) => {
    if (!attachment.file || !profile?.id) return

    // Aggiorna lo stato di upload
    const updatedAttachments = [...attachments]
    updatedAttachments[index] = { ...attachment, uploading: true }
    onAttachmentsChange(updatedAttachments)

    try {
      const fileExt = attachment.file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      const filePath = `comment-attachments/${profile.id}/${fileName}`

      // Upload su Supabase Storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, attachment.file)

      if (error) throw error

      // Ottieni URL pubblico
      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath)

      // Aggiorna l'attachment
      updatedAttachments[index] = {
        ...attachment,
        storage_path: filePath,
        preview_url: attachment.preview_url || publicUrl,
        uploaded: true,
        uploading: false
      }
      
      onAttachmentsChange(updatedAttachments)
    } catch (error) {
      console.error('Error uploading file:', error)
      alert(`Errore durante l'upload di "${attachment.file_name}"`)
      
      // Rimuovi l'attachment in caso di errore
      const filteredAttachments = attachments.filter((_, i) => i !== index)
      onAttachmentsChange(filteredAttachments)
    }
  }

  const removeAttachment = (index: number) => {
    const filteredAttachments = attachments.filter((_, i) => i !== index)
    onAttachmentsChange(filteredAttachments)
  }

  const isFileTypeAllowed = (file: File, allowedTypes: string[]) => {
    return allowedTypes.some(type => {
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type.toLowerCase())
      }
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      return file.type === type
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />
    if (fileType.includes('text')) return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    if (!disabled) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : dragOver
            ? 'border-[#0D3F85] bg-blue-50'
            : 'border-gray-300 hover:border-[#0D3F85] hover:bg-gray-50'
        }`}
      >
        <Upload className={`h-8 w-8 mx-auto mb-2 ${
          disabled ? 'text-gray-400' : 'text-gray-500'
        }`} />
        <p className={`text-sm ${
          disabled ? 'text-gray-400' : 'text-gray-600'
        }`}>
          {disabled
            ? 'Upload disabilitato'
            : 'Clicca per selezionare file o trascinali qui'
          }
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Massimo {maxFiles} file, {formatFileSize(maxFileSize)} per file
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Lista Attachments */}
      {attachments.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">File allegati ({attachments.length})</h4>
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
            >
              {/* Preview/Icon */}
              <div className="flex-shrink-0">
                {attachment.preview_url && attachment.file_type.startsWith('image/') ? (
                  <img
                    src={attachment.preview_url}
                    alt={attachment.file_name}
                    className="w-10 h-10 object-cover rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center">
                    {getFileIcon(attachment.file_type)}
                  </div>
                )}
              </div>

              {/* Info File */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {attachment.file_name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(attachment.file_size)} • {attachment.file_type}
                </p>
                {attachment.uploading && (
                  <p className="text-xs text-blue-600">Upload in corso...</p>
                )}
                {attachment.uploaded && (
                  <p className="text-xs text-green-600">✓ Caricato</p>
                )}
              </div>

              {/* Azioni */}
              <div className="flex items-center gap-1">
                {attachment.uploaded && attachment.preview_url && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(attachment.preview_url, '_blank')}
                    className="p-1 h-8 w-8"
                  >
                    <Eye className="h-3 w-3" />
                  </Button>
                )}
                
                {!attachment.uploaded && !attachment.uploading && (
                  <Button
                    size="sm"
                    onClick={() => uploadFile(attachment, index)}
                    className="bg-[#0D3F85] hover:bg-[#0D3F85]/90 text-white px-2 py-1 text-xs"
                  >
                    Upload
                  </Button>
                )}
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => removeAttachment(index)}
                  disabled={attachment.uploading}
                  className="p-1 h-8 w-8 text-red-600 hover:bg-red-50"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload