import { UsageData } from '../../types/ai-service'

export async function fetchAnthropicUsage(
  apiKey: string
): Promise<Partial<UsageData>> {
  try {
    // Anthropic Admin API for organization usage
    const response = await fetch(
      'https://api.anthropic.com/v1/organizations/usage',
      {
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2024-10-22'
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
