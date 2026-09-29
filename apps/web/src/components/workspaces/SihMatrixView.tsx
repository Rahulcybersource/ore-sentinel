import React from 'react';
import { Award, CheckCircle2 } from 'lucide-react';
import { SIH_REQUIREMENTS_MATRIX } from '../../data/systemMetadata';

export const SihMatrixView: React.FC = () => {
  return (
    <div className="space-y-3.5 select-none">
      {/* Header */}
      <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs">
        <div className="flex items-center space-x-2 text-xs font-semibold text-stone-900 mb-1">
          <Award className="w-4 h-4 text-amber-700" />
          <span>SIH26009 COMPLIANCE TRACEABILITY</span>
        </div>
        <h2 className="text-base font-semibold text-stone-900">Direct Solution Mapping for MOIL Mandate SIH26009</h2>
        <p className="text-xs text-stone-600 mt-1">
          Traceability matrix mapping every core deliverable from Ministry of Steel / MOIL SIH26009 into verified software modules.
        </p>
      </div>

      {/* Compliance Table */}
      <div className="bg-white rounded-xs border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#faf9f6] text-stone-600 font-semibold text-xs border-b border-stone-200 uppercase tracking-wide">
              <tr>
                <th className="p-3">Req Code</th>
                <th className="p-3">Mandated Scope</th>
                <th className="p-3">Delivered Solution Module</th>
                <th className="p-3">Primary Workspace</th>
                <th className="p-3">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 bg-white text-xs">
              {SIH_REQUIREMENTS_MATRIX.map((item) => (
                <tr key={item.id} className="hover:bg-[#faf9f6] transition-colors">
                  <td className="p-3 font-bold font-mono text-stone-900">{item.id}</td>
                  <td className="p-3 text-stone-800 font-medium max-w-xs">{item.requirement}</td>
                  <td className="p-3 text-stone-600 max-w-sm">{item.implementation}</td>
                  <td className="p-3 font-semibold text-amber-800">{item.workspace}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold flex items-center space-x-1 w-fit">
                      <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                      <span>{item.compliance}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
