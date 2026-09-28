from game_data import game

def buy_upgrade():

    print("\n=== UPGRADE SHOP ===")
    print("1. +2 Capacity ($100)")
    print("2. +5 Capacity ($250)")
    print("3. +10 Capacity ($500)")

    choice = input("Choice: ")

    if choice == "1" and game["money"] >= 100:
        game["money"] -= 100
        game["capacity"] += 2

    elif choice == "2" and game["money"] >= 250:
        game["money"] -= 250
        game["capacity"] += 5

    elif choice == "3" and game["money"] >= 500:
        game["money"] -= 500
        game["capacity"] += 10
    else:
        print("Not enough money.")

    print("Capacity:", game["capacity"])
