/*
 * Unit tests for kp.js KP engine new analysis functions.
 * Run: node modules/health-screener/js/test-kp-engine.js
 */
"use strict";

// Mock global KPHealthRules
global.KPHealthRules = require("./kp-health-rules.js");

// Mock window/globalThis for module loading
global.window = global;
global.AHS = {};

// Load dependencies in order
global.AHS.ephemeris = (function () {
  // minimal mock ephemeris
  return {
    tropicalLongitudes: function () { return {}; },
    obliquity: function () { return 23.44; }
  };
})();

// Load astro-core
require("./astro-core.js");
var core = global.AHS.core;

// Load data
require("./data.js");
var data = global.AHS.data;

// Load kp
require("./kp.js");
var kp = global.AHS.kp;

// Build a mock chart for testing
function mockChart() {
  // Create a realistic-ish chart object
  var signs = core.SIGNS;
  var planets = {};
  var placements = [
    { name: "Sun", lon: 120.5, signIndex: 4, sign: "Leo", nakshatraLord: "Ketu", signLord: "Sun", placidusHouse: 1, wholeSignHouse: 1 },
    { name: "Moon", lon: 67.2, signIndex: 2, sign: "Gemini", nakshatraLord: "Mars", signLord: "Mercury", placidusHouse: 12, wholeSignHouse: 12 },
    { name: "Mars", lon: 215.8, signIndex: 7, sign: "Scorpio", nakshatraLord: "Saturn", signLord: "Mars", placidusHouse: 6, wholeSignHouse: 6 },
    { name: "Mercury", lon: 135.0, signIndex: 4, sign: "Leo", nakshatraLord: "Sun", signLord: "Sun", placidusHouse: 1, wholeSignHouse: 1 },
    { name: "Jupiter", lon: 280.3, signIndex: 9, sign: "Capricorn", nakshatraLord: "Moon", signLord: "Saturn", placidusHouse: 8, wholeSignHouse: 8 },
    { name: "Venus", lon: 45.0, signIndex: 1, sign: "Taurus", nakshatraLord: "Moon", signLord: "Venus", placidusHouse: 11, wholeSignHouse: 11 },
    { name: "Saturn", lon: 330.0, signIndex: 11, sign: "Pisces", nakshatraLord: "Jupiter", signLord: "Jupiter", placidusHouse: 9, wholeSignHouse: 9 },
    { name: "Rahu", lon: 75.0, signIndex: 2, sign: "Gemini", nakshatraLord: "Jupiter", signLord: "Mercury", placidusHouse: 12, wholeSignHouse: 12 },
    { name: "Ketu", lon: 255.0, signIndex: 8, sign: "Sagittarius", nakshatraLord: "Venus", signLord: "Jupiter", placidusHouse: 6, wholeSignHouse: 6 }
  ];

  placements.forEach(function (p) { planets[p.name] = p; });

  // Mock cusps with sign info
  var cusps = [];
  for (var i = 0; i < 12; i++) {
    var signIdx = (4 + i) % 12; // Leo ascendant
    cusps.push({
      signIndex: signIdx,
      sign: signs[signIdx],
      signLord: core.SIGN_LORD[signIdx],
      subLord: ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu", "Sun", "Moon", "Mars"][i]
    });
  }

  return {
    jd: 2451545.0,
    ayanamsa: 23.85,
    lagnaSignIndex: 4,
    ascendant: { sign: "Leo", signIndex: 4, degInSign: 10 },
    planets: planets,
    cusps: cusps,
    cuspsSidereal: cusps.map(function (_, idx) { return idx * 30 + 120; })
  };
}

var chart = mockChart();
var passed = 0;
var failed = 0;

function assert(condition, msg) {
  if (condition) {
    passed++;
    console.log("  PASS: " + msg);
  } else {
    failed++;
    console.log("  FAIL: " + msg);
  }
}

// Test 1: analyze() still works and includes new nakshatra/sign disease data
console.log("\n--- Test: analyze() ---");
var result = kp.analyze(chart);
assert(result.method === "KP (Krishnamurti Paddhati)", "method field correct");
assert(typeof result.score === "number" && result.score >= 5 && result.score <= 95, "score in range");
assert(Array.isArray(result.findings), "findings is array");
assert(Array.isArray(result.cuspReports), "cuspReports is array");
assert(result.cuspReports.length === 4, "4 cuspal reports (1, 6, 8, 12)");

// Check new fields in findings
if (result.findings.length > 0) {
  var f0 = result.findings[0];
  assert(f0.hasOwnProperty("nakshatra"), "findings include nakshatra field");
  assert(f0.hasOwnProperty("nakshatraDiseases"), "findings include nakshatraDiseases field");
  assert(f0.hasOwnProperty("signDiseases"), "findings include signDiseases field");
  assert(Array.isArray(f0.bodyParts), "bodyParts is array");
}

// Test 2: specificDiseaseDetection()
console.log("\n--- Test: specificDiseaseDetection() ---");
var diseases = kp.specificDiseaseDetection(chart);
assert(Array.isArray(diseases), "returns an array");
assert(diseases.length > 0, "detects at least one disease pattern");
if (diseases.length > 0) {
  assert(diseases[0].hasOwnProperty("disease"), "first result has disease name");
  assert(diseases[0].hasOwnProperty("confidence"), "first result has confidence");
  assert(typeof diseases[0].confidence === "number", "confidence is a number");
  assert(diseases[0].confidence >= 30, "confidence >= 30 threshold");
  assert(diseases[0].confidence <= 100, "confidence <= 100");
  assert(Array.isArray(diseases[0].matchedPlanets), "matchedPlanets is array");
  assert(Array.isArray(diseases[0].matchedConditions), "matchedConditions is array");
  // Verify sorted descending
  for (var i = 1; i < diseases.length; i++) {
    assert(diseases[i].confidence <= diseases[i - 1].confidence, "sorted descending at idx " + i);
  }
}
assert(diseases.length <= 8, "max 8 results returned");

