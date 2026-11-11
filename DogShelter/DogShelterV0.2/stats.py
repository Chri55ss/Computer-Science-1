from game_data import game, dogs

def show_stats():

    print("\n=== FINAL STATISTICS ===")
    print("Days Played:", game["day"])
    print("Money: ${:.2f}".format(game["money"]))
    print("Total Dogs Processed:", game["total_dogs"])
    print("Dogs currently in shelter:", len(dogs))
    print("Shelter Reviews:", game["reviews"])
    print("Thanks for playing!")
