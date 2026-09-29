import React from 'react';
import { Cpu, ShieldAlert, Award, Layers, BarChart2, CheckCircle2 } from 'lucide-react';
import { MODEL_REGISTRY } from '../../data/systemMetadata';

export const ModelCenterView: React.FC = () => {
  return (
    <div className="space-y-3.5 select-none">
      {/* Header */}
      <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-semibold text-stone-900 mb-1">
          <Cpu className="w-4 h-4 text-amber-700" />
          <span>MODEL REGISTRY</span>
        </div>
        <h2 className="text-base font-semibold text-stone-900">Algorithms, Validation Benchmarks & Operational Limits</h2>
        <p className="text-xs text-stone-600 mt-1">
          Transparent model cards detailing algorithm architectures, simulated validation benchmarks, and explicit boundaries of applicability.
        </p>
      </div>

      {/* Model Cards */}
      <div className="space-y-3">
        {MODEL_REGISTRY.map((m) => (
          <div key={m.id} className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-stone-200">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono text-amber-800 font-bold">{m.id}</span>
                  <span className="text-stone-400">&bull;</span>
                  <span className="text-[11px] font-medium text-stone-500">{m.task}</span>
                </div>
                <h3 className="text-sm font-semibold text-stone-900 mt-0.5">{m.name}</h3>
                <div className="text-xs text-stone-600 font-mono mt-0.5">Architecture: {m.algorithm}</div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded bg-stone-100 border border-stone-200 text-stone-700 font-mono text-[10px]">
                  Validation: {m.validation}
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-mono text-[10px] font-semibold">
                  {m.status} (SIMULATED PROXY)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Features */}
              <div className="bg-[#fcfbf9] p-3 rounded-xs border border-stone-200 space-y-1">
                <div className="font-semibold text-stone-700 uppercase text-[10px] tracking-wide">Key Input Features</div>
                <div className="text-stone-600 leading-relaxed text-xs">{m.features}</div>
              </div>

              {/* Benchmarking Metrics */}
              <div className="bg-[#fcfbf9] p-3 rounded-xs border border-stone-200 space-y-1">
                <div className="font-semibold text-stone-700 uppercase text-[10px] tracking-wide">Validation Metrics (Proxy)</div>
                <div className="font-mono text-emerald-800 font-bold text-xs">{m.metrics}</div>
                <div className="text-[11px] text-stone-500 font-mono">{m.validation}</div>
              </div>

              {/* Explicit Limits & Honesty */}
              <div className="bg-amber-50/60 p-3 rounded-xs border border-amber-200 space-y-1 text-amber-900">
                <div className="font-semibold text-amber-800 uppercase text-[10px] tracking-wide flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                  <span>Boundaries & Limitations</span>
                </div>
                <div className="text-xs leading-relaxed text-stone-700">{m.limitations}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
