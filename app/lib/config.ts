// Single source of truth for the mobile app's external endpoints.
// Values can be overridden per environment via EXPO_PUBLIC_* variables
// (put them in a .env file or the EAS build profile); the literals below
// are production fallbacks so a plain `expo start` still works.

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  'https://msqxigcfbsqwpbntxqfe.supabase.co';

// The Supabase anon key is public by design — RLS protects all data, so it is
// safe to ship in client code. Kept here as the single place it's defined.
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcXhpZ2NmYnNxd3BibnR4cWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjY2NDUsImV4cCI6MjA5NjM0MjY0NX0.pX7luSuolqSqxjofF1ZFZCu4pABi2vIN2x4lkMtx5ek';

// Base URL of the Skyquire web app whose /api routes the mobile app calls.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || 'https://skyquire-app.vercel.app';
