import random

from game_data import game


def resolve_intake_event(dog):
    outcome = random.randint(1, 100)

    print("\n=== INTAKE OUTCOME ===")

    if outcome <= 25:
        cost = 25
        game["money"] -= cost
        print("{} damaged a kennel. Repairs cost ${:.2f}.".format(dog["name"], cost))
    elif outcome <= 75:
        print("{} settled in without any trouble.".format(dog["name"]))
    else:
        donation = 10
        game["money"] += donation
        print("{} charmed a visitor, who donated ${:.2f}.".format(dog["name"], donation))
