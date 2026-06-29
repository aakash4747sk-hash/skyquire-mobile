import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://msqxigcfbsqwpbntxqfe.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1zcXhpZ2NmYnNxd3BibnR4cWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NjY2NDUsImV4cCI6MjA5NjM0MjY0NX0.pX7luSuolqSqxjofF1ZFZCu4pABi2vIN2x4lkMtx5ek';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
