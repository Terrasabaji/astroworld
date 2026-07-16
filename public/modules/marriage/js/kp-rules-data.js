/* =============================================================================
 * kp-rules-data.js  —  KP Marriage Rules Data Module
 *
 * Structured data extracted from KP astrology texts on marriage, separation,
 * romance, progeny, and transit timing. Consumed by kp.js, separation.js,
 * and timeline.js for rule-based analysis.
 *
 * Sources:
 *   653.pdf - Marriage, Child Birth and Sub Lord System (MK Viswanath)
 *   654.pdf - KP rules on relationships (Bibhash & Shikha)
 *   655.pdf - Marriage, Married Life & Children (Stellar Astrology - KP)
 *   656.pdf - Transit rules for marriage timing (K.S. Krishnamurti)
 *   657.pdf - Progeny and Romance (K. Subramaniam)
 * ========================================================================== */

const KPMarriageRules = (function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Sign classifications (0-indexed: 0=Aries, 1=Taurus, ... 11=Pisces)
  // ---------------------------------------------------------------------------

  // Barren signs: Aries(0), Gemini(2), Leo(4), Virgo(5)
  // These weaken marriage/progeny promise when 7th/5th cusp sub-lord occupies them
  const BARREN_SIGNS = [0, 2, 4, 5];

  // Fruitful (watery) signs: Cancer(3), Scorpio(7), Pisces(11)
  // Favorable for marriage and progeny
  const FRUITFUL_SIGNS = [3, 7, 11];

  // Semi-fruitful signs: Taurus(1), Libra(6), Sagittarius(8), Capricorn(9)
  const SEMI_FRUITFUL_SIGNS = [1, 6, 8, 9];

  // Dual signs: Gemini(2), Virgo(5), Sagittarius(8), Pisces(11)
  // Indicate plurality/second marriage when 7th cusp sub-lord is in them
  const DUAL_SIGNS = [2, 5, 8, 11];

  // ---------------------------------------------------------------------------
  // Marriage Promise Rules (7th cusp sub-lord analysis)
  // ---------------------------------------------------------------------------

  const PROMISE_RULES = {
    // Primary houses whose signification by 7th cusp sub-lord promises marriage
    primary_houses: [2, 7, 11],

    // Denial houses: if 7th cusp sub-lord signifies these, marriage is denied
    // 1 = 12th to 2nd; 6 = 12th to 7th; 10 = 12th to 11th; 12 = loss
    denial_houses: [1, 6, 10, 12],

    // Supporting houses (positive indicators for marriage event)
    supporting_houses: [5],

    // Extended marriage event houses (timing): self, family, co-born-in-law,
    // mother-in-law, romance, spouse, fulfillment
    event_houses: [1, 2, 3, 5, 7, 10, 11],

    // Scoring weights for promise evaluation
    weights: {
      primary_house_bonus: 20,       // per primary house signified
      denial_house_penalty: -20,     // per denial house signified
      supporting_house_bonus: 10,    // 5th house bonus
      barren_sign_penalty: -15,      // sub-lord in barren sign
      fruitful_sign_bonus: 8,        // sub-lord in fruitful sign
      retrograde_sublord_penalty: -10, // sub-lord is retrograde
      saturn_ketu_combo_denial: -30, // Saturn-Ketu link with barren + 6/12
      venus_karaka_bonus: 5,         // Venus as natural marriage karaka
      combustion_penalty: -12,       // Venus combust (within 3° of Sun)
    },

    // Complete denial formula (from 653.pdf pp.159-167):
    // 7th cusp + Saturn-Ketu link + barren sign + 6/12 connection = NO marriage
    saturn_ketu_combo_denial: true,

    // Saturn as delay master - does not deny but delays when significator
    saturn_delay_not_denial: true,

    // 6th cusp sub-lord linked to 7th cusp sub-lord = marital problems/divorce
    sixth_seventh_link_divorce: true,

    // Moon as 7th lord occupying 7th cusp cannot deny marriage
    moon_7th_lord_in_7th_no_denial: true,
  };

  // ---------------------------------------------------------------------------
  // Love Marriage Indicators
  // ---------------------------------------------------------------------------

  const LOVE_MARRIAGE = {
    // Houses for love marriage assessment
    houses: [5, 7, 11],

    // Required link: 5th cusp sub-lord must connect to 7th cusp
    fifth_seventh_link_required: true,

    // 7th cusp sub-lord must also signify 5th house for love marriage
    seventh_fifth_link_required: true,

    // Timing houses for love marriage include 5th in addition to 2, 7, 11
    timing_houses: [2, 5, 7, 11],

    // Planetary indicators for love marriage
    indicators: [
      { planet: 'Venus', role: 'karaka', condition: 'signifies_5_and_7' },
      { planet: 'Venus', role: 'karaka', condition: 'signifies_11th_cusp' },
      { planet: 'Moon', role: 'mind', condition: 'in_star_of_5th_significator' },
      { planet: 'Rahu', role: 'agent', condition: 'in_5th_signifying_7th' },
      { planet: 'Mercury', role: 'duality', condition: 'multiple_relationships' },
    ],

    // Venus as sub-lord of both 5th and 7th cusps = love leading to marriage
    venus_dual_sublord: true,

    // Saturn involvement indicates secrecy in love
    saturn_secrecy: true,

    // 5th cusp sub-lord denial conditions
    denial: {
      significator_of_6: 'lover_withdraws',
      significator_of_12: 'native_drops_idea',
    },
  };

  // ---------------------------------------------------------------------------
  // Second Marriage Rules
  // ---------------------------------------------------------------------------

  const SECOND_MARRIAGE = {
    // Houses for second marriage
    houses: [2, 9, 11],

    // 9th cusp (3rd from 7th) represents second partner
    cusp: 9,

    // Two conditions must BOTH be satisfied:
    conditions: [
      // Condition 1: Dual sign connection
      {
        id: 'dual_sign',
        description: '7th cusp sub-lord in dual sign, or in star of planet in/owning dual sign, or sub-lord is Mercury',
        dual_signs: [2, 5, 8, 11], // Gemini, Virgo, Sagittarius, Pisces
        mercury_satisfies: true,
      },
      // Condition 2: Significator of 2 or 11
      {
        id: 'house_signification',
        description: '7th cusp sub-lord must also signify 2nd or 11th house',
        required_houses: [2, 11],
      },
    ],

    // 2nd cusp sub-lord connected to 7th house = second marriage
    // 2nd cusp sub-lord connected to 11th house = keeping partner (non-legal)
    second_cusp_rules: {
      connected_to_7: 'legal_second_marriage',
      connected_to_11: 'non_legal_partner',
    },

    // Marrying a divorcee: Saturn+Mars+Mercury connected to 7th + 8th house
    divorcee_combination: {
      planets: ['Saturn', 'Mars', 'Mercury'],
      houses: [7, 8],
    },
  };

  // ---------------------------------------------------------------------------
  // Separation / Divorce Rules
  // ---------------------------------------------------------------------------

  const SEPARATION_RULES = {
    // Houses indicating separation/divorce
    houses: [1, 6, 10, 12],

    // Widowhood/maraka houses (death of partner)
    widowhood_houses: [2, 7],

    // When significators of 2,7,11 are ALSO significators of 1,6,10,12 = separation
    dual_signification_separation: true,

    // Specific house meanings in separation context
    house_meanings: {
      6: 'partner_desertion_or_enmity',
      12: 'native_seeks_separation',
      8: 'disharmony_quarrels_no_separation',
      1: 'negation_of_family_2nd',
      10: 'negation_of_fulfillment_11th',
    },

    // Saturn's role in separation
    saturn_role: {
      causes_delay: true,
      aspect_on_7th_without_signification: 'denial_not_delay',
      in_star_of_denial_planet: 'promotes_separation',
      as_12th_lord_aspecting: 'detrimental',
      flouting_rules: true,
    },

    // Mars' role in separation
    mars_role: {
      in_6th: 'quarrels_wife_leaving',
      aspecting_ketu: 'promotes_separation',
      in_7th_with_uranus_aspect: 'violence_separation',
      as_12th_lord: 'bed_comfort_issues',
      courage_for_bold_action: true,
    },

    // Ketu's role in separation
    ketu_role: {
      moksha_node: true,
      denotes: ['break', 'exit', 'abort'],
      in_6th_aspected_by_mars: 'strong_separation',
      with_saturn_link: 'forced_separation',
      not_materialistic: true,
    },

    // Divorce formula: cusps 6, 7, 12 linked through Saturn-Ketu and Mars
    divorce_formula: {
      cusps_linked: [6, 7, 12],
      planets_involved: ['Saturn', 'Ketu', 'Mars'],
      condition: 'saturn_separation_ketu_break_mars_6_12',
    },

    // Marriage sustainability test
    sustainability: {
      // 6th cusp sub-lord NOT linked to 7th cusp sub-lord = marriage sustains
      sixth_not_linked_to_seventh: true,
      // Succeeding dashas signifying 11th without 6/12 link = no divorce
      succeeding_dasha_11th_favorable: true,
    },

    // 7th cusp sub-lord in dual sign + significator of maraka + bhadhaka = spouse dies
    spouse_death: {
      sublord_in_dual_sign: true,
      significator_of_maraka: true,
      significator_of_bhadhaka: true,
    },
  };

  // ---------------------------------------------------------------------------
  // Transit Timing Rules
  // ---------------------------------------------------------------------------

  const TRANSIT_TIMING = {
    // Fundamental KP transit principle:
    // Planet transiting in a constellation brings matters of constellation lord;
    // The sub decides if result is favorable or not.
    fundamental_principle: {
      constellation_lord: 'shows_what_happens',
      transiting_planet: 'shows_source_channel',
      sub_lord: 'decides_favorable_or_not',
    },

    // Jupiter sub-transit (stages of marriage process)
    jupiter_sub_transit: {
      description: 'Jupiter in star of marriage significator - each sub shows different stage',
      stages: {
        mercury_sub: 'advertisement_horoscopes_received',
        venus_sub: 'proposals_come_to_see',
        sun_sub: 'decision_gold_purchased',
        moon_sub: 'negotiation_concluded',
        mars_sub: 'marriage_fixed_arrangements',
        rahu_sub: 'invitations_posted_purchases',
        jupiter_sub: 'marriage_celebrated',
        saturn_sub: 'separation_from_relatives_departure',
      },
    },

    // Saturn transit rules
    saturn_transit: {
      // Saturn gives results when LEAVING a house (not entering)
      result_timing: 'on_exit_from_house',
      // Saturn in star of marriage significator and favorable sub = marriage
      in_marriage_star_favorable_sub: true,
      // Saturn in Moon's sub = negotiation concluded
      moon_sub: 'marriage_negotiated_concluded',
      // Saturn in Venus's sub = marriage celebration
      venus_sub: 'marriage_celebration',
      // Saturn in Jupiter's sub = marriage of children / reunion
      jupiter_sub: 'marriage_of_children_reunion',
      // Saturn retrograde at birth: marriage when Saturn transits retrograde
      retrograde_birth_retrograde_transit: true,
      // Sade-Sati does NOT prevent marriage (traditional rule rejected)
      sade_sati_irrelevant: true,
    },

    // Ruling planets verification at time of event
    ruling_planets_verification: {
      components: [
        'lagna_sign_lord',
        'lagna_star_lord',
        'moon_sign_lord',
        'moon_star_lord',
        'day_lord',
      ],
      // Ruling planets must agree with Dasa-Bhukti lords and significators
      must_agree_with_dasa_bhukti: true,
      // Ruling planets of partner must agree with native's Dasa-Bhukti
      partner_agreement: true,
    },

    // Sun indicates month of marriage
    sun_transit: {
      role: 'indicates_month',
      in_star_sub_of_significator: true,
    },

    // Moon indicates exact day
    moon_transit: {
      role: 'indicates_day',
      in_star_sub_of_significator: true,
      in_star_of_dasa_lord_sub_of_bhukti_lord: true,
    },

    // Ascendant (lagna) indicates exact moment
    lagna_transit: {
      role: 'indicates_exact_moment',
      in_sign_star_sub_of_significators: true,
    },

    // Dasa-Bhukti-Anthra and transit correlation
    sensitive_points: {
      description: 'When A dasa B bhukti C anthra operates, sensitive zodiac points are governed by A, B, C',
      formula: 'A_sign_B_star_C_sub OR B_sign_A_star_C_sub etc.',
      luminaries_must_transit: true,
    },

    // At time of marriage, ALL planets must transit in constellation and sub of
    // significators of houses 2, 7, 11
    all_planets_in_marriage_sigs: true,

    // Traditional rules explicitly rejected in KP
    rejected_traditional_rules: [
      'gurubalam',
      'chandrashtama',
      'sade_sati',
      'vedha_system',
      'sign_based_transit_results',
    ],

    // Love affair timing: Moon transit
    love_affair_timing: {
      native_initiates: { moon_star_lord_signifies: [1, 7, 11] },
      other_initiates: { moon_star_lord_signifies: [7, 11, 5] },
      avoid: { moon_star_lord_signifies: [4, 6, 10] },
    },
  };

  // ---------------------------------------------------------------------------
  // Node Priority (Rahu/Ketu result-giving order)
  // ---------------------------------------------------------------------------

  // Rahu/Ketu give results in this priority order:
  const NODE_PRIORITY = ['conjoined', 'aspecting', 'star_lord', 'sign_lord'];

  // Additional node rules
  const NODE_RULES = {
    // Nodes do not have aspect in KP
    no_aspect: true,
    // Nodes are stronger than the planet they represent
    stronger_than_represented: true,
    // Rahu stars: Ardra, Swati, Shatabhisha (indices 5, 14, 23)
    rahu_stars: [5, 14, 23],
    // Ketu stars: Ashwini, Magha, Mula (indices 0, 9, 18)
    ketu_stars: [0, 9, 18],
    // Planets in Rahu/Ketu stars give results as if they were that node
    star_occupant_gives_node_results: true,
    // Node displaces sign lord when alone in sign (no conjunction/aspect)
    displaces_sign_lord_when_alone: true,
  };

  // ---------------------------------------------------------------------------
  // Retrograde Rules
  // ---------------------------------------------------------------------------

  const RETROGRADE_RULES = {
    // 5th cusp sub-lord retrograde weakens progeny promise
    sublord_retrograde_weakens: true,
    // Significator retrograde causes delay (not denial per some authorities)
    significator_retrograde_delays: true,
    // Sub-lord in star of retrograde planet: negates promise
    star_lord_retrograde_denies_in_period: true,
    // Three conditions for progeny (from 657.pdf golden rule):
    progeny_conditions: [
      'sub_lord_not_retrograde',
      'sub_lord_not_in_star_of_retrograde',
      'sub_lord_signifies_2_5_or_11',
    ],
    // Practical note: retrogression does not always constitute bar (research ongoing)
    practical_exceptions_noted: true,
    // Transit: retrograde planet forming same aspect multiple times =
    // same type of result in different stages (negotiation, fixation, celebration)
    transit_retrograde_multiple_aspects: 'stages_of_same_event',
  };

  // ---------------------------------------------------------------------------
  // Marital Happiness / Discord
  // ---------------------------------------------------------------------------

  const MARITAL_HAPPINESS = {
    // Good houses for marital happiness (from lagna)
    good_houses: [2, 7, 11],

    // Discord houses (from 7th = partner perspective, i.e. houses detrimental to 7th)
    discord_houses: [4, 6, 8, 12],

    // 11th cusp sub-lord determines state of married life
    eleventh_cusp_sublord_decides: true,

    // If 11th cusp sub-lord signifies 6, 8, or 12 = unhappy marriage
    eleventh_sublord_adverse: [6, 8, 12],

    // 1st cusp sub-lord as significator of 7th = marital happiness
    first_sublord_signifies_7th: 'good_partner_happiness',

    // 1st cusp sub-lord as significator of 6th = disharmony
    first_sublord_signifies_6th: 'disharmony',

    // Planetary combinations for unhappy married life
    unhappy_combinations: [
      { condition: 'sun_evil_aspect_moon', context: 'significator_of_2_7_11' },
      { condition: 'malefics_in_7th', context: 'bad_aspect_from_6_10_12_significators' },
      { condition: 'mars_in_7th_uranus_aspect', result: 'violence_separation' },
      { condition: 'mars_in_7th_saturn_aspect', result: 'divorce' },
      { condition: 'moon_saturn_mutual_adverse', result: 'enmity_during_union' },
      { condition: 'venus_bad_aspect_saturn_mars', result: 'no_pleasant_union' },
      { condition: 'moon_disharmonious_jupiter', result: 'dissatisfaction' },
      { condition: 'mars_in_8th_jupiter_sub', result: 'partner_extravagant' },
    ],

    // Venus in upachaya with good aspect = peace after marriage
    // (unless in sub of significator of 6/10/12)
    venus_upachaya_good: true,

    // Link of 7th cusp with 8th cusp = humiliation from spouse/in-laws
    seventh_eighth_link: 'humiliation',

    // Sun in lagna aspecting 7th = non-caring attitude towards spouse
    sun_lagna_aspect_7th: 'non_caring',
  };

  // ---------------------------------------------------------------------------
  // Timing Significators (Dasa-Bhukti-Anthra)
  // ---------------------------------------------------------------------------

  const TIMING_SIGNIFICATORS = {
    // Marriage houses for timing
    marriage_houses: [2, 7, 11],

    // Dasa-Bhukti-Anthra must all signify marriage houses
    dasha_bhukti_must_signify: [2, 7, 11],

    // Transit agreement required for precise timing
    transit_agreement_required: true,

    // Significator hierarchy (strongest to weakest):
    significator_hierarchy: [
      { level: 1, desc: 'Planet in star of occupant of house (STRONGEST)' },
      { level: 2, desc: 'Occupant of house' },
      { level: 3, desc: 'Planet in star of owner/lord of house' },
      { level: 4, desc: 'Owner/lord of the house' },
      { level: 5, desc: 'Planet conjoined with or aspecting above significators' },
    ],

    // Use ruling planets at judgment to eliminate weak significators
    ruling_planets_filter: true,

    // Sub-lord of significator must connect to 2,7,11 for useful significator
    // If sub of significator is lord of 1,6,10 or significator of 12 = useless
    sub_lord_validation: {
      useful_if_sub_connected_to: [2, 7, 11],
      reject_if_sub_connected_to: [1, 6, 10, 12],
    },

    // Saturn causes delay at every point when it is significator
    saturn_delay: {
      always_delays: true,
      in_5th_house: 'extreme_delay',
      opposing_moon: 'punarphoo_delay',
      must_agree_before_marriage: true,
      saturn_return_can_trigger: true,
    },

    // Speed of planets determines duration of transit effect
    transit_duration: {
      moon: 'fortnight',
      mercury_venus_sun_mars: 'few_months',
      jupiter_saturn: 'six_months_minimum',
      uranus_neptune: 'years',
      orb_degrees: 16, // 8 degrees either side of exact
    },

    // Day lord correspondence
    day_lord: {
      sunday: 'Sun', monday: 'Moon', tuesday: 'Mars',
      wednesday: 'Mercury', thursday: 'Jupiter',
      friday: 'Venus', saturday: 'Saturn',
    },

    // Rahu/Ketu dasa: event occurs during Rahu-kalam of the day
    node_dasa_rahu_kalam: true,
  };

  // ---------------------------------------------------------------------------
  // Progeny Rules (Child Birth)
  // ---------------------------------------------------------------------------

  const PROGENY_RULES = {
    // Houses for child birth
    houses: [2, 5, 11],

    // Denial houses for progeny
    denial_houses: [1, 4, 10],

    // Jupiter is Putrakaraka (chief governor for child birth)
    jupiter_putrakaraka: true,

    // 5th cusp sub-lord golden rule (3 conditions - ALL must be satisfied):
    golden_rule: [
      'sub_lord_not_retrograde',
      'sub_lord_not_in_star_of_retrograde_planet',
      'sub_lord_is_significator_of_2_5_or_11',
    ],

    // Additional negative conditions:
    negative_conditions: [
      'sub_lord_in_barren_sign',
      'sub_lord_in_star_of_rahu_or_ketu',
      'sub_lord_connected_to_4th_house',
      'sub_lord_connected_to_8th_12th',
    ],

    // For males: 11th cusp sub-lord examined (5th from 7th = wife's fertility)
    male_fertility_cusp: 11,

    // For females: 5th cusp sub-lord examined
    female_fertility_cusp: 5,

    // Mars = monthly periods (female); Moon = fertility (female)
    // Sun = vitality (male); Venus = fertility (male)
    fertility_planets: {
      female: { periods: 'Mars', fertility: 'Moon' },
      male: { vitality: 'Sun', fertility: 'Venus' },
    },

    // Timing of child birth: joint period of significators of 2, 5, 11
    timing_houses: [2, 5, 11],

    // Rahu/Ketu abortive in 5th/11th
    nodes_abortive: true,

    // Twin birth conditions (all three must be satisfied simultaneously)
    twin_conditions: [
      '5th_sub_lord_in_star_of_planet_in_dual_sign',
      'constellation_lord_in_star_of_planet_in_dual_sign',
      '5th_cusp_sign_is_dual_or_star_of_planet_in_dual',
    ],

    // Sex of child determination
    sex_determination: {
      sun_hora: 'male',
      moon_hora: 'female',
      male_planets: ['Sun', 'Mars', 'Jupiter'],
      female_planets: ['Moon', 'Venus', 'Rahu'],
    },
  };

  // ---------------------------------------------------------------------------
  // Extra-Marital / Debauchery Rules (from 654.pdf)
  // ---------------------------------------------------------------------------

  const EXTRA_MARITAL_RULES = {
    // Primary cusps for debauchery assessment
    cusps: [1, 5, 11],

    // All co-rulers of 1st, 5th, 11th must connect to Saturn/Mars/Venus
    key_planets: ['Saturn', 'Mars', 'Venus'],

    // Venus = attraction/sexual pleasure; Mars = passion/drive; Saturn = taboo/secrecy
    planet_roles: {
      Venus: 'love_attraction_pleasure',
      Mars: 'passion_physical_drive',
      Saturn: 'secrecy_taboo_breaking',
    },

    // Connection methods that satisfy the rule
    connection_methods: [
      'planet_is_co_ruler_directly',
      'co_ruler_aspected_by_key_planet',
      'co_ruler_in_constellation_of_key_planet',
      'co_ruler_in_sign_of_key_planet',
    ],

    // Houses for extra-marital assessment
    houses: {
      fifth: 'romance',
      eighth: 'hidden_extra_nature',
      ninth: 'younger_coborn_of_spouse',
      twelfth: 'sleeping_bed',
    },

    // Moon+Venus linked = two women in man's life
    moon_venus_link: 'two_women',

    // Mercury = duality (multiple partners)
    mercury_duality: true,

    // Loss assessment through 5th cusp sub-lord constellation lord:
    loss_indicators: {
      signifies_10_and_12: 'loss_of_reputation',
      signifies_4_and_12: 'loss_of_property',
      signifies_2_and_12: 'loss_of_money',
    },
  };

  // ---------------------------------------------------------------------------
  // Planet Roles in Marriage Context
  // ---------------------------------------------------------------------------

  const PLANET_ROLES = {
    Venus: {
      role: 'kalathrakaraka',
      description: 'Chief governor for marriage; romantic life ruler',
      houses_owned_natural: [2, 7], // Taurus (2nd) & Libra (7th) in natural zodiac
      combust_within_degrees: 3,
    },
    Saturn: {
      role: 'delay_master',
      description: 'Causes delay; flouting rules; unconventional; separation',
      denial_when: 'aspect_only_without_signification',
      delay_when: 'is_significator',
      punarphoo: 'connection_with_moon_causes_delay',
    },
    Mars: {
      role: 'passion_action',
      description: 'Courage, bold action, quarrels; physical drive',
      in_7th: 'manglik_but_kp_rejects_traditional_dosha',
      promotes_separation_when: 'in_6th_or_12th_aspecting_ketu',
    },
    Jupiter: {
      role: 'putrakaraka',
      description: 'Chief governor for children; expansion; celebration',
      transit_in_marriage_star: 'shows_stages_of_marriage',
      in_12th: 'legal_separation_possible',
    },
    Moon: {
      role: 'mind_index',
      description: 'Index of mind; fertility (female); timing indicator',
      transit_pinpoints_day: true,
      opposed_by_saturn: 'delay_in_marriage',
      as_7th_lord_in_7th: 'cannot_deny_marriage',
    },
    Mercury: {
      role: 'duality_plurality',
      description: 'Plurality; second hearing; multiple partners; eunuch nature',
      in_dual_sign: 'second_marriage_indicator',
      connection_to_7th: 'multiple_relationships',
    },
    Sun: {
      role: 'authority_timing',
      description: 'Month indicator; government; authority; ego',
      in_lagna_aspecting_7th: 'non_caring_attitude',
      transit_indicates: 'month_of_marriage',
    },
    Rahu: {
      role: 'amplifier_agent',
      description: 'Stronger than planet represented; eunuch; unconventional',
      in_5th_11th: 'abortive_for_progeny',
      represents_conjoined_first: true,
    },
    Ketu: {
      role: 'moksha_break',
      description: 'Break, exit, abort; spiritual; non-materialistic',
      abortive_for_progeny: true,
      as_7th_sublord: 'may_bring_widow_widower',
      with_saturn: 'strongest_denial_combination',
    },
  };

  // ---------------------------------------------------------------------------
  // KP Significator Hierarchy
  // ---------------------------------------------------------------------------

  const SIGNIFICATOR_HIERARCHY = {
    // Strength order (1 = strongest)
    levels: [
      { level: 1, type: 'star_of_occupant', desc: 'Planet in star of occupant of house' },
      { level: 2, type: 'occupant', desc: 'Occupant of house' },
      { level: 3, type: 'star_of_lord', desc: 'Planet in star of lord of house' },
      { level: 4, type: 'lord', desc: 'Lord/owner of house' },
      { level: 5, type: 'conjunct_aspect', desc: 'Planet conjoined/aspecting above' },
    ],

    // Sub-lord decides final outcome (KP sub-lord theory)
    sub_lord_decides: true,

    // Stellar level (constellation): WHAT happens
    // Sub level: WHETHER it happens (favorable or not)
    stellar_shows_what: true,
    sub_shows_whether: true,

    // Cuspal co-rulers: sign lord, star lord, sub-lord
    cuspal_co_rulers: ['sign_lord', 'star_lord', 'sub_lord'],
  };

  // ---------------------------------------------------------------------------
  // Scoring Weights for Composite Analysis
  // ---------------------------------------------------------------------------

  const SCORING = {
    // Marriage promise scoring
    promise: {
      sublord_signifies_7: 25,
      sublord_signifies_2: 20,
      sublord_signifies_11: 20,
      sublord_signifies_5: 10,
      sublord_in_fruitful_sign: 8,
      sublord_in_barren_sign: -15,
      sublord_retrograde: -10,
      sublord_in_star_of_retrograde: -8,
      saturn_ketu_barren_6_12: -30,
      venus_combust: -12,
      sublord_signifies_1: -15,
      sublord_signifies_6: -20,
      sublord_signifies_10: -15,
      sublord_signifies_12: -18,
    },

    // Separation risk scoring
    separation: {
      sublord_7_signifies_6: 20,
      sublord_7_signifies_12: 18,
      sublord_11_signifies_6_8_12: 15,
      saturn_ketu_mars_linked: 25,
      sixth_cusp_linked_seventh: 20,
      mars_in_6_or_12: 12,
      ketu_in_6_aspected_mars: 15,
      saturn_aspecting_7_no_signification: 10,
    },

    // Timing confidence scoring
    timing: {
      dasa_lord_signifies_2_7_11: 25,
      bhukti_lord_signifies_2_7_11: 25,
      anthra_lord_signifies_2_7_11: 20,
      transit_agreement: 15,
      ruling_planets_agreement: 15,
    },
  };

  // ---------------------------------------------------------------------------
  // Return public API
  // ---------------------------------------------------------------------------

  return {
    BARREN_SIGNS,
    FRUITFUL_SIGNS,
    SEMI_FRUITFUL_SIGNS,
    DUAL_SIGNS,
    PROMISE_RULES,
    LOVE_MARRIAGE,
    SECOND_MARRIAGE,
    SEPARATION_RULES,
    TRANSIT_TIMING,
    NODE_PRIORITY,
    NODE_RULES,
    RETROGRADE_RULES,
    MARITAL_HAPPINESS,
    TIMING_SIGNIFICATORS,
    PROGENY_RULES,
    EXTRA_MARITAL_RULES,
    PLANET_ROLES,
    SIGNIFICATOR_HIERARCHY,
    SCORING,
  };
})();

if (typeof module !== 'undefined' && module.exports) module.exports = KPMarriageRules;
