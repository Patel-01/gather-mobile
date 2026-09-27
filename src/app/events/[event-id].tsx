import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, Link, router } from 'expo-router';
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { eventsApi } from '@/shared/api/client';
import type { EventDto } from '@/shared/api/types';
import { useAuth } from '@/shared/auth/auth-provider';
import { colors } from '@/shared/theme';

type EventListResult = { items: EventDto[]; total: number };

function withAttendance(event: EventDto, attending: boolean): EventDto {
  if (event.isAttending === attending) return event;

  return {
    ...event,
    isAttending: attending,
    attendeeCount: Math.max(0, event.attendeeCount + (attending ? 1 : -1)),
  };
}

export default function EventDetail() {
  const { 'event-id': id } = useLocalSearchParams<{ 'event-id': string }>();
  const qc = useQueryClient();
  const { session } = useAuth();
  const q = useQuery({ queryKey: ['event', id], queryFn: () => eventsApi.get(id) });
  const event = q.data;

  const rsvpMutation = useMutation({
    mutationFn: (attending: boolean) => eventsApi.rsvp(id, attending),
    onMutate: async (attending) => {
      await Promise.all([
        qc.cancelQueries({ queryKey: ['event', id] }),
        qc.cancelQueries({ queryKey: ['events'] }),
      ]);

      const previousEvent = qc.getQueryData<EventDto>(['event', id]);
      const previousEventLists = qc.getQueriesData<EventListResult>({ queryKey: ['events'] });

      if (previousEvent) {
        qc.setQueryData(['event', id], withAttendance(previousEvent, attending));
      }
      qc.setQueriesData<EventListResult>({ queryKey: ['events'] }, (current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === id ? withAttendance(item, attending) : item,
              ),
            }
          : current,
      );

      return { previousEvent, previousEventLists };
    },
    onError: (error, _attending, context) => {
      if (context?.previousEvent) {
        qc.setQueryData(['event', id], context.previousEvent);
      }
      context?.previousEventLists.forEach(([queryKey, previous]) => {
        qc.setQueryData(queryKey, previous);
      });
      Alert.alert(
        'Could not update RSVP',
        error instanceof Error ? error.message : 'Please try again.',
      );
    },
    onSuccess: async () => {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(
        () => undefined,
      );
    },
    onSettled: () => {
      void Promise.all([
        qc.invalidateQueries({ queryKey: ['event', id] }),
        qc.invalidateQueries({ queryKey: ['events'] }),
        qc.invalidateQueries({ queryKey: ['rsvps'] }),
      ]);
    },
  });

  function toggle() {
    if (!session) {
      router.push('/sign-in');
      return;
    }
    if (!event || rsvpMutation.isPending) return;
    rsvpMutation.mutate(!event.isAttending);
  }
  if (q.isLoading || !event)
    return (
      <SafeAreaView style={s.center}>
        <Stack.Screen options={{ headerShown: false }} />
        {q.isError ? (
          <Text style={s.copy}>Couldn’t load this event.</Text>
        ) : (
          <ActivityIndicator color={colors.rust} />
        )}
      </SafeAreaView>
    );
  return (
    <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.hero}>
          <Image
            source={{ uri: event.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          <Pressable onPress={() => router.back()} style={s.back}>
            <ArrowLeft color={colors.ink} />
          </Pressable>
        </View>
        <View style={s.content}>
          <Text style={s.meta}>{event.category.toUpperCase()}</Text>
          <Text style={s.title}>{event.title}</Text>
          <Text style={s.host}>Hosted by {event.hostName}</Text>
          <View style={s.line} />
          <View style={s.row}>
            <CalendarDays size={18} color={colors.rust} />
            <Text style={s.copy}>
              {new Date(event.startsAt).toLocaleString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </View>
          <View style={s.row}>
            <MapPin size={18} color={colors.rust} />
            <Text style={s.copy}>{event.location}</Text>
          </View>
          <Text style={s.section}>The gathering</Text>
          <Text style={s.description}>{event.description}</Text>
          <Text style={s.going}>{event.attendeeCount} people are going</Text>
          {session && event.hostId === session.user.id && (
            <Link href={{ pathname: '/events/create', params: { id: event.id } }} asChild>
              <Pressable style={s.edit}>
                <Text style={s.editText}>Edit event</Text>
              </Pressable>
            </Link>
          )}
        </View>
      </ScrollView>
      <SafeAreaView style={s.footer} edges={['bottom']}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: rsvpMutation.isPending, busy: rsvpMutation.isPending }}
          disabled={rsvpMutation.isPending}
          onPress={toggle}
          style={[s.cta, !rsvpMutation.isPending && event.isAttending && s.cancel]}
        >
          {rsvpMutation.isPending && <ActivityIndicator size="small" color={colors.card} />}
          <Text style={[s.ctaText, !rsvpMutation.isPending && event.isAttending && s.cancelText]}>
            {rsvpMutation.isPending
              ? rsvpMutation.variables
                ? 'Joining…'
                : 'Cancelling…'
              : event.isAttending
                ? 'You’re going · Cancel RSVP'
                : 'Count me in'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  hero: { height: 320, backgroundColor: colors.line },
  back: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 22 },
  meta: { color: colors.moss, fontSize: 11, letterSpacing: 1.5, fontWeight: '700' },
  title: { fontFamily: 'Georgia', fontSize: 36, lineHeight: 42, color: colors.ink, marginTop: 10 },
  host: { color: colors.muted, marginTop: 8 },
  line: { height: 1, backgroundColor: colors.line, marginVertical: 22 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  copy: { color: colors.ink, fontSize: 15, flex: 1 },
  section: {
    fontFamily: 'Georgia',
    fontSize: 24,
    color: colors.ink,
    marginTop: 20,
    marginBottom: 10,
  },
  description: { fontSize: 16, lineHeight: 25, color: colors.muted },
  going: { fontWeight: '600', color: colors.moss, marginTop: 20 },
  edit: {
    marginTop: 20,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    alignItems: 'center',
  },
  editText: { color: colors.ink, fontWeight: '600' },
  footer: { backgroundColor: colors.paper, paddingHorizontal: 20, paddingTop: 10 },
  cta: {
    backgroundColor: colors.rust,
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  ctaText: { color: 'white', fontWeight: '700', fontSize: 16 },
  cancel: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  cancelText: { color: colors.ink },
});
