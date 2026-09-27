import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { eventsApi } from '@/shared/api/client';
import { categories, type EventCategory, type EventDto, type EventInput } from '@/shared/api/types';
import { useAuth } from '@/shared/auth/auth-provider';
import { colors } from '@/shared/theme';

const defaultStartAt = new Date(Date.now() + 86_400_000);

export default function CreateEventRoute() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session } = useAuth();
  const existing = useQuery({
    queryKey: ['event', id],
    queryFn: () => eventsApi.get(id!),
    enabled: !!id,
  });
  return (
    <SafeAreaView style={s.page}>
      <Stack.Screen options={{ headerShown: false }} />
      {!session ? (
        <View>
          <Text style={s.heading}>Sign in to host</Text>
          <Pressable onPress={() => router.push('/sign-in')} style={s.button}>
            <Text style={s.buttonText}>Sign in</Text>
          </Pressable>
        </View>
      ) : existing.isLoading ? (
        <Text style={s.copy}>Loading event…</Text>
      ) : existing.isError ? (
        <Text style={s.copy}>Could not load the event for editing.</Text>
      ) : (
        <EventEditor key={id ?? 'new'} event={existing.data} />
      )}
    </SafeAreaView>
  );
}

function EventEditor({ event }: { event?: EventDto }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(event?.title ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [location, setLocation] = useState(event?.location ?? '');
  const [category, setCategory] = useState<EventCategory>(event?.category ?? 'Community');
  const [startsAt, setStartsAt] = useState(() =>
    event ? new Date(event.startsAt) : defaultStartAt,
  );
  const [showDate, setShowDate] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');
  const [imageUrl, setImageUrl] = useState(
    event?.imageUrl ?? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200',
  );
  const mutation = useMutation({
    mutationFn: async () => {
      const input: EventInput = {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        category,
        imageUrl: imageUrl.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: null,
      };
      if (input.title.length < 4) throw new Error('Title must be at least 4 characters.');
      if (input.description.length < 20)
        throw new Error('Description must be at least 20 characters.');
      if (!input.location) throw new Error('Add a location.');
      return event ? eventsApi.update(event.id, input) : eventsApi.create(input);
    },
    onSuccess: async (saved) => {
      await qc.invalidateQueries({ queryKey: ['events'] });
      await qc.invalidateQueries({ queryKey: ['event', event?.id] });
      router.replace({ pathname: '/events/[event-id]', params: { 'event-id': saved.id } });
    },
    onError: (error) => Alert.alert('Could not save event', error.message),
  });
  return (
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
      <Pressable onPress={() => router.back()}>
        <Text style={s.back}>‹ Back</Text>
      </Pressable>
      <Text style={s.kicker}>A LITTLE GATHERING</Text>
      <Text style={s.heading}>{event ? 'Edit your event' : 'Bring people together.'}</Text>
      <Text style={s.label}>Event name</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Give your gathering a name"
        style={s.input}
      />
      <Text style={s.label}>What’s it about?</Text>
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Tell people what makes this one special…"
        multiline
        style={[s.input, s.multiline]}
      />
      <Text style={s.label}>Date & time</Text>
      <Pressable
        onPress={() => {
          setPickerMode('date');
          setShowDate(true);
        }}
        style={s.input}
      >
        <Text style={s.date}>
          {startsAt.toLocaleString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
          })}
        </Text>
      </Pressable>
      {showDate && (
        <DateTimePicker
          value={startsAt}
          mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
          minimumDate={new Date()}
          onChange={(_event, date) => {
            if (!date) {
              setShowDate(false);
              return;
            }
            setStartsAt(date);
            if (Platform.OS === 'android' && pickerMode === 'date') setPickerMode('time');
            else setShowDate(false);
          }}
        />
      )}
      <Text style={s.label}>Location</Text>
      <TextInput
        value={location}
        onChangeText={setLocation}
        placeholder="Venue name or neighborhood"
        style={s.input}
      />
      <Text style={s.label}>Kind of gathering</Text>
      <View style={s.categories}>
        {categories.map((value) => (
          <Pressable
            key={value}
            onPress={() => setCategory(value)}
            style={[s.chip, category === value && s.active]}
          >
            <Text style={[s.chipText, category === value && s.activeText]}>{value}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={s.label}>Cover image URL</Text>
      <TextInput
        value={imageUrl}
        onChangeText={setImageUrl}
        autoCapitalize="none"
        style={s.input}
      />
      <Pressable disabled={mutation.isPending} onPress={() => mutation.mutate()} style={s.button}>
        <Text style={s.buttonText}>
          {mutation.isPending ? 'Saving…' : event ? 'Save changes' : 'Create event'}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, padding: 22 },
  content: { paddingBottom: 40 },
  back: { color: colors.muted, fontSize: 15, marginBottom: 24 },
  kicker: { fontSize: 10, letterSpacing: 1.8, color: colors.moss, fontWeight: '700' },
  heading: {
    fontFamily: 'Georgia',
    fontSize: 34,
    lineHeight: 40,
    color: colors.ink,
    marginTop: 8,
    marginBottom: 20,
  },
  copy: { color: colors.muted, marginTop: 20 },
  label: { fontSize: 13, fontWeight: '700', color: colors.ink, marginTop: 14, marginBottom: 7 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    borderRadius: 10,
    paddingHorizontal: 13,
    paddingVertical: 14,
    color: colors.ink,
    fontSize: 15,
  },
  multiline: { minHeight: 112, textAlignVertical: 'top' },
  date: { color: colors.ink },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  active: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 12, color: colors.muted },
  activeText: { color: 'white' },
  button: {
    marginTop: 24,
    backgroundColor: colors.rust,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
