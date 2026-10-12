const fs = require('fs');
const path = require('path');

const dir = __dirname;
console.log('Generating consolidated living-script.htm with library fix...');

// Read all source files
const livingHtml = fs.readFileSync(path.join(dir, 'living-script.htm.bak'), 'utf8');
const dashHtml = fs.readFileSync(path.join(dir, 'dashboard.html'), 'utf8');
const fogHtml = fs.readFileSync(path.join(dir, 'fog-mirror.html'), 'utf8');
const travellerCss = fs.readFileSync(path.join(dir, 'traveller-modal.css'), 'utf8');
const travellerJs = fs.readFileSync(path.join(dir, 'traveller-modal.js'), 'utf8');
const supabaseConfigJs = fs.readFileSync(path.join(dir, 'supabase-config.js'), 'utf8');
const supabaseClientJs = fs.readFileSync(path.join(dir, 'supabase-client.js'), 'utf8');

// 1. EXTRACT DASHBOARD CSS (from .wrap onwards)
const dashStyleFull = dashHtml.match(/<style>([\s\S]*?)<\/style>/)[1];
const dashWrapIndex = dashStyleFull.indexOf('.wrap {');
let dashExtractedCss = dashStyleFull.slice(dashWrapIndex);

// Scope generic dashboard selectors so they do NOT override manuscript sheet elements
dashExtractedCss = dashExtractedCss.replace(/(^|\n)(header\s*\{)/g, '$1.dashboard-stage-view header {');
dashExtractedCss = dashExtractedCss.replace(/(^|\n)(h1\.bohemian-heading\s*\{)/g, '$1.dashboard-stage-view h1.bohemian-heading {');
dashExtractedCss = dashExtractedCss.replace(/(^|\n)(\.bohemian-flourish\s*\{)/g, '$1.dashboard-stage-view .bohemian-flourish {');
dashExtractedCss = dashExtractedCss.replace(/(^|\n)(\.header-actions\s*\{)/g, '$1.dashboard-stage-view .header-actions {');
dashExtractedCss = dashExtractedCss.replace(/(^|\n)(\.typewriter-action-link[\s\:\w-]*\{)/g, (match) => {
  return match.replace('.typewriter-action-link', '.dashboard-stage-view .typewriter-action-link');
});

// Remove duplicate library styling from dashboard CSS
dashExtractedCss = dashExtractedCss.replace(
  /\/\* Fixed Viewport Top-Left Corner Library[\s\S]*?\.library-row \.lib-word \{[\s\S]*?\}/i,
  ''
);

// 2. EXTRACT DASHBOARD BODY HTML
const dashBodyContentMatch = dashHtml.match(/<body>([\s\S]*?)<!-- Supabase Backend/i);
let dashBodyHtml = '';
if (dashBodyContentMatch) {
  dashBodyHtml = dashBodyContentMatch[1];
} else {
  const fallbackMatch = dashHtml.match(/<body>([\s\S]*?)<script src="supabase-config.js"/i);
  dashBodyHtml = fallbackMatch[1];
}

// Remove duplicate top-left library box from dashboard body (already fixed in viewport)
dashBodyHtml = dashBodyHtml.replace(/<!-- Fixed Viewport Top-Left Corner Library[\s\S]*?<\/div>\s*<\/div>/i, '');

// Convert backToScriptoriumBtn in dashboard HTML to a button
dashBodyHtml = dashBodyHtml.replace(
  /<a href="living-script\.htm\?view=writeback#writeback"[^>]*id="backToScriptoriumBtn"[^>]*>([\s\S]*?)<\/a>/i,
  '<button type="button" class="typewriter-action-link" id="backToScriptoriumBtn">$1</button>'
);

// 3. EXTRACT DASHBOARD JS
const dashScriptMatch = dashHtml.match(/<script>\s*let nid = 0;([\s\S]*?)<\/script>\s*<\/body>/i);
let dashScriptContent = 'let nid = 0;' + dashScriptMatch[1];

// Remove duplicate library listener and renderLibrary from dashboard script (already in living-script engine)
dashScriptContent = dashScriptContent.replace(
  /\/\/\s*----\s*Library in Top Left Corner[\s\S]*?libraryList\.classList\.remove\('open'\);\s*\}\s*\}\);\s*\}/i,
  ''
);

// 4. EXTRACT FOG MIRROR CSS
const fogStyleFull = fogHtml.match(/<style>([\s\S]*?)<\/style>/)[1];
let fogExtractedCss = fogStyleFull.replace(
  /html,\s*body\s*\{[\s\S]*?\}/i,
  `.fog-mirror-stage-view {
    margin: 0;
    width: 100vw;
    height: 100vh;
    height: 100dvh;
    background: var(--bg-tint, #cfcdc8);
    overflow: hidden;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    color: var(--text-primary, #18181b);
    user-select: none;
    -webkit-user-select: none;
  }`
);
fogExtractedCss = fogExtractedCss.replace(
  /video,\s*canvas#ink,\s*canvas#handSkel,\s*#fog\s*\{/i,
  `#fogMirrorStage video, #fogMirrorStage canvas#ink, #fogMirrorStage canvas#handSkel, #fogMirrorStage #fog {`
);

// 5. EXTRACT FOG MIRROR HTML
const fogBodyMatch = fogHtml.match(/<body>([\s\S]*?)<script type="module">/i);
let fogBodyHtml = fogBodyMatch[1].trim();
fogBodyHtml = fogBodyHtml.replace(
  /<a href="living-script\.htm\?view=writeback#writeback"[^>]*id="backToWriteBackBtn"[^>]*>([\s\S]*?)<\/a>/i,
  '<button type="button" class="back-to-writeback-btn" id="backToWriteBackBtn" aria-label="Return to Write Back section" title="Return to Write Back">$1</button>'
);

// 6. EXTRACT FOG MIRROR JS
const fogScriptMatch = fogHtml.match(/<script type="module">([\s\S]*?)<\/script>\s*<\/body>/i);
let fogScriptContent = fogScriptMatch[1];
// Replace back button redirection in fog script with SPA showView
fogScriptContent = fogScriptContent.replace(
  /document\.body\.classList\.add\("fade-to-writeback"\);[\s\S]*?window\.location\.href = "living-script\.htm\?view=writeback#writeback";[\s\S]*?\}, 200\);/i,
  `if (typeof window.showView === 'function') {
      window.showView('writeback');
    }`
);

