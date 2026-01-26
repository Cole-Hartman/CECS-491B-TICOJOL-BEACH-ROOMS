# BeachRooms Infrastructure Plan

## Architecture Overview

BeachRooms will use a **BaaS (Backend-as-a-Service)** architecture with:
- **Frontend**: Expo (React Native) mobile app
- **Backend**: Supabase (PostgreSQL database + Auth + Real-time + Storage)
- **Deployment**: Expo EAS for mobile, Supabase cloud hosting

## Technology Stack

### Frontend
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **UI**: React Native Paper or NativeBase
- **Maps**: React Native Maps or Expo Location

### Backend (Supabase)
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth (email/password + OAuth)
- **API**: Auto-generated REST API + PostgREST
- **Real-time**: Supabase Realtime subscriptions
- **Storage**: Supabase Storage (for images if needed)
- **Security**: Row Level Security (RLS) policies

## Database Schema

### Core Tables

**users** (extends Supabase auth.users)
- Managed by Supabase Auth
- Additional profile data in `profiles` table

**profiles**
- `id` (UUID, FK to auth.users)
- `email` (text)
- `full_name` (text, nullable)
- `student_id` (text, nullable, unique)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**buildings**
- `id` (UUID, primary key)
- `name` (text) - e.g., "Library", "Engineering"
- `code` (text, unique) - e.g., "LIB", "ENGR"
- `latitude` (double precision)
- `longitude` (double precision)
- `address` (text, nullable)
- `created_at` (timestamp)

**classrooms**
- `id` (UUID, primary key)
- `building_id` (UUID, FK to buildings)
- `room_number` (text) - e.g., "101", "A-205"
- `capacity` (integer)
- `amenities` (text[]) - e.g., ["projector", "whiteboard", "outlets"]
- `floor` (integer, nullable)
- `is_accessible` (boolean, default true)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**class_schedules** (for determining availability)
- `id` (UUID, primary key)
- `classroom_id` (UUID, FK to classrooms)
- `day_of_week` (integer, 0-6, Sunday=0)
- `start_time` (time)
- `end_time` (time)
- `semester` (text) - e.g., "Fall 2025"
- `course_code` (text, nullable)
- `created_at` (timestamp)

**favorites**
- `id` (UUID, primary key)
- `user_id` (UUID, FK to profiles)
- `classroom_id` (UUID, FK to classrooms)
- `created_at` (timestamp)
- Unique constraint on (user_id, classroom_id)

**reports** (optional - for user feedback)
- `id` (UUID, primary key)
- `user_id` (UUID, FK to profiles)
- `classroom_id` (UUID, FK to classrooms)
- `report_type` (text) - e.g., "occupied", "maintenance"
- `description` (text, nullable)
- `created_at` (timestamp)

## Data Sources

### Classroom Data
- Web scraping (if needed, with permission)
- Manual entry for initial launch
- User contributions (reports feature)
