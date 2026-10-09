/**
 * ============================================================================
 * TRAVELLER ENTRY FLOW & IDENTITY MODAL (traveller-modal.js)
 * ============================================================================
 * Displays the centered popup:
 * "Traveller. Enter your name here."
 * Persists persistent traveller identity (UUID) across Living Script and Dashboard.
 */

(function (window, document) {
  'use strict';

  function ensureModalElement() {
    let overlay = document.getElementById('travellerEntryModal');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'travellerEntryModal';
    overlay.className = 'traveller-modal-overlay is-hidden';
    overlay.innerHTML = `
      <div class="traveller-modal-card" role="dialog" aria-modal="true" aria-labelledby="travellerModalTitle">
        <div class="traveller-modal-crest">✒</div>
        <h2 class="traveller-modal-title" id="travellerModalTitle">Traveller. Enter your name here.</h2>
        <p class="traveller-modal-sub">
          Inscribe your name into the Scribbler. Your letters will bind you to your mark across the shared world. Your true name need not be known.
        </p>
        
        <form id="travellerEntryForm" onsubmit="return false;">
          <div class="traveller-form-group">
            <input 
              type="text" 
              id="travellerNameInput" 
              class="traveller-input" 
              autocomplete="name"
              maxlength="40"
            />
          </div>

          <button type="submit" id="travellerSubmitBtn" class="traveller-submit-btn">
            Enter Scriptorium
          </button>
        </form>

        <div id="travellerCurrentBadge" class="traveller-info-badge" style="display: none;"></div>

        <svg class="traveller-modal-flourish" width="100%" height="16" viewBox="0 0 140 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 8 C35 1 45 15 70 8 C95 1 105 15 130 8" stroke="#8c7355" stroke-width="1.2" stroke-linecap="round" />
          <circle cx="70" cy="8" r="2.5" fill="#8c7355" />
          <circle cx="10" cy="9" r="1.5" fill="#8c7355" />
          <circle cx="130" cy="8" r="1.5" fill="#8c7355" />
        </svg>
      </div>
    `;

    document.body.appendChild(overlay);
    bindModalEvents(overlay);
    return overlay;
  }

  function bindModalEvents(overlay) {
    const form = overlay.querySelector('#travellerEntryForm');
    const input = overlay.querySelector('#travellerNameInput');
    const submitBtn = overlay.querySelector('#travellerSubmitBtn');

    async function handleSubmit() {
      const backend = window.supabaseBackend;
      const rawName = input ? input.value.trim() : '';

      if (!rawName) {
        if (input) {
          input.style.borderColor = '#7a2318';
          input.focus();
        }
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Entering...';
      }

      try {
        const traveller = await backend.registerTraveller(rawName, false);
        closeTravellerModal();

        // Dispatch notification so pages know identity was registered and transition to envelope
        window.dispatchEvent(new CustomEvent('travellerChanged', { detail: traveller }));
      } catch (err) {
        console.error('[TravellerModal] Registration error:', err);
        closeTravellerModal();
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Enter Scriptorium';
        }
      }
    }

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        handleSubmit();
      });
    }
  }

  function openTravellerModal(allowCloseIfExisting = false) {
    const overlay = ensureModalElement();
    const input = overlay.querySelector('#travellerNameInput');
    const badge = overlay.querySelector('#travellerCurrentBadge');

    const backend = window.supabaseBackend;
    const current = backend ? backend.getCurrentTraveller() : null;

    if (input) {
      input.disabled = false;
      input.value = current && !current.is_anonymous ? current.name : '';
      if (input.value) {
        input.select();
      }
    }

    if (badge && current) {
      badge.style.display = 'block';
      badge.textContent = `Current: ${current.name} (ID: ${current.id.slice(0, 8)}...)`;
    } else if (badge) {
      badge.style.display = 'none';
    }

    overlay.classList.remove('is-hidden');
    setTimeout(() => {
      if (input) input.focus();
    }, 200);
  }

  function closeTravellerModal() {
    const overlay = document.getElementById('travellerEntryModal');
    if (overlay) {
      overlay.classList.add('is-hidden');
    }
  }

  function initTravellerFlow() {
    // If typewriter intro overlay is active on the page, wait until "Ready to explore?" is clicked
    const introEl = document.getElementById('typewriterIntro');
    const hasIntro = introEl && !document.documentElement.classList.contains('skip-typewriter-intro') && window.getComputedStyle(introEl).display !== 'none';
    
    if (!hasIntro) {
      // If we are directly on dashboard or desk without typewriter intro, check identification
      const backend = window.supabaseBackend;
      if (!backend || !backend.hasCurrentTraveller()) {
        openTravellerModal();
      }
    }
  }

  window.openTravellerModal = openTravellerModal;
  window.closeTravellerModal = closeTravellerModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTravellerFlow);
  } else {
    initTravellerFlow();
  }

})(window, document);
