import { UsageData } from '../../types/ai-service'

/**
 * Manual usage tracking - for services without API access.
 * Usage is entered by the user and stored locally.
 */
export function createManualUsage(serviceId: string): UsageData {
  return {
    serviceId,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    contextWindowMax: 200000,
    contextWindowUsed: 0,
    lastUpdated: Date.now(),
    dailyHistory: []
  }
}

export function updateManualUsage(
  existing: UsageData,
  updates: {
    inputTokens?: number
    outputTokens?: number
    costUsd?: number
    contextWindowUsed?: number
  }
): UsageData {
  return {
    ...existing,
    ...updates,
    lastUpdated: Date.now()
  }
}