// -------------------------------------------------------------
// 7. ASSEMBLE NEW CONSOLIDATED HTML
// -------------------------------------------------------------
let result = livingHtml;

// A. Update Google Fonts link to include Inter for Fog Mirror
result = result.replace(
  /<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=Cinzel\+Decorative:wght@700;900&family=Cinzel:wght@500;700&family=Pirata\+One&family=EB\+Garamond:ital,wght@0,400;0,600;1,400&family=Courier\+Prime:ital,wght@0,400;0,700;1,400&family=Newsreader:opsz,wght@6\.\.72,400;6\.\.72,500&display=swap" rel="stylesheet">/,
  `<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@500;700&family=Pirata+One&family=EB+Garamond:ital,wght@0,400;0,600;1,400&family=Courier+Prime:ital,wght@0,400;0,700;1,400&family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">`
);

// B. Remove external traveller-modal.css link
result = result.replace(
  /<link rel="stylesheet" href="traveller-modal\.css">\s*/i,
  ''
);

// C. Remove the restriction hiding libraryBox before envelope open
result = result.replace(
  /body:not\(\.is-opened\)\s*\.library-clean-box\s*\{\s*display:\s*none\s*!important;\s*\}/g,
  ''
);

// D. Append inlined styles to the existing <style> block
const combinedStyles = `
    /* ==================================================
       INLINED: TRAVELLER ENTRY MODAL (traveller-modal.css)
       ================================================== */
${travellerCss}

    /* ==================================================
       INLINED: THE COURIER'S LEDGER DASHBOARD (dashboard.html)
       ================================================== */
${dashExtractedCss}

    /* ==================================================
       INLINED: FOG MIRROR AI HAND TRACKING (fog-mirror.html)
       ================================================== */
${fogExtractedCss}

    /* ==================================================
       DARK INK MATCHING: "YOU'VE GOT MAIL" & ACTION LINKS
       Exact match to "SCRIPTORIUM WRITING DESK" (#181512)
       ================================================== */
    .home-letter-view .bohemian-heading {
      color: var(--dark-ink, #181512) !important;
      text-shadow: none !important;
    }
    .home-letter-view .typewriter-action-link,
    .manuscript-sheet .typewriter-action-link {
      color: var(--dark-ink, #181512) !important;
    }
    .home-letter-view .typewriter-action-link::before,
    .home-letter-view .typewriter-action-link::after,
    .manuscript-sheet .typewriter-action-link::before,
    .manuscript-sheet .typewriter-action-link::after {
      color: var(--dark-ink, #181512) !important;
      opacity: 0.55;
    }
    .home-letter-view .typewriter-action-link:hover,
    .manuscript-sheet .typewriter-action-link:hover {
      color: var(--wax-red, #781c13) !important;
    }

    /* ==================================================
       CONSOLIDATED SPA STAGE SWITCHING & LIBRARY VISIBILITY
       ================================================== */
    .dashboard-stage-view {
      display: none;
      min-height: 100vh;
      position: relative;
      z-index: 10;
    }
    .dashboard-stage-view.is-active {
      display: block !important;
    }

    .fog-mirror-stage-view {
      display: none;
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      height: 100dvh;
      z-index: 999999;
      background: var(--bg-tint, #cfcdc8);
    }
    .fog-mirror-stage-view.is-active {
      display: block !important;
    }
    .fog-mirror-stage-view:not(.is-active) {
      display: none !important;
    }
    .fog-mirror-stage-view:not(.is-active) * {
      display: none !important;
    }

    /* Ensure Library Box is always visible & interactive across all views except Fog Mirror */
    .library-clean-box {
      display: flex !important;
      z-index: 999999 !important;
      pointer-events: auto !important;
    }
    #libraryToggleBtn {
      pointer-events: auto !important;
      cursor: pointer !important;
    }
    #libraryList {
      z-index: 9999999 !important;
      pointer-events: auto !important;
    }
    #libraryList.open {
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
    }

    body.in-fog-view #libraryBox,
    body.in-fog-view #dashboardCornerBox {
      display: none !important;
    }
  </style>`;

