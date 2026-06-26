# Wiilo Database Migration Master Plan
## Overview
Migrating the Wiilo backend from MongoDB (Mongoose) to PostgreSQL (Supabase).
We are using the native `@supabase/supabase-js` client. No ORM (like Prisma) is used.

## 12-Stage Execution Plan
1. Repo Inspection & Documentation Setup (Current)
2. Supabase Client & Environment Config
3. Database Schema Creation (Supabase Dashboard)
4. Data Migration Scripting (Extract from Mongo)
5. Data Migration Execution (Load to Supabase)
6. Refactor Auth & User Controller
7. Refactor Organization & Project Controllers
8. Refactor Task & Resource Controllers
9. Refactor Invoice & Message Controllers
10. Update Middleware & Global Chat
11. Local Testing & Bug Fixing
12. Deployment & Go-Live

## Key Architectural Decisions
- **Primary Keys**: Switching from MongoDB ObjectIDs to Postgres UUIDs.
- **Multi-tenancy**: Maintaining strict `organization_id` foreign keys on all core tables.
- **Arrays**: Using native Postgres arrays (e.g., `uuid[]`) for `Project.devs`.
- **Embedded Docs**: Converting `Task.comments` to a `JSONB` column for simplicity.
