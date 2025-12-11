# Google OAuth Quick Reference

## Setup (One Time)

1. Go to https://console.cloud.google.com/
2. Create project → Enable Google+ API → Configure OAuth consent screen
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized origins: `http://localhost:5173`
5. Copy Client ID

## Configuration

### Frontend `.env`
```env
VITE_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

### Backend `docker-compose.yml`
```yaml
- GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
- GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456
```

## Test It

1. Start services: `docker compose up`
2. Go to: http://localhost:5173/login
3. Click "Sign in with Google"
4. Select account → Grant permissions → ✅ Logged in!

## API Endpoint

**POST** `/api/auth/google`
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIs..."
}
```

Response:
```json
{
  "success": true,
  "message": "Google authentication successful",
  "data": {
    "user": { "id": "...", "email": "...", "username": "..." },
    "token": "jwt-token-here"
  }
}
```

## Features

✅ Login with Google  
✅ Register with Google  
✅ Google One Tap  
✅ Auto profile image  
✅ Account linking  
✅ Works with email/password  

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Access blocked" | Add email as test user in console |
| "Redirect URI mismatch" | Check authorized URIs in console |
| "Invalid client" | Verify Client ID is correct |
| Button doesn't appear | Check VITE_GOOGLE_CLIENT_ID in .env |

## Need Help?

Read: `GOOGLE_OAUTH_SETUP.md` for detailed setup  
Read: `GOOGLE_OAUTH_IMPLEMENTATION.md` for technical details