result = result.replace(/<\/style>/, combinedStyles);

// E. Convert corner <a> navigation links to buttons
result = result.replace(
  /<a href="fog-mirror\.html" id="fogMirrorBtn" class="pen-fog-mirror-btn" aria-label="Open Fog Mirror" title="Write in Fog Mirror">([\s\S]*?)<\/a>/i,
  `<button type="button" id="fogMirrorBtn" class="pen-fog-mirror-btn" aria-label="Open Fog Mirror" title="Write in Fog Mirror">$1</button>`
);

result = result.replace(
  /<a href="dashboard\.html" id="topDashboardBtn" class="dashboard-corner-btn" aria-label="The Courier's Ledger Dashboard" title="The Courier's Ledger — Dashboard">([\s\S]*?)<\/a>/i,
  `<button type="button" id="topDashboardBtn" class="dashboard-corner-btn" aria-label="The Courier's Ledger Dashboard" title="The Courier's Ledger — Dashboard">$1</button>`
);

// F. Convert viewDashboardBtn and sentToDashboardBtn onclick attributes
result = result.replace(
  /<button class="typewriter-action-link" id="viewDashboardBtn" type="button" onclick="window\.location\.href='dashboard\.html'">View dashboard<\/button>/i,
  `<button class="typewriter-action-link" id="viewDashboardBtn" type="button">View dashboard</button>`
);

result = result.replace(
  /<button class="typewriter-action-link" id="sentToDashboardBtn" type="button" onclick="window\.location\.href='dashboard\.html'">view dashboard &rarr;<\/button>/i,
  `<button class="typewriter-action-link" id="sentToDashboardBtn" type="button">view dashboard &rarr;</button>`
);

