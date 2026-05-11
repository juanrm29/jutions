'use client';

import { createClient } from './supabase/client';

const supabase = createClient();

// This is a synchronous check for the UI immediately after load
// We use localStorage as a cache for the auth state to prevent UI flicker
const AUTH_KEY = 'jution_admin_state';

export function isAdmin(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(AUTH_KEY) === 'true';
}

export async function login(email: string, password: string): Promise<boolean> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    console.error('Login error:', error);
    return false;
  }

  localStorage.setItem(AUTH_KEY, 'true');
  return true;
}

export async function logout(): Promise<void> {
  await supabase.auth.signOut();
  localStorage.removeItem(AUTH_KEY);
}

// Optional: a function to verify actual session from Supabase
export async function verifySession(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  const isValid = !!session;
  if (typeof window !== 'undefined') {
    if (isValid) localStorage.setItem(AUTH_KEY, 'true');
    else localStorage.removeItem(AUTH_KEY);
  }
  return isValid;
}
