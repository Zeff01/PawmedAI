# CBC Analyzer (Pawmed AI)

A Veterinary Professional-only tool that turns a complete blood count into a
flagged panel plus a written diagnostic brief, and optionally files the result as
a medical log against a patient profile.

---

## Table of Contents

1. What it does
2. Who can reach it
3. Where the flags come from
4. How species is resolved
5. Overriding the reference intervals
6. The save flow
7. API reference
8. Files
9. Testing
10. Seeding the demo log

---

## 1) What it does

The analyzer is a **four-step flow in a single centred column** — one screen at a
time, Next to advance. There is no second column and no step rail: an empty panel
waiting beside the form only made the page feel crowded. Orientation comes from
one line in the card header ("Step 2 of 4 · CBC panel").

| Step | What it collects | Gate to advance |
| ---- | ---------------- | --------------- |
| 1 · Patient | Species, plus name, owner, breed, age, sex, neuter status | **All of it** — see below |
| 2 · CBC panel | An uploaded printout, typed values, or both | At least one value or a file |
| 3 · Context | Sample quality flags and the blood smear note | None — the button reads "Skip" |
| 4 · Analyse | A review of all of the above, each row with Edit, then Run | — |

Running the analysis makes the **result the fifth screen**: it replaces the form
in the same column rather than appearing alongside it. From there *Back to the
form* returns to step 4 and *New analysis* clears everything. Once a result
exists the card header offers *View last result*, so stepping back to change an
input never loses it.

### Required patient fields

Step 1 requires **every** field: species, patient name, owner, breed, age, sex,
and neuter status. Validation runs on Next and again on Run, keyed by the server's
own field names so a local rejection and an API rejection render in the same
slots.

Validation is declared once, in `patientSchema.ts` (zod), and wired up through
**react-hook-form** with `zodResolver`. The fields are the shadcn `Form`
primitives — `FormField` / `FormItem` / `FormLabel` / `FormControl` /
`FormMessage` — so each message renders directly beneath the control it belongs
to. There is deliberately **no summary banner**: a validation message away from
its field makes the reader hunt for the cause.

Two details make "required" mean something here:

- **Sex and neuter status start `undefined`**, so their `Select` shows its
  placeholder and the resolver treats them as unanswered. `unknown` is a real
  answer a clinician can pick — a stray with no history — so it stays in the list,
  but it is not the default. A required field pre-satisfied by its own default is
  not required at all.
- **Breed and age carry `FormDescription` hints** rather than being dropped:
  "Mixed" is a valid breed and an estimated age is fine, so neither has to be
  exact to be answerable.

`Next` calls `form.handleSubmit`, so advancing *is* passing validation. `Run`
does the same and falls back to step 1 on failure, which covers a field emptied
during an Edit round-trip.
Because nothing is left blank, the report can no longer *fill in* patient details
— `extracted_patient_fields` comes back empty and the blue "from report"
highlighting stays dormant. The transcription still reads the patient block, and
it is still used as a **cross-check**: a report naming a different species than
the one chosen produces a warning in `notice`, as does one that reads as human.

The panel itself can be entered two ways, and they mix:

- **Upload report** — a photo or scan of the analyser printout. Gemini
  transcribes the printed values into analyte keys and converts units.
- **Type values** — the full panel as a form, straight off the analyser.

Anything typed by hand wins over the same value read off the image, on the
principle that the person holding the printout can see it and the OCR cannot.

The submitted panel is then flagged in plain Python against species-specific
reference intervals, and only afterwards handed to the model to narrate.

Step 4 keeps a fingerprint of the inputs at the moment of the last run. Editing
anything afterwards shows a staleness warning there, so a stale result is never
reachable while looking current.

## 2) Who can reach it

Everything is gated on `UserProfile.user_type == "professional"`:

- **API** — `cbc_analyzer.permissions.IsVeterinaryProfessional` on every view.
  Students, fur parents, and profiles with no type set get a `403`.
- **UI** — `ProfessionalGate` wraps all three routes and explains the
  restriction instead of surfacing a bare `403`. The routes also carry
  `beforeLoad: requireAuth`.
- **Navigation** — the CBC Analyzer and Medical Log links only appear in the
  header for professional profiles.

The UI gate is for explanation, not security. The API is the enforcement point.

## 3) Where the flags come from

**The model never decides whether a value is high or low.** Every
`low` / `normal` / `high` status comes from a lookup table in
[`server/cbc_analyzer/reference.py`](../server/cbc_analyzer/reference.py), so the
same panel always produces the same flags and any disagreement traces to one
file.