// G. Insert Dashboard and Fog Mirror stage containers right after </main>
const stagesHtml = `
  <!-- ==========================================
       CONSOLIDATED STAGE: THE COURIER'S LEDGER (DASHBOARD)
       ========================================== -->
  <div id="dashboardStage" class="dashboard-stage-view is-hidden">
${dashBodyHtml}
  </div>

  <!-- ==========================================
       CONSOLIDATED STAGE: FOG MIRROR (AI HAND TRACKING)
       ========================================== -->
  <div id="fogMirrorStage" class="fog-mirror-stage-view is-hidden">
${fogBodyHtml}
  </div>
`;

result = result.replace(/<\/main>/, `</main>\n${stagesHtml}`);

// H. Replace view controller and button wiring in living-script.htm
const oldControllerSectionRegex = /function showView\(view\) \{[\s\S]*?\/\/ Deep-link directly to Write Back section when requested[\s\S]*?\}\s*\}\s*catch\s*\(e\)\s*\{\}\s*\}\)\(\);/;

const newControllerCode = `function showView(view) {
        const dashboardStage = document.getElementById('dashboardStage');
        const fogMirrorStage = document.getElementById('fogMirrorStage');
        const deskScene = document.getElementById('deskScene');
        const typewriterIntro = document.getElementById('typewriterIntro');

        function stopFogCamera() {
          const camVideo = document.getElementById('cam');
          if (camVideo && camVideo.srcObject) {
            try {
              camVideo.srcObject.getTracks().forEach(t => t.stop());
              camVideo.srcObject = null;
            } catch (e) {}
          }
        }

        if (view === 'dashboard') {
          stopFogCamera();
          if (deskScene) deskScene.style.display = 'none';
          if (fogMirrorStage) {
            fogMirrorStage.classList.remove('is-active');
            fogMirrorStage.classList.add('is-hidden');
          }
          if (dashboardStage) {
            dashboardStage.classList.add('is-active');
            dashboardStage.classList.remove('is-hidden');
          }
          document.body.classList.remove('in-fog-view');
          document.body.classList.add('in-dashboard-view');
          if (typewriterIntro) typewriterIntro.style.display = 'none';
          if (window.loadDashboardMessages) window.loadDashboardMessages();
          try { history.replaceState(null, '', '#dashboard'); } catch(e){}
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }

        if (view === 'fog-mirror') {
          if (deskScene) deskScene.style.display = 'none';
          if (dashboardStage) {
            dashboardStage.classList.remove('is-active');
            dashboardStage.classList.add('is-hidden');
          }
          if (fogMirrorStage) {
            fogMirrorStage.classList.add('is-active');
            fogMirrorStage.classList.remove('is-hidden');
          }
          document.body.classList.remove('in-dashboard-view');
          document.body.classList.add('in-fog-view');
          if (typewriterIntro) typewriterIntro.style.display = 'none';
          if (window.resizeFogCanvas) window.resizeFogCanvas();
          try { history.replaceState(null, '', '#fog-mirror'); } catch(e){}
          return;
        }

        // Return to Desk Scene views
        stopFogCamera();
        if (dashboardStage) {
          dashboardStage.classList.remove('is-active');
          dashboardStage.classList.add('is-hidden');
        }
        if (fogMirrorStage) {
          fogMirrorStage.classList.remove('is-active');
          fogMirrorStage.classList.add('is-hidden');
        }
        document.body.classList.remove('in-dashboard-view', 'in-fog-view');
        if (deskScene) deskScene.style.display = '';

        if (view === 'envelope') {
          closeEnvelope();
          try { history.replaceState(null, '', '#envelope'); } catch(e){}
          return;
        }

        // Auto-open desk scene if jumping straight to letter or writeback
        if (!isOpened) {
          deskScene.classList.add('is-opened');
          document.body.classList.add('is-opened');
          isOpened = true;
        }

        homeLetterView.style.display = 'none';
        writeBackView.style.display = 'none';
        if (sentPaperView) sentPaperView.style.display = 'none';

        if (view === 'home' || view === 'letter') {
          deskScene.classList.remove('in-sent-view');
          deskScene.classList.remove('in-writeback-view');
          document.body.classList.remove('in-writeback-view');
          homeLetterView.style.display = 'block';
          try { history.replaceState(null, '', '#letter'); } catch(e){}
        } else if (view === 'writeback') {
          deskScene.classList.remove('in-sent-view');
          deskScene.classList.add('in-writeback-view');
          document.body.classList.add('in-writeback-view');
          writeBackView.style.display = 'block';
          window.dispatchEvent(new Event('resize'));
          try { history.replaceState(null, '', '#writeback'); } catch(e){}
        } else if (view === 'sent-paper') {
          deskScene.classList.add('in-sent-view');
          deskScene.classList.remove('in-writeback-view');
          document.body.classList.remove('in-writeback-view');
          if (sentPaperView) {
            sentPaperView.style.display = 'block';
            if (typeof window.renderSentPaper === 'function') {
              window.renderSentPaper();
            }
          }
          try { history.replaceState(null, '', '#sent'); } catch(e){}
        }

        const sheet = document.querySelector('.manuscript-sheet');
        if (sheet && view !== 'envelope') {
          sheet.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }

      if (returnToDeskBtn) {
        returnToDeskBtn.addEventListener('click', () => {
          showView('writeback');
        });
      }
      window.showView = showView;
      window.closeEnvelope = closeEnvelope;

      // Envelope click triggers flap opening and letter extraction
      envelopeWrapper.addEventListener('click', (e) => {
        if (!isOpening) {
          openEnvelope();
        }
      });

      envelopeWrapper.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isOpening) {
          e.preventDefault();
          openEnvelope();
        }
      });

      if (referencePill) {
        referencePill.addEventListener('click', () => {
          if (!isOpening) {
            openEnvelope();
          } else if (!isOpened) {
            triggerFullPageReveal();
          }
        });
      }

      // Phase 4: Clicking extracted letter transitions into Living Script interface
      envelopeLetter.addEventListener('click', (e) => {
        e.stopPropagation();
        if (isOpening && !isOpened) {
          triggerFullPageReveal();
        }
      });

      envelopeLetter.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isOpening && !isOpened) {
          e.preventDefault();
          e.stopPropagation();
          triggerFullPageReveal();
        }
      });

      // Navigation Button Handlers
      if (writeBackBtn) writeBackBtn.addEventListener('click', () => showView('writeback'));
      if (writeBackToHomeBtn) writeBackToHomeBtn.addEventListener('click', () => showView('home'));
      if (footLetterBtn) footLetterBtn.addEventListener('click', () => showView('home'));
      if (footWriteBtn) footWriteBtn.addEventListener('click', () => showView('writeback'));
      if (footCloseBtn) footCloseBtn.addEventListener('click', closeEnvelope);

      // Bind all stage navigation triggers
      const fogMirrorBtn = document.getElementById('fogMirrorBtn');
      if (fogMirrorBtn) fogMirrorBtn.addEventListener('click', () => showView('fog-mirror'));

      const topDashboardBtn = document.getElementById('topDashboardBtn');
      if (topDashboardBtn) topDashboardBtn.addEventListener('click', () => showView('dashboard'));

      const viewDashboardBtn = document.getElementById('viewDashboardBtn');
      if (viewDashboardBtn) viewDashboardBtn.addEventListener('click', () => showView('dashboard'));

      const sentToDashboardBtn = document.getElementById('sentToDashboardBtn');
      if (sentToDashboardBtn) sentToDashboardBtn.addEventListener('click', () => showView('dashboard'));

      const backToScriptoriumBtn = document.getElementById('backToScriptoriumBtn');
      if (backToScriptoriumBtn) backToScriptoriumBtn.addEventListener('click', () => showView('writeback'));

      const backToWriteBackBtn = document.getElementById('backToWriteBackBtn');
      if (backToWriteBackBtn) backToWriteBackBtn.addEventListener('click', () => showView('writeback'));

      // Check URL parameters and hash on load
      window.addEventListener('DOMContentLoaded', () => {
        const hash = (window.location.hash || '').toLowerCase();
        const params = new URLSearchParams(window.location.search);
        const viewParam = params.get('view');

        if (hash === '#dashboard' || viewParam === 'dashboard') {
          showView('dashboard');
        } else if (hash === '#fog-mirror' || hash === '#fogmirror' || viewParam === 'fog-mirror') {
          showView('fog-mirror');
        } else if (hash === '#writeback' || viewParam === 'writeback') {
          showView('writeback');
        } else if (hash === '#letter' || hash === '#home') {
          showView('home');
        }
      });

      // Browser history hashchange listener
      window.addEventListener('hashchange', () => {
        const hash = (window.location.hash || '').toLowerCase();
        if (hash === '#dashboard') showView('dashboard');
        else if (hash === '#fog-mirror' || hash === '#fogmirror') showView('fog-mirror');
        else if (hash === '#writeback') showView('writeback');
        else if (hash === '#letter' || hash === '#home') showView('home');
        else if (hash === '#envelope') showView('envelope');
      });

      // Deep-link directly to Write Back section when requested
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('view') === 'writeback' || window.location.hash === '#writeback') {
          isOpened = true;
          deskScene.classList.remove('is-opening', 'is-zooming');
          deskScene.classList.add('is-opened', 'in-writeback-view');
          document.body.classList.add('is-opened', 'in-writeback-view');
          showView('writeback');
          document.documentElement.classList.add('writeback-ready');
        }
      } catch (e) {}
    })();`;

