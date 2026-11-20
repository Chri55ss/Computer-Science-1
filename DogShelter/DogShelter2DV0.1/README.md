# DogShelter2DV0.1

The Dog Shelter game as a **2D Python game with graphics**, made with pygame.
It looks like DogShelterWeb0.2 and uses the **same rules as DogShelterV0.5**.

## How to run it

1. Install pygame once (if you haven't already):

   ```powershell
   pip install pygame-ce
   ```

2. From this folder, run:

   ```powershell
   python main.py
   ```

A game window opens. You can resize it, and the game scales to fit.

## How to play

- **New Game** on the title screen starts a game.
- The **yards** fill the main screen. Use **<** **>** or the yard buttons to
  slide between the Small, Medium and Large Dog Yards and watch the dogs walk
  around. Each yard only holds so many dogs (Small 4, Medium 4, Large 3).
- **Click a dog** (in the yard or on its card) to see its stats. You only see
  a symptom, so pick the treatment you think it needs:
  Feed $5, Medicate $25, Play $0, Vet $40, Comfort $5.
  Right = happier dog and +1 review. Wrong = -1 review.
- **Front Desk** (Morning only): **Accept** or **Decline** each offer. Every
  offer uses one of the day's slots. You can't accept a dog if its yard is full.
- **Play sessions**: every dog in that yard gets +5 happiness, once per yard
  per day.
- **End Shift** moves Morning -> Noon -> Night. After the night you get an
  end-of-day report.
- **=** opens the menu (How to Play, Retire & see results, Quit).
  **Esc** also opens and closes it.

## How the code is organized

The **rules** are the same files as DogShelterV0.5, copied in unchanged:

| File | What it does |
|---|---|
| `dog.py` | The `Dog` class |
| `yard.py` | The `Yard` class (owns its `Dog` objects) |
| `game_data.py` | The `game` dict, the yards, the dog list, balance numbers |
| `care.py`, `intake.py`, `intake_events.py`, `events.py`, `tips.py`, `upgrades.py` | The game rules |

New files for the graphics:

| File | What it does |
|---|---|
| `main.py` | Opens the window and runs the game loop (60 frames a second) |
| `actions.py` | The bridge between the screens and the rules. The rule files use `print()` and `input()`; this file catches what they print (for the Shelter Log) and does intake and treatment with button clicks instead of `input()`, with the same rules. |
| `screens.py` | The title screen, the game screen, and the pop-up windows |
| `yard_view.py` | Draws the yards (grass, fence, gate, path, plants) and the walking dogs |
| `widgets.py` | Colors, fonts, boxes, text and buttons |
| `assets.py` | Loads the sprite sheets and yard art |
| `sprites/`, `assets/yard/` | The pixel art (same as the web version) |

## Not in this version yet

These are in DogShelterWeb0.2 but not here yet: the upgrade shop (intake
slots, yard expansion, muzzles, training treats), staff, toys, night chores,
the fence and hole mini-games, and saving / Continue.
