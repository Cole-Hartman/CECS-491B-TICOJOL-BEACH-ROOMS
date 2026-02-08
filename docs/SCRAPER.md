# Schedule Scraper

The scraper (`scripts/scrape_schedules.py`) populates the Supabase database with CSULB class schedule data.

## What It Does

1. **Fetches class schedules** from CSULB's public schedule pages
2. **Populates database tables**: `buildings`, `classrooms`, `class_schedules`
3. **Calculates building hours** based on when classes are scheduled

## Data Source

- URL: `https://web.csulb.edu/depts/enrollment/registration/class_schedule/Spring_2026/By_Subject/`
- Parses all subject pages (CECS, MATH, BIOL, etc.)
- Extracts: course code, title, days, time, location, instructor

## How to Run

```bash
cd scripts

# Dry run (parse only, no database writes)
python scrape_schedules.py --dry-run

# Full run (writes to Supabase)
python scrape_schedules.py
```

Requires `.env` file with:
```
SUPABASE_URL=<your-url>
SUPABASE_SERVICE_ROLE_KEY=<your-key>
```

## Process Flow

```
1. Clear existing class_schedules
         ↓
2. Fetch subject index page → get all subject URLs (128 subjects)
         ↓
3. For each subject page:
   - Parse HTML for course sections
   - Extract location (e.g., "ECS-413")
   - Skip online/TBA/invalid locations
         ↓
4. For each valid section:
   - Upsert building (by code)
   - Upsert classroom (by building + room number)
   - Insert schedule rows (one per day)
         ↓
5. Calculate building hours:
   - Query all schedules
   - Find earliest start / latest end per building (weekdays only)
   - Update buildings.weekday_open and weekday_close
```

## What Gets Skipped

- Online classes (`ONLINE-ONLY`)
- Off-campus locations (`OFF-CAMP`)
- TBA times/locations
- Outdoor/athletic venues (`CTS`, `FLD`, `RNG`, `SWM`)
- Weekend schedules (for building hours calculation)

## Database Impact

| Table | Action |
|-------|--------|
| `class_schedules` | Cleared and repopulated each run |
| `buildings` | Upserted (created if new, hours updated) |
| `classrooms` | Upserted (created if new) |

## Output Example

```
Found 128 subject pages
Parsed 9652 total sections
Schedule rows inserted: 9172
Sections skipped: 3435

Calculating building hours from class schedules...
  Found 505 classrooms
  Found 9172 schedules
  Updated hours for 52 buildings
```

## Notes

- Buildings/classrooms persist between runs; only schedules are cleared
- Building hours = earliest class start to latest class end (weekdays only)
- Weekends are assumed closed (no saturday/sunday hours stored)
- Update `SEMESTER` and `BASE_URL` constants when scraping a new term
