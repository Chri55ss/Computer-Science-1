from game_data import dogs, available_dogs

def view_database():

    if len(dogs) == 0:
        print("No dogs found.")
        return

    print("\n=== DOG DATABASE ===")

    for index, dog in enumerate(dogs, start=1):
        print(str(index) + ". " + dog["name"])

    try:
        choice = int(input("Select Dog: ")) - 1
    except ValueError:
        return

    if choice < 0 or choice >= len(dogs):
        return

    dog = dogs[choice]

    print("\n=== DOG RECORD ===")
    print("Name:", dog["name"])
    print("Breed:", dog["breed"])
    print("Weight:", dog["weight"])
    print("Age:", dog["age"])
    print("Energy:", dog["energy"])
    print("Assigned Yard:", dog["yard"])


def view_directory():
    if not available_dogs:
        print("There are no dogs remaining in the directory.")
        return

    print("\n=== DOG DIRECTORY ===")
    for index, dog in enumerate(available_dogs, start=1):
        print(
            "{}. {} - {}, {} lbs, age {}, {} energy".format(
                index,
                dog["name"],
                dog["breed"],
                dog["weight"],
                dog["age"],
                dog["energy"],
            )
        )
