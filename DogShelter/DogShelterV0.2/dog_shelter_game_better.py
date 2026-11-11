from game_data import *
from intake import process_dog_intake
from database import view_database
from upgrades import buy_upgrade
from events import end_shift
from stats import show_stats
from care import check_dogs, start_day_care

start_day_care()

while True:

    shift_name = SHIFTS[game["shift"]]
    print("\n" + "=" * 50)
    print("DOG SHELTER MANAGER")
    print("=" * 50)
    print("Day {} - {}".format(game["day"], shift_name))
    print("Money: ${:.2f}".format(game["money"]))
    print("Daily intake: {}/{}".format(
        game["intakes_today"], game["daily_intake_limit"]
    ))

    print("\n1. Process Dog Intake")
    print("2. View Dog Database")
    print("3. Buy Upgrades")
    print("4. Check Dogs")
    print("5. End Shift")
    print("6. Quit")

    choice = input("\nChoose an option: ").strip()

    if choice == "1":
        process_dog_intake()

    elif choice == "2":
        view_database()

    elif choice == "3":
        buy_upgrade()

    elif choice == "4":
        check_dogs()

    elif choice == "5":
        end_shift()

    elif choice == "6":
        show_stats()
        break

    else:
        print("Invalid selection.")
