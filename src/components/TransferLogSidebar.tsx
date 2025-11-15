import * as React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Clock, ArrowRight, ChevronDown } from 'lucide-react';
import { Block } from '@/types/network';
import { Button } from '@/components/ui/button';

interface TransferLogSidebarProps {
  blocks: Block[];
}

export const TransferLogSidebar = ({ blocks }: TransferLogSidebarProps) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-40">
      <Card className="bg-card border-border shadow-lg w-80">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">Transfer Log</h3>
            <span className="text-xs text-muted-foreground">({blocks.length})</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-6 w-6 p-0"
          >
            <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
          </Button>
        </div>

        {isOpen && (
          <ScrollArea className="h-96 w-full">
            <div className="p-3">
              {blocks.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">No transfers yet.</div>
              ) : (
                <div className="space-y-2">
                  {[...blocks].reverse().slice(0, 20).map((block) => (
                    <div key={block.blockNumber} className="p-2 bg-muted rounded border border-border/50 text-xs">
                      <div className="font-medium text-foreground mb-1">Chunk #{block.chunkId}</div>
                      <div className="text-muted-foreground text-[10px] mb-2 truncate">{block.fileName}</div>
                      <div className="flex items-center gap-1 mb-1 text-[9px]">
                        <span className="px-1.5 py-0.5 bg-background rounded font-mono">{block.from}</span>
                        <ArrowRight className="h-2.5 w-2.5 flex-shrink-0" />
                        <span className="px-1.5 py-0.5 bg-background rounded font-mono">{block.to}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                        <Clock className="h-2.5 w-2.5 flex-shrink-0" />
                        {new Date(block.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </Card>
    </div>
  );
};

export default TransferLogSidebar;
