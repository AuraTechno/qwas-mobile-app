/**
 * Call screen — full-screen WebRTC audio/video.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { View, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { RTCPeerConnection, RTCView, mediaDevices, MediaStream } from '@stream-io/react-native-webrtc';
import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiGet, apiPost } from '@/api/client';
import { useWebSocket } from '@/store/websocket';
import { useAuth } from '@/store/auth';
import type { User } from '@/types';

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: `turn:45.10.41.65:3478`, username: 'qwas', credential: 'qwasturn2026' },
];

export default function CallScreen() {
  const { callId, chatId, type: typeParam, outgoing } = useLocalSearchParams<{
    callId: string; chatId: string; type: string; outgoing: string;
  }>();
  const router = useRouter();
  const theme = useTheme();
  const me = useAuth((s) => s.user);

  const [status, setStatus] = useState<'calling' | 'ringing' | 'connecting' | 'connected' | 'ended'>(
    outgoing === '1' ? 'calling' : 'ringing'
  );
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [cameraOn, setCameraOn] = useState(typeParam === 'video');
  const [speaker, setSpeaker] = useState(false);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [other, setOther] = useState<User | null>(null);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    loadOther();
    if (outgoing === '1') startOutgoing();
    else acceptIncoming();

    const offAccept = useWebSocket.getState().on('call_accepted', (p: any) => {
      if (p?.callId !== callId) return;
      setStatus('connecting');
      createOffer();
    });
    const offReject = useWebSocket.getState().on('call_rejected', (p: any) => {
      if (p?.callId !== callId) return;
      endCall();
    });
    const offEnd = useWebSocket.getState().on('call_ended', (p: any) => {
      if (p?.callId !== callId) return;
      endCall();
    });
    const offOffer = useWebSocket.getState().on('webrtc_offer', (p: any) => {
      if (p?.callId !== callId) return;
      handleOffer(p);
    });
    const offAnswer = useWebSocket.getState().on('webrtc_answer', (p: any) => {
      if (p?.callId !== callId) return;
      handleAnswer(p);
    });
    const offIce = useWebSocket.getState().on('webrtc_ice', (p: any) => {
      if (p?.callId !== callId) return;
      handleIce(p);
    });

    return () => {
      offAccept(); offReject(); offEnd(); offOffer(); offAnswer(); offIce();
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (status === 'connected') {
      timerRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  async function loadOther() {
    try {
      const data = await apiGet<{ chat: any }>(`/api/v1/chats/${chatId}`);
      const otherMember = data.chat?.members?.find((m: any) => m.userId !== me?.id);
      if (otherMember) setOther(otherMember as any);
    } catch {}
  }

  async function getMedia() {
    const stream = await mediaDevices.getUserMedia({
      audio: true,
      video: typeParam === 'video' ? { facingMode: 'user', width: 640, height: 480 } : false,
    });
    setLocalStream(stream);
    return stream;
  }

  function createPC() {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    (pc as any).ontrack = (e: any) => {
      if (e.streams && e.streams[0]) setRemoteStream(e.streams[0]);
    };
    (pc as any).onicecandidate = (e: any) => {
      if (e.candidate && other) {
        useWebSocket.getState().send('webrtc_ice', {
          callId,
          targetUserId: other.id,
          candidate: e.candidate,
        });
      }
    };
    pcRef.current = pc;
    return pc;
  }

  async function startOutgoing() {
    try {
      const stream = await getMedia();
      const pc = createPC();
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', 'Не удалось получить доступ к камере/микрофону');
      endCall();
    }
  }

  async function acceptIncoming() {
    try {
      await apiPost(`/api/v1/calls/${callId}/accept`, {});
      await startOutgoing();
    } catch (e) {
      endCall();
    }
  }

  async function createOffer() {
    if (!pcRef.current || !other) return;
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    useWebSocket.getState().send('webrtc_offer', {
      callId,
      targetUserId: other.id,
      sdp: offer.sdp,
    });
  }

  async function handleOffer(payload: any) {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription({ type: 'offer', sdp: payload.sdp });
    const stream = await getMedia();
    stream.getTracks().forEach((t) => pcRef.current!.addTrack(t, stream));
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    useWebSocket.getState().send('webrtc_answer', {
      callId,
      targetUserId: payload.fromUserId,
      sdp: answer.sdp,
    });
    setStatus('connected');
  }

  async function handleAnswer(payload: any) {
    if (!pcRef.current) return;
    await pcRef.current.setRemoteDescription({ type: 'answer', sdp: payload.sdp });
    setStatus('connected');
  }

  async function handleIce(payload: any) {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(payload.candidate);
    } catch (e) {
      console.warn('addIceCandidate', e);
    }
  }

  function endCall() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    if (other) {
      useWebSocket.getState().send('call_ended', { callId, targetUserId: other.id });
    }
    apiPost(`/api/v1/calls/${callId}/end`, {}).catch(() => {});
    cleanup();
    setStatus('ended');
    setTimeout(() => router.back(), 500);
  }

  function cleanup() {
    if (pcRef.current) {
      try { pcRef.current.close(); } catch {}
      pcRef.current = null;
    }
    if (localStream) {
      try { localStream.getTracks().forEach((t) => t.stop()); } catch {}
    }
    if (remoteStream) {
      try { remoteStream.getTracks().forEach((t) => t.stop()); } catch {}
    }
    setLocalStream(null);
    setRemoteStream(null);
  }

  function toggleMute() {
    if (!localStream) return;
    const t = localStream.getAudioTracks()[0];
    if (t) t.enabled = !t.enabled;
    setMuted(!t.enabled);
  }

  function toggleCamera() {
    if (!localStream) return;
    const t = localStream.getVideoTracks()[0];
    if (t) t.enabled = !t.enabled;
    setCameraOn(t.enabled);
  }

  async function reject() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try { await apiPost(`/api/v1/calls/${callId}/reject`, {}); } catch {}
    cleanup();
    setStatus('ended');
    setTimeout(() => router.back(), 200);
  }

  const isVideo = typeParam === 'video';
  const otherName = other?.displayName || other?.username || 'Собеседник';

  return (
    <View style={[styles.container, { backgroundColor: isVideo ? '#000' : theme.bg }]}>
      <Stack.Screen options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }} />
      {isVideo && remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} style={StyleSheet.absoluteFill} objectFit="cover" />
      ) : null}
      {isVideo && !remoteStream ? (
        <View style={styles.bgAvatar}>
          <View style={[styles.bigAvatar, { backgroundColor: theme.accent }]}>
            <ThemedText variant="largeTitle" style={{ color: '#fff' }}>
              {otherName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        </View>
      ) : null}

      {isVideo && localStream && cameraOn ? (
        <View style={styles.localVideo}>
          <RTCView streamURL={localStream.toURL()} style={StyleSheet.absoluteFill} objectFit="cover" />
        </View>
      ) : null}

      <View style={[styles.topBar, { backgroundColor: isVideo ? 'rgba(0,0,0,0.4)' : 'transparent' }]}>
        {status === 'connected' && (
          <ThemedText variant="headline" color="inverted" style={{ color: '#fff' }}>
            {Math.floor(duration / 60)}:{String(duration % 60).padStart(2, '0')}
          </ThemedText>
        )}
        {status === 'calling' && <ThemedText variant="headline" color="inverted" style={{ color: '#fff' }}>Вызов...</ThemedText>}
        {status === 'ringing' && <ThemedText variant="headline" color="inverted" style={{ color: '#fff' }}>Входящий звонок</ThemedText>}
        {status === 'connecting' && <ThemedText variant="headline" color="inverted" style={{ color: '#fff' }}>Подключение...</ThemedText>}
        <ThemedText variant="title2" color="inverted" style={{ color: '#fff', marginTop: 4 }}>
          {otherName}
        </ThemedText>
        <ThemedText variant="caption1" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
          {isVideo ? 'Видеозвонок' : 'Аудиозвонок'}
        </ThemedText>
      </View>

      {!isVideo && (
        <View style={styles.audioAvatar}>
          <View style={[styles.bigAvatar, { backgroundColor: theme.accent }]}>
            <ThemedText variant="largeTitle" style={{ color: '#fff' }}>
              {otherName.charAt(0).toUpperCase()}
            </ThemedText>
          </View>
        </View>
      )}

      <View style={styles.controls}>
        {status === 'ringing' ? (
          <>
            <Pressable onPress={reject} style={[styles.controlBtn, { backgroundColor: '#ff3b30' }]}>
              <Icon name="PhoneOff" size={28} color="#fff" />
            </Pressable>
            <Pressable onPress={acceptIncoming} style={[styles.controlBtn, { backgroundColor: '#34c759' }]}>
              <Icon name="Phone" size={28} color="#fff" />
            </Pressable>
          </>
        ) : (
          <>
            <Pressable onPress={toggleMute} style={[styles.controlBtn, { backgroundColor: muted ? '#fff' : 'rgba(255,255,255,0.2)' }]}>
              <Icon name={muted ? 'MicOff' : 'Mic'} size={24} color={muted ? '#000' : '#fff'} />
            </Pressable>
            {isVideo && (
              <Pressable onPress={toggleCamera} style={[styles.controlBtn, { backgroundColor: !cameraOn ? '#fff' : 'rgba(255,255,255,0.2)' }]}>
                <Icon name={cameraOn ? 'Video' : 'VideoOff'} size={24} color={!cameraOn ? '#000' : '#fff'} />
              </Pressable>
            )}
            <Pressable onPress={endCall} style={[styles.controlBtn, styles.endCallBtn]}>
              <Icon name="PhoneOff" size={28} color="#fff" />
            </Pressable>
            <Pressable onPress={() => setSpeaker(!speaker)} style={[styles.controlBtn, { backgroundColor: speaker ? '#fff' : 'rgba(255,255,255,0.2)' }]}>
              <Icon name="Volume2" size={24} color={speaker ? '#000' : '#fff'} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgAvatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  audioAvatar: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bigAvatar: { width: 160, height: 160, borderRadius: 80, alignItems: 'center', justifyContent: 'center' },
  topBar: { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', paddingVertical: Spacing.three },
  localVideo: { position: 'absolute', top: 100, right: 16, width: 100, height: 140, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  controls: { position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 20 },
  controlBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  endCallBtn: { backgroundColor: '#ff3b30', width: 70, height: 70, borderRadius: 35 },
});
