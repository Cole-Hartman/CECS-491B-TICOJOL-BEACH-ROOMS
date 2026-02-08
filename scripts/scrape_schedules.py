"""
Scrape CSULB class schedule pages and populate the Supabase database
with buildings, classrooms, and class schedules.

Usage:
    python scrape_schedules.py                # Insert into database
    python scrape_schedules.py --dry-run      # Parse only, no DB writes
"""

import argparse
import os
import re
import sys
import time
from datetime import time as dt_time

import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

BASE_URL = "https://web.csulb.edu/depts/enrollment/registration/class_schedule/Spring_2026/By_Subject/"
SEMESTER = "Spring 2026"
BATCH_SIZE = 200
REQUEST_DELAY = 1.0  # seconds between page fetches
DEFAULT_CAPACITY = 30  # schedule pages don't include room capacity

# Locations to skip — not real buildings/classrooms
SKIP_LOCATIONS = {"ONLINE-ONLY", "OFF-CAMP", "TBA", "NA", ""}

# Outdoor/athletic venues — not useful as study spaces
SKIP_BUILDING_CODES = {"CTS", "FLD", "RNG", "SWM"}

# Day abbreviation -> day_of_week integer (0=Sunday, 6=Saturday)
DAY_MAP = {
    "Su": 0,
    "M": 1,
    "Tu": 2,
    "W": 3,
    "Th": 4,
    "F": 5,
    "Sa": 6,
}


def parse_days(day_str: str) -> list[int]:
    """Parse day string into list of day_of_week integers.

    Examples:
        "MWF"  -> [1, 3, 5]
        "TuTh" -> [2, 4]
        "Sa"   -> [6]
    """
    days = []
    i = 0
    while i < len(day_str):
        # Try two-character match first (Tu, Th, Sa, Su)
        if i + 1 < len(day_str) and day_str[i : i + 2] in DAY_MAP:
            days.append(DAY_MAP[day_str[i : i + 2]])
            i += 2
        elif day_str[i] in DAY_MAP:
            days.append(DAY_MAP[day_str[i]])
            i += 1
        else:
            raise ValueError(f"Unknown day character at position {i} in '{day_str}'")
    return days


def parse_time_range(time_str: str) -> tuple[dt_time, dt_time]:
    """Parse a time range string into (start_time, end_time).

    The AM/PM suffix applies to the end time. The start time's period is
    inferred: assume same period as end, then correct if start >= end.

    Examples:
        "9-11:45AM"    -> (09:00, 11:45)
        "2:30-3:45PM"  -> (14:30, 15:45)
        "11-12:50PM"   -> (11:00, 12:50)
        "7-9:45PM"     -> (19:00, 21:45)
    """
    match = re.match(
        r"(\d{1,2})(?::(\d{2}))?-(\d{1,2})(?::(\d{2}))?(AM|PM)", time_str.strip()
    )
    if not match:
        raise ValueError(f"Cannot parse time: '{time_str}'")

    start_h = int(match.group(1))
    start_m = int(match.group(2) or 0)
    end_h = int(match.group(3))
    end_m = int(match.group(4) or 0)
    period = match.group(5)

    # Convert end time to 24h
    if period == "PM" and end_h != 12:
        end_h += 12
    elif period == "AM" and end_h == 12:
        end_h = 0

    # Assume start has same period, convert to 24h
    if period == "PM" and start_h != 12:
        start_h += 12
    elif period == "AM" and start_h == 12:
        start_h = 0

    # If that makes start >= end, start was actually AM (subtract 12)
    if start_h > end_h or (start_h == end_h and start_m >= end_m):
        start_h -= 12

    return dt_time(start_h, start_m), dt_time(end_h, end_m)


def extract_floor(room_number: str) -> int | None:
    """Infer floor number from room number. '413' -> 4, '051' -> 0."""
    digits = re.search(r"(\d+)", room_number)
    if not digits:
        return None
    num = int(digits.group(1))
    if num < 100:
        return 0
    return num // 100


def get_subject_urls() -> list[str]:
    """Parse the main schedule page and grab all of the subject URLs"""
    resp = requests.get(BASE_URL + "index.html")
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    urls = []
    seen = set()
    for a in soup.find_all("a", href=True):
        href = a["href"]
        # Only include subject pages (e.g., CECS.html), skip index and non-subject links
        if (
            href.endswith(".html")
            and href != "index.html"
            and "/" not in href  # Exclude paths like ../By_College/index.html
            and href not in seen
        ):
            seen.add(href)
            urls.append(BASE_URL + href)
    return urls


