import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/shared/auth/supabase';
import { useAuth } from '@/shared/auth/auth-provider';
import { colors } from '@/shared/theme';
export default function Account() {
  const { session } = useAuth();
  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not sign out', error.message);
  }
  return (
    <SafeAreaView style={s.page} edges={['top', 'left', 'right']}>
      <Text style={s.heading}>Your account</Text>
      <View style={s.card}>
        <Text style={s.name}>{session?.user.email ?? 'Welcome to Gather'}</Text>
        <Text style={s.copy}>
          {session ? 'You’re signed in and ready to host.' : 'Sign in to RSVP or host a gathering.'}
        </Text>
        <Pressable onPress={() => (session ? signOut() : router.push('/sign-in'))} style={s.button}>
          <Text style={s.buttonText}>{session ? 'Sign out' : 'Sign in'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, padding: 22, paddingTop: 10 },
  heading: { fontFamily: 'Georgia', fontSize: 34, color: colors.ink },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 18,
    padding: 20,
    marginTop: 24,
  },
  name: { fontSize: 16, color: colors.ink, fontWeight: '700' },
  copy: { fontSize: 14, color: colors.muted, marginTop: 8, lineHeight: 20 },
  button: {
    marginTop: 18,
    padding: 14,
    backgroundColor: colors.rust,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: { color: 'white', fontWeight: '700' },
});
