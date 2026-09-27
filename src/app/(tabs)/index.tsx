import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Link } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { EventCard } from '@/components/event-card';
import { eventsApi } from '@/shared/api/client';
import { categories } from '@/shared/api/types';
import { colors } from '@/shared/theme';
import { rankEvents } from '@/shared/search/rank-events';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function DiscoverScreen() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const result = useQuery({
    queryKey: ['events', category],
    queryFn: () => eventsApi.list('', category),
  });
  const events = useMemo(() => rankEvents(query, result.data?.items ?? []), [query, result.data]);
  return (
    <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <View>
          <Text style={s.brand}>
            gather<Text style={{ color: colors.rust }}>.</Text>
          </Text>
          <Text style={s.kicker}>GOOD THINGS HAPPEN TOGETHER</Text>
        </View>
        <Link href="/events/create" asChild>
          <Pressable style={s.add}>
            <Plus size={19} color="white" />
            <Text style={s.addText}>Host</Text>
          </Pressable>
        </Link>
      </View>
      <Text style={s.heading}>Find your people.</Text>
      <Text style={s.subhead}>Little plans. Lovely company.</Text>
      <View style={s.search}>
        <Search size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search gatherings"
          placeholderTextColor={colors.muted}
          style={s.input}
        />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.chipScroll}
        contentContainerStyle={s.chips}
      >
        <Pressable onPress={() => setCategory('')} style={[s.chip, !category && s.selected]}>
          <Text style={[s.chipText, !category && s.selectedText]}>All</Text>
        </Pressable>
        {categories.map((c) => (
          <Pressable
            key={c}
            onPress={() => setCategory(category === c ? '' : c)}
            style={[s.chip, category === c && s.selected]}
          >
            <Text style={[s.chipText, category === c && s.selectedText]}>{c}</Text>
          </Pressable>
        ))}
      </ScrollView>
      {result.isLoading ? (
        <ActivityIndicator color={colors.rust} style={{ marginTop: 48 }} />
      ) : result.isError ? (
        <Text style={s.empty}>Couldn’t load events. Check your connection and try again.</Text>
      ) : events.length === 0 ? (
        <Text style={s.empty}>Nothing here yet. Try another search.</Text>
      ) : (
        <FlashList
          data={events}
          renderItem={({ item }) => <EventCard event={item} />}
          keyExtractor={(e) => e.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 22,
  },
  brand: { fontFamily: 'Georgia', fontSize: 29, fontWeight: '700', color: colors.ink },
  kicker: { fontSize: 9, letterSpacing: 1.6, color: colors.muted, marginTop: 2 },
  add: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.rust,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addText: { color: 'white', fontWeight: '700', fontSize: 13 },
  heading: { fontFamily: 'Georgia', fontSize: 34, color: colors.ink, letterSpacing: -1 },
  subhead: { color: colors.muted, fontSize: 15, marginTop: 5, marginBottom: 18 },
  search: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: colors.ink, fontSize: 15 },
  chipScroll: { height: 62, flexGrow: 0, flexShrink: 0 },
  chips: { flexDirection: 'row', gap: 8, paddingVertical: 14 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  selected: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontSize: 12, color: colors.muted },
  selectedText: { color: 'white' },
  list: { paddingBottom: 20 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 40, paddingHorizontal: 20 },
});
