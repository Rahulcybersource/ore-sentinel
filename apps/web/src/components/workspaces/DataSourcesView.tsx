import React from 'react';
import { Database, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';
import { DATA_SOURCE_REGISTRY } from '../../data/systemMetadata';

export const DataSourcesView: React.FC = () => {
  return (
    <div className="space-y-3.5 select-none">
      {/* Header */}
      <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-semibold text-stone-900 mb-1">
          <Database className="w-4 h-4 text-amber-700" />
          <span>DATA SOURCES</span>
        </div>
        <h2 className="text-base font-semibold text-stone-900">Available Data & Provenance</h2>
        <p className="text-xs text-stone-600 mt-1">
          Catalog of Earth observation satellites, geological maps, drillhole logs, and operational telemetry driving manganese resource intelligence.
        </p>
      </div>

      {/* Registry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {DATA_SOURCE_REGISTRY.map((source) => (
          <div key={source.name} className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-start justify-between">
                <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wide">{source.category}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    source.status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : source.status === 'SYNCHRONIZED'
                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {source.status}
                </span>
              </div>
              <h3 className="text-xs font-semibold text-stone-900 mt-1.5">{source.name}</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">{source.description}</p>
            </div>

            <div className="space-y-1.5 pt-3 border-t border-stone-100 text-xs">
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Resolution / Extent:</span>
                <span className="text-stone-800 font-mono text-[11px]">{source.resolution}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Cadence:</span>
                <span className="text-amber-800 font-medium text-[11px]">{source.cadence}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Provenance:</span>
                <span className="text-stone-800 text-[11px]">{source.provenance}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
