// The Velvet Vault — the room itself: walls, vents, loot and line of sight.
// Geometry helpers the guards, cameras and thief all share.
import { WALLS, VENTS, LOOT, EXIT, WORLD } from './config.js';

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

// True when a circle at (x, y) with radius r would be inside a wall or
// outside the room's inner border.
export function collidesWithWalls(x, y, r) {
  if (x - r < 14 || x + r > WORLD.w - 14 || y - r < 14 || y + r > WORLD.h - 14) return true;
  for (const w of WALLS) if (circleHitsRect(x, y, r, w)) return true;
  return false;
}

// Move a circle one axis at a time so it slides along walls instead of
// sticking to them.
export function moveCircle(pos, dx, dy, r) {
  const nx = pos.x + dx;
  if (!collidesWithWalls(nx, pos.y, r)) pos.x = nx;
  const ny = pos.y + dy;
  if (!collidesWithWalls(pos.x, ny, r)) pos.y = ny;
}

// Segment vs rectangle test, for line of sight.
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// True when nothing (wall or vault block) stands between two points.
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const w of WALLS) if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  return true;
}

export function insideVent(x, y) {
  for (const v of VENTS) {
    if (x > v.x && x < v.x + v.w && y > v.y && y < v.y + v.h) return true;
  }
  return false;
}

export function insideExit(x, y) {
  return x > EXIT.x && x < EXIT.x + EXIT.w && y > EXIT.y && y < EXIT.y + EXIT.h;
}

// Fresh loot state for a new run (taken flags are per-run, never shared).
export function freshLoot() {
  return LOOT.map((l) => ({ ...l, taken: false }));
}

// Is point (x, y) inside a smoke cloud?
export function insideSmoke(x, y, clouds) {
  for (const c of clouds) {
    const dx = x - c.x;
    const dy = y - c.y;
    if (dx * dx + dy * dy < c.radius * c.radius) return true;
  }
  return false;
}
