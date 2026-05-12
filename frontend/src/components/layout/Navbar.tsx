import { Link, useLocation } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Activity, Briefcase, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { logout } = useStore();
  const location = useLocation();

  const navItems = [
    { name: 'Market Intel', path: '/', icon: Activity },
    { name: 'Portfolio', path: '/portfolio', icon: Briefcase },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 backdrop-blur-md border border-white/10 shadow-[0_0_15px_rgba(59,130,246,0.3)] overflow-hidden hover:scale-105 transition-transform cursor-pointer">
              <img src="/logo.png" alt="Ascella Logo" className="h-full w-full object-cover" />
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">ASCELLA</span>
              <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400 border border-blue-500/20 tracking-wider">
                AI
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "relative px-4 py-1.5 text-sm font-medium rounded-md transition-colors",
                      isActive ? "text-white" : "text-gray-400 hover:text-white"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-pill"
                        className="absolute inset-0 bg-white/10 rounded-md"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      <item.icon className="w-4 h-4" />
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </div>

            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Disconnect</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
