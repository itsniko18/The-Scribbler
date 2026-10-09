/**
 * ============================================================================
 * LIVING SCRIPT — ARCHIVAL UI CONTROLLER (archival-system.js)
 * ============================================================================
 * Coordinates the Entry Modal, 3-column Scriptorium Dashboard, Letter Folio,
 * and seamlessly binds to the existing "Write Back" scriptorium writing desk.
 */

(function (window, document) {
  'use strict';

  function initArchivalSystem() {
    const correspondenceBtn = document.getElementById('correspondenceToggleBtn');
    const correspondenceDropdown = document.getElementById('archivalUserDropdown');

    if (correspondenceBtn && correspondenceDropdown) {
      correspondenceBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isHidden = correspondenceDropdown.style.display === 'none' || !correspondenceDropdown.style.display;
        correspondenceDropdown.style.display = isHidden ? 'block' : 'none';
      });

      document.addEventListener('click', (e) => {
        if (!correspondenceBtn.contains(e.target) && !correspondenceDropdown.contains(e.target)) {
          correspondenceDropdown.style.display = 'none';
        }
      });
    }

    const store = window.archivalStore;
    if (!store) {
      console.warn('ArchivalSystem: ArchivalStore not found.');
      return;
    }

    // Elements: Entry Modal
    const entryOverlay = document.getElementById('userEntryModal');
    const nameInput = document.getElementById('archivalNameInput');
    const anonToggleBtn = document.getElementById('archivalAnonToggleBtn');
    const exploreBtn = document.getElementById('archivalExploreBtn');
    const entryCloseBtn = document.getElementById('archivalEntryCloseBtn');

    // State for Entry Modal
    let isAnonymousSelected = false;

    // Check if user has already entered identity
    if (!store.hasCurrentUser()) {
      showEntryModal();
    } else {
      hideEntryModal();
    }

    function showEntryModal() {
      if (!entryOverlay) return;
      isAnonymousSelected = false;
      if (anonToggleBtn) anonToggleBtn.classList.remove('is-active');
      if (nameInput) {
        nameInput.value = '';
        nameInput.disabled = false;
        nameInput.placeholder = 'Your name or scribe title...';
      }
      entryOverlay.classList.remove('is-hidden');
      setTimeout(() => {
        if (nameInput) nameInput.focus();
      }, 200);
    }

    function hideEntryModal() {
      if (!entryOverlay) return;
      entryOverlay.classList.add('is-hidden');
    }

    // Toggle anonymous mode
    if (anonToggleBtn) {
      anonToggleBtn.addEventListener('click', () => {
        isAnonymousSelected = !isAnonymousSelected;
        anonToggleBtn.classList.toggle('is-active', isAnonymousSelected);
        if (nameInput) {
          if (isAnonymousSelected) {
            nameInput.value = '';
            nameInput.disabled = true;
            nameInput.placeholder = '[ Inscribing as Anonymous ]';
          } else {
            nameInput.disabled = false;
            nameInput.placeholder = 'Your name or scribe title...';
            nameInput.focus();
          }
        }
      });
    }

    // Submit identity & Explore Dashboard
    function handleExploreSubmit() {
      const enteredName = nameInput ? nameInput.value.trim() : '';

      if (!isAnonymousSelected && !enteredName) {
        // Subtle shake effect or gentle prompt
        if (nameInput) {
          nameInput.style.borderBottomColor = 'var(--rust, #a5432a)';
          nameInput.placeholder = 'Please enter a name or choose anonymous...';
          nameInput.focus();
        }
        return;
      }

      store.setCurrentUser(enteredName, isAnonymousSelected);
      hideEntryModal();

      // Open Dashboard immediately as requested by user flow
      if (typeof window.showView === 'function') {
        window.showView('archive');
      } else {
        const dashView = document.getElementById('dashboardArchiveView');
        if (dashView) {
          dashView.style.display = 'block';
          renderDashboardArchive();
        }
      }
    }

    if (exploreBtn) {
      exploreBtn.addEventListener('click', handleExploreSubmit);
    }

    if (nameInput) {
      nameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleExploreSubmit();
        }
      });
    }

    if (entryCloseBtn) {
      entryCloseBtn.addEventListener('click', () => {
        // If closing without name, default to anonymous
        if (!store.hasCurrentUser()) {
          store.setCurrentUser('Scribe', false);
        }
        hideEntryModal();
      });
    }

    // Identity switch link in dashboard header
    const changeIdentityBtn = document.getElementById('archivalChangeIdentityBtn');
    if (changeIdentityBtn) {
      changeIdentityBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showEntryModal();
      });
    }

    // ========================================================================
    // RENDER DASHBOARD ARCHIVE (3-COLUMN SCRIPTORIUM FOLIO)
    // ========================================================================
    function renderDashboardArchive() {
      const currentUser = store.getCurrentUser() || { id: 'anon', name: 'Scribe', role: 'Archival Scribe' };

      // 1. Update Header Identity & Counts
      const currentScribeEl = document.getElementById('archivalCurrentScribeName');
      if (currentScribeEl) {
        currentScribeEl.textContent = currentUser.name;
      }

      const sentMsgs = store.getSentMessages();
      const recvMsgs = store.getReceivedMessages();

      const sentCountEl = document.getElementById('archivalSentCount');
      if (sentCountEl) {
        sentCountEl.textContent = String(sentMsgs.length).padStart(2, '0');
      }

      const recvCountEl = document.getElementById('archivalReceivedCount');
      if (recvCountEl) {
        recvCountEl.textContent = String(recvMsgs.length).padStart(2, '0');
      }

      // Also update any legacy census stat counters if present
      const legSent = document.getElementById('statsLettersSent');
      if (legSent) legSent.textContent = String(sentMsgs.length).padStart(2, '0');
      const legRecv = document.getElementById('statsLettersReceived');
      if (legRecv) legRecv.textContent = String(recvMsgs.length).padStart(2, '0');

      // 2. Render Column 1: Users / Correspondence Index
      const userListEl = document.getElementById('archivalUserCatalogList');
      if (userListEl) {
        userListEl.innerHTML = '';
        const allUsers = store.getUsers();

        allUsers.forEach((user, idx) => {
          const isMe = user.id === currentUser.id;
          const li = document.createElement('li');
          li.className = `archival-user-item ${isMe ? 'is-current-user' : ''}`;
          li.setAttribute('role', 'button');
          li.setAttribute('tabindex', '0');

          li.innerHTML = `
            <div class="archival-user-name-row">
              <span class="archival-user-name">
                ${isMe ? '<span class="archival-current-indicator">✦</span>' : ''}
                ${escapeHtml(user.name)}
              </span>
              ${isMe 
                ? '<span class="archival-user-tag-badge">(You)</span>' 
                : '<span class="archival-write-prompt">WRITE</span>'}
            </div>
            <div class="archival-user-role">${escapeHtml(user.role || (isMe ? 'Current Scribe' : 'Archival Correspondent'))}</div>
          `;

          li.addEventListener('click', () => {
            if (isMe) {
              // Clicking self lets user change identity if desired
              showEntryModal();
            } else {
              // Clicking another user opens the EXISTING "Write Back" interface!
              if (correspondenceDropdown) correspondenceDropdown.style.display = 'none';
              selectRecipientAndWrite(user.name);
            }
          });

          li.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              li.click();
            }
          });

          userListEl.appendChild(li);
        });
      }

      // 3. Render Column 2: Messages Sent
      const sentListEl = document.getElementById('archivalSentMessagesList');
      if (sentListEl) {
        sentListEl.innerHTML = '';
        if (sentMsgs.length === 0) {
          sentListEl.innerHTML = `
            <div class="archival-empty-state">
              <div class="archival-empty-glyph"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L3 12.5V21h8.5l8.74-8.76z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></svg></div>
              <div>No dispatches sent yet.</div>
              <div style="font-size: 11px; margin-top: 6px;">Select a correspondent from the list to inscribe your first letter.</div>
            </div>
          `;
        } else {
          sentMsgs.forEach((msg) => {
            const li = document.createElement('li');
            li.className = 'archival-message-entry';
            li.innerHTML = `
              <div class="archival-msg-header-row">
                <span class="archival-msg-party">TO: ${escapeHtml(msg.receiverName || 'Elias')}</span>
                <span class="archival-msg-id-tag">Letter #${escapeHtml(msg.letterNumber || '001')}</span>
              </div>
              <div class="archival-msg-meta-row">
                <span>${escapeHtml(msg.date || 'Recent')}</span>
                <span class="archival-msg-status">${escapeHtml(msg.status || 'Dispatched')}</span>
              </div>
              <p class="archival-msg-excerpt">${escapeHtml(msg.excerpt || msg.body || '')}</p>
              <div class="archival-msg-action-bar">
                <button type="button" class="archival-msg-action-btn">Read Folio &rarr;</button>
              </div>
            `;
            li.addEventListener('click', () => openLetterDetailFolio(msg));
            sentListEl.appendChild(li);
          });
        }
      }

      // 4. Render Column 3: Messages Received
      const recvListEl = document.getElementById('archivalReceivedMessagesList');
      if (recvListEl) {
        recvListEl.innerHTML = '';
        if (recvMsgs.length === 0) {
          recvListEl.innerHTML = `
            <div class="archival-empty-state">
              <div class="archival-empty-glyph"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg></div>
              <div>No incoming dispatches catalogued.</div>
              <div style="font-size: 11px; margin-top: 6px;">Letters sent to you will be filed in this cloister ledger.</div>
            </div>
          `;
        } else {
          recvMsgs.forEach((msg) => {
            const li = document.createElement('li');
            li.className = 'archival-message-entry is-received';
            li.innerHTML = `
              <div class="archival-msg-header-row">
                <span class="archival-msg-party">FROM: ${escapeHtml(msg.senderName || 'Archivist')}</span>
                <span class="archival-msg-id-tag">Letter #${escapeHtml(msg.letterNumber || '001')}</span>
              </div>
              <div class="archival-msg-meta-row">
                <span>${escapeHtml(msg.date || 'Recent')}</span>
                <span class="archival-msg-status" style="color: #781c13;">Received</span>
              </div>
              <p class="archival-msg-excerpt">${escapeHtml(msg.excerpt || msg.body || '')}</p>
              <div class="archival-msg-action-bar">
                <button type="button" class="archival-msg-action-btn write-back-link">Write Back &rarr;</button>
              </div>
            `;
            // Click to read folio
            li.addEventListener('click', (e) => {
              if (e.target && e.target.classList.contains('write-back-link')) {
                e.stopPropagation();
                selectRecipientAndWrite(msg.senderName);
              } else {
                openLetterDetailFolio(msg);
              }
            });
            recvListEl.appendChild(li);
          });
        }
      }
    }

    window.renderDashboardArchive = renderDashboardArchive;

    // ========================================================================
    // SELECT RECIPIENT & NAVIGATE TO EXISTING WRITE BACK DESK
    // ========================================================================
    function selectRecipientAndWrite(recipientName) {
      store.setActiveRecipient(recipientName);

      // Update badge elements on existing writing desk
      const badge = document.getElementById('activeRecipientBadge');
      if (badge) badge.textContent = recipientName.toUpperCase();

      const userObj = store.findUser(recipientName);
      const role = document.getElementById('activeRecipientRole');
      if (role) role.textContent = userObj ? userObj.role : 'Archival Correspondent';

      const sentRecip = document.getElementById('sentRecipientName');
      if (sentRecip) sentRecip.textContent = recipientName.toUpperCase();

      // Open existing writing desk view
      if (typeof window.showView === 'function') {
        window.showView('writeback');
      }

      // Update feedback line on existing desk
      const fb = document.getElementById('feedback');
      if (fb) {
        fb.innerHTML = `Correspondence addressed to <b>${escapeHtml(recipientName.toUpperCase())}</b> &mdash; inscribe by voice or typewriter.`;
      }
    }
    window.selectRecipientAndWrite = selectRecipientAndWrite;

    // ========================================================================
    // FULL LETTER FOLIO PREVIEW MODAL
    // ========================================================================
    const letterFolioBackdrop = document.getElementById('archivalLetterDetailBackdrop');
    const folioNumberEl = document.getElementById('archivalFolioNumber');
    const folioTitleEl = document.getElementById('archivalFolioTitle');
    const folioDateEl = document.getElementById('archivalFolioDate');
    const folioPartiesEl = document.getElementById('archivalFolioParties');
    const folioBodyEl = document.getElementById('archivalFolioBody');
    const folioWriteBackBtn = document.getElementById('archivalFolioWriteBackBtn');
    const folioCloseBtn = document.getElementById('archivalFolioCloseBtn');

    function openLetterDetailFolio(letter) {
      if (!letterFolioBackdrop || !letter) return;

      const isSent = letter.senderId === (store.currentUser ? store.currentUser.id : null);
      const otherName = isSent ? (letter.receiverName || 'Elias') : (letter.senderName || 'Mara');

      if (folioNumberEl) folioNumberEl.textContent = `N&deg; ${letter.letterNumber || '001'} • SCRIPTORIUM RECORD`;
      if (folioTitleEl) folioTitleEl.textContent = `Correspondence with ${otherName}`;
      if (folioDateEl) folioDateEl.textContent = letter.date || 'Recorded';
      if (folioPartiesEl) {
        folioPartiesEl.innerHTML = isSent
          ? `Dispatched by <strong>${escapeHtml(letter.senderName || 'You')}</strong> &rarr; Addressed to <strong>${escapeHtml(letter.receiverName || otherName)}</strong>`
          : `Inscribed by <strong>${escapeHtml(letter.senderName || otherName)}</strong> &rarr; Delivered unto <strong>${escapeHtml(letter.receiverName || 'You')}</strong>`;
      }
      if (folioBodyEl) {
        folioBodyEl.textContent = letter.body || letter.excerpt || '';
      }

      if (folioWriteBackBtn) {
        folioWriteBackBtn.onclick = function () {
          closeLetterDetailFolio();
          selectRecipientAndWrite(otherName);
        };
      }

      letterFolioBackdrop.classList.remove('is-hidden');
    }

    function closeLetterDetailFolio() {
      if (letterFolioBackdrop) {
        letterFolioBackdrop.classList.add('is-hidden');
      }
    }
    window.closeLetterDetailFolio = closeLetterDetailFolio;

    if (folioCloseBtn) {
      folioCloseBtn.addEventListener('click', closeLetterDetailFolio);
    }
    if (letterFolioBackdrop) {
      letterFolioBackdrop.addEventListener('click', (e) => {
        if (e.target === letterFolioBackdrop) closeLetterDetailFolio();
      });
    }

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeLetterDetailFolio();
      }
    });

    // Initial render of dashboard if visible
    renderDashboardArchive();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initArchivalSystem);
  } else {
    initArchivalSystem();
  }

})(window, document);
