/**
 * Index — redirect handled by AuthGate.
 */

import { View } from 'react-native';
import { useTheme } from '@/hooks/use-theme';

export default function Index() {
  const theme = useTheme();
  return <View style={{ flex: 1, backgroundColor: theme.bg }} />;
}
