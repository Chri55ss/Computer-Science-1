import random

from game_data import game


def offer_end_of_day_tip():
    print("\n=== END-OF-DAY TIPS ===")

    if random.randint(1, 100) <= 50:
        tip = random.randint(5, 25)
        game["money"] += tip
        print("A visitor left a ${:.2f} tip.".format(tip))
    else:
        print("No one left a tip today.")
