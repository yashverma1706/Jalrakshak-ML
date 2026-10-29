import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Droplets, LayoutDashboard, Compass, CloudRain, Plus, Home } from 'lucide-react';
import { useLand } from '../context/LandContext';
import { useLanguage } from '../context/LanguageContext';
import { checkBackendHealth } from '../api/client';

export default function Navbar({ onOpenAddLand }) {
  const { lands, selectedLandId, setSelectedLandId } = useLand();
  const { lang, setLang, t } = useLanguage();
  const [backendOnline, setBackendOnline] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    async function ping() {
      const isHealthy = await checkBackendHealth();
      if (mounted) setBackendOnline(isHealthy);
    }
    ping();
    const interval = setInterval(ping, 10000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleLandChange = (e) => {
    const val = e.target.value;
    if (val === '__add_new__') {
      onOpenAddLand();
    } else {
      setSelectedLandId(val);
      navigate('/advisor');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <Droplets className="w-5 h-5 fill-white/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  {lang === 'hi' ? 'जल' : 'Jal'}<span className="text-emerald-600">{lang === 'hi' ? 'रक्षक' : 'rakshak'}</span>
                </span>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  ML
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">{t('brandTagline')}</p>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Home className="w-4 h-4" />
              {t('navHome')}
            </NavLink>

            <NavLink
              to="/advisor"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <Compass className="w-4 h-4" />
              {t('navAdvisor')}
            </NavLink>

            <NavLink
              to="/weather"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <CloudRain className="w-4 h-4 text-sky-600" />
              {t('navWeather')}
            </NavLink>

            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4" />
              {t('navLands')}
              <span className="ml-1 bg-slate-200 text-slate-700 text-xs px-1.5 py-0.2 rounded-full font-bold">
                {lands.length}
              </span>
            </NavLink>
          </nav>

          {/* Right Section: Language Switcher, Land Switcher, Add Plot & Backend Status */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Language Toggle: English | हिंदी */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'en'
                    ? 'bg-white text-emerald-800 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Switch to English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === 'hi'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="हिंदी में बदलें"
              >
                हिं
              </button>
            </div>

            {/* Quick Land Switcher Dropdown */}
            <div className="relative flex items-center">
              <select
                value={selectedLandId}
                onChange={handleLandChange}
                className="text-xs sm:text-sm font-semibold bg-emerald-50 border border-emerald-300 text-emerald-950 rounded-xl px-2.5 sm:px-3 py-1.5 pr-7 focus:ring-2 focus:ring-emerald-500 focus:outline-none cursor-pointer hover:bg-emerald-100 transition-colors shadow-2xs max-w-[140px] sm:max-w-none truncate"
                title="Select land to open its irrigation advisor"
              >
                {lands.map((land) => (
                  <option key={land.id} value={land.id}>
                    🌱 {land.name}
                  </option>
                ))}
                <option value="__add_new__">+ {t('registerNewLand')}...</option>
              </select>
            </div>

            {/* Quick Add Land Button */}
            <button
              onClick={onOpenAddLand}
              type="button"
              className="hidden lg:flex items-center gap-1 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-2.5 py-1.5 rounded-xl transition-colors shadow-2xs cursor-pointer"
              title={t('registerNewLand')}
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              {t('newPlot')}
            </button>

            {/* Backend Health Status Dot */}
            <div
              className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg font-medium border ${
                backendOnline === true
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : backendOnline === false
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
              title={
                backendOnline === true
                  ? 'FastAPI ML Backend Connected'
                  : 'Backend offline: Ensure FastAPI is running on port 8000'
              }
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline === true
                    ? 'bg-emerald-500 animate-pulse'
                    : backendOnline === false
                    ? 'bg-rose-500'
                    : 'bg-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {backendOnline === true ? t('mlLive') : backendOnline === false ? t('mlOffline') : t('connecting')}
              </span>
            </div>

          </div>

        </div>
      </div>

      {/* Mobile Subnav */}
      <div className="md:hidden flex border-t border-slate-100 bg-white px-4 py-2 gap-2 text-xs">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex-1 text-center py-1.5 rounded-md font-medium ${
              isActive ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`
          }
        >
          {t('navHome')}
        </NavLink>
        <NavLink
          to="/advisor"
          className={({ isActive }) =>
            `flex-1 text-center py-1.5 rounded-md font-medium ${
              isActive ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`
          }
        >
          {t('navAdvisor')}
        </NavLink>
        <NavLink
          to="/weather"
          className={({ isActive }) =>
            `flex-1 text-center py-1.5 rounded-md font-medium ${
              isActive ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`
          }
        >
          {t('navWeather')}
        </NavLink>
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex-1 text-center py-1.5 rounded-md font-medium ${
              isActive ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`
          }
        >
          {t('navLands')} ({lands.length})
        </NavLink>
      </div>
    </header>
  );
}
