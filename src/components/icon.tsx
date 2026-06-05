/**
 * Icon — обёртка над lucide-react-native.
 */

import {
  MessageCircle,
  Users,
  Phone,
  Settings,
  Search,
  Plus,
  ChevronRight,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  XCircle,
  Circle,
  Send,
  ImagePlus,
  Paperclip,
  UserX,
  UserPlus,
  HelpCircle,
  Info,
  LogOut,
  Bell,
  BellOff,
  Volume2,
  Vibrate,
  Palette,
  Languages,
  Smartphone,
  KeyRound,
  ArrowLeft,
  Camera,
  Mic,
  PhoneCall,
  PhoneOff,
  Video,
  VideoOff,
  X,
  MoreVertical,
  Smile,
  Reply,
  Copy,
  Edit,
  Trash2,
  Pin,
  Heart,
  Star,
  ThumbsUp,
} from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';

const ICONS: Record<string, LucideIcon> = {
  MessageCircle,
  Users,
  Phone,
  Settings,
  Search,
  Plus,
  ChevronRight,
  AtSign,
  Lock,
  Eye,
  EyeOff,
  User,
  CheckCircle2,
  XCircle,
  Circle,
  Send,
  ImagePlus,
  Paperclip,
  UserX,
  UserPlus,
  HelpCircle,
  Info,
  LogOut,
  Bell,
  BellOff,
  Volume2,
  Vibrate,
  Palette,
  Languages,
  Smartphone,
  KeyRound,
  ArrowLeft,
  Camera,
  Mic,
  PhoneCall,
  PhoneOff,
  Video,
  VideoOff,
  X,
  MoreVertical,
  Smile,
  Reply,
  Copy,
  Edit,
  Trash2,
  Pin,
  Heart,
  Star,
  ThumbsUp,
};

export type IconName = keyof typeof ICONS;

interface Props {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
}

export function Icon({ name, size = 22, color, strokeWidth = 2, style }: Props) {
  const LucideIcon = ICONS[name];
  if (!LucideIcon) return null;
  return <LucideIcon size={size} color={color} strokeWidth={strokeWidth} style={style} />;
}
