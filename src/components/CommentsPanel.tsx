import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { MessageSquare, Send, Edit3, Trash2, Check, X, User } from 'lucide-react'

interface Comment {
  id: string
  forecast_data_id: string
  parent_comment_id: string | null
  author_id: string
  content: string
  mentions: any[]
  attachments: any[]
  is_resolved: boolean
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
  author?: {
    id: string
    full_name: string
    email: string
  }
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
  const [editingComment, setEditingComment] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen && forecastDataId) {
      loadComments()
    }
  }, [isOpen, forecastDataId])

  const loadComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          author:profiles!author_id(
            id,
            full_name,
            email
          )
        `)
        .eq('forecast_data_id', forecastDataId)
        .order('created_at', { ascending: true })

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
      const { data, error } = await supabase
        .from('comments')
        .insert({
          forecast_data_id: forecastDataId,
          author_id: profile.id,
          content: newComment.trim(),
          mentions: [],
          attachments: []
        })
        .select(`
          *,
          author:profiles!author_id(
            id,
            full_name,
            email
          )
        `)
        .single()

      if (error) throw error

      setComments(prev => [...prev, data])
      setNewComment('')
    } catch (error) {
      console.error('Errore nell\'aggiunta del commento:', error)
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
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { ...comment, content: editContent.trim(), updated_at: new Date().toISOString() }
          : comment
      ))
      setEditingComment(null)
      setEditContent('')
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

      setComments(prev => prev.filter(comment => comment.id !== commentId))
    } catch (error) {
      console.error('Errore nell\'eliminazione del commento:', error)
    }
  }

  const handleResolveComment = async (commentId: string, resolved: boolean) => {
    try {
      const { error } = await supabase
        .from('comments')
        .update({
          is_resolved: resolved,
          resolved_by: resolved ? profile?.id : null,
          resolved_at: resolved ? new Date().toISOString() : null
        })
        .eq('id', commentId)

      if (error) throw error

      setComments(prev => prev.map(comment => 
        comment.id === commentId 
          ? { 
              ...comment, 
              is_resolved: resolved,
              resolved_by: resolved ? profile?.id : null,
              resolved_at: resolved ? new Date().toISOString() : null
            }
          : comment
      ))
    } catch (error) {
      console.error('Errore nella risoluzione del commento:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Commenti ({comments.length})
            </h3>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Caricamento commenti...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nessun commento ancora</p>
              <p className="text-sm text-gray-500">Aggiungi il primo commento qui sotto</p>
            </div>
          ) : (
            comments.map(comment => (
              <div 
                key={comment.id} 
                className={`border rounded-lg p-4 ${
                  comment.is_resolved ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <User className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {comment.author?.full_name || 'Utente'}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(comment.created_at)}
                        {comment.updated_at !== comment.created_at && ' (modificato)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {comment.is_resolved && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Risolto
                      </span>
                    )}
                    {comment.author_id === profile?.id && (
                      <>
                        <button
                          onClick={() => {
                            setEditingComment(comment.id)
                            setEditContent(comment.content)
                          }}
                          className="text-gray-400 hover:text-blue-600"
                          title="Modifica"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Elimina"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => handleResolveComment(comment.id, !comment.is_resolved)}
                      className={`text-gray-400 hover:text-green-600 ${
                        comment.is_resolved ? 'text-green-600' : ''
                      }`}
                      title={comment.is_resolved ? 'Riapri' : 'Risolvi'}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                {editingComment === comment.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditComment(comment.id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Salva
                      </button>
                      <button
                        onClick={() => {
                          setEditingComment(null)
                          setEditContent('')
                        }}
                        className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                      >
                        Annulla
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-700 whitespace-pre-wrap">{comment.content}</p>
                )}
              </div>
            ))
          )}
        </div>

        {/* New Comment Form */}
        <div className="border-t border-gray-200 p-6">
          <div className="space-y-3">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Scrivi un commento..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
            <div className="flex items-center justify-end">
              <button
                onClick={handleSubmitComment}
                disabled={!newComment.trim() || submitting}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4 mr-2" />
                {submitting ? 'Invio...' : 'Invia Commento'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}