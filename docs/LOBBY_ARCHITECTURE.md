# Lobby Architecture

## Overview

The Pants On Fire online lobby system is built around an Express server with Socket.IO realtime events and optional Redis-backed storage.

The lobby server is responsible for:

- Creating lobby codes.
- Allowing players to join.
- Managing ready state.
- Starting games.
- Creating rounds.
- Advancing phases.
- Accepting votes.
- Returning private player round data.
- Handling disconnect/reconnect.
- Supporting optional LiveKit voice rooms.

## Storage

The server supports:

- In-memory lobby storage for local development.
- Redis lobby storage for production-like deployments.

Production should use Redis so lobbies can survive process boundaries and support scaling.

## Server Authority

The server should remain authoritative for:

- Lobby existence.
- Player membership.
- Host status.
- Session tokens.
- Round generation.
- Liar assignment.
- Voting state.
- Score calculation.
- Private prompt access.

The client should never be treated as authoritative for online play.

## Lobby Codes

Lobby codes are generated server-side using a short human-readable code.

Recommended safeguards:

- Rate-limit join attempts.
- Avoid exposing whether codes are close to valid.
- Monitor repeated failed joins.
- Consider expiry for inactive lobbies.

## Session Tokens

Player sessions use server-issued session tokens.

Rules:

- Tokens should expire.
- Tokens should be tied to player/lobby identity.
- Tokens should be required for private round reads.
- Tokens should be required for reconnect/resume.

## Disconnect Handling

The server includes disconnect grace handling.

Desired behaviour:

- Temporary disconnects should not instantly remove players.
- Expired disconnected players should be cleaned up.
- Active socket tracking should prevent duplicate cleanup.

## Host Actions

Host-only actions should be validated server-side:

- Start game.
- Advance phase.
- Change rules.
- Kick player.
- End lobby.

## Private Data

Private round data must only be returned to the matching player session.

Never broadcast:

- Liar identity before reveal.
- Private prompt assignment.
- Hidden Grill Em context.
- Vote information before allowed.

## Scaling Notes

For production:

- Use Redis.
- Run behind HTTPS.
- Lock CORS to known origins.
- Add rate limiting.
- Add structured logs.
- Add health checks.
- Add basic metrics.
