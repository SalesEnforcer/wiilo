# Wiilo Schema Mapping: Mongoose to Supabase (Postgres)

## 1. organizations
- id (uuid, primary key)
- name (text, required)
- logo_url (text)
- created_at (timestamp)

## 2. users
- id (uuid, primary key)
- name (text, required)
- email (text, unique, required)
- role (text, default: 'dev') # superadmin, dev, client
- password (text, required)
- organization_id (uuid, foreign key -> organizations)
- created_at (timestamp)

## 3. projects
- id (uuid, primary key)
- name (text, required)
- description (text)
- status (text, default: 'active') # active, completed, archived
- budget (numeric, required)
- organization_id (uuid, foreign key -> organizations)
- client_id (uuid, foreign key -> users)
- devs (uuid[], array of user ids)
- created_at (timestamp)

## 4. tasks
- id (uuid, primary key)
- title (text, required)
- description (text)
- status (text, default: 'todo') # todo, in-progress, review, done
- is_blocked (boolean, default: false)
- milestone (text, default: 'Backlog')
- due_date (timestamp)
- comments (jsonb) # Array of {text, user_id, created_at}
- project_id (uuid, foreign key -> projects)
- organization_id (uuid, foreign key -> organizations)
- created_at (timestamp)

## 5. invoices
- id (uuid, primary key)
- title (text, required)
- amount (numeric, required)
- status (text, default: 'pending') # pending, paid, overdue
- client_email (text)
- due_date (timestamp)
- project_id (uuid, foreign key -> projects)
- organization_id (uuid, foreign key -> organizations)
- created_at (timestamp)

## 6. messages (Global & Project Chat)
- id (uuid, primary key)
- content (text, required)
- project_id (uuid, foreign key -> projects, nullable for global chat)
- sender_id (uuid, foreign key -> users)
- created_at (timestamp)

## 7. resources
- id (uuid, primary key)
- title (text, required)
- url (text, required)
- type (text, default: 'link') # link, file, figma, github
- project_id (uuid, foreign key -> projects)
- organization_id (uuid, foreign key -> organizations)
- created_at (timestamp)
