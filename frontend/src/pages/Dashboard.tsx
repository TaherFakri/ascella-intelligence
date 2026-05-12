import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.PROD ? "" : "http://localhost:5050";
import { Search, TrendingUp, AlertTriangle, Activity, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [symbol, setSymbol] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [view, setView] = useState<'short' | 'long'>('short');
  const [overview, setOverview] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/market-overview`)
      .then(res => res.json())
      .then(d => setOverview(d))
      .catch(console.error);
  }, []);

  const fetchAnalysis = async (sym: string) => {
    if (!sym) return;
    setSymbol(sym);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: sym })
      });
      const result = await res.json();
      if (!result.error) {
        setData(result);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    fetchAnalysis(symbol);
  };

  const renderChart = () => {
    if (!data) return null;
    const currentView = data[view];
    const chartData = currentView.dates.map((date: string, i: number) => ({
      date: date.split('-').slice(1).join('/'),
      price: currentView.history[i],
    }));

    // Add prediction points
    const lastDateObj = new Date(currentView.dates[currentView.dates.length - 1]);
    currentView.prediction.forEach((pred: number, i: number) => {
      const nextDate = new Date(lastDateObj);
      nextDate.setDate(nextDate.getDate() + i + 1);
      chartData.push({
        date: `${(nextDate.getMonth()+1).toString().padStart(2, '0')}/${nextDate.getDate().toString().padStart(2, '0')}`,
        price: null,
        prediction: pred
      });
    });

    return (
      <ResponsiveContainer width="100%" height={350}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
          <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(val) => `$${val}`} />
          <Tooltip 
            contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
            itemStyle={{ color: '#fff' }}
          />
          <Area type="monotone" dataKey="price" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPrice)" activeDot={{ r: 6 }} />
          <Area type="monotone" dataKey="prediction" stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorPred)" />
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Market Intelligence</h1>
          <p className="text-gray-400 mt-1">Neural forecasting and algorithmic insights.</p>
        </div>
        
        <form onSubmit={handleAnalyze} className="w-full md:w-auto relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
          <div className="relative flex items-center">
            <Search className="absolute left-3 text-gray-400 h-5 w-5" />
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder="Query Symbol (e.g. NVDA)"
              className="w-full md:w-80 bg-black/50 border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button type="submit" className="absolute right-2 text-blue-400 hover:text-blue-300 font-medium text-sm">
              {loading ? 'Scanning...' : 'Analyze'}
            </button>
          </div>
        </form>
      </div>

      {data && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 300, damping: 25 }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="col-span-1 md:col-span-2">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-blue-400" />
                  {data.symbol} Forecast
                </CardTitle>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                  <button onClick={() => setView('short')} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${view === 'short' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>Short Term</button>
                  <button onClick={() => setView('long')} className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${view === 'long' ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}>Long Term</button>
                </div>
              </CardHeader>
              <CardContent>
                {renderChart()}
              </CardContent>
            </Card>

            <Card className="col-span-1 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-purple-400 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase">Confidence Score</p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500" style={{ width: `${data.insights.confidence}%` }}></div>
                    </div>
                    <span className="text-sm font-bold text-white">{data.insights.confidence}%</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Sentiment</p>
                    <p className="text-sm font-medium text-white mt-1 flex items-center gap-1">
                      {data.insights.sentiment.includes('Bullish') ? <TrendingUp className="h-4 w-4 text-green-400" /> : <AlertTriangle className="h-4 w-4 text-red-400" />}
                      {data.insights.sentiment}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Volatility</p>
                    <p className="text-sm font-medium text-white mt-1">{data.insights.volatility}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">RSI (14)</p>
                    <p className="text-sm font-medium text-white mt-1">{data.insights.rsi}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-400">Short-Term Opportunities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.filter(o => o.cat === 'Short-Term').map((stock, i) => (
                  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer hover:scale-[1.02]" onClick={() => fetchAnalysis(stock.symbol)}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                        <span className="text-xs font-bold text-blue-300">{stock.symbol}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">${stock.price}</p>
                        <p className={`text-xs ${stock.status.includes('Bullish') ? 'text-green-400' : stock.status.includes('Bearish') ? 'text-red-400' : 'text-yellow-400'}`}>{stock.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">AI Target</p>
                      <p className="text-sm font-bold text-purple-400">${stock.pred}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, delay: 0.2 }}>
          <Card>
            <CardHeader>
              <CardTitle className="text-purple-400">Long-Term Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {overview.filter(o => o.cat === 'Long-Term').map((stock, i) => (
                   <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }} key={stock.symbol} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer hover:scale-[1.02]" onClick={() => fetchAnalysis(stock.symbol)}>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <span className="text-xs font-bold text-purple-300">{stock.symbol}</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">${stock.price}</p>
                        <p className={`text-xs ${stock.status.includes('Bullish') ? 'text-green-400' : stock.status.includes('Bearish') ? 'text-red-400' : 'text-yellow-400'}`}>{stock.status}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">AI Target</p>
                      <p className="text-sm font-bold text-blue-400">${stock.pred}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
