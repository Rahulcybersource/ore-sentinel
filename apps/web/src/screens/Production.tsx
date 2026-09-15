import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAdapters } from '../data/adapters/AdapterContext';
import { motionPresets } from '../theme/tokens';
import { Filter } from 'lucide-react';
import { ProductionSkeleton, ErrorState } from '../components/Skeletons';

interface ChartPoint {
  date: string;
  actual: number | null;
  planned: number;
  forecast: number | null;
  confidenceBand: [number, number] | undefined;
}

export const Production: React.FC = () => {
  const adapters = useAdapters();
  const [data, setData] = useState<ChartPoint[]>([]);
  const [mineFilter, setMineFilter] = useState('balaghat');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adapters.production.getProductionTrend(mineFilter, '7d');
      const chartData: ChartPoint[] = res.map(p => ({
        date: p.date,
        actual: p.actual,
        planned: p.planned,
        forecast: p.forecast,
        confidenceBand: p.confidenceMin != null && p.confidenceMax != null ? [p.confidenceMin, p.confidenceMax] : undefined
      }));
      setData(chartData);
    } catch (err) {
      console.error(err);
      setError('Failed to load production data.');
    } finally {
      setLoading(false);
    }
  }, [adapters, mineFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <ProductionSkeleton />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  return (
    <motion.div 
      key={mineFilter}
      variants={motionPresets.fadeIn}
      initial="initial"
      animate="animate"
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6"
    >
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-100">Production Trend</h1>
          <p className="text-slate-400 text-sm md:text-base">Actuals vs Planned vs Forecast</p>
        </div>
        <div className="flex items-center gap-2 bg-navy-800 border border-navy-700 px-4 py-2 rounded-lg self-start md:self-auto">
          <Filter size={18} className="text-teal-400 shrink-0" />
          <select 
            value={mineFilter} 
            onChange={e => setMineFilter(e.target.value)}
            className="bg-transparent text-slate-200 outline-none cursor-pointer text-sm"
          >
            <option value="balaghat">Balaghat Complex</option>
            <option value="ukwa">Ukwa Mine</option>
            <option value="gumgaon">Gumgaon</option>
          </select>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-navy-800 border border-navy-700 rounded-xl p-4 md:p-6 shadow-lg h-[400px] md:h-[500px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
            <XAxis dataKey="date" stroke="#64748B" tick={{fill: '#94A3B8', fontSize: 12}} />
            <YAxis stroke="#64748B" tick={{fill: '#94A3B8', fontSize: 12}} domain={['dataMin - 500', 'dataMax + 500']} />
            <Tooltip 
              contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #1E293B', borderRadius: '8px' }}
              itemStyle={{ color: '#E2E8F0' }}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="confidenceBand" 
              stroke="none" 
              fill="#00D9C0" 
              fillOpacity={0.15} 
              name="Forecast Confidence" 
              animationDuration={1200}
            />
            <Line type="stepAfter" dataKey="planned" stroke="#FFB020" strokeWidth={2} strokeDasharray="5 5" name="Planned Target" dot={false} animationDuration={1000} />
            <Line type="monotone" dataKey="actual" stroke="#00D9C0" strokeWidth={3} name="Actual Production" animationDuration={1000} />
            <Line type="monotone" dataKey="forecast" stroke="#00D9C0" strokeWidth={3} strokeDasharray="3 3" name="Forecast" animationDuration={1000} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
};
