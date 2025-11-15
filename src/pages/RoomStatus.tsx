import React, { useState } from "react";
import { usePresence } from "../contexts/PresenceContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RoomStatus() {
  const { connected, peers, join, leave } = usePresence();

  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");

  const handleJoin = () => {
    if (!username || !room) return;
    join(room, username, {
      userAgent: navigator.userAgent,
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Room Status</h2>

        <Button variant="secondary" onClick={() => (window.location.href = "/")}>
          ← Back to Home
        </Button>
      </div>

      {/* If not connected, show join form */}
      {!connected && (
        <Card className="p-6 mb-6 max-w-md mx-auto space-y-4">
          <h3 className="text-xl font-bold mb-2">Join a Room</h3>

          <Input
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <Input
            placeholder="Room ID (example: room123)"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
          />

          <Button onClick={handleJoin} className="w-full">
            Join Room
          </Button>
        </Card>
      )}

      {/* Connected State */}
      {connected && (
        <Card className="p-4 mb-6">
          <p className="text-lg">
            Status: <span className="text-green-500">Connected</span>
          </p>

          <Button variant="outline" className="mt-3" onClick={() => leave()}>
            Leave Room
          </Button>
        </Card>
      )}

      {/* Peer List */}
      {connected && (
        <>
          <h3 className="text-2xl font-semibold mb-4">Peers in this Room</h3>

          {peers.length === 0 ? (
            <p className="text-muted-foreground">No peers connected.</p>
          ) : (
            <div className="space-y-4">
              {peers.map((peer) => (
                <Card key={peer.user} className="p-4 border">
                  <h4 className="text-xl font-bold">{peer.user}</h4>

                  {peer.meta && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      {peer.meta.ip && <p>IP: {peer.meta.ip}</p>}
                      {peer.meta.userAgent && (
                        <p className="truncate">Browser: {peer.meta.userAgent}</p>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
