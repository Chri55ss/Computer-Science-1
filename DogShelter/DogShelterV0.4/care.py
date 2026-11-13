import random

from dog import STATUS_ACTIONS
from game_data import game, dogs


# What each treatment costs. Wrong treatments still cost money.
TREATMENT_COSTS = {
    "feed": 5,
    "medicate": 25,
    "play": 0,
    "vet": 40,
    "comfort": 5,
}

ISSUE_STATUSES = list(STATUS_ACTIONS)


def find_dog_by_name(name):
    """Return the shelter dog with this name (any capitalization), or None."""
    for dog in dogs:
        if dog.name.casefold() == name.casefold():
            return dog
    return None


def start_day_care():
    """Give each healthy dog a chance to develop an issue at the start of a day."""
    for dog in dogs:
        if dog.status == "healthy" and random.random() < 0.25:
            dog.give_issue(random.choice(ISSUE_STATUSES))
            print("Something is wrong: {} {}.".format(
                dog.name, dog.describe_condition()
            ))


def provide_care(dog):
    """Treat the selected dog if it has an issue."""
    print("\n{}: {}".format(dog.name, dog.describe_condition()))
    if dog.status == "healthy":
        print("{} does not need treatment.".format(dog.name))
        return

    print("Treatments:")
    for action, cost in TREATMENT_COSTS.items():
        print("  {:<9} ${}".format(action, cost))
    while True:
        answer = input(
            "Enter the treatment (or press Enter to cancel): "
        ).strip().lower()
        if not answer:
            print("No treatment given.")
            return
        if answer in TREATMENT_COSTS:
            break
        print("Enter one of the listed treatments.")

    cost = TREATMENT_COSTS[answer]
    if game["money"] < cost:
        print("Not enough money for that treatment.")
        return
    game["money"] -= cost

    if dog.treat(answer):
        game["reviews"] += 1
        print("{} is healthy again. Positive review!".format(dog.name))
    else:
        game["reviews"] -= 1
        print("That didn't help. {} still needs care.".format(dog.name))


def check_dogs():
    """Show every dog's condition, then treat one by name."""
    if not dogs:
        print("There are no dogs in the shelter to check.")
        return

    print("\n=== DOG HEALTH CHECK ===")
    for dog in dogs:
        print("- {}: {} (happiness {})".format(
            dog.name, dog.describe_condition(), dog.happiness
        ))

    name = input(
        "Type the name of the dog to care for (or press Enter to cancel): "
    ).strip()
    if not name:
        return

    dog = find_dog_by_name(name)
    if dog is None:
        print("No dog named {} is currently in the shelter.".format(name))
        return

    provide_care(dog)


def finish_day_care():
    """Apply increasing penalties to dogs whose issues were not resolved."""
    for dog in dogs:
        if dog.status == "healthy":
            continue

        dog.apply_untreated_day()
        game["reviews"] -= dog.issue_days
        print(
            "{} was left untreated for {} day(s): happiness -{}, reviews -{}."
            .format(
                dog.name,
                dog.issue_days,
                5 * dog.issue_days,
                dog.issue_days,
            )
        )
