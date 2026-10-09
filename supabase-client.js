/**
 * ============================================================================
 * LIVING SCRIPT & DASHBOARD — SUPABASE CLIENT & BACKEND (supabase-client.js)
 * ============================================================================
 * Handles persistent traveller identity (UUID), messages storage, queries for
 * Messages Sent & Messages Received, and Supabase Realtime updates.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'living_script_current_traveller';

  // UUID v4 generator (works in all browsers and secure/insecure contexts)
  function generateUUID() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      try {
        return crypto.randomUUID();
      } catch (e) {}
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  class SupabaseBackend {
    constructor() {
      this.config = window.SUPABASE_CONFIG || {
        url: 'https://gksyqvlsnfimtythtckj.supabase.co',
        anonKey: 'sb_publishable_NskmaMMgcHsT0nlorE_jQQ_V11Eiy6x'
      };
      this.client = null;
      this.activeRealtimeChannel = null;
      this.initClient();
    }

    initClient() {
      if (window.supabase && typeof window.supabase.createClient === 'function') {
        try {
          this.client = window.supabase.createClient(this.config.url, this.config.anonKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false
            }
          });
        } catch (e) {
          console.warn('[SupabaseBackend] Error creating Supabase client:', e);
        }
      }
    }

    // Helper: Direct REST Fetch Fallback in case Supabase JS SDK CDN is blocked/delayed
    async restFetch(endpoint, options = {}) {
      const url = `${this.config.url.replace(/\/$/, '')}/rest/v1/${endpoint}`;
      const headers = Object.assign(
        {
          'apikey': this.config.anonKey,
          'Authorization': `Bearer ${this.config.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        options.headers || {}
      );
      const res = await fetch(url, Object.assign({}, options, { headers }));
      if (!res.ok) {
        let errBody = '';
        try {
          const json = await res.json();
          errBody = json.message || json.error || JSON.stringify(json);
        } catch (e) {
          errBody = res.statusText;
        }
        throw new Error(errBody || `HTTP ${res.status}`);
      }
      return await res.json();
    }

    // ========================================================================
    // 1. TRAVELLER IDENTITY MANAGEMENT
    // ========================================================================

    getCurrentTraveller() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id && parsed.name) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[SupabaseBackend] Error reading traveller from storage:', e);
      }
      return null;
    }

    hasCurrentTraveller() {
      return Boolean(this.getCurrentTraveller());
    }

    async registerTraveller(name, isAnonymous = false) {
      let displayName = (name || '').trim();
      if (isAnonymous || !displayName) {
        displayName = 'Anonymous Traveller';
      }

      const travellerId = generateUUID();
      const travellerObj = {
        id: travellerId,
        name: displayName,
        is_anonymous: Boolean(isAnonymous),
        created_at: new Date().toISOString()
      };

      // Always save to localStorage immediately so browser navigation retains identity
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(travellerObj));
      } catch (e) {
        console.warn('[SupabaseBackend] LocalStorage write failed:', e);
      }

      // Persist traveller into Supabase travellers table
      try {
        if (this.client) {
          const { error } = await this.client.from('travellers').insert({
            id: travellerObj.id,
            name: travellerObj.name,
            created_at: travellerObj.created_at
          });
          if (error) {
            console.warn('[SupabaseBackend] Notice inserting traveller to Supabase:', error.message);
          }
        } else {
          await this.restFetch('travellers', {
            method: 'POST',
            body: JSON.stringify({
              id: travellerObj.id,
              name: travellerObj.name,
              created_at: travellerObj.created_at
            })
          });
        }
      } catch (e) {
        console.warn('[SupabaseBackend] Note: Could not insert traveller into Supabase. (May require SQL schema creation in Supabase):', e.message);
      }

      return travellerObj;
    }

    clearCurrentTraveller() {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {}
    }

    // ========================================================================
    // 2. SENDING MESSAGES TO SHARED LIVING SCRIPT WORLD
    // ========================================================================

    async sendMessage({ content, handwriting_content = null }) {
      const traveller = this.getCurrentTraveller();
      if (!traveller || !traveller.id) {
        throw new Error('Traveller identity not established. Please enter your name first.');
      }

      const text = (content && typeof content === 'string') ? content.trim() : '';
      if (!text) {
        throw new Error('Cannot send an empty message.');
      }

      const newId = generateUUID();
      const payload = {
        id: newId,
        sender_id: traveller.id,
        content: text,
        handwriting_content: handwriting_content || null,
        created_at: new Date().toISOString()
      };

      // Ensure traveller exists in travellers table first (foreign key constraint)
      try {
        if (this.client) {
          await this.client.from('travellers').upsert({
            id: traveller.id,
            name: traveller.name,
            created_at: traveller.created_at || new Date().toISOString()
          }, { onConflict: 'id' });
        }
      } catch (e) {
        // Continue to message insert
      }

      if (this.client) {
        const { data, error } = await this.client
          .from('messages')
          .insert(payload)
          .select();

        if (error) {
          throw new Error(error.message || 'Database error occurred while recording letter.');
        }
        return (data && data[0]) ? data[0] : payload;
      } else {
        const res = await this.restFetch('messages', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        return Array.isArray(res) ? res[0] : payload;
      }
    }

    // ========================================================================
    // 3. DASHBOARD QUERIES: MESSAGES SENT & MESSAGES RECEIVED
    // ========================================================================

    /**
     * MESSAGES SENT: WHERE sender_id = currentTraveller.id
     */
    async getSentMessages() {
      const traveller = this.getCurrentTraveller();
      if (!traveller) return [];

      let rawMessages = [];
      try {
        if (this.client) {
          const { data, error } = await this.client
            .from('messages')
            .select('*')
            .eq('sender_id', traveller.id)
            .order('created_at', { ascending: false });

          if (error) throw new Error(error.message);
          rawMessages = data || [];
        } else {
          rawMessages = await this.restFetch(
            `messages?sender_id=eq.${encodeURIComponent(traveller.id)}&order=created_at.desc`
          );
        }
      } catch (e) {
        console.error('[SupabaseBackend] Error fetching sent messages:', e);
        throw e;
      }

      return rawMessages.map(m => ({
        id: m.id,
        sender_id: m.sender_id,
        sender_name: traveller.name,
        recipient_display: 'Living Script Scriptorium',
        content: m.content,
        handwriting_content: m.handwriting_content,
        created_at: m.created_at,
        date_display: formatArchivalDate(m.created_at)
      }));
    }

    /**
     * MESSAGES RECEIVED: WHERE sender_id != currentTraveller.id
     */
    async getReceivedMessages() {
      const traveller = this.getCurrentTraveller();
      const currentId = traveller ? traveller.id : null;

      let rawMessages = [];
      try {
        if (this.client) {
          let query = this.client
            .from('messages')
            .select('*, travellers:sender_id(id, name)')
            .order('created_at', { ascending: false });

          if (currentId) {
            query = query.neq('sender_id', currentId);
          }

          const { data, error } = await query;
          if (error) {
            // Foreign key join syntax might fail if relations aren't cached; fallback to simple query
            const fallback = await this.client
              .from('messages')
              .select('*')
              .neq('sender_id', currentId || '00000000-0000-0000-0000-000000000000')
              .order('created_at', { ascending: false });

            if (fallback.error) throw new Error(fallback.error.message);
            rawMessages = fallback.data || [];
          } else {
            rawMessages = data || [];
          }
        } else {
          const filter = currentId ? `sender_id=neq.${encodeURIComponent(currentId)}&` : '';
          rawMessages = await this.restFetch(`messages?${filter}order=created_at.desc`);
        }
      } catch (e) {
        console.error('[SupabaseBackend] Error fetching received messages:', e);
        throw e;
      }

      // Collect sender names if not already joined
      const senderIdsToLookup = [];
      rawMessages.forEach(m => {
        if (!m.travellers && m.sender_id) {
          senderIdsToLookup.push(m.sender_id);
        }
      });

      const senderNameMap = {};
      if (senderIdsToLookup.length > 0 && this.client) {
        try {
          const { data } = await this.client
            .from('travellers')
            .select('id, name')
            .in('id', Array.from(new Set(senderIdsToLookup)));
          if (data) {
            data.forEach(t => {
              senderNameMap[t.id] = t.name;
            });
          }
        } catch (e) {}
      }

      return rawMessages.map(m => {
        const senderName = (m.travellers && m.travellers.name) ||
          senderNameMap[m.sender_id] ||
          'Fellow Traveller';

        return {
          id: m.id,
          sender_id: m.sender_id,
          sender_name: senderName,
          recipient_display: traveller ? traveller.name : 'You',
          content: m.content,
          handwriting_content: m.handwriting_content,
          created_at: m.created_at,
          date_display: formatArchivalDate(m.created_at)
        };
      });
    }

    // ========================================================================
    // 4. REALTIME MESSAGES SUBSCRIPTION
    // ========================================================================

    subscribeToMessages(onNewMessage) {
      if (!this.client || typeof this.client.channel !== 'function') {
        return () => {};
      }

      try {
        if (this.activeRealtimeChannel) {
          this.client.removeChannel(this.activeRealtimeChannel);
        }

        const channel = this.client
          .channel('public:messages')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            async (payload) => {
              const newRecord = payload.new;
              if (!newRecord) return;

              // Look up sender name
              let senderName = 'Fellow Traveller';
              try {
                const { data } = await this.client
                  .from('travellers')
                  .select('name')
                  .eq('id', newRecord.sender_id)
                  .single();
                if (data && data.name) senderName = data.name;
              } catch (e) {}

              const currentTraveller = this.getCurrentTraveller();
              const formatted = {
                id: newRecord.id,
                sender_id: newRecord.sender_id,
                sender_name: senderName,
                recipient_display: currentTraveller ? currentTraveller.name : 'You',
                content: newRecord.content,
                handwriting_content: newRecord.handwriting_content,
                created_at: newRecord.created_at,
                date_display: formatArchivalDate(newRecord.created_at)
              };

              if (typeof onNewMessage === 'function') {
                onNewMessage(formatted);
              }
            }
          )
          .subscribe();

        this.activeRealtimeChannel = channel;

        return () => {
          try {
            this.client.removeChannel(channel);
          } catch (e) {}
        };
      } catch (e) {
        console.warn('[SupabaseBackend] Realtime subscription error:', e);
        return () => {};
      }
    }
  }

  // Archival date formatting matching the scriptorium tone
  function formatArchivalDate(isoString) {
    if (!isoString) return 'Just now';
    const date = new Date(isoString);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);

    if (diffSec < 45) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m past`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h past`;
    if (diffSec < 86400 * 2) return 'Yesterday';
    if (diffSec < 86400 * 7) return `${Math.floor(diffSec / 86400)} days past`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  window.formatArchivalDate = formatArchivalDate;
  window.SupabaseBackend = SupabaseBackend;
  window.supabaseBackend = new SupabaseBackend();

})(window);