result = result.replace(oldControllerSectionRegex, newControllerCode);

// I. Make the library toggle handler rock-solid using onclick and single listener
const oldLibraryBindingRegex = /libraryToggleBtn\.addEventListener\('click',\s*\(e\)\s*=>\s*\{[\s\S]*?libraryList\.classList\.toggle\('open'\);\s*\}\);/;

const newLibraryBindingCode = `if (libraryToggleBtn && libraryList) {
        libraryToggleBtn.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          libraryList.classList.toggle('open');
        };
      }`;

result = result.replace(oldLibraryBindingRegex, newLibraryBindingCode);

// J. Replace external script references at the bottom with inlined scripts
const oldBottomScripts = `  <!-- Supabase Backend & Traveller Identity -->
  <script src="supabase-config.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="supabase-client.js"></script>
  <script src="traveller-modal.js"></script>`;

const newBottomScripts = `  <!-- ==========================================
       INLINED: SUPABASE CONFIGURATION
       ========================================== -->
  <script>
${supabaseConfigJs}
  </script>

  <!-- Supabase JS Client Library -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

  <!-- ==========================================
       INLINED: SUPABASE BACKEND CLIENT
       ========================================== -->
  <script>
${supabaseClientJs}
  </script>

  <!-- ==========================================
       INLINED: TRAVELLER ENTRY MODAL
       ========================================== -->
  <script>
${travellerJs}
  </script>

  <!-- ==========================================
       INLINED: THE COURIER'S LEDGER DASHBOARD ENGINE
       ========================================== -->
  <script>
  (function () {
${dashScriptContent}
    window.loadDashboardMessages = loadDashboardMessages;
    window.renderDashboard = render;
    window.openCenterLetterModal = openCenterLetterModal;
  })();
  </script>

  <!-- ==========================================
       INLINED: FOG MIRROR AI HAND TRACKING ENGINE
       ========================================== -->
  <script type="module">
${fogScriptContent}
    window.resizeFogCanvas = resize;
  </script>`;

result = result.replace(oldBottomScripts, newBottomScripts);

// Write to living-script.htm and sync to index.html
fs.writeFileSync(path.join(dir, 'living-script.htm'), result, 'utf8');
fs.writeFileSync(path.join(dir, 'index.html'), result, 'utf8');
console.log('Successfully written consolidated living-script.htm and synced to index.html! Final size:', result.length);
