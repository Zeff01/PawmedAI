"""The starting case library.

Six teaching cases across the four species the filters offer, each built on a
presentation a student meets in a standard curriculum. They are written to be
*discriminable*: every distractor is a diagnosis a reasonable student would
consider, and each explanation names the finding that rules it out. A case whose
wrong answers are obviously wrong teaches nothing.

Points per stage rise with the reasoning they take — 10 / 15 / 20 / 25 — and a
clean run earns a 30-point bonus, so a case is worth 100.
"""

HISTORY, DIAGNOSTICS, DIFFERENTIAL, DIAGNOSIS = (
    "history",
    "diagnostics",
    "differential",
    "diagnosis",
)
SINGLE, MULTI = "single", "multi"

CASES = [
    # ── 1 ────────────────────────────────────────────────────────────────────
    {
        "slug": "bella-acute-collapse",
        "title": "Bella — 7yo Golden Retriever: acute collapse & pale mucous membranes",
        "species": "canine",
        "discipline": "Emergency & Critical Care",
        "difficulty": "intermediate",
        "body_system": "Cardiovascular / Haematology",
        "presentation": (
            "7-year-old female neutered Golden Retriever, presented after "
            "collapsing in the garden. Owner reports she has been quieter than "
            "usual for a fortnight and off her food since yesterday."
        ),
        "completion_bonus": 30,
        "order": 1,
        "stages": [
            {
                "kind": HISTORY,
                "title": "Triage the presentation",
                "briefing": (
                    "On arrival: HR 168 bpm, weak femoral pulses, CRT 3 seconds, "
                    "mucous membranes pale pink to white. Temperature 37.4°C. "
                    "Respiratory rate 40/min with no crackles. Abdomen is "
                    "distended and fluid-thrill positive on ballottement. "
                    "Mentation dull but responsive."
                ),
                "prompt": "Which findings put this dog in shock right now?",
                "select_mode": MULTI,
                "points": 10,
                "options": [
                    ("Tachycardia with weak femoral pulses", "HR 168, poor pulse quality", True),
                    ("Pale mucous membranes with CRT 3 seconds", "Poor peripheral perfusion", True),
                    ("Fluid-distended abdomen", "Positive fluid thrill", True),
                    ("Temperature 37.4°C", "Low-normal for a dog", False),
                    ("Two weeks of lethargy", "Relevant history, not a shock parameter", False),
                ],
                "explanation": (
                    "Tachycardia, poor pulse quality and prolonged CRT are the "
                    "cardinal signs of hypovolaemic shock; the fluid-filled abdomen "
                    "tells you where the volume has gone. The mild hypothermia and "
                    "the fortnight of lethargy matter to the story but neither is a "
                    "perfusion parameter — treating them as such is how a student "
                    "ends up chasing a fever that is not there."
                ),
            },
            {
                "kind": DIAGNOSTICS,
                "title": "First-line diagnostics",
                "briefing": (
                    "You have stabilised with oxygen and placed two large-bore "
                    "peripheral catheters. The dog remains tachycardic after an "
                    "initial fluid bolus."
                ),
                "prompt": "Which diagnostics do you run in the first ten minutes?",
                "select_mode": MULTI,
                "points": 15,
                "options": [
                    ("AFAST abdominal ultrasound", "Free fluid, and where it is", True),
                    ("PCV and total solids", "Baseline before dilution by fluids", True),
                    ("Abdominocentesis with PCV of the fluid", "Confirms haemoabdomen", True),
                    ("Blood pressure and lactate", "Quantifies the perfusion deficit", True),
                    ("Barium contrast series", "Takes hours and gives you nothing here", False),
                    ("Thyroid panel (T4/TSH)", "No bearing on an acute collapse", False),
                ],
                "explanation": (
                    "AFAST plus abdominocentesis answers the only question that "
                    "changes the next hour: is the abdomen full of blood? A fluid "
                    "PCV approaching the peripheral PCV confirms haemoabdomen. "
                    "Contrast studies and endocrine panels are not wrong tests in "
                    "general — they are the wrong tests right now, and a collapsing "
                    "patient does not have hours to spare."
                ),
            },
            {
                "kind": DIFFERENTIAL,
                "title": "Build the differential list",
                "briefing": (
                    "AFAST: substantial free fluid in all four quadrants. "
                    "Abdominocentesis yields non-clotting blood, fluid PCV 34% "
                    "against a peripheral PCV of 29%. Ultrasound shows a 7 cm "
                    "cavitated mass at the splenic head. No history of trauma, no "
                    "access to rodenticide, platelet count 178 ×10⁹/L."
                ),
                "prompt": "Which remain plausible causes of this haemoabdomen?",
                "select_mode": MULTI,
                "points": 20,
                "options": [
                    ("Ruptured splenic mass", "Cavitated splenic lesion on ultrasound", True),
                    ("Ruptured hepatic mass", "Also cavitated, also bleeds — imaging must exclude it", True),
                    ("Blunt abdominal trauma", "Owner reports no trauma, and a mass is visible", False),
                    ("Anticoagulant rodenticide toxicity", "No access, and the platelet count is normal", False),
                    ("Septic peritonitis", "The tap is frank blood, not turbid effusion", False),
                ],
                "explanation": (
                    "Non-clotting blood with a fluid PCV at or above the peripheral "
                    "PCV is haemoabdomen. With a cavitated splenic mass on screen, "
                    "spontaneous rupture leads — but a hepatic mass presents "
                    "identically and is excluded by imaging, not by assumption. "
                    "Rodenticide is the differential worth checking every time and "
                    "discarding here: coagulopathic bleeders have a prolonged PT "
                    "long before the platelet count moves."
                ),
            },
            {
                "kind": DIAGNOSIS,
                "title": "Commit to a diagnosis",
                "briefing": (
                    "Coagulation profile is within reference intervals. Thoracic "
                    "radiographs show no pulmonary nodules. The splenic mass is "
                    "confirmed as the bleeding source at exploratory laparotomy."
                ),
                "prompt": "What is your working diagnosis?",
                "select_mode": SINGLE,
                "points": 25,
                "options": [
                    ("Spontaneous haemoabdomen from a ruptured splenic mass", "Most likely haemangiosarcoma pending histopathology", True),
                    ("Gastric dilatation-volvulus", "", False),
                    ("Immune-mediated haemolytic anaemia", "", False),
                    ("Hypoadrenocorticism (Addisonian crisis)", "", False),
                ],
                "explanation": (
                    "The two-thirds rule is the one to carry out of this case: "
                    "roughly two thirds of splenic masses in dogs are malignant, "
                    "and roughly two thirds of those are haemangiosarcoma — but "
                    "that is a probability, not a diagnosis. Histopathology names "
                    "the tumour. GDV gives you a tympanic, not fluid-filled, "
                    "abdomen; IMHA gives you pallor without free abdominal blood; "
                    "an Addisonian crisis is bradycardic far more often than "
                    "tachycardic."
                ),
            },
        ],
    },
    # ── 2 ────────────────────────────────────────────────────────────────────
    {
        "slug": "milo-weight-loss-pupd",
        "title": "Milo — 4yo DSH: progressive weight loss with polyuria & polydipsia",
        "species": "feline",
        "discipline": "Internal Medicine",
        "difficulty": "advanced",
        "body_system": "Endocrine & Renal",
        "presentation": (
            "4-year-old male neutered domestic shorthair. Owner reports 1.2 kg of "
            "weight loss over six weeks despite a noticeably increased appetite, "
            "and a water bowl that needs refilling twice a day."
        ),
        "completion_bonus": 30,
        "order": 2,
        "stages": [
            {
                "kind": HISTORY,
                "title": "Read the signalment",
                "briefing": (
                    "Body condition score 3/9, down from 5/9 at last year's "
                    "vaccination. Unkempt coat. HR 190 bpm. No palpable cervical "
                    "goitre. Plantigrade stance noted when walking across the "
                    "consulting table. Indoor-only, fed dry food ad libitum."
                ),
                "prompt": "Which features point towards an endocrinopathy rather than simple undernutrition?",
                "select_mode": MULTI,
                "points": 10,
                "options": [
                    ("Weight loss despite polyphagia", "Calories are going in and not being used", True),
                    ("Polyuria and polydipsia", "An osmotic or renal driver", True),
                    ("Plantigrade hindlimb stance", "Diabetic neuropathy in the cat", True),
                    ("Indoor-only lifestyle", "Not discriminating", False),
                    ("Absent cervical goitre", "An absence, and a clue against one diagnosis", False),
                ],
                "explanation": (
                    "Losing weight while eating more is the finding that separates "
                    "an endocrine cause from a cat who simply is not being fed "
                    "enough. The plantigrade stance is worth memorising: distal "
                    "polyneuropathy dropping the hocks to the ground is close to "
                    "pathognomonic for diabetes mellitus in the cat. The absent "
                    "goitre is evidence, but of the negative sort — it argues "
                    "against a diagnosis rather than for one."
                ),
            },
            {
                "kind": DIAGNOSTICS,
                "title": "Choose the workup",
                "briefing": "The cat is bright, hydrated, and stable enough for an outpatient workup.",
                "prompt": "Which tests will actually discriminate between your leading differentials?",
                "select_mode": MULTI,
                "points": 15,
                "options": [
                    ("Blood glucose with urine glucose and ketones", "Persistent glucosuria separates diabetes from stress hyperglycaemia", True),
                    ("Serum fructosamine", "Two to three weeks of glycaemia, unaffected by the car journey", True),
                    ("Total T4", "Cheap, and hyperthyroidism must be excluded", True),
                    ("Urine specific gravity with culture", "Dilute urine, and diabetics get silent UTIs", True),
                    ("Abdominal radiographs", "Unlikely to change the answer here", False),
                    ("Coagulation profile", "No bleeding tendency to investigate", False),
                ],
                "explanation": (
                    "Fructosamine is the test that earns its place in a feline "
                    "workup: cats mount a stress hyperglycaemia on the journey to "
                    "the practice, so a single high glucose proves very little, "
                    "while fructosamine reports the previous fortnight and cannot "
                    "be spooked. Run the T4 anyway — it is inexpensive, and the "
                    "two diseases look alike from across the room."
                ),
            },
            {
                "kind": DIFFERENTIAL,
                "title": "Narrow it down",
                "briefing": (
                    "Blood glucose 24.6 mmol/L (441 mg/dL). Urine: glucose 4+, "
                    "ketones negative, USG 1.021, culture pending. Fructosamine "
                    "512 µmol/L (reference 190–365). Total T4 26 nmol/L (reference "
                    "10–55). Renal values within reference intervals."
                ),
                "prompt": "Which differentials survive these results?",
                "select_mode": MULTI,
                "points": 20,
                "options": [
                    ("Diabetes mellitus", "Marked persistent hyperglycaemia with glucosuria and a high fructosamine", True),
                    ("Concurrent urinary tract infection", "Glucosuric cats are prone to it; culture is still pending", True),
                    ("Stress hyperglycaemia", "The fructosamine excludes it", False),
                    ("Hyperthyroidism", "T4 is mid-reference and there is no goitre", False),
                    ("Chronic kidney disease", "Renal values normal, and USG is not fixed at isosthenuria", False),
                ],
                "explanation": (
                    "The fructosamine is what closes the case: stress can raise a "
                    "glucose reading, but it cannot raise a fortnight's average. "
                    "Note what age did here — hyperthyroidism is the classic mimic "
                    "of this exact presentation, but it is uncommon under eight "
                    "years and usually brings a palpable goitre and a normal-to-high "
                    "T4. A 4-year-old cat with no goitre and a mid-reference T4 is "
                    "not hyperthyroid."
                ),
            },
            {
                "kind": DIAGNOSIS,
                "title": "Commit to a diagnosis",
                "briefing": "Urine culture returns no growth. The cat remains bright and is eating well.",
                "prompt": "What is your diagnosis?",
                "select_mode": SINGLE,
                "points": 25,
                "options": [
                    ("Diabetes mellitus, non-ketotic", "Ketones negative, patient systemically well", True),
                    ("Diabetic ketoacidosis", "", False),
                    ("Hyperthyroidism", "", False),
                    ("Exocrine pancreatic insufficiency", "", False),
                ],
                "explanation": (
                    "Non-ketotic is not a hedge — it is the word that decides where "
                    "this cat sleeps tonight. Negative urine ketones in a bright, "
                    "hydrated, eating cat means outpatient stabilisation on a long-"
                    "acting insulin and a low-carbohydrate diet. Had those ketones "
                    "been positive with lethargy or vomiting, this would be DKA: an "
                    "inpatient emergency needing fluids, electrolyte correction and "
                    "soluble insulin. One dipstick pad separates the two."
                ),
            },
        ],
    },
    # ── 3 ────────────────────────────────────────────────────────────────────
    {
        "slug": "rocky-pruritus-alopecia",
        "title": "Rocky — 2yo French Bulldog: severe pruritus & alopecia",
        "species": "canine",
        "discipline": "Dermatology & Immunology",
        "difficulty": "beginner",
        "body_system": "Integumentary",
        "presentation": (
            "2-year-old male entire French Bulldog with a twelve-month history of "
            "itching that worsens each spring. Owner reports constant paw licking "
            "and recurrent ear infections."
        ),
        "completion_bonus": 30,
        "order": 3,
        "stages": [
            {
                "kind": HISTORY,
                "title": "Characterise the itch",
                "briefing": (
                    "Erythema and lichenification of the interdigital spaces on all "
                    "four paws. Periocular and perioral alopecia. Bilateral "
                    "erythematous otitis externa with brown waxy discharge. Ventral "
                    "abdomen spared of papules. In-contact humans are not itchy. "
                    "Signs began at 11 months of age and are seasonal, worsening "
                    "March to September."
                ),
                "prompt": "Which features fit an allergic dermatitis?",
                "select_mode": MULTI,
                "points": 10,
                "options": [
                    ("Onset between 6 months and 3 years of age", "The classic window for atopy", True),
                    ("Seasonal worsening", "Points to environmental allergens", True),
                    ("Distribution: paws, face, ears", "The atopic pattern", True),
                    ("Recurrent otitis externa", "Often the first and only sign", True),
                    ("In-contact humans are not itchy", "Argues against sarcoptic mange", False),
                ],
                "explanation": (
                    "Atopic dermatitis announces itself through where it itches, "
                    "not how hard: face, paws, ventrum and ears, starting in a young "
                    "adult dog, often seasonal at first. Recurrent otitis in a young "
                    "dog with no other cause is atopy until proven otherwise. The "
                    "unaffected owners are a genuine clue but a negative one — they "
                    "argue against scabies rather than for atopy."
                ),
            },
            {
                "kind": DIAGNOSTICS,
                "title": "Rule out the mimics",
                "briefing": "Before you can call this allergic, the differentials that look identical must go.",
                "prompt": "Which tests do you run before diagnosing atopic dermatitis?",
                "select_mode": MULTI,
                "points": 15,
                "options": [
                    ("Deep skin scrapes", "Demodex and Sarcoptes", True),
                    ("Tape-strip cytology of skin and ear", "Malassezia and cocci", True),
                    ("Flea comb with a strict flea-control trial", "Flea allergy is the great mimic", True),
                    ("An eight-week elimination diet trial", "Separates food-responsive from environmental", True),
                    ("Serum allergy testing to reach the diagnosis", "Selects immunotherapy allergens; it does not diagnose", False),
                    ("Thyroid panel", "Endocrine alopecia is not usually pruritic", False),
                ],
                "explanation": (
                    "Atopic dermatitis is a diagnosis of exclusion, and this is the "
                    "order it is excluded in: parasites, infection, fleas, food — "
                    "then, and only then, atopy. The trap is serum allergy testing. "
                    "It does not diagnose atopic dermatitis: healthy dogs test "
                    "positive to plenty of allergens. Its job is choosing what goes "
                    "into an immunotherapy vaccine once the clinical diagnosis is "
                    "already made."
                ),
            },
            {
                "kind": DIFFERENTIAL,
                "title": "Interpret the workup",
                "briefing": (
                    "Deep scrapes negative ×3. Ear cytology: numerous Malassezia "
                    "pachydermatis, moderate neutrophils. Interdigital cytology: "
                    "Malassezia and cocci. Eight weeks of strict flea control gave "
                    "no improvement. An eight-week hydrolysed elimination diet gave "
                    "no improvement; signs recurred with the spring pollen season."
                ),
                "prompt": "Which conclusions do these results support?",
                "select_mode": MULTI,
                "points": 20,
                "options": [
                    ("Environmental atopic dermatitis", "Mimics excluded, seasonality retained", True),
                    ("Secondary Malassezia dermatitis and otitis", "Confirmed on cytology", True),
                    ("Secondary superficial bacterial pyoderma", "Cocci on interdigital cytology", True),
                    ("Cutaneous adverse food reaction", "A strict diet trial failed to help", False),
                    ("Sarcoptic mange", "Negative scrapes, no in-contact itch, no response pattern", False),
                ],
                "explanation": (
                    "The secondary infections are not a side note — they are why the "
                    "dog is as uncomfortable as it is, and clearing them is what "
                    "reveals how much itch the allergy alone actually causes. Treat "
                    "the Malassezia and the pyoderma first, then reassess. A student "
                    "who diagnoses atopy and reaches straight for a long-term "
                    "immunomodulator, leaving a yeast-laden ear untreated, has an "
                    "owner back in the consulting room within a fortnight."
                ),
            },
            {
                "kind": DIAGNOSIS,
                "title": "Commit to a diagnosis",
                "briefing": "Infections have been cleared with topical and systemic therapy; residual pruritus persists at 5/10.",
                "prompt": "What is your diagnosis?",
                "select_mode": SINGLE,
                "points": 25,
                "options": [
                    ("Canine atopic dermatitis with secondary Malassezia and bacterial infection", "", True),
                    ("Cutaneous adverse food reaction", "", False),
                    ("Sarcoptic mange", "", False),
                    ("Primary seborrhoea", "", False),
                ],
                "explanation": (
                    "Residual itch after every infection has been cleared is the "
                    "allergy itself, and it is what long-term management is aimed at. "
                    "Name the secondary infections in the diagnosis rather than "
                    "leaving them implied: they recur, and the record needs to say "
                    "they were there so the next clinician looks for them."
                ),
            },
        ],
    },
    # ── 4 ────────────────────────────────────────────────────────────────────
    {
        "slug": "comet-acute-colic",
        "title": "Comet — 9yo Warmblood gelding: acute colic",
        "species": "equine",
        "discipline": "Emergency & Critical Care",
        "difficulty": "advanced",
        "body_system": "Gastrointestinal",
        "presentation": (
            "9-year-old Warmblood gelding, pawing and flank-watching for four "
            "hours. Recently moved onto box rest for a tendon injury; hay intake "
            "unchanged, water intake reportedly reduced."
        ),
        "completion_bonus": 30,
        "order": 4,
        "stages": [
            {
                "kind": HISTORY,
                "title": "Assess the pain and the risk",
                "briefing": (
                    "HR 48 bpm, mucous membranes pink, CRT 2 seconds. Intermittent "
                    "pawing that settles with walking. Gut sounds reduced in all "
                    "four quadrants. No faecal output for 12 hours. Rectal "
                    "temperature 37.8°C. Digital pulses normal."
                ),
                "prompt": "Which findings raise your concern in a colicking horse?",
                "select_mode": MULTI,
                "points": 10,
                "options": [
                    ("Reduced water intake on recent box rest", "The classic setup for an impaction", True),
                    ("Absent faecal output for 12 hours", "Something is not moving through", True),
                    ("Reduced gut sounds in all quadrants", "Reduced motility", True),
                    ("HR 48 bpm", "Mildly elevated; not the tachycardia of a strangulating lesion", False),
                    ("Normal digital pulses", "Reassuring against laminitis, not a colic sign", False),
                ],
                "explanation": (
                    "Box rest plus reduced water is the impaction recipe, and the "
                    "history is doing most of the diagnostic work before you touch "
                    "the horse. Read the heart rate carefully: 48 bpm with pain that "
                    "settles on walking is a horse you can work up. A strangulating "
                    "lesion drives the rate past 60 with pain that no amount of "
                    "walking or analgesia will touch — that horse needs a surgeon, "
                    "not another rectal."
                ),
            },
            {
                "kind": DIAGNOSTICS,
                "title": "Work the colic up",
                "briefing": "The horse is in stocks and sedated for examination.",
                "prompt": "What belongs in a first-pass colic workup?",
                "select_mode": MULTI,
                "points": 15,
                "options": [
                    ("Nasogastric intubation", "Decompresses, and net reflux changes everything", True),
                    ("Rectal palpation", "Locates the lesion in the caudal abdomen", True),
                    ("Serial heart rate and pain scoring", "Trend beats a single reading", True),
                    ("Transabdominal ultrasound", "Distended loops, wall thickness, free fluid", True),
                    ("Oral glucose tolerance test", "Not a colic test", False),
                    ("Standing radiographs of the abdomen", "Rarely diagnostic in an adult horse this size", False),
                ],
                "explanation": (
                    "Pass the tube early and pass it on every colic. More than "
                    "2 litres of net reflux redirects you towards a small intestinal "
                    "or proximal obstruction, and leaving a stomach undecompressed "
                    "risks a rupture the horse will not survive. Abdominal "
                    "radiography works in foals and ponies; on a 600 kg Warmblood "
                    "you will not penetrate enough tissue to learn anything."
                ),
            },
            {
                "kind": DIFFERENTIAL,
                "title": "Localise the lesion",
                "briefing": (
                    "Nasogastric intubation yields no net reflux. Rectal palpation: "
                    "firm, doughy, indentable mass in the ventral left caudal "
                    "abdomen at the pelvic flexure. No distended small intestine. "
                    "Peritoneal fluid is clear and straw-coloured with a normal "
                    "lactate. HR remains 48 bpm after two hours."
                ),
                "prompt": "Which differentials fit this picture?",
                "select_mode": MULTI,
                "points": 20,
                "options": [
                    ("Large colon impaction at the pelvic flexure", "Palpable indentable mass in the right place", True),
                    ("Large colon displacement", "Can coexist and must be excluded on repeat examination", True),
                    ("Small intestinal strangulating obstruction", "No reflux, no distended small intestine, HR stable", False),
                    ("Gastric rupture", "The horse would be in septic shock", False),
                    ("Sand enteropathy", "Possible, but the palpable pelvic flexure mass explains it already", False),
                ],
                "explanation": (
                    "The peritoneal tap is the finding that lets you sleep: clear, "
                    "straw-coloured fluid with a normal lactate says the bowel wall "
                    "is alive. Serosanguineous fluid with a rising lactate is "
                    "devitalised intestine and a surgical decision measured in "
                    "minutes. Keep displacement on the list — it feels similar on "
                    "the first rectal and declares itself on the second."
                ),
            },
            {
                "kind": DIAGNOSIS,
                "title": "Commit to a diagnosis",
                "briefing": (
                    "After enteral fluids by nasogastric tube and intravenous fluid "
                    "support, the horse passes faeces at 14 hours and pain resolves. "
                    "Repeat rectal finds the pelvic flexure soft and reduced in size."
                ),
                "prompt": "What was the diagnosis?",
                "select_mode": SINGLE,
                "points": 25,
                "options": [
                    ("Large colon impaction at the pelvic flexure", "Medically resolved", True),
                    ("Right dorsal displacement of the large colon", "", False),
                    ("Strangulating lipoma of the small intestine", "", False),
                    ("Equine grass sickness", "", False),
                ],
                "explanation": (
                    "The response to treatment confirmed the diagnosis — resolution "
                    "with enteral and intravenous fluids is what an impaction does, "
                    "and a displacement or a strangulating lesion would not have. "
                    "The management point outlasts the case: this horse became "
                    "colicky because box rest cut its water intake, so send it home "
                    "with soaked feed and a plan, or you will see it again next week."
                ),
            },
        ],
    },
    # ── 5 ────────────────────────────────────────────────────────────────────
    {
        "slug": "pip-rabbit-gut-stasis",
        "title": "Pip — 3yo Netherland Dwarf rabbit: anorexia & no faecal pellets",
        "species": "exotic",
        "discipline": "Exotic Animal Medicine",
        "difficulty": "intermediate",
        "body_system": "Gastrointestinal",
        "presentation": (
            "3-year-old female neutered Netherland Dwarf rabbit. Has not eaten "
            "since yesterday morning and has passed no faecal pellets overnight. "
            "Diet is largely muesli mix with occasional hay."
        ),
        "completion_bonus": 30,
        "order": 5,
        "stages": [
            {
                "kind": HISTORY,
                "title": "Recognise the emergency",
                "briefing": (
                    "Hunched, pressing the abdomen to the floor, grinding teeth. "
                    "Temperature 37.1°C (reference 38.5–40.0). Stomach palpates "
                    "doughy and enlarged. Caecum gas-filled. No pellets in the "
                    "litter tray for 18 hours. Molar spurs palpable on the buccal "
                    "aspect of the upper arcade."
                ),
                "prompt": "Which findings make this an emergency rather than a routine appointment?",
                "select_mode": MULTI,
                "points": 10,
                "options": [
                    ("Anorexia for over 12 hours in a rabbit", "Hepatic lipidosis follows fast", True),
                    ("No faecal output for 18 hours", "The gut has stopped", True),
                    ("Hypothermia at 37.1°C", "Below reference; a decompensating rabbit", True),
                    ("Tooth grinding and a hunched posture", "Rabbit pain behaviour", True),
                    ("Molar spurs", "Very likely the cause, but not the emergency", False),
                ],
                "explanation": (
                    "A rabbit that has not eaten for twelve hours is an emergency, "
                    "full stop — they are obligate hindgut fermenters that cannot "
                    "vomit, and hepatic lipidosis follows anorexia quickly. "
                    "Hypothermia in a small mammal means decompensation and must be "
                    "corrected before anything else you plan to do. The molar spurs "
                    "are almost certainly the reason this started, but they are a "
                    "cause to address once the rabbit is stable, not the crisis in "
                    "front of you."
                ),
            },
            {
                "kind": DIAGNOSTICS,
                "title": "Decide what to do first",
                "briefing": "The rabbit is collapsed in the corner of the carrier and resents handling.",
                "prompt": "What are your immediate priorities?",
                "select_mode": MULTI,
                "points": 15,
                "options": [
                    ("Active warming to normothermia", "Nothing else works until this is done", True),
                    ("Analgesia with an opioid and an NSAID", "Pain is itself a cause of ileus", True),
                    ("Fluid therapy", "Rehydrates impacted stomach contents", True),
                    ("Whole-body radiographs", "Gas patterns; excludes true obstruction", True),
                    ("Immediate exploratory laparotomy", "Not before stabilisation and imaging", False),
                    ("Oral prokinetics before imaging", "Dangerous if this is an obstruction", False),
                ],
                "explanation": (
                    "The order here is the whole lesson: warm, then analgese, then "
                    "rehydrate, then image. Prokinetics before imaging is the "
                    "genuinely dangerous choice — if the gut is truly obstructed, "
                    "driving motility against the obstruction can rupture it. Stasis "
                    "and obstruction present almost identically in a rabbit, and "
                    "radiography is what separates them."
                ),
            },
            {
                "kind": DIFFERENTIAL,
                "title": "Stasis or obstruction?",
                "briefing": (
                    "Radiographs: stomach distended with a mixed food-and-gas "
                    "opacity, gas throughout the caecum and colon, faecal pellets "
                    "visible in the distal colon. No single focal gas-capped "
                    "dilation. Glucose 9.2 mmol/L (reference 4.2–8.9). The rabbit "
                    "is now normothermic and taking a little syringe-fed critical "
                    "care formula."
                ),
                "prompt": "What do these findings support?",
                "select_mode": MULTI,
                "points": 20,
                "options": [
                    ("Gastrointestinal stasis (ileus)", "Gas distributed throughout, pellets still in the distal colon", True),
                    ("Dental disease as the underlying trigger", "Molar spurs make eating hurt", True),
                    ("Complete small intestinal obstruction", "Gas is distributed, not focally trapped; distal pellets present", False),
                    ("Mucoid enteropathy", "No gelatinous mucus passed", False),
                    ("Hepatic lipidosis already established", "Possible sequel; not shown by these findings", False),
                ],
                "explanation": (
                    "Distributed gas with faecal pellets still present distally is "
                    "stasis; a true obstruction gives you a focal gas-capped "
                    "dilation and an empty distal colon. That glucose is worth a "
                    "note — a markedly high blood glucose in a rabbit (above roughly "
                    "20 mmol/L) has been associated with obstruction rather than "
                    "stasis, so a mildly raised figure like this one fits the "
                    "picture the radiographs already showed you."
                ),
            },
            {
                "kind": DIAGNOSIS,
                "title": "Commit to a diagnosis",
                "briefing": "By 36 hours the rabbit is eating hay voluntarily and passing normal pellets.",
                "prompt": "What is your diagnosis?",
                "select_mode": SINGLE,
                "points": 25,
                "options": [
                    ("Gastrointestinal stasis secondary to dental disease and a low-fibre diet", "", True),
                    ("Small intestinal foreign body obstruction", "", False),
                    ("Mucoid enteropathy", "", False),
                    ("Primary hepatic lipidosis", "", False),
                ],
                "explanation": (
                    "Name the trigger in the diagnosis, not just the stasis. This "
                    "rabbit stopped eating because its molars hurt and its muesli "
                    "diet gave it nothing to grind — dental treatment and a hay-based "
                    "diet are the actual treatment. Discharge it on prokinetics "
                    "alone and it will be back, because the ileus was the symptom "
                    "and the mouth was the disease."
                ),
            },
        ],
    },
    # ── 6 ────────────────────────────────────────────────────────────────────
    {
        "slug": "simba-urethral-obstruction",
        "title": "Simba — 6yo DSH: repeated straining in the litter tray",
        "species": "feline",
        "discipline": "Emergency & Critical Care",
        "difficulty": "intermediate",
        "body_system": "Urinary",
        "presentation": (
            "6-year-old male neutered domestic shorthair, indoor-only and "
            "overweight. Owner has seen him in and out of the litter tray all "
            "morning, crying, producing nothing. She wonders if he is constipated."
        ),
        "completion_bonus": 30,
        "order": 6,
        "stages": [
            {
                "kind": HISTORY,
                "title": "Triage the call",
                "briefing": (
                    "On presentation: quiet, vocalising on handling. HR 120 bpm "
                    "(low for a stressed cat). Temperature 36.9°C. A firm, painful, "
                    "turgid bladder the size of a satsuma is palpable and does not "
                    "express. Perineum is licked raw."
                ),
                "prompt": "Which findings identify this as an obstruction rather than constipation?",
                "select_mode": MULTI,
                "points": 10,
                "options": [
                    ("Large, firm, non-expressible bladder", "The definitive finding", True),
                    ("Male neutered cat straining unproductively", "The classic signalment", True),
                    ("Bradycardia at 120 bpm in a stressed cat", "Suggests hyperkalaemia", True),
                    ("Overweight and indoor-only", "Risk factors, not diagnostic", False),
                    ("Licked perineum", "Non-specific sign of discomfort", False),
                ],
                "explanation": (
                    "Palpate the bladder on every straining cat before you accept "
                    "'constipation' from the phone call — the two look identical to "
                    "an owner, and one of them kills the cat within a day. Then read "
                    "that heart rate properly: 120 bpm is bradycardia for a cat in a "
                    "consulting room, and a bradycardic blocked cat is hyperkalaemic "
                    "until an ECG and a potassium say otherwise."
                ),
            },
            {
                "kind": DIAGNOSTICS,
                "title": "Stabilise and confirm",
                "briefing": "The cat is dull and cold. You have one shot at getting the order of this right.",
                "prompt": "What do you do in the first fifteen minutes?",
                "select_mode": MULTI,
                "points": 15,
                "options": [
                    ("Blood potassium and an ECG", "Hyperkalaemia is what stops the heart", True),
                    ("Intravenous access and fluid resuscitation", "Perfusion and potassium both improve", True),
                    ("Analgesia", "The obstruction is agonising", True),
                    ("Urethral catheterisation to relieve the obstruction", "The definitive treatment", True),
                    ("Send urine for culture before doing anything else", "Useful later; not now", False),
                    ("Oral potassium binder", "No role in an acute obstruction", False),
                ],
                "explanation": (
                    "Learn the ECG progression, because it tells you how much time "
                    "you have: tall tented T waves, then a flattened or absent P "
                    "wave, then a widening QRS sliding towards a sine wave and "
                    "arrest. Calcium gluconate does not lower potassium — it "
                    "protects the myocardium while dextrose, insulin and fluids do "
                    "the lowering. Culture matters, but it matters after the cat can "
                    "urinate."
                ),
            },
            {
                "kind": DIFFERENTIAL,
                "title": "Find the cause",
                "briefing": (
                    "Potassium 7.8 mmol/L with absent P waves on ECG, corrected "
                    "over four hours. Catheterisation relieved a gritty plug at the "
                    "distal urethra. Urinalysis: struvite crystals, no bacteria on "
                    "sediment, USG 1.048. Culture: no growth. Imaging shows no "
                    "cystoliths and no mass."
                ),
                "prompt": "Which conclusions do these findings support?",
                "select_mode": MULTI,
                "points": 20,
                "options": [
                    ("Urethral obstruction by a matrix-crystalline plug", "Gritty plug retrieved at the distal urethra", True),
                    ("Underlying feline idiopathic cystitis", "Sterile, no stones, no mass — the usual driver", True),
                    ("Life-threatening hyperkalaemia, now corrected", "K 7.8 with absent P waves", True),
                    ("Bacterial urinary tract infection", "Sterile sediment and no growth on culture", False),
                    ("Obstructive urolithiasis", "No cystoliths on imaging", False),
                ],
                "explanation": (
                    "Sterile urine with no stones and no mass leaves feline "
                    "idiopathic cystitis as the driver, and that reframes the whole "
                    "discharge conversation. Struvite crystals in concentrated urine "
                    "are a finding, not a diagnosis — plenty of healthy cats have "
                    "them. Bacterial UTI is genuinely uncommon in young to "
                    "middle-aged cats, so antibiotics here would treat nothing and "
                    "cost the cat its gut flora."
                ),
            },
            {
                "kind": DIAGNOSIS,
                "title": "Commit to a diagnosis",
                "briefing": "The catheter is removed at 48 hours and the cat urinates voluntarily before discharge.",
                "prompt": "What is your diagnosis?",
                "select_mode": SINGLE,
                "points": 25,
                "options": [
                    ("Urethral obstruction secondary to feline idiopathic cystitis, with hyperkalaemia", "", True),
                    ("Obstructive urolithiasis", "", False),
                    ("Bacterial cystitis with secondary obstruction", "", False),
                    ("Constipation with tenesmus", "", False),
                ],
                "explanation": (
                    "The diagnosis has to name all three parts — the obstruction, "
                    "its idiopathic driver, and the hyperkalaemia — because each "
                    "changes the aftercare. Roughly a fifth to a quarter of these "
                    "cats reobstruct, and what lowers that risk is not another "
                    "course of antibiotics: it is wet food, more water, more litter "
                    "trays, and less stress at home. That conversation at discharge "
                    "is the most valuable thing you do for this cat."
                ),
            },
        ],
    },
]
