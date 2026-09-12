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
      className="p-6 md:p-8 max-w-4xl mx-auto space-y-6"
    >
      <header>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-100 flex items-center gap-3">
          <Activity className="text-amber-500 shrink-0" /> Active Risk Alerts
        </h1>
        <p className="text-slate-400 mt-2 text-sm md:text-base">Ranked shortfalls and operational risks requiring attention.</p>
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
                className={`bg-navy-800 border rounded-xl overflow-hidden shadow-lg transition-colors duration-300 ${isCritical ? 'border-danger-500/50' : 'border-amber-500/50'}`}
              >
                <div 
                  className="p-4 md:p-6 cursor-pointer flex items-center justify-between hover:bg-navy-700/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                >
                  <div className="flex items-center gap-3 md:gap-4 min-w-0">
                    <div className={`p-2.5 md:p-3 rounded-full shrink-0 ${isCritical ? 'bg-danger-500/20 text-danger-500' : 'bg-amber-500/20 text-amber-500'}`}>
                      <AlertTriangle size={20} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base md:text-xl font-bold text-slate-100 truncate">{alert.title}</h3>
                      <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm mt-1">
                        <span className={isCritical ? 'text-danger-400' : 'text-amber-400'}>{alert.severity}</span>
                        <span className="text-slate-400">Lead time: {alert.leadTimeDays} days</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={20} className={`text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${isExpanded ? 'rotate-90' : ''}`} />
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="border-t border-navy-700 bg-navy-900/50 overflow-hidden"
                    >
                      <div className="p-4 md:p-6 space-y-6">
                        <div>
                          <h4 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-3">Cause Breakdown</h4>
                          <div className="h-4 w-full bg-navy-700 rounded-full overflow-hidden flex">
                            {alert.causeBreakdown.map((cause, idx) => (
                              <motion.div 
                                key={idx}
                                initial={{ width: 0 }}
                                animate={{ width: `${cause.percentage}%` }}
                                transition={{ duration: 0.6, delay: idx * 0.15 }}
                                className={`h-full ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-teal-500' : 'bg-slate-400'}`}
                                title={`${cause.cause} (${cause.percentage}%)`}
                              />
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-3 md:gap-4 mt-3">
                            {alert.causeBreakdown.map((cause, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs md:text-sm text-slate-300">
                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-teal-500' : 'bg-slate-400'}`} />
                                {cause.cause} ({cause.percentage}%)
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Link 
                            to={`/recommendations?alertId=${alert.id}`}
                            className="bg-teal-500 hover:bg-teal-400 active:scale-[0.97] text-navy-900 font-bold px-5 md:px-6 py-2 rounded-lg transition-all flex items-center gap-2 text-sm md:text-base"
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
