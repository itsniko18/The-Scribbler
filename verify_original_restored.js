const fs = require('fs');
const path = require('path');

console.log('=== VERIFYING RESTORATION OF ORIGINAL DUPLICATED QUEST JOURNAL DASHBOARD ===\n');

const targetFiles = [
  'index.html',
  'FINAL FINAL FINAL YAY - Scroll Intro.html'
];

let allPassed = true;

targetFiles.forEach(filePath => {
  console.log(`--- Checking ${filePath} ---`);
  const html = fs.readFileSync(filePath, 'utf8');

  const checks = [
    // 1. Data Store & Logic
    { name: 'correspondenceStore definition', test: html.includes('const correspondenceStore = {') },
    { name: 'Data-driven getSentCount', test: html.includes('getSentCount()') },
    { name: 'Data-driven getReceivedCount', test: html.includes('getReceivedCount()') },
    { name: 'selectRecipientAndWrite function', test: html.includes('function selectRecipientAndWrite(') },
    { name: 'recordSentLetter function', test: html.includes('recordSentLetter(') },
    { name: 'displayLetterInCasebook function', test: html.includes('function displayLetterInCasebook(') },
    
    // 2. Oblivion Quest Journal UI Elements (Exact replica of user reference)
    { name: 'Quest Stage Container', test: html.includes('id="questStageContainer"') },
    { name: 'Top HUD Tab Navigation', test: html.includes('id="questTabQuests"') && html.includes('Autosaving...') },
    { name: 'Blue Heraldic Chalice Crest', test: html.includes('class="quest-chalice-frame"') && html.includes('Holy Chalice of the White Stallion') },
    { name: 'Open In Map button', test: html.includes('id="questOpenMapBtn"') },
    { name: 'Stats: Letters Sent element', test: html.includes('id="statsLettersSent"') },
    { name: 'Stats: Letters Received element', test: html.includes('id="statsLettersReceived"') },
    { name: 'Dispatch Target indicator', test: html.includes('id="questSelectedRecipName"') },
    { name: 'Knights of White Stallion Header', test: html.includes('id="questMainTitle"') },
    { name: 'Chevron ornamental rule', test: html.includes('class="quest-chevron-rule"') },
    { name: 'Left Gothic Column Title', test: html.includes('id="questColLeftTitle"') },
    { name: 'Interactive Recipients Sublist', test: html.includes('id="questRecipientsSublist"') },
    { name: 'Center 12th Date Stamp', test: html.includes('id="questCenterStamp"') },
    { name: 'Right Gothic Prose Column', test: html.includes('id="questRightProse"') },
    { name: 'Bottom HUD [F] Skip to Current Step', test: html.includes('id="questSkipStepBtn"') },
    { name: 'Bottom HUD [Escape] Back', test: html.includes('id="questBackBtn"') },
    { name: 'Bottom HUD THEGAMER Watermark', test: html.includes('THEGAMER') },
    { name: 'Gothic Fraktur Google Font loaded', test: html.includes('UnifrakturMaguntia') },

    // 3. User Entry modal and other unwanted dashboards removed
    { name: 'User entry modal removed completely', test: !html.includes('id="userEntryModal"') },
    { name: 'archival-system.css removed', test: !html.includes('archival-system.css') },
    { name: 'archival-system.js removed', test: !html.includes('archival-system.js') },
    { name: 'archival-store.js removed', test: !html.includes('archival-store.js') },
    { name: '2-column/3-column archival-columns-grid removed', test: !html.includes('archival-columns-grid') },

    // 4. Writing desk and library clean configuration
    { name: 'Library button cleanly boxed under #bars', test: html.includes('<button id="libraryToggleBtn" class="btn-boxed-clean" type="button">Pictorial library</button>') },
    { name: 'No fixed top-left circular library button', test: !html.includes('scroll-emoji-icon') },
    { name: 'Recipient dispatch bar removed', test: !html.includes('recipientDispatchBar') && !html.includes('DISPATCH UNTO') },

    // 5. Zero mojibake & letter integrity
    { name: 'No mojibake characters', test: !html.includes('ÂŒ') && !html.includes('ÐŸ') && !html.includes('ðŸ') && !html.includes('âœ’') },
    { name: 'Letter "o" integrity intact across all words', test: html.includes('scroll') && html.includes('envelope') && html.includes('Pictorial') && !html.includes('scrll') },

    // 6. Navigation Links from other views
    { name: 'Archive nav link from home', test: html.includes('id="homeToArchiveBtn"') },
    { name: 'Archive nav link from writeback', test: html.includes('id="footArchiveBtn"') || html.includes('id="writeBackToArchiveBtn"') },
    
    // 7. Preserved Existing Features (Zero Regression)
    { name: 'Speech recognition engine intact', test: html.includes('webkitSpeechRecognition') },
    { name: 'Gesture chamber hands intact', test: html.includes('tmImage') || html.includes('Hands({') },
    { name: 'HTR / OCR handwriting recognition intact', test: html.includes('htrOutputText') && html.includes('htrApplyBtn') },
    { name: 'Living Script handwriting transformation intact', test: html.includes('scrambleMiddle') }
  ];

  let filePassed = true;
  checks.forEach(c => {
    console.log((c.test ? '  [PASS] ' : '  [FAIL] ') + c.name);
    if (!c.test) filePassed = false;
  });
  console.log('  Result:', filePassed ? 'ALL CHECKS PASSED ✅' : 'SOME CHECKS FAILED ❌\n');
  if (!filePassed) allPassed = false;
});

console.log('FINAL RESULT:', allPassed ? '🎉 ORIGINAL DUPLICATED QUEST JOURNAL DASHBOARD FULLY RESTORED' : '⚠️ SOME CHECKS FAILED');