def parse_subject_page(html: str) -> list[dict]:
    """Parse an individual subject page and return a list of dicts.
    Each dict contains:
    - course_code: "CECS 491"
    - course_title: "Senior Design Project"
    - days: "MWF"
    - time: "2:30-3:45PM"
    - location: "ECS-413"
    - instructor: "Dr. Smith"
    """
    soup = BeautifulSoup(html, "html.parser") # take the html and convert it to a tree structure that we can navigate and search
    sections = []

    for course_block in soup.find_all("div", class_="courseBlock"):
        h4 = course_block.find("h4")
        if not h4:
            continue

        code_span = h4.find("span", class_="courseCode")
        title_span = h4.find("span", class_="courseTitle")
        course_code = code_span.get_text(strip=True) if code_span else ""
        course_title = title_span.get_text(strip=True) if title_span else ""

        # A course can have multiple tables (one per group)
        for table in course_block.find_all("table", class_="sectionTable"):
            for row in table.find_all("tr"):
                cells = row.find_all(["td", "th"])

                # Skip header rows (all <th scope="col">)
                if cells and cells[0].get("scope") == "col":
                    continue

                # Data rows have 12 cells: 1 th(scope=row) + 11 td
                if len(cells) < 12:
                    continue

                days_text = cells[6].get_text(strip=True)
                time_text = cells[7].get_text(strip=True)
                location = cells[9].get_text(strip=True)
                instructor = cells[10].get_text(strip=True)

                sections.append(
                    {
                        "course_code": course_code,
                        "course_title": course_title,
                        "days": days_text,
                        "time": time_text,
                        "location": location,
                        "instructor": instructor,
                    }
                )
    return sections


def process_sections(supabase_client, sections: list[dict], dry_run: bool = False) -> tuple[int, int]:
    """
    LAST STEP: Process the parsed sections and insert them into the database.

    Returns (inserted_count, skipped_count).
    """
    buildings_cache: dict[str, str] = {}  # code -> uuid
    classrooms_cache: dict[tuple[str, str], str] = {}  # (code, room) -> uuid
    schedule_batch: list[dict] = []
    inserted_count = 0
    skipped_count = 0

    for section in sections:
        location = section["location"]
        days_str = section["days"]
        time_str = section["time"]

        # Skip non-physical locations
        if location.upper() in SKIP_LOCATIONS or not location.strip():
            skipped_count += 1
            continue

        # Skip rows with no schedule (NA, TBA, empty)
        if days_str in ("NA", "TBA", "") or time_str in ("NA", "TBA", ""):
            skipped_count += 1
            continue

        # Parse location: "ECS-413" -> ("ECS", "413")
        if "-" not in location:
            print(f"  WARN: unusual location format: {location}")
            skipped_count += 1
            continue

        building_code, room_number = location.split("-", 1)

        # Skip outdoor/athletic venues
        if building_code in SKIP_BUILDING_CODES:
            skipped_count += 1
            continue

        if dry_run:
            # Still validate parsing works
            try:
                parse_days(days_str)
                parse_time_range(time_str)
            except ValueError as e:
                print(f"  WARN: parse error: {e} (section: {section})")
                skipped_count += 1
                continue

            # Count what would be inserted
            day_count = len(parse_days(days_str))
            inserted_count += day_count
            # Track buildings/classrooms for stats
            buildings_cache[building_code] = "dry-run"
            classrooms_cache[(building_code, room_number)] = "dry-run"
            continue

        # --- Database writes below ---

        # Upsert building (only code - name/coords added manually in Supabase)
        if building_code not in buildings_cache:
            result = (
                supabase_client.table("buildings")
                .upsert(
                    {"code": building_code},
                    on_conflict="code",
                )
                .execute()
            )
            buildings_cache[building_code] = result.data[0]["id"]

        building_id = buildings_cache[building_code]

        # Upsert classroom
        cache_key = (building_code, room_number)
        if cache_key not in classrooms_cache:
            floor_num = extract_floor(room_number)
            result = (
                supabase_client.table("classrooms")
                .upsert(
                    {
                        "building_id": building_id,
                        "room_number": room_number,
                        "capacity": DEFAULT_CAPACITY,
                        "floor": floor_num,
                    },
                    on_conflict="building_id,room_number",
                )
                .execute()
            )
            classrooms_cache[cache_key] = result.data[0]["id"]

        classroom_id = classrooms_cache[cache_key]

        # Parse days and time
        try:
            day_indices = parse_days(days_str)
            start_time, end_time = parse_time_range(time_str)
        except ValueError as e:
            print(f"  WARN: parse error: {e} (section: {section})")
            skipped_count += 1
            continue

        # Add schedule rows to batch (one per day)
        for day in day_indices:
            schedule_batch.append(
                {
                    "classroom_id": classroom_id,
                    "semester": SEMESTER,
                    "day_of_week": day,
                    "start_time": start_time.isoformat(),
                    "end_time": end_time.isoformat(),
                    "course_code": section["course_code"],
                    "course_title": section["course_title"],
                    "instructor_name": section["instructor"],
                }
            )
            inserted_count += 1

        # Flush batch when it's full
        if len(schedule_batch) >= BATCH_SIZE:
            supabase_client.table("class_schedules").insert(schedule_batch).execute()
            schedule_batch = []

    # Flush remaining batch
    if schedule_batch and not dry_run:
        supabase_client.table("class_schedules").insert(schedule_batch).execute()

    return inserted_count, skipped_count


