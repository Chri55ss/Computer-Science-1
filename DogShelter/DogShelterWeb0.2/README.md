# DogShelterWeb0.2

A browser version of the Dog Shelter game, built on **DogShelterWeb0.1**.
Plain HTML, CSS and JavaScript: no frameworks, no build step, no server.

## How to run it

1. Download or clone this whole folder. Keep the files and the `sprites/` and
   `assets/` folders together.
2. **Double-click `index.html`.** It opens in your web browser and works
   offline.

The game **saves itself** as you play. Next time, press **💾 Continue** on the
title screen to pick up where you left off. Saves are stored in the browser,
so use the same browser you played in.

## How to play

Each day has three shifts. Press **End Shift** to move on.

| Shift | What you do |
|---|---|
| 🌅 **Morning Intake** | The **Front Desk** offers dogs. Every offer uses one of the day's slots, whether you **Accept** or **Decline**. A dog can only go in its yard if there's room. |
| ☀️ **Noon** | **Walks** (+12 happiness for one dog) and **play sessions** (+5 for a whole yard). Only 3 fit in a shift. Exercised dogs are much less likely to bite or dig for the rest of the day. |
| 🌙 **Night** | **Feed** and **clean** each yard. Only 4 chores fit in a night. Skip feeding and dogs can go to bed hungry; skip cleaning and they can wake up sick. |

- **The yards**: the Small, Medium and Large Dog Yards fill the main screen.
  Use **◀ ▶** or the yard buttons to slide between them. Each tab shows how
  full the yard is (for example `2/3`).
- **Care**: click a dog to see its stats. You only see symptoms, so pick the
  treatment you think it needs: 🍖 feed $5, 💊 medicate $25, 🎾 play $0,
  🩺 vet $40, 🧸 comfort $5.
- **Trouble**: restless, untrained high-energy dogs can **break the fence** or
  **dig a hole and get stuck**. Click it in the yard to fix it yourself in a
  mini-game. If it's still broken at night, you pay for it.
- **Money**: dogs pay when they check out. Each dog costs $0.40 per pound per
  day, and staff are paid every night. End two days in a row in debt and the
  shelter closes.

## Mini-games

**🔨 Fix the fence**: drag the fallen panel back into the gap between the
posts, then hammer in all 4 nails (3 hits each). Every hit shakes the screen,
with sparks, wood chips and a "BANG!".

**🕳️ Rescue the dog**: drag the dog up out of the hole. It pops out, gets a
fright (a "!" bubble, shock lines and a little hop), then walks away. Then
click the dirt pile to throw dirt into the hole until it's filled.

## 🛒 Upgrades

- **Yard space**: +2 spaces for one yard. Each expansion of the same yard costs
  50% more.
- **Staff & volunteers** (paid every night, and you can let them go any time):
  - 🩺 **Vet Tech** ($40/day): every morning, treats the dog that has been
    unwell the longest. You still pay for the treatment.
  - 🦮 **Dog Walker** ($30/day): every noon, walks the 2 least happy dogs
    without using your slots.
  - 🧹 **Kennel Hand** ($25/day): every night, feeds and cleans every yard.
- **🧸 Browse toys**: 7 toys for each yard, made to fit that yard's dogs. A
  toy shows up in its yard in a **random spot**, so it's in a different place
  every game. Toys only help the dogs in their own yard.

| Toy | Effect |
|---|---|
| Bed | +2 happiness each night; untreated issues hurt half as much |
| Ball | +2 happiness after every shift |
| Chew toy | 60% fewer broken fences and holes |
| Water | 40% less likely to get sick or hungry |
| Dog house | 60% less likely to bite |
| Play gear | Walks and play sessions give 50% more happiness |
| Plush | +3 happiness every morning; happy dogs leave more reviews |

**Happy dogs earn reviews**: at night, every dog with 80+ happiness has a
25% chance (45% with a plush in its yard) of getting its owner to leave a
review. Reviews raise the pay rate for new dogs.

## Files

| File | What's in it |
|---|---|
| `index.html` | The page layout |
| `style.css` | All the styles and animations |
| `game.js` | **Rules**: `CONFIG` (every balance number), the data, the `Dog` class, shifts, yards, staff, toys, incidents, saving |
| `yard.js` | **Drawing the yards**: grass, fence, gate, plants, butterflies, toys, holes, walking dogs |
| `minigames.js` | The fence and hole mini-games |
| `ui.js` | Screens, panels, windows and the click handler |
| `sprites/` | The 31 dog sprite sheets and the muzzle (from 0.1) |
| `assets/yard/` | Grass, fence, plant and toy art (see `assets/yard/manifest.json`) |
| `assets/fx/` | Mini-game art drawn to match: hammer, nail, holes, dirt pile, dirt clump, "!" bubble, shock lines, impact star, dust, wood chips, broken fence |

## What changed from DogShelterWeb0.1

- **Shift actions**: walks and play sessions at noon, feeding and cleaning at
  night, each with a limited number of slots.
- **Yard capacity**: each yard holds a limited number of dogs (Small 4,
  Medium 4, Large 3), and you can expand them in Upgrades.
- **Staff**: Vet Tech, Dog Walker and Kennel Hand, with daily wages.
- **Broken fences and holes**, with their two mini-games.
- **Toys**: a toy shop with 21 toys and their effects; bought toys appear in
  the yards.
- **Happy dogs earn reviews** at night.
- **Detailed yards**: tiled grass with flowers, a real fence with posts, hearts
  and a gate that opens when a dog arrives, a dirt path, swaying plants and
  butterflies.
- **Save & Continue**: automatic saving, a Save button in the ☰ menu, and
  Continue on the title screen.
- The old "dug a giant hole: $25" event now starts the hole or fence mini-game
  instead.
