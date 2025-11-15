"""
Basic Chunk Transfer Logic Module

This module provides utilities for file chunking, hashing, and transfer simulation
in a network topology. It can be integrated with the main simulation system.

Author: IPFS Network Simulator
Date: 2025
"""

import hashlib
import time
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass


@dataclass
class FileChunk:
    """Represents a chunk of a file"""
    id: int
    data: bytes
    hash: str
    size: int


@dataclass
class NetworkNode:
    """Represents a network node"""
    id: str
    label: str
    status: str  # 'online', 'offline', 'transferring'


@dataclass
class NetworkConnection:
    """Represents a connection between two nodes"""
    id: str
    name: str
    source: str
    target: str
    connection_type: str  # 'wired' or 'wireless'
    latency: float  # milliseconds
    bandwidth: float  # Mbps
    packet_loss: float  # 0-1
    distance: float  # meters


def chunk_file(file_path: str, chunk_size: int = 256 * 1024) -> List[FileChunk]:
    """
    Split a file into chunks and compute hash for each chunk
    
    Args:
        file_path: Path to the file to chunk
        chunk_size: Size of each chunk in bytes (default 256KB)
    
    Returns:
        List of FileChunk objects
    """
    chunks = []
    chunk_id = 0
    
    with open(file_path, 'rb') as f:
        while True:
            data = f.read(chunk_size)
            if not data:
                break
            
            # Compute SHA256 hash
            hash_obj = hashlib.sha256(data)
            chunk_hash = hash_obj.hexdigest()
            
            chunk = FileChunk(
                id=chunk_id,
                data=data,
                hash=chunk_hash,
                size=len(data)
            )
            chunks.append(chunk)
            chunk_id += 1
    
    return chunks


def calculate_transfer_time(
    chunk_size: int,
    bandwidth: float,
    latency: float,
    packet_loss: float
) -> float:
    """
    Calculate transfer time for a chunk based on network properties
    
    Args:
        chunk_size: Size of chunk in bytes
        bandwidth: Connection bandwidth in Mbps
        latency: Connection latency in milliseconds
        packet_loss: Packet loss rate (0-1)
    
    Returns:
        Transfer time in milliseconds
    """
    # Convert chunk size to megabits
    chunk_size_mb = (chunk_size * 8) / (1024 * 1024)
    
    # Base transfer time
    transfer_time = (chunk_size_mb / bandwidth) * 1000 + latency
    
    # Account for packet loss (simple retry simulation)
    if packet_loss > 0:
        import random
        if random.random() < packet_loss:
            retries = random.randint(1, 3)
            transfer_time *= (1 + retries)
    
    return transfer_time


def find_shortest_path(
    nodes: List[NetworkNode],
    connections: List[NetworkConnection],
    start_id: str,
    end_id: str
) -> List[str]:
    """
    Find shortest path between two nodes using Dijkstra's algorithm
    
    Args:
        nodes: List of network nodes
        connections: List of network connections
        start_id: Starting node ID
        end_id: Destination node ID
    
    Returns:
        List of node IDs representing the path
    """
    # Initialize distances and previous nodes
    distances = {node.id: float('inf') for node in nodes}
    previous = {node.id: None for node in nodes}
    distances[start_id] = 0
    
    unvisited = set(node.id for node in nodes)
    
    while unvisited:
        # Find node with minimum distance
        current = min(unvisited, key=lambda node_id: distances[node_id])
        
        if current == end_id:
            break
            
        if distances[current] == float('inf'):
            break
            
        unvisited.remove(current)
        
        # Update distances to neighbors
        for conn in connections:
            neighbor = None
            if conn.source == current and conn.target in unvisited:
                neighbor = conn.target
            elif conn.target == current and conn.source in unvisited:
                neighbor = conn.source
            
            if neighbor:
                # Weight = latency + 1/bandwidth (simplified cost)
                weight = conn.latency + (1000 / conn.bandwidth)
                alt_distance = distances[current] + weight
                
                if alt_distance < distances[neighbor]:
                    distances[neighbor] = alt_distance
                    previous[neighbor] = current
    
    # Reconstruct path
    path = []
    current = end_id
    while current is not None:
        path.insert(0, current)
        current = previous[current]
    
    # Return path only if valid (starts at start_id)
    if path and path[0] == start_id:
        return path
    return []


def simulate_chunk_transfer(
    chunk: FileChunk,
    connection: NetworkConnection
) -> Dict:
    """
    Simulate the transfer of a single chunk over a connection
    
    Args:
        chunk: The chunk to transfer
        connection: The connection to use
    
    Returns:
        Dictionary with transfer details
    """
    transfer_time = calculate_transfer_time(
        chunk.size,
        connection.bandwidth,
        connection.latency,
        connection.packet_loss
    )
    
    return {
        'chunk_id': chunk.id,
        'chunk_hash': chunk.hash,
        'from': connection.source,
        'to': connection.target,
        'connection_name': connection.name,
        'transfer_time_ms': transfer_time,
        'timestamp': time.time()
    }


def main():
    """
    Example usage of the chunk transfer module
    """
    print("Chunk Transfer Logic Module")
    print("=" * 50)
    print("\nThis module provides basic utilities for:")
    print("- File chunking and hashing")
    print("- Transfer time calculation")
    print("- Shortest path finding")
    print("- Chunk transfer simulation")
    print("\nIntegrate this module with your network simulator.")


if __name__ == "__main__":
    main()
