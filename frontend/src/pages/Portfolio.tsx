import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Briefcase, Plus, Trash2, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5050";

export default function Portfolio() {
  const { user } = useStore();
  const [portfolio, setPortfolio] = useState<any[]>([]);
  const [symbol, setSymbol] = useState('');
  const [qty, setQty] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchPortfolio = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/portfolio`, {
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      const data = await res.json();
      setPortfolio(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbol || !qty || !buyPrice || !user) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/portfolio`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ symbol, quantity: parseFloat(qty), buy_price: parseFloat(buyPrice) })
      });
      setSymbol('');
      setQty('');
      setBuyPrice('');
      fetchPortfolio();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sym: string) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/portfolio/${sym}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${user.token}` }
      });
      fetchPortfolio();
    } catch (err) {
      console.error(err);
    }
  };

  const totalInvested = portfolio.reduce((acc, p) => acc + (p.quantity * p.buy), 0);
  const currentValue = portfolio.reduce((acc, p) => acc + (p.quantity * p.current), 0);
  const pl = currentValue - totalInvested;
  const plPercent = totalInvested > 0 ? (pl / totalInvested) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Strategic Portfolio</h1>
          <p className="text-gray-400 mt-1">Monitor asset performance against AI benchmarks.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Holdings Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400 uppercase tracking-wider">Total Invested</p>
                <p className="text-2xl font-bold text-white mt-1">${totalInvested.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-sm text-gray-400 uppercase tracking-wider">Net Profit/Loss</p>
                <p className={`text-2xl font-bold mt-1 flex items-center gap-2 ${pl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {pl >= 0 ? '+' : '-'}${Math.abs(pl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm px-2 py-1 bg-black/30 rounded-md">
                    {plPercent > 0 ? '+' : ''}{plPercent.toFixed(2)}%
                  </span>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                    <th className="pb-3 pl-2">Asset</th>
                    <th className="pb-3 text-right">Qty</th>
                    <th className="pb-3 text-right">Entry</th>
                    <th className="pb-3 text-right">Current</th>
                    <th className="pb-3 text-center">AI Guidance</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {portfolio.map((p, i) => (
                    <motion.tr 
                      initial={{ opacity: 0, x: -20 }} 
                      whileInView={{ opacity: 1, x: 0 }} 
                      viewport={{ once: true, margin: "-10px" }}
                      transition={{ delay: i * 0.05, duration: 0.3 }}
                      key={p.symbol} 
                      className="border-b border-white/5 hover:bg-white/5 transition-colors group hover:scale-[1.01]"
                    >
                      <td className="py-4 pl-2 font-bold text-white">{p.symbol}</td>
                      <td className="py-4 text-right text-gray-300">{p.quantity}</td>
                      <td className="py-4 text-right text-gray-300">${p.buy.toFixed(2)}</td>
                      <td className="py-4 text-right">
                        <span className={`font-medium ${p.current >= p.buy ? 'text-green-400' : 'text-red-400'}`}>
                          ${p.current.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 text-center">
                        <span className={`text-xs px-2 py-1 rounded-md font-medium border ${
                          p.guidance === 'HOLD' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'
                        }`}>
                          {p.guidance}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-2">
                        <button onClick={() => handleDelete(p.symbol)} className="text-gray-500 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                  {portfolio.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        No assets in portfolio. Add a position to begin tracking.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-purple-400 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Log Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Symbol</label>
                <input
                  type="text"
                  required
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 uppercase"
                  placeholder="e.g. BTC"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Quantity</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">Entry Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 px-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  placeholder="0.00"
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 rounded-lg transition-colors mt-2"
              >
                <Plus className="w-4 h-4" />
                {loading ? 'Logging...' : 'Log Position'}
              </button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
