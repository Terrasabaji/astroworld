/*
 * kp-health-rules.js
 * Comprehensive KP Medical Astrology rules data module.
 * Synthesized from 6 authoritative KP sources:
 *   663 - Astrological Diagnosis of Diseases (K. Hariharan)
 *   664 - Horoscopes and Diseases (Chandrakant R. Bhatt)
 *   665 - Nakshatra System on Medical Astrology (MK Viswanath)
 *   666 - Disease & Astrology KP translation (Bosmia)
 *   667 - K.P. Medical Astrology For All (K. Subramaniam)
 *   668 - Punarphoo Dosha medical rules (Tirupur GK)
 *
 * Consumed by kp.js, predict.js, and timeline-health.js.
 * Works in browser (window.KPHealthRules) and Node (module.exports).
 */
const KPHealthRules = (function () {
  'use strict';

  // ──────────────────────────────────────────────────────────────────────────
  // 27 Nakshatras → body-part mapping (source: 665, 666)
  // ──────────────────────────────────────────────────────────────────────────
  var NAKSHATRA_BODY = [
    { index: 0, name: "Ashwini", lord: "Ketu", parts: ["head", "cerebral hemispheres"], diseases: ["headache", "brain fever", "cerebral hemorrhage", "insomnia", "epilepsy", "mental disorders", "meningitis"] },
    { index: 1, name: "Bharani", lord: "Venus", parts: ["head", "cerebral hemisphere", "eyes", "forehead"], diseases: ["eye injury", "syphilis", "sinusitis", "forehead injury"] },
    { index: 2, name: "Krittika", lord: "Sun", parts: ["head", "eyes", "brain", "face", "neck", "larynx", "tonsils"], diseases: ["brain fever", "eye trouble", "throat pain", "thyroid", "small pox"] },
    { index: 3, name: "Rohini", lord: "Moon", parts: ["face", "mouth", "tongue", "tonsils", "palate", "neck", "cerebellum", "cervical vertebrae"], diseases: ["common cold", "cough", "apoplexy", "irregular menses", "thyroid"] },
    { index: 4, name: "Mrigashira", lord: "Mars", parts: ["face", "chin", "cheeks", "throat", "vocal cords", "arms", "shoulders", "thymus gland"], diseases: ["tonsillitis", "diphtheria", "throat pain", "constipation", "pericardium inflammation"] },
    { index: 5, name: "Ardra", lord: "Rahu", parts: ["throat", "arms", "shoulders"], diseases: ["mumps", "asthma", "diphtheria", "ear pain", "eosinophilia", "dry cough"] },
    { index: 6, name: "Punarvasu", lord: "Jupiter", parts: ["ears", "throat", "shoulder blades", "lungs", "respiratory system", "chest", "diaphragm", "pancreas", "upper liver"], diseases: ["pleurisy", "bronchitis", "pneumonia", "jaundice", "indigestion"] },
    { index: 7, name: "Pushya", lord: "Saturn", parts: ["lungs", "stomach", "ribs"], diseases: ["tuberculosis", "gastric ulcer", "gallstones", "cancer", "jaundice", "eczema", "pyorrhea"] },
    { index: 8, name: "Ashlesha", lord: "Mercury", parts: ["lungs", "stomach", "oesophagus", "diaphragm", "pancreas", "liver"], diseases: ["hysteria", "jaundice", "ascites", "vitamin B deficiency", "kidney swelling"] },
    { index: 9, name: "Magha", lord: "Ketu", parts: ["heart", "back", "spinal cord", "spleen", "dorsal region", "aorta"], diseases: ["heart disease", "back pain", "cholera", "palpitation", "spinal meningitis"] },
    { index: 10, name: "Purva Phalguni", lord: "Venus", parts: ["heart", "spinal cord"], diseases: ["heart disease", "anaemia", "blood pressure", "spinal pain"] },
    { index: 11, name: "Uttara Phalguni", lord: "Sun", parts: ["spinal cord", "intestines", "bowels", "liver"], diseases: ["intestinal tumour", "back pain", "blood pressure", "stomach disorder"] },
    { index: 12, name: "Hasta", lord: "Moon", parts: ["bowels", "intestines", "secreting glands", "enzymes"], diseases: ["vitamin B deficiency", "cholera", "dysentery", "typhoid", "worms", "neuralgia"] },
    { index: 13, name: "Chitra", lord: "Mars", parts: ["belly", "kidneys", "loins", "lumbar spine", "vasomotor system"], diseases: ["kidney pain", "hernia", "ulcer", "sunstroke", "brain fever"] },
    { index: 14, name: "Swati", lord: "Rahu", parts: ["skin", "kidneys", "urethra", "bladder"], diseases: ["urinary trouble", "kidney swelling", "eczema", "skin disease"] },
    { index: 15, name: "Vishakha", lord: "Jupiter", parts: ["lower abdomen", "kidneys", "pancreatic gland", "bladder", "genital organs", "rectum", "prostate"], diseases: ["kidney disorder", "prostate swelling", "excessive menstrual bleeding", "renal stone"] },
    { index: 16, name: "Anuradha", lord: "Saturn", parts: ["bladder", "genital organs", "rectum", "nasal bones"], diseases: ["menstruation stoppage", "piles", "indigestion", "cold", "female generative disorders"] },
    { index: 17, name: "Jyeshtha", lord: "Mercury", parts: ["colon", "anus", "genital organs", "ovaries", "womb"], diseases: ["menorrhagia", "bleeding piles", "fistula", "tumour"] },
    { index: 18, name: "Moola", lord: "Ketu", parts: ["hips", "thighs", "femur", "ilium", "sciatic nerve"], diseases: ["sciatica", "gout", "lung disease", "hip pain"] },
    { index: 19, name: "Purva Ashada", lord: "Venus", parts: ["thighs", "hips", "coccygeal region", "sacral spine", "iliac arteries"], diseases: ["sciatica", "diabetes", "rheumatism", "lung cancer", "blood impurity"] },
    { index: 20, name: "Uttara Ashada", lord: "Sun", parts: ["thighs", "femur", "arteries", "skin", "knees", "patella"], diseases: ["sciatica", "paralysis", "eczema", "skin disease", "digestive disorder"] },
    { index: 21, name: "Shravana", lord: "Moon", parts: ["lymphatic vessels", "knees", "skin"], diseases: ["eczema", "skin disease", "gout", "TB", "pleurisy", "weak digestion"] },
    { index: 22, name: "Dhanishta", lord: "Mars", parts: ["knee cap", "ankles", "limbs", "portion between knees and ankles"], diseases: ["leg injury", "rheumatoid arthritis", "limping", "blood poisoning", "high BP", "heart disease"] },
    { index: 23, name: "Shatabhisha", lord: "Rahu", parts: ["calf muscles", "portion between knees and ankles"], diseases: ["rheumatism", "heart palpitation", "high BP", "bone fracture", "amputation"] },
    { index: 24, name: "Purva Bhadrapada", lord: "Jupiter", parts: ["ankles", "feet", "toes"], diseases: ["apoplexy", "heart disorder", "ascites", "liver enlargement", "low BP"] },
    { index: 25, name: "Uttara Bhadrapada", lord: "Saturn", parts: ["feet"], diseases: ["gout", "constipation", "hernia", "TB", "leg fracture"] },
    { index: 26, name: "Revati", lord: "Mercury", parts: ["feet", "toes"], diseases: ["gastric problems", "intestinal ulcer", "nephritis", "deafness", "foot gout", "cramps"] }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // Planet-Sign disease correlations (sources: 663, 664, 665, 667)
  // Sign indices: 0=Aries .. 11=Pisces
  // ──────────────────────────────────────────────────────────────────────────
  var PLANET_SIGN_DISEASE = {
    "Sun": {
      0: ["aphasia", "meningitis", "cerebral hemorrhage", "brain fever"],
      1: ["quinsy", "diphtheria", "eye trouble"],
      2: ["pleurisy", "bronchitis", "eosinophilia"],
      3: ["anaemia", "dropsy", "stomach pain"],
      4: ["palpitation", "spinal affections", "heart disease"],
      5: ["peritonitis", "typhoid", "intestinal disorder"],
      6: ["Bright's disease", "kidney inflammation"],
      7: ["renal calculus", "urinary trouble"],
      8: ["sciatica", "hip disease"],
      9: ["skin disease", "rheumatism", "knee problems"],
      10: ["ankle/leg weakness", "varicose veins"],
      11: ["foot problems", "dropsy", "cold"]
    },
    "Moon": {
      0: ["insomnia", "headache", "brain fever"],
      1: ["sore throat", "eye trouble", "neck pain"],
      2: ["asthma", "bronchitis", "pneumonia"],
      3: ["chronic stomach ailment", "cancer", "obesity"],
      4: ["heart trouble", "backache", "blood pressure"],
      5: ["bowel disorder", "tumours", "intestinal issues"],
      6: ["kidney trouble", "uremia", "skin disease"],
      7: ["reproductive disorder", "bladder problems"],
      8: ["sciatica", "hip disease", "rheumatism"],
      9: ["knee problems", "digestive disturbance"],
      10: ["varicose veins", "ankle problems"],
      11: ["foot ailments", "dropsy", "lymphatic issues"]
    },
    "Mars": {
      0: ["sunstroke", "brain fever", "cerebral hemorrhage"],
      1: ["tonsillitis", "adenoids", "goitre"],
      2: ["pneumonia", "lung hemorrhage", "arm fracture"],
      3: ["inflammation of stomach", "gastritis"],
      4: ["enlargement of heart", "palpitation", "spine injury"],
      5: ["peritonitis", "ulcer", "hernia"],
      6: ["kidney inflammation", "renal abscess"],
      7: ["excessive menses", "prostate enlargement", "venereal disease"],
      8: ["sciatica", "muscular rheumatism"],
      9: ["fracture", "skin inflammation"],
      10: ["leg injuries", "blood poisoning"],
      11: ["foot burns", "cuts on feet"]
    },
    "Mercury": {
      0: ["neuralgia", "headache", "vertigo", "insomnia"],
      1: ["stammering", "vocal cord trouble"],
      2: ["nervous breakdown", "arm/hand pain", "asthma"],
      3: ["gastric neurosis", "digestive nerve disorder"],
      4: ["palpitation", "nerve weakness in back"],
      5: ["bowel neurosis", "colic", "indigestion"],
      6: ["kidney nerve disorder", "skin allergy"],
      7: ["urethral disorders", "reproductive nerve issues"],
      8: ["sciatica from nerve", "hip neurosis"],
      9: ["knee nerve pain", "gout"],
      10: ["varicose veins", "leg cramps"],
      11: ["foot numbness", "gout in feet"]
    },
    "Jupiter": {
      0: ["cerebral congestion", "brain tumour"],
      1: ["throat abscess", "swelling in neck"],
      2: ["lung congestion", "pleurisy"],
      3: ["liver enlargement", "jaundice", "dropsy"],
      4: ["heart enlargement", "fatty degeneration"],
      5: ["liver disorder", "abscess", "diabetes"],
      6: ["kidney enlargement", "fatty liver"],
      7: ["tumour in reproductive organs"],
      8: ["obesity", "hip gout"],
      9: ["knee swelling", "blood disorder"],
      10: ["leg swelling", "varicose veins"],
      11: ["foot swelling", "gout"]
    },
    "Venus": {
      0: ["eczema on face", "eye trouble"],
      1: ["tonsillitis", "throat infection", "goitre"],
      2: ["bronchitis", "respiratory weakness"],
      3: ["stomach disorder", "diabetes"],
      4: ["heart weakness", "palpitation"],
      5: ["intestinal weakness", "diabetes"],
      6: ["kidney disease", "diabetes", "skin disease"],
      7: ["venereal disease", "ovary trouble", "reproductive disorder"],
      8: ["diabetes", "hip disorder"],
      9: ["knee swelling", "gout"],
      10: ["ankle swelling", "leg skin disease"],
      11: ["foot disease", "gout"]
    },
    "Saturn": {
      0: ["headache", "brain disorders", "paralytic stroke", "depression"],
      1: ["toothache", "throat disorders", "deafness"],
      2: ["asthma", "bronchitis", "TB", "nervous debility"],
      3: ["chronic gastritis", "cancer of breast", "stomach cancer"],
      4: ["hypertension", "heart attack", "chronic heart disease"],
      5: ["appendicitis", "constipation", "chronic bowel disease"],
      6: ["sterility", "kidney stones", "chronic skin disease"],
      7: ["chronic reproductive disorder", "prostate", "impotence"],
      8: ["chronic sciatica", "rheumatism"],
      9: ["arthritis", "bone disease", "fractures"],
      10: ["paralysis of legs", "varicose veins", "blood disorders"],
      11: ["gout in feet", "chronic foot ailments"]
    },
    "Rahu": {
      0: ["brain tumour", "epilepsy", "mysterious headache"],
      1: ["throat cancer", "goitre"],
      2: ["lung trouble", "breathing difficulty"],
      3: ["stomach cancer", "hiccough"],
      4: ["heart attack", "hypertension"],
      5: ["intestinal cancer", "undiagnosed abdominal pain"],
      6: ["kidney cancer", "skin leprosy"],
      7: ["genital disorders", "venereal disease"],
      8: ["hip cancer", "sciatica"],
      9: ["bone cancer", "chronic leg disease"],
      10: ["leg gangrene", "mysterious leg ailment"],
      11: ["foot gangrene", "mysterious foot disease"]
    },
    "Ketu": {
      0: ["brain fever", "paralysis", "Parkinson's"],
      1: ["mysterious throat ailment"],
      2: ["sudden respiratory failure"],
      3: ["high BP", "coronary thrombosis", "diabetes"],
      4: ["sudden heart collapse", "spine injury"],
      5: ["intestinal infection", "viral fever"],
      6: ["mysterious kidney ailment", "autoimmune"],
      7: ["urinary troubles", "piles", "fistula"],
      8: ["accidents to hip", "surgical need"],
      9: ["fracture", "bone disease"],
      10: ["leg injury", "sudden paralysis"],
      11: ["foot injury", "mysterious foot ailment"]
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Specific disease detection patterns (~40 diseases)
  // Sources: 663, 664, 665, 666, 667, 668
  // ──────────────────────────────────────────────────────────────────────────
  var DISEASE_PATTERNS = [
    { name: "Diabetes", planets: ["Venus", "Jupiter", "Moon"], signs: [3, 6, 7, 11], houses: [1, 6, 8], conditions: ["Venus signifies food/sugar/pancreas", "Jupiter signifies thirst/liver/glycogen", "Moon connected to watery signs", "Libra sign specifically denotes diabetes"] },
    { name: "Heart Disease", planets: ["Sun", "Saturn", "Mars"], signs: [3, 4, 10], houses: [4, 6, 8, 12], conditions: ["Sun governs heart", "4th house denotes heart", "Saturn causes obstruction", "Mars indicates surgery", "Leo sign involvement"] },
    { name: "Cancer (Malignant)", planets: ["Rahu", "Saturn", "Moon", "Mars"], signs: [3, 4, 7, 11], houses: [6, 8, 12], conditions: ["Rahu is main culprit for cancerous growth", "Saturn-Rahu-Moon disposition", "Jupiter causes tumour/spreading", "lords of 6, 8, 12 involved"] },
    { name: "Brain Cancer", planets: ["Rahu", "Saturn", "Moon", "Sun", "Mars"], signs: [0], houses: [1, 6, 8], conditions: ["Lagna/Mars/Sun signify brain", "Rahu connected to brain significators", "Aries sign involvement"] },
    { name: "Lung Cancer", planets: ["Rahu", "Saturn", "Moon", "Mercury"], signs: [2, 6, 10], houses: [3, 6, 8], conditions: ["3rd house signifies lungs", "Mercury causative for lungs", "Airy signs involvement", "Gemini/Libra/Aquarius"] },
    { name: "Breast Cancer", planets: ["Moon", "Saturn", "Mars", "Rahu", "Ketu"], signs: [3], houses: [3, 4, 6, 8], conditions: ["Moon governs breasts", "Cancer sign (3) involvement", "Ketu rules cells/tissues", "Saturn-Mars combination"] },
    { name: "Stomach Cancer", planets: ["Rahu", "Saturn", "Moon"], signs: [3], houses: [4, 5, 6, 8], conditions: ["Cancer sign relates to stomach", "Moon and 4th house signify stomach", "Rahu-Saturn-Moon disposition"] },
    { name: "Epilepsy", planets: ["Mercury", "Mars", "Sun", "Moon", "Ketu"], signs: [0], houses: [1, 3, 6, 8], conditions: ["Mercury and 3rd house signify nervous system", "Mars/Rahu signify electric signals", "Aries/head involvement", "Saturn slows brain functions"] },
    { name: "Mental Illness/Insanity", planets: ["Moon", "Mercury", "Saturn", "Ketu"], signs: [0, 5], houses: [1, 4, 5, 6, 8, 12], conditions: ["Moon is index of mind", "Mercury governs reason", "Ketu denotes insanity", "Saturn causes melancholy", "4th house is mind"] },
    { name: "Depression", planets: ["Saturn", "Moon", "Ketu"], signs: [9, 10], houses: [4, 6, 8, 12], conditions: ["Saturn causes pains/chronic sadness", "Moon in 8th house = disappointment", "Ketu causes detachment/aborting", "4th house negates 5th (love)"] },
    { name: "Obesity", planets: ["Jupiter", "Moon", "Venus", "Mercury"], signs: [3, 7, 11, 2, 5, 8], houses: [1, 6, 8], conditions: ["Jupiter signifies fat/excess/expansion", "Moon/Venus are watery", "Watery signs involvement", "Dual signs involvement"] },
    { name: "Tuberculosis", planets: ["Moon", "Saturn", "Mercury"], signs: [2, 3], houses: [3, 4, 6, 8], conditions: ["Moon-Saturn combination in Cancer/Gemini", "Pushya star specifically indicates TB", "Gemini rules lungs", "Saturn makes chronic"] },
    { name: "Asthma/Bronchitis", planets: ["Saturn", "Mercury", "Jupiter", "Moon"], signs: [2, 4, 6, 10], houses: [3, 4, 6, 8], conditions: ["Airy signs and watery signs", "3rd house signifies lungs", "Saturn governs breath", "Jupiter/watery signs signify phlegm"] },
    { name: "Blood Pressure (High)", planets: ["Mars", "Saturn", "Moon", "Sun"], signs: [3, 4, 10], houses: [4, 6, 8], conditions: ["Mars is karaka for blood", "Saturn in Leo causes organic weakness", "Moon/Mars with watery signs", "Saturn obstructing Sun = low BP; Jupiter afflicting Sun = high BP"] },
    { name: "Paralysis", planets: ["Saturn", "Mercury", "Mars"], signs: [0, 2, 5, 8, 9, 10], houses: [1, 6, 8, 12], conditions: ["Saturn controls central nervous system", "Mercury governs entire nervous system", "Mars rules blood circulation", "Fixed signs = chronic paralysis"] },
    { name: "Kidney Disease", planets: ["Venus", "Moon", "Jupiter", "Mars"], signs: [6, 7], houses: [6, 7, 8], conditions: ["Libra/Chitra star signify kidneys", "Venus signifies kidneys", "Jupiter signifies stones/granulation", "Moon offers watery contents"] },
    { name: "Kidney Stones", planets: ["Venus", "Jupiter", "Mars"], signs: [6, 7], houses: [6, 7, 8], conditions: ["Venus in Jupiter star produces kidney stones", "Jupiter signifies abscess/granulation", "Mars and 8th house signify blood"] },
    { name: "Liver Disease", planets: ["Jupiter", "Sun", "Moon", "Saturn"], signs: [4], houses: [5, 6, 8], conditions: ["Jupiter is karaka for liver", "Leo/5th house is seat of liver", "Sun lord of Leo connected to liver", "Saturn-Venus-Mars intoxication damages liver"] },
    { name: "Diabetes (Pancreatic)", planets: ["Venus", "Moon", "Mercury", "Jupiter"], signs: [3, 6], houses: [5, 6, 8], conditions: ["Venus signifies pancreas/insulin", "Cancer sign governs pancreas", "Moon-Mercury-Mercury sub indicates pancreas failure"] },
    { name: "Venereal Disease", planets: ["Venus", "Mars", "Rahu"], signs: [7, 1], houses: [5, 7, 8, 12], conditions: ["Scorpio/8th sign rules venereal disease", "Venus-Mars conjunction", "Rahu affliction", "Venus and Mars in own sign with Rahu = syphilis"] },
    { name: "Hernia", planets: ["Moon", "Mars", "Mercury"], signs: [5, 6], houses: [6, 7, 8], conditions: ["Libra and 7th house involvement", "Moon is karaka for hernia", "Mars in 6th/Virgo indicates operation", "Mercury affliction causes ulcers"] },
    { name: "Rheumatism", planets: ["Saturn", "Jupiter", "Mars"], signs: [2, 8, 9], houses: [6, 8, 9, 10], conditions: ["Saturn causes chronic rheumatism", "Sagittarius and Capricorn involvement", "Jupiter-Saturn-Venus afflicted in common signs"] },
    { name: "Skin Disease", planets: ["Saturn", "Venus", "Rahu", "Mercury"], signs: [3, 5, 7, 9, 11], houses: [4, 6, 8, 12], conditions: ["Saturn and Venus signify skin", "Rahu causes abnormality", "Venus afflicted by Saturn/Ketu = eczema/leprosy", "Capricorn rules skin disease"] },
    { name: "Thyroid Disorder", planets: ["Venus", "Saturn", "Jupiter"], signs: [1], houses: [3, 6], conditions: ["3rd house signifies throat", "Venus signifies thyroid gland", "Jupiter causes swelling", "Saturn causes blockade", "Taurus sign involvement"] },
    { name: "Eye Disease/Blindness", planets: ["Sun", "Moon", "Venus", "Saturn", "Rahu"], signs: [0, 6, 10], houses: [2, 6, 8, 12], conditions: ["Sun controls right eye", "Moon controls left eye", "Venus karaka for eyesight", "2nd house = right eye", "12th house = left eye"] },
    { name: "Alcoholism/Addiction", planets: ["Saturn", "Venus", "Mars", "Rahu"], signs: [3, 7, 11], houses: [1, 2, 3, 5, 6], conditions: ["Rahu is a drinker", "Venus-Saturn-Mars indicate intoxication", "Moon in watery sign with these connections", "2nd house = mouth, 5th = enjoyment"] },
    { name: "Bone Fracture", planets: ["Saturn", "Mars", "Sun"], signs: [0, 9], houses: [1, 6, 8], conditions: ["Saturn is karaka for bones", "Mars causes accidents/cuts", "3rd house=right hand, 11th=left hand", "Rahu karaka for feet"] },
    { name: "Deafness/Dumbness", planets: ["Mercury", "Saturn", "Moon"], signs: [3, 7, 11], houses: [2, 3, 6, 8, 11, 12], conditions: ["Mercury governs speech and hearing", "2nd house = speech", "3rd house = right ear", "11th house = left ear", "Mute signs: Cancer/Scorpio/Pisces"] },
    { name: "Leprosy/Leucoderma", planets: ["Rahu", "Saturn", "Venus"], signs: [9, 1, 4, 7, 10], houses: [6, 8, 12], conditions: ["Rahu is chief governor for leprosy", "Venus afflicted by Saturn/Ketu = leucoderma", "Capricorn rules skin disease", "Fixed signs involvement"] },
    { name: "Poliomyelitis", planets: ["Saturn", "Mercury", "Mars"], signs: [2, 6, 10], houses: [1, 6, 8, 11, 12], conditions: ["Saturn signifies deformity/chronic", "Mercury rules nervous system", "11th house signifies legs", "Airy signs indicate airborne"] },
    { name: "Heart Surgery", planets: ["Mars", "Saturn", "Sun"], signs: [4, 3, 10], houses: [4, 6, 8, 12], conditions: ["Mars must be associated with 4th bhava", "Mars indicates surgery", "Saturn indicates chronic/valvular nature", "Leo/Cancer/Aquarius signs"] },
    { name: "Menstrual Disorders", planets: ["Moon", "Venus", "Saturn", "Ketu"], signs: [6, 7], houses: [7, 6, 8], conditions: ["7th house/Moon/Venus/Libra", "Saturn causes protracted conditions", "Ketu causes defective functions", "Anuradha star represents female organs"] },
    { name: "Sleep Disorders", planets: ["Saturn", "Moon", "Rahu"], signs: [11], houses: [1, 12], conditions: ["12th house signifies sleep", "Saturn causes disturbance/blockade", "Moon connected to 12th house", "Lagna lord linked to Saturn and 12th"] },
    { name: "Gastric/Stomach Ulcer", planets: ["Mars", "Sun", "Saturn", "Ketu"], signs: [3, 4, 5], houses: [5, 6, 8], conditions: ["5th house is stomach in natural zodiac", "Sun rules stomach", "Mars causes inflammation", "Saturn causes irregularity", "Pushya star indicates gastric ulcer"] },
    { name: "Appendicitis", planets: ["Mercury", "Sun", "Mars"], signs: [5], houses: [6, 8], conditions: ["Virgo rules intestines and appendix", "Mercury governs appendix region", "Mars causes inflammation/operation"] },
    { name: "Elephantiasis", planets: ["Mercury", "Venus", "Saturn", "Rahu"], signs: [10], houses: [1, 6, 8, 11, 12], conditions: ["Aquarius rules legs", "Mercury governs nerves", "Venus governs lymphatics", "Saturn governs connective tissues", "Rahu involvement"] },
    { name: "Hysteria", planets: ["Moon", "Mercury", "Saturn", "Rahu"], signs: [9, 10], houses: [1, 4, 6, 8, 12], conditions: ["Moon and Mercury afflicted by Saturn or Rahu", "Saturn's signs Capricorn/Aquarius", "Mercury nervous affliction"] },
    { name: "Suicide Risk", planets: ["Mars", "Saturn", "Ketu", "Moon"], signs: [0, 4], houses: [1, 4, 6, 8, 12], conditions: ["Lagna sub lord owns 6 (mania) in 12 (self-undoing)", "Mars gives impulse", "Ketu causes detachment", "Moon afflicted = mental agony", "badhaka lord involvement"] },
    { name: "Baldness/Hair Loss", planets: ["Saturn", "Sun"], signs: [2, 4, 5], houses: [1, 6, 12], conditions: ["Saturn signifies removal/separation", "Lagna indicates head", "Sun produces heat", "Barren signs: Gemini/Leo/Virgo involvement"] },
    { name: "Punarphoo Chronic Conditions", planets: ["Saturn", "Moon"], signs: null, houses: [1, 6, 8], conditions: ["Moon-Saturn conjunction/aspect", "Causes chronic gastritis/constipation", "Bone/teeth brittleness", "Recovery very hard once fallen sick", "Disease worsens day by day in middle age"] }
  ];

  // ──────────────────────────────────────────────────────────────────────────
  // Surgery timing rules (sources: 663, 665, 666, 667)
  // ──────────────────────────────────────────────────────────────────────────
  var SURGERY_TIMING = {
    karaka_planet: "Mars",
    houses_for_surgery: [6, 8, 12],
    mars_must_signify: [8],
    mars_connected_to_4th_for_cardiac: true,
    ketu_indicates_removal: true,
    saturn_indicates_body_part_removal: true,
    rahu_indicates_dissection: true,
    timing: "Surgery occurs during Mars period/sub-period connected to 8th house",
    favorable_days: ["Tuesday", "Saturday"],
    avoid_moon_in_sign_of_organ: true,
    retrograde_saturn_favorable_if_lord_10_11: true,
    surgery_dba: "Dasa-Bhukti-Anthra of planets signifying 6th (disease), 8th (surgery), 12th (hospitalisation)"
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Recovery prediction rules (sources: 663, 664, 665, 666, 667)
  // ──────────────────────────────────────────────────────────────────────────
  var RECOVERY_RULES = {
    houses: [1, 5, 11],
    cure_houses_meaning: { 1: "health/self", 5: "12th from 6th = absence of sickness", 11: "12th from 12th = absence of hospitalisation" },
    movable_sign_curable: true,
    fixed_sign_chronic: true,
    common_sign_recurring: true,
    sixth_lord_in_fifth_negates_illness: true,
    jupiter_connected_1_5_11_ensures_recovery: true,
    saturn_delays_but_does_not_deny: true,
    mercury_in_5th_aids_nerve_brain_recovery: true,
    strong_sun_moon_protective: true,
    timing: "Recovery during joint period of significators of 1, 5, and 11"
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Mental health indicators (sources: 663, 664, 665, 666, 667, 668)
  // ──────────────────────────────────────────────────────────────────────────
  var MENTAL_HEALTH = {
    moon_affliction: { planets: ["Saturn", "Rahu", "Ketu"], houses: [1, 4, 5, 6, 8, 12], effect: "mental depression, anxiety, emotional instability" },
    mercury_affliction: { planets: ["Saturn", "Rahu"], houses: [1, 3, 6, 8, 12], effect: "nervous disorders, insomnia, loss of reason" },
    ketu_in_lagna: "detachment, spiritual crisis, mysterious mental issues",
    saturn_afflicting_moon: "melancholia, chronic depression",
    mars_afflicting_moon: "madness, impulsive rage",
    moon_mars_saturn_in_8th: "severe mental troubles",
    mental_houses: [1, 3, 5, 9],
    mental_house_meaning: { 1: "head/brain", 3: "lower mind", 5: "consciousness/intellect", 9: "higher mind" },
    aries_virgo_afflicted: "mental disease from head/nervous system affliction",
    punarphoo_5th_house: { saturn_weak: "epilepsy/fits", moon_weak: "depression/mental illness" },
    transit_rahu_ketu_on_punarphoo: "excessive troubles including mental depression, alcoholism, lunatic behavior"
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Retrograde planet health effects (sources: 663, 664, 666)
  // ──────────────────────────────────────────────────────────────────────────
  var RETROGRADE_HEALTH = {
    chronic_indication: true,
    delayed_recovery: true,
    recurring_ailment: true,
    retrograde_benefic_gives_little_help: true,
    retrograde_mars_intensifies_disease: true,
    retrograde_jupiter_causes_chronic_illness: true,
    retrograde_saturn_self_reinforcing_chronic: true,
    retrograde_mercury_recurrent_nervous: true,
    notes: "Retrograde planets whether benefic or malefic give very little help in disease recovery"
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Sign → body part mapping (12 signs) (sources: all 6 files)
  // ──────────────────────────────────────────────────────────────────────────
  var SIGN_BODY = {
    0: { name: "Aries", element: "fire", quality: "movable", parts: ["head", "brain", "face", "skull", "facial bones"], pathogenic: ["headache", "neuralgia", "insomnia", "cerebral hemorrhage", "brain fever", "epilepsy", "meningitis"] },
    1: { name: "Taurus", element: "earth", quality: "fixed", parts: ["neck", "throat", "larynx", "cerebellum", "tonsils", "vocal cords", "thyroid", "cervical vertebrae"], pathogenic: ["diphtheria", "goitre", "tonsillitis", "mumps", "apoplexy", "sore throat"] },
    2: { name: "Gemini", element: "air", quality: "common", parts: ["shoulders", "arms", "hands", "lungs", "nervous system", "collar bone", "upper ribs"], pathogenic: ["bronchitis", "asthma", "pneumonia", "TB", "pleurisy", "eosinophilia", "arm fracture"] },
    3: { name: "Cancer", element: "water", quality: "movable", parts: ["chest", "stomach", "breasts", "oesophagus", "diaphragm", "pancreas", "upper liver", "ribs"], pathogenic: ["gastritis", "indigestion", "dropsy", "jaundice", "gallstones", "cancer", "hiccough", "obesity"] },
    4: { name: "Leo", element: "fire", quality: "fixed", parts: ["heart", "upper back", "spine", "spinal cord", "aorta", "dorsal vertebrae"], pathogenic: ["heart disease", "palpitation", "angina", "spinal meningitis", "anaemia", "blood pressure", "fainting"] },
    5: { name: "Virgo", element: "earth", quality: "common", parts: ["abdomen", "intestines", "bowels", "umbilicus", "lower spine", "spleen", "pancreas"], pathogenic: ["appendicitis", "typhoid", "cholera", "worms", "peritonitis", "colic", "constipation", "vitamin B deficiency"] },
    6: { name: "Libra", element: "air", quality: "movable", parts: ["kidneys", "lumbar region", "skin", "ovaries", "vasomotor system", "lower back"], pathogenic: ["kidney disease", "diabetes", "nephritis", "lumbago", "eczema", "skin disease", "hernia", "urine suppression"] },
    7: { name: "Scorpio", element: "water", quality: "fixed", parts: ["bladder", "genitals", "urethra", "rectum", "colon", "prostate", "pelvic bones", "reproductive organs"], pathogenic: ["piles", "fistula", "venereal disease", "renal stone", "leucorrhoea", "prostate enlargement", "gonorrhea"] },
    8: { name: "Sagittarius", element: "fire", quality: "common", parts: ["hips", "thighs", "femur", "ilium", "arterial system", "nerves", "liver"], pathogenic: ["sciatica", "rheumatism", "gout", "hip fracture", "varicose veins", "locomotor ataxia"] },
    9: { name: "Capricorn", element: "earth", quality: "movable", parts: ["knees", "joints", "bones", "teeth", "skin", "patella"], pathogenic: ["arthritis", "rheumatism", "eczema", "leprosy", "gout", "knee problems", "skin disease", "bone disease"] },
    10: { name: "Aquarius", element: "air", quality: "fixed", parts: ["calves", "ankles", "legs", "circulatory system", "shin bones"], pathogenic: ["varicose veins", "ankle sprain", "blood poisoning", "irregular heart", "skin disease", "leg fracture"] },
    11: { name: "Pisces", element: "water", quality: "common", parts: ["feet", "toes", "lymphatic system", "fibrin of blood"], pathogenic: ["foot deformities", "dropsy", "gout in feet", "delirium tremens", "addiction", "intestinal issues"] }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Planet → body part mapping (9 planets) (sources: all 6 files)
  // ──────────────────────────────────────────────────────────────────────────
  var PLANET_BODY = {
    "Sun": ["heart", "spine", "right eye (male)", "left eye (female)", "bones", "stomach", "head", "brain", "vitality"],
    "Moon": ["mind", "stomach", "breasts", "uterus", "ovaries", "lungs", "left eye (male)", "right eye (female)", "lymphatic system", "body fluids", "blood"],
    "Mars": ["blood", "bone marrow", "muscles", "genitals", "rectum", "nose", "forehead", "energy", "bile", "red blood corpuscles"],
    "Mercury": ["nervous system", "lungs", "tongue", "arms", "hands", "skin", "navel", "spinal system", "gall bladder", "vocal cords", "brain"],
    "Jupiter": ["liver", "thighs", "fat", "brain", "kidneys", "right ear", "spleen", "arterial system", "pleura", "semen"],
    "Venus": ["throat", "kidneys", "face", "chin", "cheeks", "reproductive organs", "ovaries", "urine", "veins", "thyroid", "pancreas"],
    "Saturn": ["bones", "joints", "teeth", "knees", "skin", "left ear", "legs", "muscles", "spleen", "hair", "osseous system"],
    "Rahu": ["feet", "breathing", "neck", "spleen", "adrenals", "skin"],
    "Ketu": ["belly", "feet", "wounds", "spine", "cells", "tissues"]
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Disease duration indicators (sources: 664, 665, 666, 667)
  // ──────────────────────────────────────────────────────────────────────────
  var DISEASE_DURATION = {
    acute: { indicator: "Mars", sign_type: "movable", constellations: ["Mrigashira", "Chitra", "Dhanishta"], description: "Sharp, sudden, painful; speedy recovery" },
    chronic: { indicator: "Saturn", sign_type: "fixed", constellations: ["Pushya", "Anuradha", "Uttara Bhadrapada"], description: "Long-lasting, lingering, hard to cure" },
    complicated: { indicator: "Mercury", sign_type: "common", constellations: ["Ashlesha", "Jyeshtha", "Revati"], description: "Complex, relapsing, waxes and wanes" },
    undiagnosed: { indicator: "Rahu/Ketu", sign_type: null, constellations: null, description: "Mysterious, difficult to diagnose, erratic" },
    sign_rules: {
      movable: "Aries, Cancer, Libra, Capricorn - diseases of short duration, can be cured immediately",
      fixed: "Taurus, Leo, Scorpio, Aquarius - prolonged, chronic, loathsome, tedious diseases",
      common: "Gemini, Virgo, Sagittarius, Pisces - short duration but relapsing nature"
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Punarphoo Dosha rules (source: 668)
  // ──────────────────────────────────────────────────────────────────────────
  var PUNARPHOO_RULES = {
    formation: ["Moon-Saturn conjunction", "Moon-Saturn in 7/7 opposition", "Moon in Saturn star", "Saturn in Moon star", "Moon in Saturn aspect", "Moon-Saturn interchange"],
    health_effects: {
      constitutional: ["teeth problems", "gastritis", "indigestion", "constipation", "foot problems", "bone/teeth brittleness"],
      chronic: ["gallbladder stones", "mind-related problems", "uterus problems (females)", "respiratory problems"],
      recovery_pattern: "Hale and healthy normally, but once sick recovery is very hard; can reverse suddenly"
    },
    house_effects: {
      1: "head-related diseases, dandruff, fungus",
      4: "wheezing, heart problems",
      5: { saturn_weak: "fits/epilepsy", moon_weak: "depression/mental illness" },
      6: "progressive disease in middle age, worsens day by day",
      8: "health defects, accidents when connected with malefics",
      12: "mental stress, confinement, mind-related diseases"
    },
    planet_combinations: {
      "Moon+Saturn+Mercury": "wheezing, skin, foot/leg ailments (hereditary)",
      "Moon+Saturn+Jupiter": "vital organ disease (liver/kidney/heart/brain) in middle age",
      "Moon+Saturn+Mars": "alcohol addiction",
      "Moon+Saturn+Rahu": "mind-related, uterus-related, skin problems",
      "Moon+Saturn+Ketu": "leg-related surgery",
      "Moon+Saturn+Sun": "bone brittleness, fractures, less sperm count",
      "Moon+Saturn+Venus_in_Scorpio": "severe mental and physical suffering"
    },
    degree_proximity: "Tighter conjunction (within 0.5°) = more chronic and persistent",
    transit_activation: "Transit Rahu/Ketu on Punarphoo planets triggers severe mental/health effects"
  };

  // ──────────────────────────────────────────────────────────────────────────
  // KP Cuspal Sub-Lord rules for health (sources: 663, 664, 666, 667)
  // ──────────────────────────────────────────────────────────────────────────
  var CUSPAL_SUBLORD_RULES = {
    ascendant: {
      good_health: "Sub lord in star of occupant of house 1 or 11",
      bad_health: "Sub lord is significator of house 6 (sickness), 8 (danger), or 12 (hospitalisation)"
    },
    sixth_cusp: {
      primary_rule: "Sub lord of 6th cusp determines the nature of disease",
      disease_promise: "Sub lord must signify 6/8/12 AND connect to 1st house",
      saturn_connection: "chronic disease",
      mars_connection: "acute, sudden, painful, requires surgery",
      mercury_connection: "complicated disease",
      rahu_ketu_connection: "undiagnosed/mysterious disease"
    },
    eighth_cusp: {
      rule: "Shows fatal disease, defect, danger, and surgery",
      serious_illness: "Sub lord signifies 6/8/12 and connects with 1 = serious/chronic illness"
    },
    twelfth_cusp: {
      rule: "Shows hospitalisation, isolation, permanent defect",
      left_eye: "12th house indicates left eye defects",
      prolonged_hospital: "Saturn as sub lord = prolonged hospitalisation"
    },
    body_part_determination: [
      "Sign/house occupied by 6th/8th/12th cuspal sub lord",
      "Sign/house occupied by star lord of cuspal sub lord",
      "Nature of cuspal sub lord planet itself",
      "Nature of star lord planet itself"
    ]
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Timing rules for disease onset and recovery (sources: all 6 files)
  // ──────────────────────────────────────────────────────────────────────────
  var TIMING_RULES = {
    disease_onset: {
      rule: "Disease manifests during conjoined periods of significators of houses 1 AND 6",
      also: "Sub periods of significators of 1+6, or 1+8, or 1+12 in period of significator of 6",
      transit_confirmation: "Sun/Moon or joint period rulers transit in star/sub of same period rulers"
    },
    recovery: {
      rule: "Cure during joint period of significators of 1, 5, and 11",
      jupiter_grace: "Jupiter connected with 1, 5, 11 cusps ensures recovery",
      moon_fructifying: "Moon in sub of Jupiter brings remarkable cure"
    },
    surgery: {
      rule: "During Mars period/sub-period connected to 8th house",
      cardiac: "Mars must be associated with 4th bhava for cardiac surgery"
    },
    death: {
      rule: "When marakasthana (2/7) or badhakasthana lords operate after illness period",
      badhaka: { movable: 11, fixed: 9, common: 7 }
    },
    sade_sati: "Transit Saturn in 12th, 1st, or 2nd from natal Moon = health issues protracted and difficult"
  };

  // ──────────────────────────────────────────────────────────────────────────
  // House-body part detailed mapping (source: 665, 667)
  // ──────────────────────────────────────────────────────────────────────────
  var HOUSE_BODY = {
    1: ["head", "brain", "mind", "physical constitution"],
    2: ["face", "right eye", "nose", "tongue", "teeth", "ears"],
    3: ["neck", "throat", "collar bones", "hands", "breathing", "lungs", "right ear"],
    4: ["heart", "lungs", "chest", "blood", "emotional well-being"],
    5: ["upper abdomen", "liver", "gall bladder", "spleen", "intestines", "mind/intellect"],
    6: ["lower abdomen", "navel", "bones", "kidneys"],
    7: ["groins", "female organs", "bladder", "uterus", "ovaries", "prostate", "semen"],
    8: ["generative organs", "urine", "blood", "seminal vesicles", "surgery"],
    9: ["thighs", "femoral arteries", "hips", "limbs"],
    10: ["knees", "bones", "patella", "joints"],
    11: ["shanks", "legs", "left ear", "calves", "ankles"],
    12: ["feet", "blood", "left eye", "sleep", "hospitalisation"]
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Element governance (source: 667)
  // ──────────────────────────────────────────────────────────────────────────
  var ELEMENT_HEALTH = {
    fire: { signs: [0, 4, 8], governs: "vitality and life force" },
    earth: { signs: [1, 5, 9], governs: "bones and flesh" },
    air: { signs: [2, 6, 10], governs: "breath and respiration" },
    water: { signs: [3, 7, 11], governs: "blood and body fluids" }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Vitality/resistance by rising sign (source: 664)
  // ──────────────────────────────────────────────────────────────────────────
  var VITALITY_BY_ASCENDANT = {
    strong: [0, 4, 6, 8],          // Aries, Leo, Libra, Sagittarius
    moderate: [1, 2, 5, 7, 10],    // Taurus, Gemini, Virgo, Scorpio, Aquarius
    weak: [3, 9, 11]               // Cancer, Capricorn, Pisces
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Public API
  // ──────────────────────────────────────────────────────────────────────────
  return {
    NAKSHATRA_BODY: NAKSHATRA_BODY,
    PLANET_SIGN_DISEASE: PLANET_SIGN_DISEASE,
    DISEASE_PATTERNS: DISEASE_PATTERNS,
    SURGERY_TIMING: SURGERY_TIMING,
    RECOVERY_RULES: RECOVERY_RULES,
    MENTAL_HEALTH: MENTAL_HEALTH,
    RETROGRADE_HEALTH: RETROGRADE_HEALTH,
    SIGN_BODY: SIGN_BODY,
    PLANET_BODY: PLANET_BODY,
    DISEASE_DURATION: DISEASE_DURATION,
    PUNARPHOO_RULES: PUNARPHOO_RULES,
    CUSPAL_SUBLORD_RULES: CUSPAL_SUBLORD_RULES,
    TIMING_RULES: TIMING_RULES,
    HOUSE_BODY: HOUSE_BODY,
    ELEMENT_HEALTH: ELEMENT_HEALTH,
    VITALITY_BY_ASCENDANT: VITALITY_BY_ASCENDANT
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = KPHealthRules;
