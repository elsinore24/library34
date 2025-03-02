import { Howl, Howler } from 'howler';
import { getSoundUrl, soundExists, initSoundStorage } from './supabaseStorage';

interface SoundOptions {
  volume?: number;
  loop?: boolean;
  rate?: number;
  onend?: () => void;
  onfade?: () => void;
  fade?: boolean;
  fadeIn?: number;
}

class SoundManager {
  private static sounds: Record<string, Howl> = {};
  private static ambientSounds: Record<string, Howl> = {};
  private static masterVolume: number = 1.0;
  private static effectsVolume: number = 1.0;
  private static ambientVolume: number = 0.7;
  private static muted: boolean = false;
  private static useSupabase: boolean = true;
  private static initialized: boolean = false;
  private static supabaseErrors: Record<string, string> = {};
  private static soundsToPreload = {
    ambient: ['library-ambience'],
    effects: [
      'book-drag',
      'book-place',
      'bookshelf-creak',
      'puzzle-solve',
      'secret-reveal',
      'creak',
      'snap',
      'success',
      'whisper'
    ]
  };
  private static soundFilenames: Record<string, string> = {
    'library-ambience': 'library-ambience.mp3',
    'book-drag': 'bookDrag.mp3',
    'book-place': 'bookPlace.mp3',
    'bookshelf-creak': 'bookshelfCreak.mp3',
    'puzzle-solve': 'puzzleSolve.mp3',
    'secret-reveal': 'secretReveal.mp3',
    'creak': 'creak.mp3',
    'snap': 'snap.mp3',
    'success': 'success.mp3',
    'whisper': 'whisper.mp3'
  };

  static async init() {
    if (this.initialized) {
      console.log('SoundManager already initialized, skipping');
      return;
    }
    
    console.log('Initializing SoundManager...');
    
    // Set global Howler settings
    Howler.autoUnlock = true;
    Howler.volume(this.masterVolume);
    
    // Initialize Supabase storage
    if (this.useSupabase) {
      try {
        const storageInitialized = await initSoundStorage();
        if (!storageInitialized) {
          console.warn('Failed to initialize Supabase storage, falling back to local sounds');
          this.logSupabaseError('storage_init', 'Failed to initialize Supabase storage bucket');
          this.useSupabase = false;
        }
      } catch (err) {
        console.error('Error initializing Supabase storage:', err);
        this.logSupabaseError('storage_init_error', `Error initializing Supabase storage: ${err instanceof Error ? err.message : String(err)}`);
        this.useSupabase = false;
      }
    }
    
    // Preload common sounds
    await this.preloadSounds();
    
    this.initialized = true;
    console.log('SoundManager initialized');
    
    // Log any Supabase errors that occurred during initialization
    this.reportSupabaseErrors();
  }

