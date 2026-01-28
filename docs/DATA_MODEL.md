# BeachRooms Data Model

This document defines the complete database schema for BeachRooms. All tables live in Supabase (PostgreSQL) with Row Level Security enabled.

---

## Tables

### semesters

Defines academic terms with concrete date ranges. The app uses `start_date` and `end_date` to automatically determine which schedules are active — no hardcoded semester strings.

| Column       | Type          | Constraints                  | Description                            |
|------------- |-------------- |----------------------------- |--------------------------------------- |
| `id`         | `uuid`        | PK, default `gen_random_uuid()` | Primary key                         |
| `name`       | `text`        | NOT NULL, UNIQUE             | e.g., "Spring 2026", "Fall 2026"       |
| `start_date` | `date`        | NOT NULL                     | First day of the semester              |
| `end_date`   | `date`        | NOT NULL                     | Last day of the semester               |
| `is_active`  | `boolean`     | NOT NULL, default `false`    | Whether this is the current semester   |
| `created_at` | `timestamptz` | NOT NULL, default `now()`    |                                        |

**Constraints:**
- CHECK: `end_date > start_date`
- At most one row should have `is_active = true` at a time (enforced at application level or via trigger)

**Why this table exists:** The old schema stored semester as a free-text string on each schedule row (e.g., `"Fall 2025"`). That makes it impossible for the app to know whether a schedule is currently active without hardcoding date logic. With this table, the app queries the active semester and joins to get only the relevant schedules.

---

### buildings

Campus buildings with geolocation for map display.

| Column       | Type               | Constraints                  | Description                               |
|------------- |------------------- |----------------------------- |------------------------------------------ |
| `id`         | `uuid`             | PK, default `gen_random_uuid()` | Primary key                            |
| `name`       | `text`             | NOT NULL                     | Full name, e.g., "Engineering & Computer Science" |
| `code`       | `text`             | NOT NULL, UNIQUE             | Short code, e.g., "ECS", "LA5"            |
| `latitude`   | `double precision` | NOT NULL                     | GPS latitude                              |
| `longitude`  | `double precision` | NOT NULL                     | GPS longitude                             |
| `address`    | `text`             |                              | Street address (optional)                 |
| `image_url`  | `text`             |                              | Photo of the building exterior            |
| `created_at` | `timestamptz`      | NOT NULL, default `now()`    |                                           |

---

### building_hours

Weekly operating hours for each building. A room in a locked building is not available, regardless of whether a class is scheduled.

| Column        | Type          | Constraints                  | Description                              |
|-------------- |-------------- |----------------------------- |----------------------------------------- |
| `id`          | `uuid`        | PK, default `gen_random_uuid()` | Primary key                           |
| `building_id` | `uuid`       | NOT NULL, FK → `buildings.id` ON DELETE CASCADE | Which building           |
| `day_of_week` | `smallint`   | NOT NULL                     | 0 = Sunday, 1 = Monday, ..., 6 = Saturday |
| `open_time`   | `time`       | NOT NULL                     | Building opens                           |
| `close_time`  | `time`       | NOT NULL                     | Building closes                          |
| `is_closed`   | `boolean`    | NOT NULL, default `false`    | `true` = building is closed all day      |

**Constraints:**
- UNIQUE: `(building_id, day_of_week)`
- CHECK: `day_of_week BETWEEN 0 AND 6`
- CHECK: `is_closed = true OR close_time > open_time`

**Usage:** When computing availability, first check that the building is open at the requested time. If no row exists for a given day, assume the building is closed.

---

### classrooms

Individual rooms within buildings.

