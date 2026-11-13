import random

from game_data import game, dogs


STATUS_ACTIONS = {
    "hungry": "feed",
    "sick": "medicate",
    "sad": "play",
    "injured": "vet",
    "stressed": "comfort",
}

# What each treatment costs. Wrong treatments still cost money.
TREATMENT_COSTS = {
    "feed": 5,
    "medicate": 25,
    "play": 0,
    "vet": 40,
    "comfort": 5,
}

# The player sees a symptom, not the status, and has to work out the cause.
SYMPTOMS = {
    "hungry": [
        "keeps licking the empty food bowl",
        "is begging at the kennel door",
        "is sniffing around the supply closet",
    ],
    "sick": [
        "has a runny nose and warm ears",
        "threw up this morning",
        "is coughing and sleeping a lot",
    ],
    "sad": [
        "is lying in the corner with ears down",
        "ignores the other dogs",
        "won't touch any of the toys",
    ],
    "injured": [
        "is limping on one paw",
        "yelps when touched on the side",
        "has a cut on one leg",
    ],
    "stressed": [
        "is pacing and panting",
        "is hiding and trembling",
        "barks at every noise",
    ],
}

ISSUE_STATUSES = list(STATUS_ACTIONS)


def find_dog_by_name(name):
    """Return the shelter dog with this name (any capitalization), or None."""
    for dog in dogs:
        if dog["name"].casefold() == name.casefold():
            return dog
    return None


def describe_condition(dog):
    """Return what the player can see about the dog's condition."""
    if dog.get("status", "healthy") == "healthy":
        return "healthy"
    return dog["symptom"]


def give_issue(dog, status):
    dog["status"] = status
    dog["symptom"] = random.choice(SYMPTOMS[status])
    dog["issue_days"] = 0


def start_day_care():
    """Give each healthy dog a chance to develop an issue at the start of a day."""
    for dog in dogs:
        dog.setdefault("status", "healthy")
        dog.setdefault("issue_days", 0)
        dog.setdefault("happiness", 50)

        if dog["status"] == "healthy" and random.random() < 0.25:
            give_issue(dog, random.choice(ISSUE_STATUSES))
            print("Something is wrong: {} {}.".format(
                dog["name"], describe_condition(dog)
            ))


def provide_care(dog):
    """Treat the selected dog if it has an issue."""
    dog.setdefault("status", "healthy")
    dog.setdefault("issue_days", 0)
    dog.setdefault("happiness", 50)
    print("\n{}: {}".format(dog["name"], describe_condition(dog)))
    if dog["status"] == "healthy":
        print("{} does not need treatment.".format(dog["name"]))
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

    if answer == STATUS_ACTIONS[dog["status"]]:
        dog["status"] = "healthy"
        dog["issue_days"] = 0
        dog["happiness"] = min(100, dog["happiness"] + 10)
        game["reviews"] += 1
        print("{} is healthy again. Positive review!".format(dog["name"]))
    else:
        dog["happiness"] = max(0, dog["happiness"] - 10)
        game["reviews"] -= 1
        print("That didn't help. {} still needs care.".format(dog["name"]))


def check_dogs():
    """Show every dog's condition, then treat one by name."""
    if not dogs:
        print("There are no dogs in the shelter to check.")
        return

    print("\n=== DOG HEALTH CHECK ===")
    for dog in dogs:
        print("- {}: {} (happiness {})".format(
            dog["name"], describe_condition(dog), dog.get("happiness", 50)
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
        if dog.get("status", "healthy") == "healthy":
            continue

        dog["issue_days"] = dog.get("issue_days", 0) + 1
        dog["happiness"] = max(
            0, dog.get("happiness", 50) - (5 * dog["issue_days"])
        )
        game["reviews"] -= dog["issue_days"]
        print(
            "{} was left untreated for {} day(s): happiness -{}, reviews -{}."
            .format(
                dog["name"],
                dog["issue_days"],
                5 * dog["issue_days"],
                dog["issue_days"],
            )
        )
