# Pants On Fire Project Context

## Product Summary

**Pants on Fire: Find the Liar** is a loud, chaotic, pass-the-phone social deduction party game built around bluffing, hidden information, fake confidence, arguments, voting, and dramatic liar reveals.

The game is designed to feel like a neon arcade gameshow version of Mafia/Werewolf/Among Us, with faster setup, shorter rounds, and a colourful mobile-first interface.

Primary tagline:

> Catch the liar... or become the liar.

## Core Identity

The product should feel:

- Funny
- Fast
- Chaotic
- Colourful
- Replayable
- Accessible
- Social
- Slightly cheeky
- Family-friendly by default
- More adult only when 18+ mode is explicitly enabled

The visual language is based on the **Find The Liar / Pants on Fire** identity:

- 80s arcade energy
- Neon colour
- Lightning bolts
- Wavy/zany shapes
- Bold UI panels
- Gameshow-style host callouts
- Big reveal moments
- High-energy animations

## Current Tech Stack

- React 19
- Vite
- Framer Motion
- Tailwind CSS
- Lucide icons
- Express lobby server
- Socket.IO realtime multiplayer transport
- LiveKit voice-party support
- Supabase client support
- Expo shell using React Native WebView
- RevenueCat / `react-native-purchases` bridge for native purchases
- Local data-driven game content under `src/data`
- Node scripts for DLC, picture packs, host voice generation, persona generation, and media validation

## Current App Shape

The current web game is the main product shell. The Expo app wraps the Vite web game in a WebView and bridges native purchase events back into the web experience.

The repository includes:

- Web game frontend
- Mobile Expo wrapper
- Online lobby server
- Local game content files
- DLC/picture-pack tooling
- Host voice tooling
- Persona/avatar generation tooling
- Entitlement/account hooks
- Media asset validation scripts

## Core Gameplay Loop

1. Home screen.
2. Setup lobby.
3. Rules splash.
4. Pick game mode, category, theme, and round type.
5. Pass-the-phone player reveal.
6. Discussion, bluffing, or interrogation.
7. Voting.
8. Suspense reveal.
9. Scoring.
10. Next round or winner screen.

## Current / Intended Round Types

- Hot Seat
- Truth or Twisted
- Flash Frame
- Name and Blame
- Sound Off
- Off Topic Defense
- Chain Reaction
- Grill 'Em
- Dodgy Audio
- Clip Trap

The first target should remain **pass-the-phone** reliability. Online and media-heavy modes should be layered on top without breaking the core offline party experience.

## Product Modes

### Classic

Standard social deduction rules with hidden prompts and liar detection.

### Chaos

Adds extra pressure, banned words, and higher-energy party rules.

### 18+ Mode

Optional adult/risky content mode. Must be opt-in, clearly labelled, and never accidentally surfaced to family-friendly users.

## Host Character

The game uses a host/personality layer to add energy, stingers, voice lines, theme flavour, and dramatic reveal moments.

Current host direction includes **Ian Poster** and AI/voice-style host behaviour such as **Blaze Byte** for Grill 'Em style rounds.

The host system should support:

- Theme-specific host art
- Idle and talking frames
- Voice lines
- Stingers
- Persona callouts
- Round intros
- Reveal moments

## Theme System

Themes influence:

- Name pools
- Host copy
- Stingers
- Character/persona art
- UI surfaces
- Round flavour
- DLC unlocks

Themes and DLC should be data-driven so new packs can be added without rewriting gameplay logic.

## Monetisation Direction

Monetisation should be fun and non-predatory.

Possible monetised items:

- Theme packs
- Picture packs
- Host/persona packs
- 18+ content packs
- Premium round types
- Cosmetic upgrades
- Subscription tiers

Core party gameplay must remain playable and understandable without paid content.

## Priorities for AI Agents

When working on this project, prioritise:

1. Preserve working gameplay.
2. Keep pass-the-phone mode reliable.
3. Keep the UI fun and easy to understand.
4. Keep content data-driven.
5. Avoid giant untested rewrites.
6. Improve architecture gradually.
7. Make online multiplayer robust but secondary to the local party loop.
8. Keep mobile performance strong.
9. Keep monetisation optional and clearly surfaced.
10. Keep family-friendly content separate from 18+ content.
