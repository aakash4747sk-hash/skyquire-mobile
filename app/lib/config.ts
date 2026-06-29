// Single source of truth for the mobile app's external endpoints.
// Everything the app talks to is defined here once, instead of being
// copy-pasted across screens.

export const SUPABASE_URL = 'https://msqxigcfbsqwpbntxqfe.supabase.co';

// The Supabase anon key is public by design — RLS protects all data, so it is
// safe to ship in client code. Kept here as the single place it's defined.
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcXhpZ2NmYnNxd3BibnR4cWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjY2NDUsImV4cCI6MjA5NjM0MjY0NX0.pX7luSuolqSqxjofF1ZFZCu4pABi2vIN2x4lkMtx5ek';

// Base URL of the Skyquire web app whose /api routes the mobile app calls.
export const API_BASE_URL = 'https://skyquire-app.vercel.app';
