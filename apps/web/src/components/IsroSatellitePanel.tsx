import { useEffect, useState } from 'react';
import { useAdapters } from '../data/adapters/AdapterContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { NATIONAL_MN_REGISTRY } from '../data/constants/mineRegistry';

export function IsroSatellitePanel() {
  const { isro } = useAdapters();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [param, setParam] = useState('NDVI');
  
  // Balaghat coordinates
  const lat = NATIONAL_MN_REGISTRY[0].coordinates[1];
  const lng = NATIONAL_MN_REGISTRY[0].coordinates[0];

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        let result;
        if (param === 'NDVI') {
          result = await isro.getNdviTimeSeries(lat, lng, '20230101', '20231231');
        } else {
          result = await isro.getVegetationIndex(lat, lng, param, '20230101', '20231231');
        }
        if (mounted) setData(result);
      } catch (err: any) {
        if (mounted) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, [isro, lat, lng, param]);

  return (
    <div className="bg-navy-950 border border-saffron-500/20 rounded-lg p-4 shadow-[0_0_15px_rgba(0,32,91,0.5)]">
      <div className="flex items-center justify-between mb-4 border-b border-saffron-500/10 pb-2">
        <div>
          <h3 className="font-mono font-bold text-slate-100 flex items-center gap-2 tracking-wide uppercase text-sm">
            ISRO VEDAS Intelligence
            <span className="text-[9px] px-2 py-0.5 rounded bg-saffron-500/20 text-saffron-400 font-bold border border-saffron-500/30">LIVE</span>
          </h3>
          <p className="text-[10px] font-mono text-saffron-500/70 mt-1 uppercase tracking-widest">Sentinel-2 multi-spectral time-series via SAC</p>
        </div>
        <select 
          className="bg-navy-900 border border-saffron-500/30 text-[10px] font-mono uppercase tracking-wider rounded text-saffron-400 px-3 py-1.5 outline-none focus:border-saffron-500"
          value={param}
          onChange={(e) => setParam(e.target.value)}
        >
          <option value="NDVI">NDVI (Vegetation)</option>
          <option value="NDWI">NDWI (Water)</option>
          <option value="NDMI">NDMI (Moisture)</option>
          <option value="EVI">EVI (Enhanced)</option>
        </select>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-saffron-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono text-saffron-500/70 uppercase">Querying VEDAS...</span>
          </div>
        </div>
      ) : error ? (
        <div className="h-48 flex items-center justify-center text-red-500 text-xs font-mono uppercase">{error}</div>
      ) : data.length === 0 ? (
        <div className="h-48 flex items-center justify-center text-slate-500 text-xs font-mono uppercase">No temporal data found</div>
      ) : (
        <div className="h-48 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#172640" vertical={false} />
              <XAxis 
                dataKey="dateStr" 
                tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }} 
                stroke="#172640" 
                tickMargin={8}
                minTickGap={30}
              />
              <YAxis 
                tick={{ fontSize: 9, fill: '#94a3b8', fontFamily: 'monospace' }} 
                stroke="#172640" 
                domain={['auto', 'auto']}
                tickFormatter={(val) => val.toFixed(2)}
                width={35}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0B1220', border: '1px solid rgba(255, 153, 51, 0.3)', borderRadius: '4px', fontSize: '10px', fontFamily: 'monospace' }}
                itemStyle={{ color: '#FF9933' }}
              />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#FF9933" 
                strokeWidth={2} 
                dot={{ r: 2, fill: '#FF9933' }} 
                activeDot={{ r: 4, fill: '#fff', stroke: '#FF9933' }}
                name={param}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
