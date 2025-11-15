import React from "react";
import { usePresence } from "../contexts/PresenceContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function RoomStatus() {
  const { connected, peers } = usePresence();

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold">Room Status</h2>

        {/* ⭐ Back to Home button */}
        <Button
          variant="secondary"
          onClick={() => (window.location.href = "/")}
        >
          ← Back to Home
        </Button>
      </div>

      {/* Connection State */}
      <Card className="p-4 mb-6">
        <p className="text-lg">
          Status:{" "}
          <span className={connected ? "text-green-500" : "text-red-500"}>
            {connected ? "Connected" : "Disconnected"}
          </span>
        </p>
      </Card>

      {/* Peer List */}
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
                  {peer.meta.wifiSSID && (
                    <p>
                      WiFi: {peer.meta.wifiSSID} ({peer.meta.wifiSignal})
                    </p>
                  )}
                  {peer.meta.userAgent && (
                    <p className="truncate">
                      Browser: {peer.meta.userAgent}
                    </p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
