import random

from game_data import game, dogs, available_dogs
from intake_events import resolve_intake_event


def process_dog_intake():

    if game["intakes_today"] >= game["daily_intake_limit"]:
        print("Today's intake limit has been reached.")
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

    payment_per_pound = 1.50 + game.get("money_per_pound_bonus", 0)
    care_payment = round(
        dog["weight"] * payment_per_pound * dog["stay_days"], 2
    )
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
    print("  Payment at checkout: ${:.2f}".format(care_payment))
    print("=" * 38)

    while True:
        answer = input("Accept this dog? (yes/no): ").strip().lower()
        if answer in ("yes", "no"):
            break
        print("Please answer yes or no.")

    if answer == "no":
        print("Dog was not accepted.")
        return

    available_dogs.remove(candidate)
    dogs.append(dog)

    game["intakes_today"] += 1
    game["total_dogs"] += 1

    print("{} joined the shelter. Intake {}/{} today.".format(
        dog["name"], game["intakes_today"], game["daily_intake_limit"]
    ))
    resolve_intake_event(dog)
