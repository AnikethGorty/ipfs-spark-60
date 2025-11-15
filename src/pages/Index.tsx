import { useState, useCallback } from 'react';
import { NetworkGraph } from '@/components/NetworkGraph';
import { ControlPanel } from '@/components/ControlPanel';
import { FileTransferPanel } from '@/components/FileTransferPanel';
import { BlockchainPanel } from '@/components/BlockchainPanel';
import { NodeDetailsPanel } from '@/components/NodeDetailsPanel';
import { NetworkNode, NetworkConnection, Block, FileChunk } from '@/types/network';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { chunkFile, calculateTransferTime, findShortestPath, createBlock } from '@/utils/simulation';
import { toast } from 'sonner';
import { Activity, Circle } from 'lucide-react';

const Index = () => {
  const [mode, setMode] = useState<'simulation' | 'real'>('simulation');

  const [nodes, setNodes] = useState<NetworkNode[]>([
    { id: 'node-1', label: 'Node A', position: { x: 100, y: 100 }, status: 'online' },
    { id: 'node-2', label: 'Node B', position: { x: 400, y: 100 }, status: 'online' },
    { id: 'node-3', label: 'Node C', position: { x: 250, y: 300 }, status: 'online' },
  ]);

  const [connections, setConnections] = useState<NetworkConnection[]>([
    {
      id: 'conn-1',
      name: 'Link 1',
      source: 'node-1',
      target: 'node-2',
      type: 'wired',
      latency: 10,
      bandwidth: 100,
      packetLoss: 0,
      distance: 100,
    },
    {
      id: 'conn-2',
      name: 'Link 2',
      source: 'node-2',
      target: 'node-3',
      type: 'wireless',
      latency: 20,
      bandwidth: 50,
      packetLoss: 0.05,
      distance: 150,
    },
  ]);

  const [blockchain, setBlockchain] = useState<Block[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const [selectedSourceNode, setSelectedSourceNode] = useState<string | null>(null);

  /* -----------------------------------------------------
        SAVE SIMULATION
  ----------------------------------------------------- */
  const handleSaveSimulation = () => {
    const exportData = {
      version: 1,
      createdAt: new Date().toISOString(),
      nodes,
      connections,
      blockchain,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ipfs-simulation.simnet.json";
    a.click();
  };

  /* -----------------------------------------------------
        LOAD SIMULATION
  ----------------------------------------------------- */
  const handleLoadSimulation = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.nodes || !data.connections) {
        toast.error("Invalid simulation file");
        return;
      }

      setNodes(data.nodes);
      setConnections(data.connections);
      setBlockchain(data.blockchain || []);

      setSelectedNode(null);
      setSelectedConnection(null);
      setSelectedSourceNode(null);

      toast.success("Simulation loaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load simulation");
    }
  };

  /* -----------------------------------------------------
        NETWORK CONTROLS
  ----------------------------------------------------- */
  const handleAddNode = useCallback((node: NetworkNode) => {
    setNodes(prev => [...prev, node]);
    toast.success(`Node "${node.label}" added`);
  }, []);

  const handleRemoveNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.source !== id && c.target !== id));
    setSelectedNode(null);
    toast.success("Node removed");
  }, []);

  const handleRemoveConnection = useCallback((id: string) => {
    setConnections(prev => prev.filter(c => c.id !== id));
    setSelectedConnection(null);
    toast.success("Connection removed");
  }, []);

  const handleUpdateConnection = useCallback((connection: NetworkConnection) => {
    setConnections(prev => prev.map(c => (c.id === connection.id ? connection : c)));
  }, []);

  /* -----------------------------------------------------
        FILE TRANSFER SIMULATION
  ----------------------------------------------------- */
  const simulateTransfer = async (chunks: FileChunk[], path: string[], fileName: string) => {
    let blockNumber = blockchain.length;

    for (const chunk of chunks) {
      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];

        setNodes(prev =>
          prev.map(n =>
            n.id === from || n.id === to ? { ...n, status: 'transferring' } : n
          )
        );

        const link = connections.find(
          c => (c.source === from && c.target === to) || (c.source === to && c.target === from)
        );
        if (!link) continue;

        const transferTime = calculateTransferTime(
          chunk.size,
          link.bandwidth,
          link.latency,
          link.packetLoss
        );

        await new Promise(r => setTimeout(r, transferTime));

        const fromNode = nodes.find(n => n.id === from);
        const toNode = nodes.find(n => n.id === to);

        const block = createBlock(
          blockNumber++,
          chunk.id,
          fileName,
          chunk.hash,
          fromNode?.label || from,
          toNode?.label || to,
          transferTime
        );

        setBlockchain(prev => [...prev, block]);

        setNodes(prev =>
          prev.map(n =>
            n.id === from || n.id === to ? { ...n, status: 'online' } : n
          )
        );
      }
    }
  };

  const handleStartTransfer = async (file: File, sourceId: string, destId: string, chunkSize: number) => {
    setIsSimulating(true);
    toast.info("Starting file transfer simulation...");

    try {
      const chunks = await chunkFile(file, chunkSize);
      const path = findShortestPath(nodes, connections, sourceId, destId);

      if (path.length < 2) {
        toast.error("No path found between nodes");
        setIsSimulating(false);
        return;
      }

      await simulateTransfer(chunks, path, file.name);
      toast.success("File transfer completed!");
    } catch {
      toast.error("Transfer failed");
    } finally {
      setIsSimulating(false);
    }
  };

  /* -----------------------------------------------------
        UI RENDER
  ----------------------------------------------------- */
  return (
    <div className="min-h-screen bg-background p-4">
      
      <Card className="mb-4 p-4 bg-card border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">IPFS Network Simulator</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Visual network topology editor with file transfer simulation
            </p>
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveSimulation}>Save</Button>

            <>
              <input
                id="loadSimulationInput"
                type="file"
                accept=".json,.simnet.json"
                className="hidden"
                onChange={handleLoadSimulation}
              />
              <Button
                variant="outline"
                onClick={() => (document.getElementById('loadSimulationInput') as HTMLInputElement)?.click()}
              >
                Load
              </Button>
            </>

            <Button
              variant={mode === 'simulation' ? 'default' : 'outline'}
              onClick={() => setMode('simulation')}
              className={mode === 'simulation' ? 'glow-primary' : ''}
            >
              <Activity className="h-4 w-4 mr-2" />
              Simulation Mode
            </Button>

            <Button
              variant={mode === 'real' ? 'default' : 'outline'}
              onClick={() => setMode('real')}
              className={mode === 'real' ? 'glow-secondary' : ''}
            >
              <Circle className="h-4 w-4 mr-2" />
              Real Mode
            </Button>
          </div>
        </div>
      </Card>

      {mode === 'simulation' ? (
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-140px)]">

          <div className="col-span-3 overflow-auto">
            <ControlPanel
              nodes={nodes}
              connections={connections}
              onAddNode={handleAddNode}
              onRemoveNode={handleRemoveNode}
              onRemoveConnection={handleRemoveConnection}
              onUpdateConnection={handleUpdateConnection}
              selectedNode={selectedNode}
              selectedConnection={selectedConnection}
            />
          </div>

          <div className="col-span-6">
            <NetworkGraph
              nodes={nodes}
              connections={connections}
              onNodesChange={setNodes}
              onConnectionsChange={setConnections}
              selectedNode={selectedNode}
              setSelectedNode={setSelectedNode}
              selectedConnection={selectedConnection}
              setSelectedConnection={setSelectedConnection}
              selectedSourceNode={selectedSourceNode}
              setSelectedSourceNode={setSelectedSourceNode}
            />
          </div>

          <div className="col-span-3 flex flex-col gap-4 overflow-auto">
            <FileTransferPanel
              nodes={nodes}
              onStartTransfer={handleStartTransfer}
              isSimulating={isSimulating}
              selectedSourceNode={selectedSourceNode}
            />

            <NodeDetailsPanel
              selectedNode={selectedNode}
              blockchain={blockchain}
            />

            <div className="flex-1 min-h-0">
              <BlockchainPanel blocks={blockchain} />
            </div>
          </div>

        </div>
      ) : (
        <Card className="p-12 text-center bg-card border-border">
          <div className="max-w-md mx-auto space-y-4">
            <Circle className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground">Real Mode</h2>
            <p className="text-muted-foreground">Real mode will connect to IPFS nodes. Coming soon.</p>
            <Button onClick={() => setMode('simulation')} className="glow-primary">
              Back to Simulation
            </Button>
          </div>
        </Card>
      )}

    </div>
  );
};

export default Index;
