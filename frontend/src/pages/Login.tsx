import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Lock, User, ArrowRight } from 'lucide-react';

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5050";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/login' : '/signup';
      // In development, assume backend runs on localhost:5050
      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        if (isLogin) {
          setUser({ username: data.username, token: data.token });
        } else {
          setIsLogin(true);
          setError('Account established. Please connect.');
        }
      } else {
        setError(data.error || 'Authentication failure');
      }
    } catch (err) {
      setError('Neural network connection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center relative">
      {/* Decorative 3D elements could go here */}
      
      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="glass-panel card-3d p-8 rounded-2xl relative group">
          {/* Animated glow background */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 blur-xl group-hover:opacity-40 transition duration-1000 animate-pulse-glow"></div>
          
          <div className="relative bg-card/40 backdrop-blur-3xl rounded-xl p-6 border border-white/5">
            <div className="flex flex-col items-center mb-8">
              <motion.div 
                className="h-20 w-20 rounded-2xl flex items-center justify-center mb-4 shadow-[0_0_40px_rgba(59,130,246,0.4)] overflow-hidden bg-black/50 border border-white/10 animate-float"
              >
                <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
              </motion.div>
              <h1 className="text-3xl font-bold text-white tracking-tight drop-shadow-md">ASCELLA</h1>
              <p className="text-sm text-blue-400/80 mt-1 uppercase tracking-widest font-medium">Neural Access Node</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider pl-1">Identifier</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="Enter operator ID"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider pl-1">Security Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg py-3 pl-10 pr-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-400 text-center bg-red-400/10 py-2 rounded-lg border border-red-400/20"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full group relative flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] overflow-hidden"
              >
                <span className="relative z-10">{loading ? 'Connecting...' : (isLogin ? 'Initialize Uplink' : 'Establish Node')}</span>
                {!loading && <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />}
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-gray-400 hover:text-white transition-colors relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-px after:bg-white/30 after:scale-x-0 hover:after:scale-x-100 after:origin-right hover:after:origin-left after:transition-transform"
              >
                {isLogin ? "No access node? Request clearance" : "Existing operator? Initiate uplink"}
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
