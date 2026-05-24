import { NextResponse } from 'next/server';
import { getAddress } from 'ethers';
import { fetchUserTrades, fetchMarkets } from '@/lib/polymarket';
import { computeStats } from '@/lib/compute';

export const runtime = 'edge';

const cache = new Map<string, { data: any, ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const addressParam = searchParams.get('address');

  if (!addressParam) {
    return NextResponse.json({ error: 'Missing address parameter' }, { status: 400 });
  }

  let address: string;
  try {
    address = getAddress(addressParam);
  } catch (e) {
    return NextResponse.json({ error: 'Invalid Ethereum address' }, { status: 400 });
  }

  const cached = cache.get(address);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }

  try {
    const trades = await fetchUserTrades(address);
    if (!trades || trades.length === 0) {
      const emptyResult = {
        betsPlaced: 0,
        volumeUSDC: 0,
        activeDays: 0,
        longestStreak: 0,
        longestResolvedBetDays: 0,
        marketsClosed: 0
      };
      cache.set(address, { data: emptyResult, ts: Date.now() });
      return NextResponse.json(emptyResult);
    }

    const conditionIds = trades.map(t => t.conditionId).filter(Boolean);
    const marketMap = await fetchMarkets(conditionIds);

    const stats = computeStats(trades, marketMap);

    cache.set(address, { data: stats, ts: Date.now() });
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to compute airdrop stats' }, { status: 500 });
  }
}
