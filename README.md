# Definable.ai Campaign Dashboard

Live dashboard tracking the full paid marketing funnel — Instagram & LinkedIn → Signup → Chat → Subscription.

## Live URL
https://definable-mkt.netlify.app

## Auth Setup (OAuth2 — no Service Account JSON needed)

This dashboard uses **OAuth2 with a refresh token** — much simpler than a Service Account JSON.

### Step 1: Create a Google Cloud OAuth2 Client
1. Go to [Google Cloud Console](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Click **Create Credentials → OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Add Authorized redirect URI: `https://developers.google.com/oauthplayground`
5. Copy your **Client ID** and **Client Secret**

### Step 2: Get a Refresh Token via OAuth Playground
1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Click ⚙️ → check **Use your own OAuth credentials** → paste your Client ID + Secret
3. In Step 1, add these scopes:
   - `https://www.googleapis.com/auth/analytics.readonly`
   - `https://www.googleapis.com/auth/webmasters.readonly`
4. Click **Authorize APIs** → sign in with your Google account
5. Click **Exchange authorization code for tokens**
6. Copy the **Refresh token**

### Step 3: Add 5 Env Vars to Netlify
Go to **Site Settings → Environment Variables** and add:
```
GOOGLE_CLIENT_ID      = your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET  = your-client-secret
GOOGLE_REFRESH_TOKEN  = your-refresh-token
GA4_PROPERTY_ID       = properties/500643354
GSC_SITE_URL          = sc-domain:definable.ai
```

### Step 4: Trigger a redeploy
Netlify → Deploys → **Trigger deploy** → the dashboard will show live data.

## Funnel Tracked
| Milestone | Event | Page |
|---|---|---|
| Ad Click → Website | `utm_captured` | `/` |
| Sign Up | `signup_complete` | `/signup` |
| Sign In | `login_complete` | `/auth/callback` |
| First Chat | `first_chat_sent` | `/chat` |
| Subscription | `subscription_started` | `/billing` |
