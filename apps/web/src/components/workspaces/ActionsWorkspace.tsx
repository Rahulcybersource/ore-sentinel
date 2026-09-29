import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Download, 
  FileText, 
  Printer, 
  ArrowRight,
  Truck,
  Zap,
  Wrench,
  Layers,
  ChevronRight,
  Sliders
} from 'lucide-react';
import { CorrectiveRecommendation } from '../../types';
import { INITIAL_RECOMMENDATIONS } from '../../data/recommendationData';

interface ActionsWorkspaceProps {
  onNavigateToOverview: () => void;
  onNavigateToExploration: () => void;
}

interface ActionWithAudit extends CorrectiveRecommendation {
  approvedBy?: string;
  approvedAt?: string;
}

export const ActionsWorkspace: React.FC<ActionsWorkspaceProps> = ({
  onNavigateToOverview,
  onNavigateToExploration,
}) => {
  const [recommendations, setRecommendations] = useState<ActionWithAudit[]>(
    INITIAL_RECOMMENDATIONS.map((r, idx) => ({
      ...r,
      // Pre-seed first one as approved with audit trail for demo completeness
      status: idx === 0 ? 'ACCEPTED' : 'PENDING',
      approvedBy: idx === 0 ? 'Mine Operations Manager' : undefined,
      approvedAt: idx === 0 ? 'Today at 08:30 AM' : undefined,
    }))
  );
  const [showExportModal, setShowExportModal] = useState(false);

  const handleApproveAction = (id: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              status: rec.status === 'ACCEPTED' ? 'PENDING' : 'ACCEPTED',
              approvedBy: rec.status === 'ACCEPTED' ? undefined : 'Mine Operations Manager',
              approvedAt: rec.status === 'ACCEPTED' ? undefined : `Today at ${timeStr}`,
            }
          : rec
      )
    );
  };

  const handleDeclineAction = (id: string) => {
    setRecommendations((prev) =>
      prev.map((rec) =>
        rec.id === id
          ? {
              ...rec,
              status: rec.status === 'REJECTED' ? 'PENDING' : 'REJECTED',
              approvedBy: undefined,
              approvedAt: undefined,
            }
          : rec
      )
    );
  };

  const acceptedTonnes = recommendations
    .filter((r) => r.status === 'ACCEPTED')
    .reduce((sum, r) => sum + r.tonnageImpact, 0);

  const baselineShortfall = 3800;
  const remainingGap = Math.max(0, baselineShortfall - acceptedTonnes);

  return (
    <div className="space-y-3.5 select-none">
      {/* Top Command Bar */}
      <div className="bg-white px-4 py-3 rounded-2xl border border-stone-200/90 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-semibold text-stone-900">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>05 ACTIONS — WHAT SHOULD WE DO TODAY?</span>
          </div>
          <span className="text-stone-300 hidden sm:inline">|</span>
          <div className="text-xs text-stone-500 hidden sm:inline">
            Answers: What should we do today? &bull; Concrete Shift Directives &amp; Audit Trail
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowExportModal(true)}
            className="px-3.5 py-1.5 bg-[#f7f6f2] hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl border border-stone-300 flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-stone-600" />
            <span>Export Action Summary</span>
          </button>

          <button
            onClick={onNavigateToOverview}
            className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <span>Return to Overview</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-300" />
          </button>
        </div>
      </div>

      {/* Summary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium mb-1">
            Current Target Deficit
          </div>
          <div className="text-2xl font-bold font-mono text-red-600">-3,800 Tonnes</div>
          <div className="text-[11px] text-stone-500 mt-1">Balaghat Deep, Dongri & Kandri</div>
        </div>

        <div className="bg-white p-4 rounded-xs border border-emerald-200 shadow-xs">
          <div className="text-xs text-emerald-700 font-medium mb-1">
            Approved Recovery Yield
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700">+{acceptedTonnes.toLocaleString()} Tonnes</div>
          <div className="text-[11px] text-stone-600 mt-1">
            {recommendations.filter((r) => r.status === 'ACCEPTED').length} of {recommendations.length} directives authorized
          </div>
        </div>

        <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium mb-1">
            Remaining Net Deficit
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">
            {remainingGap === 0 ? '0 Tonnes (Met)' : `-${remainingGap.toLocaleString()} Tonnes`}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {remainingGap === 0 ? 'Target recovery trajectory complete' : 'Residual deficit balance'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs">
          <div className="text-xs text-stone-500 font-medium mb-1">
            Average Impact Lead Time
          </div>
          <div className="text-2xl font-bold font-mono text-stone-900">36.0 Hours</div>
          <div className="text-[11px] text-stone-500 mt-1">Turnaround from shift clearance</div>
        </div>
      </div>

      {/* Ranked Recommendations List */}
      <div className="bg-white p-4 rounded-xs border border-stone-200 shadow-xs space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-stone-200">
          <span className="text-xs font-semibold text-stone-900 uppercase tracking-wide">
            Prioritized Corrective Actions (Ranked by Marginal Recovery)
          </span>
          <span className="text-xs text-stone-500">
            Ranked by: (Tonnage Yield &times; Feasibility) &divide; Lead Hours
          </span>
        </div>

        <div className="space-y-2.5">
          {recommendations.map((rec) => {
            const isAccepted = rec.status === 'ACCEPTED';
            const isRejected = rec.status === 'REJECTED';

            return (
              <div
                key={rec.id}
                className={`p-3.5 rounded-xs border transition-all ${
                  isAccepted
                    ? 'bg-emerald-50/40 border-emerald-300'
                    : isRejected
                    ? 'bg-stone-50 border-stone-200 opacity-60'
                    : 'bg-[#fcfbf9] border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                  {/* Left info */}
                  <div className="flex items-start space-x-3 flex-1">
                    <div
                      className={`w-7 h-7 rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                        isAccepted
                          ? 'bg-emerald-700 text-white'
                          : 'bg-stone-200 text-stone-700'
                      }`}
                    >
                      #{rec.rank}
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-stone-900">{rec.title}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200">
                          {rec.mineZone}
                        </span>
                        {isAccepted && (
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Authorized</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-300 flex items-center space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>Declined</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-600 leading-relaxed">{rec.description}</p>
                    </div>
                  </div>

                  {/* Middle metrics */}
                  <div className="grid grid-cols-4 gap-3 text-xs shrink-0 py-2 px-3 bg-white rounded-xs border border-stone-200">
                    <div>
                      <span className="text-[10px] text-stone-500 block font-medium">Expected Yield</span>
                      <span className="text-emerald-700 font-bold font-mono">+{rec.tonnageImpact} t</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block font-medium">Lead Time</span>
                      <span className="text-stone-800 font-mono">{rec.timeToImpactHours}h</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block font-medium">Feasibility</span>
                      <span
                        className={`font-medium ${
                          rec.operationalDifficulty === 'LOW'
                            ? 'text-emerald-700'
                            : rec.operationalDifficulty === 'MEDIUM'
                            ? 'text-amber-700'
                            : 'text-red-700'
                        }`}
                      >
                        {rec.operationalDifficulty}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block font-medium">Opex Tier</span>
                      <span className="text-stone-800 font-mono">{rec.cost}</span>
                    </div>
                  </div>

                  {/* Right action buttons & Status */}
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 block uppercase font-medium">Status</span>
                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-full inline-block border ${
                          isAccepted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isRejected
                            ? 'bg-red-50 text-red-800 border-red-300'
                            : 'bg-stone-100 text-stone-700 border-stone-300'
                        }`}
                      >
                        {isAccepted ? 'Approved' : isRejected ? 'Declined' : 'Pending'}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => handleApproveAction(rec.id)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center space-x-1.5 shadow-2xs ${
                          isAccepted
                            ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                            : 'bg-stone-900 hover:bg-stone-800 text-white'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-300" />
                        <span>{isAccepted ? 'Revoke Approval' : 'Approve Action'}</span>
                      </button>

                      <button
                        onClick={() => handleDeclineAction(rec.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer flex items-center space-x-1 ${
                          isRejected
                            ? 'bg-stone-800 text-white'
                            : 'bg-white hover:bg-stone-100 text-stone-600 border border-stone-300'
                        }`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{isRejected ? 'Reset' : 'Decline'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Audit Trail Note if Approved */}
                {isAccepted && rec.approvedBy && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-emerald-900">
                    <div className="flex items-center space-x-1.5 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>Approved by: <strong>{rec.approvedBy}</strong></span>
                      <span className="text-emerald-600">&bull;</span>
                      <span>Timestamp: <strong>{rec.approvedAt}</strong></span>
                    </div>
                    <span className="font-mono text-[10px] text-emerald-700 bg-white/70 px-2 py-0.5 rounded border border-emerald-200">
                      Ledger ID: #{rec.id}-AUTH-2026
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Audit Trail Summary Box */}
        <div className="bg-[#faf9f6] p-4 rounded-xl border border-stone-200 space-y-2 mt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
              Official Shift Audit Trail
            </span>
            <span className="text-[11px] font-mono text-stone-500">
              {recommendations.filter((r) => r.status === 'ACCEPTED').length} Directive(s) Active
            </span>
          </div>
          <div className="space-y-1.5 text-xs text-stone-600">
            {recommendations.filter((r) => r.status === 'ACCEPTED').length === 0 ? (
              <p className="italic text-stone-500 text-[11px]">No actions approved yet. Click 'Approve Action' above to authorize directives.</p>
            ) : (
              recommendations
                .filter((r) => r.status === 'ACCEPTED')
                .map((r) => (
                  <div key={`audit-${r.id}`} className="flex items-center justify-between py-1 border-b border-stone-200 text-xs">
                    <span className="font-medium text-stone-800">
                      ✓ #{r.rank} {r.title} ({r.mineZone})
                    </span>
                    <span className="text-stone-500 font-mono text-[11px]">
                      {r.approvedBy} &bull; {r.approvedAt}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>

      {/* Export Action Dossier Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white border border-stone-300 w-full max-w-2xl rounded-xs shadow-xl overflow-hidden animate-in fade-in duration-150">
            <div className="px-5 py-3.5 bg-[#faf9f6] border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-800" />
                <span className="font-semibold text-stone-900 text-xs uppercase tracking-wide">
                  Operational Decision Briefing
                </span>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-stone-500 hover:text-stone-900 text-xs font-medium cursor-pointer"
              >
                Close (ESC)
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-stone-700 max-h-[70vh] overflow-y-auto">
              <div className="p-3 bg-[#faf9f6] rounded-xs border border-stone-200 space-y-1">
                <div className="text-stone-900 font-semibold">MOIL Limited &bull; Ministry of Steel (Govt of India)</div>
                <div>Operational Dispatch & Remediation Briefing</div>
                <div>Cycle: September 2026 (Day 21 / 30-Day Mining Execution Plan)</div>
                <div className="text-stone-500 font-mono text-[11px]">System Benchmark: SIH26009 Manganese Decision Intelligence</div>
              </div>

              <div className="space-y-1">
                <div className="text-stone-900 font-semibold uppercase text-xs">Executive Summary</div>
                <p className="text-stone-600 leading-relaxed text-xs">
                  The predictive model projects a month-end shortfall of 3,800 tonnes (-7.3%) against the 52,000 tonne target across Balaghat Deep, Dongri Buzurg, and Kandri sectors. Primary contributing causal vectors are equipment fleet downtime (48%) and blasting clearance delays (26%).
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-stone-900 font-semibold uppercase text-xs">Authorized Shift Directives</div>
                <div className="space-y-1.5">
                  {recommendations
                    .filter((r) => r.status === 'ACCEPTED')
                    .map((r) => (
                      <div key={r.id} className="p-2.5 bg-[#faf9f6] rounded-xs border border-stone-200 flex justify-between items-center">
                        <div>
                          <span className="font-semibold text-emerald-800">#{r.rank} {r.title}</span>
                          <span className="text-stone-500 ml-2">({r.mineZone})</span>
                        </div>
                        <span className="text-emerald-800 font-semibold font-mono text-xs">+{r.tonnageImpact} t ({r.timeToImpactHours}h)</span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="p-3 bg-[#faf9f6] rounded-xs border border-stone-200 flex justify-between items-center">
                <span className="text-stone-600 font-medium">Total Approved Yield Recovery:</span>
                <span className="text-emerald-800 font-bold text-sm font-mono">+{acceptedTonnes.toLocaleString()} Tonnes</span>
              </div>
            </div>

            <div className="px-5 py-3 bg-[#faf9f6] border-t border-stone-200 flex justify-between items-center">
              <span className="text-xs text-stone-500">Status: Ready for Shift Superintendent Clearance</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-3 py-1.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xs text-xs font-medium flex items-center space-x-1.5 border border-stone-300 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-xs cursor-pointer shadow-xs"
                >
                  Confirm Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
