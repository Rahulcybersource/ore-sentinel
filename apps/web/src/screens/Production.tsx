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
      className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 relative z-10"
    >
      <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-teal-400 drop-shadow-[0_0_8px_rgba(0,240,255,0.5)] tracking-wide uppercase">Production Trend</h1>
          <p className="text-teal-400/60 font-mono text-sm md:text-base mt-1 tracking-widest uppercase">Actuals vs Planned vs Forecast</p>
        </div>
        <div className="flex items-center gap-2 glass-panel px-4 py-2 rounded-lg self-start md:self-auto border-teal-500/20 shadow-[inset_0_0_10px_rgba(0,240,255,0.1)]">
          <Filter size={18} className="text-teal-400 shrink-0" />
          <select 
            value={mineFilter} 
            onChange={e => setMineFilter(e.target.value)}
            className="bg-transparent text-teal-300 font-mono text-sm outline-none cursor-pointer tracking-wide uppercase"
          >
            <option value="balaghat" className="bg-navy-950">Balaghat Complex</option>
            <option value="ukwa" className="bg-navy-950">Ukwa Mine</option>
            <option value="gumgaon" className="bg-navy-950">Gumgaon</option>
          </select>
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass-panel rounded-xl p-4 md:p-6 h-[400px] md:h-[500px]"
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 240, 255, 0.15)" vertical={false} />
            <XAxis dataKey="date" stroke="#00A6CC" tick={{fill: 'rgba(0,240,255,0.7)', fontSize: 12, fontFamily: 'monospace'}} />
            <YAxis stroke="#00A6CC" tick={{fill: 'rgba(0,240,255,0.7)', fontSize: 12, fontFamily: 'monospace'}} domain={['dataMin - 500', 'dataMax + 500']} />
            <Tooltip 
              contentStyle={{ backgroundColor: 'rgba(5, 11, 20, 0.95)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '8px', backdropFilter: 'blur(8px)', boxShadow: '0 0 15px rgba(0,240,255,0.1)' }}
              itemStyle={{ color: '#00F0FF', fontFamily: 'monospace' }}
              labelStyle={{ color: '#00A6CC', fontFamily: 'monospace' }}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace', color: '#00F0FF', paddingTop: '20px' }} />
            <Area 
              type="monotone" 
              dataKey="confidenceBand" 
              stroke="none" 
              fill="#00F0FF" 
              fillOpacity={0.1} 
              name="Forecast Confidence" 
              animationDuration={1200}
            />
            <Line type="stepAfter" dataKey="planned" stroke="#FFB020" strokeWidth={2} strokeDasharray="5 5" name="Planned Target" dot={false} animationDuration={1000} />
            <Line type="monotone" dataKey="actual" stroke="#00F0FF" strokeWidth={3} name="Actual Production" dot={{fill: '#02050A', stroke: '#00F0FF', strokeWidth: 2}} activeDot={{r: 6, fill: '#00F0FF'}} animationDuration={1000} />
            <Line type="monotone" dataKey="forecast" stroke="#00F0FF" strokeWidth={3} strokeDasharray="3 3" name="Forecast" dot={false} animationDuration={1000} />
          </ComposedChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
};
