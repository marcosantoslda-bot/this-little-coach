import type { Session as SupabaseSession } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface AuthState {
  /** `undefined` enquanto lê o AsyncStorage. */
  session: SupabaseSession | null | undefined;
}

export function useAuthSession(): AuthState {
  const [session, setSession] = useState<SupabaseSession | null | undefined>(undefined);

  useEffect(() => {
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (mounted) setSession(data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (mounted) setSession(next);
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session };
}
