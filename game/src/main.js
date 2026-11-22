// The Velvet Vault — the game loop and the rules that tie the modules together.
// Phases: title -> playing -> win | lose. The alarm rises while any camera
// or chasing guard sees the thief, and decays while hidden; at 100 the
// gallery goes into lockdown and the guards hunt faster. The run ends when
// the thief escapes with the Crown Jewel, is caught, or the timer runs out.
import { WORLD, TIMER_SECONDS, ALARM_LOCKDOWN, GUARDS, CAMERAS, TOOLS } from './config.js';
import { freshLoot } from './level.js';
import { createGuard, updateGuard, guardCatches } from './guard.js';
import { createCamera, updateCamera, disableCamera } from './camera.js';
import { createThief, updateThief, thiefEscapes } from './thief.js';
import { render } from './render.js';
import { createInput } from './input.js';
import { sfx, unlockAudio, toggleMute } from './audio.js';

export function createGame(canvas) {
  const ctx = canvas.getContext('2d');
  const input = createInput(canvas);
  const state = {
    phase: 'title',
    time: 0,
    timeLeft: TIMER_SECONDS,
    alarm: 0,
    lockdown: false,
    loseReason: null,
    thief: createThief(),
    guards: GUARDS.map((g, i) => createGuard(g, i)),
    cameras: CAMERAS.map((c, i) => createCamera(c, i)),
    loot: freshLoot(),
    smoke: [], // {x, y, radius, until}
    nearLoot: null,
    alarmBeeped: false,
  };

  function reset() {
    state.phase = 'playing';
    state.time = 0;
    state.timeLeft = TIMER_SECONDS;
    state.alarm = 0;
    state.lockdown = false;
    state.loseReason = null;
    state.thief = createThief();
    state.guards = GUARDS.map((g, i) => createGuard(g, i));
    state.cameras = CAMERAS.map((c, i) => createCamera(c, i));
    state.loot = freshLoot();
    state.smoke = [];
    state.nearLoot = null;
    state.alarmBeeped = false;
  }

  function onEvent(name) {
    if (name === 'pickup') sfx.pickup();
    else if (name === 'lockpick') sfx.lockpick();
    else if (name === 'step') sfx.step();
  }

  function update(dt) {
    if (state.phase !== 'playing') return;
    if (state.frozen) return; // posed screenshot: render the scene, do not advance it
    state.time += dt;
    state.timeLeft -= dt;
    if (state.timeLeft <= 0) {
      state.timeLeft = 0;
      return endRun('lose', 'time');
    }

    const pressed = input.consume();
    if (pressed.mute) toggleMute();
    if (pressed.restart) { reset(); return; }

    // tools
    const t = state.thief;
    if (pressed.smoke && t.smokeLeft > 0) {
      t.smokeLeft -= 1;
      state.smoke.push({ x: t.x, y: t.y, radius: TOOLS.smoke.radius, until: state.time + TOOLS.smoke.duration });
      sfx.smoke();
    }
    if (pressed.emp && t.empLeft > 0) {
      t.empLeft -= 1;
      for (const cam of state.cameras) disableCamera(cam, state.time, TOOLS.emp.duration);
      sfx.emp();
    }
    state.smoke = state.smoke.filter((c) => state.time < c.until);

    state.nearLoot = updateThief(t, dt, input, state.loot, onEvent);
    for (const g of state.guards) updateGuard(g, dt, t, state.smoke, state.lockdown);
    let seenByCamera = false;
    for (const cam of state.cameras) {
      updateCamera(cam, dt, state.time, t, state.smoke);
      if (cam.seesThief) seenByCamera = true;
    }

    // alarm: cameras push it up steadily; a chasing guard pushes it faster;
    // hiding lets it bleed off. Lockdown at 100 makes every guard faster.
    const anyChase = state.guards.some((g) => g.state === 'chase');
    if (seenByCamera) state.alarm += 14 * dt;
    if (anyChase) state.alarm += 9 * dt;
    if (!seenByCamera && !anyChase) state.alarm = Math.max(0, state.alarm - 7 * dt);
    if (state.alarm >= ALARM_LOCKDOWN) {
      state.alarm = ALARM_LOCKDOWN;
      if (!state.lockdown) {
        state.lockdown = true;
        sfx.alarm();
        for (const g of state.guards) if (g.state !== 'chase') g.state = 'suspicious';
      }
    }
    if (state.lockdown && !state.alarmBeeped && Math.floor(state.time * 2) % 2 === 0) {
      state.alarmBeeped = true;
      sfx.alarm();
    } else if (Math.floor(state.time * 2) % 2 === 1) {
      state.alarmBeeped = false;
    }

    // caught?
    for (const g of state.guards) {
      if (guardCatches(g, t)) return endRun('lose', 'caught');
    }
    // escaped?
    if (thiefEscapes(t)) return endRun('win');
  }

  function endRun(phase, reason = null) {
    state.phase = phase;
    state.loseReason = reason;
    if (phase === 'win') sfx.win();
    else sfx.caught();
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    // Edge presses are consumed here only outside play; while playing,
    // update() owns them (smoke / EMP / restart / mute).
    if (state.phase !== 'playing') {
      const pressed = input.consume();
      if ((state.phase === 'title' && (pressed.restart || input.click || input.up || input.down)) ||
          ((state.phase === 'win' || state.phase === 'lose') && pressed.restart)) {
        unlockAudio();
        reset();
        return requestAnimationFrame(frame);
      }
    }
    update(dt);
    render(ctx, state);
    requestAnimationFrame(frame);
  }

  // First paint immediately so a screenshot never catches a blank canvas.
  render(ctx, state);
  requestAnimationFrame(frame);
  return state;
}

// Deterministic self-test (?selftest=1): runs the pure rules headlessly and
// writes PASS/FAIL into the DOM for the harness to read.
export function runSelfTest() {
  const results = [];
  const check = (name, ok) => results.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  try {
    const { hasLineOfSight, insideVent, collidesWithWalls } = awaitImportLevel();
    check('wall blocks line of sight', !hasLineOfSight(375, 155, 375, 500));
    check('open floor keeps line of sight', hasLineOfSight(200, 200, 400, 200));
    check('vent detection', insideVent(300, 67) && !insideVent(300, 200));
    check('wall collision', collidesWithWalls(583, 203, 13));
    check('open floor is free', !collidesWithWalls(200, 200, 13));
    const g = createGuard(GUARDS[0], 0);
    check('guard starts patrolling', g.state === 'patrol' && g.waypoints.length === 4);
    const cam = createCamera(CAMERAS[0], 0);
    check('camera starts live', cam.disabledUntil === 0);
    const t = createThief();
    check('thief starts at entry with no loot', t.lootValue === 0 && !t.hasCrown);
    check('three guards, three cameras', GUARDS.length === 3 && CAMERAS.length === 3);
    check('four loot pieces', freshLoot().length === 4);
  } catch (e) {
    results.push(`FAIL exception: ${e.message}`);
  }
  const el = document.getElementById('selftest');
  if (el) el.textContent = results.join('\n');
  return results;
}

function awaitImportLevel() {
  // Synchronous re-export shim: level.js is imported statically above in
  // the real build; this indirection only exists so the self-test can run
  // before the module graph is fully wired in tests.
  return levelExports;
}

// Level helpers, imported for the self-test (and used by the loop above
// through the same module graph).
import * as levelExports from './level.js';
