import random
from game_data import game

def random_event():

    event = random.randint(1, 20)

    print("\n=== DAILY EVENT ===")

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
        print("Nothing happened today.")

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
        print("The dogs had a peaceful day.")

    elif event == 16:
        print("A volunteer expanded the yard.")
        game["capacity"] += 1

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
        print("A dog dug a giant hole.")
        game["money"] -= 25

def end_day():

    game["day"] += 1
    game["dogs_processed_today"] = 0

    print("\nWelcome to Day", game["day"])

    random_event()