The split is deliberate:

| Decided by                    | What                                                        |
| ----------------------------- | ----------------------------------------------------------- |
| `reference.py` (pure Python)  | reference intervals, per-analyte status, overall verdict     |
| Gemini (`services/`)          | transcribing the report image, and the written narrative     |

The interpretation prompt is handed the already-flagged panel and told not to
contradict it. `evaluate_panel` also emits a pre-formatted `value_label` and
`reference_label` per analyte, so the results table, the PDF, and the CSV all
render identical numbers without re-deriving precision.

Overall `result_status` for a record:

- `normal` — nothing outside its interval
- `low` — only low flags
- `high` — only high flags
- `abnormal` — both low and high flags present

## 4) Species and its reference table

Species picks the interval table, so it has to be known before the panel can be
flagged. Step 1 requires it.

### Supported species

Thirteen species have their own validated table in `reference.py`, plus a
permissive fallback:

| Group | Species |
| ----- | ------- |
| Companion | Canine, Feline, Rabbit, Ferret, Avian (psittacine) |
| Small mammal | Guinea pig, Rat, Mouse |
| Large animal | Equine, Bovine, Ovine, Caprine, Porcine |
| Not listed | **Other** |

`other` is flagged against the **widest interval across every species in the
table** — deliberately permissive, because inventing a finding on an unsupported
species is worse than missing one. A value is flagged only when it falls outside
every species we know about. Reptiles live here: their intervals are species-,
season-, and temperature-dependent and should come from the clinic's own lab.

The tables are not interchangeable, which is the whole point. MCV 45 fL:

| Species | Verdict |
| ------- | ------- |
| Feline (39–55 fL) | normal |
| Equine (37–58 fL) | normal |
| Canine (60–77 fL) | **low** |
| Caprine (16–25 fL) | **high** |

### Not assessed

An analyte with no interval for the selected species reports as
`not_assessed` — never `normal`. Birds have **heterophils** rather than
neutrophils and **nucleated thrombocytes** rather than platelets, so the avian
table has no neutrophil, platelet, MPV, RDW, or reticulocyte rows at all. Those
values render with a grey "Not assessed" pill, are excluded from `flags`, and
never affect the overall verdict. The response carries `species_caveat`
explaining why, and the interpretation prompt is told never to call such a
parameter normal or abnormal.

This is why an avian panel with a normal haemoglobin and two unassessable rows
comes back `normal`, not `abnormal`.

### Where the species comes from

| Order | Source | How |
| ----- | ------ | --- |
| 1 | `selected` | The clinician chose it in step 1. Always wins. |
| 2 | `report` | The printout stated it, transcribed with the values. |

If neither can decide, the response is `422 {"code": "species_required"}` and the
UI returns to step 1 with the explanation beside the control.

There used to be a third tier that inferred the species from MCV and MCH. It
worked while the table held only dogs and cats — those two ranges do not
overlap — but with thirteen species an MCV of 45 fL fits feline, equine, and
bovine alike, so the inference became a coin toss dressed up as a finding. **It
was removed rather than left to mislead.**

### Cross-checks that survive

Because the clinician always supplies the species, the report's own species
becomes a check rather than a source:

- **Mismatch** — the report says canine and Feline was chosen: a warning in
  `notice`. Only `canine` and `feline` count as the report making a claim; an
  extracted `other` or a silent report is the absence of one, not a
  contradiction.
- **Human report** — human MCV (81–101 fL) and MCH (27–32 pg) sit outside every
  animal range, so `is_human_report` is set from the patient-details formatting,
  the laboratory, and the printed intervals. Not a hard block: an explicit
  species still goes through carrying a warning, because a false positive must
  never stop real veterinary work.

## 5) Overriding the reference intervals

Analysers vary, and a clinic running its own validated intervals should replace
the table rather than the flagging code. Edit the dicts in `reference.py`:

```python
CANINE_INTERVALS = {
    "hgb": (12.0, 18.0),   # (low, high) — either bound may be None
    ...
}
```

Notes:

- `None` as a bound means the analyte is only flagged in the other direction.
  Band neutrophils use `(None, 0.3)` — there is no meaningful "too few".
- `OTHER_INTERVALS` is derived as the union of every species' bounds and is
  applied to `species="other"`. It is deliberately permissive: a false
  "abnormal" on an unsupported species is worse than a miss.
- **Omitting an analyte from a species' dict is meaningful** — it makes that row
  `not_assessed` rather than judged against a borrowed range. That is how the
  avian table declines to grade neutrophils and platelets.
