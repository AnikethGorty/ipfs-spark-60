export interface NetworkNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  status: 'online' | 'offline' | 'transferring';
}

export interface NetworkConnection {
  id: string;
  name: string;
  source: string;
  target: string;
  type: 'wired' | 'wireless';
  latency: number; // ms
  bandwidth: number; // Mbps
  packetLoss: number; // 0-1
  distance: number; // meters
}

export interface FileChunk {
  id: number;
  data: Blob;
  hash: string;
  size: number;
}

export interface ChunkTransfer {
  chunkId: number;
  fileName: string;
  from: string;
  to: string;
  progress: number;
  status: 'pending' | 'transferring' | 'complete' | 'failed';
}

export interface Block {
  blockNumber: number;
  timestamp: string;
  chunkId: number;
  fileName: string;
  hash: string;
  from: string;
  to: string;
  transferTime: number;
}

export interface SimulationState {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  transfers: ChunkTransfer[];
  blockchain: Block[];
  isSimulating: boolean;
}
