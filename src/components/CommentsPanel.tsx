import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { 
  MessageSquare, 
  Send, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  User, 
  Smile,
  Paperclip,
  MoreVertical,
  CheckCircle,
  RotateCcw,
  Reply,
  Clock,
  AlertCircle
} from 'lucide-react'
import { UserMentionInput } from './UserMentionInput'
import { EmojiPicker } from './EmojiPicker'
import { FileUpload } from './FileUpload'
import { Button } from './ui/Button'
import { LoadingSpinner } from './ui/LoadingSpinner'

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

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

interface CommentReaction {
  id: string
  emoji: string
  user_id: string
  user?: User
}

interface CommentMention {
  id: string
  user_id: string
  user?: User
}

interface Comment {
  id: string
  forecast_data_id: string
  parent_comment_id: string | null
  author_id: string
  content: string
  raw_content?: string
  status: 'open' | 'resolved' | 'reopened'
  is_resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  reopened_by: string | null
  reopened_at: string | null
  is_edited: boolean
  edited_at: string | null
  created_at: string
  updated_at: string
  author?: User
  mentions?: CommentMention[]
  attachments?: FileAttachment[]
  reactions?: CommentReaction[]
  replies?: Comment[]
}

interface CommentsPanelProps {
  forecastDataId: string
  isOpen: boolean
  onClose: () => void
}

