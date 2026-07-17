import { createClient } from '@supabase/supabase-js'

// This is the "publishable" (anon) key — it is DESIGNED to be public and
// safe to ship in client-side code. Access is controlled by the Row Level
// Security policies on the Supabase project, not by keeping this secret.
const SUPABASE_URL = 'https://ppkatqpqvqbbxwgdmczm.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_9MuP7gohPyFHrkXMuF_Ing_qPtQH6h9'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

export const AUDIO_BUCKET = 'audio-clips'

// Builds a playable URL for a clip stored at `label/filename.wav` in the
// audio-clips bucket (the bucket is public, so this URL just works).
export function getAudioUrl(audioPath) {
  if (!audioPath) return null
  const { data } = supabase.storage.from(AUDIO_BUCKET).getPublicUrl(audioPath)
  return data?.publicUrl ?? null
}
