import { createClient } from '@supabase/supabase-js'
const SUPABASE_URL = 'https://ppkatqpqvqbbxwgdmczm.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9MuP7gohPyFHrkXMuF_Ing_qPtQH6h9'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

export const AUDIO_BUCKET = 'audio-clips'

export function getAudioUrl(audioPath) {
  if (!audioPath) return null
  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(audioPath)
  return data?.publicUrl ?? null
}
