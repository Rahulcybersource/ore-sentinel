import React, { useEffect, useState, useCallback } from 'react';
import { motion, animate } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { useAdapters } from '../data/adapters/AdapterContext';
import type { ProductionSeries, RiskAlert, ReserveCell } from '../data/types/models';
import { motionPresets } from '../theme/tokens';
import { AlertTriangle, Activity, Database } from 'lucide-react';
import { DashboardSkeleton, ErrorState } from '../components/Skeletons';

// Count-Up Number Component
const CountUp: React.FC<{ value: number; format?: (val: number) => string; duration?: number }> = ({ value, format = String, duration = 1.5 }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (latest) => setDisplayValue(latest)
    });
    return () => controls.stop();
  }, [value, duration]);

  return <span>{format(displayValue)}</span>;
};

export const Dashboard: React.FC = () => {
  const adapters = useAdapters();
  
  const [productionTrend, setProductionTrend] = useState<ProductionSeries[]>([]);
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [reserveGrid, setReserveGrid] = useState<ReserveCell[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prod, acts, res] = await Promise.all([
        adapters.production.getProductionTrend('balaghat', '7d'),
        adapters.alerts.getActiveAlerts('balaghat'),
        adapters.reserve.getReserveGrid('balaghat')
      ]);
      setProductionTrend(prod);
      setAlerts(acts);
      setReserveGrid(res);
    } catch (err) {
      console.error(err);
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [adapters]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <DashboardSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // Derived KPI Values
  const latestProduction = productionTrend.find(p => p.actual !== null);
  const currentActual = latestProduction?.actual || 0;
  const currentPlanned = latestProduction?.planned || 0;
  const activeAlertCount = alerts.length;
  const avgConfidence = reserveGrid.length > 0 
    ? reserveGrid.reduce((acc, cell) => acc + cell.confidenceScore, 0) / reserveGrid.length 
    : 0;

  const sparklineData = productionTrend.filter(p => p.actual !== null).map(p => ({
    name: p.date,
    actual: p.actual
  }));
  const topAlerts = alerts.slice(0, 3);

  return (
    <motion.div 
      variants={motionPresets.fadeIn}
      initial="initial"
      animate="animate"
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Balaghat Complex Overview</h1>
        <p className="text-slate-400 text-sm md:text-base">Aggregate performance and active risk summary.</p>
      </header>

      {/* KPI Cards — responsive: stack on mobile, 3-col on md+ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        {/* Production KPI */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-navy-800 border border-navy-700 rounded-xl p-5 md:p-6 shadow-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Daily Tonnage</span>
              <div className="text-2xl md:text-3xl font-bold text-teal-400 mt-1">
                <CountUp value={currentActual} format={(v) => Math.round(v).toLocaleString()} />
                <span className="text-base md:text-lg text-slate-500 ml-1">t</span>
              </div>
            </div>
            <div className="p-2 bg-navy-900 rounded-lg"><Activity size={20} className="text-teal-500" /></div>
          </div>
          <div className="text-sm font-medium">
            <span className={currentActual >= currentPlanned ? "text-teal-500" : "text-amber-500"}>
              Target: {currentPlanned.toLocaleString()}t
            </span>
          </div>
        </motion.div>

        {/* Alerts KPI */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-navy-800 border border-navy-700 rounded-xl p-5 md:p-6 shadow-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Active Risks</span>
              <div className="text-2xl md:text-3xl font-bold text-amber-500 mt-1">
                <CountUp value={activeAlertCount} format={(v) => Math.round(v).toString()} />
              </div>
            </div>
            <div className="p-2 bg-navy-900 rounded-lg"><AlertTriangle size={20} className="text-amber-500" /></div>
          </div>
          <div className="text-sm font-medium text-slate-400">
            {alerts.filter(a => a.severity === 'CRITICAL').length} Critical
          </div>
        </motion.div>

        {/* Reserve KPI */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-navy-800 border border-navy-700 rounded-xl p-5 md:p-6 shadow-lg"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">Avg Confidence</span>
              <div className="text-2xl md:text-3xl font-bold text-teal-400 mt-1">
                <CountUp value={avgConfidence * 100} format={(v) => v.toFixed(1)} />
                <span className="text-base md:text-lg text-slate-500 ml-1">%</span>
              </div>
            </div>
            <div className="p-2 bg-navy-900 rounded-lg"><Database size={20} className="text-teal-500" /></div>
          </div>
          <div className="text-sm font-medium text-slate-400">
            Based on {reserveGrid.length} modeled blocks
          </div>
        </motion.div>
      </div>

      {/* Lower panels — responsive: stack on mobile, 2-col on lg+ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Production Sparkline */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-navy-800 border border-navy-700 rounded-xl p-5 md:p-6 shadow-lg"
        >
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-6">7-Day Production Trend</h3>
          <div className="h-40 md:h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <YAxis domain={['dataMin - 100', 'dataMax + 100']} hide />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#00D9C0" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#0B1220', strokeWidth: 2 }}
                  activeDot={{ r: 6 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top 3 Risks */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-navy-800 border border-navy-700 rounded-xl p-5 md:p-6 shadow-lg flex flex-col"
        >
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-6">Top Active Risks</h3>
          <div className="space-y-3 md:space-y-4 flex-1">
            {topAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-500 text-sm italic">
                No active risks — all systems nominal.
              </div>
            ) : (
              topAlerts.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-start gap-3 md:gap-4 p-3 md:p-4 rounded-lg bg-navy-900 border border-navy-700"
                >
                  <div className={`mt-0.5 rounded-full p-1.5 shrink-0 ${alert.severity === 'CRITICAL' ? 'bg-danger-500/20 text-danger-500' : 'bg-amber-500/20 text-amber-500'}`}>
                    <AlertTriangle size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-200 text-sm md:text-base truncate">{alert.title}</h4>
                    <p className="text-xs md:text-sm text-slate-400 mt-1">Lead time: {alert.leadTimeDays} days</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
