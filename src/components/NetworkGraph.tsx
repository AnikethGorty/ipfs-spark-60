import { useCallback, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
  EdgeProps,
  BaseEdge,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { NetworkNode, NetworkConnection } from '@/types/network';

/* ------------------------------------------
   CUSTOM CURVED MULTI-EDGE COMPONENT
------------------------------------------- */
function CurvedMultiEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const index = data?.index ?? 0;
  const total = data?.total ?? 1;

  const curveStrength = 40;
  const offset = (index - (total - 1) / 2) * curveStrength;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.3,
  });

  return (
    <g transform={`translate(0, ${offset})`}>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
    </g>
  );
}

/* ------------------------------------------
   MAIN NETWORK GRAPH PROPS
------------------------------------------- */
interface NetworkGraphProps {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  onNodesChange: (nodes: NetworkNode[]) => void;
  onConnectionsChange: (connections: NetworkConnection[]) => void;

  selectedNode: string | null;
  setSelectedNode: (id: string | null) => void;

  selectedConnection: string | null;
  setSelectedConnection: (id: string | null) => void;

  // REQUIRED ✔
  selectedSourceNode: string | null;
  setSelectedSourceNode: (id: string | null) => void;
}

export const NetworkGraph = ({
  nodes: networkNodes,
  connections: networkConnections,
  onNodesChange,
  onConnectionsChange,
  selectedNode,
  setSelectedNode,
  selectedConnection,
  setSelectedConnection,
  selectedSourceNode,
  setSelectedSourceNode,
}: NetworkGraphProps) => {
  const [nodes, setNodes, onNodesChangeFlow] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeFlow] = useEdgesState([]);

  /* ------------------------------------------
     NODE CONVERSION
  ------------------------------------------- */
  useEffect(() => {
    const flowNodes: Node[] = networkNodes.map(node => ({
      id: node.id,
      position: node.position,
      type: 'default',
      data: { label: node.label },
      style: {
        background:
          node.status === 'transferring'
            ? 'hsl(var(--node-transferring))'
            : node.status === 'online'
            ? 'hsl(var(--node-active))'
            : 'hsl(var(--node-default))',
        color: 'hsl(var(--background))',
        border:
          selectedNode === node.id
            ? '2px solid hsl(var(--primary))'
            : selectedSourceNode === node.id
            ? '2px dashed hsl(var(--secondary))'
            : '1px solid hsl(var(--border))',
        borderRadius: '50%',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
      },
    }));
    setNodes(flowNodes);
  }, [networkNodes, selectedNode, selectedSourceNode, setNodes]);

  /* ------------------------------------------
     EDGE CONVERSION (with curved multi-edges)
  ------------------------------------------- */
  useEffect(() => {
    const grouped = new Map<string, NetworkConnection[]>();

    for (const c of networkConnections) {
      const key = [c.source, c.target].sort().join('-');
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(c);
    }

    const flowEdges: Edge[] = networkConnections.map(conn => {
      const key = [conn.source, conn.target].sort().join('-');
      const siblings = grouped.get(key)!;
      const index = siblings.findIndex(c => c.id === conn.id);

      return {
        id: conn.id,
        source: conn.source,
        target: conn.target,
        type: 'curvedMulti',
        data: { index, total: siblings.length },
        style: {
          stroke:
            conn.type === 'wired'
              ? 'hsl(var(--connection-wired))'
              : 'hsl(var(--connection-wireless))',
          strokeWidth: Math.max(1, conn.bandwidth / 100),
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color:
            conn.type === 'wired'
              ? 'hsl(var(--connection-wired))'
              : 'hsl(var(--connection-wireless))',
        },
        label: conn.name,
        labelStyle: {
          fill: 'hsl(var(--foreground))',
          fontSize: 9,
          fontWeight: 600,
        },
      };
    });

    setEdges(flowEdges);
  }, [networkConnections, setEdges]);

  /* ------------------------------------------
     CREATE CONNECTIONS
  ------------------------------------------- */
  const onConnect = useCallback(
    (params: Connection) => {
      const newConnection: NetworkConnection = {
        id: `conn-${Date.now()}`,
        name: 'Connection',
        source: params.source!,
        target: params.target!,
        type: 'wired',
        latency: 10,
        bandwidth: 100,
        packetLoss: 0,
        distance: 100,
      };

      onConnectionsChange([...networkConnections, newConnection]);
    },
    [networkConnections, onConnectionsChange]
  );

  /* ------------------------------------------
     DRAG NODE TO MOVE
  ------------------------------------------- */
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      const updatedNodes = networkNodes.map(n =>
        n.id === node.id ? { ...n, position: node.position } : n
      );
      onNodesChange(updatedNodes);
    },
    [networkNodes, onNodesChange]
  );

  /* ------------------------------------------
     CLICK HANDLERS
  ------------------------------------------- */
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      setSelectedNode(node.id);
      setSelectedConnection(null);

      // 🔥 ALWAYS SET SOURCE NODE
      setSelectedSourceNode(node.id);
    },
    [setSelectedNode, setSelectedConnection, setSelectedSourceNode]
  );

  const onEdgeClick = useCallback(
    (_: any, edge: Edge) => {
      setSelectedConnection(edge.id);
      setSelectedNode(null);
    },
    [setSelectedConnection, setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedConnection(null);
  }, [setSelectedNode, setSelectedConnection]);

  /* ------------------------------------------
     UI
  ------------------------------------------- */
  return (
    <div className="h-full w-full bg-background/50 rounded-lg overflow-hidden border border-border">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChangeFlow}
        onEdgesChange={onEdgesChangeFlow}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        edgeTypes={{ curvedMulti: CurvedMultiEdge }}
        defaultEdgeOptions={{ type: 'curvedMulti' }}
        fitView
      >
        <Background color="hsl(var(--primary))" gap={16} />
        <Controls className="bg-card border border-border" />
      </ReactFlow>
    </div>
  );
};
