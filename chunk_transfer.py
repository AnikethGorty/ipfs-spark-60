"""
Basic Chunk Transfer Logic Module

This module provides utilities for file chunking, hashing, and transfer simulation
in a network topology. It can be integrated with the main simulation system.

Author: IPFS Network Simulator (edited)
Date: 2025
"""

import hashlib
import time
from typing import List, Dict, Tuple, Optional
from dataclasses import dataclass
import os
import math
import heapq

CHUNK_SIZE_DEFAULT = 1024 * 64  # 64 KiB


@dataclass
class Chunk:
    index: int
    data: bytes
    size: int
    hash: str


def chunk_file(path: str, chunk_size: int = CHUNK_SIZE_DEFAULT) -> List[Chunk]:
    """Read a file and split into chunks of chunk_size bytes."""
    chunks: List[Chunk] = []
    idx = 0
    with open(path, "rb") as f:
        while True:
            data = f.read(chunk_size)
            if not data:
                break
            h = hashlib.sha256(data).hexdigest()
            chunks.append(Chunk(index=idx, data=data, size=len(data), hash=h))
            idx += 1
    return chunks


def hash_chunk(data: bytes) -> str:
    """Return the SHA256 hex digest for the chunk bytes."""
    return hashlib.sha256(data).hexdigest()


def estimate_transfer_time(bytes_count: int, bandwidth_kbps: float, latency_ms: float = 0.0) -> float:
    """
    Estimate transfer time in seconds given bytes_count, bandwidth in kilobits/sec, and latency in ms.
    bandwidth_kbps: kilobits per second (not kilobytes).
    """
    if bandwidth_kbps <= 0:
        raise ValueError("bandwidth_kbps must be > 0")
    bits = bytes_count * 8
    seconds_for_bits = bits / (bandwidth_kbps * 1000.0)
    # simple model: time = latency + transmission
    return (latency_ms / 1000.0) + seconds_for_bits


def simulate_chunk_transfer(chunk: Chunk, bandwidth_kbps: float, latency_ms: float = 0.0, sleep: bool = True) -> float:
    """
    Simulate transfer of a single chunk. Returns simulated elapsed seconds.
    If sleep is True, actually sleeps to simulate time passing (useful for demos).
    """
    t = estimate_transfer_time(chunk.size, bandwidth_kbps, latency_ms)
    if sleep and t > 0:
        time.sleep(t)
    return t


def simulate_transfer(chunks: List[Chunk], bandwidth_kbps: float, latency_ms: float = 0.0, parallelism: int = 1, sleep: bool = True) -> Dict:
    """
    Simulate transferring a list of chunks with a given bandwidth and parallelism.
    Returns statistics including total_time, per_chunk times, throughput (bytes/sec).
    This is a simplistic simulator and assumes bandwidth is evenly split among parallel transfers.
    """
    if parallelism < 1:
        parallelism = 1
    per_stream_bandwidth = bandwidth_kbps / parallelism
    per_chunk_times = []
    start = time.time()
    # naive simulation: process chunks in 'parallelism' groups
    active = []
    for chunk in chunks:
        t = estimate_transfer_time(chunk.size, per_stream_bandwidth, latency_ms)
        per_chunk_times.append({"index": chunk.index, "time_s": t, "size": chunk.size})
        if sleep and t > 0:
            time.sleep(t)
    end = time.time()
    total_time = end - start
    total_bytes = sum(c.size for c in chunks)
    throughput = total_bytes / total_time if total_time > 0 else float('inf')
    return {
        "total_time_s": total_time,
        "total_bytes": total_bytes,
        "throughput_Bps": throughput,
        "per_chunk": per_chunk_times,
        "chunks_count": len(chunks),
    }


def dijkstra_shortest_path(graph: Dict[int, List[Tuple[int, float]]], start: int, goal: int) -> Tuple[float, List[int]]:
    """
    Simple Dijkstra shortest path.
    graph: node -> list of (neighbor, weight)
    Returns (distance, path list)
    """
    dist = {start: 0.0}
    prev = {}
    pq = [(0.0, start)]
    visited = set()

    while pq:
        d, node = heapq.heappop(pq)
        if node in visited:
            continue
        visited.add(node)
        if node == goal:
            break
        for nbr, w in graph.get(node, []):
            nd = d + w
            if nd < dist.get(nbr, float('inf')):
                dist[nbr] = nd
                prev[nbr] = node
                heapq.heappush(pq, (nd, nbr))

    if goal not in dist:
        return (float('inf'), [])
    # reconstruct path
    path = []
    cur = goal
    while cur != start:
        path.append(cur)
        cur = prev[cur]
    path.append(start)
    path.reverse()
    return (dist[goal], path)


def main():
    print("chunk_transfer module - self test")
    # create a small temp file to demonstrate chunking
    import tempfile
    tmp = tempfile.NamedTemporaryFile(delete=False)
    tmp.write(b"A" * 200000)  # 200 KB
    tmp.close()
    chunks = chunk_file(tmp.name, chunk_size=65536)
    print(f"Created {len(chunks)} chunks")
    stats = simulate_transfer(chunks, bandwidth_kbps=1024, latency_ms=20, parallelism=2, sleep=False)
    print("Simulation stats:", stats)
    os.unlink(tmp.name)


if __name__ == "__main__":
    main()
