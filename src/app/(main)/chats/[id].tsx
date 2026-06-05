/**
 * Chat detail screen.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';

import { Avatar } from '@/components/avatar';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { Spacing, Radius } from '@/constants/theme';
import { apiGet, apiPost, apiUpload, mediaUrl } from '@/api/client';
import { useAuth } from '@/store/auth';
import type { Chat, Message, ChatMember } from '@/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const chatId = Number(id);
  const router = useRouter();
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

  const listRef = useRef<FlatList<Message>>(null);

  const loadChat = useCallback(async () => {
    try {
      const data = await apiGet<Chat>(`/api/v1/chats/${chatId}`);
      setChat(data);
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
        const data = await apiGet<Message[]>(`/api/v1/chats/${chatId}/messages?limit=${limit}&offset=${reset ? 0 : page * limit}`);
        if (reset) {
          setMessages(data);
        } else {
          setMessages((prev) => [...data, ...prev]);
        }
        setHasMore(data.length === limit);
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
    if (messages.length > 0 && page === 1) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [page, messages.length]);

  const chatTitle =
    chat?.name ||
    (chat?.members.find((m) => m.userId !== me?.id)?.displayName) ||
    'Чат';

  const otherMember: ChatMember | undefined = chat?.members.find((m) => m.userId !== me?.id);

  async function send() {
    if (!input.trim() || sending) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const text = input.trim();
    setInput('');
    try {
      const msg = await apiPost<Message>(`/api/v1/chats/${chatId}/messages`, {
        type: 'text',
        content: text,
      });
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
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
            onLongPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            style={[
              styles.bubble,
              isMe
                ? { backgroundColor: theme.sent, borderBottomRightRadius: 4 }
                : { backgroundColor: theme.received, borderBottomLeftRadius: 4 },
            ]}
          >
            {item.mediaUrl ? (
              item.type === 'image' ? (
                <View>
                  <ThemedText variant="body" style={{ color: isMe ? theme.sentText : theme.receivedText }}>
                    {item.content}
                  </ThemedText>
                </View>
              ) : (
                <ThemedText variant="body" style={{ color: isMe ? theme.sentText : theme.receivedText }}>
                  {item.content} {item.mediaUrl}
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
              {isMe ? (item.id ? ' ✓✓' : ' ✓') : ''}
            </ThemedText>
          </Pressable>
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
                {otherMember?.isOnline ? (
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
                onChangeText={setInput}
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
});
