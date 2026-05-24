import pLimit from 'p-limit';

const limit = pLimit(10); // Concurrency limit for CLOB API

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

export interface Token {
  token_id: string;
  outcome: string;
  price: number;
  winner?: boolean;
}

export interface Market {
  id: string;
  question: string;
  conditionId: string;
  clobTokenIds: string[];
  tokens: Token[];
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
  const marketMap = new Map<string, Market>();

  const fetchOne = async (conditionId: string, retries = 3): Promise<void> => {
    try {
      const url = `https://clob.polymarket.com/markets/${conditionId}`;
      const response = await fetch(url, { headers: { 'Accept': 'application/json' } });

      if (!response.ok) {
        if (response.status === 429 && retries > 0) {
          await new Promise(r => setTimeout(r, 1000 * (4 - retries)));
          return fetchOne(conditionId, retries - 1);
        }
        // 404 = market not found on CLOB, skip silently
        if (response.status !== 404) {
          console.error(`CLOB API error for ${conditionId}: ${response.status}`);
        }
        return;
      }

      const m = await response.json();
      if (m && m.condition_id) {
        marketMap.set(m.condition_id, {
          id: m.condition_id,
          question: m.question || '',
          conditionId: m.condition_id,
          clobTokenIds: m.tokens?.map((t: any) => t.token_id) || [],
          tokens: m.tokens?.map((t: any) => ({
            token_id: t.token_id,
            outcome: t.outcome,
            price: t.price,
            winner: t.winner
          })) || [],
          resolutionTime: m.end_date_iso || null,
          closed: !!m.closed,
          active: !!m.active,
        });
      }
    } catch (e) {
      console.error(`Failed to fetch market ${conditionId}`, e);
    }
  };

  const tasks = uniqueIds.map(id => limit(() => fetchOne(id)));
  await Promise.allSettled(tasks);

  return marketMap;
}
