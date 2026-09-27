import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Link, router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EventCard } from '@/components/event-card';
import { eventsApi } from '@/shared/api/client';
import { useAuth } from '@/shared/auth/auth-provider';
import { colors } from '@/shared/theme';
export default function Plans() {
  const { session } = useAuth();
  const q = useQuery({
    queryKey: ['rsvps', session?.user.id],
    queryFn: eventsApi.myRsvps,
    enabled: !!session,
  });
  return (
    <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
      <Text style={s.heading}>My plans</Text>
      <Text style={s.sub}>Gatherings you’ve said yes to.</Text>
      {!session ? (
        <View style={s.empty}>
          <Text style={s.note}>Sign in to see your RSVPs.</Text>
          <Pressable onPress={() => router.push('/sign-in')} style={s.button}>
            <Text style={s.white}>Sign in</Text>
          </Pressable>
        </View>
      ) : q.isLoading ? (
        <ActivityIndicator color={colors.rust} />
      ) : q.data?.items.length ? (
        <FlashList
          data={q.data.items}
          renderItem={({ item }) => <EventCard event={item} />}
          keyExtractor={(e) => e.id}
        />
      ) : (
        <View style={s.empty}>
          <Text style={s.note}>No plans yet. There’s a good one waiting.</Text>
          <Link href="/" style={s.link}>
            Explore events
          </Link>
        </View>
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, padding: 20, paddingTop: 10 },
  heading: { fontFamily: 'Georgia', fontSize: 34, color: colors.ink },
  sub: { fontSize: 15, color: colors.muted, marginTop: 6, marginBottom: 24 },
  empty: { alignItems: 'center', marginTop: 80, gap: 16 },
  note: { fontSize: 15, color: colors.muted },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: colors.rust,
  },
  white: { color: 'white', fontWeight: '700' },
  link: { color: colors.rust, fontWeight: '700' },
});
