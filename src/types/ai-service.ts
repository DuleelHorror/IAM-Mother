export type AIProviderType = 'openai' | 'anthropic' | 'google' | 'manual'
export type PanelType = 'terminal' | 'web' | 'dashboard'

export interface AIServiceConfig {
  id: string
  name: string
  provider: AIProviderType
  panelType: PanelType
  /** For web panels: URL to load */
  url?: string
  /** For terminal panels: shell command to run (e.g., 'claude', 'codex') */
  command?: string
  /** Shell to use for terminal panels */
  shell?: string
  /** API key for tracking usage */
  apiKey?: string
  /** Isolated session partition name */
  sessionPartition?: string
  /** Icon/color for identification */
  color: string
  /** Monthly subscription cost in USD */
  subscriptionCost?: number
  /** Subscription renewal date */
  subscriptionRenewalDate?: string
  /** Working directory for terminal panels */
  cwd?: string
  /** Whether this service is enabled */
  enabled: boolean
}

export interface UsageData {
  serviceId: string
  /** Tokens used in current period */
  inputTokens: number
  outputTokens: number
  /** Cost in USD for current period */
  costUsd: number
  /** Context window size */
  contextWindowMax: number
  /** Current context usage (estimated) */
  contextWindowUsed: number
  /** Last updated timestamp */
  lastUpdated: number
  /** Daily usage history */
  dailyHistory: DailyUsage[]
}

export interface DailyUsage {
  date: string
  inputTokens: number
  outputTokens: number
  costUsd: number
}

export const DEFAULT_SERVICES: AIServiceConfig[] = [
  {
    id: 'claude-code',
    name: 'Claude Code',
    provider: 'anthropic',
    panelType: 'terminal',
    command: 'claude',
    color: '#D97706',
    enabled: true
  },
  {
    id: 'codex-cli',
    name: 'Codex CLI',
    provider: 'openai',
    panelType: 'terminal',
    command: 'codex',
    color: '#10B981',
    enabled: true
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT',
    provider: 'openai',
    panelType: 'web',
    url: 'https://chat.openai.com',
    sessionPartition: 'persist:chatgpt',
    color: '#10B981',
    subscriptionCost: 20,
    enabled: true
  },
  {
    id: 'gemini',
    name: 'Gemini',
    provider: 'google',
    panelType: 'web',
    url: 'https://gemini.google.com',
    sessionPartition: 'persist:gemini',
    color: '#4285F4',
    subscriptionCost: 20,
    enabled: true
  },
  {
    id: 'gemini-cli',
    name: 'Gemini CLI',
    provider: 'google',
    panelType: 'terminal',
    command: 'gemini',
    color: '#8AB4F8',
    enabled: true
  },
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    provider: 'manual',
    panelType: 'web',
    url: 'https://elevenlabs.io',
    sessionPartition: 'persist:elevenlabs',
    color: '#FF6B2B',
    enabled: true
  }
]
