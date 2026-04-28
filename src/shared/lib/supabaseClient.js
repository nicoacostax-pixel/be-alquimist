import { createClient } from '@supabase/supabase-js';

// Reemplaza estos valores con los de tu proyecto de Supabase
const supabaseUrl = 'https://pxreruyfjpacnvhxmhlk.supabase.co/';
const supabaseAnonKey = 'sb_publishable_plT_og8NtmGGHCvWTljVgw_Xgdy9UJe';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

