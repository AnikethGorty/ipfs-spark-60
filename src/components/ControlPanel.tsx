import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { NetworkNode, NetworkConnection } from '@/types/network';
import { Plus, Trash2, Radio, Cable } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ControlPanelProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  onAddNode: (node: NetworkNode) => void;
  onRemoveNode: (id: string) => void;
  onRemoveConnection: (id: string) => void;
  onUpdateConnection: (connection: NetworkConnection) => void;
  selectedNode: string | null;
  selectedConnection: string | null;
}

export const ControlPanel = ({
  nodes,
  connections,
  onAddNode,
  onRemoveNode,
  onRemoveConnection,
  onUpdateConnection,
  selectedNode,
  selectedConnection,
}: ControlPanelProps) => {
  const [nodeName, setNodeName] = useState('');

  const handleAddNode = () => {
    if (!nodeName.trim()) return;

    const newNode: NetworkNode = {
      id: `node-${Date.now()}`,
      label: nodeName,
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      status: 'online',
    };

    onAddNode(newNode);
    setNodeName('');
  };

  const selectedConnectionObj = connections.find(c => c.id === selectedConnection);

  return (
    <Card className="p-4 space-y-6 bg-card border-border">
      <div>
        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
          <Radio className="h-5 w-5 text-primary" />
          Network Topology
        </h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="nodeName">Add Node</Label>
            <div className="flex gap-2 mt-1">
              <Input
                id="nodeName"
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                placeholder="Node name"
                onKeyDown={(e) => e.key === 'Enter' && handleAddNode()}
                className="bg-input border-border"
              />
              <Button onClick={handleAddNode} size="icon" className="glow-primary">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {selectedNode && (
            <div className="p-3 bg-muted rounded-lg border border-border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  {nodes.find(n => n.id === selectedNode)?.label}
                </span>
                <Button
                  onClick={() => onRemoveNode(selectedNode)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {selectedConnectionObj && (
            <div className="p-3 bg-muted rounded-lg border border-border space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-foreground flex items-center gap-2">
                  {selectedConnectionObj.type === 'wired' ? (
                    <Cable className="h-4 w-4 text-connection-wired" />
                  ) : (
                    <Radio className="h-4 w-4 text-connection-wireless" />
                  )}
                  Connection
                </span>
                <Button
                  onClick={() => onRemoveConnection(selectedConnection!)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    type="text"
                    value={selectedConnectionObj.name}
                    onChange={(e) =>
                      onUpdateConnection({
                        ...selectedConnectionObj,
                        name: e.target.value,
                      })
                    }
                    className="h-8 text-xs"
                    placeholder="Connection name"
                  />
                </div>

                <div>
                  <Label className="text-xs">Type</Label>
                  <Select
                    value={selectedConnectionObj.type}
                    onValueChange={(value: 'wired' | 'wireless') =>
                      onUpdateConnection({ ...selectedConnectionObj, type: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wired">Wired</SelectItem>
                      <SelectItem value="wireless">Wireless</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Bandwidth (Mbps)</Label>
                  <Input
                    type="number"
                    value={selectedConnectionObj.bandwidth}
                    onChange={(e) =>
                      onUpdateConnection({
                        ...selectedConnectionObj,
                        bandwidth: Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Latency (ms)</Label>
                  <Input
                    type="number"
                    value={selectedConnectionObj.latency}
                    onChange={(e) =>
                      onUpdateConnection({
                        ...selectedConnectionObj,
                        latency: Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Packet Loss (0-1)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={selectedConnectionObj.packetLoss}
                    onChange={(e) =>
                      onUpdateConnection({
                        ...selectedConnectionObj,
                        packetLoss: Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <Label className="text-xs">Distance (m)</Label>
                  <Input
                    type="number"
                    value={selectedConnectionObj.distance}
                    onChange={(e) =>
                      onUpdateConnection({
                        ...selectedConnectionObj,
                        distance: Number(e.target.value),
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Click nodes to select</p>
          <p>• Drag nodes to reposition</p>
          <p>• Click connections to edit</p>
          <p>• Drag from node to node to connect</p>
        </div>
      </div>
    </Card>
  );
};
