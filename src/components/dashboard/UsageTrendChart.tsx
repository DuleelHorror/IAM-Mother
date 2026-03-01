import React, { useState } from 'react'
import { DailyUsage } from '../../types/ai-service'

interface UsageTrendChartProps {
  dailyHistory: DailyUsage[]
  color: string
}

type ViewMode = '7D' | '30D'

export function UsageTrendChart({ dailyHistory, color }: UsageTrendChartProps) {
  const [view, setView] = useState<ViewMode>('7D')

  const days = view === '7D' ? 7 : 30
  const data = dailyHistory.slice(-days)

  if (data.length === 0) {
    return (
      <div style={{
        padding: 16,
        border: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        textAlign: 'center',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
        fontSize: 10,
        letterSpacing: 1
      }}>
        SIN DATOS DE HISTORIAL
      </div>
    )
  }

  const maxCost = Math.max(...data.map(d => d.costUsd), 0.01)
  const maxTokens = Math.max(
    ...data.map(d => Math.max(d.inputTokens, d.outputTokens)),
    1
  )

  const chartW = 360
  const chartH = 140
  const padL = 40
  const padR = 10
  const padT = 10
  const padB = 24
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB

  const barW = Math.max(4, Math.min(16, plotW / data.length - 2))

  // Grid lines
  const gridLines = 4
  const gridElements: React.ReactNode[] = []
  for (let i = 0; i <= gridLines; i++) {
    const y = padT + (plotH / gridLines) * i
    const val = maxCost * (1 - i / gridLines)
    gridElements.push(
      <line key={`g${i}`} x1={padL} y1={y} x2={chartW - padR} y2={y}
        stroke="var(--border-color)" strokeWidth={0.5} />,
      <text key={`gl${i}`} x={padL - 4} y={y + 3}
        fill="var(--text-muted)" fontSize={7} fontFamily="var(--font-mono)"
        textAnchor="end">
        ${val.toFixed(2)}
      </text>
    )
  }

  // Bars for cost
  const bars = data.map((d, i) => {
    const x = padL + (i / data.length) * plotW + (plotW / data.length - barW) / 2
    const h = (d.costUsd / maxCost) * plotH
    const y = padT + plotH - h
    return (
      <rect key={`b${i}`} x={x} y={y} width={barW} height={Math.max(h, 0.5)}
        fill={color} opacity={0.6}>
        <title>{d.date}: ${d.costUsd.toFixed(4)}</title>
      </rect>
    )
  })

  // Line for input tokens
  const inputPoints = data.map((d, i) => {
    const x = padL + (i + 0.5) / data.length * plotW
    const y = padT + plotH - (d.inputTokens / maxTokens) * plotH
    return `${x},${y}`
  }).join(' ')

  // Line for output tokens
  const outputPoints = data.map((d, i) => {
    const x = padL + (i + 0.5) / data.length * plotW
    const y = padT + plotH - (d.outputTokens / maxTokens) * plotH
    return `${x},${y}`
  }).join(' ')

  // Date labels (show first, middle, last)
  const labelIndices = data.length <= 3
    ? data.map((_, i) => i)
    : [0, Math.floor(data.length / 2), data.length - 1]

  return (
    <div style={{
      border: '1px solid var(--border-color)',
      background: 'var(--bg-secondary)',
      padding: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <span style={{
          fontSize: 9, color: 'var(--text-muted)', letterSpacing: 2,
          fontFamily: 'var(--font-mono)'
        }}>
          TENDENCIA DE USO
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {(['7D', '30D'] as ViewMode[]).map((v) => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '2px 8px', fontSize: 9,
                fontFamily: 'var(--font-mono)', letterSpacing: 1, cursor: 'pointer',
                background: view === v ? 'var(--bg-active)' : 'var(--bg-primary)',
                border: view === v ? '1px solid var(--accent-green)' : '1px solid var(--border-color)',
                color: view === v ? 'var(--accent-green)' : 'var(--text-muted)'
              }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <svg width={chartW} height={chartH} style={{ width: '100%', height: chartH }}>
        {gridElements}
        {bars}
        {data.length > 1 && (
          <>
            <polyline points={inputPoints} fill="none" stroke="var(--accent-green)"
              strokeWidth={1.5} opacity={0.8} />
            <polyline points={outputPoints} fill="none" stroke="var(--accent-amber)"
              strokeWidth={1.5} opacity={0.8} />
          </>
        )}
        {/* Date labels */}
        {labelIndices.map((idx) => {
          const x = padL + (idx + 0.5) / data.length * plotW
          const label = data[idx].date.slice(5) // MM-DD
          return (
            <text key={`d${idx}`} x={x} y={chartH - 4}
              fill="var(--text-muted)" fontSize={7} fontFamily="var(--font-mono)"
              textAnchor="middle">
              {label}
            </text>
          )
        })}
      </svg>

      {/* Legend */}
      <div style={{
        display: 'flex', gap: 16, justifyContent: 'center',
        fontSize: 8, fontFamily: 'var(--font-mono)', letterSpacing: 1
      }}>
        <span style={{ color: 'var(--text-muted)' }}>
          <span style={{
            display: 'inline-block', width: 8, height: 8,
            background: color, opacity: 0.6, marginRight: 4, verticalAlign: 'middle'
          }} />
          COSTE
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          <span style={{
            display: 'inline-block', width: 12, height: 2,
            background: 'var(--accent-green)', marginRight: 4, verticalAlign: 'middle'
          }} />
          INPUT
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          <span style={{
            display: 'inline-block', width: 12, height: 2,
            background: 'var(--accent-amber)', marginRight: 4, verticalAlign: 'middle'
          }} />
          OUTPUT
        </span>
      </div>
    </div>
  )
}
