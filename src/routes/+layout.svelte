<script lang="ts">
  import '../app.postcss';
  import { onMount } from 'svelte';
  import SoundControls from '$lib/components/SoundControls.svelte';
  import { loadEvidence, isLoading, hasError } from '$lib/stores/evidence';
  import { getSupabaseErrors } from '$lib/sounds';
  
  let showSoundControls = true;
  let soundErrors: Record<string, string> = {};
  
  function toggleSoundControls() {
    showSoundControls = !showSoundControls;
  }
  
  onMount(() => {
    // Load evidence data from Supabase
    loadEvidence();
    
    // Check for any sound loading errors
    soundErrors = getSupabaseErrors();
    
    // Add keyboard shortcut for sound controls (M key)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        toggleSoundControls();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Prevent default touch behavior to avoid unwanted scrolling
    document.addEventListener('touchmove', function(e) {
      if(e.target === document.documentElement) {
        e.preventDefault();
      }
    }, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
</script>

<div class="app">
  <main>
    <slot />
  </main>
  
  <!-- Sound controls -->
  <SoundControls {showSoundControls} />
  
  <!-- Error notification for evidence loading -->
  {#if $hasError}
    <div class="error-notification">
      <p>There was an error loading your evidence. Some features may not work correctly.</p>
      <button on:click={() => loadEvidence()}>Try Again</button>
    </div>
  {/if}
  
  <!-- Sound loading errors notification -->
  {#if Object.keys(soundErrors).length > 0}
    <div class="error-notification sound-error">
      <p>Some sound files couldn't be loaded from Supabase. Using local fallbacks.</p>
      <button on:click={() => soundErrors = {}}>Dismiss</button>
    </div>
  {/if}
</div>

<style>
  .app {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    overflow: hidden;
    position: relative;
  }
  
  main {
    flex: 1;
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    overflow: hidden;
    position: relative;
  }
  
  .error-notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: rgba(220, 53, 69, 0.9);
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    z-index: 1002;
    max-width: 300px;
  }
  
  .sound-error {
    top: 90px;
    background-color: rgba(255, 153, 0, 0.9);
  }
  
  .error-notification button {
    background-color: white;
    color: #dc3545;
    border: none;
    padding: 5px 10px;
    border-radius: 3px;
    margin-top: 5px;
    cursor: pointer;
  }
  
  .sound-error button {
    color: #ff9900;
  }
</style>
