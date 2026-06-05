/**
 * QWAS — TypeScript types.
 */

export type User = {
  id: number;
  username: string;
  displayName: string;
  bio?: string | null;
  avatarUrl?: string | null;
  avatarColor: string;
  isOnline: boolean;
  lastSeen?: string | null;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  userId: number;
  username: string;
};

export type Chat = {
  id: number;
  type: 'private' | 'group' | 'channel';
  name: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  avatarColor: string;
  ownerId?: number | null;
  pinnedMessageId?: number | null;
  members: ChatMember[];
  lastMessage?: Message | null;
  unreadCount: number;
  isMuted: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ChatMember = {
  userId: number;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  avatarColor: string;
  role: 'owner' | 'admin' | 'member';
  isOnline: boolean;
  lastSeen?: string | null;
  lastReadMessageId?: number | null;
  notificationsEnabled: boolean;
  isMuted: boolean;
  joinedAt: string;
};

export type Message = {
  id: number;
  chatId: number;
  senderId: number;
  sender?: User;
  type: 'text' | 'image' | 'video' | 'voice' | 'file' | 'system';
  content: string;
  mediaUrl?: string | null;
  mediaMeta?: Record<string, any> | null;
  replyToId?: number | null;
  replyTo?: Message | null;
  forwardedFromId?: number | null;
  editedAt?: string | null;
  isDeleted: boolean;
  createdAt: string;
  reactions?: Reaction[];
};

export type Reaction = {
  messageId: number;
  userId: number;
  emoji: string;
  createdAt: string;
};

export type Call = {
  id: string;
  chatId: number;
  initiatorId: number;
  type: 'audio' | 'video';
  status: 'ringing' | 'active' | 'ended' | 'missed' | 'rejected';
  startedAt: string;
  answeredAt?: string | null;
  endedAt?: string | null;
};

export type WebSocketEvent =
  | { type: 'new_message'; payload: Message }
  | { type: 'message_edited'; payload: Message }
  | { type: 'message_deleted'; payload: { messageId: number; chatId: number } }
  | { type: 'message_reaction'; payload: { messageId: number; userId: number; emoji: string; createdAt: string } }
  | { type: 'chat_updated'; payload: Chat }
  | { type: 'pinned_updated'; payload: { chatId: number; messageId: number | null } }
  | { type: 'user_typing'; payload: { chatId: number; userId: number; isTyping: boolean } }
  | { type: 'user_presence'; payload: { userId: number; isOnline: boolean; lastSeen: string | null } }
  | { type: 'call_incoming'; payload: { call: Call; from: User } }
  | { type: 'call_accepted'; payload: { callId: string } }
  | { type: 'call_rejected'; payload: { callId: string } }
  | { type: 'call_ended'; payload: { callId: string } }
  | { type: 'webrtc_offer'; payload: { callId: string; fromUserId: number; toUserId: number; sdp: string } }
  | { type: 'webrtc_answer'; payload: { callId: string; fromUserId: number; toUserId: number; sdp: string } }
  | { type: 'webrtc_ice'; payload: { callId: string; fromUserId: number; toUserId: number; candidate: RTCIceCandidateInit } }
  | { type: 'pong' };

export type WSClientEvent =
  | { type: 'ping' }
  | { type: 'typing'; payload: { chatId: number; isTyping: boolean } }
  | { type: 'webrtc_offer'; payload: { callId: string; targetUserId: number; sdp: string } }
  | { type: 'webrtc_answer'; payload: { callId: string; targetUserId: number; sdp: string } }
  | { type: 'webrtc_ice'; payload: { callId: string; targetUserId: number; candidate: RTCIceCandidateInit } }
  | { type: 'webrtc_end'; payload: { callId: string; targetUserId: number } };
