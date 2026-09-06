/**
 * Trata os links de email do Supabase (magic link / confirmação de registo)
 * quando abrem a app: `thislittlecoach://...?code=...` (PKCE) ou `#access_token=...`.
 */
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { supabase } from './supabase';

function paramsFrom(url: string): URLSearchParams {
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const fragment = hashIndex >= 0 ? url.slice(hashIndex + 1) : '';
  const query = queryIndex >= 0 ? url.slice(queryIndex + 1, hashIndex >= 0 ? hashIndex : undefined) : '';
  const params = new URLSearchParams(query);
  for (const [k, v] of new URLSearchParams(fragment)) params.set(k, v);
  return params;
}

export async function handleAuthUrl(url: string): Promise<boolean> {
  const params = paramsFrom(url);
  const code = params.get('code');
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return !error;
  }
  const accessToken = params.get('access_token');
  const refreshToken = params.get('refresh_token');
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
    return !error;
  }
  return false;
}

/** URL para o Supabase redirecionar depois do clique no email. */
export function authRedirectUrl(): string {
  return Linking.createURL('/auth-callback');
}

export function useAuthDeepLinks(): void {
  const url = Linking.useURL();
  useEffect(() => {
    if (!url) return;
    void handleAuthUrl(url);
  }, [url]);
}
