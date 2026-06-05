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
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import MessageContextMenu, { type MessageAction } from '@/components/message-context-menu';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { apiGet, apiPost, apiPatch, apiDelete, apiUpload, mediaUrl } from '@/api/client';
import { useAuth } from '@/store/auth';
import { useWebSocket } from '@/store/websocket';
import type { Chat, Message, ChatMember } from '@/types';
import { Image as RNImage } from 'react-native';

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
    setReplyingTo(null);
    try {
      const msg = await apiPost<Message>(`/api/v1/chats/${chatId}/messages`, {
        type: 'text',
        content: text,
        replyToId,
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

  async function pickDocument() {
    const res = await DocumentPicker.getDocumentAsync({});
    if (res.canceled || !res.assets[0]) return;
    await uploadFile(res.assets[0].uri, res.assets[0].mimeType ?? 'application/octet-stream', 'file', res.assets[0].name);
  }

  async function uploadFile(uri: string, mimeType: string, type: 'image' | 'file', filename?: string) {
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
        content: type === 'image' ? '🖼' : '📎',
        mediaUrl: uploaded.url,
      });
      setMessages((prev) => [...prev, msg]);
    } catch (e) {
      console.error(e);
    }
  }

  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isMe = item.senderId === me?.id;
    const prev = messages[index - 1];
    const showName = !isMe && chat?.type !== 'private' && (!prev || prev.senderId !== item.senderId);
    const isPinned = chat?.pinnedMessageId === item.id;

    if (item.type === 'system') {
      return (
        <View style={styles.systemRow}>
          <ThemedText variant="caption1" color="secondary" align="center">
            {item.content}
          </ThemedText>
        </View>
      );
    }

    return (
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
        <View style={{ maxWidth: '75%' }}>
          {showName ? (
            <ThemedText variant="caption1" color="secondary" style={styles.senderName}>
              {item.sender?.displayName}
            </ThemedText>
          ) : null}
          <Pressable
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setActionMessage(item);
            }}
            onPress={() => {
              if (replyingTo?.id === item.id) setReplyingTo(null);
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
            {item.replyTo && (
              <View style={[styles.replyQuote, { borderLeftColor: isMe ? 'rgba(255,255,255,0.6)' : theme.accent }]}>
                <ThemedText variant="caption1" style={{ color: isMe ? theme.sentText : theme.accent, fontWeight: '600' }}>
                  {item.replyTo.sender?.displayName || item.replyTo.sender?.username || `User ${item.replyTo.senderId}`}
                </ThemedText>
                <ThemedText
                  variant="caption1"
                  numberOfLines={1}
                  style={{ color: isMe ? 'rgba(255,255,255,0.85)' : theme.textSecondary }}
                >
                  {item.replyTo.content || (item.replyTo.type !== 'text' ? `📎 ${item.replyTo.type}` : '')}
                </ThemedText>
              </View>
            )}
            {item.mediaUrl ? (
              item.type === 'image' ? (
                <View>
                  {mediaUrl(item.mediaUrl) ? (
                    <RNImage
                      source={{ uri: mediaUrl(item.mediaUrl)! }}
                      style={{ width: 220, height: 220, borderRadius: 12, marginBottom: 4 }}
                      resizeMode="cover"
                    />
                  ) : null}
                  {item.content && item.content !== '🖼' ? (
                    <ThemedText variant="body" style={{ color: isMe ? theme.sentText : theme.receivedText }}>
                      {item.content}
                    </ThemedText>
                  ) : null}
                </View>
              ) : (
                <ThemedText variant="body" style={{ color: isMe ? theme.sentText : theme.receivedText }}>
                  {item.content || '📎 Файл'} {item.mediaUrl ? '↗' : ''}
                </ThemedText>
              )
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
              {isMe ? (item.id ? ' ✓✓' : ' ✓') : ''}
            </ThemedText>
          </Pressable>
          {item.reactions && item.reactions.length > 0 && (
            <View style={[styles.reactions, isMe ? styles.reactionsMe : styles.reactionsThem]}>
              {Object.entries(
                item.reactions.reduce<Record<string, number>>((acc, r) => {
                  acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                  return acc;
                }, {})
              ).map(([emoji, count]) => (
                <View key={emoji} style={[styles.reactionChip, { backgroundColor: theme.bgSecondary }]}>
                  <ThemedText variant="caption2">{emoji}</ThemedText>
                  {count > 1 && (
                    <ThemedText variant="caption2" style={{ color: theme.textSecondary, marginLeft: 2 }}>
                      {count}
                    </ThemedText>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
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
        }}
      />
      <SafeAreaView edges={['bottom']} style={[styles.container, { backgroundColor: theme.bg }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          style={{ flex: 1 }}
        >
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
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            inverted={false}
            contentContainerStyle={{ paddingVertical: Spacing.three }}
            onEndReached={() => loadMessages(false)}
            onEndReachedThreshold={0.3}
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator color={theme.accent} style={{ paddingVertical: Spacing.four }} />
              ) : null
            }
          />

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

          <View style={[styles.composer, { backgroundColor: theme.bg, borderTopColor: theme.hairline }]}>
            <Pressable onPress={pickImage} style={styles.attachBtn}>
              <Icon name="ImagePlus" size={22} color={theme.accent} />
            </Pressable>
            <Pressable onPress={pickDocument} style={styles.attachBtn}>
              <Icon name="Paperclip" size={22} color={theme.accent} />
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
              />
            </View>
            <Pressable
              onPress={send}
              disabled={!input.trim() || sending}
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: input.trim() ? theme.accent : theme.bgTertiary, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Icon name="Send" size={18} color={input.trim() ? '#fff' : theme.textTertiary} />
            </Pressable>
          </View>
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
    </>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { alignItems: 'center' },
  systemRow: { paddingVertical: Spacing.three, alignItems: 'center' },
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
  composerInput: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    maxHeight: 120,
  },
  composerTextInput: {
    fontSize: 16,
    minHeight: 24,
  },
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
});
