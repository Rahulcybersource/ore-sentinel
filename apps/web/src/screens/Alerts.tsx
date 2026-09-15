import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdapters } from '../data/adapters/AdapterContext';
import type { RiskAlert } from '../data/types/models';
import { motionPresets } from '../theme/tokens';
import { AlertTriangle, ChevronRight, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AlertsSkeleton, ErrorState, EmptyState } from '../components/Skeletons';

export const Alerts: React.FC = () => {
  const adapters = useAdapters();
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adapters.alerts.getActiveAlerts('balaghat');
      const sorted = [...res].sort((a, b) => {
        if (a.severity === 'CRITICAL' && b.severity !== 'CRITICAL') return -1;
        if (a.severity !== 'CRITICAL' && b.severity === 'CRITICAL') return 1;
        return a.leadTimeDays - b.leadTimeDays;
      });
      setAlerts(sorted);
    } catch (err) {
      console.error(err);
      setError('Failed to load active alerts.');
    } finally {
      setLoading(false);
    }
  }, [adapters]);

  useEffect(() => { fetchAlerts(); }, [fetchAlerts]);

  if (loading) return <AlertsSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchAlerts} />;

  return (
    <motion.div 
      variants={motionPresets.slideUp}
      initial="initial"
      animate="animate"
      className="p-6 md:p-8 max-w-4xl mx-auto space-y-6 relative z-10"
    >
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-teal-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] tracking-wide uppercase flex items-center gap-3">
          <Activity className="text-amber-400 shrink-0 drop-shadow-[0_0_5px_rgba(255,176,32,0.8)]" /> Active Risk Alerts
        </h1>
        <p className="text-teal-400/60 font-mono mt-2 text-sm md:text-base uppercase tracking-widest">Ranked shortfalls and operational risks requiring attention.</p>
      </header>

      <div className="space-y-4 mt-8">
        {alerts.length === 0 ? (
          <EmptyState
            title="No active alerts"
            description="All systems are operating within normal parameters."
          />
        ) : (
          alerts.map((alert, index) => {
            const isCritical = alert.severity === 'CRITICAL';
            const isTopCritical = isCritical && index === 0;
            const isExpanded = expandedId === alert.id;

            return (
              <motion.div 
                key={alert.id}
                initial={{ opacity: 0, y: 12 }}
                animate={
                  isTopCritical && !isExpanded 
                    ? { opacity: 1, y: 0, scale: [1, 1.008, 1], transition: { scale: { repeat: Infinity, duration: 2.5 }, opacity: { duration: 0.4 }, y: { duration: 0.4 } } }
                    : { opacity: 1, y: 0, scale: 1 }
                }
                transition={{ delay: index * 0.08 }}
                className={`glass-panel overflow-hidden transition-colors duration-300 ${isCritical ? 'border-danger-500/50 shadow-[0_0_15px_rgba(255,51,102,0.15)]' : 'border-amber-500/50 shadow-[0_0_15px_rgba(255,176,32,0.1)]'}`}
              >
                <div 
                  className="p-4 md:p-6 cursor-pointer flex items-center justify-between hover:bg-teal-500/5 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className={`p-2.5 md:p-3 rounded-full shrink-0 shadow-[inset_0_0_8px_currentColor] border ${isCritical ? 'bg-danger-500/10 text-danger-500 border-danger-500/30' : 'bg-amber-500/10 text-amber-500 border-amber-500/30'}`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base md:text-xl font-bold text-slate-200 tracking-wide truncate">{alert.title}</h3>
                      <div className="flex flex-wrap gap-2 md:gap-4 font-mono text-xs md:text-sm mt-1">
                        <span className={`tracking-wider ${isCritical ? 'text-danger-400 drop-shadow-[0_0_2px_rgba(255,51,102,0.8)]' : 'text-amber-400 drop-shadow-[0_0_2px_rgba(255,176,32,0.8)]'}`}>{alert.severity}</span>
                        <span className="text-teal-400/50">Lead time: {alert.leadTimeDays} days</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className={`text-teal-400/70 transition-transform duration-200 shrink-0 ml-2 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="border-t border-teal-500/20 bg-navy-950/50 overflow-hidden"
                    >
                      <div className="p-4 md:p-6 space-y-6">
                        <div>
                          <h4 className="telemetry-label mb-3">Cause Breakdown</h4>
                          <div className="h-4 w-full bg-navy-900 rounded-full overflow-hidden flex border border-teal-500/10">
                            {alert.causeBreakdown.map((cause, idx) => (
                              <motion.div 
                                key={idx}
                                initial={{ width: 0 }}
                                animate={{ width: `${cause.percentage}%` }}
                                transition={{ duration: 0.6, delay: idx * 0.15 }}
                                className={`h-full border-r border-navy-950 last:border-none ${idx === 0 ? 'bg-amber-500 shadow-[0_0_10px_rgba(255,176,32,0.8)]' : idx === 1 ? 'bg-teal-500 shadow-[0_0_10px_rgba(0,240,255,0.8)]' : 'bg-violet-500 shadow-[0_0_10px_rgba(176,38,255,0.8)]'}`}
                                title={`${cause.cause} (${cause.percentage}%)`}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3 md:gap-4 mt-4 font-mono">
                            {alert.causeBreakdown.map((cause, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-teal-300">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-[0_0_5px_currentColor] ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-teal-500' : 'bg-violet-500'}`} />
                                {cause.cause} ({cause.percentage}%)
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Link 
                            to={`/recommendations?alertId=${alert.id}`}
                            className="bg-teal-500/10 border border-teal-500/30 hover:bg-teal-500/20 active:scale-[0.97] text-teal-400 font-bold px-5 md:px-6 py-2 rounded-lg transition-all flex items-center gap-2 text-sm md:text-base tracking-wide shadow-[inset_0_0_10px_rgba(0,240,255,0.1)]"
                          >
                            See Recommendations <ChevronRight size={18} />
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
