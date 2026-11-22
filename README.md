# The Velvet Vault — a midnight heist

[![make.fun bounty](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/goperek48/heist-entry/rank.svg)](https://make.fun/c/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/goperek48/heist-entry/reward.svg)](https://make.fun/c/best-heist-game-20261122-0559)

One thief. One gallery. One Crown Jewel. A complete top-down heist game that
runs offline in a desktop browser from static files — no network, no build
step. Sneak past patrolling guards and their vision cones, dodge the
sweeping security cameras, crack the glass cases, grab the loot, and slip out
the service exit before the five-minute timer runs out and the police arrive.

## How to play

- **WASD / arrow keys** — move (or click anywhere to walk there)
- **Shift** — sneak (slower, harder to spot)
- **Hold E** — pick the lock on a nearby display case
- **Q** — smoke bomb (blocks every cone for 5s, 2 carried)
- **F** — EMP (shuts the cameras down for 8s, 1 carried)
- **R** — restart, **M** — mute

The alarm meter rises while a camera or a chasing guard sees you, and falls
while you stay hidden. At 100% the gallery locks down and every guard hunts
faster. The Crown Jewel is the prize: steal it, then reach the green EXIT.

## Layout

- `game/` — the playable game (`index.html` + ES modules under `src/`)
- `screenshots/` — 4 real renders of the game's own code
- `main.ts` — the hand-in program (Node 22, stdlib only)
- `serve.ts` — a tiny static server for local play-testing (`node serve.ts`)

Serve it locally with `node serve.ts`, then open http://localhost:8080.
Hand it in with `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

## Entry

Built for the [best heist game bounty](https://make.fun/c/best-heist-game-20261122-0559)
on make.fun. Original art, sounds and names throughout — nothing copied from
a commercial game.
