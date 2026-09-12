import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAdapters } from '../data/adapters/AdapterContext';
import type { Recommendation } from '../data/types/models';
import { motionPresets } from '../theme/tokens';
import { ShieldAlert, CheckCircle, XCircle, ArrowLeft, Check } from 'lucide-react';
import { ErrorState, EmptyState, SkeletonBar } from '../components/Skeletons';

export const Recommendations: React.FC = () => {
  const adapters = useAdapters();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const alertId = searchParams.get('alertId') || 'a1';
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adapters.recommendations.getRecommendations(alertId);
      setRecommendations(res);
    } catch (err) {
      console.error(err);
      setError('Failed to load recommendations.');
    } finally {
      setLoading(false);
    }
  }, [adapters, alertId]);

  useEffect(() => { fetchRecs(); }, [fetchRecs]);

  const handleDecision = async (recId: string, decision: 'ACCEPTED' | 'REJECTED' | 'IMPLEMENTED') => {
    setProcessingId(recId);
    await adapters.recommendations.submitDecision(recId, decision);
    setRecommendations(prev => 
      prev.map(r => r.id === recId ? { ...r, status: decision } : r)
    );
    setProcessingId(null);
  };

  if (loading) return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      <SkeletonBar className="h-5 w-32" />
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-3">
        <SkeletonBar className="h-6 w-56" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-3/4" />
      </div>
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 space-y-3">
        <SkeletonBar className="h-5 w-48" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-8 w-32" />
      </div>
    </div>
  );
  if (error) return <ErrorState message={error} onRetry={fetchRecs} />;

  return (
    <motion.div 
      variants={motionPresets.fadeIn}
      initial="initial"
      animate="animate"
      className="p-6 md:p-8 max-w-4xl mx-auto space-y-8"
    >
      <button onClick={() => navigate('/alerts')} className="flex items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors text-sm">
        <ArrowLeft size={18} /> Back to Alerts
      </button>

      <header className="bg-amber-500/10 border border-amber-500/50 rounded-xl p-5 md:p-6 flex items-start gap-4">
        <ShieldAlert className="text-amber-500 shrink-0 mt-1" size={28} />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-amber-500">HUMAN APPROVAL REQUIRED</h1>
          <p className="text-slate-300 mt-2 text-sm md:text-lg leading-relaxed">
            🚨 <strong className="text-white">NO AUTOMATIC ACTION TAKEN.</strong> The system has generated the following mitigation strategies for this risk. Review the estimated impacts and explicitly approve or reject them to update the operational plan.
          </p>
        </div>
      </header>

      <div className="space-y-6">
        {recommendations.length === 0 ? (
          <EmptyState
            title="No recommendations available"
            description="No mitigation actions have been generated for this alert."
          />
        ) : (
          recommendations.map((rec, i) => {
            const isResolved = rec.status !== 'PENDING';
            
            return (
              <motion.div 
                key={rec.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-navy-800 border rounded-xl p-5 md:p-6 shadow-lg transition-colors duration-300 ${isResolved ? 'border-teal-500/30' : 'border-navy-700'}`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-slate-100">{rec.title}</h3>
                    <p className="text-slate-400 mt-2 text-sm md:text-base">{rec.description}</p>
                    <div className="mt-4 inline-block bg-teal-500/20 text-teal-400 px-3 py-1 rounded-md text-sm font-mono border border-teal-500/30">
                      Impact: {rec.estimatedImpact}
                    </div>
                  </div>
                  
                  <div className="shrink-0 md:w-48 md:text-right">
                    <AnimatePresence mode="wait">
                      {isResolved ? (
                        <motion.div 
                          key="resolved"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center md:justify-end gap-2 text-teal-400 font-bold"
                        >
                          <CheckCircle size={24} /> {rec.status}
                        </motion.div>
                      ) : (
                        <motion.div key="pending" className="flex flex-row md:flex-col gap-3">
                          <button 
                            onClick={() => handleDecision(rec.id, 'ACCEPTED')}
                            disabled={processingId === rec.id}
                            className="bg-teal-500 hover:bg-teal-400 active:scale-[0.97] text-navy-900 font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all flex-1 md:flex-none text-sm md:text-base"
                          >
                            {processingId === rec.id ? 'Processing...' : <><Check size={18} /> Accept Action</>}
                          </button>
                          <button 
                            onClick={() => handleDecision(rec.id, 'REJECTED')}
                            disabled={processingId === rec.id}
                            className="bg-transparent border border-danger-500 text-danger-500 hover:bg-danger-500/10 active:scale-[0.97] font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all flex-1 md:flex-none text-sm md:text-base"
                          >
                            <XCircle size={18} /> Reject
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
