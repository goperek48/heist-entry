// The Velvet Vault — keyboard and mouse input.
// WASD / arrows to move, Shift to sneak, E to pick a lock, Q for a smoke
// bomb, F for the EMP, R to restart, M to mute, mouse click to set a
// move-to target. Exposes a plain state object the game loop reads.
export function createInput(canvas) {
  const keys = new Set();
  const state = {
    up: false, down: false, left: false, right: false,
    sneak: false, interact: false,
    smokePressed: false, empPressed: false,
    restartPressed: false, mutePressed: false,
    click: null, // {x, y} in canvas pixels, consumed by the loop
  };

  function refresh() {
    state.up = keys.has('KeyW') || keys.has('ArrowUp');
    state.down = keys.has('KeyS') || keys.has('ArrowDown');
    state.left = keys.has('KeyA') || keys.has('ArrowLeft');
    state.right = keys.has('KeyD') || keys.has('ArrowRight');
    state.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
    state.interact = keys.has('KeyE');
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    keys.add(e.code);
    if (e.code === 'KeyQ') state.smokePressed = true;
    if (e.code === 'KeyF') state.empPressed = true;
    if (e.code === 'KeyR') state.restartPressed = true;
    if (e.code === 'KeyM') state.mutePressed = true;
    refresh();
  });
  window.addEventListener('keyup', (e) => {
    keys.delete(e.code);
    refresh();
  });
  window.addEventListener('blur', () => { keys.clear(); refresh(); });

  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    state.click = { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
  });

  // Edge-triggered presses are consumed once per frame by the loop.
  state.consume = () => {
    const out = {
      smoke: state.smokePressed, emp: state.empPressed,
      restart: state.restartPressed, mute: state.mutePressed,
    };
    state.smokePressed = false;
    state.empPressed = false;
    state.restartPressed = false;
    state.mutePressed = false;
    return out;
  };

  return state;
}
