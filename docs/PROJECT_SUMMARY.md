# BeachRooms - Project Summary

## What Is BeachRooms?

BeachRooms is a student-built mobile application designed to help CSULB students find empty classrooms to use as study spaces. The app surfaces real-time classroom availability data so students can quickly locate a quiet room on campus, open the app, and walk straight to an unused classroom — no guessing, no wandering halls, no competing for a seat in the library.

The project is being developed as a CECS 491B capstone project by the Ticojol team.

## The Problem

CSULB is facing a study-space shortage driven by two converging factors:

1. **Record-high enrollment.** The student population has grown significantly, putting pressure on every shared resource on campus — libraries, lounges, and common areas are consistently overcrowded.
2. **Ongoing campus construction.** Building projects have taken traditional study spaces offline, further reducing the number of places students can sit down and work.

At the same time, dozens of classrooms sit empty throughout the day between scheduled classes. These rooms have desks, power outlets, whiteboards, and quiet environments — everything a student needs to study — but there is no easy way for students to know which rooms are available or when.

## The Goal

BeachRooms aims to close that gap by:

- **Making empty classrooms discoverable.** Students can see which rooms are free right now or at a specific time, filtered by building, floor, capacity, and amenities.
- **Reducing overcrowding in existing study areas.** By distributing students across available classrooms, the app lessens the load on the library and other popular spots.
- **Putting underused campus resources to work.** Classrooms that would otherwise sit empty become productive study spaces without any additional cost to the university.
- **Delivering a mobile-first experience.** Students are on the move between classes. The app is built for quick lookups on a phone — search, find a room, and go.

The long-term vision is to improve student productivity through a seamless mobile experience, with the potential to expand to other CSU campuses in the future.

## Market Context and Competition

Most existing classroom-availability tools are university-specific side projects, and nearly all of them are web-based rather than native mobile apps. Notable examples include:

- **UCSD Classroom Scheduler** — Shows free classrooms by building and time with map and list views. Well-received by UCSD students but limited to that campus.
- **RoomSeekr** (roomseekr.com) — A general-purpose room finder.
- **GT Scheduler** (gt-scheduler.org) — Georgia Tech schedule planning tool.
- **UCSD Classrooms** (sheeptester.github.io/ucsd-classrooms) — Another UCSD-focused tool.

None of these serve CSULB, and none prioritize a native mobile experience. BeachRooms fills that gap by being CSULB-specific, mobile-first, and designed around student study needs with a simple, intuitive interface.

## How It Works

### App Structure

The app has three bottom tabs:

1. **Home** — The main room catalog
2. **Favorites** — Saved rooms for quick access
3. **Map** — A full campus map view of all buildings and available rooms

### Tab 1: Home (Room Catalog)

The home screen is the primary experience. It presents a clean, aesthetically pleasing catalog of currently available classrooms. The design should feel modern and easy to scan — students should be able to open the app and find a room within seconds.

Key elements:
- **Search bar** at the top for filtering by building name, room number, or amenity.
- **Filter controls** for narrowing results by building, capacity, floor, amenities (projector, whiteboard, outlets), and accessibility.
- **Room cards** displayed in a scrollable list. Each card shows:
  - Building code and room number (e.g., "ECS 308")
  - Current availability status (available now, available soon, or occupied)
  - How long the room is available for (e.g., "Free for 2h 15m")
  - Capacity (e.g., "Seats 40")
  - Key amenities as small icons or tags
- Cards should be visually distinct based on availability — available rooms are immediately obvious, occupied rooms are dimmed or secondary.

### Room Detail Screen

Tapping a room card opens a detailed room view. This screen gives the student everything they need to decide whether to go to that room.

Contents:
- **Room header** — Building name, room number, floor, and accessibility status.
- **Availability schedule** — A clear timeline or list showing when the room is free and when it is occupied for the current day. Each time block shows the course code if a class is scheduled (e.g., "CECS 491B — 2:00 PM to 3:15 PM"). Open slots are highlighted. The student should be able to swipe or tap to view other days of the week.
- **Amenities list** — Full list of room amenities (projector, whiteboard, outlets, A/C, etc.).
- **Capacity** — Number of seats.
- **Map preview** — An embedded, compact map view showing the building's location on campus. Tapping the map preview expands it to a full-screen interactive map centered on that building, so the student can get directions or see nearby buildings.
- **Favorite button** — Toggle to save or unsave the room.
- **Report button** — Allows the student to flag the room (e.g., "room is actually occupied", "maintenance issue") to help keep data accurate.

### Tab 2: Favorites

A dedicated screen for rooms the student has saved. The layout mirrors the home catalog (same room card design) but only shows favorited rooms. This lets students quickly check availability for the rooms they use most without searching each time.

### Tab 3: Map

A full campus map view showing all buildings. Buildings with available rooms are visually emphasized (e.g., highlighted pins or markers with a count of available rooms). Tapping a building marker shows a summary of its available rooms, and tapping a specific room navigates to the room detail screen.

### Data Model

Availability is determined by comparing the current time against class schedules stored in PostgreSQL (hosted on Supabase):

- **Buildings** — Campus buildings identified by name and a short code (e.g., "LIB", "ENGR"), with latitude/longitude for map display.
- **Classrooms** — Individual rooms within buildings, including capacity, floor, accessibility status, and amenities (projector, whiteboard, outlets, etc.).
- **Class Schedules** — The weekly schedule for each classroom, broken down by day of week, start/end times, semester, and course code. A room is considered "available" when no class is scheduled in the current time slot.
- **Favorites** — Students can save classrooms they use frequently. Stored per-user.
- **Reports** — A feedback mechanism where students can flag rooms as unexpectedly occupied or under maintenance, helping keep availability data accurate.

### Authentication and Security

Students authenticate with their email. The app uses Row Level Security at the database level to ensure users can only modify their own data (favorites, reports) while classroom and building data remains publicly readable.

## Technical Approach

- **Frontend:** Expo (React Native) with TypeScript in strict mode, targeting iOS, Android, and web. File-based routing via Expo Router provides type-safe navigation. The React Compiler and React Native New Architecture are both enabled for performance.
- **Backend:** Supabase provides PostgreSQL, authentication, auto-generated REST APIs, real-time subscriptions, and storage — all managed as a Backend-as-a-Service so the team can focus on the mobile experience rather than server infrastructure.
- **Deployment:** Expo EAS handles mobile builds and distribution. Supabase runs on cloud hosting.

## Development Roadmap

The project is organized into four phases:

**Phase 1 — Foundation (Complete)**
Expo project setup, Supabase configuration, database schema creation, and basic authentication scaffolding.

**Phase 2 — Core Features (Current)**
Room listing and search connected to real backend data, map view integration with building locations, availability calculation logic, and favorites functionality.

**Phase 3 — Enhancement**
Real-time updates so availability reflects changes as they happen, user-submitted reports for crowdsourced accuracy, advanced filtering (by amenities, capacity, accessibility), and performance optimization.

**Phase 4 — Polish**
UI/UX refinements, comprehensive testing, app store submission, and final documentation.

## Data Sources

Classroom and schedule data will be sourced through a combination of:

- Web scraping of university schedule systems (with appropriate permissions)
- Manual entry for the initial dataset
- User contributions via the reports feature to keep data current

## Project Links

- [Project EPIC](https://github.com/Cole-Hartman/CECS-491B-TICOJOL-BEACH-ROOMS/issues/2)
