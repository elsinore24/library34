<script lang="ts">
  import { onMount } from 'svelte';
  import { listSounds, uploadSound, getSoundUrl } from '$lib/supabaseStorage';
  import SoundUploader from '$lib/components/SoundUploader.svelte';
  import SoundControls from '$lib/components/SoundControls.svelte';
  
  let sounds: any[] = [];
  let isLoading = true;
  let error = '';
  
  onMount(async () => {
    await loadSounds();
  });
  
  async function loadSounds() {
    try {
      isLoading = true;
      error = '';
      
      const soundsList = await listSounds();
      sounds = soundsList;
      
      console.log('Loaded sounds:', sounds);
    } catch (err) {
      console.error('Error loading sounds:', err);
      error = `Failed to load sounds: ${err.message}`;
    } finally {
      isLoading = false;
    }
  }
  
  function playSound(filename: string) {
    const url = getSoundUrl(filename);
    const audio = new Audio(url);
    audio.play();
  }
  
  async function handleUpload(event: CustomEvent) {
    const file = event.detail.file;
    
    try {
      const url = await uploadSound(file);
      if (url) {
        console.log('Sound uploaded successfully:', url);
        await loadSounds(); // Refresh the list
      } else {
        error = 'Upload failed';
      }
    } catch (err) {
      console.error('Upload error:', err);
      error = `Upload failed: ${err.message}`;
    }
  }
</script>

<div class="container mx-auto p-4">
  <h1 class="text-2xl font-bold mb-6">Sound Management</h1>
  
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="md:col-span-2">
      <div class="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-semibold mb-4">Sound Library</h2>
        
        {#if isLoading}
          <div class="flex justify-center my-8">
            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        {:else if error}
          <div class="bg-red-900 text-white p-4 rounded-lg mb-6">
            <p>{error}</p>
            <button 
              class="mt-2 bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded"
              on:click={loadSounds}
            >
              Retry
            </button>
          </div>
        {:else if sounds.length === 0}
          <p class="text-gray-400">No sounds found in storage. Upload some sounds to get started.</p>
        {:else}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#each sounds as sound}
              <div class="bg-gray-800 p-4 rounded-lg">
                <div class="flex justify-between items-center">
                  <h3 class="font-medium">{sound.name}</h3>
                  <button 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    on:click={() => playSound(sound.name)}
                  >
                    Play
                  </button>
                </div>
                <div class="text-xs text-gray-400 mt-2">
                  Size: {Math.round((sound.metadata?.size || 0) / 1024)} KB
                </div>
                <div class="text-xs text-gray-400">
                  Last modified: {new Date(sound.created_at).toLocaleString()}
                </div>
              </div>
            {/each}
          </div>
        {/if}
        
        <div class="mt-6">
          <a 
            href="/admin/sounds/test" 
            class="inline-block bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded mr-2"
          >
            Storage Test
          </a>
          <a 
            href="/admin/sounds/preload-test" 
            class="inline-block bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
          >
            Preload Diagnostic
          </a>
        </div>
      </div>
    </div>
    
    <div>
      <div class="bg-gray-900 p-6 rounded-lg shadow-lg">
        <h2 class="text-xl font-semibold mb-4">Upload Sound</h2>
        <SoundUploader on:upload={handleUpload} />
      </div>
      
      <div class="bg-gray-900 p-6 rounded-lg shadow-lg mt-6">
        <h2 class="text-xl font-semibold mb-4">Required Sounds</h2>
        <p class="text-sm text-gray-400 mb-4">
          These sounds are used by the game and should be uploaded to Supabase storage:
        </p>
        <ul class="list-disc list-inside space-y-1 text-gray-300">
          <li>library-ambience.mp3</li>
          <li>bookDrag.mp3</li>
          <li>bookPlace.mp3</li>
          <li>bookshelfCreak.mp3</li>
          <li>puzzleSolve.mp3</li>
          <li>secretReveal.mp3</li>
          <li>creak.mp3</li>
          <li>snap.mp3</li>
          <li>success.mp3</li>
          <li>whisper.mp3</li>
        </ul>
      </div>
    </div>
  </div>
  
  <SoundControls />
</div>

<style>
  :global(body) {
    background-color: #1a1a1a;
    color: #f0f0f0;
  }
</style>
