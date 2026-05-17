import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, Users, Sun, Moon, Scissors, StickyNote } from 'lucide-react';
import Orders from './pages/Orders';
import AddOrder from './pages/AddOrder';
import Tailors from './pages/Tailors';
import TailorWorkDashboard from './pages/TailorWorkDashboard';
import AddTailorWork from './pages/AddTailorWork';
import TailorWorkDetail from './pages/TailorWorkDetail';
import Notes from './pages/Notes';
import { useEffect, useState, createContext, useContext } from 'react';
import { translations } from './utils/i18n';

// ============================================================
// GLOBAL APP CONTEXT — language + theme live here
// ============================================================
export const AppContext = createContext({
  lang: 'en',
  theme: 'light',
  t: (key) => key,
});

export function useApp() {
  return useContext(AppContext);
}

// NavLinks — reads lang from context so it re-renders on lang change
function NavLinks() {
  const location = useLocation();
  const { t } = useApp();
  const isActive = (path) =>
    location.pathname === path || (path === '/add' && location.pathname.startsWith('/edit'));

  return (
    <>
      {/* Mobile Bottom Nav */}
      <div className="flex md:hidden justify-around items-center w-full h-14">
        <Link
          to="/"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${isActive('/') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-500'}`}
        >
          <Home size={22} />
          <span className="text-[10px] font-bold">{t('orders')}</span>
        </Link>
        <Link
          to="/add"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${isActive('/add') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-500'}`}
        >
          <PlusCircle size={22} />
          <span className="text-[10px] font-bold">{t('add_order')}</span>
        </Link>
        <Link
          to="/tailors"
          className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-colors ${isActive('/tailors') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-500'}`}
        >
          <Users size={22} />
          <span className="text-[10px] font-bold">{t('tailors')}</span>
        </Link>
        <Link
          to="/tailor-work"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${isActive('/tailor-work') || location.pathname.startsWith('/tailor-work') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-500'}`}
        >
          <Scissors size={22} />
          <span className="text-[10px] font-bold">{t('tailor_work')}</span>
        </Link>
        <Link
          to="/notes"
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-colors ${isActive('/notes') ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500 hover:text-indigo-500'}`}
        >
          <StickyNote size={22} />
          <span className="text-[10px] font-bold">{t('notes_title')}</span>
        </Link>
      </div>

      {/* Desktop Center Nav (inside header) — rendered separately below */}
    </>
  );
}

function DesktopNav() {
  const location = useLocation();
  const { t } = useApp();
  const isActive = (path) =>
    location.pathname === path || (path === '/add' && location.pathname.startsWith('/edit'));

  return (
    <div className="hidden md:flex items-center gap-1">
      <Link
        to="/"
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/') ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'}`}
      >
        <Home size={16} /> {t('orders')}
      </Link>
      <Link
        to="/add"
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/add') ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'}`}
      >
        <PlusCircle size={16} /> {t('add_order')}
      </Link>
      <Link
        to="/tailors"
        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/tailors') ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'}`}
      >
        <Users size={16} /> {t('tailors')}
      </Link>
      <Link
        to="/tailor-work"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/tailor-work') || location.pathname.startsWith('/tailor-work') ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'}`}
      >
        <Scissors size={16} /> {t('tailor_work')}
      </Link>
      <Link
        to="/notes"
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold transition-all ${isActive('/notes') ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-gray-800 dark:hover:text-gray-200'}`}
      >
        <StickyNote size={16} /> {t('notes_title')}
      </Link>
    </div>
  );
}

function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'en');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('app_authenticated') === 'true';
  });
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'abdullah') {
      localStorage.setItem('app_authenticated', 'true');
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError(lang === 'gu' ? 'ખોટો પાસવર્ડ!' : lang === 'hn' ? 'गलत पासवर्ड!' : 'Incorrect password!');
    }
  };

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Language persistence
  useEffect(() => {
    localStorage.setItem('app_lang', lang);
  }, [lang]);

  // Online/offline state monitoring
  useEffect(() => {
    const handleOnline = () => { setIsOnline(true); };
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Reactive translation function — recreated on lang change so all consumers re-render
  const t = (key) => translations[lang]?.[key] || translations['en']?.[key] || key;

  const contextValue = { lang, theme, t };

  if (!isAuthenticated) {
    return (
      <AppContext.Provider value={contextValue}>
        <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-200 ${theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-gray-50 text-gray-900'}`}>
          <div className="absolute top-4 right-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] transition-colors border-none cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark'
                ? <Sun size={16} className="text-yellow-400" />
                : <Moon size={16} className="text-indigo-500" />
              }
            </button>
          </div>
          <div className="w-full max-w-md bg-white dark:bg-[#181818] rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl border border-gray-100 dark:border-gray-800 p-6 md:p-10 space-y-6 md:space-y-8 relative overflow-hidden transition-all duration-300">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="text-center space-y-2 md:space-y-3">
              <div className="mx-auto w-12 h-12 md:w-16 md:h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-inner animate-pulse">
                <Scissors size={24} className="md:w-8 md:h-8 rotate-90" />
              </div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-gray-100 uppercase">
                FabricFlow
              </h1>
              <p className="text-xs md:text-sm font-bold text-gray-400 dark:text-gray-500">
                {lang === 'gu' ? 'કૃપા કરીને આગળ વધવા માટે પાસવર્ડ દાખલ કરો' : lang === 'hn' ? 'कृपया आगे बढ़ने के लिए पासवर्ड दर्ज करें' : 'Please enter password to continue'}
              </p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
              <div>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError('');
                  }}
                  placeholder={lang === 'gu' ? 'પાસવર્ડ લખો...' : lang === 'hn' ? 'पासवर्ड दर्ज करें...' : 'Enter password...'}
                  className="w-full text-center text-base md:text-xl p-3 md:p-5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#252525] rounded-xl md:rounded-2xl focus:bg-white dark:focus:bg-[#1e1e1e] focus:border-indigo-500 focus:ring-2 md:focus:ring-4 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 font-bold text-gray-900 dark:text-white tracking-widest"
                  autoFocus
                  required
                />
                {authError && (
                  <div className="mt-2 text-center text-xs md:text-sm font-extrabold text-red-500 dark:text-red-400 animate-bounce">
                    ⚠️ {authError}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold md:font-black py-3 md:py-4 rounded-xl md:rounded-2xl text-sm md:text-lg flex items-center justify-center gap-2 active:scale-95 transition-all outline-none shadow-sm md:shadow-md border-none cursor-pointer"
              >
                {lang === 'gu' ? 'પ્રવેશ કરો' : lang === 'hn' ? 'लॉगिन करें' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </AppContext.Provider>
    );
  }

  return (
    <AppContext.Provider value={contextValue}>
      <BrowserRouter>
        <div className={`min-h-screen flex flex-col transition-colors duration-200 ${theme === 'dark' ? 'bg-[#121212] text-white' : 'bg-gray-50 text-gray-900'}`}>

          {/* ===== HEADER ===== */}
          <header className={`fixed top-0 left-0 right-0 z-40 border-b transition-colors duration-200 ${theme === 'dark' ? 'bg-[#181818] border-gray-800' : 'bg-white border-gray-200'} shadow-sm`}>
            <div className="flex items-center justify-between max-w-7xl mx-auto px-3 sm:px-4 h-14">

              {/* LEFT — Logo + Status */}
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-[18px] sm:text-[20px] font-black text-indigo-600 dark:text-indigo-400 tracking-tight shrink-0">
                  FabricFlow
                </h1>
                <span className={`hidden sm:flex items-center gap-1 text-[10px] font-bold border rounded-full px-2 py-0.5 ${isOnline ? 'text-green-600 border-green-200 dark:border-green-800 dark:text-green-400 bg-green-50 dark:bg-green-900/20' : 'text-red-500 border-red-200 dark:border-red-800 dark:text-red-400 bg-red-50 dark:bg-red-900/20'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>
                  {isOnline ? t('online') : t('offline')}
                </span>
              </div>

              {/* CENTER — Desktop Navigation */}
              <DesktopNav />

              {/* RIGHT — Language + Theme toggles */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">

                {/* Language Switcher — INSTANT, no reload */}
                <div className="flex items-center bg-gray-100 dark:bg-[#252525] rounded-lg p-[3px] gap-[2px] text-[10px] sm:text-[11px] font-bold">
                  {['en', 'hn', 'gu'].map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-2 py-1 rounded-md transition-all ${lang === l
                        ? 'bg-white dark:bg-[#333] shadow-sm text-indigo-600 dark:text-indigo-400 font-black'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                      }`}
                    >
                      {l.toUpperCase()}
                    </button>
                  ))}
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 sm:p-2 rounded-lg bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                  title="Toggle theme"
                >
                  {theme === 'dark'
                    ? <Sun size={16} className="text-yellow-400" />
                    : <Moon size={16} className="text-indigo-500" />
                  }
                </button>
              </div>
            </div>
          </header>

          {/* Mobile Status Dot */}
          <span className={`sm:hidden fixed top-4 left-[120px] z-50 w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></span>

          {/* ===== MAIN CONTENT ===== */}
          <main className="flex-1 pt-14 pb-16 md:pb-4 max-w-7xl mx-auto w-full px-3 sm:px-4 md:px-6 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Orders />} />
              <Route path="/add" element={<AddOrder />} />
              <Route path="/edit/:id" element={<AddOrder />} />
              <Route path="/tailors" element={<Tailors />} />
              <Route path="/tailor-work" element={<TailorWorkDashboard />} />
              <Route path="/tailor-work/add" element={<AddTailorWork />} />
              <Route path="/tailor-work/:id" element={<TailorWorkDetail />} />
              <Route path="/notes" element={<Notes />} />
            </Routes>
          </main>

          {/* ===== MOBILE BOTTOM NAV ===== */}
          <nav className={`fixed bottom-0 left-0 right-0 z-40 md:hidden border-t transition-colors duration-200 ${theme === 'dark' ? 'bg-[#181818] border-gray-800' : 'bg-white border-gray-200'} shadow-[0_-1px_8px_rgba(0,0,0,0.06)]`}>
            <NavLinks />
          </nav>

        </div>
      </BrowserRouter>
    </AppContext.Provider>
  );
}

export default App;
