import { Trade, Market } from './polymarket';

export interface ClosedMarketData {
  conditionId: string;
  icon?: string;
  title: string;
  outcome: string;
  sharesTraded: number;
  avgBuyPrice: number;
  transactionHash: string;
  pnl: number;
}

export interface LongestHeldBetData {
  title: string;
  marketUrl: string;
  transactionHash: string;
  days: number;
}

export interface ComputeResult {
  betsPlaced: number;
  volumeUSDC: number;
  activeDays: number;
  longestStreak: number;
  longestHeldBetsList: LongestHeldBetData[];
  marketsClosed: number;
  latestTxnHash?: string;
  closedMarketsList: ClosedMarketData[];
}

export function computeStats(trades: Trade[], marketMap: Map<string, Market>): ComputeResult {
  const betsPlaced = trades.length;
  
  let volumeUSDC = 0;
  const activeDaysSet = new Set<string>();
  let latestTxnHash: string | undefined = undefined;
  let latestTimestamp = 0;

  trades.forEach(t => {
    volumeUSDC += (t.size * t.price);
    const date = new Date(t.timestamp * 1000).toISOString().split('T')[0];
    activeDaysSet.add(date);

    if (t.timestamp > latestTimestamp) {
      latestTimestamp = t.timestamp;
      latestTxnHash = t.transactionHash;
    }
  });

  const activeDays = activeDaysSet.size;

  // Longest streak
  const sortedDates = Array.from(activeDaysSet).sort();
  let longestStreak = 0;
  let currentStreak = 0;
  let prevDate: Date | null = null;

  for (const dateStr of sortedDates) {
    const d = new Date(dateStr);
    if (!prevDate) {
      currentStreak = 1;
    } else {
      const diffTime = Math.abs(d.getTime() - prevDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      if (diffDays === 1) {
        currentStreak++;
      } else {
        currentStreak = 1;
      }
    }
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }
    prevDate = d;
  }
  if (currentStreak > longestStreak) longestStreak = currentStreak;

  // Position Tracking for Longest Held Bet
  const sortedTrades = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  const positionTracker: Record<string, { firstTimestamp: number, currentSize: number, title: string, marketUrl: string, hash: string }> = {};
  const assetToCondition = new Map<string, string>();

  const allHeldBets: LongestHeldBetData[] = [];

  for (const t of sortedTrades) {
    assetToCondition.set(t.asset, t.conditionId);

    if (!positionTracker[t.asset]) {
      positionTracker[t.asset] = { 
        firstTimestamp: t.timestamp, 
        currentSize: 0, 
        title: t.title, 
        marketUrl: `https://polymarket.com/event/${t.eventSlug || t.conditionId}`,
        hash: t.transactionHash
      };
    }

    if (t.side === 'BUY') {
      if (positionTracker[t.asset].currentSize <= 0.001) {
        positionTracker[t.asset].firstTimestamp = t.timestamp; // Start of new hold period
      }
      positionTracker[t.asset].currentSize += t.size;
    } else if (t.side === 'SELL') {
      positionTracker[t.asset].currentSize -= t.size;
      if (positionTracker[t.asset].currentSize <= 0.001) {
        // Closed position
        const durationDays = (t.timestamp - positionTracker[t.asset].firstTimestamp) / (60 * 60 * 24);
        if (durationDays > 0) {
          allHeldBets.push({
            marketUrl: positionTracker[t.asset].marketUrl,
            transactionHash: t.transactionHash,
            days: parseFloat(durationDays.toFixed(1)),
            title: positionTracker[t.asset].title
          });
        }
        positionTracker[t.asset].currentSize = 0;
      }
    }
  }

  // Check open positions against market resolution
  for (const [asset, pos] of Object.entries(positionTracker)) {
    if (pos.currentSize > 0.001) {
      const conditionId = assetToCondition.get(asset);
      if (conditionId) {
        const market = marketMap.get(conditionId);
        if (market && market.closed && market.resolutionTime) {
          const resTime = new Date(market.resolutionTime).getTime() / 1000;
          const durationDays = (resTime - pos.firstTimestamp) / (60 * 60 * 24);
          if (durationDays > 0) {
            allHeldBets.push({
              marketUrl: pos.marketUrl,
              transactionHash: pos.hash,
              days: parseFloat(durationDays.toFixed(1)),
              title: pos.title
            });
          }
        }
      }
    }
  }

  // Deduplicate by title to keep the longest duration per market
  const uniqueHeldBetsMap = new Map<string, LongestHeldBetData>();
  for (const bet of allHeldBets) {
    const existing = uniqueHeldBetsMap.get(bet.title);
    if (!existing || bet.days > existing.days) {
      uniqueHeldBetsMap.set(bet.title, bet);
    }
  }
  const longestHeldBetsList = Array.from(uniqueHeldBetsMap.values()).sort((a, b) => b.days - a.days);

  // Closed Markets List
  const closedMarketsMap = new Map<string, { 
    data: ClosedMarketData, 
    totalUSDC: number, 
    buyShares: number,
    netUSDC: number,
    assetPositions: Record<string, number>
  }>();

  for (const t of trades) {
    const market = marketMap.get(t.conditionId);
    if (market && market.closed) {
      const existing = closedMarketsMap.get(t.conditionId) || {
        data: {
          conditionId: t.conditionId,
          icon: t.icon,
          title: t.title,
          outcome: t.outcome || 'Unknown',
          sharesTraded: 0,
          avgBuyPrice: 0,
          transactionHash: t.transactionHash,
          pnl: 0
        },
        totalUSDC: 0,
        buyShares: 0,
        netUSDC: 0,
        assetPositions: {}
      };
      
      existing.data.sharesTraded += t.size;
      
      if (!existing.assetPositions[t.asset]) {
        existing.assetPositions[t.asset] = 0;
      }
      
      if (t.side === 'BUY') {
        existing.totalUSDC += (t.size * t.price);
        existing.buyShares += t.size;
        existing.netUSDC += (t.size * t.price);
        existing.assetPositions[t.asset] += t.size;
      } else if (t.side === 'SELL') {
        existing.netUSDC -= (t.size * t.price);
        // Sometimes floating point math causes minor negatives, keep it clean
        existing.assetPositions[t.asset] = Math.max(0, existing.assetPositions[t.asset] - t.size);
      }
      
      if (t.outcome) existing.data.outcome = t.outcome;
      if (t.icon) existing.data.icon = t.icon;
      
      closedMarketsMap.set(t.conditionId, existing);
    }
  }

  const closedMarketsList = Array.from(closedMarketsMap.values()).map(m => {
    let winningPayout = 0;
    const market = marketMap.get(m.data.conditionId);
    if (market && market.tokens) {
      for (const token of market.tokens) {
        if (token.winner && m.assetPositions[token.token_id]) {
          winningPayout += m.assetPositions[token.token_id] * 1.0;
        }
      }
    }
    
    const pnl = winningPayout - m.netUSDC;

    return {
      ...m.data,
      avgBuyPrice: m.buyShares > 0 ? (m.totalUSDC / m.buyShares) : 0,
      pnl: parseFloat(pnl.toFixed(2))
    };
  });

  return {
    betsPlaced,
    volumeUSDC: parseFloat(volumeUSDC.toFixed(2)),
    activeDays,
    longestStreak,
    longestHeldBetsList,
    marketsClosed: closedMarketsList.length,
    latestTxnHash,
    closedMarketsList
  };
}
