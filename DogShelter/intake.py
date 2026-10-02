import random

from game_data import game, dogs, available_dogs
from intake_events import resolve_intake_event


def process_dog_intake():

    if game["dogs_processed_today"] >= game["capacity"]:
        print("Shelter is full today.")
        return

    if not available_dogs:
        print("There are no more dogs in the directory to offer.")
        return

    candidate = random.choice(available_dogs)
    print("\n=== DOG INTAKE OFFER ===")
    print("Name:", candidate["name"])
    print("Breed:", candidate["breed"])
    print("Weight:", candidate["weight"], "lbs")
    print("Age:", candidate["age"])
    print("Energy:", candidate["energy"])

    if candidate["weight"] < 20:
        yard = "Small Dog Yard"
    elif candidate["weight"] < 50:
        yard = "Medium Dog Yard"
    else:
        yard = "Large Dog Yard"

    dog = dict(candidate, yard=yard)

    money_earned = round(dog["weight"] * 1.50, 2)

    print("Assigned Yard:", dog["yard"])
    print("Pay for accepting: ${:.2f}".format(money_earned))
    print("Risk: 25% chance of $25 damage, 50% chance of no effect,")
    print("or 25% chance of a $10 donation.")

    while True:
        answer = input("Accept this dog? (yes/no): ").strip().lower()
        if answer in ("yes", "no"):
            break
        print("Please answer yes or no.")

    available_dogs.remove(candidate)
    if answer == "no":
        print("Dog was not accepted.")
        return

    dogs.append(dog)

    game["money"] += money_earned
    game["dogs_processed_today"] += 1
    game["total_dogs"] += 1

    print("Dog processed.")
    print("Earned ${:.2f}".format(money_earned))
    resolve_intake_event(dog)
