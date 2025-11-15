import * as React from 'react';
import { SidebarProvider, Sidebar, SidebarTrigger, SidebarContent, SidebarHeader, SidebarGroup, SidebarGroupLabel, SidebarGroupContent } from '@/components/ui/sidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Clock, ArrowRight, Hash } from 'lucide-react';
import { Block } from '@/types/network';

interface TransferLogSidebarProps {
  blocks: Block[];
}

export const TransferLogSidebar = ({ blocks }: TransferLogSidebarProps) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div>
        {/* Trigger is positioned inside the provider so it can toggle the sidebar */}
        <div className="absolute right-4 top-6 z-50">
          <SidebarTrigger />
        </div>

        <Sidebar side="right" variant="sidebar" collapsible="icon">
          <SidebarContent>
            <SidebarHeader>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">Transfer Log</h3>
                <span className="ml-auto text-xs text-muted-foreground">{blocks.length}</span>
              </div>
            </SidebarHeader>

            <SidebarGroup>
              <SidebarGroupLabel>Chunks</SidebarGroupLabel>
              <SidebarGroupContent>
                <Card className="p-2 bg-card border-border">
                  <ScrollArea className="h-[calc(100vh-8rem)]">
                    {blocks.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-4">No transfers yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {[...blocks].reverse().map((block) => (
                          <div key={block.blockNumber} className="p-2 bg-muted rounded-md border border-border">
                            <div className="flex items-center justify-between">
                              <div className="text-xs">
                                <div className="font-medium">Chunk #{block.chunkId} — {block.fileName}</div>
                                <div className="text-muted-foreground text-[11px] flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-background rounded font-mono">{block.from}</span>
                                  <ArrowRight className="h-3 w-3" />
                                  <span className="px-2 py-0.5 bg-background rounded font-mono">{block.to}</span>
                                </div>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(block.timestamp).toLocaleTimeString()}
                              </div>
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                              <Hash className="h-3 w-3" />
                              <span className="font-mono truncate">{block.hash}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </Card>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>
      </div>
    </SidebarProvider>
  );
};

export default TransferLogSidebar;
