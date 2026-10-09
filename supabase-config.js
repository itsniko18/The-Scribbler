/**
 * ============================================================================
 * SUPABASE ENVIRONMENT CONFIGURATION (supabase-config.js)
 * ============================================================================
 * Reads environment variables from Vite's import.meta.env if bundled,
 * or runtime window configuration.
 * Credentials are not hardcoded in the application business logic.
 */
(function (window) {
  'use strict';

  var env = (window.__ENV__ = window.__ENV__ || {});

  // 1. Read from Vite's import.meta.env when run through Vite bundler
  try {
    var metaEnv = (new Function('try { return import.meta.env; } catch(e) { return null; }'))();
    if (metaEnv) {
      if (metaEnv.VITE_SUPABASE_URL) env.VITE_SUPABASE_URL = metaEnv.VITE_SUPABASE_URL;
      if (metaEnv.VITE_SUPABASE_ANON_KEY) env.VITE_SUPABASE_ANON_KEY = metaEnv.VITE_SUPABASE_ANON_KEY;
    }
  } catch (e) {
    // Non-module script fallback
  }

  // 2. Default runtime fallback matching .env for direct browser / static serving
  if (!env.VITE_SUPABASE_URL) {
    env.VITE_SUPABASE_URL = 'https://gksyqvlsnfimtythtckj.supabase.co';
  }
  if (!env.VITE_SUPABASE_ANON_KEY) {
    env.VITE_SUPABASE_ANON_KEY = 'sb_publishable_NskmaMMgcHsT0nlorE_jQQ_V11Eiy6x';
  }

  window.SUPABASE_CONFIG = {
    url: env.VITE_SUPABASE_URL,
    anonKey: env.VITE_SUPABASE_ANON_KEY
  };
})(typeof window !== 'undefined' ? window : this);
