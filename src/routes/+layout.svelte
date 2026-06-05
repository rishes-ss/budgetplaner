<script>
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';

  export let data;

  let theme = 'light';
  let menuOpen = false;

  const navLinks = [
    { href: '/', label: 'Dashboard' },
    { href: '/transactions', label: 'Transaktionen' },
    { href: '/budgets', label: 'Budgets' },
    { href: '/savings', label: 'Sparziele' },
    { href: '/analysis', label: 'Analyse' }
  ];


  onMount(() => {
    theme = localStorage.getItem('bp-theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
  });

  function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('bp-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }

  $: $page && (menuOpen = false);
</script>

<div class="layout">
  <header class="navbar">
    <div class="shell navbar-inner">
      <a href="/" class="brand">
        <span class="brand-logo">₣</span>
        <span>BudgetPlaner</span>
      </a>

      {#if data.user}
        <nav class="nav-links" class:open={menuOpen} aria-label="Hauptnavigation">
          {#each navLinks as link}
            <a
              href={link.href}
              class="nav-link"
              class:active={$page.url.pathname === link.href}
            >
              {link.label}
            </a>
          {/each}
          {#if data.user?.role === 'admin'}
            <a
              href="/admin"
              class="nav-link nav-link-admin"
              class:active={$page.url.pathname === '/admin'}
            >
              Admin
            </a>
          {/if}
        </nav>
      {/if}

      <div class="nav-right">
        <button class="btn btn-ghost theme-btn" on:click={toggleTheme} title="Theme wechseln" aria-label="Theme wechseln">
          {#if theme === 'light'}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          {:else}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
          {/if}
        </button>

        {#if data.user}
          <div class="nav-user">
            <div class="user-avatar">{data.user.username[0].toUpperCase()}</div>
            <span class="user-name">{data.user.username}</span>
          </div>
          <a href="/logout" class="btn btn-sm">Abmelden</a>
          <button
            class="hamburger-btn"
            on:click={() => (menuOpen = !menuOpen)}
            aria-label="Menü öffnen"
            aria-expanded={menuOpen}
          >
            <span class:rotated={menuOpen}></span>
            <span class:hidden={menuOpen}></span>
            <span class:rotated-inv={menuOpen}></span>
          </button>
        {:else}
          <a href="/login" class="btn">Anmelden</a>
          <a href="/register" class="btn btn-primary">Registrieren</a>
        {/if}
      </div>
    </div>
  </header>

  {#if menuOpen}
    <button class="nav-overlay" on:click={() => (menuOpen = false)} aria-label="Menü schließen"></button>
  {/if}

  <main>
    <slot />
  </main>
</div>

<style>
  .layout {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .navbar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    z-index: 200;
    height: var(--nav-height);
    background: var(--surface);
    border-bottom: 1px solid var(--border-soft);
    box-shadow: var(--shadow-sm);
    transition: background 0.2s ease;
  }

  .navbar-inner {
    height: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .brand {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 1.05rem;
    font-weight: 800;
    color: var(--primary);
    text-decoration: none;
    flex-shrink: 0;
    margin-right: 8px;
  }

  .brand-logo {
    font-size: 1.5rem;
    line-height: 1;
  }

  .nav-links {
    display: flex;
    align-items: center;
    gap: 2px;
    flex: 1;
  }

  .nav-link {
    padding: 6px 12px;
    border-radius: var(--radius-sm);
    color: var(--text-2);
    font-size: 0.88rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .nav-link:hover {
    color: var(--text);
    background: var(--surface-soft);
  }

  .nav-link.active {
    color: var(--primary);
    background: var(--primary-light);
  }

  .nav-link-admin {
    color: #b45309;
  }

  .nav-link-admin:hover {
    color: #92400e;
    background: #fef3c7;
  }

  .nav-link-admin.active {
    color: #b45309;
    background: #fef3c7;
  }

  .nav-right {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  .theme-btn {
    padding: 8px;
    color: var(--text-2);
    display: flex;
    align-items: center;
  }

  .theme-btn:hover {
    color: var(--primary);
  }

  .nav-user {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .user-avatar {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: var(--primary);
    color: var(--primary-text);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8rem;
    font-weight: 700;
    flex-shrink: 0;
  }

  .user-name {
    font-size: 0.88rem;
    font-weight: 600;
    color: var(--text-2);
  }

  .hamburger-btn {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 38px;
    height: 38px;
    padding: 8px;
    border: 1px solid var(--border-soft);
    border-radius: var(--radius-sm);
    background: var(--surface);
    cursor: pointer;
  }

  .hamburger-btn span {
    display: block;
    height: 2px;
    background: var(--text);
    border-radius: 2px;
    transition: all 0.2s;
    transform-origin: center;
  }

  .hamburger-btn span.rotated {
    transform: rotate(45deg) translate(5px, 5px);
  }

  .hamburger-btn span.hidden {
    opacity: 0;
    transform: scaleX(0);
  }

  .hamburger-btn span.rotated-inv {
    transform: rotate(-45deg) translate(5px, -5px);
  }

  .nav-overlay {
    position: fixed;
    inset: 0;
    z-index: 150;
    background: rgba(0, 0, 0, 0.4);
    border: none;
    cursor: default;
    backdrop-filter: blur(2px);
  }

  main {
    flex: 1;
  }

  @media (max-width: 768px) {
    .hamburger-btn {
      display: flex;
    }

    .user-name {
      display: none;
    }

    .nav-links {
      position: fixed;
      top: var(--nav-height);
      left: 0;
      right: 0;
      z-index: 190;
      flex-direction: column;
      align-items: stretch;
      gap: 0;
      background: var(--surface);
      border-bottom: 1px solid var(--border-soft);
      box-shadow: var(--shadow-md);
      padding: 12px;
      display: none;
    }

    .nav-links.open {
      display: flex;
    }

    .nav-link {
      padding: 12px 16px;
      font-size: 0.95rem;
      border-radius: var(--radius-sm);
    }
  }

  @media (max-width: 480px) {
    .brand span:last-child {
      display: none;
    }
  }
</style>
