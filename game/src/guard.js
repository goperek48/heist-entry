// The Velvet Vault — the guards.
// A guard walks a patrol loop, sweeps a vision cone, and builds suspicion
// when the thief is inside the cone with a clear line of sight. Full
// suspicion flips the guard into a chase; losing sight drains it back.
// States: patrol -> suspicious -> chase -> patrol.
import { hasLineOfSight, insideSmoke, insideVent, moveCircle } from './level.js';

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

export function createGuard(def, index) {
  const [sx, sy] = def.waypoints[0];
  return {
    ...def,
    index,
    x: sx, y: sy,
    facing: angleTo(sx, sy, def.waypoints[1][0], def.waypoints[1][1]),
    wp: 1,
    state: 'patrol',
    suspicion: 0,
    chaseTime: 0,
    radius: 15,
    patrolSpeed: def.speed,
    chaseSpeed: def.speed * 1.85,
    lookTimer: 0,
  };
}

// Can this guard see the thief right now? Cones are blocked by walls,
// by smoke, and by the thief hiding in a vent.
export function guardSeesThief(g, thief, clouds) {
  if (insideVent(thief.x, thief.y)) return false;
  if (insideSmoke(thief.x, thief.y, clouds)) return false;
  const dx = thief.x - g.x;
  const dy = thief.y - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > g.coneRange) return false;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, g.facing)) > g.coneHalfAngle) return false;
  if (!hasLineOfSight(g.x, g.y, thief.x, thief.y)) return false;
  return true;
}

export function updateGuard(g, dt, thief, clouds, lockdown) {
  const seen = guardSeesThief(g, thief, clouds);
  const sneakFactor = thief.sneaking ? 0.45 : 1;
  if (seen) {
    g.suspicion += g.suspicionRate * sneakFactor * dt;
    if (g.suspicion >= 1) {
      g.state = 'chase';
      g.chaseTime = 4;
    } else if (g.suspicion > 0.35) {
      g.state = 'suspicious';
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - 0.35 * dt);
    if (g.state === 'suspicious' && g.suspicion <= 0.05) g.state = 'patrol';
  }

  if (g.state === 'chase') {
    g.chaseTime -= dt;
    const ang = angleTo(g.x, g.y, thief.x, thief.y);
    g.facing = ang;
    const speed = lockdown ? g.chaseSpeed * 1.15 : g.chaseSpeed;
    moveCircle(g, Math.cos(ang) * speed * dt, Math.sin(ang) * speed * dt, g.radius);
    if (!seen) {
      if (g.chaseTime <= 0) {
        g.state = 'patrol';
        g.suspicion = 0.4; // stays wary after losing the thief
        // walk back to the nearest waypoint
        let best = 0;
        let bestD = Infinity;
        g.waypoints.forEach((w, i) => {
          const d = Math.hypot(w[0] - g.x, w[1] - g.y);
          if (d < bestD) { bestD = d; best = i; }
        });
        g.wp = best;
      }
    } else {
      g.chaseTime = 4;
    }
  } else {
    // Patrol: walk to the next waypoint, pause and look around at each one.
    const [tx, ty] = g.waypoints[g.wp];
    const dx = tx - g.x;
    const dy = ty - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      g.lookTimer += dt;
      g.facing += Math.sin(g.lookTimer * 2.2) * 0.9 * dt;
      if (g.lookTimer > 1.6) {
        g.lookTimer = 0;
        g.wp = (g.wp + 1) % g.waypoints.length;
      }
      return;
    }
    const ang = Math.atan2(dy, dx);
    g.facing = ang;
    moveCircle(g, Math.cos(ang) * g.patrolSpeed * dt, Math.sin(ang) * g.patrolSpeed * dt, g.radius);
  }
}

// A guard catches the thief by touch (only while chasing or suspicious).
export function guardCatches(g, thief) {
  if (g.state === 'patrol') return false;
  return Math.hypot(g.x - thief.x, g.y - thief.y) < g.radius + thief.radius + 4;
}
