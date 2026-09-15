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
      <div className="glass-card p-6 space-y-3">
        <SkeletonBar className="h-6 w-56" />
        <SkeletonBar className="h-4 w-full" />
        <SkeletonBar className="h-4 w-3/4" />
      </div>
      <div className="glass-card p-6 space-y-3">
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
      className="p-6 md:p-8 max-w-4xl mx-auto space-y-8 relative z-10"
    >
      <button onClick={() => navigate('/alerts')} className="flex items-center gap-2 text-accent-400/70 hover:text-accent-400 transition-colors text-[11px] font-semibold tracking-[0.2em] uppercase">
        <ArrowLeft size={16} /> Back to Alerts
      </button>

      <header className="glass-card-amber p-5 md:p-6 flex items-start gap-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.8)]" />
        <ShieldAlert className="text-amber-400 shrink-0 mt-1 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]" size={28} />
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] tracking-wide uppercase">
            HUMAN APPROVAL REQUIRED
          </h1>
          <p className="text-amber-400/80 mt-2 text-sm md:text-base leading-relaxed">
            <span className="text-amber-400 font-bold tracking-wider">&gt; NO AUTOMATIC ACTION TAKEN.</span> The system has generated the following mitigation strategies for this risk. Review the estimated impacts and explicitly approve or reject them to update the operational plan.
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
                className={`glass-panel p-5 md:p-6 transition-colors duration-300 ${isResolved ? 'border-accent-400/50 shadow-[0_0_15px_rgba(243,195,84,0.1)]' : 'border-accent-400/10'}`}
              >
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 md:gap-6">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg md:text-xl font-bold text-white tracking-wide">{rec.title}</h3>
                    <p className="text-muted-400 mt-2 text-sm md:text-base leading-relaxed">{rec.description}</p>
                    <div 
                      className="mt-4 inline-block px-3 py-1.5 rounded text-[10px] font-semibold tracking-[0.15em] uppercase"
                      style={{
                        background: 'rgba(243,195,84,0.1)',
                        color: '#F3C354',
                        border: '1px solid rgba(243,195,84,0.3)',
                        boxShadow: 'inset 0 0 8px rgba(243,195,84,0.1)'
                      }}
                    >
                      Est. Impact: {rec.estimatedImpact}
                    </div>
                  </div>
                  
                  <div className="shrink-0 md:w-48 md:text-right">
                    <AnimatePresence mode="wait">
                      {isResolved ? (
                        <motion.div 
                          key="resolved"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="flex items-center md:justify-end gap-2 text-accent-400 font-bold tracking-wider drop-shadow-[0_0_5px_rgba(243,195,84,0.5)] uppercase text-sm"
                        >
                          <CheckCircle size={18} /> {rec.status}
                        </motion.div>
                      ) : (
                        <motion.div key="pending" className="flex flex-row md:flex-col gap-3">
                          <button 
                            onClick={() => handleDecision(rec.id, 'ACCEPTED')}
                            disabled={processingId === rec.id}
                            className="bg-accent-400/10 border border-accent-400/50 hover:bg-accent-400/20 active:scale-[0.97] text-accent-400 font-bold py-2.5 px-4 rounded-lg shadow-[inset_0_0_10px_rgba(243,195,84,0.2)] flex items-center justify-center gap-2 disabled:opacity-50 transition-all flex-1 md:flex-none text-[11px] tracking-[0.15em] uppercase"
                          >
                            {processingId === rec.id ? 'Processing...' : <><Check size={16} /> Execute</>}
                          </button>
                          <button 
                            onClick={() => handleDecision(rec.id, 'REJECTED')}
                            disabled={processingId === rec.id}
                            className="bg-danger-500/5 border border-danger-500/30 text-danger-500 hover:bg-danger-500/10 active:scale-[0.97] font-bold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all flex-1 md:flex-none text-[11px] tracking-[0.15em] uppercase"
                          >
                            <XCircle size={16} /> Discard
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
