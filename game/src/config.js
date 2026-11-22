// The Velvet Vault — level configuration.
// One museum gallery, 1280x720 logical pixels. All numbers are in world pixels.
// The room, the loot, the patrols and the cameras are data here so the other
// modules stay about behaviour, not about this one floor plan.
export const WORLD = { w: 1280, h: 720 };

export const TIMER_SECONDS = 300; // five minutes before the police arrive
export const ALARM_LOCKDOWN = 100;
export const WIN_LOOT = 'crown'; // the Crown Jewel must be taken before escaping

// Walls are axis-aligned rectangles. The outer shell is implicit (the room
// border); these are the interior blocks: pillars, display cases, the vault.
export const WALLS = [
  // central pillars
  { x: 560, y: 180, w: 46, h: 46 },
  { x: 560, y: 494, w: 46, h: 46 },
  { x: 820, y: 180, w: 46, h: 46 },
  { x: 820, y: 494, w: 46, h: 46 },
  // display cases (block movement and line of sight)
  { x: 300, y: 120, w: 150, h: 70 },
  { x: 980, y: 120, w: 150, h: 70 },
  { x: 300, y: 530, w: 150, h: 70 },
  { x: 980, y: 530, w: 150, h: 70 },
  // the vault block, top-right corner (the Crown Jewel sits in front of it)
  { x: 1120, y: 40, w: 120, h: 130 },
  // low partitions that break sight lines but not the room's flow
  { x: 640, y: 330, w: 130, h: 24 },
  { x: 420, y: 330, w: 24, h: 110 },
];

// Vents: thin crawl spaces just inside the top and bottom walls (clear of the
// HUD bars at y 0-46 and y 686-720). Inside a vent the thief is hidden from
// every cone and camera, but moves slowly.
export const VENTS = [
  { x: 180, y: 54, w: 760, h: 26 },
  { x: 340, y: 640, w: 600, h: 26 },
];

// Loot targets. value is the score; lockSeconds is the channel time to open
// the case (0 = grab on touch).
export const LOOT = [
  { id: 'crown', name: 'Crown Jewel', x: 1050, y: 235, value: 5000, lockSeconds: 2.0, color: '#ffd94a' },
  { id: 'idol', name: 'Golden Idol', x: 375, y: 300, value: 2500, lockSeconds: 1.2, color: '#ffb347' },
  { id: 'diamond', name: 'Blue Diamond', x: 1055, y: 300, value: 3000, lockSeconds: 1.2, color: '#7fd4ff' },
  { id: 'painting', name: 'Starry Portrait', x: 375, y: 470, value: 2000, lockSeconds: 1.0, color: '#e08cff' },
];

// Entry door (where the thief starts) and the service exit (the escape).
export const ENTRY = { x: 90, y: 620 };
export const EXIT = { x: 90, y: 90, w: 70, h: 60 };

// Guards: patrol waypoints, speed, cone range/width, suspicion thresholds.
export const GUARDS = [
  {
    name: 'Rook', color: '#3f7de0',
    waypoints: [[330, 260], [640, 260], [640, 430], [330, 430]],
    speed: 62, coneRange: 230, coneHalfAngle: 0.61, suspicionRate: 1.6,
  },
  {
    name: 'Bishop', color: '#e05a3f',
    waypoints: [[940, 260], [940, 430], [700, 430], [700, 260]],
    speed: 58, coneRange: 230, coneHalfAngle: 0.61, suspicionRate: 1.6,
  },
  {
    name: 'Knight', color: '#3fd08a',
    waypoints: [[180, 380], [1180, 380]],
    speed: 74, coneRange: 250, coneHalfAngle: 0.58, suspicionRate: 1.9,
  },
];

// Wall-mounted security cameras: fixed position, sweeping cone.
export const CAMERAS = [
  { x: 640, y: 52, baseAngle: Math.PI / 2, sweep: 0.85, sweepSpeed: 0.55, range: 270, halfAngle: 0.5 },
  { x: 52, y: 360, baseAngle: 0, sweep: 0.8, sweepSpeed: 0.7, range: 260, halfAngle: 0.5 },
  { x: 1228, y: 360, baseAngle: Math.PI, sweep: 0.8, sweepSpeed: 0.62, range: 260, halfAngle: 0.5 },
];

// Thief tuning.
export const THIEF = {
  radius: 13,
  walkSpeed: 165,
  sneakSpeed: 88,
  ventSpeed: 55,
  chaseEscapeRadius: 26,
};

// Tools: what the thief carries, and what each one costs.
export const TOOLS = {
  smoke: { count: 2, duration: 5.0, radius: 90, key: 'q' },
  emp: { count: 1, duration: 8.0, key: 'f' },
};

// Colours for the gallery's look: dark marble, brass, velvet.
export const PALETTE = {
  floorA: '#2b2620',
  floorB: '#332c24',
  floorLine: '#453b2e',
  wall: '#171310',
  wallTop: '#4a3b28',
  caseGlass: 'rgba(150, 200, 255, 0.16)',
  caseFrame: '#8a6d2f',
  velvet: '#7a1f2b',
  gold: '#d9a441',
  exitGreen: '#2fae5f',
  alarmRed: '#ff3b30',
};
