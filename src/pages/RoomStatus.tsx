import React from "react";
import { usePresence } from "../contexts/PresenceContext";

export default function RoomStatus() {
  const { connected, peers } = usePresence();

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "12px" }}>Room Status</h2>

      {/* Connection state */}
      <div
        style={{
          marginBottom: "16px",
          padding: "10px",
          background: connected ? "#e8ffe8" : "#ffe8e8",
          borderRadius: 8,
        }}
      >
        Status:{" "}
        <b style={{ color: connected ? "green" : "red" }}>
          {connected ? "Connected" : "Disconnected"}
        </b>
      </div>

      {/* Peer list */}
      <h3>Peers in this Room</h3>

      {peers.length === 0 && (
        <p style={{ opacity: 0.7 }}>No peers connected.</p>
      )}

      {peers.map((peer) => (
        <div
          key={peer.user}
          style={{
            padding: "10px",
            border: "1px solid #ddd",
            borderRadius: 8,
            marginBottom: 10,
          }}
        >
          <b>{peer.user}</b>  
          <br />

          {/* Metadata */}
          {peer.meta && (
            <div style={{ marginTop: 4, fontSize: "0.9rem" }}>
              {peer.meta.ip && (
                <>
                  <span>IP: {peer.meta.ip}</span>
                  <br />
                </>
              )}

              {peer.meta.wifiSSID && (
                <>
                  <span>
                    WiFi: {peer.meta.wifiSSID} ({peer.meta.wifiSignal})
                  </span>
                  <br />
                </>
              )}

              {peer.meta.userAgent && (
                <>
                  <span style={{ opacity: 0.6 }}>
                    Browser: {peer.meta.userAgent.slice(0, 40)}...
                  </span>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
