# Admin User Setup Guide

## Quick Setup: Update Existing User to Admin

### Option 1: Supabase Dashboard (Recommended)

1. **Access Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Sign in to your account
   - Select your project: `Cognitive_Load_Analysis`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run Admin Update Query**
   ```sql
   UPDATE participants 
   SET role = 'admin' 
   WHERE email = 'test@example.com';
   ```

4. **Verify the Update**
   ```sql
   SELECT id, email, role, full_name, created_at 
   FROM participants 
   WHERE email = 'test@example.com';
   ```
   
   Expected result:
   - role should now be 'admin'

5. **Test Admin Authentication**
   ```bash
   # In PowerShell
   $response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/signin" `
     -Method POST `
     -ContentType "application/json" `
     -Body '{"email":"test@example.com","password":"password123"}'
   
   # Store admin token
   $global:adminToken = $response.access_token
   
   # Verify admin role
   $response.user.role  # Should output: admin
   ```

6. **Test Admin Endpoints**
   ```bash
   # Test analytics endpoint
   Invoke-RestMethod -Uri "http://localhost:3001/api/admin/analytics" `
     -Headers @{Authorization="Bearer $global:adminToken"}
   ```

---

### Option 2: Create New Admin User

If you prefer to create a dedicated admin user:

```sql
-- Create admin user directly in database
INSERT INTO participants (email, full_name, role, created_at)
VALUES ('admin@example.com', 'Admin User', 'admin', NOW());
```

**Note**: This creates the user record, but you'll need to create the auth credentials in Supabase Auth separately:
1. Go to "Authentication" → "Users" in Supabase Dashboard
2. Click "Add user"
3. Email: `admin@example.com`
4. Password: Set a secure password
5. Then link the auth user to the participant record by updating the participant's `id` to match the auth user's UUID

---

### Option 3: Database Seed Script

Run the provided seed script:

```bash
cd server
npm run seed:admin
```

(This option requires creating the seed script - let me know if you want this)

---

## Testing Admin Dashboard

Once admin user is created:

1. **Start the servers** (if not already running)
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

2. **Access Admin Dashboard**
   - Navigate to: http://localhost:5173
   - Log in with admin credentials
   - You should see "Admin Dashboard" in the navigation
   - Click to view analytics, participants, and sessions

3. **Verify Features**
   - ✅ Overview tab shows aggregate statistics
   - ✅ Cognitive load distribution pie chart
   - ✅ Platform comparison bar chart
   - ✅ Participants tab lists all users
   - ✅ Sessions tab shows session details
   - ✅ Refresh button updates data

---

## Troubleshooting

### Issue: "Forbidden: Admin access required"
- **Cause**: User role is not 'admin'
- **Fix**: Re-run the SQL update query and verify with SELECT query

### Issue: 401 Unauthorized
- **Cause**: Token expired or invalid
- **Fix**: Sign in again to get fresh token

### Issue: No data showing in dashboard
- **Cause**: Database might be empty
- **Fix**: Complete some participant sessions first, or check database has data

---

## Security Notes

- Admin role grants access to ALL participant data
- Protect admin credentials carefully
- Consider adding 2FA for production admin accounts
- Regularly audit admin access logs
