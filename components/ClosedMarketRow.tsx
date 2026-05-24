import { ExternalLink } from 'lucide-react';
import { ClosedMarketData } from '@/lib/compute';

export function ClosedMarketRow({ market }: { market: ClosedMarketData }) {
  const isYes = market.outcome.toLowerCase() === 'yes';
  const outcomeColor = isYes ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400';

  return (
    <div className="flex flex-row items-center justify-between p-4 border-b border-border bg-card/40 hover:bg-card transition-colors last:border-b-0">
      <div className="flex items-center gap-4 flex-1">
        {market.icon ? (
          <img src={market.icon} alt="" className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-border flex items-center justify-center text-gray-500 text-xs shrink-0">No Icon</div>
        )}
        <div className="flex flex-col items-start text-left flex-1 min-w-0 pr-4">
          <div className="text-sm font-medium text-foreground mb-1.5 truncate w-full">{market.title}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className={`px-2 py-0.5 rounded ${outcomeColor} font-medium`}>
              {market.outcome}
            </span>
            <span className="text-gray-500">{market.sharesTraded.toFixed(1)} shares</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-6 md:gap-10 text-right">
        <div className="flex flex-col hidden sm:flex">
          <span className="text-gray-500 text-xs font-semibold mb-1">AVG</span>
          <span className="text-sm font-medium text-foreground">
            {market.avgBuyPrice > 0 ? `${(market.avgBuyPrice * 100).toFixed(1)}¢` : '--'}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-gray-500 text-xs font-semibold mb-1">PNL</span>
          <span className={`text-sm font-medium ${market.pnl > 0 ? 'text-green-400' : market.pnl < 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {market.pnl > 0 ? '+' : ''}{market.pnl !== undefined ? `$${Math.abs(market.pnl).toFixed(2)}` : '--'}
          </span>
        </div>
        <a 
          href={`https://polygonscan.com/tx/${market.transactionHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-gray-400 hover:text-white hover:bg-border/50 rounded-lg transition-colors flex items-center justify-center shrink-0"
          title="View Transaction on Polygonscan"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
