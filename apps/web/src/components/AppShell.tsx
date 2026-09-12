import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Map, 
  TrendingUp, 
  AlertTriangle, 
  CheckSquare, 
  Building2,
  ChevronDown,
  Clock,
  Globe2
} from 'lucide-react';
import { motionPresets } from '../theme/tokens';

type Role = 'Planner' | 'Geologist' | 'Site Head' | 'Corporate';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['Planner', 'Site Head', 'Corporate'] },
  { id: 'map', label: 'Reserve Map', path: '/map', icon: Map, roles: ['Planner', 'Geologist'] },
  { id: 'production', label: 'Production', path: '/production', icon: TrendingUp, roles: ['Planner', 'Site Head'] },
  { id: 'alerts', label: 'Alerts', path: '/alerts', icon: AlertTriangle, roles: ['Geologist', 'Site Head'] },
  { id: 'recommendations', label: 'Recommendations', path: '/recommendations', icon: CheckSquare, roles: ['Planner', 'Site Head'] },
  { id: 'corporate', label: 'Corporate View', path: '/corporate', icon: Building2, roles: ['Corporate'] },
  { id: 'national', label: 'National Overview', path: '/national', icon: Globe2, roles: ['Corporate', 'Planner'] },
];

export const AppShell: React.FC = () => {
  const [role, setRole] = useState<Role>('Planner');
  const location = useLocation();
  const [dataTimestamp, setDataTimestamp] = useState<string | null>(null);

  useEffect(() => {
    fetch('http://localhost:4000/api/status')
      .then(r => r.json())
      .then(status => {
        if (status.lastPopulated) setDataTimestamp(status.lastPopulated);
      })
      .catch(() => { /* proxy offline, no timestamp to show */ });
  }, []);

  const formatTs = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
      + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-screen bg-navy-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar Nav */}
      <nav className="w-64 bg-navy-800 border-r border-navy-700 flex flex-col z-20">
        <div className="p-6 border-b border-navy-700">
          <h1 className="text-2xl font-bold text-teal-400 tracking-wide">ORE-SENTINEL</h1>
          <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">Moil Analytics</p>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isEmphasized = item.roles.includes(role);
            
            return (
              <NavLink 
                key={item.id} 
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-navy-700 text-teal-400' 
                    : isEmphasized 
                      ? 'text-slate-200 hover:bg-navy-700/50 hover:text-teal-400'
                      : 'text-slate-500 hover:text-slate-300 opacity-60 hover:opacity-100'
                  }
                `}
              >
                <item.icon size={20} className="shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Data Sources & Attribution */}
        <div className="p-4 border-t border-navy-700">
          <h3 className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">Data Sources & Attribution</h3>
          <ul className="text-[9px] text-slate-500 space-y-1 mb-3 leading-tight">
            <li>&bull; Satellite Basemap: Esri World Imagery &copy; Esri, Maxar, Earthstar Geographics</li>
            <li>&bull; Sentinel-2: Contains modified Copernicus Sentinel data [2026]</li>
            <li>&bull; Rainfall forecast: Open-Meteo</li>
            <li>&bull; LST: MODIS MOD11A2, NASA LP DAAC</li>
            <li>&bull; Base Map: &copy; OpenStreetMap contributors</li>
            <li>&bull; Grade thresholds per MOIL published pricing/grade standards (Mn-44% and above = Ferro grade).</li>
            <li>&bull; National Mineral Inventory: GSI / IBM UNFC [495.87 Mt Reserves & Resources].</li>
          </ul>

          {/* Step 13: Data freshness timestamp */}
          {dataTimestamp && (
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mb-3">
              <Clock size={10} className="shrink-0 text-teal-500" />
              <span>Data as of {formatTs(dataTimestamp)}</span>
            </div>
          )}

          <NavLink 
            to="/style-guide"
            className={({ isActive }) => `
              flex items-center gap-3 px-4 py-3 rounded-lg text-xs font-mono
              ${isActive ? 'text-amber-500 bg-navy-700' : 'text-slate-500 hover:text-amber-400'}
            `}
          >
            Style Guide
          </NavLink>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Bar */}
        <header className="h-16 bg-navy-900 border-b border-navy-700 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-mono uppercase tracking-widest">Active Role:</span>
            <div className="relative">
              <select 
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="appearance-none bg-navy-800 border border-navy-700 text-teal-400 font-medium py-1.5 pl-4 pr-10 rounded-md focus:outline-none focus:border-teal-500 transition-colors"
              >
                <option value="Planner">Planner</option>
                <option value="Geologist">Geologist</option>
                <option value="Site Head">Site Head</option>
                <option value="Corporate">Corporate</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-500 pointer-events-none" />
            </div>
          </div>
        </header>

        {/* Page Content with AnimatePresence for route transitions */}
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
    </div>
  );
};
