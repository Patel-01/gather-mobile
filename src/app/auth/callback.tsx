import { useEffect } from 'react';
import { ActivityIndicator, SafeAreaView, Text } from 'react-native';
import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/shared/auth/supabase';
import { colors } from '@/shared/theme';
export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  useEffect(() => {
    let active = true;
    async function complete() {
      let code = params.code;
      if (!code) {
        const url = await Linking.getInitialURL();
        if (url) code = Linking.parse(url).queryParams?.code as string | undefined;
      }
      if (!code) throw new Error('The sign-in link is missing its verification code.');
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) throw error;
      if (active) router.replace('/(tabs)');
    }
    complete().catch(() => {
      if (active) router.replace('/sign-in');
    });
    return () => {
      active = false;
    };
  }, [params.code]);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.paper,
        gap: 12,
      }}
    >
      <ActivityIndicator color={colors.rust} />
      <Text style={{ color: colors.ink }}>Finishing sign-in…</Text>
    </SafeAreaView>
  );
}
