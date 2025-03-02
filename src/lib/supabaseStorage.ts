import { supabase } from './supabase';

const BUCKET_NAME = 'game-sounds';

/**
 * Initializes the Supabase storage bucket for sounds if it doesn't exist
 */
export async function initSoundStorage() {
  try {
    // Check if bucket exists
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('Error checking storage buckets:', error);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.warn(`Storage bucket ${BUCKET_NAME} not found. It should be created by migrations.`);
      
      // Try to create the bucket if it doesn't exist
      try {
        const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
          public: true,
          fileSizeLimit: 5242880, // 5MB
          allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']
        });
        
        if (createError) {
          console.error('Failed to create bucket:', createError);
          return false;
        }
        
        console.log(`Created storage bucket: ${BUCKET_NAME}`);
        return true;
      } catch (createErr) {
        console.error('Error creating bucket:', createErr);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error('Failed to initialize sound storage:', err);
    return false;
  }
}

/**
 * Gets the public URL for a sound file in Supabase storage
 */
export function getSoundUrl(filename: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Lists all sound files in the storage bucket
 */
export async function listSounds() {
  try {
    const { data, error } = await supabase.storage.from(BUCKET_NAME).list();
    
    if (error) {
      console.error('Error listing sounds:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Failed to list sounds:', err);
    return [];
  }
}

/**
 * Checks if a sound file exists in storage
 */
export async function soundExists(filename: string): Promise<boolean> {
  try {
    const { data } = await supabase.storage.from(BUCKET_NAME).list();
    return data?.some(file => file.name === filename) || false;
  } catch (err) {
    console.error('Failed to check if sound exists:', err);
    return false;
  }
}

/**
 * Uploads a sound file to Supabase storage
 */
export async function uploadSound(file: File): Promise<string | null> {
  try {
    // Make sure the bucket exists
    const initialized = await initSoundStorage();
    if (!initialized) {
      console.error('Failed to initialize storage before upload');
      return null;
    }
    
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(file.name, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error('Error uploading sound:', error);
      return null;
    }
    
    // Mark the sound as uploaded in the database
    await markSoundUploaded(file.name);
    
    // Return the public URL
    return getSoundUrl(file.name);
  } catch (err) {
    console.error('Failed to upload sound:', err);
    return null;
  }
}

/**
 * Marks a sound file as uploaded in the database
 */
export async function markSoundUploaded(filename: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('mark_sound_uploaded', { 
      sound_filename: filename 
    });
    
    if (error) {
      console.error('Error marking sound as uploaded:', error);
      return false;
    }
    
    return data || false;
  } catch (err) {
    console.error('Failed to mark sound as uploaded:', err);
    return false;
  }
}

/**
 * Gets the list of sounds that need to be uploaded
 */
export async function getSoundsToUpload() {
  try {
    const { data, error } = await supabase.from('sounds_to_upload').select('*');
    
    if (error) {
      console.error('Error getting sounds to upload:', error);
      return [];
    }
    
    return data || [];
  } catch (err) {
    console.error('Failed to get sounds to upload:', err);
    return [];
  }
}
