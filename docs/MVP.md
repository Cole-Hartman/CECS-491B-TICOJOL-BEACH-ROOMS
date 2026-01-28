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
