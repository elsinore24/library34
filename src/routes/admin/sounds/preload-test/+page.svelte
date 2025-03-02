<script lang="ts">
  import { onMount } from 'svelte';
  import SoundManager from '$lib/SoundManager';
  import { initSounds, getSupabaseErrors } from '$lib/sounds';
  
  let initialized = false;
  let soundErrors: Record<string, string> = {};
  let soundStatus: Record<string, string> = {};
  let soundFiles = [
    'library-ambience',
    'book-drag',
    'book-place',
    'bookshelf-creak',
    'puzzle-solve',
    'secret-reveal',
    'creak',
    'snap',
    'success',
    'whisper'
  ];
  
  async function initializeSounds() {
    try {
      await initSounds();
      initialized = true;
      soundErrors = getSupabaseErrors();
      updateSoundStatus();
    } catch (error) {
      console.error('Error initializing sounds:', error);
    }
  }
  
  function updateSoundStatus() {
    // Check if each sound is loaded
    soundFiles.forEach(sound => {
      try {
        const isAmbient = sound === 'library-ambience';
        const soundObj = isAmbient 
          ? SoundManager['ambientSounds'][sound] 
          : SoundManager['sounds'][sound];
        
        if (soundObj) {
          const state = soundObj.state();
          soundStatus[sound] = state === 'loaded' ? 'Loaded ✅' : `Loading (${state}) ⏳`;
        } else {
          soundStatus[sound] = 'Not found ❌';
        }
      } catch (err) {
        soundStatus[sound] = 'Error checking ⚠️';
      }
    });
  }
  
  function testSound(name: string) {
    try {
      if (name === 'library-ambience') {
        SoundManager.playAmbient(name, { volume: 0.3 });
        setTimeout(() => SoundManager.stopAmbient(name, { fade: 1000 }), 3000);
      } else {
        SoundManager.playEffect(name);
      }
    } catch (err) {
      console.error(`Error playing ${name}:`, err);
    }
  }
  
  onMount(() => {
    initializeSounds();
    
    // Update status periodically
    const interval = setInterval(() => {
      if (initialized) {
        updateSoundStatus();
      }
    }, 1000);
    
    return () => {
      clearInterval(interval);
    };
  });
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-4">Sound Preload Test</h1>
  
  <div class="mb-6">
    <h2 class="text-xl font-semibold mb-2">Initialization Status</h2>
    <div class="p-3 bg-gray-100 rounded">
      <p>Sound System Initialized: <span class={initialized ? "text-green-600" : "text-red-600"}>
        {initialized ? "Yes ✅" : "No ❌"}
      </span></p>
      <p>Using Supabase: <span class={SoundManager.isUsingSupabase() ? "text-green-600" : "text-yellow-600"}>
        {SoundManager.isUsingSupabase() ? "Yes ✅" : "No (using local fallbacks) ⚠️"}
      </span></p>
    </div>
  </div>
  
  <div class="mb-6">
    <h2 class="text-xl font-semibold mb-2">Sound Loading Status</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
      {#each soundFiles as sound}
        <div class="p-3 bg-gray-100 rounded flex justify-between items-center">
          <span class="font-medium">{sound}:</span>
          <div class="flex items-center">
            <span class={soundStatus[sound]?.includes('✅') ? "text-green-600" : 
                         soundStatus[sound]?.includes('⚠️') ? "text-red-600" : 
                         "text-yellow-600"}>
              {soundStatus[sound] || 'Unknown'}
            </span>
            <button 
              class="ml-3 px-2 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
              on:click={() => testSound(sound)}
            >
              Test
            </button>
          </div>
        </div>
      {/each}
    </div>
  </div>
  
  {#if Object.keys(soundErrors).length > 0}
    <div class="mb-6">
      <h2 class="text-xl font-semibold mb-2">Supabase Errors</h2>
      <div class="p-3 bg-red-50 rounded border border-red-200">
        <p class="font-medium text-red-700 mb-2">Found {Object.keys(soundErrors).length} errors:</p>
        <ul class="list-disc pl-5">
          {#each Object.entries(soundErrors) as [key, message]}
            <li class="text-red-600">{message}</li>
          {/each}
        </ul>
      </div>
    </div>
  {/if}
  
  <div class="mt-4">
    <button 
      class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      on:click={initializeSounds}
    >
      Reinitialize Sound System
    </button>
  </div>
</div>
