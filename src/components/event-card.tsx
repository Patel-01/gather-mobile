import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import type { EventDto } from '@/shared/api/types';
import { colors } from '@/shared/theme';
export function EventCard({ event }: { event: EventDto }) {
  return (
    <Link href={{ pathname: '/events/[event-id]', params: { 'event-id': event.id } }} asChild>
      <Pressable style={styles.card}>
        <Image
          source={{ uri: event.imageUrl }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
        <View style={styles.content}>
          <Text style={styles.meta}>
            {event.category.toUpperCase()} ·{' '}
            {new Date(event.startsAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <Text numberOfLines={2} style={styles.title}>
            {event.title}
          </Text>
          <Text numberOfLines={1} style={styles.detail}>
            {event.location}
          </Text>
          <Text style={styles.people}>{event.attendeeCount} going</Text>
        </View>
      </Pressable>
    </Link>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: 16,
  },
  image: { height: 190, width: '100%', backgroundColor: colors.line },
  content: { padding: 16 },
  meta: { color: colors.moss, fontSize: 10, letterSpacing: 1.4, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 22, lineHeight: 27, fontWeight: '600', marginTop: 8 },
  detail: { color: colors.muted, fontSize: 14, marginTop: 8 },
  people: { color: colors.rust, fontSize: 12, fontWeight: '600', marginTop: 12 },
});
