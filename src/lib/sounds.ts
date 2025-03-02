import SoundManager from './SoundManager';

let initialized = false;

/**
 * Initialize the sound system
 */
export async function initSounds() {
  if (initialized) {
    console.log('Sound system already initialized, skipping');
    return;
  }
  
  console.log('Initializing sound system...');
  await SoundManager.init();
  initialized = true;
}

/**
 * Play a sound effect
 */
export function playSound(name: string, options = {}) {
  return SoundManager.playEffect(name, options);
}

/**
 * Play an ambient sound
 */
export function playAmbient(name: string, options = {}) {
  return SoundManager.playAmbient(name, options);
}

/**
 * Stop an ambient sound
 */
export function stopAmbient(name: string, options = {}) {
  return SoundManager.stopAmbient(name, options);
}

/**
 * Set the master volume
 */
export function setMasterVolume(volume: number) {
  return SoundManager.setMasterVolume(volume);
}

/**
 * Set the effects volume
 */
export function setEffectsVolume(volume: number) {
  return SoundManager.setEffectsVolume(volume);
}

/**
 * Set the ambient volume
 */
export function setAmbientVolume(volume: number) {
  return SoundManager.setAmbientVolume(volume);
}

/**
 * Toggle mute state
 */
export function toggleMute() {
  return SoundManager.toggleMute();
}

/**
 * Check if sound is muted
 */
export function isMuted() {
  return SoundManager.isMuted();
}

/**
 * Get any Supabase sound loading errors
 */
export function getSupabaseErrors() {
  return SoundManager.getSupabaseErrors();
}