| Column          | Type          | Constraints                  | Description                                          |
|---------------- |-------------- |----------------------------- |----------------------------------------------------- |
| `id`            | `uuid`        | PK, default `gen_random_uuid()` | Primary key                                       |
| `building_id`   | `uuid`        | NOT NULL, FK → `buildings.id` ON DELETE CASCADE | Parent building                     |
| `room_number`   | `text`        | NOT NULL                     | e.g., "308", "A-205"                                 |
| `capacity`      | `integer`     | NOT NULL                     | Number of seats                                      |
| `floor`         | `integer`     |                              | Floor number (nullable for edge cases)               |
| `is_accessible` | `boolean`     | NOT NULL, default `true`     | ADA accessible                                       |
| `amenities`     | `text[]`      | NOT NULL, default `'{}'`     | e.g., `{"projector", "whiteboard", "outlets", "ac"}` |
| `image_url`     | `text`        |                              | Photo of the room interior                           |
| `created_at`    | `timestamptz` | NOT NULL, default `now()`    |                                                      |
| `updated_at`    | `timestamptz` | NOT NULL, default `now()`    | Auto-updated via trigger                             |

**Constraints:**
- UNIQUE: `(building_id, room_number)`
- CHECK: `capacity > 0`

**Standard amenity values:** `projector`, `whiteboard`, `chalkboard`, `outlets`, `ac`, `podium`, `monitors`, `lab_computers`. Use these consistently to enable filtering.

---

### class_schedules

Recurring weekly schedule entries for each classroom within a semester. A classroom is "available" when no schedule entry covers the current time slot.

| Column            | Type          | Constraints                  | Description                                   |
|------------------ |-------------- |----------------------------- |---------------------------------------------- |
| `id`              | `uuid`        | PK, default `gen_random_uuid()` | Primary key                                |
| `classroom_id`    | `uuid`        | NOT NULL, FK → `classrooms.id` ON DELETE CASCADE | Which room                     |
| `semester_id`     | `uuid`        | NOT NULL, FK → `semesters.id` ON DELETE CASCADE  | Which semester this applies to |
| `day_of_week`     | `smallint`    | NOT NULL                     | 0 = Sunday, ..., 6 = Saturday                 |
| `start_time`      | `time`        | NOT NULL                     | Class start time                               |
| `end_time`        | `time`        | NOT NULL                     | Class end time                                 |
| `course_code`     | `text`        |                              | e.g., "CECS 491B"                              |
| `course_title`    | `text`        |                              | e.g., "Senior Project II"                      |
| `instructor_name` | `text`        |                              | e.g., "Dr. Smith"                              |
| `created_at`      | `timestamptz` | NOT NULL, default `now()`    |                                                |

**Constraints:**
- CHECK: `day_of_week BETWEEN 0 AND 6`
- CHECK: `end_time > start_time`

**Notes:**
- Each row represents one recurring weekly time block (e.g., "CECS 491B, Monday 2:00–3:15 PM, Spring 2026").
- A single course that meets MWF would be 3 rows.
- `course_code`, `course_title`, and `instructor_name` are nullable because some blocks may represent reserved time without a specific course.

---

### profiles

User profile data, automatically created when a new user signs up via Supabase Auth.

| Column       | Type          | Constraints                              | Description                   |
|------------- |-------------- |----------------------------------------- |------------------------------ |
| `id`         | `uuid`        | PK, FK → `auth.users.id` ON DELETE CASCADE | Matches Supabase auth user |
| `email`      | `text`        | NOT NULL                                 | User's email                  |
| `full_name`  | `text`        |                                          | Display name                  |
| `student_id` | `text`        | UNIQUE                                   | CSULB student ID (optional)   |
| `avatar_url` | `text`        |                                          | Profile picture URL           |
| `created_at` | `timestamptz` | NOT NULL, default `now()`                |                               |
| `updated_at` | `timestamptz` | NOT NULL, default `now()`                | Auto-updated via trigger      |

**Trigger:** `on_auth_user_created` — When a new user signs up, a row is automatically inserted into `profiles` using the `handle_new_user()` function.

---

### favorites

Classrooms a user has saved for quick access. Shown on the Favorites tab.

| Column         | Type          | Constraints                  | Description      |
|--------------- |-------------- |----------------------------- |----------------- |
| `id`           | `uuid`        | PK, default `gen_random_uuid()` | Primary key   |
| `user_id`      | `uuid`        | NOT NULL, FK → `profiles.id` ON DELETE CASCADE | User  |
| `classroom_id` | `uuid`        | NOT NULL, FK → `classrooms.id` ON DELETE CASCADE | Room |
| `created_at`   | `timestamptz` | NOT NULL, default `now()`    |                  |

