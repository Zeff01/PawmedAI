# The case library

One JSON file per case. To add a case:

1. Copy `_template.json` to `NN-slug.json` (the number is just for reading the
   directory in order — the real ordering is each case's `order` field).
2. Fill it in.
3. `python manage.py seed_cases --check` — validates every file, writes nothing.
4. `python manage.py seed_cases` — loads them into the database.

Files beginning with `_` are ignored, which is why `_template.json` is never
seeded. A file may hold a single case object or a list of case objects.

Re-seeding matches a case on its `slug`, so text edits land on the existing case
and student attempts survive. **Stages are rebuilt on every run**, so editing a
stage clears answers already recorded against that case — worth saying out loud
before running this against a live database. `--prune` additionally deletes
cases that no longer have a file.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `slug` | yes | ≤80 chars, unique, no spaces. Appears in the URL. |
| `title` | yes | ≤200 chars |
| `species` | yes | A clinical adjective — see [Species](#species) below |
| `discipline` | yes | ≤120 chars, e.g. `Emergency & Critical Care` |
| `difficulty` | yes | `beginner`, `intermediate` or `advanced` |
| `body_system` | yes | ≤120 chars |
| `presentation` | yes | The signalment shown on the case card |
| `completion_bonus` | no | Default 25. Awarded once, for a clean run |
| `order` | no | Default 0. Position in the library |
| `is_published` | no | Default `true`. `false` hides the case from students |
| `stages` | yes | At least one, in the order the student works them |

Each stage:

| Field | Required | Notes |
| --- | --- | --- |
| `kind` | yes | `history`, `diagnostics`, `differential` or `diagnosis` |
| `title` | yes | ≤160 chars |
| `briefing` | no | Clinical detail released at this stage, shown above the question |
| `prompt` | yes | ≤300 chars — the question itself |
| `select_mode` | no | Default `single`; use `multi` for several correct answers |
| `points` | yes | What the stage is worth. The library uses 10 / 15 / 20 / 25 |
| `explanation` | yes | The teaching point, shown once answered |
| `options` | yes | At least two |

Each option: `label` (≤240 chars), optional `detail` (≤300 chars, the one-line
note under the label), and `correct` (default `false`). At least one option must
be correct; a `single` stage may have only one.

## Species

Tag a case with the most specific term that fits. Several nest — a parrot is
`psittacine` and also `avian`, a guinea pig is `caviine` and also a rodent — and
`avian`, `reptilian`, `rodent`, `wildlife` and `exotic` exist for when nothing
more specific does. `python manage.py seed_cases --species` prints this list.

| Group | Terms |
| --- | --- |
| Companion animals | `canine` (dog), `feline` (cat), `lapine` (rabbit), `musteline` (ferret), `caviine` (guinea pig), `murine` (rat, mouse), `rodent` (hamster, gerbil, chinchilla) |
| Equine, farm & production | `equine` (horse), `asinine` (donkey, mule), `bovine` (cattle), `ovine` (sheep), `caprine` (goat), `porcine` (pig), `camelid` (llama, alpaca), `cervine` (deer) |
| Birds | `avian` (unspecified), `psittacine` (parrot, budgie, cockatiel), `passerine` (canary, finch), `galliform` (chicken, turkey), `anseriform` (duck, goose), `columbine` (pigeon, dove), `raptor` (hawk, falcon, owl) |
| Reptiles & amphibians | `reptilian` (unspecified), `chelonian` (tortoise, turtle), `ophidian` (snake), `saurian` (lizard, gecko), `crocodilian` (crocodile, alligator), `amphibian` (frog, salamander, axolotl) |
| Aquatic | `piscine` (fish), `cetacean` (whale, dolphin), `pinniped` (seal, sea lion) |
| Other | `primate` (non-human), `marsupial` (kangaroo, wombat, possum), `apian` (honeybee), `wildlife` (unspecified), `exotic` (unspecified) |

Each species has a photograph for the case card under
`client/public/images/species/`, credited in the `CREDITS.md` beside them. A new
species needs three things: a term in `Case.Species` (`academy/models.py`) with
a migration, an entry in `SPECIES_META` (`client/src/features/student/caseMeta.ts`),
and a photograph.

## How a stage scores

Worth knowing when you set `select_mode` and `points`:

- **Full marks** for a right answer first time, **half** (rounded up) for a
  right answer on any later try.
- **`multi` stages give partial credit.** Each right pick earns its share of
  the stage and each wrong pick cancels one right pick out, so three of four
  findings is worth 3/4 of the marks, and three of four plus one wrong pick is
  worth 2/4. Ticking every box therefore scores badly rather than perfectly.
- A stage **keeps whatever its best attempt was worth** — trying again can only
  add points, never remove them.
- After three wrong tries the answer is shown. That clears the stage so the
  case can continue, costs the clean-run bonus, and keeps any partial credit
  already earned.
- The **completion bonus** needs every stage answered correctly without being
  shown the answer. Partial credit does not earn it.

The rules live in [`academy/scoring.py`](../scoring.py).

## House style

The library holds 42 cases: the original six, plus one laboratory-driven case
for each of the 36 species terms, whose diagnostics and differential stages turn
on real laboratory findings — haematology, biochemistry, cytology, culture and
sensitivity, PCR, faecal work, water chemistry, blood lead, hive tests. Each
carries the species' clinical adjective, so every species tab in the student
dashboard is populated.

The cases are written to be *discriminable*: every distractor is a
diagnosis a reasonable student would consider, and each explanation names the
finding that rules it out. A case whose wrong answers are obviously wrong
teaches nothing. Points rise with the reasoning a stage takes — 10 / 15 / 20 /
25 — and a 30-point completion bonus makes a case worth 100.
