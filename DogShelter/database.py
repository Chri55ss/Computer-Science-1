from game_data import dogs

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
    print("Status:", dog.get("status", "healthy"))
    print("Happiness:", dog.get("happiness", 50))
    print("Days left in stay:", dog.get("stay_days", 0))