**Constraints:**
- UNIQUE: `(user_id, classroom_id)` — a user can only favorite a room once.

---

### reports

User-submitted feedback to keep availability data accurate. Students can flag a room as occupied when it should be free, report maintenance issues, or correct wrong information.

| Column         | Type          | Constraints                  | Description                                          |
|--------------- |-------------- |----------------------------- |----------------------------------------------------- |
| `id`           | `uuid`        | PK, default `gen_random_uuid()` | Primary key                                       |
| `user_id`      | `uuid`        | NOT NULL, FK → `profiles.id` ON DELETE CASCADE | Who submitted                      |
| `classroom_id` | `uuid`        | NOT NULL, FK → `classrooms.id` ON DELETE CASCADE | Which room                       |
| `report_type`  | `text`        | NOT NULL                     | One of: `occupied`, `maintenance`, `incorrect_info`, `other` |
| `description`  | `text`        |                              | Free-text details                                    |
| `status`       | `text`        | NOT NULL, default `'pending'` | One of: `pending`, `reviewed`, `resolved`, `dismissed` |
| `expires_at`   | `timestamptz` |                              | For time-limited reports (e.g., "occupied right now") |
| `created_at`   | `timestamptz` | NOT NULL, default `now()`    |                                                      |

**Notes:**
- `expires_at` handles transient reports. An "occupied" report is only relevant for a short window. The app should ignore expired reports.
- `status` enables a moderation workflow: reports start as `pending`, and can be triaged later.

---

### blackout_dates

Days when normal class schedules do not apply — holidays, campus closures, finals, spring break, etc. On these dates, either the whole campus is closed or a specific building is closed.

| Column        | Type          | Constraints                  | Description                                       |
|-------------- |-------------- |----------------------------- |-------------------------------------------------- |
| `id`          | `uuid`        | PK, default `gen_random_uuid()` | Primary key                                    |
| `date`        | `date`        | NOT NULL                     | The specific date                                  |
| `description` | `text`        |                              | e.g., "Martin Luther King Jr. Day", "Spring Break" |
| `building_id` | `uuid`        | FK → `buildings.id` ON DELETE CASCADE | If NULL, applies campus-wide. If set, only that building. |
| `created_at`  | `timestamptz` | NOT NULL, default `now()`    |                                                    |

**Constraints:**
- UNIQUE: `(date, building_id)` — prevents duplicate entries. For campus-wide blackouts where `building_id` is NULL, use a partial unique index on `date WHERE building_id IS NULL`.

**Usage:** Before computing availability for a given date, check if that date is blacked out (campus-wide or for the specific building). If it is, treat all rooms in the affected building(s) as available (no classes running) but respect `building_hours` for whether the building is physically open.

---

## Row Level Security Policies

All tables have RLS enabled. Policies:

| Table              | SELECT                     | INSERT                 | UPDATE             | DELETE             |
|------------------- |--------------------------- |----------------------- |------------------- |------------------- |
| `semesters`        | Anyone (public)            | —                      | —                  | —                  |
| `buildings`        | Anyone (public)            | —                      | —                  | —                  |
| `building_hours`   | Anyone (public)            | —                      | —                  | —                  |
| `classrooms`       | Anyone (public)            | —                      | —                  | —                  |
| `class_schedules`  | Anyone (public)            | —                      | —                  | —                  |
| `blackout_dates`   | Anyone (public)            | —                      | —                  | —                  |
| `profiles`         | Anyone (public)            | — (auto via trigger)   | Own row only       | —                  |
| `favorites`        | Own rows only              | Own rows only          | —                  | Own rows only      |
| `reports`          | Authenticated users        | Own rows only          | —                  | —                  |

Reference data (buildings, classrooms, schedules, semesters, building hours, blackout dates) is read-only for all users and managed via admin/service role or migrations.

