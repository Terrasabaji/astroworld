/**
 * Test suite for the enhanced Prashna interpretation engine with
 * karakatwa integration and enhanced KP rules.
 *
 * Run: node test-prashna-enhanced.js
 */

global.window = global;

// Load external data modules
const vm = require('vm');
const fs = require('fs');

vm.runInThisContext(fs.readFileSync(__dirname + '/prashna-karakatwa.js', 'utf8'));
vm.runInThisContext(fs.readFileSync(__dirname + '/prashna-kp-rules.js', 'utf8'));

// Load main prashna inline script
const html = fs.readFileSync(__dirname + '/prashna.html', 'utf8');
const lines = html.split('\n');
const scriptContent = lines.slice(589, 4996).join('\n');
vm.runInThisContext(scriptContent);

let passed = 0;
let failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error('  FAIL:', msg);
  }
}

function section(title) {
  console.log('\n--- ' + title + ' ---');
}

// Build a test chart
const jd = KPApp.astro.localToJD('2024-06-20', '14:30', 5.5);
const chart = KPApp.kp.buildChart({ jd: jd, latitude: 13.08, longitude: 80.27, timezone: 5.5, weekday: 4 });

// ============================================================
section('1. Karakatwa Integration');

// Test that karakatwa lookup works for category names
const marriageLookup = KarakatwaLookup.lookup('marriage');
assert(marriageLookup.planets.length > 0, 'marriage lookup should return karaka planets');
assert(marriageLookup.planets.indexOf('Venus') >= 0, 'Venus should be a marriage karaka');

// Test that karakatwa search works for query text
const querySearch = KarakatwaLookup.lookup('will I get a job promotion');
assert(querySearch.planets.length >= 0, 'query search should not throw');

// Test KP analysis includes karakatwa paragraph with query text
const interpMarriage = KPApp.interpretQuery('marriage', chart, 'When will I get married?');
assert(interpMarriage.kp.indexOf('Karakatwa') >= 0, 'KP analysis should contain Karakatwa paragraph');
assert(interpMarriage.kp.indexOf('karaka planet') >= 0, 'KP analysis should mention karaka planets');
assert(interpMarriage.kp.indexOf('When will I get married') >= 0, 'KP analysis should cite the query text');

// Test without query text (category-based lookup)
const interpCareerNoQuery = KPApp.interpretQuery('career', chart);
assert(interpCareerNoQuery.kp.indexOf('Karakatwa') >= 0, 'KP analysis should use category for karakatwa when no query');
assert(interpCareerNoQuery.kp.indexOf('category Career') >= 0, 'Should reference the category name');

// ============================================================
section('2. Retrograde Handling');

// In our chart model Rahu and Ketu are always retrograde
// Let's verify the retrograde checking logic handles them
const interpHealth = KPApp.interpretQuery('health', chart, 'Will my health improve?');
// The retrograde paragraph may or may not appear depending on which planet is CSL
// We just verify no crash and structure is valid
assert(typeof interpHealth.kp === 'string', 'health KP analysis should be a string');
assert(interpHealth.kp.indexOf('KP verdict') >= 0, 'health analysis should contain verdict');

// If the sub-lord happens to be Rahu or Ketu, retrograde note should appear
const kpText = interpHealth.kp;
const csl = chart.cusps[0].subLord; // 1st house CSL for health
if (csl === 'Rahu' || csl === 'Ketu') {
  assert(kpText.indexOf('RETROGRADE') >= 0, 'retrograde note should appear when CSL is Rahu/Ketu');
  assert(kpText.indexOf('delayed') >= 0 || kpText.indexOf('revert') >= 0, 'verdict should contain delay qualifier');
}

// Verify that the retrograde effects data is properly referenced
assert(typeof PrashnaKPRules.RETROGRADE_EFFECTS.sublord_retrograde === 'object', 'sublord_retrograde effect should exist');
assert(PrashnaKPRules.RETROGRADE_EFFECTS.sublord_retrograde.penalty === -20, 'penalty should be -20');

// ============================================================
section('3. Transit Agreement Check');

