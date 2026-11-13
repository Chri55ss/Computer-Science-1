# DogShelterV0.3

Run the game from this folder:

```powershell
python dog_shelter_game_better.py
```

## How to play

Each day has three shifts: **Morning Intake**, **Noon Shift**, and **Night Shift**.
Dogs can only be taken in during the morning. Every intake offer uses one of
the day's slots, whether you accept the dog or not, so choose carefully.

Dogs pay when they check out, but every dog in the shelter costs **$0.40 per
pound per day** in upkeep. If the shelter ends a day in debt you get a warning;
ending a **second day in a row** in debt closes the shelter and ends the game.

### Caring for dogs

Use **Check Dogs** (or **View Dog Database**) to see how each dog is doing.
You only see symptoms, like "is limping on one paw" or "won't touch any of the
toys", so you have to work out what the dog needs. Treatments cost money:

| Treatment | Cost |
|-----------|------|
| feed      | $5   |
| medicate  | $25  |
| play      | $0   |
| vet       | $40  |
| comfort   | $5   |

A correct treatment makes the dog happier and earns a review. A wrong one
still costs money and loses a review. Press Enter at the treatment prompt to
cancel.

### Why care matters

- **Happiness changes the checkout payment.** Happiness 50 pays the full
  price, 100 pays 150%, and 0 pays only 50%. A dog that leaves still unwell
  pays 25% less and costs a review.
- **Reviews change the pay rate.** Every review point adds or removes $0.05
  per pound (from $0.75 up to $2.50) on new intake offers.
- **Upset dogs bite.** Stressed, injured, or very unhappy dogs can bite a
  volunteer ($50 and -2 reviews). A **muzzle** ($30) prevents this.

Dogs that finish their stay can come back for another visit later.

## What changed from V0.2

- Daily upkeep per dog, and the game ends if the shelter stays in debt.
- Happiness and reviews now affect how much money you earn.
- Rejecting an offer uses up an intake slot (no more free rerolls).
- Intake only happens during the morning shift.
- Treatments cost money and show symptoms instead of the status name.
- Muzzles prevent bites instead of hiding review penalties.
- Big donation events are smaller ($500 -> $200, $300 -> $150, and others).
- Dogs return to the intake pool after checkout, so the game never runs out.
- You can cancel out of the treatment prompt.
- Ctrl+C / Ctrl+D quits cleanly instead of crashing.
- Final stats show days *completed*.
- Removed the unused `daily_events2.txt`.
- Balance numbers live at the top of `game_data.py` so they're easy to tune.
