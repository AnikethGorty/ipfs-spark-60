import { Card } from '@/components/ui/card';
import { Block } from '@/types/network';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Box, Clock, Hash, ArrowRight } from 'lucide-react';

interface BlockchainPanelProps {
  blocks: Block[];
}

export const BlockchainPanel = ({ blocks }: BlockchainPanelProps) => {
  return (
    <Card className="p-4 bg-card border-border h-full">
      <div className="flex items-center gap-2 mb-4">
        <Box className="h-5 w-5 text-accent" />
        <h3 className="text-lg font-bold text-foreground">Blockchain Ledger</h3>
        <span className="ml-auto text-sm text-muted-foreground">
          {blocks.length} blocks
        </span>
      </div>

      <ScrollArea className="h-[calc(100%-3rem)]">
        {blocks.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No blocks yet. Start a file transfer to see blockchain activity.
          </div>
        ) : (
          <div className="space-y-2">
            {[...blocks].reverse().map((block, idx) => (
              <div
                key={block.blockNumber}
                className="p-3 bg-muted rounded-lg border border-blockchain-chain hover:border-blockchain-block transition-colors group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blockchain-block flex items-center justify-center text-xs font-bold glow-accent">
                      {block.blockNumber}
                    </div>
                    <div className="text-xs">
                      <div className="font-semibold text-foreground">
                        Chunk #{block.chunkId}
                      </div>
                      <div className="text-muted-foreground">{block.fileName}</div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(block.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs mb-2">
                  <span className="px-2 py-1 bg-background rounded text-primary font-mono">
                    {block.from}
                  </span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                  <span className="px-2 py-1 bg-background rounded text-secondary font-mono">
                    {block.to}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {block.transferTime.toFixed(0)}ms
                  </span>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Hash className="h-3 w-3" />
                  <span className="font-mono truncate">{block.hash}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
};