const interpFinance = KPApp.interpretQuery('finance', chart, 'Will I get a raise?');
assert(interpFinance.kp.indexOf('Transit agreement') >= 0, 'KP analysis should have transit agreement section');
assert(interpFinance.kp.indexOf('Sun must transit') >= 0, 'Should mention Sun transit requirement');
assert(interpFinance.kp.indexOf('Moon must transit') >= 0, 'Should mention Moon transit requirement');

// ============================================================
section('4. Enhanced Timing Paragraph');

assert(interpFinance.kp.indexOf('Enhanced timing (Dasha-Bhukti-Antara)') >= 0, 'Should have enhanced timing paragraph');
assert(interpFinance.kp.indexOf('conjoined Dasha-Bhukti-Antara period') >= 0, 'Should mention conjoined period');
assert(interpFinance.kp.indexOf('precise date determination') >= 0, 'Should mention precise date');

// ============================================================
section('5. Case Pattern Matching');

// Marriage category should match the marriage case pattern
assert(interpMarriage.kp.indexOf('Case pattern evidence') >= 0, 'Marriage should have case pattern match');

// Finance should match finance patterns
assert(interpFinance.kp.indexOf('Case pattern evidence') >= 0, 'Finance should have case pattern match');

// Litigation should match litigation patterns
const interpLitigation = KPApp.interpretQuery('litigation', chart, 'Will I win the court case?');
assert(interpLitigation.kp.indexOf('Case pattern') >= 0, 'Litigation should have case pattern match');

// ============================================================
section('6. Category-Enhanced Rules');

assert(interpMarriage.kp.indexOf('Enhanced KP rules') >= 0, 'Marriage should have enhanced KP rules');
assert(interpMarriage.kp.indexOf('Sub lord of 7th') >= 0 || interpMarriage.kp.indexOf('cuspal sub-lord') >= 0,
  'Marriage enhanced rules should mention 7th CSL');

const interpEducation = KPApp.interpretQuery('education', chart, 'Will I pass the exam?');
assert(interpEducation.kp.indexOf('Enhanced KP rules') >= 0, 'Education should have enhanced KP rules');

// Career enhanced rules
const interpCareer = KPApp.interpretQuery('career', chart, 'Will I get promoted?');
assert(interpCareer.kp.indexOf('Enhanced KP rules') >= 0, 'Career should have enhanced KP rules');

// ============================================================
section('7. Backward Compatibility');

// missingItem category should still work (uses separate code path)
const interpMissing = KPApp.interpretQuery('missingItem', chart);
assert(interpMissing.kp.indexOf('Houses judged for the missing article') >= 0, 'missingItem should still work');
assert(interpMissing.missingItem !== null, 'missingItem result should still be populated');

// Hora Shastra reasoning should still work
assert(interpMarriage.horaShastra.indexOf('Classical') >= 0, 'Hora Shastra should still work');
assert(interpMarriage.horaShastra.indexOf('Venus') >= 0, 'Hora Shastra should still mention Venus for marriage');

// All categories should run without errors
const allCategories = ['health', 'marriage', 'career', 'litigation', 'travel', 'children',
  'finance', 'property', 'education', 'enemies', 'longevity', 'missingItem',
  'wealthRecovery', 'siblings', 'fortune', 'gains'];
allCategories.forEach(function(cat) {
  try {
    const r = KPApp.interpretQuery(cat, chart, 'test query');
    assert(r.kp.length > 100, cat + ' KP analysis should have substantial content');
    assert(r.horaShastra.length > 100, cat + ' Hora analysis should have substantial content');
  } catch(e) {
    assert(false, cat + ' threw: ' + e.message);
  }
});

// ============================================================
section('8. Integration of Karakatwa with Significators');

// Verify that karakatwa planets are cross-referenced with chart significators
const interpTravel = KPApp.interpretQuery('travel', chart, 'Will my foreign trip happen?');
assert(interpTravel.kp.indexOf('signif') >= 0, 'Travel should discuss signification of karakas');

// ============================================================
// Summary
console.log('\n========================================');
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
console.log('========================================');
process.exit(failed > 0 ? 1 : 0);
