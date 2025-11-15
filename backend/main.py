# main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import uvicorn
from typing import Dict, Set, Any
import time

app = FastAPI(title="Presence Server")

# Allow any origin for quick testing (change in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

# rooms -> { user_id: {"ws": WebSocket, "meta": {...}} }
rooms: Dict[str, Dict[str, Dict[str, Any]]] = {}
rooms_lock = asyncio.Lock()


async def broadcast_room(room: str):
    """Send an UPDATE_LIST message with current listeners to all clients in the room."""
    async with rooms_lock:
        if room not in rooms:
            return
        listeners = []
        for user_id, entry in rooms[room].items():
            # Only expose non-sensitive metadata
            meta = entry.get("meta", {})
            listeners.append({"user": user_id, "meta": meta})
        message = {"type": "UPDATE_LIST", "listeners": listeners, "ts": time.time()}

        # send to all websockets; remove closed ones
        to_remove = []
        for user_id, entry in rooms[room].items():
            ws: WebSocket = entry["ws"]
            try:
                await ws.send_json(message)
            except Exception:
                to_remove.append(user_id)
        for user_id in to_remove:
            rooms[room].pop(user_id, None)


@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    """
    WebSocket protocol:
      - On connect, client must send JSON: {"type":"JOIN", "room":"roomId", "user":"name", "meta": {...}}
      - Server responds with UPDATE_LIST messages whenever the membership changes.
      - Client may optionally send {"type":"LEAVE"} to leave a room (or just close).
    """
    await ws.accept()
    room = None
    user = None
    try:
        join_msg = await ws.receive_json()
        if not isinstance(join_msg, dict) or join_msg.get("type") != "JOIN":
            await ws.send_json({"type": "ERROR", "msg": "First message must be JOIN"})
            await ws.close()
            return

        room = str(join_msg.get("room", "default"))
        user = str(join_msg.get("user", ws.client.host if hasattr(ws, "client") else "unknown"))
        meta = join_msg.get("meta", {})

        async with rooms_lock:
            if room not in rooms:
                rooms[room] = {}
            # If user already exists, replace ws
            rooms[room][user] = {"ws": ws, "meta": meta}

        # Broadcast updated list
        await broadcast_room(room)

        # Keep listening for client messages (optional ping/keepalive)
        while True:
            msg = await ws.receive_json()
            # Accept optional updates: e.g. {"type":"META_UPDATE", "meta":{...}}
            if not isinstance(msg, dict):
                continue
            if msg.get("type") == "META_UPDATE":
                new_meta = msg.get("meta", {})
                async with rooms_lock:
                    if room in rooms and user in rooms[room]:
                        rooms[room][user]["meta"] = new_meta
                await broadcast_room(room)
            elif msg.get("type") == "LEAVE":
                break
            # else: ignore / extend for signaling messages later (offer/answer/candidates)
    except WebSocketDisconnect:
        pass
    except Exception:
        # any other error -> remove user and close
        pass
    finally:
        # cleanup
        if room and user:
            async with rooms_lock:
                if room in rooms and user in rooms[room]:
                    rooms[room].pop(user, None)
            await broadcast_room(room)
        try:
            await ws.close()
        except:
            pass


@app.get("/rooms/{room}")
async def get_room(room: str):
    """HTTP inspector for the room membership (good for testing)."""
    async with rooms_lock:
        if room not in rooms:
            return {"room": room, "listeners": []}
        listeners = []
        for user_id, entry in rooms[room].items():
            listeners.append({"user": user_id, "meta": entry.get("meta", {})})
        return {"room": room, "listeners": listeners}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
