import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAdapters } from '../data/adapters/AdapterContext';
import { motionPresets } from '../theme/tokens';
import { Globe, TrendingUp, AlertTriangle, Globe2, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CorporateSkeleton, ErrorState } from '../components/Skeletons';

interface MineStats {
  id: string;
  name: string;
  latestActual: number;
  latestPlanned: number;
  activeRiskCount: number;
  criticalRiskCount: number;
}

interface TrendPoint {
  date: string;
  actual: number;
  planned: number;
}

export const CorporateView: React.FC = () => {
  const navigate = useNavigate();
  const adapters = useAdapters();
  const [mineStats, setMineStats] = useState<MineStats[]>([]);
  const [aggregateTrend, setAggregateTrend] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const MINE_IDS = [
    { id: 'balaghat', name: 'Balaghat Complex' },
    { id: 'ukwa', name: 'Ukwa Mine' },
    { id: 'gumgaon', name: 'Gumgaon' },
    { id: 'kandri', name: 'Kandri' }
  ];

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats: MineStats[] = [];
      const trendMap = new Map<string, TrendPoint>();

      for (const m of MINE_IDS) {
        const [prod, alerts] = await Promise.all([
          adapters.production.getProductionTrend(m.id, '7d'),
          adapters.alerts.getActiveAlerts(m.id)
        ]);

        const latestProd = prod.find(p => p.actual !== null);
        stats.push({
          id: m.id,
          name: m.name,
          latestActual: latestProd?.actual || 0,
          latestPlanned: latestProd?.planned || 0,
          activeRiskCount: alerts.length,
          criticalRiskCount: alerts.filter(a => a.severity === 'CRITICAL').length
        });

        prod.forEach(p => {
          if (!trendMap.has(p.date)) {
            trendMap.set(p.date, { date: p.date, actual: 0, planned: 0 });
          }
          const curr = trendMap.get(p.date)!;
          curr.actual += (p.actual || 0);
          curr.planned += p.planned;
        });
      }

      setMineStats(stats);
      setAggregateTrend(Array.from(trendMap.values()).sort((a, b) => a.date.localeCompare(b.date)));
    } catch (err) {
      console.error(err);
      setError('Failed to aggregate corporate data.');
    } finally {
      setLoading(false);
    }
  }, [adapters]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) return <CorporateSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchAll} />;

  return (
    <motion.div 
      variants={motionPresets.fadeIn}
      initial="initial"
      animate="animate"
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-navy-700 pb-6">
        <div className="flex items-center gap-4">
          <Globe size={36} className="text-teal-400 shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Corporate Roll-Up</h1>
            <p className="text-slate-400 text-sm md:text-base">Multi-site aggregation and macro risk overview.</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/national')}
          className="flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-indigo-500/20 hover:from-teal-500/30 hover:to-indigo-500/30 text-teal-300 border border-teal-500/40 rounded-xl text-sm font-semibold transition-all shadow-md active:scale-[0.98] w-fit"
        >
          <Globe2 size={18} className="text-teal-400" />
          <span>National Manganese Overview Map</span>
          <ArrowRight size={15} />
        </button>
      </header>

      {/* Feature Banner: National Reserve Intelligence */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        onClick={() => navigate('/national')}
        className="group cursor-pointer bg-gradient-to-r from-navy-800 via-navy-850 to-indigo-950/40 border border-teal-500/30 hover:border-teal-400/60 p-5 rounded-xl shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-lg text-teal-400 group-hover:scale-105 transition-transform">
            <Globe2 size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-teal-400">Macro Geological Intelligence</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">NMI / UNFC</span>
            </div>
            <h2 className="text-base font-bold text-slate-100 mt-1 group-hover:text-teal-300 transition-colors">
              India Manganese Landscape & State-Wise Reserve Distribution
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Explore national inventory (495.87 Mt), state-level shares (Odisha 44%, Karnataka 22%, MP 12%), and interactive geospatial markers across MOIL and non-MOIL producers.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-teal-400 group-hover:translate-x-1 transition-transform shrink-0">
          <span>Explore National Map</span>
          <ArrowRight size={16} />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Aggregate Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-navy-800 border border-navy-700 rounded-xl p-5 md:p-6 shadow-lg"
        >
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-teal-400" /> Total Corporate Production (7D)
          </h3>
          <div className="h-56 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aggregateTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="date" stroke="#64748B" tick={{fill: '#94A3B8', fontSize: 12}} />
                <YAxis stroke="#64748B" tick={{fill: '#94A3B8', fontSize: 12}} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="planned" fill="#1E293B" stroke="#64748B" strokeDasharray="3 3" name="Global Target" animationDuration={800} />
                <Bar dataKey="actual" fill="#00D9C0" name="Global Actual" animationDuration={800} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Site Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-navy-800 border border-navy-700 rounded-xl p-5 md:p-6 shadow-lg"
        >
          <h3 className="text-sm font-mono text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <Globe size={16} className="text-teal-400" /> Site Performance Matrix
          </h3>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-left min-w-[400px]">
              <thead>
                <tr className="text-slate-400 border-b border-navy-700 font-mono text-xs md:text-sm">
                  <th className="pb-3 font-normal px-2">Site Name</th>
                  <th className="pb-3 font-normal px-2">Daily Output</th>
                  <th className="pb-3 font-normal px-2">Variance</th>
                  <th className="pb-3 font-normal px-2">Risks</th>
                </tr>
              </thead>
              <tbody>
                {mineStats.map((site, i) => {
                  const variance = site.latestActual - site.latestPlanned;
                  const isPos = variance >= 0;
                  return (
                    <motion.tr
                      key={site.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors"
                    >
                      <td className="py-3 md:py-4 font-semibold text-slate-200 text-sm px-2">{site.name}</td>
                      <td className="py-3 md:py-4 font-mono text-slate-300 text-sm px-2">{site.latestActual.toLocaleString()}t</td>
                      <td className="py-3 md:py-4 font-mono text-sm px-2">
                        <span className={isPos ? 'text-teal-400' : 'text-danger-400'}>
                          {isPos ? '+' : ''}{variance.toLocaleString()}t
                        </span>
                      </td>
                      <td className="py-3 md:py-4 px-2">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-bold text-sm ${site.criticalRiskCount > 0 ? 'text-danger-500' : site.activeRiskCount > 0 ? 'text-amber-500' : 'text-slate-500'}`}>
                            {site.activeRiskCount}
                          </span>
                          {site.criticalRiskCount > 0 && <AlertTriangle size={14} className="text-danger-500" />}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};
