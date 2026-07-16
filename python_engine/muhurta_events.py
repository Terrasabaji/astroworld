"""
Astro World — Muhurta event catalog (130+ predefined events).
Rules follow classical Parashara / B.V. Raman Muhurta principles.
"""

# Shared nakshatra sets (0-based indices)
NAK_ALL = list(range(27))
NAK_AUSPICIOUS = [0, 1, 3, 4, 6, 8, 10, 11, 12, 13, 14, 16, 17, 20, 21, 22, 24, 25, 26]
NAK_MARRIAGE = [0, 1, 3, 4, 6, 8, 10, 11, 12, 13, 16, 17, 21, 22, 24, 25, 26]
NAK_CONSTRUCTION = [3, 4, 6, 8, 10, 11, 12, 13, 14, 16, 17, 21, 22, 24, 25]
NAK_TRAVEL = [0, 1, 3, 4, 6, 8, 10, 11, 12, 13, 16, 17, 21, 22, 24, 26]
NAK_BUSINESS = [0, 3, 4, 6, 8, 10, 11, 12, 13, 16, 17, 21, 22, 24, 25]
NAK_SPIRITUAL = [0, 3, 4, 6, 8, 10, 11, 12, 13, 16, 17, 21, 22, 24, 25, 26]
NAK_EDUCATION = [0, 3, 4, 6, 8, 10, 11, 12, 13, 16, 17, 21, 22, 24, 26]
NAK_HEALTH = [0, 3, 4, 6, 8, 10, 11, 12, 13, 16, 17, 21, 22, 24, 26]
NAK_AVOID = [1, 2, 5, 7, 9, 18, 19, 20, 23]  # Bharani, Krittika, Ardra, Ashlesha, Magha, Mula, etc.

TITHI_GOOD = [2, 3, 5, 7, 10, 11, 12, 13]
TITHI_GOOD_LIGHT = [2, 3, 5, 7, 10, 11, 12, 13, 1]
TITHI_AVOID = [4, 6, 8, 9, 14, 30]
TITHI_AVOID_FULL = [4, 6, 8, 9, 14, 15, 30]

WEEKDAY_ALL = [0, 1, 2, 3, 4, 5, 6]
WEEKDAY_GOOD = [1, 2, 3, 4, 5]  # Mon–Fri generally
WEEKDAY_MARRIAGE = [1, 2, 3, 4, 5]
WEEKDAY_BUSINESS = [1, 2, 3, 4, 5]
WEEKDAY_TRAVEL = [1, 2, 3, 4, 5, 6]

LAGNA_GOOD = [1, 2, 3, 4, 5, 6, 7, 9, 11]  # Taurus, Gemini, Cancer, Leo, Virgo, Libra, Sag, Aquarius
LAGNA_AVOID = [7, 8]  # Scorpio, often avoided as general lagna

CHOGHADIYA_GOOD = ["Amrit", "Shubh", "Labh", "Chal", "Char"]
CHOGHADIYA_AVOID = ["Rog", "Kaal", "Udveg"]


def _ev(eid, name, category, **rules):
    base = {
        "id": eid,
        "name": name,
        "category": category,
        "favorable_tithis": rules.get("favorable_tithis", TITHI_GOOD),
        "avoid_tithis": rules.get("avoid_tithis", TITHI_AVOID_FULL),
        "favorable_nakshatras": rules.get("favorable_nakshatras", NAK_AUSPICIOUS),
        "avoid_nakshatras": rules.get("avoid_nakshatras", NAK_AVOID),
        "favorable_weekdays": rules.get("favorable_weekdays", WEEKDAY_GOOD),
        "favorable_lagnas": rules.get("favorable_lagnas", LAGNA_GOOD),
        "avoid_lagnas": rules.get("avoid_lagnas", LAGNA_AVOID),
        "favorable_choghadiya": rules.get("favorable_choghadiya", CHOGHADIYA_GOOD),
        "avoid_choghadiya": rules.get("avoid_choghadiya", CHOGHADIYA_AVOID),
        "require_daylight": rules.get("require_daylight", True),
        "allow_purnima": rules.get("allow_purnima", False),
        "allow_amavasya": rules.get("allow_amavasya", False),
        "notes": rules.get("notes", ""),
        "nakshatra_class_preference": rules.get("nakshatra_class_preference", []),
        "tithi_group_preference": rules.get("tithi_group_preference", []),
        "activity_type": rules.get("activity_type", None),
    }
    return base


