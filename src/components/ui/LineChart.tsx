import './LineChart.css'

type Series = {
  id: string
  label: string
  color: string
  values: number[]
}

type LineChartProps = {
  series: Series[]
  labels: string[]
  height?: number
  // when true, renders a single momentum line instead of per-habit lines
  momentum?: boolean
}

export function LineChart({
  series,
  labels,
  height = 160,
  momentum = false,
}: LineChartProps) {
  const width = 100
  const padding = { top: 8, right: 4, bottom: 4, left: 4 }
  const chartH = height - padding.top - padding.bottom

  if (series.length === 0 || labels.length === 0) {
    return <div className="line-chart line-chart--empty">No data yet</div>
  }

  // For momentum mode collapse all series into one combined line
  const displaySeries = momentum
    ? [
        {
          id: 'momentum',
          label: 'Overall momentum',
          color: series[0]?.color ?? '#4f6ef7',
          values: series[0]?.values ?? [],
        },
      ]
    : series

  const maxVal = Math.max(1, ...displaySeries.flatMap((s) => s.values))
  const stepX =
    labels.length > 1
      ? (width - padding.left - padding.right) / (labels.length - 1)
      : 0

  function pointCoords(values: number[]) {
    return values.map((v, i) => {
      const x = padding.left + i * stepX
      const y = padding.top + chartH - (v / maxVal) * chartH
      return `${x},${y}`
    })
  }

  // build a filled area path for the momentum line
  function areaPath(values: number[]): string {
    if (values.length === 0) return ''
    const pts = values.map((v, i) => {
      const x = padding.left + i * stepX
      const y = padding.top + chartH - (v / maxVal) * chartH
      return [x, y] as [number, number]
    })
    const baseline = padding.top + chartH
    const first = pts[0]
    const last = pts[pts.length - 1]
    const linePart = pts.map(([x, y]) => `${x},${y}`).join(' ')
    return `M ${first[0]},${baseline} L ${linePart} L ${last[0]},${baseline} Z`
  }

  return (
    <div className="line-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="line-chart__svg"
        role="img"
        aria-label={momentum ? 'Momentum chart' : 'Progress chart'}
      >
        <defs>
          {momentum &&
            displaySeries.map((s) => (
              <linearGradient
                key={`grad-${s.id}`}
                id={`grad-${s.id}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={s.color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={s.color} stopOpacity="0.02" />
              </linearGradient>
            ))}
        </defs>

        {/* filled area — momentum mode only */}
        {momentum &&
          displaySeries.map((s) => (
            <path
              key={`area-${s.id}`}
              d={areaPath(s.values)}
              fill={`url(#grad-${s.id})`}
            />
          ))}

        {/* the line(s) */}
        {displaySeries.map((s) => (
          <polyline
            key={s.id}
            fill="none"
            stroke={s.color}
            strokeWidth={momentum ? '2' : '1.5'}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            points={pointCoords(s.values).join(' ')}
          />
        ))}

        {/* 100% reference line — momentum mode only */}
        {momentum && (
          <line
            x1={padding.left}
            y1={padding.top}
            x2={width - padding.right}
            y2={padding.top}
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2 2"
            opacity="0.2"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>

      <div className="line-chart__legend">
        {momentum ? (
          // single legend entry for momentum
          <span className="line-chart__legend-item">
            <span
              className="line-chart__dot"
              style={{ background: displaySeries[0].color }}
            />
            Overall momentum
          </span>
        ) : (
          series.map((s) => (
            <span key={s.id} className="line-chart__legend-item">
              <span
                className="line-chart__dot"
                style={{ background: s.color }}
              />
              {s.label}
            </span>
          ))
        )}
      </div>
    </div>
  )
}