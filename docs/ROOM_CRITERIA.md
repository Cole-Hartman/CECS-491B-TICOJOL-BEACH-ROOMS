# Room Availability Criteria

This document explains how BeachRooms determines whether a classroom is available for studying.

## Core Principle

A room is only considered **available** if:
1. The building is currently open
2. The room has at least one scheduled class today (indicating it's likely unlocked)
3. There is a gap of **30+ minutes** before the next class

## Availability Statuses

| Status | Meaning |
|--------|---------|
| **Open** | Room is free for 30+ minutes |
| **In Use** | Class currently in session |
| **Limited** | Free but less than 30 minutes until next class |
| **Closed** | Building closed, weekend, or no classes scheduled |

## Why "No Classes Today" = Closed

Rooms with no scheduled classes for the day are marked as **Closed** rather than available because:
- Classrooms without scheduled classes are typically locked
- There's no guarantee the room is accessible
- Students may waste time walking to an inaccessible room

Only rooms with at least one class that day are considered accessible, as they need to be unlocked for instructors and students.

## Time Windows

- **Minimum usable time**: 30 minutes
- Gaps shorter than 30 minutes are not shown as "available" since there isn't enough time to settle in and study
- When a room is in use, the app shows when it will next be free for 30+ minutes

## Building Hours

- **Weekdays**: Uses building-specific open/close times from the database
- **Weekends**: All buildings are considered closed
- Rooms in closed buildings are never shown as available

## Examples

| Scenario | Status | Status Text |
|----------|--------|-------------|
| Room has class at 9am, currently 8am | Open | "Free until 9:00 AM (1h)" |
| Room has class now, ends at 10am | In Use | "Free at 10:00 AM for 2h" |
| Room free but class in 15 min | Limited | "Free at 11:30 AM for 1h" |
| Room has no classes today | Closed | "No classes today" |
| Building closed for the day | Closed | "Building closed" |
| Weekend | Closed | "Closed on weekends" |
