import { useCallback, useEffect, useRef, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { sendPushNotice } from "@/lib/notify.functions";

export type Party = "guest" | "owner";
export type CallPhase = "idle" | "outgoing" | "incoming" | "active" | "ended";

type CallRow = {
  id: string;
  conversation_id: string;
  caller: string;
  status: string;
};

const ICE: RTCConfiguration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    { urls: ["stun:global.stun.twilio.com:3478"] },
  ],
};

const RING_TIMEOUT = 35_000;

/** WebRTC audio calling over Supabase realtime signalling. */
export function useAudioCall({
  conversationId,
  role,
  onIncoming,
}: {
  conversationId: string | null;
  role: Party;
  onIncoming?: (conversationId: string) => void;
}) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [call, setCall] = useState<CallRow | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [status, setStatus] = useState("");
  const [muted, setMuted] = useState(false);
  const [peerOnline, setPeerOnline] = useState(false);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingIce = useRef<RTCIceCandidateInit[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ringTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callRef = useRef<CallRow | null>(null);
  callRef.current = call;

  /* ---------- presence: is the other side reachable right now ---------- */
  useEffect(() => {
    const myKey = role === "owner" ? "owner" : conversationId;
    if (!myKey) return;
    const otherKey = role === "owner" ? conversationId : "owner";
    const ch = supabase.channel("h4ck-presence", { config: { presence: { key: myKey } } });
    const sync = () => {
      const state = ch.presenceState();
      setPeerOnline(otherKey ? Boolean(state[otherKey]?.length) : false);
    };
    ch.on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe(async (s) => {
        if (s === "SUBSCRIBED") await ch.track({ at: Date.now() });
      });
    return () => {
      supabase.removeChannel(ch);
    };
  }, [role, conversationId]);

  /* ---------- teardown ---------- */
  const cleanup = useCallback(() => {
    pcRef.current?.getSenders().forEach((s) => s.track?.stop());
    pcRef.current?.close();
    pcRef.current = null;
    localRef.current?.getTracks().forEach((t) => t.stop());
    localRef.current = null;
    if (audioRef.current) {
      audioRef.current.srcObject = null;
      audioRef.current = null;
    }
    pendingIce.current = [];
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (ringTimer.current) clearTimeout(ringTimer.current);
    ringTimer.current = null;
  }, []);

  const finish = useCallback(
    async (dbStatus: string | null, label: string) => {
      const current = callRef.current;
      cleanup();
      setPhase("ended");
      setStatus(label);
      setSeconds(0);
      if (current && dbStatus) {
        await supabase
          .from("calls")
          .update({ status: dbStatus, ended_at: new Date().toISOString() })
          .eq("id", current.id);
      }
      setTimeout(() => {
        setCall(null);
        setPhase((p) => (p === "ended" ? "idle" : p));
        setStatus("");
      }, 1600);
    },
    [cleanup],
  );

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSeconds(0);
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }, []);

  /* ---------- peer connection ---------- */
  const buildPeer = useCallback(async (callId: string, me: Party) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    localRef.current = stream;
    const pc = new RTCPeerConnection(ICE);
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      void supabase.from("call_signals").insert({
        call_id: callId,
        sender: me,
        kind: "ice",
        payload: e.candidate.toJSON() as never,
      });
    };
    pc.ontrack = (e) => {
      const el = audioRef.current ?? new Audio();
      el.autoplay = true;
      (el as HTMLAudioElement & { playsInline?: boolean }).playsInline = true;
      el.srcObject = e.streams[0] ?? null;
      audioRef.current = el;
      void el.play().catch(() => {});
    };
    pcRef.current = pc;
    return pc;
  }, []);

  /* ---------- signalling for the live call ---------- */
  useEffect(() => {
    if (!call) return;
    const me = role;
    const ch = supabase
      .channel(`call-${call.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "call_signals",
          filter: `call_id=eq.${call.id}`,
        },
        async (payload) => {
          const row = payload.new as { sender: Party; kind: string; payload: unknown };
          if (row.sender === me) return;
          const pc = pcRef.current;
          if (!pc) return;
          if (row.kind === "answer") {
            await pc.setRemoteDescription(row.payload as RTCSessionDescriptionInit);
            for (const c of pendingIce.current) await pc.addIceCandidate(c).catch(() => {});
            pendingIce.current = [];
          } else if (row.kind === "ice") {
            const cand = row.payload as RTCIceCandidateInit;
            if (pc.remoteDescription) await pc.addIceCandidate(cand).catch(() => {});
            else pendingIce.current.push(cand);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "calls", filter: `id=eq.${call.id}` },
        (payload) => {
          const row = payload.new as CallRow;
          if (row.status === "accepted") {
            setPhase("active");
            setStatus("");
            startTimer();
          }
          if (row.status === "declined") void finish(null, "Call declined");
          if (row.status === "ended") void finish(null, "Call ended");
          if (row.status === "missed") void finish(null, "No answer");
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [call, role, finish, startTimer]);

  /* ---------- incoming watcher ---------- */
  useEffect(() => {
    const filter = conversationId ? `conversation_id=eq.${conversationId}` : undefined;
    const ch = supabase
      .channel(`calls-watch-${conversationId ?? "all"}-${role}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "calls", ...(filter ? { filter } : {}) },
        (payload) => {
          const row = payload.new as CallRow;
          if (row.caller === role || row.status !== "ringing") return;
          if (callRef.current) return;
          onIncoming?.(row.conversation_id);
          setCall(row);
          setPhase("incoming");
          setStatus("Incoming audio call");
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId, role]);

  /* ---------- actions ---------- */
  const startCall = useCallback(async () => {
    if (!conversationId || phase !== "idle") return;
    setPhase("outgoing");
    setStatus(peerOnline ? "Ringing…" : "Trying to reach…");
    try {
      const { data: created, error } = await supabase
        .from("calls")
        .insert({ conversation_id: conversationId, caller: role, status: "ringing" })
        .select()
        .single();
      if (error || !created) throw error ?? new Error("call failed");
      const row = created as CallRow;
      setCall(row);
      const pc = await buildPeer(row.id, role);
      const offer = await pc.createOffer({ offerToReceiveAudio: true });
      await pc.setLocalDescription(offer);
      await supabase.from("call_signals").insert({
        call_id: row.id,
        sender: role,
        kind: "offer",
        payload: { type: offer.type, sdp: offer.sdp } as never,
      });
      void sendPushNotice({ data: { conversationId, from: role, kind: "call" } }).catch(() => {});
      ringTimer.current = setTimeout(() => {
        void finish("missed", peerOnline ? "No answer" : "Not reachable — they are offline");
      }, RING_TIMEOUT);
    } catch {
      cleanup();
      setPhase("ended");
      setStatus("Call could not start — check mic permission");
      setTimeout(() => setPhase("idle"), 2000);
    }
  }, [conversationId, phase, role, peerOnline, buildPeer, finish, cleanup]);

  const acceptCall = useCallback(async () => {
    const row = callRef.current;
    if (!row) return;
    try {
      const pc = await buildPeer(row.id, role);
      const { data: signals } = await supabase
        .from("call_signals")
        .select("*")
        .eq("call_id", row.id)
        .order("created_at", { ascending: true });
      const offer = signals?.find((s) => s.kind === "offer");
      if (!offer) throw new Error("no offer");
      await pc.setRemoteDescription(offer.payload as unknown as RTCSessionDescriptionInit);
      for (const s of signals ?? []) {
        if (s.kind === "ice" && s.sender !== role)
          await pc.addIceCandidate(s.payload as unknown as RTCIceCandidateInit).catch(() => {});
      }
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      await supabase.from("call_signals").insert({
        call_id: row.id,
        sender: role,
        kind: "answer",
        payload: { type: answer.type, sdp: answer.sdp } as never,
      });
      await supabase
        .from("calls")
        .update({ status: "accepted", answered_at: new Date().toISOString() })
        .eq("id", row.id);
      setPhase("active");
      setStatus("");
      startTimer();
    } catch {
      void finish("ended", "Could not connect");
    }
  }, [role, buildPeer, finish, startTimer]);

  const declineCall = useCallback(() => finish("declined", "Declined"), [finish]);
  const hangUp = useCallback(() => finish("ended", "Call ended"), [finish]);

  const toggleMute = useCallback(() => {
    const track = localRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return {
    phase,
    seconds,
    status,
    muted,
    peerOnline,
    startCall,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
  };
}