total_dogs = 0

print("=== Dog Shelter Yard Assignment ===")

while True:
    dog_name = input("\nEnter the dog's name (or type 'done' to finish): ").strip()

    if dog_name.lower() == "done":
        break

    breed = input(
        "Enter breed (Corgi, Beagle, German Shepherd, Labrador, Chihuahua, or Other): "
    ).strip().lower()

    # Check that weight is a number
    try:
        weight = float(input("Enter the dog's weight in pounds: "))
    except ValueError:
        print("Please enter the weight as a number, such as 18 or 42.5.")
        continue

    # Check that age is a number
    try:
        age = float(input("Enter the dog's age in years: "))
    except ValueError:
        print("Please enter the age as a number, such as 1, 5, or 10.")
        continue

    energy = input(
        "Enter energy level (high or calm): "
    ).strip().lower()

    # Guard clause for an invalid weight
    if weight <= 0:
        print("Check the scale. The weight must be greater than zero.")
        continue

    # Guard clause for an invalid age
    if age <= 0:
        print("Check the dog's age. Age must be greater than zero.")
        continue

    # Guard clause for an invalid energy level
    if energy != "high" and energy != "calm":
        print("Energy level must be entered as high or calm.")
        continue

    # Choose a care plan based on breed
    if breed == "corgi":
        breed_group = "Herding Dog"
        activity = "Herding ball"
        meal_cups = 1.5
    elif breed == "beagle":
        breed_group = "Scent Hound"
        activity = "Scent-tracking game"
        meal_cups = 1.75
    elif breed == "german shepherd":
        breed_group = "Working Dog"
        activity = "Training course"
        meal_cups = 3.0
    elif breed == "labrador":
        breed_group = "Sporting Dog"
        activity = "Fetch and retrieve"
        meal_cups = 2.5
    elif breed == "chihuahua":
        breed_group = "Toy Dog"
        activity = "Small-toy play"
        meal_cups = 0.75
    else:
        breed_group = "Mixed or Other Breed"
        activity = "General play session"
        meal_cups = 2.0

    # Choose a play-yard based on weight and energy
    if weight < 20 and energy == "high":
        play_yard = "Zoomies Yard"
        exercise_minutes = 60
        water_bowls = 2
    elif weight < 20:
        play_yard = "Puppy Lounge"
        exercise_minutes = 30
        water_bowls = 1
    elif weight >= 20 and energy == "high":
        play_yard = "Big Dog Run"
        exercise_minutes = 45
        water_bowls = 3
    else:
        play_yard = "Nap Porch"
        exercise_minutes = 15
        water_bowls = 2

    # High-energy dogs receive additional exercise
    if energy == "high":
        exercise_minutes += 10

    # Adjust the care plan based on age
    if age < 1:
        age_group = "Puppy"
        exercise_minutes -= 10
        supervision = "Constant supervision"
    elif age < 8:
        age_group = "Adult"
        supervision = "Normal supervision"
    else:
        age_group = "Senior"
        exercise_minutes -= 15
        activity = "Gentle walking"
        supervision = "Senior-care supervision"

    # Prevent exercise time from dropping below 10 minutes
    if exercise_minutes < 10:
        exercise_minutes = 10

    # Accumulator
    total_dogs += 1

    # Display the completed care plan
    print("\n=== Shelter Assignment Results ===")
    print("Dog's Name:", dog_name)
    print("Breed:", breed.title())
    print("Breed Group:", breed_group)
    print("Weight:", weight, "pounds")
    print("Age:", age, "years")
    print("Age Group:", age_group)
    print("Energy Level:", energy.title())
    print("Assigned Play-Yard:", play_yard)
    print("Exercise Time:", exercise_minutes, "minutes")
    print("Activity:", activity)
    print("Supervision:", supervision)
    print("Food Amount:", meal_cups, "cups")
    print("Water Bowls Needed:", water_bowls)

    print("\n" + "=" * 50)
    print("Dogs Processed So Far:", total_dogs)
    print("=" * 50)

print("\n=== Shelter Intake Summary ===")
print("Total Dogs Processed:", total_dogs)
