<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  
  onMount(() => {
    // Redirect to the actual admin sounds page
    goto('/admin/sounds');
  });
</script>

<div class="container mx-auto p-4 text-center">
  <h1 class="text-2xl font-bold mb-6">Redirecting to Admin Panel...</h1>
  <div class="loader"></div>
</div>

<style>
  .loader {
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    width: 50px;
    height: 50px;
    animation: spin 1s linear infinite;
    margin: 0 auto;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
