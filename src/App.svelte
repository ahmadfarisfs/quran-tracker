<script>
  import { onMount } from 'svelte';
  import { S } from './lib/store.js';
  import Setup from './components/Setup.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import Progress from './components/Progress.svelte';
  import Settings from './components/Settings.svelte';

  let activeTab = 'dashboard';
  let showInstall = false;
  let deferredPrompt = null;

  onMount(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/quran-tracker/sw.js').catch(() => {});
    }
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      if (!localStorage.getItem('pwaInstallDismissed')) {
        setTimeout(() => showInstall = true, 4000);
      }
    });
  });

  function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => { deferredPrompt = null; showInstall = false; });
  }
  function dismissInstall() {
    showInstall = false;
    localStorage.setItem('pwaInstallDismissed', '1');
  }
</script>

{#if showInstall}
  <div class="install-bar show">
    <span>📲 Install Quran Tracker to your home screen</span>
    <button class="install-btn" on:click={install}>Install</button>
    <button class="dismiss-btn" on:click={dismissInstall}>✕</button>
  </div>
{/if}

<header class="header">
  <div style="font-size:2.2rem;margin-bottom:6px;animation:floatAnim 3s ease-in-out infinite">🌙</div>
  <h1 class="header-title">Quran Khatam Tracker</h1>
  <p class="header-subtitle">متابعة ختم القرآن الكريم</p>
</header>

{#if !$S}
  <main class="main">
    <Setup />
  </main>
{:else}
  <nav class="nav visible">
    <button class="nav-btn {activeTab==='dashboard'?'active':''}" on:click={() => activeTab='dashboard'}>📖 Today</button>
    <button class="nav-btn {activeTab==='progress' ?'active':''}" on:click={() => activeTab='progress'}>📊 Progress</button>
    <button class="nav-btn {activeTab==='settings' ?'active':''}" on:click={() => activeTab='settings'}>⚙️ Settings</button>
  </nav>
  <main class="main">
    {#if activeTab === 'dashboard'}
      <Dashboard on:navigate={e => activeTab = e.detail} />
    {:else if activeTab === 'progress'}
      <Progress />
    {:else if activeTab === 'settings'}
      <Settings />
    {/if}
  </main>
{/if}
