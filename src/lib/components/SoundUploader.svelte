<script lang="ts">
  import { onMount } from 'svelte';
  import { initSoundStorage, uploadSound, listSounds, getSoundsToUpload } from '$lib/supabaseStorage';
  import SoundManager from '$lib/SoundManager';
  
  let isUploading = false;
  let uploadProgress = 0;
  let uploadedFiles: string[] = [];
  let errorMessage = '';
  let storageInitialized = false;
  let soundsToUpload: any[] = [];
  
  onMount(async () => {
    try {
      storageInitialized = await initSoundStorage();
      if (storageInitialized) {
        // Get already uploaded sounds
        const sounds = await listSounds();
        uploadedFiles = sounds.map(file => file.name);
        
        // Get sounds that need to be uploaded
        soundsToUpload = await getSoundsToUpload();
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
      errorMessage = 'Failed to initialize storage';
    }
  });
  
  async function handleFileUpload(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    
    isUploading = true;
    uploadProgress = 0;
    errorMessage = '';
    
    try {
      const totalFiles = input.files.length;
      let uploadedCount = 0;
      
      for (let i = 0; i < totalFiles; i++) {
        const file = input.files[i];
        
        // Only upload audio files
        if (!file.type.startsWith('audio/')) {
          console.warn(`Skipping non-audio file: ${file.name}`);
          continue;
        }
        
        const url = await uploadSound(file);
        if (url) {
          uploadedFiles.push(file.name);
          uploadedCount++;
          
          // Remove from soundsToUpload if it was in the list
          soundsToUpload = soundsToUpload.filter(s => s.filename !== file.name);
        } else {
          errorMessage = `Failed to upload ${file.name}`;
        }
        
        uploadProgress = Math.round((uploadedCount / totalFiles) * 100);
      }
      
      // Enable Supabase storage in SoundManager after upload
      SoundManager.useSupabaseStorage(true);
      
    } catch (error) {
      console.error('Upload error:', error);
      errorMessage = 'An error occurred during upload';
    } finally {
      isUploading = false;
    }
  }
</script>

<div class="sound-uploader p-4 bg-gray-800 rounded-lg text-white">
  <h2 class="text-xl mb-4">Sound File Manager</h2>
  
  {#if !storageInitialized}
    <div class="text-red-400 mb-4">
      Storage not initialized. Please check your Supabase configuration.
    </div>
  {:else}
    <div class="mb-4">
      <label for="sound-file-input" class="block mb-2">Upload Sound Files</label>
      <input 
        id="sound-file-input"
        type="file" 
        accept="audio/*" 
        multiple 
        on:change={handleFileUpload}
        class="block w-full text-sm text-gray-300
               file:mr-4 file:py-2 file:px-4
               file:rounded-md file:border-0
               file:text-sm file:font-semibold
               file:bg-amber-700 file:text-white
               hover:file:bg-amber-600"
        disabled={isUploading}
      />
    </div>
    
    {#if isUploading}
      <div class="mb-4">
        <div class="w-full bg-gray-700 rounded-full h-2.5">
          <div class="bg-amber-600 h-2.5 rounded-full" style="width: {uploadProgress}%"></div>
        </div>
        <p class="text-sm mt-1">Uploading... {uploadProgress}%</p>
      </div>
    {/if}
    
    {#if errorMessage}
      <div class="text-red-400 mb-4">
        {errorMessage}
      </div>
    {/if}
    
    <div class="mb-6">
      <h3 class="text-lg mb-2">Uploaded Sound Files</h3>
      {#if uploadedFiles.length === 0}
        <p class="text-gray-400">No sound files uploaded yet.</p>
      {:else}
        <ul class="list-disc pl-5">
          {#each uploadedFiles as file}
            <li>{file}</li>
          {/each}
        </ul>
      {/if}
    </div>
    
    {#if soundsToUpload.length > 0}
      <div>
        <h3 class="text-lg mb-2 text-amber-400">Required Sounds To Upload</h3>
        <p class="text-sm mb-2">The following sounds are needed for the game:</p>
        <ul class="list-disc pl-5">
          {#each soundsToUpload as sound}
            <li>
              <span class="font-mono">{sound.filename}</span>
              {#if sound.description}
                <span class="text-gray-400 text-sm"> - {sound.description}</span>
              {/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}
  {/if}
</div>
