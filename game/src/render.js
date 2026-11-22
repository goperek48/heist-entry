// The Velvet Vault — everything the player sees.
// One canvas, drawn top-down: the marble gallery, the cases, the thief, the
// guards with their vision cones, the sweeping cameras, the loot, the smoke,
// and the HUD (alarm meter, loot, timer, tools, objective). Screens for the
// title, the win and the loss are drawn here too, over the room.
import { WORLD, WALLS, VENTS, LOOT, EXIT, ENTRY, PALETTE, ALARM_LOCKDOWN } from './config.js';
import { cameraIsDown } from './camera.js';

function drawCone(ctx, x, y, angle, halfAngle, range, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floorA;
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  // checkerboard marble
  const s = 80;
  ctx.fillStyle = PALETTE.floorB;
  for (let y = 0; y < WORLD.h / s; y++) {
    for (let x = 0; x < WORLD.w / s; x++) {
      if ((x + y) % 2 === 0) ctx.fillRect(x * s, y * s, s, s);
    }
  }
  ctx.strokeStyle = PALETTE.floorLine;
  ctx.lineWidth = 1;
  for (let x = 0; x <= WORLD.w; x += s) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD.h); ctx.stroke();
  }
  for (let y = 0; y <= WORLD.h; y += s) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD.w, y); ctx.stroke();
  }
  // red carpet from the entry to the vault
  ctx.fillStyle = 'rgba(122, 31, 43, 0.55)';
  ctx.fillRect(120, 300, 960, 120);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 3;
  ctx.strokeRect(120, 300, 960, 120);
}

function drawVents(ctx) {
  for (const v of VENTS) {
    ctx.fillStyle = '#101010';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = '#555';
    ctx.lineWidth = 2;
    ctx.strokeRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    for (let x = v.x + 14; x < v.x + v.w; x += 18) {
      ctx.beginPath(); ctx.moveTo(x, v.y + 3); ctx.lineTo(x, v.y + v.h - 3); ctx.stroke();
    }
  }
}

function drawWalls(ctx) {
  // outer border
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, WORLD.w, 14);
  ctx.fillRect(0, WORLD.h - 14, WORLD.w, 14);
  ctx.fillRect(0, 0, 14, WORLD.h);
  ctx.fillRect(WORLD.w - 14, 0, 14, WORLD.h);
  for (const w of WALLS) {
    ctx.fillStyle = '#241c14';
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(w.x, w.y, w.w, 6);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x, w.y, w.w, w.h);
  }
}

