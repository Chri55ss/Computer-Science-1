import random

from dog import STATUS_ACTIONS
from game_data import game, all_dogs, yards, PLAY_SESSION_HAPPINESS


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
    for dog in all_dogs():
        if dog.name.casefold() == name.casefold():
            return dog
    return None


def start_day_care():
    """Give each healthy dog a chance to develop an issue at the start of a day."""
    for dog in all_dogs():
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
    if not all_dogs():
        print("There are no dogs in the shelter to check.")
        return

    print("\n=== DOG HEALTH CHECK ===")
    for dog in all_dogs():
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
    for dog in all_dogs():
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


def run_play_session():
    """Pick a yard and play with every dog in it (once per yard per day)."""
    print("\n=== PLAY SESSION ===")
    for number, yard in enumerate(yards, start=1):
        status = "done today" if yard.played_today else "{} dog(s)".format(len(yard.dogs))
        print("{}. {} ({})".format(number, yard.name, status))

    choice = input("Choose a yard (or press Enter to cancel): ").strip()
    if not choice:
        return
    if not choice.isdigit() or not 1 <= int(choice) <= len(yards):
        print("Enter a yard number from the list.")
        return

    yard = yards[int(choice) - 1]
    if yard.played_today:
        print("The {} already had a play session today.".format(yard.name))
        return
    if not yard.dogs:
        print("There are no dogs in the {}.".format(yard.name))
        return

    count = yard.play_session(PLAY_SESSION_HAPPINESS)
    print("Play session in the {}: {} dog(s) happiness +{}.".format(
        yard.name, count, PLAY_SESSION_HAPPINESS
    ))