- Adding a species means a new key in `SPECIES_CHOICES`, its interval dict, an
  entry in `_SPECIES_TABLES`, aliases in `SPECIES_ALIASES`, and the matching
  option in the client's `SPECIES_GROUPS`. A Django migration is needed for the
  changed `choices`.
- `SPECIES_ALIASES` maps free-text species spellings ("dog", "kitten") onto a
  table.
- Adding an analyte means adding an entry to `PANEL`, all three interval dicts,
  and the matching form field in
  [`client/src/features/cbc-analyzer/constants.ts`](../client/src/features/cbc-analyzer/constants.ts).
  The client table holds labels and units only — never intervals — so it cannot
  drift out of agreement with the flags.

**Stored records keep the intervals they were flagged with.** `MedicalLog.evaluation`
is a verbatim snapshot, so changing the table does not silently rewrite history.
New writes are always re-flagged server-side, so a client cannot submit its own
`result_status`.

## 6) The save flow

Nothing is persisted until a terminal choice is made, so backing out at any
point leaves no record behind.

```
CBC result
   │
   ├─ Connect to a pet profile ──► pick a patient ──► bind ──► saved & connected
   │                                    │
   │                                    └─ no profiles yet ──► add a new patient
   │                                                           (prefilled) ─► bind
   └─ Don't connect ──► Save as a medical log ──► saved, unlinked
                    └─ Discard data ──► confirm ──► nothing written
```

No step here re-asks who the patient is: that came from step 1 of the analyzer,
so the new-patient form is simply prefilled with it. A linked profile stays the
source of truth — the server overwrites the identity from the profile on write —
so binding to an existing patient ignores what step 1 said about the name.

Download goes straight to the PDF for the same reason.

Linking a pet snapshots its profile onto the log (name, species, breed, age, sex,
neuter status, owner), so the record still reads correctly if the pet is later
renamed or deleted. Because species comes from the profile in that case, the
panel is re-flagged against the profile's species.

After the fact, only the blood smear description, clinical notes, and attending
vet are amendable. Correcting a blood value means re-running the analysis.

## 7) API reference

All routes are under `/api/cbc/` and require a professional profile.

| Method            | Path                    | Purpose                                       |
| ----------------- | ----------------------- | --------------------------------------------- |
| `POST`            | `analyze/`              | Flag a panel and write the brief              |
| `GET` / `POST`    | `pets/`                 | The clinician's own patient roster            |
| `GET`/`PATCH`/`DELETE` | `pets/<id>/`       | One patient profile                           |
| `GET` / `POST`    | `logs/`                 | List (paginated, filtered) or save a record   |
| `GET`             | `logs/summary/`         | Counts for the dashboard tiles                |
| `GET`/`PATCH`/`DELETE` | `logs/<record_id>/` | One record; `PATCH` amends notes only        |

`POST analyze/` accepts `application/json` (typed panel) or `multipart/form-data`
(with a report image). Multipart flattens everything to strings, so `values` and
`sample_quality` may arrive JSON-encoded — `JSONCompatibleField` accepts both.

Every patient field is optional on the request, `species` included — step 1
collects them but does not force them, and the server fills the gaps from the
report. What the request does carry always wins over the report.

`POST analyze/` returns `extracted_patient_fields`: the patient field names the
report supplied (as opposed to ones the request carried), so step 1 can highlight
what was transcribed and needs checking.

Log list filters: `search`, `species`, `result_status`, `days`, `pet`, `page`,
`page_size`.

Notable responses:

- `422 {"code": "not_a_cbc_report"}` — the image is not a haematology report and
  no values were typed. If values *were* typed, the run continues and the reason
  is returned in `notice` instead.
- `422 {"code": "no_values"}` — nothing readable was found.
- A failed narrative is **not** an error: the flagged panel is returned with an
  empty `diagnostic_brief`, a fallback `key_findings`, and an explanatory
  `notice`. The numbers are the clinically useful half.

Rate limit: `cbc_analyze_user` at `30/hour` in `REST_FRAMEWORK.DEFAULT_THROTTLE_RATES`.
This bounds Gemini spend on a runaway client rather than rationing clinical work.
It uses DRF's stock rate syntax — the `N/Xh` form only works with the custom
`parse_rate` in `classify_dss/throttles.py`.

## 8) Files

**Server** — `server/cbc_analyzer/`

