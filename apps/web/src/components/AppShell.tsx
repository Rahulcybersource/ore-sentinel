import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Radio } from 'lucide-react';
import { motionPresets } from '../theme/tokens';

type Role = 'Planner' | 'Geologist' | 'Site Head' | 'Corporate';

const NAV_ITEMS = [
  { id: 'dashboard',       label: 'Dashboard',       path: '/'               },
  { id: 'map',             label: 'Reserve Map',     path: '/map'            },
  { id: 'production',      label: 'Production',      path: '/production'     },
  { id: 'alerts',          label: 'Alerts',          path: '/alerts'         },
  { id: 'recommendations', label: 'Recommendations', path: '/recommendations'},
];

export const AppShell: React.FC = () => {
  const [role, setRole] = useState<Role>('Planner');
  const location = useLocation();
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/status')
      .then(r => r.json())
      .then(s => { if (s.lastPopulated) setDataTimestamp(s.lastPopulated); })
      .catch(() => {});
  }, []);

  const formatTs = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      + ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    /* Full viewport – starfield shows around and behind the card */
    <div className="flex h-screen items-center justify-center p-5 md:p-8 relative overflow-hidden">

      {/* ── Ambient glow blobs ── */}
      <div className="pointer-events-none select-none absolute inset-0 overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-accent-400/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-5%] w-[500px] h-[500px] bg-purple-700/[0.08] rounded-full blur-[120px]" />
        <div className="absolute top-[35%] right-[20%] w-[300px] h-[300px] bg-cyan-600/[0.05] rounded-full blur-[90px]" />
      </div>

      {/* ── Main floating glass shell ── */}
      <div
        className="relative w-full max-w-[1380px] h-full flex flex-col overflow-hidden"
        style={{
          background: 'rgba(8, 10, 18, 0.60)',
          backdropFilter: 'blur(28px) saturate(160%)',
          WebkitBackdropFilter: 'blur(28px) saturate(160%)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '20px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >

        {/* ── Top navigation bar ── */}
        <header
          className="h-[60px] flex items-center justify-between px-8 shrink-0 z-20"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0 select-none">
            <div className="relative w-5 h-5">
              <div className="absolute inset-0 rounded-full border border-accent-400/60" />
              <div className="absolute inset-[5px] rounded-full bg-accent-400" />
            </div>
            <span className="text-[11px] font-semibold tracking-[0.3em] uppercase text-white/90">
              Ore Sentinel
            </span>
          </div>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-7">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `text-[10px] font-semibold tracking-[0.2em] uppercase transition-all duration-200 pb-0.5 ${
                    isActive
                      ? 'text-accent-400 border-b border-accent-400'
                      : 'text-muted-400 border-b border-transparent hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Live pulse */}
            <div className="hidden xl:flex items-center gap-2">
              <div className="relative w-2 h-2">
                <span className="absolute inset-0 rounded-full bg-emerald-400 radar-ping" />
                <span className="relative block w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <span className="text-[9px] tracking-widest uppercase text-emerald-400/80 font-medium">
                {dataTimestamp ? `Synced ${formatTs(dataTimestamp)}` : 'Live Feed'}
              </span>
            </div>

            {/* Role selector */}
            <div
              className="relative"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: '8px',
              }}
            >
              <select
                value={role}
                onChange={e => setRole(e.target.value as Role)}
                className="appearance-none bg-transparent text-white text-[10px] font-semibold tracking-[0.15em] uppercase py-2 pl-4 pr-9 focus:outline-none cursor-pointer transition-colors"
              >
                <option value="Planner">Planner</option>
                <option value="Geologist">Geologist</option>
                <option value="Site Head">Site Head</option>
                <option value="Corporate">Corporate</option>
              </select>
              <ChevronDown size={11} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-400 pointer-events-none" />
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={motionPresets.fadeIn}
              initial="initial"
              animate="animate"
              exit="exit"
              className="absolute inset-0"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* ── Corner branding over the starfield ── */}
      <div className="absolute bottom-4 left-6 pointer-events-none select-none hidden xl:block">
        <p className="text-[11px] font-semibold leading-snug tracking-wider uppercase text-white/40">
          Ore Exploration<br/>& Remote Sensing
        </p>
      </div>
      <div className="absolute top-4 right-6 text-right pointer-events-none select-none hidden xl:block">
        <p className="text-[13px] font-bold tracking-[0.35em] uppercase text-white/25">
          ORE<br/>SENTINEL
        </p>
      </div>
    </div>
  );
};
