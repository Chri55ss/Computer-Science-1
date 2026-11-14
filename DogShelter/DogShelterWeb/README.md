# DogShelterWeb

A browser version of the Dog Shelter game, ported from **DogShelterV0.4**.
Plain HTML, CSS and JavaScript: no frameworks, no build step, no server.

## How to run it

1. Download or clone this folder (`index.html`, `style.css` and `game.js` must
   stay together).
2. **Double-click `index.html`.** It opens in your web browser and works
   offline.

That's it. Any modern browser works (Chrome, Edge, Firefox, Safari).

## How to play

- Press **New Game** on the title screen.
- The **assigned yards** fill the main screen: the **Small**, **Medium** and
  **Large Dog Yard**. Use the **◀ ▶** arrows or the yard buttons to slide from
  one yard to the next and watch the dogs walk around. Each dog goes in the yard
  for its weight (under 20 lbs, 20-49 lbs, 50 lbs and up).
- **Click a dog** (in the yard or on its card under the yard) to see its stats
  and give care. You only see symptoms, so pick the treatment you think it needs:

  | Treatment | Cost |
  |-----------|------|
  | 🍖 feed     | $5  |
  | 💊 medicate | $25 |
  | 🎾 play     | $0  |
  | 🩺 vet      | $40 |
  | 🧸 comfort  | $5  |

  Right treatment: the dog gets happier and you get +1 review. Wrong: -1 review.
- The **🛎️ Front Desk** panel shows intake offers during **Morning Intake**.
  Every offer uses one of the day's slots, whether you press **Accept** or
  **Decline**.
- **🛒 Upgrades** opens the shop: more intake slots, the per-pound upgrade,
  muzzles and training treats.
- **End Shift** moves Morning → Noon → Night. After the night shift you get an
  end-of-day report (upkeep, checkouts, tips) and the next day starts.
- Dogs pay when they check out, but each dog costs **$0.40 per pound per day**.
  End two days in a row in debt and the shelter closes.
- **☰** opens the pause menu (How to Play, or Retire to see your final stats).

## Code layout

`game.js` is split into sections:

1. **CONFIG**: every balance number in one object at the top of the file.
2. **DATA**: the 100 dogs, intake events and symptoms, copied from the Python
   game.
3. **`Dog` class**: mirrors `dog.py` (`describeCondition`, `giveIssue`,
   `treat`, `applyUntreatedDay`).
4. **GAME RULES**: ported from `intake.py`, `care.py`, `events.py`,
   `upgrades.py` and `tips.py`. Money and review changes stay here, not in
   `Dog`.
5. **PIXEL ART**: each dog is drawn from an 18x13 pixel map in its breed's
   colors, with walking, lying-down and muzzle versions.
6. **UI**: title screen, yards, cards, Front Desk, modals and the shift banners.

## Differences from the Python version

- Morning **intake events** are shown on the Front Desk instead of printed.
- The end of night is split into an **end-of-day report** and a new-day banner.
  The rules and their order are the same as `end_day()` in `events.py`.
- If you end the morning with an offer still on the desk, that offer goes away
  without using a slot (just like never choosing "Process Dog Intake").
