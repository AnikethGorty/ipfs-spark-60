import CryptoJS from 'crypto-js';
import { FileChunk, NetworkConnection, NetworkNode, Block } from '@/types/network';

export const chunkFile = async (file: File, chunkSize: number = 256 * 1024): Promise<FileChunk[]> => {
  const chunks: FileChunk[] = [];
  let offset = 0;
  let chunkId = 0;

  while (offset < file.size) {
    const end = Math.min(offset + chunkSize, file.size);
    const blob = file.slice(offset, end);
    const arrayBuffer = await blob.arrayBuffer();
    const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer as any);
    const hash = CryptoJS.SHA256(wordArray).toString();

    chunks.push({
      id: chunkId++,
      data: blob,
      hash,
      size: blob.size,
    });

    offset = end;
  }

  return chunks;
};

export const calculateTransferTime = (
  chunkSize: number,
  bandwidth: number,
  latency: number,
  packetLoss: number
): number => {
  // Convert chunk size to megabits
  const chunkSizeMb = (chunkSize * 8) / (1024 * 1024);
  
  // Base transfer time
  let transferTime = (chunkSizeMb / bandwidth) * 1000 + latency;
  
  // Account for packet loss (probabilistic retries)
  if (packetLoss > 0) {
    const retries = Math.random() < packetLoss ? Math.ceil(Math.random() * 3) : 0;
    transferTime *= (1 + retries);
  }
  
  return transferTime;
};

export const findShortestPath = (
  nodes: NetworkNode[],
  connections: NetworkConnection[],
  start: string,
  end: string
): string[] => {
  const distances: { [key: string]: number } = {};
  const previous: { [key: string]: string | null } = {};
  const unvisited = new Set<string>();

  // Initialize
  nodes.forEach(node => {
    distances[node.id] = Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });
  distances[start] = 0;

  while (unvisited.size > 0) {
    // Find node with minimum distance
    let current: string | null = null;
    let minDist = Infinity;
    unvisited.forEach(nodeId => {
      if (distances[nodeId] < minDist) {
        minDist = distances[nodeId];
        current = nodeId;
      }
    });

    if (!current || current === end) break;
    unvisited.delete(current);

    // Update distances to neighbors
    connections
      .filter(conn => conn.source === current || conn.target === current)
      .forEach(conn => {
        const neighbor = conn.source === current ? conn.target : conn.source;
        if (!unvisited.has(neighbor)) return;

        // Weight = latency + 1/bandwidth (simplified)
        const weight = conn.latency + (1000 / conn.bandwidth);
        const alt = distances[current!] + weight;

        if (alt < distances[neighbor]) {
          distances[neighbor] = alt;
          previous[neighbor] = current;
        }
      });
  }

  // Reconstruct path
  const path: string[] = [];
  let current: string | null = end;
  while (current) {
    path.unshift(current);
    current = previous[current];
  }

  return path[0] === start ? path : [];
};

export const createBlock = (
  blockNumber: number,
  chunkId: number,
  fileName: string,
  hash: string,
  from: string,
  to: string,
  transferTime: number
): Block => {
  return {
    blockNumber,
    timestamp: new Date().toISOString(),
    chunkId,
    fileName,
    hash,
    from,
    to,
    transferTime,
  };
};