// Test 3: surgeryTiming()
console.log("\n--- Test: surgeryTiming() ---");
var surgery = kp.surgeryTiming(chart);
assert(surgery.hasOwnProperty("indication"), "has indication field");
assert(["strong", "moderate", "low", "none"].indexOf(surgery.indication) >= 0, "valid indication value");
assert(Array.isArray(surgery.favorable), "favorable is array");
assert(Array.isArray(surgery.unfavorable), "unfavorable is array");
assert(Array.isArray(surgery.notes), "notes is array");
assert(surgery.unfavorable.length >= 2, "at least 2 general precautions");

// Test 4: recoveryPrediction()
console.log("\n--- Test: recoveryPrediction() ---");
var recovery = kp.recoveryPrediction(chart);
assert(recovery.hasOwnProperty("outlook"), "has outlook field");
assert(["good", "moderate", "guarded", "poor", "unknown"].indexOf(recovery.outlook) >= 0, "valid outlook");
assert(typeof recovery.score === "number", "score is a number");
assert(recovery.score >= 5 && recovery.score <= 95, "score in range [5,95]");
assert(Array.isArray(recovery.factors), "factors is array");
assert(Array.isArray(recovery.notes), "notes is array");
assert(typeof recovery.recoveryTiming === "string", "recoveryTiming is string");

// Test 5: mentalHealthIndicators()
console.log("\n--- Test: mentalHealthIndicators() ---");
var mental = kp.mentalHealthIndicators(chart);
assert(mental.hasOwnProperty("risk"), "has risk field");
assert(["high", "moderate", "low"].indexOf(mental.risk) >= 0, "valid risk value");
assert(typeof mental.score === "number", "score is a number");
assert(Array.isArray(mental.indicators), "indicators is array");
assert(Array.isArray(mental.notes), "notes is array");
if (mental.indicators.length > 0) {
  assert(mental.indicators[0].hasOwnProperty("planet"), "indicator has planet");
  assert(mental.indicators[0].hasOwnProperty("type"), "indicator has type");
  assert(mental.indicators[0].hasOwnProperty("detail"), "indicator has detail");
}

// Test 6: retrogradeHealthEffects()
console.log("\n--- Test: retrogradeHealthEffects() ---");
// With no retrograde planets
var effects = kp.retrogradeHealthEffects(chart, {
  Sun: { retro: false },
  Moon: { retro: false },
  Mars: { retro: false },
  Mercury: { retro: false },
  Jupiter: { retro: false },
  Venus: { retro: false },
  Saturn: { retro: false }
});
assert(Array.isArray(effects), "returns an array");
assert(effects.length === 0, "no effects when no planets retrograde");

// With Saturn retrograde (Saturn signifies disease house in our chart)
var effectsRetro = kp.retrogradeHealthEffects(chart, {
  Sun: { retro: false },
  Moon: { retro: false },
  Mars: { retro: true },
  Mercury: { retro: false },
  Jupiter: { retro: true },
  Venus: { retro: false },
  Saturn: { retro: true }
});
assert(Array.isArray(effectsRetro), "returns array with retro planets");
// Mars is in house 6 (disease house) and signifies it
if (effectsRetro.length > 0) {
  assert(effectsRetro[0].hasOwnProperty("planet"), "effect has planet");
  assert(effectsRetro[0].hasOwnProperty("houses"), "effect has houses");
  assert(effectsRetro[0].hasOwnProperty("chronic"), "effect has chronic flag");
  assert(effectsRetro[0].chronic === true, "chronic is true");
  assert(effectsRetro[0].hasOwnProperty("detail"), "effect has detail");
  assert(effectsRetro[0].hasOwnProperty("severity"), "effect has severity");
}

// Test 7: Edge case - empty/missing KPHealthRules
console.log("\n--- Test: edge cases ---");
var savedRules = global.KPHealthRules;
delete global.KPHealthRules;

// Should gracefully return empty/default
// Note: functions check typeof KPHealthRules === "undefined"
var emptyDiseases = kp.specificDiseaseDetection(chart);
assert(Array.isArray(emptyDiseases) && emptyDiseases.length === 0, "specificDiseaseDetection returns [] without KPHealthRules");

var emptySurgery = kp.surgeryTiming(chart);
assert(emptySurgery.indication === "none", "surgeryTiming returns 'none' without KPHealthRules");

var emptyRecovery = kp.recoveryPrediction(chart);
assert(emptyRecovery.outlook === "unknown", "recoveryPrediction returns 'unknown' without KPHealthRules");

var emptyMental = kp.mentalHealthIndicators(chart);
assert(emptyMental.risk === "low", "mentalHealthIndicators returns 'low' without KPHealthRules");

var emptyRetro = kp.retrogradeHealthEffects(chart, { Mars: { retro: true } });
assert(Array.isArray(emptyRetro) && emptyRetro.length === 0, "retrogradeHealthEffects returns [] without KPHealthRules");

global.KPHealthRules = savedRules;

// Summary
console.log("\n=====================");
console.log("Results: " + passed + " passed, " + failed + " failed");
console.log("=====================");

if (failed > 0) process.exit(1);
