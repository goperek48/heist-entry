// The Velvet Vault — the thief.
// Movement (walk / sneak / vent crawl), click-to-move, lockpicking a loot
// case, and the two tools: smoke bomb and EMP. The thief is the only
// character the player drives, so this module owns the run's loot total too.
import { ENTRY, THIEF, TOOLS, WIN_LOOT } from './config.js';
import { moveCircle, insideVent, insideExit } from './level.js';

export function createThief() {
  return {
    x: ENTRY.x, y: ENTRY.y,
    radius: THIEF.radius,
    facing: -Math.PI / 2,
    sneaking: false,
    inVent: false,
    moving: false,
    target: null, // click-to-move destination, {x, y} or null
    lootValue: 0,
    lootTaken: 0,
    hasCrown: false,
    picking: null, // loot id currently being lockpicked, or null
    pickProgress: 0,
    smokeLeft: TOOLS.smoke.count,
    empLeft: TOOLS.emp.count,
    stepTimer: 0,
  };
}

function nearestLootInReach(thief, loot) {
  let best = null;
  let bestD = Infinity;
  for (const l of loot) {
    if (l.taken) continue;
    const d = Math.hypot(l.x - thief.x, l.y - thief.y);
    if (d < 64 && d < bestD) { best = l; bestD = d; }
  }
  return best;
}

export function updateThief(t, dt, input, loot, onEvent) {
  // --- movement direction: keys win over a click target ---
  let mx = 0;
  let my = 0;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (mx !== 0 || my !== 0) t.target = null;
  if (input.click) {
    t.target = input.click;
    input.click = null;
  }
  if (mx === 0 && my === 0 && t.target) {
    const dx = t.target.x - t.x;
    const dy = t.target.y - t.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      t.target = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  const len = Math.hypot(mx, my);
  t.inVent = insideVent(t.x, t.y);
  t.sneaking = input.sneak && !t.inVent;
  const speed = t.inVent ? THIEF.ventSpeed : (t.sneaking ? THIEF.sneakSpeed : THIEF.walkSpeed);
  t.moving = len > 0;
  if (len > 0) {
    moveCircle(t, (mx / len) * speed * dt, (my / len) * speed * dt, t.radius);
    t.facing = Math.atan2(my, mx);
    t.stepTimer -= dt;
    if (t.stepTimer <= 0 && !t.sneaking) {
      t.stepTimer = 0.34;
      onEvent('step');
    }
  }

  // --- lockpicking: hold E near a case; instant grab when lockSeconds is 0 ---
  const near = nearestLootInReach(t, loot);
  if (input.interact && near) {
    if (near.lockSeconds <= 0) {
      takeLoot(t, near, onEvent);
    } else {
      if (t.picking !== near.id) {
        t.picking = near.id;
        t.pickProgress = 0;
      }
      t.pickProgress += dt;
      if (Math.floor(t.pickProgress * 6) !== Math.floor((t.pickProgress - dt) * 6)) onEvent('lockpick');
      if (t.pickProgress >= near.lockSeconds) {
        takeLoot(t, near, onEvent);
        t.picking = null;
        t.pickProgress = 0;
      }
    }
  } else {
    t.picking = null;
    t.pickProgress = 0;
  }
  return near;
}

function takeLoot(t, item, onEvent) {
  item.taken = true;
  t.lootValue += item.value;
  t.lootTaken += 1;
  if (item.id === WIN_LOOT) t.hasCrown = true;
  onEvent('pickup');
}

// Escape: the thief wins by reaching the service exit carrying the Crown Jewel.
export function thiefEscapes(t) {
  return t.hasCrown && insideExit(t.x, t.y);
}