function drawLoot(ctx, loot, time) {
  for (const l of loot) {
    if (l.taken) continue;
    const pulse = 1 + Math.sin(time * 3 + l.x) * 0.12;
    // glass case
    ctx.fillStyle = 'rgba(150, 200, 255, 0.16)';
    ctx.beginPath();
    ctx.arc(l.x, l.y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.caseFrame;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(l.x, l.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    // the piece itself, glinting
    ctx.save();
    ctx.translate(l.x, l.y);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = l.color;
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(10, 0); ctx.lineTo(0, 12); ctx.lineTo(-10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath();
    ctx.moveTo(0, -12); ctx.lineTo(4, -2); ctx.lineTo(0, 2); ctx.lineTo(-4, -2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fff';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(l.name, l.x, l.y + 46);
  }
}

function drawExit(ctx, time) {
  const glow = 0.5 + Math.sin(time * 2.5) * 0.25;
  ctx.fillStyle = `rgba(47, 174, 95, ${0.25 + glow * 0.3})`;
  ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.strokeStyle = PALETTE.exitGreen;
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
  ctx.fillStyle = '#bff5d2';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', EXIT.x + EXIT.w / 2, EXIT.y + EXIT.h / 2 + 5);
  ctx.fillStyle = '#888';
  ctx.font = '11px sans-serif';
  ctx.fillText('ENTRY', ENTRY.x, ENTRY.y + 30);
}

function drawGuard(ctx, g, time) {
  // vision cone: amber while patrolling, orange when suspicious, red chasing
  const color = g.state === 'chase' ? 'rgba(255, 59, 48, 0.30)'
    : g.state === 'suspicious' ? 'rgba(255, 149, 0, 0.26)'
    : 'rgba(255, 214, 64, 0.20)';
  drawCone(ctx, g.x, g.y, g.facing, g.coneHalfAngle, g.coneRange, color);
  // body: navy uniform, brass badge
  ctx.fillStyle = '#1d2f52';
  ctx.beginPath();
  ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = g.color;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = PALETTE.gold;
  ctx.beginPath();
  ctx.arc(g.x, g.y, 4, 0, Math.PI * 2);
  ctx.fill();
  // facing tick
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.facing) * (g.radius + 6), g.y + Math.sin(g.facing) * (g.radius + 6));
  ctx.stroke();
  // suspicion: "!" and a rising bar over the head
  if (g.suspicion > 0.05) {
    ctx.fillStyle = g.state === 'chase' ? '#ff3b30' : '#ffb340';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', g.x, g.y - g.radius - 6);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(g.x - 18, g.y - g.radius - 16, 36, 5);
    ctx.fillStyle = g.state === 'chase' ? '#ff3b30' : '#ffb340';
    ctx.fillRect(g.x - 18, g.y - g.radius - 16, 36 * Math.min(1, g.suspicion), 5);
  }
  ctx.fillStyle = '#cfe0ff';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.name, g.x, g.y + g.radius + 14);
}

function drawCamera(ctx, cam, time) {
  const down = cameraIsDown(cam, time);
  if (!down) drawCone(ctx, cam.x, cam.y, cam.angle, cam.halfAngle, cam.range, 'rgba(255, 59, 48, 0.16)');
  // mount + lens
  ctx.fillStyle = down ? '#333' : '#c33';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 10, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = down ? '#666' : '#ff5b52';
  ctx.beginPath();
  ctx.arc(cam.x + Math.cos(cam.angle) * 5, cam.y + Math.sin(cam.angle) * 5, 3, 0, Math.PI * 2);
  ctx.fill();
  if (down) {
    ctx.fillStyle = '#9fd8ff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMP', cam.x, cam.y - 16);
  }
}

