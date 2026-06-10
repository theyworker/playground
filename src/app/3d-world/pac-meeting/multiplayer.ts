import * as THREE from "three";
import Peer, { DataConnection } from "peerjs";
import { buildCrewmate } from "./crewmate";

// Peer-to-peer multiplayer over WebRTC (PeerJS public broker, no backend).
// The first visitor (no ?room= in the URL) hosts; the invite link carries
// the room id; guests connect to the host, who relays world snapshots.
export type LocalState = { x: number; z: number; ry: number; color: number };
type PlayerState = LocalState & { id: string };

const SEND_INTERVAL = 0.08; // ~12Hz network rate

type Remote = {
  group: THREE.Group;
  setColor: (color: number) => void;
  dispose: () => void;
  target: { x: number; z: number; ry: number };
  color: number;
};

function emitStatus(detail: { invite: string; phase: string; players: number }) {
  window.dispatchEvent(new CustomEvent("pac-multiplayer", { detail }));
}

export function createMultiplayer(scene: THREE.Scene): {
  update: (delta: number, local: LocalState) => void;
  dispose: () => void;
} {
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get("room");
  const isHost = !roomParam;
  const roomId = roomParam ?? Math.random().toString(36).slice(2, 8);
  const hostPeerId = `pac-meeting-${roomId}`;
  const invite = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const conns = new Map<string, DataConnection>();
  const guestStates = new Map<string, PlayerState>(); // host-side cache
  const remotes = new Map<string, Remote>();
  let selfId = isHost ? hostPeerId : "";
  let phase = "connecting";
  let disposed = false;

  const emit = () =>
    emitStatus({ invite, phase, players: remotes.size + 1 });
  emit();

  const removeRemote = (id: string) => {
    const remote = remotes.get(id);
    if (!remote) return;
    scene.remove(remote.group);
    remote.dispose();
    remotes.delete(id);
  };

  const applyWorld = (players: PlayerState[]) => {
    const seen = new Set<string>();
    for (const player of players) {
      if (player.id === selfId) continue;
      seen.add(player.id);
      let remote = remotes.get(player.id);
      if (!remote) {
        const crewmate = buildCrewmate();
        crewmate.group.position.set(player.x, 0, player.z);
        scene.add(crewmate.group);
        remote = {
          ...crewmate,
          target: { x: player.x, z: player.z, ry: player.ry },
          color: 0,
        };
        remotes.set(player.id, remote);
      }
      remote.target = { x: player.x, z: player.z, ry: player.ry };
      if (remote.color !== player.color) {
        remote.color = player.color;
        remote.setColor(player.color);
      }
    }
    for (const id of [...remotes.keys()]) {
      if (!seen.has(id)) removeRemote(id);
    }
    emit();
  };

  const peer = isHost ? new Peer(hostPeerId) : new Peer();

  if (isHost) {
    peer.on("open", () => {
      phase = "hosting";
      emit();
    });
    peer.on("connection", (conn) => {
      conns.set(conn.peer, conn);
      conn.on("data", (data) => {
        const message = data as { type: string } & LocalState;
        if (message.type === "state") {
          guestStates.set(conn.peer, { ...message, id: conn.peer });
        }
      });
      conn.on("close", () => {
        conns.delete(conn.peer);
        guestStates.delete(conn.peer);
        removeRemote(conn.peer);
      });
    });
  } else {
    peer.on("open", (id) => {
      selfId = id;
      const conn = peer.connect(hostPeerId);
      conns.set("host", conn);
      conn.on("open", () => {
        phase = "connected";
        emit();
      });
      conn.on("data", (data) => {
        const message = data as { type: string; players: PlayerState[] };
        if (message.type === "world") applyWorld(message.players);
      });
      conn.on("close", () => {
        phase = "host left";
        emit();
      });
    });
  }
  peer.on("error", (error) => {
    phase = `error: ${error.type}`;
    emit();
  });

  let sendTimer = 0;
  const update = (delta: number, local: LocalState) => {
    if (disposed) return;
    sendTimer += delta;
    if (sendTimer >= SEND_INTERVAL) {
      sendTimer = 0;
      if (isHost) {
        const players: PlayerState[] = [
          { id: hostPeerId, ...local },
          ...guestStates.values(),
        ];
        for (const conn of conns.values()) {
          if (conn.open) conn.send({ type: "world", players });
        }
        applyWorld(players);
      } else {
        const conn = conns.get("host");
        if (conn?.open) conn.send({ type: "state", ...local });
      }
    }

    // Smooth remote avatars toward their latest network state.
    const blend = Math.min(1, delta * 10);
    for (const remote of remotes.values()) {
      remote.group.position.x += (remote.target.x - remote.group.position.x) * blend;
      remote.group.position.z += (remote.target.z - remote.group.position.z) * blend;
      let angleDelta = remote.target.ry - remote.group.rotation.y;
      angleDelta = Math.atan2(Math.sin(angleDelta), Math.cos(angleDelta));
      remote.group.rotation.y += angleDelta * blend;
    }
  };

  return {
    update,
    dispose: () => {
      disposed = true;
      for (const conn of conns.values()) conn.close();
      peer.destroy();
      for (const id of [...remotes.keys()]) removeRemote(id);
    },
  };
}
