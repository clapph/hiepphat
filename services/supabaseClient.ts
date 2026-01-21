
import { createClient } from '@supabase/supabase-js';

// Thay thế bằng URL và Key thực tế từ Project Supabase của bạn
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_KEY || 'your-anon-key';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
