/**
 * Chat detail screen.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Alert, Clipboard } from 'react-native';
import {
  View,
  FlatList,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useHeaderHeight } from '@react-navigation/elements';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as Location from 'expo-location';
import * as Contacts from 'expo-contacts';
import { Audio } from 'expo-av';
import Animated, { FadeIn, FadeInUp, FadeInDown, LinearTransition, useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import MessageContextMenu, { type MessageAction } from '@/components/message-context-menu';
import AttachSheet, { type AttachAction } from '@/components/attach-sheet';
import VoiceRecorder from '@/components/voice-recorder';
import VoicePlayer from '@/components/voice-player';
import VideoNote from '@/components/video-note';
import PollMessage from '@/components/poll-message';
import TTLCountdown from '@/components/ttl-countdown';
import PollCreateModal from '@/components/poll-create-modal';
import TTLPicker from '@/components/ttl-picker';
import SwipeableMessage from '@/components/swipeable-message';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload, mediaUrl } from '@/api/client';
import { useAuth } from '@/store/auth';
import { useWebSocket } from '@/store/websocket';
import { useSettings, WALLPAPERS } from '@/store/settings';
import type { Chat, Message, ChatMember } from '@/types';
import { Image as RNImage, ImageBackground } from 'expo-image';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Number(id);
  const router = useRouter();
  const navigation = useNavigation();
  const theme = useTheme();
  const me = useAuth((s) => s.user);

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const lastTypingSentRef = useRef(0);

  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showAttachSheet, setShowAttachSheet] = useState(false);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showPollCreate, setShowPollCreate] = useState(false);
  const [ttl, setTtl] = useState<number | null>(null);
  const [showTTLPicker, setShowTTLPicker] = useState(false);

  const wallpaper = useSettings((s) => s.wallpaper);
  const wp = WALLPAPERS.find((w) => w.id === wallpaper) || WALLPAPERS[0];
  const useGradient = wallpaper !== 'none';

  const listRef = useRef<FlatList<Message>>(null);

  const loadChat = useCallback(async () => {
    try {
      const data = await apiGet<{ chat: Chat }>(`/api/v1/chats/${chatId}`);
      setChat(data.chat);
    } catch (e) {
      console.error(e);
    }
  }, [chatId]);

  const loadMessages = useCallback(
    async (reset = false) => {
      try {
        if (reset) {
          setLoading(true);
          setPage(0);
        } else {
          if (!hasMore || loadingMore) return;
          setLoadingMore(true);
        }
        const limit = 50;
        const data = await apiGet<{ messages: Message[] }>(`/api/v1/chats/${chatId}/messages?limit=${limit}&offset=${reset ? 0 : page * limit}`);
        const msgs = data.messages || [];
        if (reset) {
          setMessages(msgs);
        } else {
          setMessages((prev) => [...msgs, ...prev]);
        }
        setHasMore(msgs.length === limit);
        setPage((p) => (reset ? 1 : p + 1));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [chatId, page, hasMore, loadingMore],
  );

  useEffect(() => {
    loadChat();
    loadMessages(true);
  }, [chatId]);

  useEffect(() => {
    return () => { setSelectMode(false); setSelectedIds(new Set()); };
  }, []);

  const headerHeight = useHeaderHeight();

  useEffect(() => {
    const parent = navigation.getParent();
    if (!parent) return;
    parent.setOptions({ tabBarStyle: { display: 'none' } });
    return () => {
      parent.setOptions({
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          borderTopWidth: 0.5,
          borderTopColor: theme.hairline,
          backgroundColor: 'transparent',
          elevation: 0,
        },
      });
    };
  }, [navigation, theme.hairline]);

  useEffect(() => {
    const offNew = useWebSocket.getState().on('new_message', (payload) => {
      if (payload?.chatId !== chatId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [...prev, payload as Message];
      });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    });
    const offEdit = useWebSocket.getState().on('message_edited', (payload) => {
      if (payload?.chatId !== chatId) return;
      setMessages((prev) => prev.map((m) =>
        m.id === payload.id ? { ...m, content: payload.content, editedAt: payload.editedAt } : m
      ));
    });
    const offDel = useWebSocket.getState().on('message_deleted', (payload) => {
      if (payload?.chatId !== chatId) return;
      setMessages((prev) => prev.filter((m) => m.id !== payload.id));
    });
    const offReact = useWebSocket.getState().on('message_reaction', (payload) => {
      if (payload?.chatId !== chatId) return;
      setMessages((prev) => prev.map((m) => {
        if (m.id !== payload.id) return m;
        const existing = m.reactions || [];
        let next: typeof existing;
        if (payload.active) {
          if (existing.some((r) => r.userId === payload.userId && r.emoji === payload.emoji)) {
            next = existing;
          } else {
            next = [...existing, { messageId: payload.id, userId: payload.userId, emoji: payload.emoji, createdAt: payload.createdAt }];
          }
        } else {
          next = existing.filter((r) => !(r.userId === payload.userId && r.emoji === payload.emoji));
        }
        return { ...m, reactions: next };
      }));
    });
    const offTyping = useWebSocket.getState().on('user_typing', (payload) => {
      if (payload?.chatId !== chatId) return;
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (payload.isTyping) next.add(payload.userId);
        else next.delete(payload.userId);
        return next;
      });
      if (payload.isTyping) {
        setTimeout(() => {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            next.delete(payload.userId);
            return next;
          });
        }, 5000);
      }
    });
    return () => { offNew(); offEdit(); offDel(); offReact(); offTyping(); };
  }, [chatId]);

  useEffect(() => {
    if (messages.length > 0 && page === 1) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [page, messages.length]);

  useEffect(() => {
    if (chatId && chat) {
      apiPost(`/api/v1/chats/${chatId}/read`, {}).catch(() => {});
    }
  }, [chatId, messages.length]);

  const chatTitle =
    chat?.name ||
    (chat?.members?.find((m) => m.userId !== me?.id)?.displayName) ||
    'Чат';

  const otherMember: ChatMember | undefined = chat?.members?.find((m) => m.userId !== me?.id);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInput('');

    if (editingMessage) {
      const msgId = editingMessage.id;
      const original = editingMessage.content;
      setEditingMessage(null);
      try {
        await apiPatch(`/api/v1/messages/${msgId}`, { content: text });
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, content: text, editedAt: new Date().toISOString() } : m));
      } catch (e) {
        console.error(e);
        Alert.alert('Ошибка', 'Не удалось отредактировать');
        setInput(text);
      } finally {
        setSending(false);
      }
      return;
    }

    const replyToId = replyingTo?.id ?? null;
    const expiresInSec = ttl;
    setReplyingTo(null);
    setTtl(null);
    try {
      const msg = await apiPost<Message>(`/api/v1/chats/${chatId}/messages`, {
        type: 'text',
        content: text,
        replyToId,
        expiresInSec,
      });
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  async function handleContextAction(action: MessageAction, emoji?: string) {
    if (!actionMessage) return;
    const msg = actionMessage;
    setActionMessage(null);

    switch (action) {
      case 'reply':
        setReplyingTo(msg);
        setEditingMessage(null);
        break;
      case 'copy':
        if (msg.content) {
          Clipboard.setString(msg.content);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        break;
      case 'select':
        setSelectMode(true);
        setSelectedIds(new Set([msg.id]));
        break;
      case 'edit':
        if (msg.type === 'text') {
          setEditingMessage(msg);
          setReplyingTo(null);
          setInput(msg.content || '');
        }
        break;
      case 'delete':
        try {
          await apiDelete(`/api/v1/messages/${msg.id}`);
          setMessages((prev) => prev.filter((m) => m.id !== msg.id));
        } catch (e) {
          console.error(e);
          Alert.alert('Ошибка', 'Не удалось удалить');
        }
        break;
      case 'pin':
        try {
          if (chat?.pinnedMessageId === msg.id) {
            await apiDelete(`/api/v1/chats/${chatId}/pin-message`);
            setChat((c) => c ? { ...c, pinnedMessageId: null } : c);
          } else {
            await apiPost(`/api/v1/chats/${chatId}/pin-message`, { messageId: msg.id });
            setChat((c) => c ? { ...c, pinnedMessageId: msg.id } : c);
          }
        } catch (e) {
          console.error(e);
          Alert.alert('Ошибка', 'Не удалось закрепить');
        }
        break;
      case 'react':
        if (!emoji) return;
        try {
          await apiPost(`/api/v1/messages/${msg.id}/reactions`, { emoji });
        } catch (e) {
          try {
            await apiDelete(`/api/v1/messages/${msg.id}/reactions?emoji=${encodeURIComponent(emoji)}`);
          } catch {}
        }
        break;
      case 'forward':
        setForwardingMessage(msg);
        router.push({
          pathname: '/(modals)/forward',
          params: {
            id: String(msg.id),
            type: msg.type,
            content: msg.content || '',
            mediaUrl: msg.mediaUrl || '',
            mediaMeta: msg.mediaMeta || '',
          },
        });
        break;
    }
  }

  async function pickImage() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (res.canceled || !res.assets[0]) return;
    await uploadFile(res.assets[0].uri, res.assets[0].mimeType ?? 'image/jpeg', 'image');
  }

  async function pickVideo() {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (res.canceled || !res.assets[0]) return;
    await uploadFile(res.assets[0].uri, res.assets[0].mimeType ?? 'video/mp4', 'video', res.assets[0].fileName ?? undefined);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Нужен доступ', 'Разрешите доступ к камере в настройках');
      return;
    }
    const res = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (res.canceled || !res.assets[0]) return;
    await uploadFile(res.assets[0].uri, res.assets[0].mimeType ?? 'image/jpeg', 'image');
  }

  async function pickDocument() {
    const res = await DocumentPicker.getDocumentAsync({});
    if (res.canceled || !res.assets[0]) return;
    await uploadFile(res.assets[0].uri, res.assets[0].mimeType ?? 'application/octet-stream', 'file', res.assets[0].name);
  }

  async function sendLocation() {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Нужен доступ', 'Разрешите доступ к геолокации');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const meta = JSON.stringify({ lat: loc.coords.latitude, lon: loc.coords.longitude, accuracy: loc.coords.accuracy });
      const msg = await apiPost<Message>(`/api/v1/chats/${chatId}/messages`, {
        type: 'location',
        content: meta,
        mediaMeta: meta,
      });
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', 'Не удалось получить местоположение');
    }
  }

  async function sendContact() {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Нужен доступ', 'Разрешите доступ к контактам');
        return;
      }
      const { data } = await Contacts.getContactsAsync({ fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers] });
      if (data.length === 0) {
        Alert.alert('Нет контактов', 'Контактная книга пуста');
        return;
      }
      const top = data.slice(0, 10).filter((c: any) => c.phoneNumbers && c.phoneNumbers[0]);
      if (top.length === 0) {
        Alert.alert('Нет контактов', 'Нет контактов с номерами телефона');
        return;
      }
      Alert.alert(
        'Выберите контакт',
        undefined,
        [
          ...top.map((c: any) => ({
            text: `${c.name} (${c.phoneNumbers[0].number})`,
            onPress: () => sendContactMessage(c),
          })),
          { text: 'Отмена', style: 'cancel' },
        ],
      );
    } catch (e) {
      console.error(e);
    }
  }

  async function sendContactMessage(contact: any) {
    try {
      const phone = contact.phoneNumbers?.[0]?.number || '';
      const msg = await apiPost<Message>(`/api/v1/chats/${chatId}/messages`, {
        type: 'contact',
        content: contact.name,
        mediaMeta: JSON.stringify({ name: contact.name, phone }),
      });
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      console.error(e);
    }
  }

  async function sendVoice(uri: string, durationMs: number) {
    try {
      const form = new FormData();
      form.append('file', { uri, type: 'audio/m4a', name: `voice-${Date.now()}.m4a` } as any);
      const uploaded = await apiUpload<{ url: string }>('/api/v1/media/upload', form);
      const msg = await apiPost<Message>(`/api/v1/chats/${chatId}/messages`, {
        type: 'voice',
        content: '🎤 Голосовое сообщение',
        mediaUrl: uploaded.url,
        mediaMeta: JSON.stringify({ durationMs }),
        expiresInSec: ttl,
      });
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      console.error(e);
    }
  }

  async function sendVideoNote(uri: string, durationMs: number) {
    try {
      const form = new FormData();
      form.append('file', { uri, type: 'video/mp4', name: `vnote-${Date.now()}.mp4` } as any);
      const uploaded = await apiUpload<{ url: string }>('/api/v1/media/upload', form);
      const msg = await apiPost<Message>(`/api/v1/chats/${chatId}/messages`, {
        type: 'video_note',
        content: '⭕ Видеосообщение',
        mediaUrl: uploaded.url,
        mediaMeta: JSON.stringify({ durationMs }),
        expiresInSec: ttl,
      });
      setMessages((prev) => [...prev, msg]);
      setTtl(null);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      console.error(e);
    }
  }

  async function recordVideoNote() {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Нужен доступ', 'Разрешите доступ к камере');
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        quality: 0.7,
        videoMaxDuration: 60,
      });
      if (res.canceled || !res.assets[0]) return;
      const asset = res.assets[0];
      const durMs = asset.duration ? Math.floor(asset.duration * 1000) : 0;
      await sendVideoNote(asset.uri, durMs);
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', 'Не удалось записать видеосообщение');
    }
  }

  async function createPoll(data: { question: string; isAnonymous: boolean; isMultiple: boolean; options: string[] }) {
    try {
      const msg = await apiPost<Message>(`/api/v1/chats/${chatId}/messages`, {
        type: 'poll',
        content: data.question,
        poll: {
          question: data.question,
          isAnonymous: data.isAnonymous,
          isMultiple: data.isMultiple,
          options: data.options,
        },
      });
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', 'Не удалось создать опрос');
    }
  }

  async function handleAttachAction(action: 'photo' | 'camera' | 'video' | 'video_note' | 'poll' | 'document' | 'location' | 'contact' | 'voice') {
    switch (action) {
      case 'photo': await pickImage(); break;
      case 'camera': await takePhoto(); break;
      case 'video': await pickVideo(); break;
      case 'video_note': await recordVideoNote(); break;
      case 'poll': setShowPollCreate(true); break;
      case 'document': await pickDocument(); break;
      case 'location': await sendLocation(); break;
      case 'contact': await sendContact(); break;
      case 'voice': setShowVoiceRecorder(true); break;
    }
  }

  async function uploadFile(uri: string, mimeType: string, type: 'image' | 'video' | 'file', filename?: string) {
    try {
      const form = new FormData();
      form.append('file', {
        uri,
        type: mimeType,
        name: filename || uri.split('/').pop() || 'file',
      } as any);
      const uploaded = await apiUpload<{ url: string }>('/api/v1/media/upload', form);
      const msg = await apiPost<Message>(`/api/v1/chats/${chatId}/messages`, {
        type,
        content: type === 'image' ? '🖼' : type === 'video' ? '🎥' : '📎',
        mediaUrl: uploaded.url,
      });
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      console.error(e);
      Alert.alert('Ошибка', 'Не удалось отправить файл');
    }
  }

  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isMe = item.senderId === me?.id;
    const prev = messages[index - 1];
    const showName = !isMe && chat?.type !== 'private' && (!prev || prev.senderId !== item.senderId);
    const isPinned = chat?.pinnedMessageId === item.id;

    if (item.type === 'system') {
      return (
        <Animated.View entering={FadeIn.duration(220)} style={styles.systemRow}>
          <ThemedText variant="caption1" color="secondary" align="center">
            {item.content}
          </ThemedText>
        </Animated.View>
      );
    }

    const showDateHeader = !prev || !isSameDay(prev.createdAt, item.createdAt);
    const dateLabel = formatDateLabel(item.createdAt);

    return (
      <Animated.View
        entering={FadeInUp.duration(180)}
        layout={LinearTransition.springify()}
        style={{ marginBottom: 4 }}
      >
      {showDateHeader && (
        <View style={styles.dateHeader}>
          <View style={[styles.datePill, { backgroundColor: theme.bgSecondary }]}>
            <ThemedText variant="caption1" color="secondary" style={{ fontWeight: '600' }}>{dateLabel}</ThemedText>
          </View>
        </View>
      )}
      <View style={[styles.bubbleRow, isMe && styles.bubbleRowMe]}>
        {!isMe && chat?.type !== 'private' ? (
          <View style={styles.bubbleAvatar}>
            {showName ? (
              <Avatar username={item.sender?.username || `u${item.senderId}`} size={28} />
            ) : (
              <View style={{ width: 28 }} />
            )}
          </View>
        ) : null}
        <SwipeableMessage onReply={() => setReplyingTo(item)}>
        <View style={{ maxWidth: '75%' }}>
          {showName ? (
            <ThemedText variant="caption1" color="secondary" style={styles.senderName}>
              {item.sender?.displayName}
            </ThemedText>
          ) : null}
          <Pressable
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (selectMode) {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                });
              } else {
                setActionMessage(item);
              }
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (selectMode) {
                setSelectedIds((prev) => {
                  const next = new Set(prev);
                  if (next.has(item.id)) next.delete(item.id);
                  else next.add(item.id);
                  return next;
                });
              } else if (replyingTo?.id === item.id) {
                setReplyingTo(null);
              } else {
                apiPost(`/api/v1/messages/${item.id}/reactions`, { emoji: '❤️' }).catch(() => {});
              }
            }}
            delayLongPress={300}
            style={[
              styles.bubble,
              isMe
                ? { backgroundColor: theme.sent, borderBottomRightRadius: 4 }
                : { backgroundColor: theme.received, borderBottomLeftRadius: 4 },
            ]}
          >
            {isPinned && (
              <View style={styles.pinIndicator}>
                <Icon name="Pin" size={10} color={isMe ? theme.sentText : theme.accent} />
                <ThemedText variant="caption2" style={{ color: isMe ? theme.sentText : theme.accent, marginLeft: 4 }}>
                  Закреплено
                </ThemedText>
              </View>
            )}
            {item.replyToId && (() => {
              const reply = messages.find((m) => m.id === item.replyToId);
              if (!reply) return null;
              return (
                <Pressable
                  onPress={() => {
                    const idx = messages.findIndex((m) => m.id === reply.id);
                    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                  }}
                  style={[styles.replyQuote, { borderLeftColor: isMe ? 'rgba(255,255,255,0.6)' : theme.accent }]}
                >
                  <ThemedText variant="caption1" style={{ color: isMe ? theme.sentText : theme.accent, fontWeight: '600' }}>
                    {reply.sender?.displayName || (reply.senderId === me?.id ? 'Вы' : `User ${reply.senderId}`)}
                  </ThemedText>
                  <ThemedText
                    variant="caption1"
                    numberOfLines={1}
                    style={{ color: isMe ? 'rgba(255,255,255,0.85)' : theme.textSecondary }}
                  >
                    {reply.type === 'image' ? '🖼 Фото' : reply.type === 'voice' ? '🎤 Голосовое' : reply.type === 'video' ? '🎥 Видео' : reply.type === 'location' ? '📍 Местоположение' : reply.type === 'contact' ? '👤 Контакт' : (reply.content || '...')}
                  </ThemedText>
                </Pressable>
              );
            })()}
            {item.type === 'voice' && item.mediaUrl ? (
              <VoicePlayer
                uri={mediaUrl(item.mediaUrl) || ''}
                durationSec={(() => {
                  const m = parseMeta(item.mediaMeta);
                  return Math.floor((m.durationMs || 0) / 1000);
                })()}
                isMe={isMe}
              />
            ) : item.type === 'video_note' && item.mediaUrl ? (
              <VideoNote
                uri={item.mediaUrl}
                durationSec={Math.floor((parseMeta(item.mediaMeta).durationMs || 0) / 1000) || 5}
                isMe={isMe}
                accentColor={isMe ? 'rgba(255,255,255,0.85)' : theme.accent}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (selectMode) {
                    setSelectedIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(item.id)) next.delete(item.id);
                      else next.add(item.id);
                      return next;
                    });
                  } else {
                    setActionMessage(item);
                  }
                }}
              />
            ) : item.type === 'poll' ? (
              <PollMessage
                pollId={(() => {
                  const m = parseMeta(item.mediaMeta);
                  return m.pollId || 0;
                })()}
                isMe={isMe}
              />
            ) : item.type === 'location' ? (
              <Pressable
                onPress={() => {
                  const m = parseMeta(item.mediaMeta) || parseMeta(item.content);
                  Alert.alert('Местоположение', `Широта: ${m.lat?.toFixed?.(6) ?? m.lat}\nДолгота: ${m.lon?.toFixed?.(6) ?? m.lon}`);
                }}
                style={styles.locationBubble}
              >
                <Icon name="MapPin" size={32} color={isMe ? theme.sentText : theme.accent} />
                <ThemedText variant="subhead" style={{ color: isMe ? theme.sentText : theme.receivedText, marginTop: 6, fontWeight: '600' }}>
                  Местоположение
                </ThemedText>
                <ThemedText variant="caption1" style={{ color: isMe ? 'rgba(255,255,255,0.85)' : theme.textSecondary, marginTop: 2 }}>
                  {(() => {
                    const m = parseMeta(item.mediaMeta) || parseMeta(item.content);
                    return m.lat != null ? `${Number(m.lat).toFixed(4)}, ${Number(m.lon).toFixed(4)}` : '';
                  })()}
                </ThemedText>
              </Pressable>
            ) : item.type === 'contact' ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 200 }}>
                <View style={[styles.contactIcon, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : theme.accentMuted }]}>
                  <Icon name="User" size={24} color={isMe ? theme.sentText : theme.accent} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <ThemedText variant="headline" style={{ color: isMe ? theme.sentText : theme.receivedText }}>
                    {item.content}
                  </ThemedText>
                  <ThemedText variant="caption1" style={{ color: isMe ? 'rgba(255,255,255,0.85)' : theme.textSecondary }}>
                    {parseMeta(item.mediaMeta).phone || ''}
                  </ThemedText>
                </View>
              </View>
            ) : item.type === 'image' && item.mediaUrl ? (
              <View>
                {mediaUrl(item.mediaUrl) ? (
                  <Pressable
                    onPress={() => {
                      const idx = messages.findIndex((m) => m.id === item.id);
                      router.push({ pathname: '/(modals)/image-viewer', params: { uri: mediaUrl(item.mediaUrl) || '', index: String(idx), chatId: String(chatId) } });
                    }}
                  >
                    <RNImage
                      source={{ uri: mediaUrl(item.mediaUrl)! }}
                      style={{ width: 220, height: 220, borderRadius: 12, marginBottom: 4 }}
                      resizeMode="cover"
                    />
                  </Pressable>
                ) : null}
                {item.content && item.content !== '🖼' ? (
                  <ThemedText variant="body" style={{ color: isMe ? theme.sentText : theme.receivedText }}>
                    {item.content}
                  </ThemedText>
                ) : null}
              </View>
            ) : item.type === 'video' && item.mediaUrl ? (
              <View style={{ width: 220, height: 200, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="Video" size={48} color="#fff" />
                <ThemedText variant="caption1" color="inverted" style={{ color: '#fff', marginTop: 8 }}>
                  Видео
                </ThemedText>
              </View>
            ) : item.mediaUrl ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 180 }}>
                <View style={[styles.fileIcon, { backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : theme.accentMuted }]}>
                  <Icon name="FileText" size={24} color={isMe ? theme.sentText : theme.accent} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <ThemedText variant="subhead" style={{ color: isMe ? theme.sentText : theme.receivedText }}>
                    {item.content || 'Файл'}
                  </ThemedText>
                  <ThemedText variant="caption1" style={{ color: isMe ? 'rgba(255,255,255,0.85)' : theme.textSecondary }}>
                    Документ
                  </ThemedText>
                </View>
              </View>
            ) : (
              <ThemedText
                variant="body"
                style={{ color: isMe ? theme.sentText : theme.receivedText }}
              >
                {item.content}
              </ThemedText>
            )}
            <ThemedText
              variant="caption2"
              style={{ color: isMe ? 'rgba(255,255,255,0.7)' : theme.textTertiary, marginTop: 2 }}
            >
              {formatTime(item.createdAt)}
              {item.editedAt ? ' · изм.' : ''}
              {isMe ? ' ✓✓' : ''}
            </ThemedText>
            {item.expiresAt && <TTLCountdown expiresAt={item.expiresAt} isMe={isMe} />}
          </Pressable>
          {item.reactions && item.reactions.length > 0 && (
            <Animated.View entering={FadeInDown.duration(160)} style={[styles.reactions, isMe ? styles.reactionsMe : styles.reactionsThem]}>
              {Object.entries(
                item.reactions.reduce<Record<string, number>>((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <Pressable
                  key={emoji}
                  onPress={() => handleContextAction('react', emoji)}
                  style={[styles.reactionChip, { backgroundColor: theme.bgSecondary }]}
                >
                  <ThemedText variant="caption2">{emoji}</ThemedText>
                  {count > 1 && (
                    <ThemedText variant="caption2" style={{ color: theme.textSecondary, marginLeft: 2 }}>
                      {count}
                    </ThemedText>
                  )}
                </Pressable>
              ))}
            </Animated.View>
          )}
        </View>
        </SwipeableMessage>
      </View>
      </Animated.View>
    );
  }

  if (loading || !chat) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: chatTitle,
          headerTitle: () => (
            <Pressable onPress={() => router.push({ pathname: '/(modals)/chat-info', params: { id: String(chatId) } })} style={styles.headerTitle}>
              <View>
                <ThemedText variant="headline" numberOfLines={1}>
                  {chatTitle}
                </ThemedText>
                {typingUsers.size > 0 ? (
                  <ThemedText variant="caption1" color="accent">печатает...</ThemedText>
                ) : otherMember?.isOnline ? (
                  <ThemedText variant="caption1" color="success">в сети</ThemedText>
                ) : null}
              </View>
            </Pressable>
          ),
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.accent,
          headerShadowVisible: false,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {chat.type === 'private' && (
                <Pressable onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  apiPost(`/api/v1/chats/${chatId}/calls`, { type: 'audio' })
                    .then((data: any) => {
                      if (data.call?.id) router.push({ pathname: '/(modals)/call', params: { callId: data.call.id, chatId: String(chatId), type: 'audio', outgoing: '1' } });
                    })
                    .catch((e) => Alert.alert('Ошибка', e?.message || 'Не удалось'));
                }} style={{ padding: 4 }}>
                  <Icon name="Phone" size={22} color={theme.accent} />
                </Pressable>
              )}
              <Pressable onPress={() => setShowSearch(!showSearch)} style={{ padding: 4 }}>
                <Icon name="Search" size={22} color={theme.accent} />
              </Pressable>
            </View>
          ),
        }}
      />
      <SafeAreaView edges={['bottom']} style={[styles.container]}>
        {useGradient ? (
          <ImageBackground
            source={undefined}
            style={StyleSheet.absoluteFill}
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: wp.light[0] }]}>
              <View style={[StyleSheet.absoluteFill, { backgroundColor: wp.light[1], opacity: 0.4 }]} />
            </View>
          </ImageBackground>
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.bg }]} />
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={headerHeight}
          style={{ flex: 1 }}
        >
          {showSearch && (
            <View style={[styles.searchBar, { backgroundColor: theme.bgSecondary, borderBottomColor: theme.hairline }]}>
              <Icon name="Search" size={16} color={theme.textSecondary} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Поиск в чате"
                placeholderTextColor={theme.textPlaceholder}
                autoFocus
                style={[styles.searchInput, { color: theme.text }]}
              />
              <Pressable onPress={() => { setShowSearch(false); setSearchQuery(''); }} style={{ padding: 4 }}>
                <Icon name="X" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
          )}
          {chat.pinnedMessageId && (
            <View style={[styles.pinnedBanner, { backgroundColor: theme.bgSecondary, borderBottomColor: theme.hairline }]}>
              <Icon name="Pin" size={14} color={theme.accent} />
              <View style={{ flex: 1, marginLeft: Spacing.two }}>
                <ThemedText variant="caption1" style={{ color: theme.accent, fontWeight: '600' }}>
                  Закреплённое сообщение
                </ThemedText>
                <ThemedText variant="footnote" numberOfLines={1} color="secondary">
                  {(() => {
                    const m = messages.find((mm) => mm.id === chat.pinnedMessageId);
                    if (!m) return 'Загружается...';
                    const sender = m.sender?.displayName || m.sender?.username || '';
                    return `${sender}: ${m.content || (m.type !== 'text' ? `📎 ${m.type}` : '')}`;
                  })()}
                </ThemedText>
              </View>
              <Pressable
                onPress={() => {
                  const idx = messages.findIndex((m) => m.id === chat.pinnedMessageId);
                  if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true, viewPosition: 0.5 });
                }}
                style={styles.pinJump}
              >
                <Icon name="ChevronRight" size={16} color={theme.accent} />
              </Pressable>
            </View>
          )}
          <FlatList
            ref={listRef}
            data={searchQuery.trim() ? messages.filter((m) => m.content?.toLowerCase().includes(searchQuery.toLowerCase())) : messages}
            keyExtractor={(item, index) => item.id != null ? `m-${item.id}` : `idx-${index}-${item.createdAt || ''}`}
            renderItem={renderMessage}
            inverted={false}
            contentContainerStyle={{ paddingVertical: Spacing.three }}
            onEndReached={() => loadMessages(false)}
            onEndReachedThreshold={0.3}
            onScroll={(e) => {
              const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
              const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
              setShowScrollDown(distanceFromBottom > 200);
            }}
            scrollEventThrottle={64}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={theme.accent} style={{ paddingVertical: Spacing.four }} />
              ) : null
            }
          />

          {showScrollDown && (
            <Pressable
              onPress={() => listRef.current?.scrollToEnd({ animated: true })}
              style={[styles.scrollDownBtn, { backgroundColor: theme.bgSecondary, borderColor: theme.hairline }]}
            >
              <Icon name="ChevronRight" size={18} color={theme.accent} style={{ transform: [{ rotate: '90deg' }] }} />
            </Pressable>
          )}

          {(replyingTo || editingMessage) && (
            <View style={[styles.replyEditBar, { backgroundColor: theme.bgSecondary, borderTopColor: theme.hairline }]}>
              {editingMessage ? (
                <View style={{ flex: 1 }}>
                  <ThemedText variant="caption1" style={{ color: theme.accent, fontWeight: '600' }}>
                    Редактирование
                  </ThemedText>
                  <ThemedText variant="caption1" numberOfLines={1} color="secondary">
                    {editingMessage.content}
                  </ThemedText>
                </View>
              ) : replyingTo ? (
                <View style={{ flex: 1 }}>
                  <ThemedText variant="caption1" style={{ color: theme.accent, fontWeight: '600' }}>
                    Ответ {replyingTo.sender?.displayName || replyingTo.sender?.username || ''}
                  </ThemedText>
                  <ThemedText variant="caption1" numberOfLines={1} color="secondary">
                    {replyingTo.content || (replyingTo.type !== 'text' ? `📎 ${replyingTo.type}` : '')}
                  </ThemedText>
                </View>
              ) : null}
              <Pressable
                onPress={() => { setReplyingTo(null); setEditingMessage(null); setInput(''); }}
                style={styles.cancelBtn}
              >
                <Icon name="X" size={18} color={theme.textSecondary} />
              </Pressable>
            </View>
          )}

          {selectMode ? (
            <View style={[styles.toolbar, { backgroundColor: theme.bg, borderTopColor: theme.hairline }]}>
              <Pressable
                onPress={() => { setSelectMode(false); setSelectedIds(new Set()); }}
                style={({ pressed }) => [styles.toolbarBtn, { opacity: pressed ? 0.5 : 1 }]}
              >
                <Icon name="X" size={22} color={theme.accent} />
              </Pressable>
              <ThemedText variant="headline" style={{ flex: 1, marginLeft: 8 }}>
                {selectedIds.size === 0 ? 'Выберите сообщения' : `Выбрано: ${selectedIds.size}`}
              </ThemedText>
              <Pressable
                onPress={async () => {
                  if (selectedIds.size === 0) return;
                  Alert.alert('Удалить сообщения?', `Будет удалено: ${selectedIds.size}`, [
                    { text: 'Отмена', style: 'cancel' },
                    {
                      text: 'Удалить', style: 'destructive', onPress: async () => {
                        const ids = Array.from(selectedIds);
                        for (const id of ids) {
                          try { await apiDelete(`/api/v1/messages/${id}`); } catch {}
                        }
                        setMessages((prev) => prev.filter((m) => !selectedIds.has(m.id)));
                        setSelectMode(false);
                        setSelectedIds(new Set());
                      },
                    },
                  ]);
                }}
                style={({ pressed }) => [styles.toolbarBtn, { opacity: selectedIds.size === 0 ? 0.3 : pressed ? 0.5 : 1 }]}
                disabled={selectedIds.size === 0}
              >
                <Icon name="Trash2" size={22} color={theme.error} />
              </Pressable>
              <Pressable
                onPress={async () => {
                  if (selectedIds.size === 0) return;
                  const first = messages.find((m) => selectedIds.has(m.id));
                  if (first) {
                    setForwardingMessage(first);
                    setSelectMode(false);
                    setSelectedIds(new Set());
                    router.push({ pathname: '/(modals)/forward', params: { messageId: String(first.id) } });
                  }
                }}
                style={({ pressed }) => [styles.toolbarBtn, { opacity: selectedIds.size === 0 ? 0.3 : pressed ? 0.5 : 1 }]}
                disabled={selectedIds.size === 0}
              >
                <Icon name="Share2" size={22} color={theme.accent} />
              </Pressable>
            </View>
          ) : (
          <View style={[styles.composer, { backgroundColor: useGradient ? 'rgba(255,255,255,0.85)' : theme.bg, borderTopColor: theme.hairline }]}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowAttachSheet(true);
              }}
              style={({ pressed }) => [styles.attachBtn, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}
            >
              <Icon name="Paperclip" size={22} color={theme.accent} />
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowTTLPicker(true);
              }}
              style={({ pressed }) => [styles.ttlBtn, { backgroundColor: ttl ? theme.accent : 'transparent', transform: [{ scale: pressed ? 0.9 : 1 }] }]}
            >
              <Icon name="Clock" size={18} color={ttl ? '#fff' : theme.textSecondary} />
            </Pressable>
            <View style={[styles.composerInput, { backgroundColor: theme.bgSecondary }]}>
              <TextInput
                value={input}
                onChangeText={(v) => {
                  setInput(v);
                  const now = Date.now();
                  if (now - lastTypingSentRef.current > 2000 && v.length > 0) {
                    lastTypingSentRef.current = now;
                    useWebSocket.getState().send('typing', { chatId, isTyping: true });
                  }
                }}
                placeholder="Сообщение"
                placeholderTextColor={theme.textPlaceholder}
                multiline
                style={[styles.composerTextInput, { color: theme.text }]}
                maxLength={4096}
                blurOnSubmit={false}
              />
            </View>
            {input.trim() ? (
              <Pressable
                onPress={send}
                disabled={sending}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: theme.accent, transform: [{ scale: pressed ? 0.85 : 1 }] },
                ]}
              >
                <Icon name="Send" size={18} color="#fff" />
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowVoiceRecorder(true);
                }}
                style={({ pressed }) => [
                  styles.sendBtn,
                  { backgroundColor: theme.accent, transform: [{ scale: pressed ? 0.85 : 1 }] },
                ]}
              >
                <Icon name="Mic" size={18} color="#fff" />
              </Pressable>
            )}
          </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
      <MessageContextMenu
        visible={!!actionMessage}
        message={actionMessage}
        isMe={actionMessage?.senderId === me?.id}
        isPinned={actionMessage ? chat?.pinnedMessageId === actionMessage.id : false}
        onClose={() => setActionMessage(null)}
        onAction={handleContextAction}
      />
      <AttachSheet
        visible={showAttachSheet}
        onClose={() => setShowAttachSheet(false)}
        onSelect={handleAttachAction}
      />
      <VoiceRecorder
        visible={showVoiceRecorder}
        onClose={() => setShowVoiceRecorder(false)}
        onSend={sendVoice}
      />
      <PollCreateModal
        visible={showPollCreate}
        onClose={() => setShowPollCreate(false)}
        onCreate={createPoll}
      />
      <TTLPicker
        visible={showTTLPicker}
        current={ttl}
        onClose={() => setShowTTLPicker(false)}
        onSelect={(s) => setTtl(s)}
      />
    </>
    </GestureHandlerRootView>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(a: string, b: string) {
  const da = new Date(a), db = new Date(b);
  return da.getFullYear() === db.getFullYear() && da.getMonth() === db.getMonth() && da.getDate() === db.getDate();
}

function formatDateLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (isSameDay(d.toISOString(), today.toISOString())) return 'Сегодня';
  if (isSameDay(d.toISOString(), yesterday.toISOString())) return 'Вчера';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
}

function parseMeta(s: string | null | undefined): Record<string, any> {
  if (!s) return {};
  try { return JSON.parse(s) || {}; } catch { return {}; }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { alignItems: 'center' },
  systemRow: { paddingVertical: Spacing.three, alignItems: 'center' },
  dateHeader: { alignItems: 'center', paddingVertical: Spacing.three },
  datePill: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  bubbleRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    marginVertical: 2,
    gap: Spacing.two,
  },
  bubbleRowMe: { justifyContent: 'flex-end' },
  bubbleAvatar: { width: 28, alignItems: 'flex-start' },
  senderName: { marginLeft: 4, marginBottom: 2 },
  bubble: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 18,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
    paddingBottom: Spacing.two,
    borderTopWidth: 0.5,
    gap: 4,
  },
  attachBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ttlBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composerInput: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    maxHeight: 120,
  },
  composerTextInput: {
    fontSize: 16, paddingHorizontal: 4, paddingVertical: Platform.OS === 'ios' ? 8 : 4, maxHeight: 120,
  },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  toolbarBtn: { padding: 8 },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyQuote: {
    borderLeftWidth: 2,
    paddingLeft: 8,
    paddingVertical: 2,
    marginBottom: 4,
  },
  reactions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  reactionsMe: { justifyContent: 'flex-end' },
  reactionsThem: { justifyContent: 'flex-start' },
  reactionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  replyEditBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderTopWidth: 0.5,
    gap: Spacing.two,
  },
  cancelBtn: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 0.5,
  },
  pinJump: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollDownBtn: {
    position: 'absolute',
    right: Spacing.four,
    bottom: 80,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  locationBubble: {
    width: 220,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  contactIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 0.5,
    gap: Spacing.two,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
});
