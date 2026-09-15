import React, { useEffect, useState, useCallback } from 'react';
import { motion, animate } from 'framer-motion';
import { AreaChart, Area, LineChart, Line, ResponsiveContainer, YAxis, Tooltip } from 'recharts';
import { useAdapters } from '../data/adapters/AdapterContext';
import type { ProductionSeries, RiskAlert, ReserveCell } from '../data/types/models';
import { motionPresets } from '../theme/tokens';
import { AlertTriangle, Activity, Database, ArrowRight, TrendingUp, Shield } from 'lucide-react';
import { DashboardSkeleton, ErrorState } from '../components/Skeletons';

/* ─── Count-Up ─── */
const CountUp: React.FC<{ value: number; format?: (v: number) => string; duration?: number }> = ({
  value, format = String, duration = 1.4,
}) => {
  const [disp, setDisp] = useState(0);
  useEffect(() => {
    const c = animate(0, value, { duration, ease: 'easeOut', onUpdate: v => setDisp(v) });
    return () => c.stop();
  }, [value, duration]);
  return <span>{format(disp)}</span>;
};

/* ─── Glassmorphic KPI card ─── */
const KpiCard: React.FC<{
  label: string;
  value: React.ReactNode;
  sub: React.ReactNode;
  icon: React.ReactNode;
  variant?: 'gold' | 'amber' | 'danger' | 'default';
  delay?: number;
}> = ({ label, value, sub, icon, variant = 'default', delay = 0 }) => {
  const cls =
    variant === 'gold'    ? 'glass-card' :
    variant === 'amber'   ? 'glass-card-amber' :
    variant === 'danger'  ? 'glass-card-danger' :
                            'glass-card';
  const iconBg =
    variant === 'gold'    ? 'bg-accent-400/10  border-accent-400/20  text-accent-400'  :
    variant === 'amber'   ? 'bg-amber-400/10   border-amber-400/20   text-amber--400'  :
    variant === 'danger'  ? 'bg-danger-500/10  border-danger-500/20  text-danger-500'  :
                            'bg-white/5        border-white/10        text-white/60'    ;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      className={`${cls} p-5 flex flex-col gap-3 relative overflow-hidden`}
    >
      {/* Subtle corner glow */}
      {variant === 'gold' && (
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-accent-400/10 rounded-full blur-2xl pointer-events-none" />
      )}

      <div className="flex items-start justify-between">
        <div>
          <span className="telemetry-label block mb-2">{label}</span>
          <div className="text-[28px] font-bold leading-none tracking-tight">{value}</div>
        </div>
        <div className={`p-2.5 rounded-lg border ${iconBg}`}>{icon}</div>
      </div>

      <div className="text-xs font-medium">{sub}</div>

      {/* Bottom shimmer line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            variant === 'gold'
              ? 'linear-gradient(90deg,transparent,rgba(243,195,84,0.4),transparent)'
              : variant === 'amber'
              ? 'linear-gradient(90deg,transparent,rgba(251,191,36,0.3),transparent)'
              : variant === 'danger'
              ? 'linear-gradient(90deg,transparent,rgba(239,68,68,0.3),transparent)'
              : 'linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)',
        }}
      />
    </motion.div>
  );
};

/* ─── Custom tooltip for the chart ─── */
const GlassTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-xs"
      style={{
        background: 'rgba(12,14,22,0.80)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(243,195,84,0.25)',
        borderRadius: '8px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
      }}
    >
      <p className="telemetry-label mb-1">{label}</p>
      <p className="text-accent-400 font-semibold">{Number(payload[0]?.value).toLocaleString()} t</p>
    </div>
  );
};

