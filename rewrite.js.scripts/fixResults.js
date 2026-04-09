import fs from 'fs';

let content = fs.readFileSync('src/components/CognitiveLoadResults.tsx', 'utf-8');

// 1. Remove Zone 1 (Inner Header) completely
const zone1Start = content.indexOf('{/* Zone 1');
if (zone1Start !== -1) {
  const zone2Start = content.indexOf('{/* Zone 2');
  if (zone2Start !== -1) {
    content = content.substring(0, zone1Start) + content.substring(zone2Start);
  }
}

// 2. Remove Zone 8 (Footer Strip) completely
const zone8Start = content.indexOf('{/* Zone 8');
if (zone8Start !== -1) {
  const returnEnd = content.indexOf('    </div>\n  );\n};');
  if (returnEnd !== -1) {
    content = content.substring(0, zone8Start) + content.substring(returnEnd);
  }
}

// 3. Remove `flex: 1, overflowY: 'auto'` container surrounding content
content = content.replace(`<div style={{ flex: 1, overflowY: 'auto' }}>\n      \n        {/* Zone 2`, `{/* Zone 2`);

// We must also remove the closing div for that overflowY container. Let's find it.
// It should be right before where we cut Zone 8 out
content = content.replace(`\n      </div>\n\n    </div>\n  );\n};`, `\n    </div>\n  );\n};`);

// 4. Update the Root Div structure to remove constrained flex/h-screen heights
content = content.replace(
  `<div className="flex flex-col h-screen overflow-hidden text-white" style={{ background: '#090a0c', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>`,
  `<div className="flex flex-col w-full text-white" style={{ background: '#090a0c' }}>`
);

// 5. Fix Score Hero grid proportions
const gridSearch = `gridTemplateColumns: '1fr 1fr', gap: '3rem'`;
const gridReplace = `gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'start'`;
content = content.replace(gridSearch, gridReplace);

// 6. Fix Behavioral empty state borders
const emptyStateSearch = `<div style={{ marginTop: '1.5rem', padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', background: 'rgba(255,255,255,0.01)', textAlign: 'center' }}>`;
const emptyStateReplace = `<div style={{ marginTop: '1.5rem', padding: '2rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', textAlign: 'center' }}>`;
content = content.replace(emptyStateSearch, emptyStateReplace);

// Update empty state inner text
const emptySvgSearch = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.15)', margin: '0 auto 0.5rem' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`;
const emptySvgReplace = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'rgba(255,255,255,0.12)' }}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`;
content = content.replace(emptySvgSearch, emptySvgReplace);

const emptyPrimaryTextSearch = `<div className="font-mono" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.2rem' }}>No behavioral telemetry recorded for this session</div>`;
const emptyPrimaryTextReplace = `<div className="font-mono" style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)' }}>No behavioral telemetry recorded for this session</div>`;
content = content.replace(emptyPrimaryTextSearch, emptyPrimaryTextReplace);

fs.writeFileSync('src/components/CognitiveLoadResults.tsx', content);

// Update ParticipantDashboard to ensure main content flows freely down
let dashContent = fs.readFileSync('src/components/ParticipantDashboard.tsx', 'utf-8');
const oldMainTag = `<main className={\`w-full \${isEdgeToEdge ? 'h-full flex flex-col' : 'flex-1 flex flex-col'}\`}>`;
const newMainTag = `<main className="w-full flex-1 flex flex-col page-content">`;
dashContent = dashContent.replace(oldMainTag, newMainTag);
fs.writeFileSync('src/components/ParticipantDashboard.tsx', dashContent);

console.log('Done.');
