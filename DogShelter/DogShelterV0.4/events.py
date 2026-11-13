import random
from game_data import (
    game, dogs, SHIFTS, available_dogs, dog_directory, UPKEEP_PER_POUND,
)
from tips import offer_end_of_day_tip
from care import finish_day_care, start_day_care
from upgrades import next_poundage_effect

def random_event():

    event = random.randint(1, 20)

    print("\n=== SHIFT EVENT ===")

    if event == 1:
        print("A donor gave $50.")
        game["money"] += 50

    elif event == 2:
        print("Community fundraiser earned $100.")
        game["money"] += 100

    elif event == 3:
        print("Fence repairs cost $50.")
        game["money"] -= 50

    elif event == 4:
        print("Kennel maintenance cost $100.")
        game["money"] -= 100

    elif event == 5:
        print("Several toys were donated. Every dog is a little happier.")
        for dog in dogs:
            dog.happiness = min(100, dog.happiness + 5)

    elif event == 6:
        print("Local news featured the shelter. Donations: $75.")
        game["money"] += 75

    elif event == 7:
        print("Nothing special happened this shift.")

    elif event == 8:
        print("Storm cleanup cost $80.")
        game["money"] -= 80

    elif event == 9:
        print("Celebrity donation of $150!")
        game["money"] += 150

    elif event == 10:
        print("A water pipe burst. Repairs cost $120.")
        game["money"] -= 120

    elif event == 11:
        print("Volunteer appreciation day. +1 review.")
        game["reviews"] += 1

    elif event == 12:
        print("Food supplier discount saved $40.")
        game["money"] += 40

    elif event == 13:
        print("Broken kennel gate cost $40.")
        game["money"] -= 40

    elif event == 14:
        print("Grant approved for $120!")
        game["money"] += 120

    elif event == 15:
        print("The dogs had a peaceful shift.")

    elif event == 16:
        print("A volunteer increased the daily intake limit.")
        game["daily_intake_limit"] += 1

    elif event == 17:
        print("Adoption fair raised $60.")
        game["money"] += 60

    elif event == 18:
        print("Power outage repairs cost $60.")
        game["money"] -= 60

    elif event == 19:
        print("Big donation of $200!")
        game["money"] += 200

    else:
        energetic_dogs = [
            dog for dog in dogs
            if dog.energy == "high" and not dog.trained
        ]
        if energetic_dogs:
            dog = random.choice(energetic_dogs)
            print("{} dug a giant hole. Repairs cost $25.".format(dog.name))
            game["money"] -= 25
        else:
            print("The shelter avoided damage; no untrained high-energy dogs.")


def check_for_bites():
    """Stressed, injured, or very unhappy dogs may bite unless muzzled."""
    for dog in dogs:
        upset = (
            dog.status in ("stressed", "injured")
            or dog.happiness < 25
        )
        if upset and not dog.muzzled and random.random() < 0.15:
            print("\n=== BITE INCIDENT ===")
            print("{} bit a volunteer! Medical bill $50, reviews -2.".format(
                dog.name
            ))
            game["money"] -= 50
            game["reviews"] -= 2


def shift_event():
    if random.randint(1, 100) <= 25:
        random_event()
    else:
        print("\nNo special event this shift.")
    check_for_bites()


def checkout_payment(dog):
    """Happiness 50 pays the full price; 100 pays 150%, 0 pays 50%."""
    multiplier = 0.5 + dog.happiness / 100
    payment = dog.care_payment * multiplier
    if dog.status != "healthy":
        payment *= 0.75
    return round(payment, 2)


def pay_daily_upkeep():
    if not dogs:
        return
    upkeep = round(sum(dog.weight for dog in dogs) * UPKEEP_PER_POUND, 2)
    game["money"] -= upkeep
    print("Daily upkeep for {} dog(s): -${:.2f}".format(len(dogs), upkeep))


def check_out_dogs():
    for dog in dogs[:]:
        dog.stay_days -= 1
        if dog.stay_days > 0:
            continue

        payment = checkout_payment(dog)
        game["money"] += payment
        print("{} completed their stay (happiness {}). Shelter received ${:.2f}."
              .format(dog.name, dog.happiness, payment))
        if dog.status != "healthy":
            game["reviews"] -= 1
            print("The owner picked up {} still unwell: -25% pay, reviews -1."
                  .format(dog.name))
        dogs.remove(dog)

        # The dog can come back for another stay later.
        for original in dog_directory:
            if original["name"] == dog.name:
                available_dogs.append(original)
                break


def end_day():
    print("\n=== END OF DAY {} ===".format(game["day"]))
    finish_day_care()
    pay_daily_upkeep()

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

    check_out_dogs()
    offer_end_of_day_tip()

    if game["money"] < 0:
        game["days_in_debt"] += 1
        if game["days_in_debt"] >= 2:
            print("\nThe shelter ended a second day in a row in debt "
                  "(${:.2f}) and had to close.".format(-game["money"]))
            game["game_over"] = True
            return
        print("\nWARNING: The shelter is ${:.2f} in debt! Get back above $0 "
              "by the end of tomorrow or the shelter will close."
              .format(-game["money"]))
    else:
        game["days_in_debt"] = 0

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
