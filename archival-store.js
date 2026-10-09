/**
 * ============================================================================
 * LIVING SCRIPT — ARCHIVAL DATA & STATE STORE (archival-store.js)
 * ============================================================================
 * Pure data and persistence layer for medieval correspondence, users, and letters.
 * Backed by browser localStorage; designed with clean model separation so it can
 * be swapped for an HTTP REST / WebSocket / database backend in the future.
 */

(function (window) {
  'use strict';

  const STORAGE_KEY = 'living_script_archive_v2';

  // Canonical base seed users belonging to the medieval scriptorium world
  const SEED_USERS = [
    {
      id: "user-mara",
      name: "Mara",
      role: "Scribe of the Valley Cloister",
      anonymous: false,
      createdAt: "Anno Domini 1884"
    },
    {
      id: "user-elias",
      name: "Elias",
      role: "Archivist of the Northern Tower",
      anonymous: false,
      createdAt: "Anno Domini 1884"
    },
    {
      id: "user-iris",
      name: "Iris",
      role: "Illuminator of Marginalia & Gold",
      anonymous: false,
      createdAt: "Anno Domini 1884"
    },
    {
      id: "user-nila",
      name: "Nila",
      role: "Wayward Cartographer of Ink Trails",
      anonymous: false,
      createdAt: "Anno Domini 1884"
    },
    {
      id: "user-jonas",
      name: "Jonas",
      role: "Chronicle Binder & Papermaker",
      anonymous: false,
      createdAt: "Anno Domini 1884"
    },
    {
      id: "user-lyra",
      name: "Lyra",
      role: "Scholar of Lost Phonetic Marks",
      anonymous: false,
      createdAt: "Anno Domini 1884"
    },
    {
      id: "user-archivist",
      name: "The Archivist",
      role: "High Custodian of Living Script",
      anonymous: false,
      createdAt: "Anno Domini 1884"
    },
    {
      id: "user-noah",
      name: "Noah",
      role: "Keeper of Palimpsests & Old Texts",
      anonymous: false,
      createdAt: "Anno Domini 1884"
    }
  ];

  // Canonical seed correspondence between scribes with authentic manuscript prose
  const SEED_MESSAGES = [
    {
      id: "letter-007",
      letterNumber: "007",
      senderId: "user-mara",
      senderName: "Mara",
      receiverId: "user-elias",
      receiverName: "Elias",
      date: "Just now",
      timestamp: Date.now() - 25 * 60 * 1000, // 25 mins ago
      status: "dispatched",
      excerpt: "The iron gall ink pools into cold-pressed fibers with profound gravitas. We have bound hesitation to natural stroke variance.",
      body: "Unto Brother Elias,\n\nWe have tested the cold-pressed parchment under flickering tallow candles. When speech slows into contemplative breath, the iron gall ink pools into the fibers with profound gravitas.\n\nPlease transcribe the upcoming canon of gestures before the mountain pass is sealed by frost.\n\n— Mara, Scribe of the Valley Cloister"
    },
    {
      id: "letter-006",
      letterNumber: "006",
      senderId: "user-nila",
      senderName: "Nila",
      receiverId: "user-mara",
      receiverName: "Mara",
      date: "Yesterday",
      timestamp: Date.now() - 86400000,
      status: "received",
      excerpt: "The western courier routes are charted along the stone cloisters. Keep the horns of fermented ink shielded from direct drafts.",
      body: "To Sister Mara,\n\nThe courier paths across the high ridge remain passable on horseback. I have plotted three hidden monastic scriptoria along the Roman markers where unbleached rag paper is still made.\n\nDispatch word when the new living quills are ready.\n\n— Nila, Cartographer of Ink Trails"
    },
    {
      id: "letter-005",
      letterNumber: "005",
      senderId: "user-elias",
      senderName: "Elias",
      receiverId: "user-mara",
      receiverName: "Mara",
      date: "4 days ago",
      timestamp: Date.now() - 4 * 86400000,
      status: "received",
      excerpt: "When human hesitation is introduced into the quill, error rises naturally to mirror authentic manuscript variance.",
      body: "Unto Scribe Mara,\n\nThe typewriter inscription engine is now bound with kinetic gesture tracking. When the scribe hesitates, error increases from 0% to natural human variance.\n\nEvery mark committed here is an indelible trace of transience.\n\n— Elias, Archivist of the Northern Tower"
    },
    {
      id: "letter-004",
      letterNumber: "004",
      senderId: "user-mara",
      senderName: "Mara",
      receiverId: "user-elias",
      receiverName: "Elias",
      date: "3 days ago",
      timestamp: Date.now() - 3 * 86400000,
      status: "dispatched",
      excerpt: "Three horns of freshly decanted oak gall ink have been sealed in beeswax and entrusted to the monastery courier.",
      body: "Unto Brother Elias,\n\nThree horns of freshly decanted oak gall ink have been sealed in beeswax and entrusted to the courier. Shield them from damp stone cellars.\n\n— Mara, Scriptorium Desk"
    },
    {
      id: "letter-003",
      letterNumber: "003",
      senderId: "user-mara",
      senderName: "Mara",
      receiverId: "user-iris",
      receiverName: "Iris",
      date: "5 days ago",
      timestamp: Date.now() - 5 * 86400000,
      status: "dispatched",
      excerpt: "Cinnabar pigments safely arrived from the southern monks; testing red illumination upon the capital headers.",
      body: "Unto Sister Iris,\n\nThe mineral powders are finely ground. The cinnabar and lapis lazuli pigments have dried into the rough paper margins. I await your next acoustic transmission to begin the capital illumination.\n\n— Mara, Scribe"
    },
    {
      id: "letter-002",
      letterNumber: "002",
      senderId: "user-iris",
      senderName: "Iris",
      receiverId: "user-mara",
      receiverName: "Mara",
      date: "8 days ago",
      timestamp: Date.now() - 8 * 86400000,
      status: "received",
      excerpt: "Gold leaf does not adhere to cold digital displays; the tactile page demands patient craft and the warmth of human breath.",
      body: "Honored Scribe,\n\nThe marginal flourishes are complete. Gold leaf does not adhere to cold digital displays; the tactile page demands patient craft and the warmth of human breath.\n\n— Iris, Illuminator of Marginalia"
    },
    {
      id: "letter-001",
      letterNumber: "001",
      senderId: "user-mara",
      senderName: "Mara",
      receiverId: "user-iris",
      receiverName: "Iris",
      date: "12 days ago",
      timestamp: Date.now() - 12 * 86400000,
      status: "dispatched",
      excerpt: "The scriptorium ledger has been re-bound with pigskin and iron gall ink, ready for the upcoming century of silence.",
      body: "Unto Sister Iris,\n\nThe registry of letters sent and received is established. Even if the machine era erases every keyboard, our ink formulas remain catalogued in stone.\n\n— Mara, Keeper of the Registry"
    }
  ];

  class ArchivalStore {
    constructor() {
      this.currentUser = null;
      this.users = [];
      this.messages = [];
      this.activeRecipient = 'Elias';
      this.init();
    }

    init() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.currentUser = parsed.currentUser || null;
          this.users = Array.isArray(parsed.users) && parsed.users.length ? parsed.users : [...SEED_USERS];
          this.messages = Array.isArray(parsed.messages) && parsed.messages.length ? parsed.messages : [...SEED_MESSAGES];
          this.activeRecipient = parsed.activeRecipient || (this.users[1] ? this.users[1].name : 'Elias');
        } else {
          // Fresh state initialization (no default user until entry popup is submitted)
          this.currentUser = null;
          this.users = [...SEED_USERS];
          this.messages = [...SEED_MESSAGES];
          this.activeRecipient = 'Elias';
          this.persist();
        }
      } catch (e) {
        console.warn('ArchivalStore: Error loading storage, using memory defaults', e);
        this.currentUser = null;
        this.users = [...SEED_USERS];
        this.messages = [...SEED_MESSAGES];
        this.activeRecipient = 'Elias';
      }
    }

    persist() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          currentUser: this.currentUser,
          users: this.users,
          messages: this.messages,
          activeRecipient: this.activeRecipient
        }));
      } catch (e) {
        console.warn('ArchivalStore: LocalStorage quota exceeded or disabled', e);
      }
    }

    /**
     * Checks if current user identity has already been established
     */
    hasCurrentUser() {
      return Boolean(this.currentUser && this.currentUser.name);
    }

    getCurrentUser() {
      return this.currentUser;
    }

    /**
     * Sets or registers the current user identity
     * @param {string} rawName - User name or title entered
     * @param {boolean} isAnonymous - Whether anonymous mode was selected
     */
    setCurrentUser(rawName, isAnonymous = false) {
      if (isAnonymous) {
        const anonCount = this.users.filter(u => u.anonymous).length;
        const anonSuffix = anonCount === 0 ? '' : ` #${String(anonCount + 1).padStart(2, '0')}`;
        const anonName = `Anonymous${anonSuffix}`;
        const anonId = `anon-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

        this.currentUser = {
          id: anonId,
          name: anonName,
          role: "Shadow Scribe (Anonymous)",
          anonymous: true,
          createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
      } else {
        const cleanName = (rawName || '').trim() || 'Scribe';
        // Check if name matches an existing catalog user
        const existing = this.users.find(u => u.name.toLowerCase() === cleanName.toLowerCase());
        if (existing) {
          this.currentUser = { ...existing };
        } else {
          // New scribe registration
          const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-');
          const newId = `user-${slug || Date.now().toString(36)}`;
          this.currentUser = {
            id: newId,
            name: cleanName,
            role: "Scribe of the Living Script",
            anonymous: false,
            createdAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
          };
        }
      }

      // Ensure current user exists in users array
      const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
      if (userIndex === -1) {
        this.users.push(this.currentUser);
      } else {
        this.users[userIndex] = this.currentUser;
      }

      // Set default active recipient to a different correspondent
      const otherUser = this.users.find(u => u.id !== this.currentUser.id);
      if (otherUser) {
        this.activeRecipient = otherUser.name;
      }

      this.persist();
      return this.currentUser;
    }

    /**
     * Clears current user to allow re-prompting or identity switching
     */
    resetCurrentUser() {
      this.currentUser = null;
      this.persist();
    }

    /**
     * Returns the user catalog with the current user ALWAYS dynamically at the TOP
     */
    getUsers() {
      if (!this.currentUser) {
        return [...this.users];
      }
      const others = this.users.filter(u => u.id !== this.currentUser.id);
      return [this.currentUser, ...others];
    }

    /**
     * Find user by id or by name (case-insensitive)
     */
    findUser(idOrName) {
      if (!idOrName) return null;
      const lower = idOrName.toLowerCase().trim();
      return this.users.find(u => u.id.toLowerCase() === lower || u.name.toLowerCase() === lower) || null;
    }

    /**
     * Active recipient management for the scriptorium writing desk
     */
    getActiveRecipient() {
      return this.activeRecipient || 'Elias';
    }

    setActiveRecipient(nameOrId) {
      const user = this.findUser(nameOrId);
      if (user) {
        this.activeRecipient = user.name;
      } else if (nameOrId && nameOrId.trim()) {
        this.activeRecipient = nameOrId.trim();
      } else {
        this.activeRecipient = 'Elias';
      }
      this.persist();
      return this.activeRecipient;
    }

    /**
     * Dynamically calculated MESSAGES SENT where senderId === currentUser.id
     */
    getSentMessages(userId = null) {
      const targetId = userId || (this.currentUser ? this.currentUser.id : null);
      if (!targetId) return [];
      return this.messages.filter(m => m.senderId === targetId);
    }

    /**
     * Dynamically calculated MESSAGES RECEIVED where receiverId === currentUser.id
     */
    getReceivedMessages(userId = null) {
      const targetId = userId || (this.currentUser ? this.currentUser.id : null);
      if (!targetId) return [];
      return this.messages.filter(m => m.receiverId === targetId);
    }

    /**
     * Record a new letter sent from the writing desk
     * @param {string} content - Written or dictated letter text
     * @param {string} recipientName - Recipient name
     * @param {Array} gestures - Optional detected gesture names
     */
    recordSentMessage(content, recipientName = null, gestures = []) {
      const text = (content && content.trim()) ? content.trim() : 'Langue parlée refers to the spoken language — the beauty in shared human thought.';
      const recipient = this.findUser(recipientName || this.activeRecipient) || {
        id: `user-${(recipientName || this.activeRecipient || 'recipient').toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: recipientName || this.activeRecipient || 'Elias'
      };

      const sender = this.currentUser || {
        id: 'user-scribe',
        name: 'Scribe',
        anonymous: false
      };

      const newIndex = this.messages.length + 1;
      const numStr = String(newIndex).padStart(3, '0');

      const newLetter = {
        id: `letter-${numStr}`,
        letterNumber: numStr,
        senderId: sender.id,
        senderName: sender.name,
        receiverId: recipient.id,
        receiverName: recipient.name,
        date: 'Just now',
        timestamp: Date.now(),
        status: 'dispatched',
        excerpt: text.length > 120 ? text.slice(0, 117) + '...' : text,
        body: `Unto ${recipient.name},\n\n${text}\n\n— Dispatched under seal from ${sender.name}`,
        gestures: Array.isArray(gestures) ? gestures : []
      };

      // Add to front so newest appears first
      this.messages.unshift(newLetter);
      this.persist();
      return newLetter;
    }

    getMessageById(id) {
      return this.messages.find(m => m.id === id) || null;
    }
  }

  // Export singleton instance on window
  window.ArchivalStore = ArchivalStore;
  window.archivalStore = new ArchivalStore();

})(window);
