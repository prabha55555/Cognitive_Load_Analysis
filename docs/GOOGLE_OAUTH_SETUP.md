# Google OAuth Setup for Supabase

This guide walks you through setting up Google Sign-In for the Cognitive Load Analysis application.

## Prerequisites

1. A Google Cloud Console account
2. Access to your Supabase project dashboard

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select or create a project
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. If prompted, configure the OAuth consent screen first:
   - Choose "External" for user type
   - Fill in the required fields (App name, User support email, Developer contact)
   - Add scopes: `email` and `profile`
   - Add test users if in testing mode

6. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: `Cognitive Load Analysis`
   - Authorized JavaScript origins:
     ```
     http://localhost:5173
     https://your-production-domain.com (if applicable)
     ```
   - Authorized redirect URIs:
     ```
     https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback
     ```
     (Replace `YOUR_SUPABASE_PROJECT` with your actual Supabase project reference)

7. Copy the **Client ID** and **Client Secret**

## Step 2: Configure Supabase

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Providers**
4. Find **Google** in the list and click to expand
5. Toggle **Enable Sign in with Google** to ON
6. Enter your credentials:
   - **Client ID**: Paste from Google Cloud Console
   - **Client Secret**: Paste from Google Cloud Console
7. Click **Save**

## Step 3: Verify Redirect URL

Make sure your Supabase redirect URL matches what you configured in Google Cloud Console:

```
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

You can find your project reference in the Supabase Dashboard URL or in your project settings.

## Step 4: Update Frontend Environment (if needed)

Ensure your `.env` file has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Step 5: Test the Integration

1. Start the frontend: `npm run dev`
2. Navigate to the login page
3. Click "Sign in with Google"
4. You should be redirected to Google's OAuth page
5. After authentication, you'll be redirected back to the app

## Troubleshooting

### "redirect_uri_mismatch" Error
- Ensure the redirect URI in Google Cloud Console exactly matches:
  `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`

### "access_denied" Error
- Check that the OAuth consent screen is configured properly
- If in testing mode, ensure your email is added as a test user

### User not created in participants table
- The app automatically creates a participant record on first Google sign-in
- Check the Supabase logs for any errors

## Production Considerations

1. **Publish OAuth consent screen**: Move from testing to production mode
2. **Update origins**: Add your production domain to authorized origins
3. **Verify domain**: You may need to verify domain ownership for production

## Security Notes

- Never expose your Google Client Secret in frontend code
- The Client Secret should only be stored in Supabase (server-side)
- Regularly rotate credentials if they're compromised
