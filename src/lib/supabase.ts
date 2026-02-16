import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yorngyurwvdwjgthlypb.supabase.co'
const supabaseAnonKey = 'sb_publishable_uJ5cZZuzDDsOE-dPgnKKZQ_CnOfQmew'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,    // αποθηκεύει session στο device
    autoRefreshToken: true,   // ανανεώνει token αυτόματα
    persistSession: true,     // κρατάει login μετά από restart
    detectSessionInUrl: false, // δεν χρειάζεται σε React Native
  },
})