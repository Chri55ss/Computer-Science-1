from game_data import game, dogs

def process_dog_intake():

    if game["dogs_processed_today"] >= game["capacity"\]:
        print("Shelter is full today.")
        return

    dog_name = input("Dog Name: ")
    breed = input("Breed: ")

    try:
        weight = float(input("Weight: "))
        age = float(input("Age: "))
    except ValueError:
        print("Invalid number.")
        return

    energy = input("Energy (high/calm): ").lower()

    if weight < 20:
        money_earned = 20
        yard = "Small Dog Yard"
    elif weight < 50:
        money_earned = 30
        yard = "Medium Dog Yard"
    else:
        money_earned = 40
        yard = "Large Dog Yard"

    dog = {
        "name": dog_name,
        "breed": breed,
        "weight": weight,
        "age": age,
        "energy": energy,
        "yard": yard
    }

    dogs.append(dog)

    game["money"] += money_earned
    game["dogs_processed_today"] += 1
    game["total_dogs"] += 1

    print("Dog processed.")
    print("Earned $" + str(money_earned))
