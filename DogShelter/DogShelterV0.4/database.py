from care import find_dog_by_name, provide_care
from game_data import dogs


def view_database():

    if len(dogs) == 0:
        print("No dogs found.")
        return

    print("\n=== DOG DATABASE ===")

    for dog in dogs:
        print("- {}".format(dog.name))

    name = input(
        "Type the name of the dog to view (or press Enter to cancel): "
    ).strip()
    if not name:
        return

    dog = find_dog_by_name(name)
    if dog is None:
        print("No dog named {} is currently in the shelter.".format(name))
        return

    print("\n=== DOG RECORD ===")
    print("Name:", dog.name)
    print("Breed:", dog.breed)
    print("Weight:", dog.weight)
    print("Age:", dog.age)
    print("Energy:", dog.energy)
    print("Assigned Yard:", dog.yard)
    print("Condition:", dog.describe_condition())
    print("Happiness:", dog.happiness)
    print("Muzzled:", "yes" if dog.muzzled else "no")
    print("Days left in stay:", dog.stay_days)
    print("Base payment at checkout: ${:.2f}".format(dog.care_payment))

    if dog.status == "healthy":
        return

    while True:
        answer = input(
            "Would you like to provide care for this dog now? (yes/no): "
        ).strip().lower()
        if answer in ("yes", "no"):
            break
        print("Please answer yes or no.")

    if answer == "yes":
        provide_care(dog)
