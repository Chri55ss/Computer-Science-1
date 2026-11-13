from game_data import game, dogs

def show_stats():

    days_completed = game["day"] if game["game_over"] else game["day"] - 1

    print("\n=== FINAL STATISTICS ===")
    print("Days Completed:", days_completed)
    print("Money: ${:.2f}".format(game["money"]))
    print("Total Dogs Processed:", game["total_dogs"])
    print("Dogs currently in shelter:", len(dogs))
    print("Shelter Reviews:", game["reviews"])
    print("Thanks for playing!")
