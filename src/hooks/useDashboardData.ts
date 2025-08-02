import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'

export interface KPIData {
  budgetDichiarato: number
  budgetAttivo: number
  fastRolling: number
  variance: {
    dichiarato: number
    attivo: number
    fastRolling: number
  }
}

export interface Alert {
  id: string
  type: 'warning' | 'error'
  message: string
  client: string
  businessLine: string
}

export interface PendingAction {
  id: string
  type: 'draft' | 'approval' | 'comment'
  title: string
  description: string
  dueDate?: string
  scenarioId?: string
}

export interface BusinessLineData {
  id: string
  name: string
  budgetDichiarato: number
  budgetAttivo: number
  fastRolling: number
}

export interface DashboardData {
  kpiData: KPIData
  businessLineData: BusinessLineData[]
  alerts: Alert[]
  pendingActions: PendingAction[]
  isLoading: boolean
  error: string | null
}

const VARIANCE_THRESHOLD = 0.1 // 10%
const FAST_ROLLING_THRESHOLD = 0.12 // 12%

export const useDashboardData = (): DashboardData => {
  const { profile } = useAuthStore()
  const [data, setData] = useState<DashboardData>({
    kpiData: {
      budgetDichiarato: 0,
      budgetAttivo: 0,
      fastRolling: 0,
      variance: {
        dichiarato: 0,
        attivo: 0,
        fastRolling: 0
      }
    },
    businessLineData: [],
    alerts: [],
    pendingActions: [],
    isLoading: true,
    error: null
  })

  const fetchKPIData = async () => {
    try {
      // Fetch most recent approved scenario data
      const { data: latestScenario, error: scenarioError } = await supabase
        .from('forecast_scenarios')
        .select('id, year, month, status')
        .eq('status', 'approved')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1)
        .single()

      if (scenarioError) {
        console.warn('No approved scenarios found, using latest scenario:', scenarioError)
        // Fallback to latest scenario regardless of status
        const { data: fallbackScenario, error: fallbackError } = await supabase
          .from('forecast_scenarios')
          .select('id, year, month, status')
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(1)
          .single()
        
        if (fallbackError) throw fallbackError
        
        const { data: currentData, error: currentError } = await supabase
          .from('forecast_data')
          .select(`
            budget_dichiarato,
            budget_attivo,
            fast_rolling
          `)
          .eq('scenario_id', fallbackScenario.id)
        
        if (currentError) throw currentError
        
        // For variance calculation, use empty previous data since we don't have historical data
        const currentTotals = currentData?.reduce(
          (acc, item) => ({
            budgetDichiarato: acc.budgetDichiarato + (parseFloat(item.budget_dichiarato) || 0),
            budgetAttivo: acc.budgetAttivo + (parseFloat(item.budget_attivo) || 0),
            fastRolling: acc.fastRolling + (parseFloat(item.fast_rolling) || 0)
          }),
          { budgetDichiarato: 0, budgetAttivo: 0, fastRolling: 0 }
        ) || { budgetDichiarato: 0, budgetAttivo: 0, fastRolling: 0 }

        return {
          budgetDichiarato: currentTotals.budgetDichiarato,
          budgetAttivo: currentTotals.budgetAttivo,
          fastRolling: currentTotals.fastRolling,
          variance: {
            dichiarato: 0,
            attivo: 0,
            fastRolling: 0
          }
        }
      }

      // Fetch current data from approved scenario
      const { data: currentData, error: currentError } = await supabase
        .from('forecast_data')
        .select(`
          budget_dichiarato,
          budget_attivo,
          fast_rolling
        `)
        .eq('scenario_id', latestScenario.id)

      if (currentError) throw currentError

      // Fetch previous month data for variance calculation
      const prevMonth = new Date().getMonth() === 0 ? 12 : new Date().getMonth()
      const prevYear = new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear()
      
      const { data: prevData, error: prevError } = await supabase
        .from('forecast_data')
        .select(`
          budget_dichiarato,
          budget_attivo,
          fast_rolling,
          forecast_scenarios!inner(
            year,
            month,
            status
          )
        `)
        .eq('forecast_scenarios.year', prevYear)
        .eq('forecast_scenarios.month', prevMonth)
        .eq('forecast_scenarios.status', 'approved')

      if (prevError) throw prevError

      // Calculate totals
      const currentTotals = currentData?.reduce(
        (acc, item) => ({
          budgetDichiarato: acc.budgetDichiarato + (parseFloat(item.budget_dichiarato) || 0),
          budgetAttivo: acc.budgetAttivo + (parseFloat(item.budget_attivo) || 0),
          fastRolling: acc.fastRolling + (parseFloat(item.fast_rolling) || 0)
        }),
        { budgetDichiarato: 0, budgetAttivo: 0, fastRolling: 0 }
      ) || { budgetDichiarato: 0, budgetAttivo: 0, fastRolling: 0 }

      const prevTotals = prevData?.reduce(
        (acc, item) => ({
          budgetDichiarato: acc.budgetDichiarato + (parseFloat(item.budget_dichiarato) || 0),
          budgetAttivo: acc.budgetAttivo + (parseFloat(item.budget_attivo) || 0),
          fastRolling: acc.fastRolling + (parseFloat(item.fast_rolling) || 0)
        }),
        { budgetDichiarato: 0, budgetAttivo: 0, fastRolling: 0 }
      ) || { budgetDichiarato: 0, budgetAttivo: 0, fastRolling: 0 }

      // Calculate variances
      const calculateVariance = (current: number, previous: number) => {
        if (previous === 0) return 0
        return ((current - previous) / previous) * 100
      }

      return {
        budgetDichiarato: currentTotals.budgetDichiarato,
        budgetAttivo: currentTotals.budgetAttivo,
        fastRolling: currentTotals.fastRolling,
        variance: {
          dichiarato: calculateVariance(currentTotals.budgetDichiarato, prevTotals.budgetDichiarato),
          attivo: calculateVariance(currentTotals.budgetAttivo, prevTotals.budgetAttivo),
          fastRolling: calculateVariance(currentTotals.fastRolling, prevTotals.fastRolling)
        }
      }
    } catch (error) {
      console.error('Error fetching KPI data:', error)
      throw error
    }
  }

  const fetchBusinessLineData = async (): Promise<BusinessLineData[]> => {
    try {
      // Get the latest approved scenario (or fallback to latest)
      const { data: latestScenario, error: scenarioError } = await supabase
        .from('forecast_scenarios')
        .select('id')
        .eq('status', 'approved')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1)
        .single()

      let scenarioId = latestScenario?.id
      
      if (scenarioError) {
        // Fallback to latest scenario regardless of status
        const { data: fallbackScenario, error: fallbackError } = await supabase
          .from('forecast_scenarios')
          .select('id')
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(1)
          .single()
        
        if (fallbackError) throw fallbackError
        scenarioId = fallbackScenario.id
      }

      const { data: forecastData, error } = await supabase
        .from('forecast_data')
        .select(`
          budget_dichiarato,
          budget_attivo,
          fast_rolling,
          business_lines!inner(
            id,
            name
          )
        `)
        .eq('scenario_id', scenarioId)

      if (error) throw error

      // Group by business line
      const businessLineMap = new Map<string, BusinessLineData>()

      forecastData?.forEach((item) => {
        const blId = item.business_lines.id
        const blName = item.business_lines.name
        
        if (!businessLineMap.has(blId)) {
          businessLineMap.set(blId, {
            id: blId,
            name: blName,
            budgetDichiarato: 0,
            budgetAttivo: 0,
            fastRolling: 0
          })
        }

        const bl = businessLineMap.get(blId)!
        bl.budgetDichiarato += parseFloat(item.budget_dichiarato) || 0
        bl.budgetAttivo += parseFloat(item.budget_attivo) || 0
        bl.fastRolling += parseFloat(item.fast_rolling) || 0
      })

      return Array.from(businessLineMap.values())
    } catch (error) {
      console.error('Error fetching business line data:', error)
      throw error
    }
  }

  const fetchAlerts = async () => {
    try {
      // Get the latest approved scenario (or fallback to latest)
      const { data: latestScenario, error: scenarioError } = await supabase
        .from('forecast_scenarios')
        .select('id')
        .eq('status', 'approved')
        .order('year', { ascending: false })
        .order('month', { ascending: false })
        .limit(1)
        .single()

      let scenarioId = latestScenario?.id
      
      if (scenarioError) {
        // Fallback to latest scenario regardless of status
        const { data: fallbackScenario, error: fallbackError } = await supabase
          .from('forecast_scenarios')
          .select('id')
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(1)
          .single()
        
        if (fallbackError) throw fallbackError
        scenarioId = fallbackScenario.id
      }

      const { data: forecastData, error } = await supabase
        .from('forecast_data')
        .select(`
          id,
          budget_dichiarato,
          budget_attivo,
          fast_rolling,
          clients!inner(
            name
          ),
          business_lines!inner(
            name
          )
        `)
        .eq('scenario_id', scenarioId)

      if (error) throw error

      const alerts: Alert[] = []

      forecastData?.forEach((item) => {
        const budgetDichiarato = parseFloat(item.budget_dichiarato) || 0
        const budgetAttivo = parseFloat(item.budget_attivo) || 0
        const fastRolling = parseFloat(item.fast_rolling) || 0

        // Check Fast Rolling vs Budget Attivo
        if (budgetAttivo > 0 && fastRolling > 0) {
          const variance = (fastRolling - budgetAttivo) / budgetAttivo
          if (variance > FAST_ROLLING_THRESHOLD) {
            alerts.push({
              id: `fr-${item.id}`,
              type: 'warning',
              message: `Fast Rolling superiore del ${(variance * 100).toFixed(1)}% rispetto al Budget Attivo`,
              client: item.clients.name,
              businessLine: item.business_lines.name
            })
          }
        }

        // Check Budget Attivo vs Budget Dichiarato
        if (budgetDichiarato > 0 && budgetAttivo > 0) {
          const variance = (budgetAttivo - budgetDichiarato) / budgetDichiarato
          if (variance > VARIANCE_THRESHOLD) {
            alerts.push({
              id: `ba-${item.id}`,
              type: 'error',
              message: `Budget Attivo superiore del ${(variance * 100).toFixed(1)}% rispetto al Dichiarato`,
              client: item.clients.name,
              businessLine: item.business_lines.name
            })
          }
        }
      })

      return alerts
    } catch (error) {
      console.error('Error fetching alerts:', error)
      throw error
    }
  }

  const fetchPendingActions = async () => {
    try {
      const actions: PendingAction[] = []

      // Fetch draft scenarios
      const { data: draftScenarios, error: draftError } = await supabase
        .from('forecast_scenarios')
        .select('*')
        .eq('status', 'draft')
        .eq('created_by', profile?.id)

      if (draftError) throw draftError

      draftScenarios?.forEach((scenario) => {
        actions.push({
          id: `draft-${scenario.id}`,
          type: 'draft',
          title: `${scenario.name}`,
          description: `Completare inserimento dati per ${scenario.month}/${scenario.year}`,
          scenarioId: scenario.id
        })
      })

      // Fetch scenarios pending approval (if user is approver)
      if (profile?.role === 'approver' || profile?.role === 'admin') {
        const { data: pendingScenarios, error: pendingError } = await supabase
          .from('forecast_scenarios')
          .select('*')
          .in('status', ['in_review_1', 'in_review_2'])

        if (pendingError) throw pendingError

        pendingScenarios?.forEach((scenario) => {
          actions.push({
            id: `approval-${scenario.id}`,
            type: 'approval',
            title: `Approvazione ${scenario.name}`,
            description: `In attesa di approvazione per ${scenario.month}/${scenario.year}`,
            dueDate: scenario.cut_off_date || undefined,
            scenarioId: scenario.id
          })
        })
      }

      return actions
    } catch (error) {
      console.error('Error fetching pending actions:', error)
      throw error
    }
  }

  const loadDashboardData = async () => {
    try {
      setData(prev => ({ ...prev, isLoading: true, error: null }))

      const [kpiData, businessLineData, alerts, pendingActions] = await Promise.all([
        fetchKPIData(),
        fetchBusinessLineData(),
        fetchAlerts(),
        fetchPendingActions()
      ])

      setData({
        kpiData,
        businessLineData,
        alerts,
        pendingActions,
        isLoading: false,
        error: null
      })
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Errore nel caricamento dei dati'
      }))
    }
  }

  useEffect(() => {
    if (profile?.id) {
      loadDashboardData()
    }
  }, [profile?.id])

  // Set up real-time subscriptions
  useEffect(() => {
    if (!profile?.id) return

    const forecastDataSubscription = supabase
      .channel('forecast_data_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forecast_data'
        },
        () => {
          loadDashboardData()
        }
      )
      .subscribe()

    const scenarioSubscription = supabase
      .channel('forecast_scenarios_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'forecast_scenarios'
        },
        () => {
          loadDashboardData()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(forecastDataSubscription)
      supabase.removeChannel(scenarioSubscription)
    }
  }, [profile?.id])

  return data
}