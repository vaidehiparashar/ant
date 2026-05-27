import { useState, useRef, useEffect } from 'react';
import { Search, LogOut, Loader2, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useEmployeeStore } from '../../store/employeeStore';
import { auth } from '../../services/firebase';
import { signOut } from 'firebase/auth';
import { naturalLanguageSearch } from '../../services/claudeService';
import NotificationBell from '../shared/NotificationBell';
import { AnimatePresence, motion } from 'framer-motion';

export default function Topbar() {
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const { employees, fetchEmployees } = useEmployeeStore();
  
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if ((user?.role === 'hr' || user?.role === 'admin') && employees.length === 0) {
      fetchEmployees();
    }
  }, [user, employees.length, fetchEmployees]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setIsSearching(true);
    setShowDropdown(true);
    const res = await naturalLanguageSearch(query, employees);
    setResults(res || []);
    setIsSearching(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      clearUser();
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return (
    <header className="h-16 bg-surface/50 backdrop-blur-md border-b border-border flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center w-full max-w-xl relative" ref={dropdownRef}>
        <form onSubmit={handleSearch} className="w-full relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (query) setShowDropdown(true); }}
            placeholder="Natural language HR search (e.g. 'Show me pending leaves')..." 
            className="w-full bg-background border border-border rounded-full pl-10 pr-10 py-1.5 text-sm text-text-primary focus:outline-none focus:border-primary transition-colors disabled:opacity-50"
            disabled={user?.role !== 'hr' && user?.role !== 'admin'}
          />
          {query && (
            <button 
              type="button" 
              onClick={() => { setQuery(''); setShowDropdown(false); setResults([]); }}
              className="absolute right-3 top-2.5 text-text-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <AnimatePresence>
          {showDropdown && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute top-12 left-0 w-full bg-surface border border-border shadow-2xl rounded-xl overflow-hidden z-50 max-h-96 flex flex-col"
            >
              {isSearching ? (
                <div className="p-8 flex flex-col items-center justify-center text-text-muted">
                  <Loader2 className="w-6 h-6 animate-spin mb-2 text-primary" />
                  <p className="text-sm">AI is searching employees...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="overflow-y-auto custom-scrollbar">
                  {results.map((emp, i) => (
                    <div key={emp.id || i} className="p-3 border-b border-border hover:bg-background transition-colors cursor-pointer flex items-center gap-3">
                      <img src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${emp.name}`} alt="" className="w-8 h-8 rounded-full" />
                      <div>
                        <p className="text-sm font-medium text-white">{emp.name}</p>
                        <p className="text-xs text-text-muted">{emp.designation} • {emp.department}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-text-muted text-sm">
                  No results found. Try asking differently.
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center space-x-4">
        {(user?.role === 'hr' || user?.role === 'admin') && (
          <div className="hidden md:flex items-center px-3 py-1 bg-secondary/10 text-secondary border border-secondary/20 rounded-full text-xs font-medium">
            Org Health: 92/100
          </div>
        )}
        <NotificationBell />
        <button 
          onClick={handleLogout}
          className="p-2 text-text-muted hover:text-danger transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
