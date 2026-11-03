# Google Play listing copy (draft)

Review before submission. Prices match in-app subscription display (`src/account/tierModel.js`). DLC packs are **£0.99** each (separate one-time products).

## Short description (max 80 characters)

**Draft (79 chars):**  
Find the liar! Pass-the-phone & online party game with themed hosts and voice chat.

## Full description

**Pants on Fire: Find the Liar** is a fast social deduction party game for 3–10 players. One person gets a slightly wrong prompt — everyone else tries to spot who is faking it.

**Pass the phone** for classic Hot Seat rounds at home: themed hosts, persona cards, category packs, and multiple round types (opinion clashes, picture rounds, chain reactions, and more).

**Play online** with friends: create or join a lobby, use optional voice chat, vote on who lied, and climb the scoreboard. The host controls when the table moves to the next phase.

**Subscriptions (Google Play / RevenueCat)**

- **Local Liar — £2.99/month**  
  Host **local** pass-the-phone games on your device. Includes the five core themes. Everything in free **Fibber** (join online lobbies others host).

- **Suspect — £4.99/month**  
  **Create online lobbies** and voice-party with friends. Five core themes plus new base categories and prompts as they ship. Upgrade pricing reflects tiers you already own.

- **Host with the Most — £9.99/month**  
  **Every DLC theme bundle** (extra themes, personas, host dialogue, card art). Full **category editor** (custom categories and prompt pairs). All future DLC packs included at no extra charge.

**Add-on:** **Twist the Truth — £1.99** one-time — unlocks the category editor without Host with the Most.

**DLC theme packs — £0.99** each — three themed experiences per pack (or get them all with Host with the Most).

Sign in with a Pants on Fire account to sync entitlements across web and app. Restore purchases from the store screen.

Questions or account help: use in-app links to privacy policy and account deletion on our website.

---

## Subscription benefits (Play Console “benefits” fields)

Use one bullet per line in Play Console where character limits allow.

### Local Liar (£2.99)

- Host local pass-the-phone games on this device  
- Unlock the five core themes for local play  
- Join online lobbies hosted by others (Fibber tier)

### Suspect (£4.99)

- Create and host online multiplayer lobbies  
- Voice party / LiveKit voice chat in supported lobbies  
- Five core themes plus new base categories and prompts as released  
- Includes Fibber + Local Liar capabilities via tier rank

### Host with the Most (£9.99)

- All DLC theme bundles and future DLC packs at no extra cost  
- Full custom category and prompt-pair editor  
- Highest tier: online hosting, local hosting, and entire content library  
- Includes all lower-tier benefits

---

## Graphics

Generated assets (Chewy-style outlined titles, neon brand colours):

| Asset | Path |
|-------|------|
| App icon 512×512 | `docs/store/graphics/icon-512.png` |
| Feature graphic 1024×500 | `docs/store/graphics/feature-1024x500.png` |
| Phone screenshot — home | `docs/store/graphics/screenshot-01-home.png` |
| Phone screenshot — in-game | `docs/store/graphics/screenshot-02-ingame.png` |
| Phone screenshot — online lobby | `docs/store/graphics/screenshot-03-lobby.png` |

Regenerate: `node scripts/generatePlayStoreGraphics.mjs`