  static async preloadSounds() {
    console.log('Preloading sounds...');
    
    // Preload ambient sounds
    for (const sound of this.soundsToPreload.ambient) {
      const filename = this.soundFilenames[sound] || `${sound}.mp3`;
      await this.loadAmbient(sound, filename).catch(err => {
        console.error(`Failed to preload ambient sound ${sound}:`, err);
        this.logSupabaseError(`preload_${sound}`, `Failed to preload ambient sound ${sound}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
    
    // Preload effect sounds
    for (const sound of this.soundsToPreload.effects) {
      const filename = this.soundFilenames[sound] || `${sound}.mp3`;
      await this.loadEffect(sound, filename).catch(err => {
        console.error(`Failed to preload effect sound ${sound}:`, err);
        this.logSupabaseError(`preload_${sound}`, `Failed to preload effect sound ${sound}: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
    
    console.log('Sound preloading complete');
  }

  static async loadEffect(name: string, filename: string) {
    console.log(`Loading effect sound: ${name} (${filename})`);
    let url = '';
    
    if (this.useSupabase) {
      try {
        // Check if sound exists in Supabase
        console.log(`Checking if ${filename} exists in Supabase...`);
        const exists = await soundExists(filename);
        
        if (exists) {
          url = getSoundUrl(filename);
          console.log(`Sound ${filename} found in Supabase, using URL: ${url}`);
        } else {
          // Fallback to local file if not in Supabase
          console.warn(`Sound ${filename} not found in Supabase, using local fallback`);
          this.logSupabaseError(`missing_${filename}`, `Sound file ${filename} not found in Supabase storage`);
          url = `/sounds/${filename}`;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Error checking Supabase for ${filename}:`, err);
        this.logSupabaseError(`error_${filename}`, `Error accessing ${filename} from Supabase: ${errorMessage}`);
        url = `/sounds/${filename}`;
      }
    } else {
      url = `/sounds/${filename}`;
      console.log(`Using local URL for ${filename}: ${url}`);
    }
    
    return new Promise<Howl>((resolve, reject) => {
      const sound = new Howl({
        src: [url],
        volume: this.effectsVolume,
        preload: true,
        html5: false,
        onload: () => {
          console.log(`Successfully loaded sound ${name} (${filename})`);
          resolve(sound);
        },
        onloaderror: (id, err) => {
          const errorMsg = `Failed to load sound ${name} (${filename}): ${err}`;
          console.error(errorMsg);
          this.logSupabaseError(`load_error_${filename}`, `Failed to load sound file: ${err}`);
          reject(new Error(errorMsg));
        }
      });
      
      this.sounds[name] = sound;
    });
  }

  static async loadAmbient(name: string, filename: string) {
    console.log(`Loading ambient sound: ${name} (${filename})`);
    let url = '';
    
    if (this.useSupabase) {
      try {
        // Check if sound exists in Supabase
        console.log(`Checking if ${filename} exists in Supabase...`);
        const exists = await soundExists(filename);
        
        if (exists) {
          url = getSoundUrl(filename);
          console.log(`Sound ${filename} found in Supabase, using URL: ${url}`);
        } else {
          // Fallback to local file if not in Supabase
          console.warn(`Sound ${filename} not found in Supabase, using local fallback`);
          this.logSupabaseError(`missing_${filename}`, `Sound file ${filename} not found in Supabase storage`);
          url = `/sounds/${filename}`;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(`Error checking Supabase for ${filename}:`, err);
        this.logSupabaseError(`error_${filename}`, `Error accessing ${filename} from Supabase: ${errorMessage}`);
        url = `/sounds/${filename}`;
      }
    } else {
      url = `/sounds/${filename}`;
      console.log(`Using local URL for ${filename}: ${url}`);
    }
    
    return new Promise<Howl>((resolve, reject) => {
      const sound = new Howl({
        src: [url],
        volume: this.ambientVolume,
        loop: true,
        preload: true,
        html5: true, // Better for longer sounds
        onload: () => {
          console.log(`Successfully loaded ambient sound ${name} (${filename})`);
          resolve(sound);
        },
        onloaderror: (id, err) => {
          const errorMsg = `Failed to load ambient sound ${name} (${filename}): ${err}`;
          console.error(errorMsg);
          this.logSupabaseError(`load_error_${filename}`, `Failed to load ambient sound file: ${err}`);
          reject(new Error(errorMsg));
        }
      });
      
      this.ambientSounds[name] = sound;
    });
  }

  static playAmbient(name: string, options: SoundOptions = {}) {
    if (this.muted) return;
    
    // If the ambient sound isn't loaded yet, load it
    if (!this.ambientSounds[name]) {
      console.warn(`Ambient sound "${name}" not preloaded. Loading now...`);
      const filename = this.soundFilenames[name] || `${name}.mp3`;
      this.loadAmbient(name, filename);
      return null; // Return null since the sound isn't ready yet
    }
    
    const sound = this.ambientSounds[name];
    if (sound) {
      // Set options
      if (options.volume !== undefined) sound.volume(options.volume * this.ambientVolume);
      if (options.loop !== undefined) sound.loop(options.loop);
      if (options.rate !== undefined) sound.rate(options.rate);
      
      // Play the sound
      sound.play();
      
      console.log('Ambient sound played:', name);
      return sound;
    } else {
      console.error(`Ambient sound "${name}" not found`);
      return null;
    }
  }

  static stopAmbient(name: string, options: { fade?: number } = {}) {
    const sound = this.ambientSounds[name];
    if (sound) {
      if (options.fade) {
        sound.fade(sound.volume(), 0, options.fade);
        setTimeout(() => sound.stop(), options.fade);
      } else {
        sound.stop();
      }
      console.log('Ambient sound stopped:', name);
    } else {
      console.error(`Ambient sound "${name}" not found`);
    }
  }

  static playEffect(name: string, options: SoundOptions = {}) {
    if (this.muted) return;
    
    // If the effect isn't loaded yet, load it
    if (!this.sounds[name]) {
      console.warn(`Sound effect "${name}" not preloaded. Loading now...`);
      const filename = this.soundFilenames[name] || `${name}.mp3`;
      this.loadEffect(name, filename);
      return null; // Return null since the sound isn't ready yet
    }
    
    const sound = this.sounds[name];
    if (sound) {
      // Set options
      if (options.volume !== undefined) sound.volume(options.volume * this.effectsVolume);
      if (options.loop !== undefined) sound.loop(options.loop);
      if (options.rate !== undefined) sound.rate(options.rate);
      if (options.onend) sound.once('end', options.onend);
      if (options.onfade) sound.once('fade', options.onfade);
      
      // Play the sound
      const id = sound.play();
      
      console.log('Sound effect played:', name);
      return id;
    } else {
      console.error(`Sound effect "${name}" not found`);
      return null;
    }
  }

  static setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    Howler.volume(this.masterVolume);
    console.log('Master volume set to:', volume);
  }

  static setEffectsVolume(volume: number) {
    this.effectsVolume = Math.max(0, Math.min(1, volume));
    // Update all loaded sound effects
    Object.values(this.sounds).forEach(sound => {
      sound.volume(this.effectsVolume);
    });
    console.log('Effects volume set to:', volume);
  }

  static setAmbientVolume(volume: number) {
    this.ambientVolume = Math.max(0, Math.min(1, volume));
    // Update all loaded ambient sounds
    Object.values(this.ambientSounds).forEach(sound => {
      sound.volume(this.ambientVolume);
    });
    console.log('Ambient volume set to:', volume);
  }

  static setVolume(name: string, volume: number) {
    const sound = this.sounds[name] || this.ambientSounds[name];
    if (sound) {
      sound.volume(volume);
      console.log('Volume set for:', name, volume);
    } else {
      console.error(`Sound "${name}" not found`);
    }
  }

  static stopAll() {
    Howler.stop();
    console.log('All sounds stopped');
  }

  static mute() {
    this.muted = true;
    Howler.mute(true);
    console.log('All sounds muted');
  }

  static unmute() {
    this.muted = false;
    Howler.mute(false);
    console.log('All sounds unmuted');
  }

  static toggleMute() {
    this.muted = !this.muted;
    Howler.mute(this.muted);
    console.log('Mute toggled:', this.muted);
    return this.muted;
  }
  
  static isMuted() {
    return this.muted;
  }
  
  static useSupabaseStorage(value: boolean) {
    this.useSupabase = value;
    console.log('Supabase storage usage set to:', value);
  }
  
  static isInitialized() {
    return this.initialized;
  }
  
  static isUsingSupabase() {
    return this.useSupabase;
  }
  
  // Methods for error logging
  private static logSupabaseError(key: string, message: string) {
    this.supabaseErrors[key] = message;
  }
  
  static reportSupabaseErrors() {
    const errorCount = Object.keys(this.supabaseErrors).length;
    
    if (errorCount > 0) {
      console.group('Supabase Sound Loading Errors');
      console.warn(`Found ${errorCount} errors loading sounds from Supabase:`);
      
      Object.entries(this.supabaseErrors).forEach(([key, message]) => {
        console.warn(`- ${message}`);
      });
      
      console.warn('Falling back to local sound files where needed');
      console.groupEnd();
    } else {
      console.log('No Supabase sound loading errors detected');
    }
  }
  
  static getSupabaseErrors() {
    return { ...this.supabaseErrors };
  }
  
  static clearSupabaseErrors() {
    this.supabaseErrors = {};
  }
  
  // For testing purposes - expose the sounds collections
  static getSounds() {
    return {
      effects: { ...this.sounds },
      ambient: { ...this.ambientSounds }
    };
  }
}

export default SoundManager;
