import { UsageData } from '../../types/ai-service'

export async function fetchOpenAIUsage(apiKey: string): Promise<Partial<UsageData>> {
  try {
    const now = new Date()
    const startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

    const response = await fetch(
      `https://api.openai.com/v1/organization/usage/completions?start_time=${Math.floor(new Date(startDate).getTime() / 1000)}`,
      {
        headers: { Authorization: `Bearer ${apiKey}` }
      }
    )

    if (!response.ok) return {}

    const data = await response.json()
    let inputTokens = 0
    let outputTokens = 0

    for (const bucket of data.data || []) {
      for (const result of bucket.results || []) {
        inputTokens += result.input_tokens || 0
        outputTokens += result.output_tokens || 0
      }
    }

    // Rough cost estimate
    const costUsd = inputTokens * 0.000003 + outputTokens * 0.000015

    return {
      inputTokens,
      outputTokens,
      costUsd,
      lastUpdated: Date.now()
    }
  } catch {
    return {}
  }
}
