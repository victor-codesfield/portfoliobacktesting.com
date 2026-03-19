'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart } from 'lightweight-charts';
import StatCard from './StatCard';
import { portfolioAPI } from '../lib/api';
import { CHART_COLORS } from '../lib/constants';

const MC_GREEN = {
  p90: 'rgba(0, 255, 136, 0.10)',
  p75: 'rgba(0, 255, 136, 0.18)',
  p50: 'rgba(0, 255, 136, 0.45)',
  p25: 'rgba(0, 255, 136, 0.18)',
  p10: 'rgba(0, 255, 136, 0.10)',
};

const LINE_KEYS = ['portfolio', 'sp500', 'usd', 'mc'];

export default function PortfolioChart({ analysisData, generationId }) {
  const chartRef = useRef(null);
  const seriesRef = useRef({});
  const containerRef = useRef(null);
  const [exporting, setExporting] = useState(false);
  const [highlighted, setHighlighted] = useState(null);

  const data = analysisData?.analysis || analysisData;
  if (!data?.ticker_results || !data?.combined_portfolio) return null;

  const portfolioValues = data.combined_portfolio.portfolio_values || [];
  const sp500 = data.ticker_results['^GSPC'];
  const usd = data.ticker_results['USD'];
  const customTickers = (data.tickers || []).filter((t) => t !== '^GSPC' && t !== 'USD');
  const mc = data.monte_carlo;

  const firstTickerKey = customTickers[0];
  const firstTicker = firstTickerKey ? data.ticker_results[firstTickerKey] : null;
  const monthlyCloses = firstTicker?.monthly_closes || [];

  const buildSeries = (values) => {
    return values.map((v, i) => {
      let time;
      if (i < monthlyCloses.length && monthlyCloses[i].date && !monthlyCloses[i].date.startsWith('Month')) {
        time = monthlyCloses[i].date;
      } else {
        const d = new Date();
        d.setMonth(d.getMonth() - (values.length - i));
        time = d.toISOString().split('T')[0];
      }
      return { time, value: v };
    });
  };

  const portfolioSeries = buildSeries(portfolioValues);
  const sp500Series = sp500 ? buildSeries(sp500.portfolio_values) : [];
  const usdSeries = usd ? buildSeries(usd.portfolio_values) : [];

  const buildMCSeries = () => {
    if (!mc?.fan_chart) return null;
    const lines = { p10: [], p25: [], p50: [], p75: [], p90: [] };
    mc.fan_chart.forEach((point) => {
      const time = point.month;
      if (!time) return;
      lines.p10.push({ time, value: point.p10 });
      lines.p25.push({ time, value: point.p25 });
      lines.p50.push({ time, value: point.p50 });
      lines.p75.push({ time, value: point.p75 });
      lines.p90.push({ time, value: point.p90 });
    });
    return lines;
  };

  const mcSeries = buildMCSeries();

  const portfolioFinal = portfolioValues[portfolioValues.length - 1] || 0;
  const sp500Final = sp500?.final_value || 0;
  const usdFinal = usd?.final_value || 0;
  const portfolioDelta = usdFinal > 0 ? ((portfolioFinal - usdFinal) / usdFinal) * 100 : 0;
  const sp500Delta = usdFinal > 0 ? ((sp500Final - usdFinal) / usdFinal) * 100 : 0;

  const handleHighlight = useCallback((key) => {
    const next = highlighted === key ? null : key;
    setHighlighted(next);

    const refs = seriesRef.current;
    if (!refs || !chartRef.current) return;

    LINE_KEYS.forEach((k) => {
      const entries = refs[k];
      if (!entries) return;
      entries.forEach((entry) => {
        const dimmed = next !== null && next !== k;
        entry.series.applyOptions({
          color: dimmed ? entry.dimColor : entry.fullColor,
          lineWidth: next === k ? entry.boldWidth : entry.baseWidth,
        });
      });
    });
  }, [highlighted]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: '#0a0e17' },
        textColor: '#64748b',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.5)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.5)' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: 'rgba(0, 229, 255, 0.2)', width: 1, style: 2, labelBackgroundColor: '#111827' },
        horzLine: { color: 'rgba(0, 229, 255, 0.2)', width: 1, style: 2, labelBackgroundColor: '#111827' },
      },
      rightPriceScale: {
        borderColor: '#1e293b',
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderColor: '#1e293b',
        timeVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const refs = {};

    // Monte Carlo fan chart lines (green, rendered behind main lines)
    if (mcSeries) {
      refs.mc = [];
      const addMCLine = (seriesData, fullColor, baseWidth) => {
        const line = chart.addLineSeries({
          color: fullColor,
          lineWidth: baseWidth,
          lineStyle: 2,
          priceLineVisible: false,
          crosshairMarkerVisible: false,
          lastValueVisible: false,
        });
        line.setData(seriesData);
        refs.mc.push({
          series: line,
          fullColor,
          dimColor: fullColor.replace(/[\d.]+\)$/, '0.04)'),
          baseWidth,
          boldWidth: baseWidth + 1,
        });
      };
      addMCLine(mcSeries.p90, MC_GREEN.p90, 1);
      addMCLine(mcSeries.p75, MC_GREEN.p75, 1);
      addMCLine(mcSeries.p50, MC_GREEN.p50, 2);
      addMCLine(mcSeries.p25, MC_GREEN.p25, 1);
      addMCLine(mcSeries.p10, MC_GREEN.p10, 1);
    }

    // Portfolio line
    const portfolioLine = chart.addLineSeries({
      color: CHART_COLORS.portfolio,
      lineWidth: 2,
      priceLineVisible: false,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: CHART_COLORS.portfolio,
      crosshairMarkerBackgroundColor: '#0a0e17',
    });
    portfolioLine.setData(portfolioSeries);
    refs.portfolio = [{
      series: portfolioLine,
      fullColor: CHART_COLORS.portfolio,
      dimColor: 'rgba(0, 229, 255, 0.15)',
      baseWidth: 2,
      boldWidth: 3,
    }];

    // S&P 500 line
    if (sp500Series.length > 0) {
      const sp500Line = chart.addLineSeries({
        color: CHART_COLORS.sp500,
        lineWidth: 1.5,
        lineStyle: 0,
        priceLineVisible: false,
        crosshairMarkerRadius: 3,
      });
      sp500Line.setData(sp500Series);
      refs.sp500 = [{
        series: sp500Line,
        fullColor: CHART_COLORS.sp500,
        dimColor: 'rgba(255, 51, 102, 0.15)',
        baseWidth: 1.5,
        boldWidth: 3,
      }];
    }

    // USD line
    if (usdSeries.length > 0) {
      const usdLine = chart.addLineSeries({
        color: CHART_COLORS.usd,
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        crosshairMarkerRadius: 2,
      });
      usdLine.setData(usdSeries);
      refs.usd = [{
        series: usdLine,
        fullColor: CHART_COLORS.usd,
        dimColor: 'rgba(71, 85, 105, 0.15)',
        baseWidth: 1,
        boldWidth: 2,
      }];
    }

    chart.timeScale().fitContent();
    chartRef.current = chart;
    seriesRef.current = refs;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: entry.contentRect.width });
      }
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, []);

  const handleExportCSV = async () => {
    if (!generationId) return;
    setExporting(true);
    try {
      const csv = await portfolioAPI.exportCSV(generationId);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'portfolio_export.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Interactive stat cards */}
      <div className={`grid grid-cols-1 gap-3 mb-4 ${mc ? 'sm:grid-cols-5' : 'sm:grid-cols-3'}`}>
        <StatCard
          label="Your Portfolio"
          value={portfolioFinal}
          prefix="$"
          delta={portfolioDelta}
          color={CHART_COLORS.portfolio}
          active={highlighted === 'portfolio'}
          onClick={() => handleHighlight('portfolio')}
        />
        <StatCard
          label="S&P 500 Benchmark"
          value={sp500Final}
          prefix="$"
          delta={sp500Delta}
          color={CHART_COLORS.sp500}
          active={highlighted === 'sp500'}
          onClick={() => handleHighlight('sp500')}
        />
        <StatCard
          label="Cash Savings (USD)"
          value={usdFinal}
          prefix="$"
          color={CHART_COLORS.usd}
          active={highlighted === 'usd'}
          onClick={() => handleHighlight('usd')}
        />
        {mc && (
          <>
            <StatCard
              label="Median Outcome (P50)"
              value={mc.percentiles?.p50 || 0}
              prefix="$"
              color="#00ff88"
              active={highlighted === 'mc'}
              onClick={() => handleHighlight('mc')}
            />
            <StatCard
              label="Worst Case (P10)"
              value={mc.percentiles?.p10 || 0}
              prefix="$"
              color="#00ff88"
              active={highlighted === 'mc'}
              onClick={() => handleHighlight('mc')}
            />
          </>
        )}
      </div>

      {/* Chart */}
      <div className="terminal-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: CHART_COLORS.portfolio }} />
              <span className="text-[10px] font-mono text-text-tertiary">Portfolio</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: CHART_COLORS.sp500 }} />
              <span className="text-[10px] font-mono text-text-tertiary">S&P 500</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 rounded" style={{ background: CHART_COLORS.usd }} />
              <span className="text-[10px] font-mono text-text-tertiary">USD Savings</span>
            </div>
            {mc && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 rounded" style={{ background: '#00ff88' }} />
                <span className="text-[10px] font-mono text-text-tertiary">MC P10-P90</span>
              </div>
            )}
          </div>
          {generationId && (
            <button onClick={handleExportCSV} disabled={exporting} className="btn-secondary !py-1.5 !px-3 text-xs">
              {exporting ? 'Exporting...' : 'Export CSV'}
            </button>
          )}
        </div>
        <div ref={containerRef} className="rounded-lg overflow-hidden" />
      </div>
    </div>
  );
}
