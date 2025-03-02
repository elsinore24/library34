<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import BookPuzzle from '$lib/components/library/BookPuzzle.svelte';
  import FloatingBooks from '$lib/components/library/FloatingBooks.svelte';
  import SecretCompartment from '$lib/components/library/SecretCompartment.svelte';
  import VisualEffects from '$lib/components/library/VisualEffects.svelte';
  import Candle from '$lib/components/library/Candle.svelte';
  import { evidence } from '$lib/stores/evidence';
  import SoundManager from '$lib/SoundManager';
  import { base } from '$app/paths';

  let showPuzzle = false,
      puzzleSolved = false,
      pageLoaded = false,
      bookshelfHovered = false,
      candleFlicker = false,
      interactionPoints = [],
      discoveredPoints = new Set(),
      patternProgress = 0;

  const LIBRARY_BG = 'https://kxmwcpeuiklblpehddkz.supabase.co/storage/v1/object/public/suspects//library.jpeg';

  const books = [
    { id: 1, title: "Mortiferous Mushrooms", color: "#8C0000" },
    { id: 2, title: "Aconitum Anthology", color: "#2A003C" },
    { id: 3, title: "Venomous Flora", color: "#39FF14" },
    { id: 4, title: "Dark Rituals", color: "#0A0004" }
  ];

  // Determine if we're on a mobile device
  const isMobileDevice = typeof window !== 'undefined' ? 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) : 
    false;

  // Define subtle interaction points that must be discovered in sequence
  // Increased radius for mobile devices
  const interactionPattern = [
    { 
      x: 52, 
      y: 38, 
      radius: isMobileDevice ? 10 : 5, 
      hint: "A shadow moves between the shelves..." 
    },
    { 
      x: 48, 
      y: 42, 
      radius: isMobileDevice ? 10 : 5, 
      hint: "Something glints in the candlelight..." 
    },
    { 
      x: 50, 
      y: 40, 
      radius: isMobileDevice ? 10 : 5, 
      hint: "The air feels different here..." 
    }
  ];

  let container: HTMLElement;
  let mousePosition = { x: 0, y: 0 };
  let currentHint = "";
  let showHint = false;
  let hintTimeout: ReturnType<typeof setTimeout>;
  let lastInteractionTime = 0;
  let candleIntensityInterval: ReturnType<typeof setInterval>;
  
  // Candle intensity values - increased for better visibility
  let candleBaseIntensity = isMobileDevice ? 1.2 : 1.0;
  let candleActiveIntensity = isMobileDevice ? 1.6 : 1.3;

  onMount(() => {
    SoundManager.playAmbient('library-ambience', {
      volume: 0.3,
      fade: true,
      fadeIn: 3000
    });
    setTimeout(() => (pageLoaded = true), 100);
    
    // Setup mouse tracking
    document.addEventListener('mousemove', handleMouseMove);
    
    // Setup touch tracking
    container?.addEventListener('touchmove', handleTouchMove);
    
    // Start subtle candle flicker when near interaction points
    startCandleFlickerEffect();
    
    // Prevent scrolling on mobile
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
  });

  onDestroy(() => {
    SoundManager.stopAmbient('library-ambience', {
      fade: true,
      fadeOut: 2000
    });
    
    document.removeEventListener('mousemove', handleMouseMove);
    container?.removeEventListener('touchmove', handleTouchMove);
    
    if (candleIntensityInterval) {
      clearInterval(candleIntensityInterval);
    }
    
    if (hintTimeout) {
      clearTimeout(hintTimeout);
    }
    
    // Restore scrolling when leaving the page
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
  });

  function startCandleFlickerEffect() {
    // Subtle candle flicker effect that intensifies near interaction points
    candleIntensityInterval = setInterval(() => {
      if (patternProgress > 0) {
        candleFlicker = !candleFlicker;
      }
    }, 3000);
  }

  function handleMouseMove(e: MouseEvent) {
    if (showPuzzle) return;
    
    if (container) {
      const rect = container.getBoundingClientRect();
      mousePosition = {
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100
      };
      
      checkInteractionPoints();
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (showPuzzle) return;
    
    if (container) {
      const touch = e.touches[0];
      const rect = container.getBoundingClientRect();
      mousePosition = {
        x: ((touch.clientX - rect.left) / rect.width) * 100,
        y: ((touch.clientY - rect.top) / rect.height) * 100
      };
      
      checkInteractionPoints();
    }
  }

  function checkInteractionPoints() {
    // Only check if we haven't solved the pattern yet
    if (patternProgress >= interactionPattern.length) return;
    
    const currentPoint = interactionPattern[patternProgress];
    const distance = calculateDistance(
      mousePosition.x,
      mousePosition.y,
      currentPoint.x,
      currentPoint.y
    );
    
    // If we're close to the current point in the pattern
    if (distance < currentPoint.radius) {
      // Only register if we haven't interacted recently (prevents accidental double-triggers)
      const now = Date.now();
      if (now - lastInteractionTime > 1000) {
        lastInteractionTime = now;
        
        // Show a subtle hint
        currentHint = currentPoint.hint;
        showHint = true;
        
        // Hide hint after a few seconds
        if (hintTimeout) clearTimeout(hintTimeout);
        hintTimeout = setTimeout(() => {
          showHint = false;
        }, 3000);
        
        // Add to discovered points
        discoveredPoints.add(patternProgress);
        
        // Play a subtle sound
        SoundManager.playEffect('creak', { volume: 0.1 });
        
        // Advance pattern
        patternProgress++;
        
        // If pattern is complete, reveal the puzzle
        if (patternProgress >= interactionPattern.length) {
          setTimeout(() => {
            showPuzzle = true;
            SoundManager.playEffect('bookshelf-creak', { volume: 0.4 });
          }, 1000);
        }
      }
    }
  }

  function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  async function handlePuzzleSolved() {
    puzzleSolved = true;
    SoundManager.playEffect('puzzle-solve', { volume: 0.5 });
    
    evidence.update(items => [
      ...items,
      {
        id: 'book-puzzle',
        description: 'The arrangement reveals a hidden message about poisonous plants...',
        discovered_at: new Date().toISOString(),
        image: '/images/clues/poisoned-page.png'
      }
    ]);

    SoundManager.playEffect('secret-reveal', {
      volume: 0.4,
      fade: true,
      fadeIn: 1000
    });
  }
</script>

<div 
  class="library-container fixed inset-0 overflow-hidden"
  style="background-image: url({LIBRARY_BG}); background-size: cover; background-position: center;"
  bind:this={container}
>
  <div class="absolute inset-0 bg-black/50 z-0"></div>
  <VisualEffects intensity={puzzleSolved ? 0.18 : 0.12} flickerSpeed={0.15} />

  <div class="absolute bottom-8 left-8 z-50">
    <a 
      href="{base}/"
      class="text-parchment hover:text-accent transition-colors duration-300 text-lg"
    >
      ← Return Home
    </a>
  </div>

  <Candle size="large" position={{ x: 50, y: 20 }} intensity={candleFlicker ? candleActiveIntensity : candleBaseIntensity} />
  <Candle size="medium" position={{ x: 15, y: 40 }} intensity={candleFlicker ? candleActiveIntensity - 0.1 : candleBaseIntensity - 0.1} />
  <Candle size="medium" position={{ x: 85, y: 40 }} intensity={candleFlicker ? candleActiveIntensity - 0.2 : candleBaseIntensity - 0.1} />

  <div class="absolute inset-0 z-10">
    {#if !showPuzzle}
      <FloatingBooks {books} />
    {/if}
  </div>

  <!-- Subtle visual cues for discovered points - enhanced for mobile -->
  {#if !showPuzzle}
    {#each Array.from(discoveredPoints) as pointIndex}
      <div 
        class="discovered-point {isMobileDevice ? 'mobile' : ''}"
        style="
          left: {interactionPattern[pointIndex].x}%;
          top: {interactionPattern[pointIndex].y}%;
        "
      ></div>
    {/each}
  {/if}

  <!-- Subtle hint text -->
  {#if showHint && !showPuzzle}
    <div 
      class="subtle-hint {isMobileDevice ? 'mobile' : ''}"
      in:fade={{ duration: 800 }}
      out:fade={{ duration: 800 }}
    >
      {currentHint}
    </div>
  {/if}

  {#if pageLoaded}
    <main
      class="relative z-20 w-full h-full flex items-center justify-center px-4"
      in:fade={{ duration: 1000, delay: 300 }}
    >
      <div class="puzzle-container relative p-4 md:p-8 rounded-lg border-0 w-full max-w-2xl {puzzleSolved ? 'solved' : ''}">
        {#if !showPuzzle}
          <div 
            class="bookshelf-interactive"
            in:fade={{ duration: 500 }}
          >
            <div class="bookshelf-area">
              <!-- Empty div for interaction area - no visible elements -->
            </div>
          </div>
        {:else}
          <div class="puzzle-wrapper" in:fade={{ duration: 800 }}>
            <BookPuzzle 
              {books} 
              on:solve={handlePuzzleSolved}
              disabled={puzzleSolved}
            />
          </div>
        {/if}

        {#if puzzleSolved}
          <div class="mt-8" in:fly={{ y: 20, duration: 800 }}>
            <SecretCompartment visible={true} />
          </div>
        {/if}
      </div>
    </main>
  {/if}
  
  <!-- First-time user guide - shows briefly on page load -->
  {#if pageLoaded && !showPuzzle && patternProgress === 0}
    <div class="initial-hint {isMobileDevice ? 'mobile' : ''}" in:fade={{ duration: 800, delay: 1500 }} out:fade={{ duration: 500 }}>
      <div class="hint-content">
        <span>The library holds secrets for those who observe carefully...</span>
        {#if isMobileDevice}
          <span class="mobile-tip">Drag your finger across the screen to explore.</span>
        {/if}
      </div>
    </div>
  {/if}

  <!-- Mobile hotspot guide - subtle visual indicators for where to look -->
  {#if isMobileDevice && !showPuzzle && patternProgress < interactionPattern.length}
    <div 
      class="hotspot-guide"
      style="
        left: {interactionPattern[patternProgress].x}%;
        top: {interactionPattern[patternProgress].y}%;
      "
    ></div>
  {/if}
</div>

<style>
  .library-container {
    background-repeat: no-repeat;
    background-attachment: fixed;
    cursor: default;
    height: 100vh; /* Ensure it's exactly viewport height */
    width: 100vw; /* Ensure it's exactly viewport width */
    position: fixed; /* Keep it fixed in place */
    top: 0;
    left: 0;
  }

  :global(body) {
    overflow: hidden; /* Prevent scrolling on body */
    background-color: #0A0004;
    margin: 0;
    padding: 0;
    position: fixed;
    width: 100%;
    height: 100%;
  }

  :global(html) {
    overflow: hidden; /* Prevent scrolling on html */
  }

  .puzzle-container {
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.0);
    transition: all 0.5s ease-in-out;
    background: transparent;
    -webkit-backdrop-filter: blur(0px);
            backdrop-filter: blur(0px);
  }

  .puzzle-container.solved {
    box-shadow: 
      0 0 40px rgba(0, 0, 0, 0.3),
      0 0 2px rgba(57, 255, 20, 0.2);
  }

  .puzzle-wrapper {
    transition: transform 0.3s ease-out;
  }

  /* Bookshelf interactive styles - now completely invisible */
  .bookshelf-interactive {
    width: 100%;
    height: 300px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .bookshelf-area {
    position: relative;
    width: 80%;
    height: 100%;
    border-radius: 8px;
  }

  /* Subtle hint text */
  .subtle-hint {
    position: fixed;
    bottom: 15%;
    left: 0;
    width: 100%;
    text-align: center;
    color: rgba(240, 230, 210, 0.7);
    font-family: var(--font-burton, serif);
    font-size: 1rem;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
    pointer-events: none;
    z-index: 40;
  }

  /* Enhanced mobile hint */
  .subtle-hint.mobile {
    background: rgba(0, 0, 0, 0.5);
    padding: 10px;
    color: rgba(240, 230, 210, 0.9);
    border-radius: 8px;
    width: 90%;
    max-width: 400px;
    margin: 0 auto;
    font-size: 1.1rem;
  }

  /* Initial hint */
  .initial-hint {
    position: fixed;
    bottom: 20%;
    left: 0;
    width: 100%;
    display: flex;
    justify-content: center;
    pointer-events: none;
    z-index: 40;
  }

  .initial-hint.mobile {
    bottom: 25%;
  }

  .hint-content {
    background: rgba(0, 0, 0, 0.5);
    color: #f0e6d2;
    padding: 12px 20px;
    border-radius: 30px;
    font-family: var(--font-burton, serif);
    font-size: 1rem;
    text-align: center;
    animation: fade-out 8s forwards;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .mobile-tip {
    font-size: 0.9rem;
    color: rgba(255, 200, 100, 0.9);
  }

  /* Discovered point marker - enhanced for mobile */
  .discovered-point {
    position: absolute;
    width: 20px;
    height: 20px;
    margin-left: -10px;
    margin-top: -10px;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 70%
    );
    pointer-events: none;
    z-index: 15;
    animation: subtle-glow 4s infinite alternate;
  }

  /* Larger, more visible discovered points for mobile */
  .discovered-point.mobile {
    width: 40px;
    height: 40px;
    margin-left: -20px;
    margin-top: -20px;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 200, 100, 0.1) 40%,
      transparent 80%
    );
    animation: mobile-glow 4s infinite alternate;
  }

  /* Mobile hotspot guide - subtle pulsing circle */
  .hotspot-guide {
    position: absolute;
    width: 60px;
    height: 60px;
    margin-left: -30px;
    margin-top: -30px;
    border-radius: 50%;
    background: radial-gradient(
      circle at center,
      rgba(255, 200, 100, 0.05) 0%,
      rgba(255, 200, 100, 0.02) 50%,
      transparent 80%
    );
    pointer-events: none;
    z-index: 5;
    animation: hotspot-pulse 3s infinite ease-in-out;
  }

  @keyframes subtle-glow {
    0% { opacity: 0.1; transform: scale(0.8); }
    100% { opacity: 0.3; transform: scale(1.2); }
  }

  @keyframes mobile-glow {
    0% { opacity: 0.2; transform: scale(0.9); }
    100% { opacity: 0.4; transform: scale(1.3); }
  }

  @keyframes hotspot-pulse {
    0%, 100% { opacity: 0.05; transform: scale(0.8); }
    50% { opacity: 0.15; transform: scale(1.2); }
  }

  @keyframes fade-out {
    0% { opacity: 1; }
    70% { opacity: 1; }
    100% { opacity: 0; }
  }

  @media (max-width: 768px) {
    .bookshelf-interactive {
      height: 250px;
    }
  }
</style>
