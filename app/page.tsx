'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatCard } from '@/components/StatCard';
import { ClosedMarketRow } from '@/components/ClosedMarketRow';

import { Search, Activity, DollarSign, CalendarDays, Flame, Trophy, ExternalLink, ArrowRight } from 'lucide-react';

export default function Home() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [closedPage, setClosedPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  
  const [stats, setStats] = useState<any>({
    betsPlaced: 0,
    volumeUSDC: 0,
    activeDays: 0,
    longestStreak: 0,
    longestHeldBetsList: [],
    marketsClosed: 0,
    closedMarketsList: []
  });

  const fetchStats = async () => {
    if (!address) return;
    setLoading(true);
    setError('');
    setCurrentPage(1);
    setClosedPage(1);
    
    try {
      const res = await fetch(`/api/check?address=${encodeURIComponent(address)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch stats');
      }
      
      setStats(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchStats();
    }
  };

  return (
    <main className="min-h-screen bg-[#15191D] text-foreground flex flex-col items-center pt-16 px-4 pb-24 relative overflow-hidden">

      <div className="relative z-10 w-full flex flex-col items-center max-w-4xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full flex flex-col items-center text-center mb-12"
      >
        <div className="flex flex-col items-center gap-4 mb-6">
          <svg className="w-16 h-16 drop-shadow-[0_0_15px_rgba(0,122,255,0.3)]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 30L78 18V82L22 70V30Z" stroke="white" strokeWidth="7" strokeLinejoin="round"/>
            <path d="M22 37L68 50L22 63" stroke="white" strokeWidth="7" strokeLinejoin="round"/>
          </svg>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mt-2">
            Polymarket <span>Tracker</span>
          </h1>
        </div>
        <p className="text-gray-400 max-w-lg mb-10 text-lg">
          Analyze any trader's historical performance, total volume, and longest streaks on the world's largest prediction market.
        </p>

        <div className="w-full max-w-xl relative group">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-500 group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            className="w-full bg-card border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-2xl py-4 pl-14 pr-32 text-foreground placeholder-gray-500 outline-none transition-all shadow-sm"
            placeholder="Enter a Polygon wallet address (0x...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={fetchStats}
            disabled={loading || !address}
            className="absolute inset-y-2 right-2 bg-primary hover:bg-primary-hover disabled:opacity-50 disabled:hover:bg-primary text-white px-6 rounded-xl font-medium transition-all flex items-center"
          >
            {loading ? 'Checking...' : 'Check'}
          </button>
        </div>
        
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-red-400 text-sm bg-red-400/10 py-2 px-4 rounded-lg">
            {error}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence mode="wait">
        {stats && !loading && (
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-4xl"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-12 w-full">
              <StatCard 
                title="Total Bets Placed" 
                value={stats.betsPlaced.toLocaleString()} 
                icon={<Activity className="w-5 h-5" />} 
                delay={0.1} 
              />
              <StatCard 
                title="Total Volume" 
                value={`$${stats.volumeUSDC.toLocaleString()}`} 
                icon={<DollarSign className="w-5 h-5" />} 
                delay={0.2} 
              />
              <StatCard 
                title="Active Days" 
                value={stats.activeDays.toString()} 
                icon={<CalendarDays className="w-5 h-5" />} 
                delay={0.3} 
              />
              <StatCard 
                title="Longest Streak" 
                value={`${stats.longestStreak} days`} 
                icon={<Flame className="w-5 h-5" />} 
                delay={0.4} 
              />
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="w-full mb-8"
            >
              <h3 className="text-left text-xl font-bold text-white mb-4 px-2">Longest Held Bets</h3>
              <div className="border border-border rounded-2xl bg-card/20 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 text-[10px] sm:text-xs font-semibold text-gray-400 tracking-wider">
                  <div className="flex-1 text-left">MARKET</div>
                  <div className="w-24 text-right pr-4">DURATION</div>
                  <div className="w-8 text-center">TXN</div>
                </div>
                <div className="flex flex-col">
                  {stats.longestHeldBetsList && stats.longestHeldBetsList.length > 0 ? (
                    <>
                      {stats.longestHeldBetsList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE).map((bet: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between p-4 border-b border-border bg-card/40 hover:bg-card transition-colors last:border-b-0">
                          <div className="flex items-center gap-4 flex-1 pr-4 min-w-0">
                            <Trophy className="w-5 h-5 text-primary shrink-0" />
                            <div className="text-sm font-medium text-foreground truncate w-full">{bet.title}</div>
                          </div>
                          <div className="w-24 text-right pr-4 shrink-0">
                            <span className="text-sm font-semibold text-foreground">{bet.days}</span> <span className="text-xs text-gray-500">days</span>
                          </div>
                          <a 
                            href={`https://polygonscan.com/tx/${bet.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-white hover:bg-border/50 rounded-lg transition-colors flex items-center justify-center shrink-0"
                            title="View Transaction"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ))}
                      {Math.ceil(stats.longestHeldBetsList.length / ITEMS_PER_PAGE) > 1 && (
                        <div className="flex items-center justify-center gap-2 p-4 bg-card/20 border-t border-border">
                          {Array.from({ length: Math.ceil(stats.longestHeldBetsList.length / ITEMS_PER_PAGE) }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setCurrentPage(i + 1)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? 'bg-primary text-white border border-primary' : 'bg-card hover:bg-card/80 text-gray-400 hover:text-white border border-border'}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">0 bets held</div>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.6 }}
              className="w-full mb-12"
            >
              <h3 className="text-left text-xl font-bold text-white mb-4 px-2">Resolved Markets</h3>
              <div className="border border-border rounded-2xl bg-card/20 overflow-hidden shadow-lg">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/60 text-[10px] sm:text-xs font-semibold text-gray-400 tracking-wider">
                  <div className="flex-1 text-left">MARKET</div>
                  <div className="flex items-center gap-6 md:gap-10 text-right pr-2">
                    <div className="hidden sm:block w-12 text-right">AVG</div>
                    <div className="w-12 text-right">PNL</div>
                    <div className="w-8 text-center">TXN</div>
                  </div>
                </div>
                <div className="flex flex-col">
                  {stats.closedMarketsList && stats.closedMarketsList.length > 0 ? (
                    <>
                      {stats.closedMarketsList.slice((closedPage - 1) * ITEMS_PER_PAGE, closedPage * ITEMS_PER_PAGE).map((market: any, idx: number) => (
                        <ClosedMarketRow key={market.conditionId || idx} market={market} />
                      ))}
                      {Math.ceil(stats.closedMarketsList.length / ITEMS_PER_PAGE) > 1 && (
                        <div className="flex items-center justify-center gap-2 p-4 bg-card/20 border-t border-border">
                          {Array.from({ length: Math.ceil(stats.closedMarketsList.length / ITEMS_PER_PAGE) }).map((_, i) => (
                            <button
                              key={i}
                              onClick={() => setClosedPage(i + 1)}
                              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${closedPage === i + 1 ? 'bg-primary text-white border border-primary' : 'bg-card hover:bg-card/80 text-gray-400 hover:text-white border border-border'}`}
                            >
                              {i + 1}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-gray-500 text-sm">0 markets resolved</div>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="flex justify-center">
              <button
                onClick={() => {
                  setAddress('');
                  setCurrentPage(1);
                  setClosedPage(1);
                  setStats({
                    betsPlaced: 0,
                    volumeUSDC: 0,
                    activeDays: 0,
                    longestStreak: 0,
                    longestHeldBetsList: [],
                    marketsClosed: 0,
                    closedMarketsList: []
                  });
                }}
                className="group flex items-center gap-2 px-6 py-3 bg-card/50 hover:bg-card border border-border rounded-xl text-sm font-medium text-gray-300 transition-all hover:text-white"
              >
                Check another address
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        )}
        
        {loading && (
          <motion.div 
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6"
          >
            {[1,2,3,4].map((i) => (
              <div key={i} className="bg-card/20 border border-border rounded-2xl p-5 h-36 flex flex-col justify-between animate-pulse shadow-lg">
                <div className="flex justify-between items-start">
                  <div className="w-24 h-4 bg-border/50 rounded"></div>
                  <div className="w-8 h-8 bg-border/50 rounded-lg"></div>
                </div>
                <div className="w-16 h-8 bg-border/50 rounded mb-1"></div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </main>
  );
}
