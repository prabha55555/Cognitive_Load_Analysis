# Supabase Database Setup Guide

## Phase 2: Database Integration - Step-by-Step Instructions

### ✅ Step 1: Credentials Setup (COMPLETED)
- Supabase project created
- Environment variables configured in `.env` files

---

### 📝 Step 2: Create Database Schema

**Option A: Supabase Dashboard (Recommended for Quick Setup)**

1. **Open Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Select your project: `cognitive-load-analysis`

2. **Navigate to SQL Editor**:
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Copy and Execute Schema**:
   - Open `database/schema.sql` in this project
   - Copy the ENTIRE file contents
   - Paste into the SQL Editor
   - Click **Run** (or press Ctrl+Enter)
   - Wait for "Success. No rows returned" message

4. **Verify Tables Created**:
   - Go to **Table Editor** in left sidebar
   - You should see 6 tables:
     - ✅ participants
     - ✅ sessions
     - ✅ interaction_events
     - ✅ assessment_responses
     - ✅ creativity_responses
     - ✅ cognitive_load_metrics

**Option B: Using Supabase CLI (For Advanced Users)**

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref oilzryiqewufcxpujeys

# Run migration
supabase db push --db-url "postgresql://postgres:finalyearprojec@db.oilzryiqewufcxpujeys.supabase.co:5432/postgres"
```

---

### 👤 Step 3: Create Admin User

After schema is created, create your admin account:

**In Supabase Dashboard → SQL Editor, run:**

```sql
-- Create admin user in auth system
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@cognitive-research.local', -- Change this email
  crypt('YourSecurePassword123!', gen_salt('bf')), -- Change this password
  NOW(),
  NOW(),
  NOW(),
  '{"role": "admin", "name": "Research Admin"}'::jsonb
) RETURNING id;

-- Copy the UUID from the output above, then run:
-- Replace <UUID_FROM_ABOVE> with the actual UUID

INSERT INTO participants (id, email, name, role)
VALUES (
  '<UUID_FROM_ABOVE>', -- Paste UUID here
  'admin@cognitive-research.local',
  'Research Admin',
  'admin'
);
```

**Alternative: Use Supabase Auth UI**
1. Go to **Authentication → Users** in dashboard
2. Click **Add User**
3. Enter email and password
4. Copy the user's UUID
5. Run the `INSERT INTO participants` query above with that UUID

---

### 🔒 Step 4: Verify RLS Policies

Check that Row-Level Security is enabled:

```sql
-- Verify RLS is enabled on all tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'participants', 
  'sessions', 
  'interaction_events', 
  'assessment_responses', 
  'creativity_responses', 
  'cognitive_load_metrics'
);

-- Should show rowsecurity = true for all tables
```

---

### ✅ Step 5: Test Connection

Run the connection test:

```bash
# From project root
cd server
npm run test:db
```

Or test manually:

```typescript
// In browser console after app starts
import { checkSupabaseConnection } from './src/config/supabase';
await checkSupabaseConnection();
// Should return true
```

---

### 📊 Step 6: (Optional) Create Sample Data

Create a test participant session:

```sql
-- Create test participant
INSERT INTO participants (email, name, role)
VALUES ('test@example.com', 'Test Participant', 'participant')
RETURNING id;

-- Create test session (use participant UUID from above)
INSERT INTO sessions (participant_id, platform, topic, current_phase)
VALUES (
  '<PARTICIPANT_UUID>',
  'chatgpt',
  'Artificial Intelligence Basics',
  'research'
)
RETURNING id;
```

---

## Troubleshooting

### Error: "permission denied for table participants"
- **Solution**: RLS policies are blocking access. Use service role key in backend, or sign in as admin user.

### Error: "relation 'participants' does not exist"
- **Solution**: Schema not created yet. Run `database/schema.sql` in SQL Editor.

### Error: "duplicate key value violates unique constraint"
- **Solution**: Email already exists. Use a different email or delete the existing user.

### Connection Error
- **Solution**: Check `.env` file credentials match Supabase dashboard settings.

---

## Next Steps After Setup

1. **Test Backend API**: Start server and test endpoints
2. **Update Frontend Services**: Switch from localStorage to Supabase
3. **Test Authentication Flow**: Sign in as admin, create participant sessions
4. **Enable Real-time**: Configure Supabase real-time subscriptions for dashboard

---

## Database Maintenance

### Backup
- Supabase automatically backs up your database daily
- Manual backup: Dashboard → Database → Backups → Download

### Monitor Usage
- Dashboard → Settings → Usage
- Free tier: 500MB database, 2GB bandwidth/month

### View Logs
- Dashboard → Logs → Postgres Logs
- Check for slow queries, errors

---

## Security Checklist

- [x] RLS enabled on all tables
- [x] Service role key stored in server/.env only
- [x] Anon key used in frontend
- [ ] Admin user created with strong password
- [ ] Test user permissions (participant can't see other participants' data)
- [ ] API routes use proper authentication middleware
