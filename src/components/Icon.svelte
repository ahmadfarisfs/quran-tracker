<script>
  export let name;
  export let size = 18;
  export let strokeWidth = 2;
  export let label = '';
</script>

<svg
  class="app-icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width={strokeWidth}
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? 'img' : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : 'true'}
>
  {#if name === 'book'}
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/>
  {:else if name === 'chart'}
    <path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20H2"/>
  {:else if name === 'settings'}
    <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.12 2.12-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V20.3h-3v-.08a1.7 1.7 0 0 0-1.03-1.56A1.7 1.7 0 0 0 8.8 19l-.06.06-2.12-2.12.06-.06A1.7 1.7 0 0 0 7.02 15a1.7 1.7 0 0 0-1.56-1.03H5.4v-3h.06A1.7 1.7 0 0 0 7.02 9 1.7 1.7 0 0 0 6.68 7.1l-.06-.05 2.12-2.13.06.06a1.7 1.7 0 0 0 1.88.34A1.7 1.7 0 0 0 11.7 3.8V3.7h3v.08a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.12 2.12-.06.06A1.7 1.7 0 0 0 19.4 9a1.7 1.7 0 0 0 1.56 1.03h.08v3h-.08A1.7 1.7 0 0 0 19.4 15Z"/>
  {:else if name === 'moon'}
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/>
  {:else if name === 'sun'}
    <circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42"/>
  {:else if name === 'cloud-sun'}
    <path d="M12 3V2M5.64 5.64l-.7-.7M18.36 5.64l.7-.7M16 9a4 4 0 0 0-7.45-2"/><path d="M17.5 19H6a4 4 0 0 1-.6-7.95A5.5 5.5 0 0 1 16 12.5h1.5a3.25 3.25 0 0 1 0 6.5Z"/>
  {:else if name === 'sunset'}
    <path d="M12 10V2M4.93 4.93l1.42 1.42M17.65 6.35l1.42-1.42M2 18h20M4 22h16"/><path d="M8 18a4 4 0 0 1 8 0"/>
  {:else if name === 'star'}
    <path d="m12 2 3.1 6.3L22 9.3l-5 4.9 1.2 6.8-6.2-3.2L5.8 21 7 14.2 2 9.3l6.9-1Z"/>
  {:else if name === 'map-pin'}
    <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>
  {:else if name === 'calendar'}
    <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>
  {:else if name === 'warning'}
    <path d="M10.3 3.7 2.3 18a2 2 0 0 0 1.7 3h16a2 2 0 0 0 1.7-3l-8-14.3a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/>
  {:else if name === 'mosque'}
    <path d="M3 21h18M5 21v-8h4v8M15 21v-8h4v8M9 21V9h6v12M12 3c0 2-3 2.5-3 6h6c0-3.5-3-4-3-6Z"/>
  {:else if name === 'file'}
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>
  {:else if name === 'sparkle'}
    <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8ZM19 14l.7 1.8 1.8.7-1.8.7L19 19l-.7-1.8-1.8-.7 1.8-.7Z"/>
  {:else if name === 'target'}
    <circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>
  {:else if name === 'history'}
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>
  {:else if name === 'download'}
    <path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>
  {:else if name === 'locate'}
    <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="8"/>
  {:else if name === 'trash'}
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 15H6L5 6M10 11v5M14 11v5"/>
  {:else if name === 'check'}
    <path d="m5 12 4 4L19 6"/>
  {:else if name === 'x'}
    <path d="m6 6 12 12M18 6 6 18"/>
  {:else if name === 'refresh'}
    <path d="M20 7h-6V1M4 17h6v6"/><path d="M20 7a9 9 0 0 0-15-2M4 17a9 9 0 0 0 15 2"/>
  {:else if name === 'arrow-left'}
    <path d="m15 18-6-6 6-6"/>
  {:else if name === 'arrow-right'}
    <path d="m9 18 6-6-6-6"/>
  {/if}
</svg>
