<script>
  import { onMount } from 'svelte';
  import { S } from './lib/store.js';
  import Setup from './components/Setup.svelte';
  import Dashboard from './components/Dashboard.svelte';
  import Progress from './components/Progress.svelte';
  import Settings from './components/Settings.svelte';
  import Icon from './components/Icon.svelte';

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

  function navigate(tab) {
    activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
</script>

{#if showInstall}
  <div class="install-bar show">
    <span><Icon name="download" size={17}/> Install Quran Tracker to your home screen</span>
    <button class="install-btn" on:click={install}>Install</button>
    <button class="dismiss-btn" aria-label="Dismiss install prompt" on:click={dismissInstall}><Icon name="x" size={16}/></button>
  </div>
{/if}

<header class="header" class:compact={$S}>
  <div class="header-icon"><Icon name="moon" size={38} strokeWidth={1.5}/></div>
  <h1 class="header-title">Quran Khatam Tracker</h1>
  <p class="header-subtitle">متابعة ختم القرآن الكريم</p>
</header>

{#if !$S}
  <main class="main">
    <Setup />
  </main>
{:else}
  <nav class="nav visible" aria-label="Primary navigation">
    <button class="nav-btn {activeTab==='dashboard'?'active':''}" aria-current={activeTab === 'dashboard' ? 'page' : undefined} on:click={() => navigate('dashboard')}><Icon name="book" size={17}/> Today</button>
    <button class="nav-btn {activeTab==='progress' ?'active':''}" aria-current={activeTab === 'progress' ? 'page' : undefined} on:click={() => navigate('progress')}><Icon name="chart" size={17}/> Progress</button>
    <button class="nav-btn {activeTab==='settings' ?'active':''}" aria-current={activeTab === 'settings' ? 'page' : undefined} on:click={() => navigate('settings')}><Icon name="settings" size={17}/> Settings</button>
  </nav>
  <main class="main">
    {#if activeTab === 'dashboard'}
      <Dashboard on:navigate={e => navigate(e.detail)} />
    {:else if activeTab === 'progress'}
      <Progress />
    {:else if activeTab === 'settings'}
      <Settings />
    {/if}
  </main>
{/if}
