import test from 'node:test';
import assert from 'node:assert/strict';

const TIER_RANK = {
  fibber: 0,
  local_liar: 1,
  suspect: 2,
  host_most: 3,
};

function computeEntitlements(session) {
  if (!session || !session.tierId) {
    return {
      canJoinOnlineLobby: false,
      canCreateLocalGame: false,
      canCreateOnlineLobby: false,
      categoryEditorAdmin: false,
    };
  }
  const rank = TIER_RANK[session.tierId] ?? 0;
  const hostOrAddonEditor = rank >= TIER_RANK.host_most || Boolean(session.addonTwistTruth);
  return {
    canJoinOnlineLobby: true,
    canCreateLocalGame: rank >= TIER_RANK.local_liar,
    canCreateOnlineLobby: rank >= TIER_RANK.suspect,
    categoryEditorAdmin: hostOrAddonEditor,
  };
}

test('Fibber cannot create local or online lobbies', () => {
  const e = computeEntitlements({ tierId: 'fibber' });
  assert.equal(e.canCreateLocalGame, false);
  assert.equal(e.canCreateOnlineLobby, false);
  assert.equal(e.canJoinOnlineLobby, true);
});

test('Local Liar can host pass-the-phone only', () => {
  const e = computeEntitlements({ tierId: 'local_liar' });
  assert.equal(e.canCreateLocalGame, true);
  assert.equal(e.canCreateOnlineLobby, false);
});

test('Suspect can create online lobbies', () => {
  const e = computeEntitlements({ tierId: 'suspect' });
  assert.equal(e.canCreateOnlineLobby, true);
});

test('Host with the Most unlocks category editor', () => {
  const e = computeEntitlements({ tierId: 'host_most' });
  assert.equal(e.categoryEditorAdmin, true);
});

test('Twist the Truth addon unlocks editor without Host tier', () => {
  const e = computeEntitlements({ tierId: 'suspect', addonTwistTruth: true });
  assert.equal(e.categoryEditorAdmin, true);
});
