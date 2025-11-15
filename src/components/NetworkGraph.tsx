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

  const curveStrength = 40; // distance between curves
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
   MAIN NETWORK GRAPH COMPONENT
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
}: NetworkGraphProps) => {
  const [nodes, setNodes, onNodesChangeFlow] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeFlow] = useEdgesState([]);

  /* ------------------------------------------
     Convert nodes → ReactFlow nodes
  ------------------------------------------- */
  useEffect(() => {
    const flowNodes: Node[] = networkNodes.map(node => ({
      id: node.id,
      type: 'default',
      position: node.position,
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
            : '1px solid hsl(var(--border))',
        borderRadius: '50%',
        width: 60,
        height: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        boxShadow:
          node.status === 'transferring'
            ? 'var(--glow-accent)'
            : node.status === 'online'
            ? 'var(--glow-primary)'
            : 'none',
      },
    }));
    setNodes(flowNodes);
  }, [networkNodes, selectedNode, setNodes]);

  /* ------------------------------------------
     Convert connections → ReactFlow edges
     With automatic spacing for parallel edges
  ------------------------------------------- */
  useEffect(() => {
    // Group edges by node pair
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
        animated: false,
        data: {
          index,
          total: siblings.length,
        },
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
        label:
          selectedConnection === conn.id
            ? `${conn.name} - ${conn.bandwidth}Mbps, ${conn.latency}ms`
            : conn.name,
        labelStyle: {
          fill: 'hsl(var(--foreground))',
          fontSize: 9,
          fontWeight: 600,
        },
        labelBgStyle: {
          fill: 'hsl(var(--card))',
          fillOpacity: 0.9,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [4, 6],
      };
    });

    setEdges(flowEdges);
  }, [networkConnections, selectedConnection, setEdges]);

  /* ------------------------------------------
     Connection creation
  ------------------------------------------- */
  const onConnect = useCallback(
    (params: Connection) => {
      if (!params.source || !params.target) return;

      const newConnection: NetworkConnection = {
        id: `conn-${Date.now()}`,
        name: 'Connection',
        source: params.source,
        target: params.target,
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
     Node dragging updates stored positions
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
     Click handlers
  ------------------------------------------- */
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      setSelectedNode(node.id);
      setSelectedConnection(null);
    },
    [setSelectedNode, setSelectedConnection]
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
     RENDER
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