| File                        | Role                                                  |
| --------------------------- | ----------------------------------------------------- |
| `reference.py`              | Panel definition, intervals, `evaluate_panel`         |
| `models.py`                 | `Pet`, `MedicalLog` (+ `RCBC-YYYY-MMDD-NNN` ids)      |
| `serializers.py`            | Request/response shapes, re-flagging on write         |
| `views.py`                  | Analyze, pets, logs, summary                          |
| `permissions.py`            | `IsVeterinaryProfessional`                            |
| `services/cbc_analyzer.py`  | Gemini transcription + narration                      |
| `throttles.py`              | `CBCAnalyzeThrottle`                                  |
| `management/commands/seed_medical_log.py` | Demo records for the log (§10)          |

**Client** — `client/src/features/cbc-analyzer/`

| File                    | Role                                                |
| ----------------------- | --------------------------------------------------- |
| `CbcAnalyzerView.tsx`   | The analyzer page                                   |
| `MedicalLogView.tsx`    | Records table, filters, tiles, CSV export           |
| `RecordDetailView.tsx`  | One record; amend notes, print, PDF                 |
| `constants.ts`          | Form layout — labels and units, never intervals     |
| `patientState.ts`       | `PatientDetails` + report-prefill mapping           |
| `components/SpeciesSelect.tsx` | The one patient field the analysis needs    |
| `patientSchema.ts`      | zod schemas for step 1 and the new-patient form     |
| `components/PatientStepFields.tsx` | Step 1 on the shadcn `Form` primitives |
| `components/NewPetForm.tsx` | The save flow's new-patient form, same stack   |
| `components/SaveCbcDialog.tsx` | The save decision tree                       |
| `utils/pdf.ts`          | Shared PDF for a fresh analysis or a saved record   |

Routes: `/cbc-analyzer`, `/medical-log`, `/medical-log/$recordId`.

## 9) Testing

```bash
cd server
# Point at a scratch DB so the suite never touches the Supabase Postgres.
DATABASE_URL="sqlite:///$(pwd)/.test.sqlite3" .venv/bin/python manage.py test cbc_analyzer
```

The suite covers the interval table directly (species selection, one-sided
bounds, panel ordering), the professional-only gate on every endpoint, cross-vet
isolation, re-flagging on write, record-id collision retry, and the analyze view
with Gemini mocked — including which values win when a typed panel and a
transcribed report disagree.

It also pins the demo seed (§10): that the tiles land on the mock's numbers,
that every seeded status is what `evaluate_panel` returns for that record's own
values, and that `--flush` leaves an account's non-roster patients alone. The
date-sensitive assertions run against a fixed date rather than the clock.

## 10) Seeding the demo log

The Medical Log's design mock shows a populated page — 128 records, 89 normal,
39 abnormal, 14 this month. Those tiles are all derived: `total`, `normal` and
`abnormal` count the selected date window, `this_month` counts the current
calendar month, and the percentages compare the window against the preceding
window of equal length. Reproducing the mock is therefore a distribution
problem, which is what this command solves.

```bash
cd server
python manage.py seed_medical_log --user-id 5            # seed
python manage.py seed_medical_log --user-id 5 --dry-run  # report only, writes nothing
python manage.py seed_medical_log --user-id 5 --flush    # replace an earlier seed
```

Emails are not unique in this project, so `--email` is rejected when it matches
more than one account and prints the candidate ids to choose from. `--user-id`
always resolves to one.

It writes 247 records across 8 pets: 128 dated inside the last 30 days (the view
the log opens on), and 119 in the preceding 30 days, which nothing displays
directly but the two percentage tiles read.

Every record goes through `evaluate_panel` exactly as a real save does, so a
seeded record's Low/High/Normal badge is **derived from its blood values** rather
than asserted — the command builds a panel at the species midpoints and pushes
named analytes past their bounds. If a recipe ever failed to flag (a bound of
exactly zero would swallow a "low"), the command aborts rather than seed totals
that disagree with its own plan.

Two caveats it reports for itself:

- **The normal tile reads +13%, not +12%.** With `normal` pinned at 89, +12%
  would need a baseline of 89 / 1.12 = 79.46 records. No whole number lands
  there, so 79 (+13%) is used.
- **`this_month` needs room in the month.** The mock was captured on Feb 12 —
  early enough that 14 of the 128 window records fall in the current month and
  114 do not. Run it in the first week of a month, or on the last day of a
  31-day month, and the whole window collapses inside one calendar month; the
  command warns and says what the tile will read instead.

Records outside the seed roster are never deleted, including by `--flush`, so an
account with its own patients will show totals above the mock's. The command
warns with the count.
