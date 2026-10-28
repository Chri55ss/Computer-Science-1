from care import provide_care
from game_data import dogs

def view_database():

    if len(dogs) == 0:
        print("No dogs found.")
        return

    print("\n=== DOG DATABASE ===")

    for dog in dogs:
        print("- {}".format(dog["name"]))

    name = input(
        "Type the name of the dog to view (or press Enter to cancel): "
    ).strip()
    if not name:
        return

    dog = next(
        (item for item in dogs if item["name"].casefold() == name.casefold()),
        None,
    )
    if dog is None:
        print("No dog named {} is currently in the shelter.".format(name))
        return

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

    while True:
        answer = input(
            "Would you like to provide care for this dog now? (yes/no): "
        ).strip().lower()
        if answer in ("yes", "no"):
            break
        print("Please answer yes or no.")

    if answer == "yes":
        provide_care(dog)
