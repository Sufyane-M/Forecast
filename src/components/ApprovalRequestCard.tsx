import React, { useState } from 'react'
import { Clock, User, Calendar, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'
import { supabase } from '../lib/supabase'

interface ApprovalRequest {
  id: string
  title: string
  description?: string
  status: 'pending' | 'approved' | 'rejected' | 'expired'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  request_type: string
  sla_deadline: string
  created_at: string
  requester: {
    full_name: string
    email: string
  }
  approver?: {
    full_name: string
    email: string
  }
  approval_notes?: string
  rejection_reason?: string
}

interface ApprovalRequestCardProps {
  request: ApprovalRequest
  onUpdate: () => void
  canApprove?: boolean
}

export const ApprovalRequestCard: React.FC<ApprovalRequestCardProps> = ({
  request,
  onUpdate,
  canApprove = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showNotes, setShowNotes] = useState(false)
  const [notes, setNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')

  const getStatusIcon = () => {
    switch (request.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = () => {
    switch (request.status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'expired':
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = () => {
    switch (request.priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800'
      case 'normal':
        return 'bg-blue-100 text-blue-800'
      case 'low':
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isOverdue = () => {
    return new Date(request.sla_deadline) < new Date() && request.status === 'pending'
  }

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      const { error } = await supabase.rpc('approve_request', {
        p_request_id: request.id,
        p_approver_id: (await supabase.auth.getUser()).data.user?.id,
        p_notes: notes || null
      })

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Errore durante l\'approvazione:', error)
      alert('Errore durante l\'approvazione della richiesta')
    } finally {
      setIsProcessing(false)
      setShowNotes(false)
      setNotes('')
    }
  }

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Inserisci un motivo per il rifiuto')
      return
    }

    setIsProcessing(true)
    try {
      const { error } = await supabase.rpc('reject_request', {
        p_request_id: request.id,
        p_approver_id: (await supabase.auth.getUser()).data.user?.id,
        p_reason: rejectionReason
      })

      if (error) throw error
      onUpdate()
    } catch (error) {
      console.error('Errore durante il rifiuto:', error)
      alert('Errore durante il rifiuto della richiesta')
    } finally {
      setIsProcessing(false)
      setRejectionReason('')
    }
  }

  return (
    <Card className={`p-4 ${isOverdue() ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <h3 className="font-medium text-[#333333]">{request.title}</h3>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor()}`}>
            {request.priority.toUpperCase()}
          </span>
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor()}`}>
            {request.status.toUpperCase()}
          </span>
        </div>
      </div>

      {request.description && (
        <p className="text-sm text-[#333333]/70 mb-3">{request.description}</p>
      )}

      <div className="grid grid-cols-2 gap-4 text-sm mb-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#333333]/60" />
          <span className="text-[#333333]/60">Richiedente:</span>
          <span className="font-medium">{request.requester.full_name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-[#333333]/60" />
          <span className="text-[#333333]/60">Scadenza:</span>
          <span className={`font-medium ${isOverdue() ? 'text-red-600' : ''}`}>
            {new Date(request.sla_deadline).toLocaleDateString('it-IT', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
        </div>
      </div>

      {request.approval_notes && (
        <div className="bg-green-50 border border-green-200 rounded p-3 mb-3">
          <p className="text-sm text-green-800">
            <strong>Note di approvazione:</strong> {request.approval_notes}
          </p>
        </div>
      )}

      {request.rejection_reason && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
          <p className="text-sm text-red-800">
            <strong>Motivo del rifiuto:</strong> {request.rejection_reason}
          </p>
        </div>
      )}

      {canApprove && request.status === 'pending' && (
        <div className="space-y-3">
          {showNotes && (
            <div>
              <label className="block text-sm font-medium text-[#333333] mb-1">
                Note (opzionali)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="Aggiungi note per l'approvazione..."
              />
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (showNotes) {
                  handleApprove()
                } else {
                  setShowNotes(true)
                }
              }}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {showNotes ? 'Conferma Approvazione' : 'Approva'}
            </Button>
            
            <Button
              onClick={() => {
                const reason = prompt('Inserisci il motivo del rifiuto:')
                if (reason) {
                  setRejectionReason(reason)
                  handleReject()
                }
              }}
              disabled={isProcessing}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Rifiuta
            </Button>

            {showNotes && (
              <Button
                onClick={() => {
                  setShowNotes(false)
                  setNotes('')
                }}
                variant="outline"
              >
                Annulla
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}