# Pants On Fire Product Requirements

## Product Vision

Pants on Fire: Find the Liar should become a best-in-class mobile-first social deduction party game for groups who want quick setup, ridiculous conversations, bluffing, voting, reveals, and replayable chaos.

The game should be simple enough for casual players to understand within one round, but deep enough that groups want to keep replaying with new categories, themes, round types, and host personalities.

## Target Platforms

- React + Vite web app.
- Expo React Native shell using WebView.
- Android-first mobile testing.
- iOS support through Expo when ready.
- Future PWA/tablet/desktop browser support.

## Target Users

- Casual party groups.
- Social deduction fans.
- Players who enjoy gameshow-style group chaos.
- Groups wanting replayable local party content.
- Future online friend groups using lobbies and voice.

## Core Gameplay Requirements

### Lobby Setup

The game must support:

- Adding players.
- Removing players.
- Random names.
- Theme-based name pools.
- Player count validation.
- Rule selection.
- Game mode selection.
- Category selection.
- Round type selection.
- Clear age-gated content indicators where enabled.

### Game Flow

The game must support:

1. Home.
2. Setup lobby.
3. Rules splash.
4. Round type/category selection.
5. Private player reveal.
6. Discussion or interrogation.
7. Voting.
8. Liar reveal.
9. Results and scoring.
10. Next round or winner screen.

### Pass-The-Phone Reveal

The reveal flow must:

- Show one player at a time.
- Hide private information from other players.
- Clearly instruct when to pass the device.
- Support liar and non-liar prompts.
- Prevent accidental reveal where possible.

### Voting and Scoring

The app should support:

- Player voting.
- Clear vote confirmation.
- Suspense reveal.
- Points mode.
- Fixed-rounds mode.
- Target score.
- Rounds-per-player configuration.
- Winner screen.

## Round Type Requirements

Supported or planned round families include:

- Hot Seat.
- Truth or Twisted.
- Flash Frame.
- Name and Blame.
- Sound Off.
- Off Topic Defense.
- Chain Reaction.
- Grill Em.
- Dodgy Audio.
- Clip Trap.

Pass-the-phone-ready round types must remain reliable before online-only round types are expanded.

## Theme and Content Requirements

The content system must support:

- Themes.
- Name pools.
- Prompt categories.
- Host stingers.
- Persona callouts.
- Picture DLC manifests.
- Theme assets.
- UI assets.
- Age-gated content packs.

Content should remain data-driven so packs can be added without rewriting app logic.

## Online Multiplayer Requirements

The online mode should support:

- Create lobby.
- Join lobby by code.
- Resume lobby session.
- Ready state.
- Start lobby.
- Advance round phase.
- Submit votes.
- Read private round information securely.
- Reconnect handling.
- Disconnect grace window.
- Voice party support via LiveKit where configured.

Online must not compromise the simpler local party experience.

## Account, Entitlement and Store Requirements

The account/store layer should support:

- Local/demo account storage.
- Remote entitlement fetching.
- Theme pack unlocks.
- Subscription tiers.
- Add-ons.
- RevenueCat/native purchase bridge.
- Purchase and restore flows.
- Clear locked/unlocked UI.

## Media and Asset Requirements

The game should support:

- Logo assets.
- Theme art.
- Host idle and talk frames.
- Voice lines.
- SFX.
- Music.
- Picture clue packs.
- Video/audio clue assets.
- Asset validation scripts.

## Non-Functional Requirements

### Performance

- Fast startup.
- Smooth animations.
- Mobile-friendly memory usage.
- Avoid unnecessary preloading of huge media.

### Reliability

- Pass-the-phone mode must work local-first.
- Online mode must handle disconnects gracefully.
- Missing assets should fail safely with fallbacks.

### Content Control

- Age-gated content must be opt-in.
- Default play should remain broadly family-friendly.
- Imported or generated content must be reviewed before shipping.

### Accessibility

- Large readable text.
- Clear contrast.
- Touch-friendly controls.
- Avoid relying on colour alone.
- Consider reduced-motion settings.

### Commercial Readiness

- Purchase flows must be clear.
- Entitlements must be testable.
- DLC manifests must be linted.
- Attribution data must be retained for sourced image packs.

## Success Criteria

- A new group can start a game in under one minute.
- Players understand the rules by the end of the first round.
- Rounds feel funny and fast.
- Liar reveal moments feel dramatic.
- Pass-the-phone mode is stable.
- Online mode works without corrupting game state.
- DLC can be added safely through data files and scripts.
- The app performs well on mid-range phones.
