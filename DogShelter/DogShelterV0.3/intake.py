import random

from game_data import (
    game, dogs, available_dogs,
    BASE_PAY_PER_POUND, REVIEW_PAY_STEP, MIN_PAY_PER_POUND, MAX_PAY_PER_POUND,
)
from intake_events import resolve_intake_event


def pay_per_pound():
    """Better reviews mean owners pay more per pound; bad reviews mean less."""
    rate = BASE_PAY_PER_POUND + game["reviews"] * REVIEW_PAY_STEP
    rate = max(MIN_PAY_PER_POUND, min(MAX_PAY_PER_POUND, rate))
    return rate + game.get("money_per_pound_bonus", 0)


def process_dog_intake():

    if game["shift"] != 0:
        print("Dogs can only be taken in during the Morning Intake shift.")
        return

    if game["intakes_today"] >= game["daily_intake_limit"]:
        print("Today's intake offers are used up.")
        return

    if not available_dogs:
        print("There are no more dogs available for intake.")
        return

    candidate = random.choice(available_dogs)

    if candidate["weight"] < 20:
        yard = "Small Dog Yard"
    elif candidate["weight"] < 50:
        yard = "Medium Dog Yard"
    else:
        yard = "Large Dog Yard"

    dog = dict(
        candidate,
        yard=yard,
        status="healthy",
        issue_days=0,
        happiness=50,
        stay_days=random.randint(1, 3),
    )

    rate = pay_per_pound()
    care_payment = round(dog["weight"] * rate * dog["stay_days"], 2)
    dog["care_payment"] = care_payment

    print("\n" + "=" * 38)
    print("          DOG INTAKE OFFER")
    print("=" * 38)
    print("DOG")
    print("  Name:       {}".format(dog["name"]))
    print("  Breed:      {}".format(dog["breed"]))
    print("  Age:        {} years".format(dog["age"]))
    print("  Weight:     {} lbs".format(dog["weight"]))
    print("  Energy:     {}".format(dog["energy"].title()))
    print("-" * 38)
    print("CARE PLAN")
    print("  Assigned yard: {}".format(dog["yard"]))
    print("  Stay:          {} day(s)".format(dog["stay_days"]))
    print("  Pay rate:      ${:.2f}/lb per day".format(rate))
    print("  Payment at checkout: ${:.2f}".format(care_payment))
    print("  (Happy dogs pay more; unhappy or sick dogs pay less.)")
    print("=" * 38)

    while True:
        answer = input("Accept this dog? (yes/no): ").strip().lower()
        if answer in ("yes", "no"):
            break
        print("Please answer yes or no.")

    # Every offer uses one of today's intake slots, accepted or not.
    game["intakes_today"] += 1

    if answer == "no":
        print("Dog was not accepted. Offers used: {}/{}.".format(
            game["intakes_today"], game["daily_intake_limit"]
        ))
        return

    available_dogs.remove(candidate)
    dogs.append(dog)
    game["total_dogs"] += 1

    print("{} joined the shelter. Offers used: {}/{}.".format(
        dog["name"], game["intakes_today"], game["daily_intake_limit"]
    ))
    resolve_intake_event(dog)
