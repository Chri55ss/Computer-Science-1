import random

from game_data import game, dogs


POUNDAGE_EFFECTS = [
    ("review", "25% chance of losing 1 review at day end."),
    ("repairs", "25% chance of a $50 repair bill at day end."),
    ("supplies", "25% chance of a $30 supply expense at day end."),
]


def next_poundage_effect(current_effect):
    available_effects = [
        effect for effect in POUNDAGE_EFFECTS if effect != current_effect
    ]
    return random.choice(available_effects)


def _select_dog(action):
    if not dogs:
        print("There are no dogs in the shelter to {}.".format(action))
        return None

    print("\nChoose a dog to {}:".format(action))
    for index, dog in enumerate(dogs, start=1):
        print("{}. {} ({})".format(index, dog["name"], dog["breed"]))

    choice = input("Dog number: ").strip()
    if not choice.isdigit():
        print("Enter a dog number from the list.")
        return None

    index = int(choice) - 1
    if index < 0 or index >= len(dogs):
        print("That dog number is not in the list.")
        return None
    return dogs[index]


def _buy_and_use_item(item_name, price, action):
    if game["money"] < price:
        print("Not enough money to buy {}.".format(item_name))
        return

    dog = _select_dog(action)
    if dog is None:
        return
    if item_name == "muzzle" and dog.get("muzzled", False):
        print("{} already has a muzzle.".format(dog["name"]))
        return
    if item_name == "treats" and dog.get("trained", False):
        print("{} has already been trained with treats.".format(dog["name"]))
        return
    if item_name == "treats" and dog["energy"] != "high":
        print("Treat training is only needed for high-energy dogs.")
        return

    game["money"] -= price
    if item_name == "muzzle":
        dog["muzzled"] = True
        print("{} is muzzled; care-related review losses will be blocked."
              .format(dog["name"]))
    else:
        dog["trained"] = True
        dog["energy"] = "calm"
        print("{} was calmed and trained with treats.".format(dog["name"]))


def buy_upgrade():

    print("\n=== UPGRADE SHOP ===")
    print("1. +2 daily intake slots ($100)")
    print("2. +5 daily intake slots ($250)")
    print("3. +10 daily intake slots ($500)")
    print("4. Buy and use a muzzle ($30) - blocks care-related review losses")
    print("5. Buy and use training treats ($20) - calm one high-energy dog")
    effect = game.get("money_per_pound_effect")
    effect_description = effect[1] if effect else "No daily trade-off"
    print("6. Earn +$0.50 per pound at checkout ($200) - Trade-off: {}"
          .format(effect_description))

    choice = input("Choice: ").strip()

    if choice == "1" and game["money"] >= 100:
        game["money"] -= 100
        game["daily_intake_limit"] += 2

    elif choice == "2" and game["money"] >= 250:
        game["money"] -= 250
        game["daily_intake_limit"] += 5

    elif choice == "3" and game["money"] >= 500:
        game["money"] -= 500
        game["daily_intake_limit"] += 10
    elif choice == "4":
        _buy_and_use_item("muzzle", 30, "muzzle")
    elif choice == "5":
        _buy_and_use_item("treats", 20, "train")
    elif choice == "6":
        if game["money_per_pound_bonus"]:
            print("The per-pound upgrade has already been purchased.")
        elif game["money"] < 200:
            print("Not enough money.")
        else:
            game["money"] -= 200
            game["money_per_pound_bonus"] = 0.50
            game["money_per_pound_effect"] = random.choice(POUNDAGE_EFFECTS)
            print("Per-pound upgrade purchased. Today's trade-off: {}"
                  .format(game["money_per_pound_effect"][1]))
    else:
        if choice not in ("1", "2", "3", "4", "5", "6"):
            print("Invalid choice.")
        elif choice in ("1", "2", "3"):
            print("Not enough money.")

    print("Daily intake limit:", game["daily_intake_limit"])