function drawThief(ctx, t, time) {
  // soft shadow of stealth: a faint circle while sneaking
  if (t.sneaking) {
    ctx.fillStyle = 'rgba(120, 180, 255, 0.10)';
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius + 10, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#20242c';
  ctx.beginPath();
  ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = t.inVent ? '#8a8f98' : '#e8e8e8';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  // hood + eyes in the facing direction
  ctx.fillStyle = '#e8e8e8';
  ctx.beginPath();
  ctx.arc(t.x + Math.cos(t.facing) * 5, t.y + Math.sin(t.facing) * 5, 4, 0, Math.PI * 2);
  ctx.fill();
  // lockpick progress ring
  if (t.picking) {
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius + 8, -Math.PI / 2, -Math.PI / 2 + (t.pickProgress / 2) * Math.PI * 2);
    ctx.stroke();
  }
  // click-to-move marker
  if (t.target) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(t.target.x, t.target.y, 8 + Math.sin(time * 6) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawSmoke(ctx, clouds, time) {
  for (const c of clouds) {
    const alpha = Math.min(0.75, (c.until - time) / 1.5);
    ctx.fillStyle = `rgba(200, 200, 210, ${Math.max(0.15, alpha)})`;
    ctx.beginPath();
    ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(160,160,175,0.5)';
    ctx.beginPath();
    ctx.arc(c.x - 20, c.y + 10, c.radius * 0.5, 0, Math.PI * 2);
    ctx.arc(c.x + 24, c.y - 12, c.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHud(ctx, s) {
  // top bar
  ctx.fillStyle = 'rgba(10, 8, 6, 0.82)';
  ctx.fillRect(0, 0, WORLD.w, 46);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE VELVET VAULT', 16, 29);
  // alarm meter
  const ax = 260;
  const aw = 340;
  ctx.fillStyle = '#333';
  ctx.fillRect(ax, 14, aw, 18);
  const frac = Math.min(1, s.alarm / ALARM_LOCKDOWN);
  ctx.fillStyle = frac > 0.66 ? '#ff3b30' : frac > 0.33 ? '#ff9500' : '#ffd60a';
  ctx.fillRect(ax, 14, aw * frac, 18);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(ax, 14, aw, 18);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(s.lockdown ? 'LOCKDOWN!' : `ALARM ${Math.floor(s.alarm)}%`, ax + aw + 12, 29);
  // loot + timer + tools
  const mins = Math.floor(Math.max(0, s.timeLeft) / 60);
  const secs = Math.floor(Math.max(0, s.timeLeft) % 60);
  ctx.textAlign = 'right';
  ctx.fillText(`LOOT $${s.thief.lootValue.toLocaleString('en-US')}`, 1080, 29);
  ctx.fillText(`${mins}:${String(secs).padStart(2, '0')}`, 1180, 29);
  // bottom bar: tools and objective
  ctx.fillStyle = 'rgba(10, 8, 6, 0.82)';
  ctx.fillRect(0, WORLD.h - 34, WORLD.w, 34);
  ctx.textAlign = 'left';
  ctx.fillStyle = '#ffd94a';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    `Smoke [Q] x${s.thief.smokeLeft}    EMP [F] x${s.thief.empLeft}    Sneak [Shift]    Pick lock [hold E]    Restart [R]`,
    16, WORLD.h - 12,
  );
  ctx.textAlign = 'right';
  ctx.fillStyle = s.thief.hasCrown ? '#7dffa8' : '#fff';
  ctx.fillText(s.thief.hasCrown ? 'Crown secured — reach the EXIT!' : 'Objective: steal the Crown Jewel, then escape', WORLD.w - 16, WORLD.h - 12);
  // alarm vignette when hot
  if (s.alarm > 50) {
    const a = ((s.alarm - 50) / 50) * 0.22 * (0.7 + Math.sin(s.time * 6) * 0.3);
    ctx.fillStyle = `rgba(255, 30, 20, ${a})`;
    ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  }
}

function overlay(ctx, title, lines, accent, hint) {
  ctx.fillStyle = 'rgba(8, 6, 5, 0.78)';
  ctx.fillRect(0, 0, WORLD.w, WORLD.h);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px sans-serif';
  ctx.fillText(title, WORLD.w / 2, 280);
  ctx.fillStyle = '#fff';
  ctx.font = '17px sans-serif';
  lines.forEach((l, i) => ctx.fillText(l, WORLD.w / 2, 330 + i * 30));
  ctx.fillStyle = '#ffd94a';
  ctx.font = '15px sans-serif';
  ctx.fillText(hint, WORLD.w / 2, 330 + lines.length * 30 + 24);
}

export function render(ctx, s) {
  drawFloor(ctx);
  drawVents(ctx);
  drawExit(ctx, s.time);
  drawWalls(ctx);
  drawLoot(ctx, s.loot, s.time);
  for (const cam of s.cameras) drawCamera(ctx, cam, s.time);
  for (const g of s.guards) drawGuard(ctx, g, s.time);
  drawSmoke(ctx, s.smoke, s.time);
  drawThief(ctx, s.thief, s.time);
  drawHud(ctx, s);
  if (s.phase === 'title') {
    overlay(ctx, 'THE VELVET VAULT', [
      'One thief. One gallery. One Crown Jewel.',
      'Sneak past the guards, dodge the cameras, crack the case,',
      'and slip out the service exit before the police arrive.',
      'WASD / arrows to move — Shift to sneak — click to walk there.',
    ], '#ffd94a', 'Click or press any key to begin the heist');
  } else if (s.phase === 'win') {
    overlay(ctx, 'CLEAN GETAWAY', [
      `Loot: $${s.thief.lootValue.toLocaleString('en-US')} across ${s.thief.lootTaken} piece${s.thief.lootTaken === 1 ? '' : 's'}`,
      `Time left: ${Math.floor(s.timeLeft / 60)}:${String(Math.floor(s.timeLeft % 60)).padStart(2, '0')} — time bonus $${Math.floor(s.timeLeft) * 10}`,
      `Final score: $${(s.thief.lootValue + Math.floor(s.timeLeft) * 10).toLocaleString('en-US')}`,
    ], '#7dffa8', 'Press R to play again');
  } else if (s.phase === 'lose') {
    overlay(ctx, s.loseReason === 'time' ? 'THE POLICE ARRIVED' : 'BUSTED!', [
      s.loseReason === 'time'
        ? 'Five minutes are up. The gallery is surrounded.'
        : 'A guard got hands on you. The vault keeps its jewels tonight.',
      `Loot dropped: $${s.thief.lootValue.toLocaleString('en-US')} — the Crown Jewel was ${s.thief.hasCrown ? 'in your pocket' : 'still in its case'}.`,
    ], '#ff3b30', 'Press R to try again');
  }
}
