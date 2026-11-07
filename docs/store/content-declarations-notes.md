# Play Console — content declarations (answer notes)

Use these notes when completing **App content** and **Data safety** in Google Play Console. Wording is factual based on the current codebase; adjust if store policies change.

## Target audience and content rating

- **Target age:** Teens **13+** (not directed at children under 13).  
- **User-generated content:** Party chat text in online lobbies; optional voice (LiveKit). No public feed.  
- **Moderation:** In-lobby **report** and **block** (host kick + player report reasons including sexual content, harassment, spam). See `server/moderationRoutes.js`, `LobbyPlayerModerationMenu.jsx`.  
- **Mature themes:** Optional **18+** mode and adult-only prompt pools are gated in client data (`adultOnly` flags); default paths use 13+ friendly copy. Alcohol/gambling references may appear in category prompts (social/party context), not simulated gambling for money.

## Voice chat

- **Yes** — optional realtime voice in online lobbies via **LiveKit** (tokens issued by lobby server, ~15-minute TTL).  
- Voice is session-based, not stored on Pants on Fire servers (declare per LiveKit / your privacy policy).  
- Microphone permission required in the Android WebView shell (`RECORD_AUDIO` / iOS mic usage string when shipping native builds).

## Account deletion

- **Yes** — users can request deletion via web flow (`public/delete-account/` / deployed equivalent) linked from the app privacy area.  
- Deletion removes or anonymises PoF account data per published privacy policy; entitlements may remain in store records (Google/Apple/RevenueCat) — user should cancel subscriptions in store.

## Report and block

- **Report player:** Seated players can report others with reason codes (including sexual content).  
- **Block / remove:** Host can kick; blocked keys persisted client-side for session UX. Server validates host for kick.

## Ads

- **No ads** in current build (subscription + DLC monetisation only).

## Data collected (summary for Data safety form)

- Account: email, display name (PoF auth / Supabase legacy paths).  
- Purchases: processed by **Google Play / RevenueCat**; server stores entitlement tier and unlocked pack ids.  
- Voice: ephemeral realtime (LiveKit); not recorded in app code.  
- No analytics SDK shipped in current Expo shell (declare “none” until added).

## Contact

- Support / privacy URLs as published on `www.pantsonfire.app` (privacy policy page in repo: `public/privacy/`).
