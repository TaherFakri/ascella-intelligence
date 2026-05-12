import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import Portfolio from './pages/Portfolio';
import Login from './pages/Login';
import { useStore } from './store/useStore';
import { ArrowUpRight } from 'lucide-react';

const TradingBackground = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    {/* Subtle Grid */}
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
    
    {/* Rising Trend Lines */}
    {[...Array(8)].map((_, i) => (
      <div 
        key={i} 
        className="absolute bottom-0 w-[2px] h-64 bg-gradient-to-t from-transparent via-green-500/40 to-transparent animate-rise flex justify-center"
        style={{ 
          left: `${10 + i * 12}%`, 
          animationDelay: `${i * 1.8}s`,
          animationDuration: `${12 + (i % 3) * 4}s`
        }}
      >
        <ArrowUpRight className="text-green-400/50 w-6 h-6 absolute -top-4" />
      </div>
    ))}
  </div>
);

function App() {
  const user = useStore((state) => state.user);

  return (
    <Router>
      <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#0a0f1a]">
        <TradingBackground />
        
        {user && <Navbar />}
        
        <main className="flex-1 relative z-10 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
            <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
            <Route path="/portfolio" element={user ? <Portfolio /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