/* ─── Main Dashboard ─── */
export const Dashboard: React.FC = () => {
  const adapters = useAdapters();
  const [productionTrend, setProductionTrend] = useState<ProductionSeries[]>([]);
  const [alerts, setAlerts]                   = useState<RiskAlert[]>([]);
  const [reserveGrid, setReserveGrid]         = useState<ReserveCell[]>([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [prod, acts, res] = await Promise.all([
        adapters.production.getProductionTrend('balaghat', '7d'),
        adapters.alerts.getActiveAlerts('balaghat'),
        adapters.reserve.getReserveGrid('balaghat'),
      ]);
      setProductionTrend(prod); setAlerts(acts); setReserveGrid(res);
    } catch { setError('Failed to load dashboard data.'); }
    finally  { setLoading(false); }
  }, [adapters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <DashboardSkeleton />;
  if (error)   return <ErrorState message={error} onRetry={fetchData} />;

  const latest        = productionTrend.find(p => p.actual !== null);
  const currentActual = latest?.actual || 0;
  const currentPlanned= latest?.planned || 0;
  const alertCount    = alerts.length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length;
  const avgConf       = reserveGrid.length
    ? reserveGrid.reduce((s, c) => s + c.confidenceScore, 0) / reserveGrid.length
    : 0;

  const chartData = productionTrend
    .filter(p => p.actual !== null)
    .map(p => ({ name: p.date, actual: p.actual, planned: p.planned }));

  const topAlerts = alerts.slice(0, 4);

  return (
    <div className="flex h-full text-white overflow-hidden">

      {/* ════════════════════════════════
          LEFT PANEL — Title + KPIs + Risks
          ════════════════════════════════ */}
      <div
        className="w-[42%] flex flex-col overflow-y-auto p-7 gap-6"
        style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Header */}
        <motion.div variants={motionPresets.fadeIn} initial="initial" animate="animate">
          <span className="telemetry-label text-accent-400/80 mb-2 block">Operations Overview</span>
          <div className="glow-divider mb-4" />
          <h1 className="text-[22px] font-bold leading-tight uppercase tracking-wide">
            Balaghat Complex
          </h1>
          <p className="text-muted-400 text-xs mt-1">Real-time telemetry · MOIL Analytics</p>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3">
          <KpiCard
            label="Daily Tonnage"
            value={
              <>
                <CountUp value={currentActual} format={v => Math.round(v).toLocaleString()} />
                <span className="text-base text-muted-400 ml-1 font-normal">t</span>
              </>
            }
            sub={
              <span className={currentActual >= currentPlanned ? 'text-accent-400' : 'text-amber-400'}>
                Target: {currentPlanned.toLocaleString()} t &nbsp;
                {currentActual >= currentPlanned ? '↑ On track' : '↓ Below target'}
              </span>
            }
            icon={<Activity size={16} />}
            variant="gold"
            delay={0.05}
          />

          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Active Risks"
              value={<CountUp value={alertCount} format={v => Math.round(v).toString()} />}
              sub={<span className="text-danger-500">{criticalCount} Critical</span>}
              icon={<AlertTriangle size={16} />}
              variant="danger"
              delay={0.12}
            />
            <KpiCard
              label="Confidence"
              value={
                <>
                  <CountUp value={avgConf * 100} format={v => v.toFixed(1)} />
                  <span className="text-base text-muted-400 ml-0.5 font-normal">%</span>
                </>
              }
              sub={<span className="text-muted-400">{reserveGrid.length} blocks</span>}
              icon={<Database size={16} />}
              variant="default"
              delay={0.18}
            />
          </div>
        </div>

        {/* Active Risks list */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className="glass-card p-4 flex flex-col gap-3 flex-1"
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Shield size={13} className="text-accent-400/70" />
              <span className="telemetry-label">Active Risk Feed</span>
            </div>
            <span className="text-[10px] text-muted-400 font-medium">{alertCount} total</span>
          </div>

          {topAlerts.length === 0 ? (
            <p className="text-xs text-muted-400 italic">No active risks — all systems nominal.</p>
          ) : (
            topAlerts.map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                className="flex items-start gap-3 group cursor-pointer"
              >
                <div
                  className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                    alert.severity === 'CRITICAL' ? 'bg-danger-500 shadow-[0_0_6px_rgba(239,68,68,0.8)]' : 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]'
                  }`}
                />
                <div className="min-w-0 border-b border-white/[0.04] pb-2 w-full">
                  <p className="text-[13px] font-medium truncate group-hover:text-accent-400 transition-colors">
                    {alert.title}
                  </p>
                  <p className="text-[10px] text-muted-400 mt-0.5">Lead time: {alert.leadTimeDays} days</p>
                </div>
              </motion.div>
            ))
          )}

          <button className="mt-auto flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.18em] uppercase text-muted-400 hover:text-accent-400 transition-colors group w-fit">
            View All Alerts <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* ════════════════════════════════
          RIGHT PANEL — Chart
          ════════════════════════════════ */}
      <div className="flex-1 p-7 flex flex-col gap-5 overflow-y-auto">

        {/* Chart header row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div>
            <span className="telemetry-label text-accent-400/80 block mb-1">Production Trend</span>
            <h2 className="text-base font-semibold tracking-wide">7-Day Output Analysis</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-[10px] text-muted-400 font-medium">
              <span className="w-3 h-0.5 bg-accent-400 rounded inline-block" /> Actual
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-muted-400 font-medium">
              <span className="w-3 h-0.5 bg-white/25 rounded inline-block border-dashed border-t border-white/30" /> Planned
            </span>
          </div>
        </motion.div>

        {/* Main chart — glassmorphic container */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative flex-1 min-h-[260px]"
          style={{
            background: 'rgba(10, 12, 20, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '14px',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)',
          }}
        >
          {/* Inner glow at top */}
          <div className="absolute top-0 left-0 right-0 h-px rounded-t-[14px]"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(243,195,84,0.3),transparent)' }}
          />

          <div className="absolute inset-0 p-5">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#F3C354" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#F3C354" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#ffffff" stopOpacity={0.10} />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0.00} />
                  </linearGradient>
                </defs>
                <YAxis domain={['dataMin - 200', 'dataMax + 200']} hide />
                <Tooltip content={<GlassTooltip />} />
                <Area
                  type="monotone"
                  dataKey="planned"
                  stroke="rgba(255,255,255,0.20)"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  fill="url(#plannedGrad)"
                  dot={false}
                />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#F3C354"
                  strokeWidth={2.5}
                  fill="url(#goldGrad)"
                  dot={{ r: 4, fill: '#0a0c14', stroke: '#F3C354', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#F3C354', stroke: '#0a0c14', strokeWidth: 2, filter: 'drop-shadow(0 0 6px rgba(243,195,84,0.8))' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Pagination controls — bottom right */}
          <div
            className="absolute bottom-0 right-0 flex items-center h-11 overflow-hidden"
            style={{
              borderTop: '1px solid rgba(255,255,255,0.06)',
              borderLeft: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '0 0 14px 0',
              background: 'rgba(8,10,18,0.55)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span className="px-5 text-[10px] font-semibold tracking-widest text-white/60"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >
              1 / 7
            </span>
            <button className="px-4 text-muted-500 hover:text-white transition-colors h-full flex items-center"
              style={{ borderRight: '1px solid rgba(255,255,255,0.06)' }}
            >←</button>
            <button className="px-4 text-accent-400 hover:text-accent-500 transition-colors h-full flex items-center">→</button>
          </div>
        </motion.div>

        {/* Bottom stat chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="flex items-center gap-3 flex-wrap"
        >
          {[
            { label: 'Reserves Confidence', value: `${(avgConf * 100).toFixed(1)}%`, color: 'text-white' },
            { label: 'Grid Blocks', value: reserveGrid.length, color: 'text-white' },
            { label: 'Critical Alerts', value: criticalCount, color: criticalCount > 0 ? 'text-danger-500' : 'text-emerald-400' },
            { label: 'Sites Online', value: '3 / 3', color: 'text-emerald-400' },
          ].map(chip => (
            <div
              key={chip.label}
              className="flex items-center gap-2 px-4 py-2 text-xs"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '999px',
              }}
            >
              <span className="telemetry-label">{chip.label}</span>
              <span className={`font-semibold ${chip.color}`}>{chip.value}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
