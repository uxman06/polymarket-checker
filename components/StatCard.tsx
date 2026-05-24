import { ReactNode } from 'react';
import { ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface StatCardProps {
  title: string;
  value: string | ReactNode;
  icon: ReactNode;
  delay?: number;
  verifyLink?: string;
}

export function StatCard({ title, value, icon, delay = 0, verifyLink }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-card border border-border rounded-2xl p-5 flex flex-col justify-between hover:border-primary/50 transition-colors relative group shadow-sm shadow-black/10"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="text-gray-400 font-medium text-sm">{title}</div>
        <div className="text-primary bg-primary/10 p-2 rounded-lg">{icon}</div>
      </div>
      <div className="text-3xl font-bold text-foreground tracking-tight mb-1">
        {value}
      </div>
      
      {verifyLink ? (
        <a 
          href={verifyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center text-xs text-primary hover:text-primary-hover font-medium w-fit opacity-80 group-hover:opacity-100 transition-opacity"
        >
          Verify <ExternalLink className="w-3 h-3 ml-1" />
        </a>
      ) : (
        <div className="mt-2 text-xs text-transparent select-none">Spacer</div>
      )}
    </motion.div>
  );
}
