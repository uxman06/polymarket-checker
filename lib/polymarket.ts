import pLimit from 'p-limit';

const limit = pLimit(5); // Concurrency limit for Gamma API

export interface Trade {
  transactionHash: string;
  timestamp: number;
  size: number;
  price: number;
  conditionId: string;
  asset: string;
  side: string;
  title: string;
  eventSlug: string;
  icon?: string;
  outcome?: string;
}

export interface Market {
  id: string;
  question: string;
  conditionId: string;
  clobTokenIds: string[];
  resolvedBy?: string;
  resolutionTime?: string | null;
  closed: boolean;
  active: boolean;
}

export async function fetchUserTrades(address: string): Promise<Trade[]> {
  let allTrades: Trade[] = [];
  let offset = 0;
  const limitCount = 500;
  let hasMore = true;

  while (hasMore) {
    const url = `https://data-api.polymarket.com/trades?user=${address}&limit=${limitCount}&offset=${offset}`;
    try {
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) {
        if (response.status === 429) {
          await new Promise(r => setTimeout(r, 2000));
          continue; // Retry on rate limit
        }
        console.error(`Data API error: ${response.status}`);
        break;
      }
      
      const data: Trade[] = await response.json();
      if (data && Array.isArray(data)) {
        allTrades = allTrades.concat(data);
        if (data.length < limitCount) {
          hasMore = false; // We reached the end
        } else {
          offset += limitCount;
        }
      } else {
        hasMore = false;
      }
    } catch (e) {
      console.error('Failed to fetch trades', e);
      hasMore = false;
    }
  }

  return allTrades;
}

export async function fetchMarkets(conditionIds: string[]): Promise<Map<string, Market>> {
  const uniqueIds = Array.from(new Set(conditionIds));
  const batchSize = 20;
  const batches = [];
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    batches.push(uniqueIds.slice(i, i + batchSize));
  }

  const marketMap = new Map<string, Market>();

  const fetchBatch = async (batch: string[], retries = 3): Promise<void> => {
    try {
      // Gamma API handles condition_ids
      const params = batch.map(id => `condition_ids=${id}`).join('&');
      const url = `https://gamma-api.polymarket.com/markets?${params}`;
      
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          await new Promise(r => setTimeout(r, 1000 * (4 - retries)));
          return fetchBatch(batch, retries - 1);
        }
        console.error(`Gamma API error: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      if (Array.isArray(data)) {
        for (const m of data) {
          if (m && m.conditionId) {
            marketMap.set(m.conditionId, m);
          }
        }
      }
    } catch (e) {
      console.error("Failed to fetch market batch", e);
    }
  };

  const tasks = batches.map(batch => limit(() => fetchBatch(batch)));
  await Promise.allSettled(tasks);

  return marketMap;
}