def build_event_catalog():
    events = []

    # ── Samskaras (20) ──
    samskara = [
        ("vivaha", "Marriage (Vivaha)", {"favorable_nakshatras": NAK_MARRIAGE, "favorable_weekdays": WEEKDAY_MARRIAGE,
         "notes": "Venus & Jupiter strong; avoid Rahu Kaal, Gulika, malefics in 7th.",
         "activity_type": "marriage", "nakshatra_class_preference": ["Mridu", "Dhruva", "Kshipra"],
         "tithi_group_preference": ["Nanda", "Bhadra", "Purna"]}),
        ("engagement", "Engagement (Nischitartham / Sagai)", {"favorable_nakshatras": NAK_MARRIAGE,
         "activity_type": "marriage", "nakshatra_class_preference": ["Mridu", "Dhruva", "Kshipra"],
         "tithi_group_preference": ["Nanda", "Bhadra", "Purna"]}),
        ("reception", "Wedding Reception", {"favorable_nakshatras": NAK_MARRIAGE}),
        ("namakarana", "Naming Ceremony (Namakarana)", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("annaprashana", "First Feeding (Annaprashana)", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("chudakarana", "Mundan / Chudakarana", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("karnavedha", "Ear Piercing (Karnavedha)", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("upanayana", "Sacred Thread (Upanayana)", {"favorable_nakshatras": NAK_SPIRITUAL, "favorable_tithis": TITHI_GOOD_LIGHT}),
        ("vedarambha", "Beginning Vedic Study (Vedarambha)", {"favorable_nakshatras": NAK_EDUCATION}),
        ("samavartana", "Graduation / Return from Gurukul", {"favorable_nakshatras": NAK_EDUCATION}),
        ("antyeshti", "Funeral Rites (Antyeshti)", {"require_daylight": False, "allow_amavasya": True,
         "favorable_nakshatras": [0, 3, 4, 8, 10, 11, 12, 13, 16, 17, 21, 22, 24, 26],
         "notes": "Separate rules; often Krishna paksha tithis."}),
        ("seemantha", "Baby Shower (Seemantha)", {"favorable_nakshatras": NAK_MARRIAGE}),
        ("jatakarma", "Birth Ritual (Jatakarma)", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("nishkramana", "First Outing (Nishkramana)", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("vivaha_renewal", "Vow Renewal / Anniversary Ceremony", {"favorable_nakshatras": NAK_MARRIAGE}),
        ("upanayana_girl", "Upanayana for Girl (where practiced)", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("satyanarayana", "Satyanarayana Puja", {"favorable_nakshatras": NAK_SPIRITUAL, "allow_purnima": True}),
        ("rudrabhisheka", "Rudrabhisheka", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("lakshmi_puja", "Lakshmi Puja / Varalakshmi", {"favorable_nakshatras": NAK_BUSINESS}),
        ("ganapati_sthapana", "Ganapati Sthapana", {"favorable_nakshatras": NAK_SPIRITUAL}),
    ]
    for eid, name, rules in samskara:
        events.append(_ev(eid, name, "Samskara", **rules))

    # ── Property & Construction (18) ──
    property_ev = [
        ("griha_pravesh", "House Warming (Griha Pravesh)", {"favorable_nakshatras": NAK_CONSTRUCTION,
         "activity_type": "construction", "nakshatra_class_preference": ["Dhruva"],
         "tithi_group_preference": ["Nanda", "Purna"]}),
        ("bhumi_pujan", "Land Worship (Bhumi Pujan)", {"favorable_nakshatras": NAK_CONSTRUCTION,
         "activity_type": "construction", "nakshatra_class_preference": ["Dhruva"],
         "tithi_group_preference": ["Nanda", "Purna"]}),
        ("foundation_stone", "Foundation Stone Laying", {"favorable_nakshatras": NAK_CONSTRUCTION,
         "activity_type": "construction", "nakshatra_class_preference": ["Dhruva"],
         "tithi_group_preference": ["Nanda", "Purna"]}),
        ("construction_start", "Construction Commencement", {"favorable_nakshatras": NAK_CONSTRUCTION,
         "activity_type": "construction", "nakshatra_class_preference": ["Dhruva"],
         "tithi_group_preference": ["Nanda", "Purna"]}),
        ("roof_ceremony", "Roof Laying Ceremony", {"favorable_nakshatras": NAK_CONSTRUCTION}),
        ("door_installation", "Main Door Installation", {"favorable_nakshatras": NAK_CONSTRUCTION}),
        ("property_purchase", "Property Purchase", {"favorable_nakshatras": NAK_BUSINESS}),
        ("property_sale", "Property Sale", {"favorable_nakshatras": NAK_BUSINESS}),
        ("land_purchase", "Land Purchase", {"favorable_nakshatras": NAK_BUSINESS}),
        ("land_sale", "Land Sale", {"favorable_nakshatras": NAK_BUSINESS}),
        ("lease_signing", "Lease / Rent Agreement", {"favorable_nakshatras": NAK_BUSINESS}),
        ("renovation_start", "Renovation Start", {"favorable_nakshatras": NAK_CONSTRUCTION}),
        ("demolition", "Demolition / Breaking Ground", {"favorable_nakshatras": NAK_CONSTRUCTION}),
        ("vastu_puja", "Vastu Shanti Puja", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("office_shift", "Office Relocation", {"favorable_nakshatras": NAK_CONSTRUCTION}),
        ("shop_inauguration", "Shop Inauguration", {"favorable_nakshatras": NAK_BUSINESS}),
        ("factory_inauguration", "Factory Inauguration", {"favorable_nakshatras": NAK_BUSINESS}),
        ("warehouse_opening", "Warehouse Opening", {"favorable_nakshatras": NAK_BUSINESS}),
    ]
    for eid, name, rules in property_ev:
        events.append(_ev(eid, name, "Property & Construction", **rules))

    # ── Business & Finance (22) ──
    business_ev = [
        ("business_start", "New Business Launch", {"favorable_nakshatras": NAK_BUSINESS,
         "activity_type": "business", "nakshatra_class_preference": ["Kshipra", "Chara"],
         "tithi_group_preference": ["Bhadra", "Purna"]}),
        ("company_registration", "Company Registration", {"favorable_nakshatras": NAK_BUSINESS}),
        ("partnership_deed", "Partnership Agreement", {"favorable_nakshatras": NAK_BUSINESS}),
        ("contract_signing", "Contract Signing", {"favorable_nakshatras": NAK_BUSINESS}),
        ("investment_start", "Investment / Trading Start", {"favorable_nakshatras": NAK_BUSINESS}),
        ("bank_account", "Opening Bank Account", {"favorable_nakshatras": NAK_BUSINESS}),
        ("loan_application", "Loan Application", {"favorable_nakshatras": NAK_BUSINESS}),
        ("loan_disbursement", "Loan Disbursement", {"favorable_nakshatras": NAK_BUSINESS}),
        ("share_allotment", "Share Allotment / IPO", {"favorable_nakshatras": NAK_BUSINESS}),
        ("audit_start", "Audit Commencement", {"favorable_nakshatras": NAK_BUSINESS}),
        ("tax_filing", "Important Tax Filing", {"favorable_nakshatras": NAK_BUSINESS}),
        ("salary_start", "First Salary / Payroll Start", {"favorable_nakshatras": NAK_BUSINESS}),
        ("promotion_joining", "Joining After Promotion", {"favorable_nakshatras": NAK_BUSINESS}),
        ("resignation_submit", "Resignation Submission", {"favorable_nakshatras": NAK_BUSINESS}),
        ("merger_acquisition", "Merger / Acquisition Signing", {"favorable_nakshatras": NAK_BUSINESS}),
        ("franchise_start", "Franchise Agreement", {"favorable_nakshatras": NAK_BUSINESS}),
        ("import_export", "Import / Export Shipment", {"favorable_nakshatras": NAK_TRAVEL}),
        ("tender_submission", "Tender Submission", {"favorable_nakshatras": NAK_BUSINESS}),
        ("auction_bid", "Auction / Bid Submission", {"favorable_nakshatras": NAK_BUSINESS}),
        ("insurance_policy", "Insurance Policy Start", {"favorable_nakshatras": NAK_BUSINESS}),
        ("gold_purchase", "Gold / Jewellery Purchase", {"favorable_nakshatras": NAK_BUSINESS}),
        ("vehicle_purchase_finance", "Vehicle Finance Agreement", {"favorable_nakshatras": NAK_BUSINESS}),
    ]
    for eid, name, rules in business_ev:
        events.append(_ev(eid, name, "Business & Finance", **rules))

    # ── Education (12) ──
    education_ev = [
        ("school_admission", "School Admission", {"favorable_nakshatras": NAK_EDUCATION,
         "activity_type": "education", "nakshatra_class_preference": ["Dhruva", "Kshipra", "Mridu"],
         "tithi_group_preference": ["Bhadra", "Purna"]}),
        ("college_admission", "College Admission", {"favorable_nakshatras": NAK_EDUCATION}),
        ("university_enrollment", "University Enrollment", {"favorable_nakshatras": NAK_EDUCATION}),
        ("exam_start", "Examination Start", {"favorable_nakshatras": NAK_EDUCATION}),
        ("thesis_submission", "Thesis / Dissertation Submission", {"favorable_nakshatras": NAK_EDUCATION}),
        ("competitive_exam", "Competitive Exam", {"favorable_nakshatras": NAK_EDUCATION,
         "activity_type": "competition", "nakshatra_class_preference": ["Ugra", "Tikshna"],
         "tithi_group_preference": ["Jaya"]}),
        ("new_course_start", "New Course / Class Start", {"favorable_nakshatras": NAK_EDUCATION}),
        ("music_lesson_start", "Music / Dance Lesson Start", {"favorable_nakshatras": NAK_EDUCATION}),
        ("language_class", "Language Class Start", {"favorable_nakshatras": NAK_EDUCATION}),
        ("scholarship_apply", "Scholarship Application", {"favorable_nakshatras": NAK_EDUCATION}),
        ("abroad_study_apply", "Study Abroad Application", {"favorable_nakshatras": NAK_EDUCATION}),
        ("convocation", "Convocation / Degree Ceremony", {"favorable_nakshatras": NAK_EDUCATION}),
    ]
    for eid, name, rules in education_ev:
        events.append(_ev(eid, name, "Education", **rules))

    # ── Travel & Journey (14) ──
    travel_ev = [
        ("travel_start", "Journey / Travel Start", {"favorable_nakshatras": NAK_TRAVEL, "favorable_weekdays": WEEKDAY_TRAVEL,
         "activity_type": "travel", "nakshatra_class_preference": ["Chara", "Kshipra"],
         "tithi_group_preference": ["Nanda", "Bhadra"]}),
        ("pilgrimage", "Pilgrimage Start", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("foreign_travel", "Foreign Travel Departure", {"favorable_nakshatras": NAK_TRAVEL,
         "activity_type": "travel", "nakshatra_class_preference": ["Chara", "Kshipra"],
         "tithi_group_preference": ["Nanda", "Bhadra"]}),
        ("return_journey", "Return Journey", {"favorable_nakshatras": NAK_TRAVEL}),
        ("flight_departure", "Flight Departure", {"favorable_nakshatras": NAK_TRAVEL}),
        ("ship_voyage", "Ship Voyage Start", {"favorable_nakshatras": NAK_TRAVEL}),
        ("migration", "Migration / Relocation Abroad", {"favorable_nakshatras": NAK_TRAVEL}),
        ("visa_application", "Visa Application", {"favorable_nakshatras": NAK_TRAVEL}),
        ("passport_application", "Passport Application", {"favorable_nakshatras": NAK_TRAVEL}),
        ("hotel_checkin", "Hotel Check-in (auspicious)", {"favorable_nakshatras": NAK_TRAVEL}),
        ("trek_start", "Trek / Expedition Start", {"favorable_nakshatras": NAK_TRAVEL}),
        ("yatra_char_dham", "Char Dham Yatra", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("business_trip", "Business Trip Departure", {"favorable_nakshatras": NAK_TRAVEL}),
        ("honeymoon_travel", "Honeymoon Travel", {"favorable_nakshatras": NAK_MARRIAGE}),
    ]
    for eid, name, rules in travel_ev:
        events.append(_ev(eid, name, "Travel & Journey", **rules))

    # ── Health & Medical (12) ──
    health_ev = [
        ("surgery", "Surgery / Operation", {"favorable_nakshatras": NAK_HEALTH,
         "notes": "Moon strong; avoid malefic transits to lagna lord.",
         "activity_type": "surgery", "nakshatra_class_preference": ["Tikshna"],
         "tithi_group_preference": ["Jaya"]}),
        ("medical_procedure", "Medical Procedure", {"favorable_nakshatras": NAK_HEALTH}),
        ("hospital_admission", "Hospital Admission", {"favorable_nakshatras": NAK_HEALTH}),
        ("hospital_discharge", "Hospital Discharge", {"favorable_nakshatras": NAK_HEALTH}),
        ("dental_procedure", "Dental Procedure", {"favorable_nakshatras": NAK_HEALTH}),
        ("eye_surgery", "Eye Surgery", {"favorable_nakshatras": NAK_HEALTH}),
        ("vaccination", "Vaccination", {"favorable_nakshatras": NAK_HEALTH}),
        ("ayurveda_treatment", "Ayurveda Treatment Start", {"favorable_nakshatras": NAK_HEALTH}),
        ("physiotherapy", "Physiotherapy Start", {"favorable_nakshatras": NAK_HEALTH}),
        ("fertility_treatment", "Fertility Treatment Start", {"favorable_nakshatras": NAK_MARRIAGE}),
        ("diet_regimen", "Diet / Wellness Regimen Start", {"favorable_nakshatras": NAK_HEALTH}),
        ("yoga_therapy", "Yoga Therapy Start", {"favorable_nakshatras": NAK_HEALTH}),
    ]
    for eid, name, rules in health_ev:
        events.append(_ev(eid, name, "Health & Medical", **rules))

    # ── Legal & Government (12) ──
    legal_ev = [
        ("court_case_filing", "Court Case Filing", {"favorable_nakshatras": NAK_BUSINESS}),
        ("court_hearing", "Court Hearing", {"favorable_nakshatras": NAK_BUSINESS}),
        ("settlement_signing", "Legal Settlement Signing", {"favorable_nakshatras": NAK_BUSINESS}),
        ("will_registration", "Will Registration", {"favorable_nakshatras": NAK_BUSINESS}),
        ("power_of_attorney", "Power of Attorney", {"favorable_nakshatras": NAK_BUSINESS}),
        ("government_application", "Government Application", {"favorable_nakshatras": NAK_BUSINESS}),
        ("license_application", "License Application", {"favorable_nakshatras": NAK_BUSINESS}),
        ("police_complaint", "Police Complaint Filing", {"favorable_nakshatras": NAK_BUSINESS}),
        ("arbitration", "Arbitration Hearing", {"favorable_nakshatras": NAK_BUSINESS}),
        ("mediation", "Mediation Session", {"favorable_nakshatras": NAK_BUSINESS}),
        ("bail_application", "Bail Application", {"favorable_nakshatras": NAK_BUSINESS}),
        ("oath_ceremony", "Oath / Swearing-in Ceremony", {"favorable_nakshatras": NAK_SPIRITUAL}),
    ]
    for eid, name, rules in legal_ev:
        events.append(_ev(eid, name, "Legal & Government", **rules))

    # ── Agriculture (10) ──
    agri_ev = [
        ("sowing_seeds", "Sowing Seeds", {"favorable_nakshatras": [3, 4, 6, 8, 10, 11, 12, 13, 16, 17, 21, 22]}),
        ("ploughing", "Ploughing / Tilling", {"favorable_nakshatras": [3, 4, 6, 8, 10, 11, 12, 13]}),
        ("irrigation_start", "Irrigation Start", {"favorable_nakshatras": NAK_CONSTRUCTION}),
        ("harvest", "Harvest", {"favorable_nakshatras": NAK_BUSINESS}),
        ("orchard_planting", "Orchard / Tree Planting", {"favorable_nakshatras": NAK_CONSTRUCTION}),
        ("cattle_purchase", "Cattle Purchase", {"favorable_nakshatras": NAK_BUSINESS}),
        ("poultry_start", "Poultry Farm Start", {"favorable_nakshatras": NAK_BUSINESS}),
        ("dairy_start", "Dairy Farm Start", {"favorable_nakshatras": NAK_BUSINESS}),
        ("fertilizer_apply", "Fertilizer Application", {"favorable_nakshatras": [3, 4, 6, 8, 10, 11]}),
        ("farm_lease", "Farm Lease Agreement", {"favorable_nakshatras": NAK_BUSINESS}),
    ]
    for eid, name, rules in agri_ev:
        events.append(_ev(eid, name, "Agriculture", **rules))

    # ── Vehicles & Transport (8) ──
    vehicle_ev = [
        ("vehicle_purchase", "Vehicle Purchase", {"favorable_nakshatras": NAK_BUSINESS}),
        ("vehicle_delivery", "Vehicle Delivery / First Drive", {"favorable_nakshatras": NAK_BUSINESS}),
        ("vehicle_registration", "Vehicle Registration", {"favorable_nakshatras": NAK_BUSINESS}),
        ("driving_test", "Driving Test", {"favorable_nakshatras": NAK_EDUCATION}),
        ("learner_license", "Learner License", {"favorable_nakshatras": NAK_EDUCATION}),
        ("bike_purchase", "Motorcycle Purchase", {"favorable_nakshatras": NAK_BUSINESS}),
        ("fleet_inauguration", "Fleet / Transport Business Start", {"favorable_nakshatras": NAK_BUSINESS}),
        ("ship_naming", "Ship / Boat Naming Ceremony", {"favorable_nakshatras": NAK_SPIRITUAL}),
    ]
    for eid, name, rules in vehicle_ev:
        events.append(_ev(eid, name, "Vehicles & Transport", **rules))

    # ── Spiritual & Religious (12) ──
    spiritual_ev = [
        ("temple_consecration", "Temple Consecration (Kumbhabhisheka)", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("deity_installation", "Deity Installation (Prana Pratishtha)", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("homa_havan", "Homa / Havan", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("yagna_start", "Yagna Commencement", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("fast_begin", "Vrata / Fast Beginning", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("mantra_diksha", "Mantra Diksha", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("yantra_installation", "Yantra Installation", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("pilgrimage_return", "Pilgrimage Return Puja", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("navagraha_shanti", "Navagraha Shanti", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("sankalpa", "Sankalpa for Important Work", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("charity_donation", "Major Charity / Donation", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("spiritual_retreat", "Spiritual Retreat Start", {"favorable_nakshatras": NAK_SPIRITUAL}),
    ]
    for eid, name, rules in spiritual_ev:
        events.append(_ev(eid, name, "Spiritual & Religious", **rules))

    # ── Family & Social (10) ──
    family_ev = [
        ("housewarming_party", "Housewarming Party", {"favorable_nakshatras": NAK_CONSTRUCTION}),
        ("birthday_celebration", "Milestone Birthday Celebration", {"favorable_nakshatras": NAK_AUSPICIOUS}),
        ("thread_ceremony_party", "Post-Upanayana Celebration", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("family_reunion", "Family Reunion", {"favorable_nakshatras": NAK_AUSPICIOUS}),
        ("adoption_ceremony", "Adoption Ceremony", {"favorable_nakshatras": NAK_MARRIAGE}),
        ("pet_adoption", "Pet Adoption", {"favorable_nakshatras": NAK_AUSPICIOUS}),
        ("naming_pet", "Pet Naming Ceremony", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("house_blessing", "House Blessing by Priest", {"favorable_nakshatras": NAK_SPIRITUAL}),
        ("community_event", "Community Event Launch", {"favorable_nakshatras": NAK_BUSINESS}),
        ("cultural_program", "Cultural Program Inauguration", {"favorable_nakshatras": NAK_BUSINESS}),
    ]
    for eid, name, rules in family_ev:
        events.append(_ev(eid, name, "Family & Social", **rules))

    # ── Technology & Creative (8) ──
    tech_ev = [
        ("software_launch", "Software / App Launch", {"favorable_nakshatras": NAK_BUSINESS}),
        ("website_launch", "Website Launch", {"favorable_nakshatras": NAK_BUSINESS}),
        ("patent_filing", "Patent Filing", {"favorable_nakshatras": NAK_BUSINESS}),
        ("research_project", "Research Project Start", {"favorable_nakshatras": NAK_EDUCATION}),
        ("book_release", "Book Release", {"favorable_nakshatras": NAK_EDUCATION}),
        ("film_release", "Film / Media Release", {"favorable_nakshatras": NAK_BUSINESS}),
        ("art_exhibition", "Art Exhibition Opening", {"favorable_nakshatras": NAK_BUSINESS}),
        ("music_album", "Music Album Release", {"favorable_nakshatras": NAK_EDUCATION}),
    ]
    for eid, name, rules in tech_ev:
        events.append(_ev(eid, name, "Technology & Creative", **rules))

    # ── Employment (8) ──
    employment_ev = [
        ("job_joining", "Job Joining / First Day at Work", {"favorable_nakshatras": NAK_BUSINESS}),
        ("interview", "Job Interview", {"favorable_nakshatras": NAK_EDUCATION}),
        ("offer_acceptance", "Job Offer Acceptance", {"favorable_nakshatras": NAK_BUSINESS}),
        ("freelance_start", "Freelance Career Start", {"favorable_nakshatras": NAK_BUSINESS}),
        ("consulting_start", "Consulting Practice Start", {"favorable_nakshatras": NAK_BUSINESS}),
        ("startup_incorporation", "Startup Incorporation", {"favorable_nakshatras": NAK_BUSINESS}),
        ("board_meeting", "Important Board Meeting", {"favorable_nakshatras": NAK_BUSINESS}),
        ("salary_negotiation", "Salary Negotiation", {"favorable_nakshatras": NAK_BUSINESS}),
    ]
    for eid, name, rules in employment_ev:
        events.append(_ev(eid, name, "Employment", **rules))

    return events


EVENT_CATALOG = build_event_catalog()
EVENT_BY_ID = {e["id"]: e for e in EVENT_CATALOG}
