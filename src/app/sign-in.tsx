import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { ArrowLeft } from 'lucide-react-native';
import { supabase } from '@/shared/auth/supabase';
import { colors } from '@/shared/theme';
export default function SignIn() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function send() {
    if (!email.includes('@')) {
      Alert.alert('Enter a valid email');
      return;
    }
    setBusy(true);
    const redirectTo = Linking.createURL('auth/callback');
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });
    setBusy(false);
    if (error) {
      Alert.alert('Could not send sign-in link', error.message);
      return;
    }
    setSent(true);
  }
  return (
    <SafeAreaView style={s.page}>
      <Pressable onPress={() => router.back()} style={s.back}>
        <ArrowLeft color={colors.ink} />
      </Pressable>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.body}>
        <Text style={s.kicker}>GATHER, TOGETHER</Text>
        <Text style={s.heading}>{sent ? 'Check your inbox.' : 'Come on in.'}</Text>
        <Text style={s.copy}>
          {sent
            ? `We sent a secure sign-in link to ${email}. Open it on this device to continue.`
            : 'Enter your email and we’ll send you a secure sign-in link.'}
        </Text>
        {!sent && (
          <>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              placeholder="you@example.com"
              placeholderTextColor={colors.muted}
              style={s.input}
            />
            <Pressable disabled={busy} onPress={send} style={s.cta}>
              <Text style={s.ctaText}>{busy ? 'Sending…' : 'Email me a sign-in link'}</Text>
            </Pressable>
          </>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.paper, padding: 22 },
  back: {
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, justifyContent: 'center', paddingBottom: 70 },
  kicker: { fontSize: 11, letterSpacing: 2, color: colors.moss, fontWeight: '700' },
  heading: { fontFamily: 'Georgia', fontSize: 39, color: colors.ink, marginTop: 14 },
  copy: { fontSize: 16, lineHeight: 24, color: colors.muted, marginTop: 12, marginBottom: 24 },
  input: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    fontSize: 16,
    color: colors.ink,
  },
  cta: {
    marginTop: 14,
    backgroundColor: colors.rust,
    borderRadius: 13,
    padding: 17,
    alignItems: 'center',
  },
  ctaText: { color: 'white', fontSize: 15, fontWeight: '700' },
});
