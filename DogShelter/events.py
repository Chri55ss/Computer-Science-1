import random
from game_data import game, dogs, SHIFTS
from tips import offer_end_of_day_tip
from care import finish_day_care, start_day_care
from upgrades import next_poundage_effect

def random_event():

    event = random.randint(1, 20)

    print("\n=== SHIFT EVENT ===")

    if event == 1:
        print("A donor gave $75.")
        game["money"] += 75

    elif event == 2:
        print("Community fundraiser earned $150.")
        game["money"] += 150

    elif event == 3:
        print("Fence repairs cost $50.")
        game["money"] -= 50

    elif event == 4:
        print("Kennel maintenance cost $100.")
        game["money"] -= 100

    elif event == 5:
        print("Several toys were donated.")

    elif event == 6:
        print("Local news featured the shelter.")
        game["money"] += 125

    elif event == 7:
        print("Nothing special happened this shift.")

    elif event == 8:
        print("Storm cleanup cost $80.")
        game["money"] -= 80

    elif event == 9:
        print("Celebrity donation!")
        game["money"] += 300

    elif event == 10:
        print("A water pipe burst.")
        game["money"] -= 150

    elif event == 11:
        print("Volunteer appreciation day.")

    elif event == 12:
        print("Food supplier discount.")
        game["money"] += 50

    elif event == 13:
        print("Broken kennel gate.")
        game["money"] -= 40

    elif event == 14:
        print("Grant approved!")
        game["money"] += 250

    elif event == 15:
        print("The dogs had a peaceful shift.")

    elif event == 16:
        print("A volunteer increased the daily intake limit.")
        game["daily_intake_limit"] += 1

    elif event == 17:
        print("Adoption fair raised awareness.")
        game["money"] += 100

    elif event == 18:
        print("Power outage repairs cost $60.")
        game["money"] -= 60

    elif event == 19:
        print("Jackpot donation!")
        game["money"] += 500

    else:
        energetic_dogs = [
            dog for dog in dogs
            if dog.get("energy") == "high" and not dog.get("trained", False)
        ]
        if energetic_dogs:
            dog = random.choice(energetic_dogs)
            print("{} dug a giant hole. Repairs cost $25.".format(dog["name"]))
            game["money"] -= 25
        else:
            print("The shelter avoided damage; no untrained high-energy dogs.")


def shift_event():
    if random.randint(1, 100) <= 25:
        random_event()
    else:
        print("\nNo special event this shift.")


def end_day():
    finish_day_care()

    effect = game.get("money_per_pound_effect")
    if effect:
        effect_name, effect_description = effect
        if random.random() < 0.25:
            if effect_name == "review":
                game["reviews"] -= 1
                print("Per-pound upgrade trade-off: -1 review.")
            elif effect_name == "repairs":
                game["money"] -= 50
                print("Per-pound upgrade trade-off: $50 repair bill.")
            elif effect_name == "supplies":
                game["money"] -= 30
                print("Per-pound upgrade trade-off: $30 supply expense.")

    for dog in dogs[:]:
        dog["stay_days"] -= 1
        if dog["stay_days"] <= 0:
            game["money"] += dog["care_payment"]
            print(
                "{} completed their stay. Shelter received ${:.2f}.".format(
                    dog["name"], dog["care_payment"]
                )
            )
            dogs.remove(dog)

    offer_end_of_day_tip()
    game["day"] += 1
    game["intakes_today"] = 0
    game["shift"] = 0
    if effect:
        game["money_per_pound_effect"] = next_poundage_effect(effect)
        print("Today's per-pound upgrade trade-off: {}"
              .format(game["money_per_pound_effect"][1]))
    print("\nWelcome to Day", game["day"])
    start_day_care()


def end_shift():
    shift_event()

    if game["shift"] == len(SHIFTS) - 1:
        end_day()
    else:
        game["shift"] += 1
        print("\nStarting", SHIFTS[game["shift"]])