export const CommentsPanel: React.FC<CommentsPanelProps> = ({
  forecastDataId,
  isOpen,
  onClose
}) => {
  const { profile } = useAuthStore()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [newCommentMentions, setNewCommentMentions] = useState<User[]>([])
  const [newCommentAttachments, setNewCommentAttachments] = useState<FileAttachment[]>([])
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editMentions, setEditMentions] = useState<User[]>([])
  const [editAttachments, setEditAttachments] = useState<FileAttachment[]>([])
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [replyMentions, setReplyMentions] = useState<User[]>([])
  const [replyAttachments, setReplyAttachments] = useState<FileAttachment[]>([])
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && forecastDataId) {
      loadComments()
      setupRealtimeSubscription()
    }
    return () => {
      // Cleanup subscription
    }
  }, [isOpen, forecastDataId])

  useEffect(() => {
    scrollToBottom()
  }, [comments])

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('comments_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `forecast_data_id=eq.${forecastDataId}`
        },
        () => {
          loadComments()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const loadComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase.rpc('get_comments_with_details', {
        p_forecast_data_id: forecastDataId
      })

      if (error) throw error
      setComments(data || [])
    } catch (error) {
      console.error('Errore nel caricamento dei commenti:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !profile?.id) return

    try {
      setSubmitting(true)
      
      // Upload allegati se presenti
      const uploadedAttachments = []
      for (const attachment of newCommentAttachments) {
        if (!attachment.uploaded && attachment.file) {
          // Upload file logic here
          uploadedAttachments.push(attachment)
        } else if (attachment.uploaded) {
          uploadedAttachments.push(attachment)
        }
      }

      const { data, error } = await supabase.rpc('create_comment_with_mentions', {
        p_forecast_data_id: forecastDataId,
        p_content: newComment.trim(),
        p_raw_content: newComment.trim(),
        p_mentioned_user_ids: newCommentMentions.map(u => u.id),
        p_parent_comment_id: null
      })

      if (error) throw error

      // Reset form
      setNewComment('')
      setNewCommentMentions([])
      setNewCommentAttachments([])
      
      // Reload comments
      loadComments()
    } catch (error) {
      console.error('Errore nell\'aggiunta del commento:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleReplySubmit = async (parentId: string) => {
    if (!replyContent.trim() || !profile?.id) return

    try {
      setSubmitting(true)
      
      const { data, error } = await supabase.rpc('create_comment_with_mentions', {
        p_forecast_data_id: forecastDataId,
        p_content: replyContent.trim(),
        p_raw_content: replyContent.trim(),
        p_mentioned_user_ids: replyMentions.map(u => u.id),
        p_parent_comment_id: parentId
      })

      if (error) throw error

      // Reset reply form
      setReplyingTo(null)
      setReplyContent('')
      setReplyMentions([])
      setReplyAttachments([])
      
      // Reload comments
      loadComments()
    } catch (error) {
      console.error('Errore nella risposta:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editContent.trim(),
          raw_content: editContent.trim(),
          is_edited: true,
          edited_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (error) throw error

      setEditingComment(null)
      setEditContent('')
      setEditMentions([])
      setEditAttachments([])
      loadComments()
    } catch (error) {
      console.error('Errore nella modifica del commento:', error)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo commento?')) return

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) throw error
      loadComments()
    } catch (error) {
      console.error('Errore nell\'eliminazione del commento:', error)
    }
  }

  const handleChangeStatus = async (commentId: string, newStatus: 'resolved' | 'reopened') => {
    try {
      const { error } = await supabase.rpc('change_comment_status', {
        p_comment_id: commentId,
        p_new_status: newStatus,
        p_notes: ''
      })

      if (error) throw error
      loadComments()
    } catch (error) {
      console.error('Errore nel cambio di stato:', error)
    }
  }

  const handleEmojiSelect = async (commentId: string, emoji: string) => {
    try {
      const { error } = await supabase.rpc('toggle_comment_reaction', {
        p_comment_id: commentId,
        p_emoji: emoji
      })

      if (error) throw error
      setShowEmojiPicker(null)
      loadComments()
    } catch (error) {
      console.error('Errore nella reazione:', error)
    }
  }

  const startEdit = (comment: Comment) => {
    setEditingComment(comment.id)
    setEditContent(comment.raw_content || comment.content)
    setEditMentions(comment.mentions?.map(m => m.user!).filter(Boolean) || [])
    setEditAttachments(comment.attachments || [])
  }

  const cancelEdit = () => {
    setEditingComment(null)
    setEditContent('')
    setEditMentions([])
    setEditAttachments([])
  }

  const startReply = (commentId: string) => {
    setReplyingTo(commentId)
    setReplyContent('')
    setReplyMentions([])
    setReplyAttachments([])
  }

  const cancelReply = () => {
    setReplyingTo(null)
    setReplyContent('')
    setReplyMentions([])
    setReplyAttachments([])
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60)
      return `${diffInMinutes} min fa`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} ore fa`
    } else {
      return date.toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    }
  }

  const renderMentions = (content: string) => {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g
    return content.replace(mentionRegex, (match, name, userId) => {
      return `<span class="bg-blue-100 text-blue-800 px-1 rounded font-medium">@${name}</span>`
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'reopened':
        return <RotateCcw className="h-4 w-4 text-orange-600" />
      default:
        return <MessageSquare className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-50 border-green-200'
      case 'reopened':
        return 'bg-orange-50 border-orange-200'
      default:
        return 'bg-white border-gray-200'
    }
  }

  const filteredComments = comments.filter(comment => {
    if (filter === 'all') return true
    if (filter === 'resolved') return comment.status === 'resolved'
    if (filter === 'open') return comment.status !== 'resolved'
    return true
  })

  const canEdit = (comment: Comment) => {
    return comment.author_id === profile?.id
  }

  const canResolve = (comment: Comment) => {
    return profile?.role === 'admin' || comment.author_id === profile?.id
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 text-[#0D3F85] mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Commenti Avanzati ({filteredComments.length})
              </h3>
            </div>
            
            {/* Filtri */}
            <div className="flex items-center gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-[#0D3F85] focus:border-transparent"
              >
                <option value="all">Tutti</option>
                <option value="open">Aperti</option>
                <option value="resolved">Risolti</option>
              </select>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <LoadingSpinner size="lg" />
              <p className="text-gray-600 mt-4">Caricamento commenti...</p>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun commento {filter !== 'all' ? filter : ''}</p>
              <p className="text-sm text-gray-500">Aggiungi il primo commento qui sotto</p>
            </div>
          ) : (
            filteredComments.map(comment => (
              <div 
                key={comment.id} 
                className={`border rounded-lg p-4 transition-all ${getStatusColor(comment.status)}`}
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#0D3F85] rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {comment.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">
                          {comment.author?.full_name || 'Utente'}
                        </p>
                        {getStatusIcon(comment.status)}
                        {comment.is_edited && (
                          <span className="text-xs text-gray-500">(modificato)</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatDate(comment.created_at)}
                        {comment.author?.role && (
                          <span className="bg-gray-100 px-1 rounded text-xs">
                            {comment.author.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {/* Emoji Picker */}
                    <div className="relative">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowEmojiPicker(
                          showEmojiPicker === comment.id ? null : comment.id
                        )}
                        className="p-1 h-8 w-8"
                      >
                        <Smile className="h-4 w-4" />
                      </Button>
                      
                      {showEmojiPicker === comment.id && (
                        <div className="absolute top-full right-0 mt-1 z-10">
                          <EmojiPicker
                            isOpen={true}
                            onEmojiSelect={(emoji) => handleEmojiSelect(comment.id, emoji)}
                            onClose={() => setShowEmojiPicker(null)}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Reply */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => startReply(comment.id)}
                      className="p-1 h-8 w-8"
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                    
                    {/* Status Actions */}
                    {canResolve(comment) && (
                      <>
                        {comment.status !== 'resolved' ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeStatus(comment.id, 'resolved')}
                            className="p-1 h-8 w-8 text-green-600 hover:bg-green-50"
                            title="Risolvi"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleChangeStatus(comment.id, 'reopened')}
                            className="p-1 h-8 w-8 text-orange-600 hover:bg-orange-50"
                            title="Riapri"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    
                    {/* Edit/Delete */}
                    {canEdit(comment) && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startEdit(comment)}
                          className="p-1 h-8 w-8"
                          title="Modifica"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 h-8 w-8 text-red-600 hover:bg-red-50"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Comment Content */}
                {editingComment === comment.id ? (
                  <div className="space-y-3">
                    <UserMentionInput
                      value={editContent}
                      onChange={(value, mentions) => {
                        setEditContent(value)
                        setEditMentions(mentions)
                      }}
                      placeholder="Modifica il commento..."
                    />
                    
                    <FileUpload
                      attachments={editAttachments}
                      onAttachmentsChange={setEditAttachments}
                      maxFiles={3}
                    />
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleEditComment(comment.id)}
                        disabled={!editContent.trim()}
                        className="bg-[#0D3F85] hover:bg-[#0D3F85]/90"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Salva
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Annulla
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Content with mentions */}
                    <div 
                      className="text-gray-700 whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: renderMentions(comment.content) }}
                    />
                    
                    {/* Attachments */}
                    {comment.attachments && comment.attachments.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-gray-700">Allegati:</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {comment.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                              <Paperclip className="h-4 w-4 text-gray-500" />
                              <span className="text-sm text-gray-700 truncate">
                                {attachment.file_name}
                              </span>
                              {attachment.preview_url && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(attachment.preview_url, '_blank')}
                                  className="p-1 h-6 w-6"
                                >
                                  <Eye className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Reactions */}
                    {comment.reactions && comment.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(
                          comment.reactions.reduce((acc, reaction) => {
                            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1
                            return acc
                          }, {} as Record<string, number>)
                        ).map(([emoji, count]) => (
                          <button
                            key={emoji}
                            onClick={() => handleEmojiSelect(comment.id, emoji)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs"
                          >
                            <span>{emoji}</span>
                            <span className="text-gray-600">{count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Reply Form */}
                {replyingTo === comment.id && (
                  <div className="mt-4 pl-8 border-l-2 border-gray-200 space-y-3">
                    <UserMentionInput
                      value={replyContent}
                      onChange={(value, mentions) => {
                        setReplyContent(value)
                        setReplyMentions(mentions)
                      }}
                      placeholder={`Rispondi a ${comment.author?.full_name}...`}
                    />
                    
                    <FileUpload
                      attachments={replyAttachments}
                      onAttachmentsChange={setReplyAttachments}
                      maxFiles={2}
                    />
                    
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={!replyContent.trim() || submitting}
                        className="bg-[#0D3F85] hover:bg-[#0D3F85]/90"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        {submitting ? 'Invio...' : 'Rispondi'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={cancelReply}
                      >
                        Annulla
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Replies */}
                {comment.replies && comment.replies.length > 0 && (
                  <div className="mt-4 pl-8 border-l-2 border-gray-200 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="bg-gray-50 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-[#0D3F85] rounded-full flex items-center justify-center">
                            <span className="text-white font-medium text-xs">
                              {reply.author?.full_name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <span className="font-medium text-sm">{reply.author?.full_name}</span>
                          <span className="text-xs text-gray-500">{formatDate(reply.created_at)}</span>
                        </div>
                        <div 
                          className="text-sm text-gray-700"
                          dangerouslySetInnerHTML={{ __html: renderMentions(reply.content) }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={commentsEndRef} />
        </div>

        {/* New Comment Form */}
        <div className="border-t border-gray-200 p-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Nuovo Commento
            </h4>
            
            <UserMentionInput
              value={newComment}
              onChange={(value, mentions) => {
                setNewComment(value)
                setNewCommentMentions(mentions)
              }}
              placeholder="Scrivi un commento... Usa @ per menzionare utenti"
            />
            
            <FileUpload
              attachments={newCommentAttachments}
              onAttachmentsChange={setNewCommentAttachments}
              maxFiles={5}
            />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Smile className="h-4 w-4" />
                <span>Usa emoji, mention (@) e allegati per commenti più ricchi</span>
              </div>
              
              <Button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="bg-[#0D3F85] hover:bg-[#0D3F85]/90"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Invio...' : 'Invia Commento'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
 }