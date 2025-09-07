import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { formatUnits } from 'viem'
import { useMemberBalanceHistory } from '@/hooks/useMemberBalanceHistory'
import { useTokenInfo } from '@/hooks/useTokenInfo'

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

    const points = balanceHistory.map((point, index) => {
      const balance = formatUnits(point.cumulativeBalance, tokenInfo.decimals)
      return {
        x: index,
        y: Number.parseFloat(balance),
        timestamp: point.timestamp,
        balance: point.balance,
      }
    })

    const maxY = Math.max(...points.map(p => p.y))
    const minY = Math.min(...points.map(p => p.y))
    const yRange = maxY - minY || 1

    return {
      points,
      maxY,
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

  const { points, maxY, minY, yRange } = chartData
  const chartWidth = 600
  const chartHeight = 200
  const padding = 40

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
          </defs>
          <rect
            width={chartWidth}
            height={chartHeight}
            fill="url(#grid)"
          />

          {/* Chart line */}
          <path
            d={pathData}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
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
                r="3"
                fill="hsl(var(--primary))"
                className="hover:r-4 transition-all cursor-pointer"
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

          {/* Y-axis labels */}
          <text
            x={padding - 10}
            y={padding}
            textAnchor="end"
            className="text-xs fill-secondary"
          >
            {maxY.toFixed(2)}
          </text>
          <text
            x={padding - 10}
            y={chartHeight - padding + 5}
            textAnchor="end"
            className="text-xs fill-secondary"
          >
            {minY.toFixed(2)}
          </text>

          {/* X-axis labels */}
          {points.length > 1 && (
            <>
              <text
                x={padding}
                y={chartHeight + 20}
                textAnchor="start"
                className="text-xs fill-secondary"
              >
                {new Date(points[0].timestamp).toLocaleDateString()}
              </text>
              <text
                x={chartWidth - padding}
                y={chartHeight + 20}
                textAnchor="end"
                className="text-xs fill-secondary"
              >
                {new Date(points[points.length - 1].timestamp).toLocaleDateString()}
              </text>
            </>
          )}
        </svg>
      </div>
    </div>
  )
}
