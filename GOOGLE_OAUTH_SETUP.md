# Google OAuth Setup Guide

## Prerequisites
You need a Google Cloud Console account to create OAuth credentials.

## Steps to Set Up Google OAuth

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name (e.g., "Hyrexa")
4. Click "Create"

### 2. Enable Google+ API
1. In the left sidebar, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 3. Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" user type
3. Click "Create"
4. Fill in the required fields:
   - App name: Hyrexa
   - User support email: your-email@example.com
   - Developer contact information: your-email@example.com
5. Click "Save and Continue"
6. Skip "Scopes" (click "Save and Continue")
7. Add test users if needed (for development)
8. Click "Save and Continue"

### 4. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"
4. Configure:
   - Name: Hyrexa Web Client
   - Authorized JavaScript origins:
     - http://localhost:5173
     - http://localhost:3000
     - https://yourdomain.com (for production)
   - Authorized redirect URIs:
     - http://localhost:5173
     - http://localhost:5000/api/auth/google/callback
     - https://yourdomain.com (for production)
5. Click "Create"
6. Copy the **Client ID** that appears

### 5. Update Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

#### Backend (docker-compose.yml or server .env)
```env
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
```

### 6. Restart Services
```bash
# Restart Docker containers
docker compose restart

# Or restart frontend/backend separately
docker compose restart frontend
docker compose restart backend
```

## Testing Google OAuth

1. Navigate to http://localhost:5173/login
2. Click the "Sign in with Google" button
3. Select your Google account
4. Grant permissions
5. You should be redirected to the dashboard

## Security Notes

- Never commit your actual Client ID/Secret to Git
- Use different credentials for development and production
- Keep the OAuth consent screen up to date
- Regularly rotate credentials in production
- Use environment-specific redirect URIs

## Troubleshooting

### "Access blocked: Authorization Error"
- Make sure your email is added as a test user in OAuth consent screen
- Or publish your app (if ready for production)

### "Redirect URI mismatch"
- Verify the redirect URI in Google Cloud Console matches exactly
- Check for trailing slashes
- Ensure protocol (http/https) matches

### "Invalid client"
- Double-check your Client ID is correct
- Make sure you're using the Web Application client, not Android/iOS

### CORS errors
- Verify the frontend URL is in "Authorized JavaScript origins"
- Check that CORS is properly configured in the backend

## Production Deployment

When deploying to production:

1. Update authorized origins and redirect URIs with production URLs
2. Use production environment variables
3. Consider publishing your OAuth consent screen (if public app)
4. Enable additional security features (rate limiting, etc.)
