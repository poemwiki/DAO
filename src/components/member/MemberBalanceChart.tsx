import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'
import { useMemberBalanceHistory } from '@/hooks/useMemberBalanceHistory'
import { useTokenInfo } from '@/hooks/useTokenInfo'
import { formatCompactNumber } from '@/utils/format'

interface MemberBalanceChartProps {
  address: string
}

export function MemberBalanceChart({ address }: MemberBalanceChartProps) {
  const { t } = useTranslation()
  const { balanceHistory, isLoading, error, warningMessage } = useMemberBalanceHistory(address)
  const { data: tokenInfo } = useTokenInfo()

  const chartData = useMemo(() => {
    if (!balanceHistory.length || !tokenInfo)
      return null

    // Map raw history points
    let points = balanceHistory.map((point, index) => {
      const balance = formatUnits(point.cumulativeBalance, tokenInfo.decimals)
      return {
        x: index,
        y: Number.parseFloat(balance),
        timestamp: point.timestamp,
        balance: point.balance,
      }
    })

    // Remove the first point if it's a zero balance (visual noise: 0.00 at start)
    if (points.length && points[0].y === 0) {
      points = points.slice(1)
      if (!points.length)
        return null
    }

    const minY = Math.min(...points.map(p => p.y))
    const yRange = Math.max(...points.map(p => p.y)) - minY || 1

    return {
      points,
      minY,
      yRange,
    }
  }, [balanceHistory, tokenInfo])

  if (isLoading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-pulse text-secondary">
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-destructive">
          {t('member.balance.chart.error')}
        </div>
      </div>
    )
  }

  if (!chartData || chartData.points.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <div className="text-secondary">
          {t('member.transfers.noTransfers')}
        </div>
      </div>
    )
  }

  const { points, minY, yRange } = chartData
  const chartWidth = 600
  const chartHeight = 240
  const padding = 6
  const yTickCount = 5
  const yTicks = Array.from({ length: yTickCount + 1 }).map((_, i) => minY + (yRange * i) / yTickCount)

  // For X axis choose up to 5 evenly spaced indices including first & last
  const maxXTicks = 5
  let xTickIndices: number[] = []
  if (points.length <= maxXTicks) {
    xTickIndices = points.map((_, i) => i)
  } else {
    xTickIndices = Array.from({ length: maxXTicks }).map((_, i) => Math.round((i / (maxXTicks - 1)) * (points.length - 1)))
    // Deduplicate in rare rounding collisions
    xTickIndices = [...new Set(xTickIndices)]
  }

  // Create SVG path
  const pathData = points
    .map((point, index) => {
      const x = (index / (points.length - 1)) * (chartWidth - 2 * padding) + padding
      const y = chartHeight - padding - ((point.y - minY) / yRange) * (chartHeight - 2 * padding)
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
    })
    .join(' ')

  return (
    <div className="space-y-4">
      {/* Warning message for incomplete data */}
      {warningMessage && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="text-yellow-600 dark:text-yellow-400">
            ⚠️
          </div>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            {warningMessage}
          </div>
        </div>
      )}
      
      {/* Chart */}
      <div className="relative overflow-x-auto">
        <svg
          width={chartWidth}
          height={chartHeight + 40}
          className="min-w-full"
          viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}
        >
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="50"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 50 0 L 0 0 0 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                opacity="0.1"
              />
            </pattern>
            <linearGradient id="balanceLine" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.5" />
            </linearGradient>
            <linearGradient id="balanceFill" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.18" />
              <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect
            width={chartWidth}
            height={chartHeight}
            fill="url(#grid)"
          />

          {/* Area under line for emphasis */}
          {points.length > 1 && (
            <path
              d={`${pathData} L ${(points.length - 1) / (points.length - 1) * (chartWidth - 2 * padding) + padding} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
              fill="url(#balanceFill)"
            />
          )}

          {/* Chart line (polyline emphasized) */}
          <path
            d={pathData}
            fill="none"
            stroke="url(#balanceLine)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            className="drop-shadow-sm"
          />

          {/* Data points */}
          {points.map((point, index) => {
            const x = (index / (points.length - 1)) * (chartWidth - 2 * padding) + padding
            const y = chartHeight - padding - ((point.y - minY) / yRange) * (chartHeight - 2 * padding)

            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill="var(--color-primary)"
                stroke="var(--color-background)" /* outline for better contrast */
                strokeWidth={2}
                className="hover:r-5 transition-all cursor-pointer drop-shadow"
              >
                <title>
                  {new Date(point.timestamp).toLocaleDateString()}
                  {' '}
                  -
                  {point.y.toFixed(2)}
                  {' '}
                  {tokenInfo?.symbol}
                </title>
              </circle>
            )
          })}

          {/* Axes */}
          {/* Y axis line */}
          <line
            x1={padding}
            y1={padding - 5}
            x2={padding}
            y2={chartHeight - padding + 5}
            stroke="currentColor"
            className="opacity-30"
            strokeWidth={1}
          />
          {/* X axis line */}
          <line
            x1={padding - 5}
            y1={chartHeight - padding}
            x2={chartWidth - padding + 5}
            y2={chartHeight - padding}
            stroke="currentColor"
            className="opacity-30"
            strokeWidth={1}
          />

          {/* Y ticks & labels */}
    {yTicks.map((val, i) => {
            const y = chartHeight - padding - ((val - minY) / yRange) * (chartHeight - 2 * padding)
            return (
              <g key={i}>
                <line
                  x1={padding - 4}
                  x2={padding}
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="opacity-40"
                  strokeWidth={1}
                />
                <text
                  x={padding - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-secondary"
                >
      {formatCompactNumber(val, { decimals: 2 })}
                </text>
              </g>
            )
          })}

          {/* X ticks & labels */}
          {xTickIndices.map(idx => {
            const x = (idx / (points.length - 1)) * (chartWidth - 2 * padding) + padding
            return (
              <g key={idx}>
                <line
                  x1={x}
                  x2={x}
                  y1={chartHeight - padding}
                  y2={chartHeight - padding + 4}
                  stroke="currentColor"
                  className="opacity-40"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={chartHeight - padding + 14}
                  textAnchor="middle"
                  className="text-[10px] fill-secondary"
                >
                  {new Date(points[idx].timestamp).toLocaleDateString()}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
