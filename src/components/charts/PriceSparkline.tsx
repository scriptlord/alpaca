import { useEffect, useRef } from 'react'
import { createChart, type IChartApi, type ISeriesApi, LineSeries } from 'lightweight-charts'
import { useMarketDataStore } from '@/stores/market-data'
import { CHART_COLOR_SUCCESS, CHART_COLOR_DANGER } from '@/lib/constants'

const MAX_POINTS = 50

export function PriceSparkline({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Line'> | null>(null)
  const dataRef = useRef<{ time: number; value: number }[]>([])
  const price = useMarketDataStore((s) => s.prices[symbol]?.price)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      width: 120,
      height: 40,
      layout: {
        background: { color: 'transparent' },
        textColor: 'transparent',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { visible: false },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { visible: false },
      timeScale: { visible: false },
      handleScroll: false,
      handleScale: false,
    })

    const series = chart.addSeries(LineSeries, {
      color: CHART_COLOR_SUCCESS,
      lineWidth: 1.5,
      priceLineVisible: false,
      lastValueVisible: false,
    })

    chartRef.current = chart
    seriesRef.current = series

    return () => {
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!price || !seriesRef.current) return

    const now = Math.floor(Date.now() / 1000)
    dataRef.current.push({ time: now, value: price })
    if (dataRef.current.length > MAX_POINTS) {
      dataRef.current = dataRef.current.slice(-MAX_POINTS)
    }

    // Determine color based on trend
    if (dataRef.current.length >= 2) {
      const first = dataRef.current[0].value
      const last = dataRef.current[dataRef.current.length - 1].value
      seriesRef.current.applyOptions({
        color: last >= first ? CHART_COLOR_SUCCESS : CHART_COLOR_DANGER,
      })
    }

    seriesRef.current.setData(
      dataRef.current.map((d, i) => ({
        time: (d.time + i) as unknown as import('lightweight-charts').Time,
        value: d.value,
      }))
    )
  }, [price])

  return <div ref={containerRef} className="inline-block" />
}
