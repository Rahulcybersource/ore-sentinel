import React from 'react';
import { motion } from 'framer-motion';
import type { Easing } from 'framer-motion';

/**
 * Consistent shimmer skeleton block used across all screens
 * while adapter data is resolving. Matches the navy/dark theme.
 */

const EASE: Easing = 'easeInOut';

const shimmer = {
  initial: { opacity: 0.4 },
  animate: {
    opacity: [0.4, 0.7, 0.4],
    transition: { repeat: Infinity, duration: 1.8, ease: EASE },
  },
};

/** A single rectangular skeleton bar */
export const SkeletonBar: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <motion.div
    variants={shimmer}
    initial="initial"
    animate="animate"
    className={`bg-navy-700 rounded ${className}`}
    style={style}
  />
);

/** KPI card skeleton — used on Dashboard */
export const SkeletonKpiCard: React.FC = () => (
  <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 shadow-lg space-y-4">
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-1">
        <SkeletonBar className="h-3 w-24" />
        <SkeletonBar className="h-8 w-32" />
      </div>
      <SkeletonBar className="h-9 w-9 rounded-lg" />
    </div>
    <SkeletonBar className="h-4 w-28" />
  </div>
);

/** Chart skeleton — used on Dashboard sparkline and Production */
export const SkeletonChart: React.FC<{ height?: string }> = ({ height = 'h-48' }) => (
  <div className={`bg-navy-800 border border-navy-700 rounded-xl p-6 shadow-lg`}>
    <SkeletonBar className="h-3 w-40 mb-6" />
    <div className={`${height} w-full flex items-end gap-2`}>
      {[40, 65, 50, 80, 55, 70, 45, 60].map((h, i) => (
        <SkeletonBar key={i} className={`flex-1 rounded-t`} style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

/** Alert list item skeleton — used on Alerts screen */
export const SkeletonAlertRow: React.FC = () => (
  <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 shadow-lg flex items-center gap-4">
    <SkeletonBar className="h-12 w-12 rounded-full shrink-0" />
    <div className="space-y-2 flex-1">
      <SkeletonBar className="h-5 w-3/4" />
      <SkeletonBar className="h-3 w-1/2" />
    </div>
    <SkeletonBar className="h-6 w-6 rounded shrink-0" />
  </div>
);

/** Table row skeleton — used on Corporate view */
export const SkeletonTableRow: React.FC = () => (
  <tr className="border-b border-navy-700/50">
    <td className="py-4"><SkeletonBar className="h-4 w-28" /></td>
    <td className="py-4"><SkeletonBar className="h-4 w-16" /></td>
    <td className="py-4"><SkeletonBar className="h-4 w-16" /></td>
    <td className="py-4"><SkeletonBar className="h-4 w-10" /></td>
  </tr>
);

/** Full-screen loading skeleton composed of KPI cards + chart */
export const DashboardSkeleton: React.FC = () => (
  <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in">
    <div className="space-y-2">
      <SkeletonBar className="h-8 w-64" />
      <SkeletonBar className="h-4 w-48" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <SkeletonKpiCard />
      <SkeletonKpiCard />
      <SkeletonKpiCard />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 shadow-lg space-y-4">
        <SkeletonBar className="h-3 w-32 mb-6" />
        <SkeletonAlertRow />
        <SkeletonAlertRow />
        <SkeletonAlertRow />
      </div>
    </div>
  </div>
);

/** Alerts page skeleton */
export const AlertsSkeleton: React.FC = () => (
  <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
    <div className="space-y-2">
      <SkeletonBar className="h-8 w-48" />
      <SkeletonBar className="h-4 w-72" />
    </div>
    <div className="space-y-4 mt-8">
      <SkeletonAlertRow />
      <SkeletonAlertRow />
      <SkeletonAlertRow />
    </div>
  </div>
);

/** Production page skeleton */
export const ProductionSkeleton: React.FC = () => (
  <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
    <div className="flex justify-between items-end">
      <div className="space-y-2">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="h-4 w-56" />
      </div>
      <SkeletonBar className="h-10 w-48 rounded-lg" />
    </div>
    <SkeletonChart height="h-[460px]" />
  </div>
);

/** Corporate page skeleton */
export const CorporateSkeleton: React.FC = () => (
  <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
    <div className="flex items-center gap-4 border-b border-navy-700 pb-6">
      <SkeletonBar className="h-10 w-10 rounded-full" />
      <div className="space-y-2">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="h-4 w-64" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <SkeletonChart height="h-64" />
      <div className="bg-navy-800 border border-navy-700 rounded-xl p-6 shadow-lg">
        <SkeletonBar className="h-3 w-40 mb-6" />
        <SkeletonTableRow />
        <SkeletonTableRow />
        <SkeletonTableRow />
        <SkeletonTableRow />
      </div>
    </div>
  </div>
);

/**
 * Consistent error state shown when an adapter call fails.
 */
export const ErrorState: React.FC<{ message?: string; onRetry?: () => void }> = ({
  message = 'Something went wrong loading this data.',
  onRetry,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="bg-danger-500/10 border border-danger-500/30 rounded-full p-4 mb-4">
      <svg className="w-8 h-8 text-danger-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    </div>
    <p className="text-slate-300 text-lg font-medium mb-1">{message}</p>
    <p className="text-slate-500 text-sm mb-6">Check the data adapter connection and try again.</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="bg-navy-800 border border-navy-700 hover:border-teal-500 text-teal-400 font-medium px-6 py-2 rounded-lg transition-colors"
      >
        Retry
      </button>
    )}
  </motion.div>
);

/**
 * Consistent empty state shown when an adapter returns zero results.
 */
export const EmptyState: React.FC<{ title?: string; description?: string }> = ({
  title = 'No data available',
  description = 'There is nothing to display at this time.',
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="flex flex-col items-center justify-center py-20 text-center"
  >
    <div className="bg-navy-700/50 rounded-full p-4 mb-4">
      <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-2.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <p className="text-slate-300 text-lg font-medium">{title}</p>
    <p className="text-slate-500 text-sm mt-1">{description}</p>
  </motion.div>
);
