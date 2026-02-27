import { EventEmitter } from 'events'
import { PersistenceService } from './PersistenceService'

interface UsageData {
  serviceId: string
  inputTokens: number
  outputTokens: number
  costUsd: number
  contextWindowMax: number
  contextWindowUsed: number
  lastUpdated: number
  dailyHistory: Array<{
    date: string
    inputTokens: number
    outputTokens: number
    costUsd: number
  }>
}

export class TrackingService extends EventEmitter {
  private intervals = new Map<string, ReturnType<typeof setInterval>>()
  private usageCache = new Map<string, UsageData>()
  private persistence: PersistenceService

  constructor(persistence: PersistenceService) {
    super()
    this.persistence = persistence
  }

  async fetchOpenAIUsage(apiKey: string): Promise<Partial<UsageData>> {
    try {
      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .split('T')[0]

      const response = await fetch(
        `https://api.openai.com/v1/usage?date=${startDate}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` }
        }
      )

      if (!response.ok) return {}

      const data = await response.json()
      const totalTokens = data.data?.reduce(
        (acc: any, d: any) => ({
          inputTokens: acc.inputTokens + (d.n_context_tokens_total || 0),
          outputTokens: acc.outputTokens + (d.n_generated_tokens_total || 0)
        }),
        { inputTokens: 0, outputTokens: 0 }
      ) || { inputTokens: 0, outputTokens: 0 }

      return {
        inputTokens: totalTokens.inputTokens,
        outputTokens: totalTokens.outputTokens,
        costUsd: (totalTokens.inputTokens * 0.00001 + totalTokens.outputTokens * 0.00003), // rough estimate
        lastUpdated: Date.now()
      }
    } catch {
      return {}
    }
  }

  async fetchAnthropicUsage(apiKey: string): Promise<Partial<UsageData>> {
    try {
      const response = await fetch(
        'https://api.anthropic.com/v1/usage',
        {
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2024-01-01'
          }
        }
      )

      if (!response.ok) return {}

      const data = await response.json()
      return {
        inputTokens: data.input_tokens || 0,
        outputTokens: data.output_tokens || 0,
        costUsd: data.total_cost_usd || 0,
        lastUpdated: Date.now()
      }
    } catch {
      return {}
    }
  }

  async refreshUsage(serviceId: string): Promise<void> {
    const services = this.persistence.getServices()
    const service = services.find((s: any) => s.id === serviceId)
    if (!service) return

    const apiKey = this.persistence.getApiKey(serviceId)
    let partialUsage: Partial<UsageData> = {}

    if (apiKey) {
      if (service.provider === 'openai') {
        partialUsage = await this.fetchOpenAIUsage(apiKey)
      } else if (service.provider === 'anthropic') {
        partialUsage = await this.fetchAnthropicUsage(apiKey)
      }
    }

    const existing = this.usageCache.get(serviceId)
    const usage: UsageData = {
      serviceId,
      inputTokens: partialUsage.inputTokens ?? existing?.inputTokens ?? 0,
      outputTokens: partialUsage.outputTokens ?? existing?.outputTokens ?? 0,
      costUsd: partialUsage.costUsd ?? existing?.costUsd ?? 0,
      contextWindowMax: existing?.contextWindowMax ?? 200000,
      contextWindowUsed: existing?.contextWindowUsed ?? 0,
      lastUpdated: Date.now(),
      dailyHistory: existing?.dailyHistory ?? []
    }

    this.usageCache.set(serviceId, usage)
    this.emit('usageUpdate', { serviceId, usage })
  }

  startTracking(serviceId: string, intervalMs: number = 300000): void {
    this.stopTracking(serviceId)

    // Initial fetch
    this.refreshUsage(serviceId)

    // Periodic polling
    const interval = setInterval(() => {
      this.refreshUsage(serviceId)
    }, intervalMs)

    this.intervals.set(serviceId, interval)
  }

  stopTracking(serviceId: string): void {
    const interval = this.intervals.get(serviceId)
    if (interval) {
      clearInterval(interval)
      this.intervals.delete(serviceId)
    }
  }

  stopAll(): void {
    for (const [id] of this.intervals) {
      this.stopTracking(id)
    }
  }

  getUsage(serviceId: string): UsageData | null {
    return this.usageCache.get(serviceId) || null
  }

  getAllUsage(): Record<string, UsageData> {
    const result: Record<string, UsageData> = {}
    for (const [id, usage] of this.usageCache) {
      result[id] = usage
    }
    return result
  }

  updateManualUsage(serviceId: string, data: Partial<UsageData>): void {
    const existing = this.usageCache.get(serviceId) || {
      serviceId,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      contextWindowMax: 200000,
      contextWindowUsed: 0,
      lastUpdated: Date.now(),
      dailyHistory: []
    }

    const usage = { ...existing, ...data, lastUpdated: Date.now() }
    this.usageCache.set(serviceId, usage)
    this.emit('usageUpdate', { serviceId, usage })
  }
}
