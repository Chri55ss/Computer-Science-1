from game_data import *
from intake import process_dog_intake
from database import view_database, view_directory
from upgrades import buy_upgrade
from events import end_day
from stats import show_stats

while True:

    print("\n" + "=" * 50)
    print("DOG SHELTER MANAGER")
    print("=" * 50)
    print("Day:", game["day"])
    print("Money: ${:.2f}".format(game["money"]))
    print(
        "Capacity:",
        str(game["dogs_processed_today"]) + "/" + str(game["capacity"])
    )

    print("\n1. Process Dog Intake")
    print("2. View Dog Database")
    print("3. View Dog Directory")
    print("4. Buy Upgrades")
    print("5. End Day")
    print("6. Quit")

    choice = input("\nChoose an option: ")

    if choice == "1":
        process_dog_intake()

    elif choice == "2":
        view_database()

    elif choice == "3":
        view_directory()

    elif choice == "4":
        buy_upgrade()

    elif choice == "5":
        end_day()

    elif choice == "6":
        show_stats()
        break

    else:
        print("Invalid selection.")
