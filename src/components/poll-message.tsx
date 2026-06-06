/**
 * PollMessage — inline poll display, vote, results.
 */

import { useState, useEffect } from 'react';
import { Pressable, View, StyleSheet, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Icon } from '@/components/icon';
import { useTheme } from '@/hooks/use-theme';
import { apiGet, apiPost } from '@/api/client';
import type { Poll } from '@/types';

interface Props {
  pollId: number;
  isMe: boolean;
}

export default function PollMessage({ pollId, isMe }: Props) {
  const theme = useTheme();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiGet<{ ok: boolean } & Poll>(`/api/v1/polls/${pollId}`)
      .then((data) => {
        if (cancelled) return;
        setPoll(data);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(String(e?.message || e));
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [pollId]);

  async function vote(optionIds: number[]) {
    if (!poll || voting) return;
    setVoting(true);
    try {
      await apiPost(`/api/v1/polls/${pollId}/vote`, { optionIds });
      const data = await apiGet<{ ok: boolean } & Poll>(`/api/v1/polls/${pollId}`);
      setPoll(data);
    } catch (e) {
      setError(String((e as any)?.message || e));
    } finally {
      setVoting(false);
    }
  }

  function toggle(optionId: number) {
    if (!poll) return;
    const has = poll.myVotes.includes(optionId);
    if (poll.isMultiple) {
      vote(has ? poll.myVotes.filter((x) => x !== optionId) : [...poll.myVotes, optionId]);
    } else {
      vote(has ? [] : [optionId]);
    }
  }

  if (loading) {
    return <ActivityIndicator color={isMe ? theme.sentText : theme.accent} style={{ padding: 12 }} />;
  }
  if (error || !poll) {
    return <ThemedText variant="caption1" style={{ color: isMe ? 'rgba(255,255,255,0.8)' : theme.textSecondary }}>{error || 'Опрос недоступен'}</ThemedText>;
  }

  const closed = poll.closesAt ? new Date(poll.closesAt) < new Date() : false;
  const showResults = closed || poll.myVotes.length > 0;

  return (
    <View style={{ minWidth: 240 }}>
      <View style={styles.header}>
        <Icon name="BarChart2" size={14} color={isMe ? theme.sentText : theme.accent} />
        <ThemedText variant="caption2" style={{ color: isMe ? theme.sentText : theme.accent, fontWeight: '700', marginLeft: 4 }}>
          {closed ? 'Опрос завершён' : poll.isAnonymous ? 'Анонимный опрос' : 'Опрос'}
        </ThemedText>
      </View>
      <ThemedText variant="headline" style={{ color: isMe ? theme.sentText : theme.receivedText, marginBottom: 8, fontWeight: '700' }}>
        {poll.question}
      </ThemedText>
      {poll.options.map((opt) => {
        const selected = poll.myVotes.includes(opt.id);
        const pct = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0;
        return (
          <Pressable
            key={opt.id}
            onPress={() => !closed && toggle(opt.id)}
            disabled={closed || voting}
            style={[
              styles.option,
              {
                backgroundColor: selected
                  ? (isMe ? 'rgba(255,255,255,0.25)' : theme.accentMuted)
                  : (isMe ? 'rgba(255,255,255,0.1)' : theme.bgTertiary),
                borderColor: selected
                  ? (isMe ? 'rgba(255,255,255,0.7)' : theme.accent)
                  : 'transparent',
              },
            ]}
          >
            {showResults && (
              <View style={[styles.bar, { width: `${pct}%`, backgroundColor: isMe ? 'rgba(255,255,255,0.2)' : theme.accent + '40' }]} />
            )}
            <View style={styles.row}>
              <View style={[styles.checkbox, { borderColor: isMe ? 'rgba(255,255,255,0.6)' : theme.textSecondary }]}>
                {selected && <Icon name="Check" size={12} color={isMe ? theme.sentText : theme.accent} />}
              </View>
              <ThemedText variant="subhead" style={{ color: isMe ? theme.sentText : theme.receivedText, flex: 1, marginLeft: 8 }}>
                {opt.text}
              </ThemedText>
              {showResults && (
                <ThemedText variant="caption1" style={{ color: isMe ? 'rgba(255,255,255,0.9)' : theme.textSecondary, fontWeight: '600' }}>
                  {pct.toFixed(0)}%
                </ThemedText>
              )}
            </View>
          </Pressable>
        );
      })}
      <ThemedText variant="caption2" style={{ color: isMe ? 'rgba(255,255,255,0.7)' : theme.textTertiary, marginTop: 6 }}>
        {showResults
          ? `${poll.totalVotes} ${pluralize(poll.totalVotes, 'голос', 'голоса', 'голосов')}`
          : poll.isMultiple ? 'Можно выбрать несколько' : 'Выберите один вариант'}
        {voting ? ' · ...' : ''}
      </ThemedText>
    </View>
  );
}

function pluralize(n: number, one: string, few: string, many: string) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  option: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 6,
    overflow: 'hidden',
  },
  bar: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    borderRadius: 12,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  checkbox: {
    width: 18, height: 18, borderRadius: 4, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
});