def calculate_building_hours(supabase_client):
    """
    Calculate and update building hours based on class schedules.
    Assumes building opens at the first class and closes at the last class.
    Only calculates weekday hours (weekends assumed closed).
    """

    print("\nCalculating building hours from class schedules...")

    # Get all classrooms with their building_id
    classrooms = supabase_client.table("classrooms").select("id, building_id").limit(10000).execute()
    classroom_to_building = {c["id"]: c["building_id"] for c in classrooms.data}
    print(f"  Found {len(classrooms.data)} classrooms")

    # Get all schedules using pagination (Supabase has 1000 row max per request)
    all_schedules = []
    page_size = 1000
    offset = 0
    while True:
        batch = supabase_client.table("class_schedules").select("*").range(offset, offset + page_size - 1).execute()
        all_schedules.extend(batch.data)
        if len(batch.data) < page_size:
            break
        offset += page_size
    print(f"  Found {len(all_schedules)} schedules")

    # Group weekday schedules by building (days 1-5 are Mon-Fri)
    building_hours = {}  # {building_id: {min, max}}

    for schedule in all_schedules:
        building_id = classroom_to_building.get(schedule["classroom_id"])
        if not building_id:
            continue

        day = schedule["day_of_week"]
        # Skip weekends (0=Sunday, 6=Saturday)
        if day == 0 or day == 6:
            continue

        if building_id not in building_hours:
            building_hours[building_id] = {"min": None, "max": None}

        start = schedule["start_time"]
        end = schedule["end_time"]

        hours = building_hours[building_id]
        if hours["min"] is None or start < hours["min"]:
            hours["min"] = start
        if hours["max"] is None or end > hours["max"]:
            hours["max"] = end

    # Update buildings table
    updated_count = 0
    for building_id, hours in building_hours.items():
        if hours["min"]:
            update_data = {
                "weekday_open": hours["min"],
                "weekday_close": hours["max"],
            }
            supabase_client.table("buildings").update(update_data).eq("id", building_id).execute()
            updated_count += 1

    print(f"  Updated hours for {updated_count} buildings")


def main():
    parser = argparse.ArgumentParser(description="Scrape CSULB class schedules")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Parse pages and print stats without writing to the database",
    )
    args = parser.parse_args()

    # Load env and connect to Supabase (unless dry run)
    supabase_client = None
    if not args.dry_run:
        load_dotenv()
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
        if not url or not key:
            print("ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
            sys.exit(1)

        from supabase import create_client

        supabase_client = create_client(url, key)

        # Clear all existing schedules
        print(f"Clearing all existing schedules...")
        supabase_client.table("class_schedules").delete().gte("created_at", "1970-01-01").execute()

    # Fetch all subject URLs from base URL (SEM_2025/By_Subject)
    print("Fetching subject index...")
    subject_urls = get_subject_urls()
    print(f"Found {len(subject_urls)} subject pages\n")

    # Scrape each subject page
    all_sections: list[dict] = []
    for i, url in enumerate(subject_urls):
        subject = url.split("/")[-1].replace(".html", "")
        print(f"  [{i + 1}/{len(subject_urls)}] {subject}...", end=" ", flush=True)
        try:
            resp = requests.get(url)
            resp.raise_for_status()
            sections = parse_subject_page(resp.text)
            all_sections.extend(sections)
            print(f"{len(sections)} sections")
        except Exception as e:
            print(f"ERROR: {e}")
        time.sleep(REQUEST_DELAY)

    print(f"\nParsed {len(all_sections)} total sections")

    mode = "DRY RUN" if args.dry_run else "Inserting"
    print(f"\n{mode}...")

    # Process the parsed sections and insert them into supabase
    inserted, skipped = process_sections(
        supabase_client, all_sections, dry_run=args.dry_run
    )

    print(f"\nDone!")
    print(f"  Schedule rows {'would insert' if args.dry_run else 'inserted'}: {inserted}")
    print(f"  Sections skipped (online/TBA/unknown): {skipped}")

    # Calculate and update building hours from inserted schedules
    if not args.dry_run:
        calculate_building_hours(supabase_client)


main()
