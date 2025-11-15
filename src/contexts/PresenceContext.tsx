import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type Meta = Record<string, any>;
export type PeerInfo = { user: string; meta?: Meta };

interface PresenceContextType {
  connected: boolean;
  peers: PeerInfo[];
  sendMetaUpdate: (meta: Meta) => void;
  sendOffer: (target: string, offer: any) => void;
  sendAnswer: (target: string, answer: any) => void;
  sendCandidate: (target: string, candidate: any) => void;
  join: (room: string, name: string, meta?: Meta) => void;
  leave: () => void;
}

const PresenceContext = createContext<PresenceContextType | null>(null);

export const usePresence = () => {
  const ctx = useContext(PresenceContext);
  if (!ctx) throw new Error("usePresence must be inside PresenceProvider");
  return ctx;
};

// ensure WS URL always resolves to a string
const WS_URL: string =
  import.meta.env.VITE_SIGNALING_URL || "ws://localhost:8000/ws";

export const PresenceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const wsRef = useRef<WebSocket | null>(null);

  const [connected, setConnected] = useState(false);
  const [peers, setPeers] = useState<PeerInfo[]>([]);

  const currentRoom = useRef<string | null>(null);
  const currentUser = useRef<string | null>(null);

  //
  // CLEANUP on unmount
  //
  useEffect(() => {
    return () => {
      try {
        wsRef.current?.close();
      } catch {}
    };
  }, []);

  //
  // Message handler
  //
  const handleMessage = (ev: MessageEvent) => {
    if (typeof ev.data !== "string") return;
    let msg: any;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      console.warn("Invalid WS message:", ev.data);
      return;
    }

    if (msg.type === "UPDATE_LIST") {
      setPeers(msg.listeners || []);
      return;
    }

    if (
      msg.type === "OFFER" ||
      msg.type === "ANSWER" ||
      msg.type === "CANDIDATE"
    ) {
      // Broadcast signaling event to window (FileTransfer listens)
      window.dispatchEvent(
        new CustomEvent<any>("signaling:" + msg.type.toLowerCase(), {
          detail: msg,
        })
      );
      return;
    }
  };

  //
  // JOIN ROOM
  //
  const join = (room: string, name: string, meta: Meta = {}) => {
    // Close old socket if exists
    try {
      wsRef.current?.close();
    } catch {}
    wsRef.current = null;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      currentRoom.current = room;
      currentUser.current = name;
      setConnected(true);

      ws.send(
        JSON.stringify({
          type: "JOIN",
          room,
          user: name,
          meta,
        })
      );
    };

    ws.onerror = (e) => {
      console.error("WebSocket error:", e);
    };

    ws.onmessage = handleMessage;

    ws.onclose = () => {
      setConnected(false);
      setPeers([]);
      currentRoom.current = null;
      currentUser.current = null;
    };
  };

  //
  // LEAVE ROOM
  //
  const leave = () => {
    try {
      wsRef.current?.send(JSON.stringify({ type: "LEAVE" }));
    } catch {}

    try {
      wsRef.current?.close();
    } catch {}

    wsRef.current = null;
    setPeers([]);
    setConnected(false);

    currentRoom.current = null;
    currentUser.current = null;
  };

  //
  // SEND META UPDATE
  //
  const sendMetaUpdate = (meta: Meta) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "META_UPDATE", meta }));
    }
  };

  //
  // SIGNALING HELPERS
  //
  const sendSignal = (
    type: "OFFER" | "ANSWER" | "CANDIDATE",
    target: string,
    payload: any
  ) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, target, payload }));
    }
  };

  const sendOffer = (target: string, offer: any) =>
    sendSignal("OFFER", target, offer);

  const sendAnswer = (target: string, answer: any) =>
    sendSignal("ANSWER", target, answer);

  const sendCandidate = (target: string, candidate: any) =>
    sendSignal("CANDIDATE", target, candidate);

  return (
    <PresenceContext.Provider
      value={{
        connected,
        peers,
        sendMetaUpdate,
        sendOffer,
        sendAnswer,
        sendCandidate,
        join,
        leave,
      }}
    >
      {children}
    </PresenceContext.Provider>
  );
};
