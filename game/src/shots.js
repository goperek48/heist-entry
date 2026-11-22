// The Velvet Vault — posed scenes for the entry's screenshots.
// ?shot=cover|play|alarm|win freezes the game in a composed moment so a
// screenshot shows the heist at its best: the room, the cones, the cameras,
// the loot and the alarm meter, all in one frame. These are real renders of
// the game's own code, not mock-ups: the state is the game's real state,
// only frozen in place.
export function applyShot(state, name) {
  const t = state.thief;
  if (name === 'cover') {
    // The title screen over the untouched gallery.
    state.phase = 'title';
    return;
  }
  if (name === 'play') {
    state.phase = 'playing';
    t.x = 500; t.y = 400; t.sneaking = true; t.facing = Math.PI / 4;
    state.loot.find((l) => l.id === 'idol').taken = true;
    t.lootValue = 2500;
    t.lootTaken = 1;
    state.alarm = 34;
    state.timeLeft = 242;
    state.time = 58;
    const rook = state.guards[0];
    rook.x = 640; rook.y = 300; rook.facing = Math.PI * 0.75;
    rook.suspicion = 0.55; rook.state = 'suspicious';
    const bishop = state.guards[1];
    bishop.x = 900; bishop.y = 380; bishop.facing = Math.PI;
    state.frozen = true;
    return;
  }
  if (name === 'alarm') {
    state.phase = 'playing';
    t.x = 660; t.y = 430; t.facing = -Math.PI / 2;
    state.loot.find((l) => l.id === 'crown').taken = true;
    state.loot.find((l) => l.id === 'diamond').taken = true;
    t.lootValue = 8000;
    t.lootTaken = 2;
    t.hasCrown = true;
    state.alarm = 82;
    state.timeLeft = 131;
    state.time = 169;
    state.smoke.push({ x: 600, y: 380, radius: 90, until: state.time + 4 });
    const rook = state.guards[0];
    rook.x = 740; rook.y = 400; rook.facing = Math.PI;
    rook.suspicion = 1; rook.state = 'chase';
    const knight = state.guards[2];
    knight.x = 520; knight.y = 380; knight.facing = 0;
    knight.suspicion = 0.8; knight.state = 'suspicious';
    state.frozen = true;
    return;
  }
  if (name === 'win') {
    state.phase = 'win';
    state.loot.forEach((l) => { l.taken = true; });
    t.lootValue = 12500;
    t.lootTaken = 4;
    t.hasCrown = true;
    t.x = 125; t.y = 120;
    state.timeLeft = 143;
    state.time = 157;
    state.alarm = 41;
    state.frozen = true;
  }
}
