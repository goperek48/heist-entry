// The Velvet Vault — the wall cameras.
// A camera sits on a wall and sweeps its cone back and forth. Being seen by
// a live camera raises the alarm directly. An EMP shuts it down for a while;
// while down it shows a dead, dark cone.
import { hasLineOfSight, insideSmoke, insideVent } from './level.js';

export function createCamera(def, index) {
  return {
    ...def,
    index,
    angle: def.baseAngle,
    sweepPhase: index * 1.7, // cameras start out of phase with each other
    disabledUntil: 0,
    seesThief: false,
  };
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function updateCamera(cam, dt, time, thief, clouds) {
  cam.angle = cam.baseAngle + Math.sin(time * cam.sweepSpeed + cam.sweepPhase) * cam.sweep;
  if (time < cam.disabledUntil) {
    cam.seesThief = false;
    return;
  }
  if (insideVent(thief.x, thief.y) || insideSmoke(thief.x, thief.y, clouds)) {
    cam.seesThief = false;
    return;
  }
  const dx = thief.x - cam.x;
  const dy = thief.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > cam.range) {
    cam.seesThief = false;
    return;
  }
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, cam.angle)) > cam.halfAngle) {
    cam.seesThief = false;
    return;
  }
  cam.seesThief = hasLineOfSight(cam.x, cam.y, thief.x, thief.y);
}

export function disableCamera(cam, time, seconds) {
  cam.disabledUntil = time + seconds;
  cam.seesThief = false;
}

export function cameraIsDown(cam, time) {
  return time < cam.disabledUntil;
}
