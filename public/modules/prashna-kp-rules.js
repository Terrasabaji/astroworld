var PrashnaKPRules = (function() {
  'use strict';

  return {
    // Retrograde effects in Prashna (Horary) charts
    RETROGRADE_EFFECTS: {
      sublord_retrograde: {
        effect: 'matter delayed, may revert to old state',
        penalty: -20,
        details: 'If the cuspal sub lord or its sub star lord is retrograde, the matter is promised when they turn direct.'
      },
      starlord_retrograde: {
        effect: 'matter not denied but delayed to another dasha period',
        penalty: -10,
        details: 'If the star lord of the cuspal sub lord is retrograde, the matter will not materialize during that Mahadasha/Bhukti/Pratyantardasha period.'
      },
      significator_retrograde: {
        effect: 'obstacle, revision needed',
        penalty: -8,
        details: 'A retrograde planet in a Prashna chart indicates obstacle/delay but the matter materializes when the planet goes direct and passes beyond the point from which it started retrograding.'
      },
      retrograde_in_star_of_retrograde: {
        effect: 'complete failure, matter will not materialize',
        penalty: -30,
        details: 'Planets in retrograde motion, if posited in the star of another retrograde planet or in its own star when retrograde, promise only failure.'
      },
      direct_in_star_of_retrograde: {
        effect: 'no success through this significator',
        penalty: -15,
        details: 'Planets in direct motion, if posited in the star of a retrograde planet, will not see success.'
      }
    },

    // 8-step KP transit/timing procedure
    TIMING_METHODOLOGY: {
      steps: [
        'Step 1: Identify the house(s) governing the matter asked.',
        'Step 2: Check the cuspal sub lord of the relevant house - it must signify favorable houses for the matter to be promised.',
        'Step 3: Verify the star lord of the cuspal sub lord is in direct motion.',
        'Step 4: Find significators of the favorable houses (planets in stars of occupants, occupants, planets in stars of owners, owners).',
        'Step 5: Among significators, reject those in the star of a retrograde planet.',
        'Step 6: Cross-check significators with Ruling Planets at the time of judgment.',
        'Step 7: Select common planets among significators and Ruling Planets for dasha/bhukti/antara.',
        'Step 8: For exact date, find when Sun transits the star/sub of lagna star lord and Moon transits the combination of Ruling Planets.'
      ],
      dasha_bhukti_antara: {
        must_signify_favorable_houses: true,
        details: 'Events materialize during the joint period (Mahadasha, Bhukti, Pratyantardasha, Sookshma) of the significators of the relevant houses when transit agrees.'
      },
      transit_agreement: {
        significator_must_transit_star_of_other_significator: true,
        details: 'At the time of the event, Sun, Moon, and/or the joint period rulers will be found in the star or sub of the same joint period ruler or rulers.'
      },
      ruling_planets_verification: {
        day_lord: true,
        moon_star_lord: true,
        moon_sign_lord: true,
        lagna_star_lord: true,
        lagna_sign_lord: true,
        details: 'Ruling Planets in order: Star lord of Ascendant, Sign lord of Ascendant, Star lord of Moon, Sign lord of Moon, Day Lord. Include Rahu/Ketu if they conjoin or are in sign of a Ruling Planet. Omit any RP in star of a retrograde planet.'
      },
      significator_selection: {
        order: [
          'Planets in star of occupants of relevant houses',
          'Occupants of relevant houses',
          'Planets in star of owners of relevant houses',
          'Owners of relevant houses'
        ],
        rahu_ketu_preference: 'Rahu/Ketu act as agents of planets they conjoin or whose sign they occupy - give them preference as significators.',
        reject_if_in_star_of_retrograde: true
      }
    },

    // 19 case study patterns from 659.json
    CASE_PATTERNS: [
      {
        category: 'finance/employment',
        rule: 'If the 6th cuspal sublord is in the starlord of a planet in direct motion and also significator of houses 2 & 11, then the native will get arrears from the office.',
        details: 'Houses to be judged: 2, 6, 11. The 6th cusp is examined for service-related income. Timing: The planet which is the significator of 2-6-11 only in its conjoined dasa, bhukti, anthara. Exact date: Prepare ruling planets and transit Sun to the lagna star, sub and Moon\'s star - that will be the date.',
        page_ref: 'page 2 (PDF page 3)'
      },
      {
        category: 'property/vehicle_purchase',
        rule: 'If the 4th cuspal sublord is in the star lord of a planet in direct motion and it signifies 4, 11, 12 houses, the native will purchase a truck/vehicle.',
        details: 'Houses to be judged: 4, 11, 12. The 4th cusp represents vehicles/conveyances. If the significator also connects to the 10th house (which is the 4th from 7th), purchase may be in wife\'s name. Timing: 4-7-12 houses significator planets in their conjoined dasa, bhukti, anthara period. Exact date: Prepare ruling planets and transit Sun into lagna star, sub and Moon star.',
        page_ref: 'page 13 (PDF page 14)'
      },
      {
        category: 'property/vehicle_purchase',
        rule: 'If the 4th cuspal sublord is in the star lord of a planet in direct motion and also signifies 4-11-12 houses, then only the native will purchase a car.',
        details: 'Houses to be judged: 4, 11, 12 (Venus connection for vehicles). If significator connects to 5-10-11-12, native may invest money on behalf of life partner. Timing: Planets signifying 4-11-12 in their conjoined dasa, bhukti, anthara. Exact date: Prepare ruling planets, when Sun transits in the combination of lagna star, sub and Moon star.',
        page_ref: 'page 22 (PDF page 23)'
      },
      {
        category: 'business/enterprise',
        rule: 'If the 5th sublord is in the starlord of a planet in direct motion and also the significator of 2-6-11 houses and in any manner Venus is connected, then the native will open a musical shop.',
        details: 'Houses to be judged: 5, 2, 6, 11. The 5th house represents enterprise/creative business. Venus connection is required for music-related business. If 8th house connected (2nd from 7th), business may start in wife\'s name. Exact date: Prepare ruling planets and transit Sun into lagna star, sub and Moon star combination.',
        page_ref: 'page 31 (PDF page 32)'
      },
      {
        category: 'business/enterprise',
        rule: 'If the 4th cuspal sublord is in the star lord of a planet in direct motion and also signifies 4-11-12 houses and Mars is in any manner connected, then the native will open a restaurant.',
        details: 'Houses to be judged: 4, 11, 12. Mars connection is specifically required for food/restaurant business (Mars rules fire/kitchen). Timing: Planets which signify 4-11-12 houses in their conjoined dasa, bhukti, anthara period. Exact date: Prepare ruling planets and transit Sun in these combinations.',
        page_ref: 'page 40 (PDF page 41)'
      },
      {
        category: 'business/enterprise',
        rule: 'If the 4th cuspal sublord is in the star lord of a planet in direct motion and also the significator of 4, 11 & 12, then native will open a Jewellery shop.',
        details: 'Houses to be judged: 4, 11, 12. If significator connects to 6-8-9, shop may open in wife\'s name. Timing: Planets signifying 4-11-12 in their conjoined dasa, bhukti, anthara. Exact date: Prepare ruling planets, when Sun transits into lagna star, sub and Moon star.',
        page_ref: 'page 51 (PDF page 52)'
      },
      {
        category: 'business/enterprise',
        rule: 'If the 4th cuspal sublord is in the star lord of a planet in direct motion and also signifies 4-11-12 houses, and Venus is also a significator of 4-11th house, the native will open a nursing home.',
        details: 'Houses to be judged: 4, 11, 12. Venus as significator of 4 & 11 and occupying the 4th house confirms the promise. Timing: Planets signifying 4-11-12 houses in their conjoined dasa, bhukti, anthara period. Exact date: Prepare ruling planets, when Sun transits in combination of lagna star, sub and Moon star.',
        page_ref: 'page 62 (PDF page 63)'
      },
      {
        category: 'property/sale',
        rule: 'If the 3rd cuspal sublord is in the starlord of a planet in direct motion and also the significator of 10th house, the native will sell the property with profit. If it signifies 12th house, the native will sell for cheaper price.',
        details: 'Houses to be judged: 3, 10 (also 3-10-11). The 3rd house is 12th from 4th (negation of property/loss of fixed assets = sale). 10th house connection means profit in sale. 12th house connection means loss/cheaper price. Timing: During conjoined dasa, bhukti, anthara period. Exact date: Prepare ruling planets and transit Sun in combination of lagna star, sub and Moon star.',
        page_ref: 'page 73 (PDF page 74)'
      },
      {
        category: 'finance/speculation',
        rule: 'If the 5th cuspal sublord is in the star lord of a planet in direct motion and also the significator of 2 & 11, the native will get money through speculation.',
        details: 'Houses to be judged: 5, 2, 11. The 5th house rules speculation/gambling. 2nd house = income/gains to bank balance. 11th house = fulfillment of desires/gains. Timing: During conjoined dasa, bhukti, anthara period. Exact date: Prepare ruling planets and transit Sun in combination of lagna star, sub and Moon star.',
        page_ref: 'page 84 (PDF page 85)'
      },
      {
        category: 'finance/negotiation',
        rule: 'If the 3rd cuspal sublord is in the starlord of a planet in direct motion and if it signifies 11th house, the native will gain money. If it signifies 12th house, the native will lose money.',
        details: 'Houses to be judged: 3rd house (for negotiations/agreements/communication). 11th house significator = gain. 12th house significator = loss. In the example, significator of 1-8-12 showed the native will lose money while negotiating. Timing: During conjoined dasa, bhukti, anthara period.',
        page_ref: 'page 94 (PDF page 95)'
      },
      {
        category: 'health/accident',
        rule: 'If the 8th cuspal sublord is in the starlord of a planet in direct motion and also the significator of houses 1-8, the native will meet with an accident.',
        details: 'Houses to be judged: 8th house. The 8th house rules accidents, sudden events, danger. If the 8th cuspal sublord\'s star lord signifies houses other than 1-8 (e.g., 5-11), the native will NOT meet with an accident. 1st house = body/self, 8th house = danger/accident.',
        page_ref: 'page 105 (PDF page 106)'
      },
      {
        category: 'finance/lottery',
        rule: 'If the 5th cuspal sublord is in the star lord of a planet in direct motion and also a significator of 2-6-11-3, then the native will gain money through lottery.',
        details: 'Houses to be judged: 5, 2, 6, 11, 3. The 5th house = speculation/lottery. 2nd = gains to bank. 6th = windfall/service income. 11th = fulfillment/gains. 3rd = effort/luck. Timing: Planets which are significators of 3-5-6-11 during their conjoined dasa, bhukti, anthara. Exact date: Prepare ruling planets and transit Sun in combination of lagna star, sub and Moon star.',
        page_ref: 'page 116 (PDF page 117)'
      },
      {
        category: 'finance/contract_work',
        rule: 'If the 3rd cuspal sublord is in the star lord of a planet in direct motion and also a significator of houses 3-6-9-11, then the native will gain money through contract work.',
        details: 'Houses to be judged: 3, 6, 9, 11. 3rd house = contracts/agreements/communication. 6th = service/daily work. 9th = long distance/fortune. 11th = gains/fulfillment. Timing: During conjoined dasa, bhukti, anthara. Exact date: Prepare ruling planets and Sun transit in combination of lagna star, sub and Moon star.',
        page_ref: 'page 126 (PDF page 127)'
      },
      {
        category: 'business/cinema',
        rule: 'If the 6th cuspal sublord is in the starlord of a planet in direct motion and also it signifies 6-10-11 houses, the native will shoot cinema film and gain money. If it signifies 8-10-12, the native will lose money.',
        details: 'Houses to be judged: 6, 10, 11. 6th house = service/efforts. 10th = profession/career. 11th = gains/success. Combination 8-10-12 = loss in profession. If Rahu is in 4th house (10th from 7th), native can start the firm in wife\'s name. Timing: During conjoined dasa, bhukti period. Exact date: Prepare ruling planets and Sun transits in combinations of lagna star, sub and Moon star.',
        page_ref: 'page 137 (PDF page 138)'
      },
      {
        category: 'litigation',
        rule: 'If the 6th cuspal sublord is in the star lord of a planet in direct motion and also signifies 6-11th houses, the native can file a case in court.',
        details: 'Houses to be judged: 6, 11. 6th house = disputes/litigation/enemies. 11th house = success/gains/fulfillment of desires. Timing: During conjoined dasa, bhukti, anthara. Exact date: When lagna and Moon transits in the combination of ruling planets.',
        page_ref: 'page 147 (PDF page 148)'
      },
      {
        category: 'finance/agreement',
        rule: 'If the 3rd cuspal sublord is in the star lord of a planet in direct motion and also significator of 6-11th house, then only the native will sign an agreement.',
        details: 'Houses to be judged: 3, 6, 11. 3rd house = documents/agreements/contracts. 6th house = service/employment bonds. 11th house = fulfillment/gains. Timing: During conjoined dasa, bhukti, anthara period. Exact date: Prepare ruling planets and transit lagna and Moon in the combination of planets in RP (ruling planets).',
        page_ref: 'page 157 (PDF page 158)'
      },
      {
        category: 'health/cure',
        rule: 'If the 5th cuspal sublord is in the star lord of a planet in direct motion and also significator of 5-11, the native will get cure from the ailment.',
        details: 'Houses to be judged: 5, 11. 5th house = cure (12th from 6th, negation of disease). 11th house = recovery/gain of health. If the cuspal sublord\'s star lord is NOT a significator of 5-11 at all, cure is not promised. In the example, Saturn (5th sublord) in star of Mars signifying 2-7-9-10 showed no connection to 5-11, therefore cure was denied. Timing: During conjoined dasa, bhukti, anthara period.',
        page_ref: 'page 168 (PDF page 169)'
      },
      {
        category: 'marriage',
        rule: 'If the 7th cuspal sublord is in the starlord of a planet in direct motion and also it signifies 2-11, then the marriage will be arranged by the parents. If in any manner connected to the 5th house, it will be a love marriage.',
        details: 'Houses to be judged: 2, 7, 11. 7th house = marriage/partner. 2nd house = family/addition to family. 11th house = fulfillment of desires. 5th house connection = love affair leading to marriage. If significator shows 1-7-10-6-8 (without 2-11), there is no chance to get married. Timing: During conjoined dasa, bhukti period.',
        page_ref: 'page 178 (PDF page 179)'
      },
      {
        category: 'travel/foreign',
        rule: 'If the 9th cuspal sublord is in the starlord of a planet in direct motion and also the significator of houses 3-9-12, the foreign travel is promised. If it also signifies 6-11 houses, the trip will be successful.',
        details: 'Houses to be judged: 3, 9, 12, 6, 11. 9th house = long distance travel/foreign. 3rd = short journeys/movement. 12th = foreign land/leaving homeland. 6th = service abroad. 11th = success/gains. If 8th house is signified, it shows obstacle/break in journey. If the star lord is NOT a significator of 3-9-12, foreign travel is not promised. Timing: During conjoined dasa, bhukti period.',
        page_ref: 'page 178 (PDF page 179)'
      }
    ],

    // Category-enhanced rules (per-category specific KP rules from 658.json)
    CATEGORY_ENHANCED_RULES: {
      marriage: {
        sublord_cusp: 7,
        must_signify: [2, 7, 11],
        denial: [1, 6, 10],
        karaka: 'Venus',
        details: 'Sub lord of 7th must signify 2, 7, or 11. Denial if connected to 1, 6, 10, Saturn, Rahu/Ketu, or in barren signs.',
        timing_houses: [2, 7, 11],
        love_affair: { cusp: 5, houses: [2, 11], inter_caste: 'Rahu/Ketu connection' },
        second_marriage: { cusp: 2, indicator: 'Sun in star of Mercury (dual sign owner)' }
      },
      divorce: {
        sublord_cusp: 7,
        must_signify: [1, 6, 10],
        details: 'Houses 1, 6, 10 for separation (12th from 2, 7, 11). These denote absence of married life.'
      },
      health: {
        sublord_cusp: 1,
        normal: [1, 11],
        disease: [6, 8, 12],
        cure: [1, 5, 11],
        details: 'Sub lord of Ascendant in star of occupant of 1st/11th = normal health. In star of 6th/8th/12th = illness.',
        disease_cusp: 6,
        disease_signify: [6, 1]
      },
      career: {
        sublord_cusp: 10,
        must_signify: [2, 6, 10],
        denial: [1, 5, 9],
        promotion: [2, 6, 10, 11],
        transfer: [3, 10, 12],
        suspension: [1, 8, 9, 12],
        retirement: [1, 5, 9, 12],
        leaving_job: { cusp: [10, 6], signify: [1, 5, 9] },
        details: 'Sub lord of 6th/10th must signify 2, 6, or 10 for service/earning. Change via 1, 5, 9.'
      },
      business: {
        sublord_cusp: 10,
        must_signify: [2, 7, 10],
        gain: { cusp: 7, signify: [2, 10, 11] },
        details: '7th house = dealings with others, purchase and sale; main house for business.'
      },
      education: {
        sublord_cusp: 4,
        must_signify: [4, 9, 11],
        denial: [3, 8],
        exam_success: { cusp: 4, signify: [4, 9, 11] },
        scholarship: { cusp: 11, signify: [2, 6, 11], connected: 4 },
        details: 'Houses 4, 9, 11 for education. 3, 8 detrimental. Mercury and Jupiter are governors.'
      },
      foreign_travel: {
        sublord_cusp: 12,
        must_signify: [3, 9, 12],
        return_home: [3, 9, 11],
        karaka: 'Moon',
        for_career: { additional: 10 },
        for_studies: { additional: [4, 9] },
        for_marriage: { additional: 7 },
        details: 'Sub lord of 12th must signify 3, 9, or 12 (especially 9th). Moon is chief governor of travel.'
      },
      children: {
        sublord_cusp: 5,
        must_signify: [2, 5, 11],
        denial: [1, 4, 10],
        pregnancy_confirmed: { cusp: 5, fruitful_sign: true, signify: [2, 5, 11] },
        pregnancy_denied: { cusp: 5, barren_sign: true, denial_houses: [1, 4, 10] },
        details: 'Houses 2, 5, 11 for childbirth. 1, 4, 10 for absence/separation from children.'
      },
      property: {
        sublord_cusp: 4,
        purchase: [4, 11, 12],
        selling: [3, 5, 10],
        details: 'Sub lord of 4th signifies 4, 11, or 12 for own building. 3, 5, 10 for selling.'
      },
      accidents: {
        sublord_cusp: 8,
        must_signify: [8, 12],
        fatal: { signify: [8, 7, 2] },
        survival: { signify: [2, 7, 11] },
        planets: ['Mars', 'Saturn', 'Rahu', 'Ketu'],
        details: 'Sub lord of Ascendant/8th in star of occupant/owner of 8th/12th = accident. Fatal if connected to 8, 7, 2.'
      },
      litigation: {
        sublord_cusp: 6,
        must_signify: [6, 7],
        success: [6, 11],
        failure: [5, 12],
        details: '6th = litigation, 7th = opponent. Success via 11th. Failure via connection of 12th and 5th lords.'
      },
      finance: {
        gain: [2, 6, 11],
        lottery: [2, 3, 6, 11],
        speculation: [2, 5, 6, 11],
        karaka: 'Jupiter',
        details: 'Houses 2, 6, 11 for gain of money. Jupiter is chief governor of money.'
      },
      longevity: {
        sublord_cusp: 1,
        favorable: [1, 3, 8],
        maraka: [2, 7, 12],
        badhaka: { cardinal: 11, fixed: 9, mutable: 7 },
        karaka: 'Saturn',
        details: 'Houses 1, 8, 3 for longevity. Maraka: 2, 7. Badhaka: 11th for cardinal, 9th for fixed, 7th for mutable rising.'
      },
      death: {
        maraka_houses: [2, 7],
        badhaka: { cardinal: 11, fixed: 9, mutable: 7 },
        transit_trigger: 'Saturn, Rahu, Ketu simultaneously transit in stars/subs of badhaka and maraka significators.',
        lagna_sub_lord_link: true,
        details: 'For death, first consider badhaka, then maraka houses. Danger during joint period of significators of badhaka and maraka.'
      },
      missing_person: {
        houses: [3, 9, 12],
        return_houses: [2, 8, 11],
        details: 'Consider 3, 9, 12 for missing person. Return indicated by 2, 8, 11 (12th to 3, 9, 12).'
      },
      lost_property: {
        sublord_cusp: 2,
        must_signify: [2, 6, 11],
        details: 'Sub lord of 2nd/11th signifying 2, 6, or 11 indicates recovery of lost/stolen property.'
      },
      imprisonment: {
        houses: [3, 12],
        rahu_connection: true,
        details: 'Separation from home (3rd = 12th from 4th). Confinement (12th). Rahu is chief significator for jail.'
      },
      political_career: {
        planets: ['Saturn', 'Sun', 'Jupiter', 'Mars', 'Rahu'],
        cusps: [1, 10, 11],
        details: 'Sub lord of Ascendant, 10th, and 11th must signify relevant political houses. Rahu for politics/diplomacy.'
      },
      spirituality: {
        houses: [4, 8, 9, 12],
        planets: ['Sun', 'Moon', 'Jupiter', 'Saturn', 'Ketu'],
        renunciation: { signify: [3, 10, 12] },
        attainment: { cusp: 11, signify: [5, 10] },
        details: 'Houses 4, 8, 9, 12 for spiritual tendencies. Ketu for sainthood. Saturn for meditation/penance.'
      }
    },

    // Sign classifications
    FRUITFUL_SIGNS: [3, 7, 11],
    FRUITFUL_SIGN_NAMES: ['Cancer', 'Scorpio', 'Pisces'],

    BARREN_SIGNS: [0, 2, 4, 5],
    BARREN_SIGN_NAMES: ['Aries', 'Gemini', 'Leo', 'Virgo'],

    MUTE_SIGNS: [3, 7, 11],
    MUTE_SIGN_NAMES: ['Cancer', 'Scorpio', 'Pisces'],

    // Badhaka houses by rising sign type
    BADHAKA_HOUSES: {
      cardinal: 11,
      fixed: 9,
      mutable: 7
    },

    // Maraka (death-dealing) houses
    MARAKA_HOUSES: [2, 7],

    // House significations for KP Prashna
    HOUSE_SIGNIFICATIONS: {
      1: 'self, body, health, efforts of querent',
      2: 'income, family, bank balance, addition to family, speech, movable property',
      3: 'contracts, agreements, short journeys, sale of property, neighbors, courage',
      4: 'property, vehicles, fixed assets, establishments, mother, education',
      5: 'speculation, lottery, enterprise, cure from disease, love, children, creativity',
      6: 'service, employment, litigation, disputes, daily work, disease, enemies',
      7: 'marriage, partnerships, business dealings, opponent in litigation',
      8: 'accidents, obstacles, danger, surgery, longevity, sudden events, inheritance',
      9: 'foreign travel, fortune, long journeys, higher education, father, dharma',
      10: 'profession, career, status, fame, government, ambitions',
      11: 'gains, fulfillment, success, recovery, friends, elder siblings',
      12: 'expenditure, foreign land, loss, investment, hospitalization, confinement'
    },

    // General principles from 659.json
    GENERAL_PRINCIPLES: {
      cuspal_sublord_determines_promise: 'The cuspal sublord of the relevant house determines whether a matter is promised or denied.',
      starlord_must_be_direct: 'The star lord of the cuspal sublord must be in direct motion for the matter to fructify.',
      starlord_determines_signification: 'The star lord of the cuspal sublord determines which houses are signified, and thus what results will manifest.',
      timing_by_conjoined_periods: 'Events materialize during the conjoined dasa, bhukti, anthara of significator planets.',
      exact_date_by_ruling_planets: 'To determine exact date: prepare ruling planets and find when transit Sun enters lagna star/sub and Moon star combination.',
      matter_promised_condition: 'A matter is promised only when the cuspal sublord\'s star lord signifies the required favorable houses AND is in direct motion.',
      ruling_planets_confirm: 'Ruling planets at the time of judgment confirm the event and help narrow down timing.',
      negative_houses_deny: 'If the cuspal sublord\'s star lord signifies negative houses (8, 12 for that matter), the matter faces obstacles or denial.'
    },

    // Horary/Prashna specific rules
    PRASHNA_RULES: {
      chart_erection: 'Ask querent for number 1-249. This gives Ascendant sign, star, and sub. Alternatively erect chart for moment of query.',
      moon_significance: 'Moon shows the mind of the client. Moon/its star lord/sub lord occupying or owning the house under question confirms the matter is on the querent\'s mind.',
      ascendant_shows_effort: 'The Ascendant indicates the efforts of the querent.',
      eleventh_shows_success: 'The 11th cusp shows fulfillment of desires or success in general.',
      success_houses: [1, 2, 3, 6, 10, 11],
      success_details: 'If cuspal sub lord of Ascendant or 11th is posited in house 1, 2, 3, 6, 10, or 11, or in star of occupant of these houses, querent gets success in all undertakings.'
    },

    // Planet-business type connections (from 659 case studies)
    PLANET_BUSINESS_CONNECTIONS: {
      Venus: ['music', 'luxury', 'vehicles', 'nursing home', 'beauty', 'entertainment'],
      Mars: ['restaurant', 'food', 'kitchen', 'fire-related', 'engineering', 'surgery'],
      Mercury: ['communication', 'trade', 'writing', 'accounts', 'astrology'],
      Jupiter: ['education', 'law', 'finance', 'consulting', 'temple'],
      Saturn: ['mining', 'labor', 'agriculture', 'real estate', 'iron/steel'],
      Sun: ['government', 'medicine', 'gold', 'authority'],
      Moon: ['travel', 'liquids', 'dairy', 'public dealing', 'nursing']
    }
  };
})();
if (typeof module !== 'undefined' && module.exports) module.exports = PrashnaKPRules;
