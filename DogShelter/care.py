import random

from game_data import game, dogs


STATUS_ACTIONS = {
    "hungry": "feed",
    "sick": "medicate",
    "sad": "play",
    "injured": "vet",
    "stressed": "comfort",
}

ISSUE_STATUSES = list(STATUS_ACTIONS)


def start_day_care():
    """Give each healthy dog a chance to develop an issue at the start of a day."""
    for dog in dogs:
        dog.setdefault("status", "healthy")
        dog.setdefault("issue_days", 0)
        dog.setdefault("happiness", 50)

        if dog["status"] == "healthy" and random.random() < 0.25:
            dog["status"] = random.choice(ISSUE_STATUSES)
            dog["issue_days"] = 0
            print("{} is now {}.".format(dog["name"], dog["status"]))


def check_dogs():
    """Select one dog by name, then treat it if it has an issue."""
    if not dogs:
        print("There are no dogs in the shelter to check.")
        return

    print("\n=== DOG HEALTH CHECK ===")
    for dog in dogs:
        dog.setdefault("status", "healthy")
        dog.setdefault("issue_days", 0)
        dog.setdefault("happiness", 50)
        print("- {}".format(dog["name"]))

    name = input("Type the name of the dog to check: ").strip()
    if not name:
        print("Please enter a dog name.")
        return

    dog = next(
        (item for item in dogs if item["name"].casefold() == name.casefold()),
        None,
    )
    if dog is None:
        print("No dog named {} is currently in the shelter.".format(name))
        return

    status = dog["status"]
    print("\n{}: {}".format(dog["name"], status))
    if status == "healthy":
        print("{} does not need treatment.".format(dog["name"]))
        return

    correct_action = STATUS_ACTIONS[status]
    print("Treatment answers: {}".format(", ".join(STATUS_ACTIONS.values())))
    while True:
        answer = input("Enter the treatment: ").strip().lower()
        if answer in STATUS_ACTIONS.values():
            break
        print("Enter one of the listed treatments.")

    if answer == correct_action:
        dog["status"] = "healthy"
        dog["issue_days"] = 0
        dog["happiness"] = min(100, dog["happiness"] + 10)
        game["reviews"] += 1
        print("{} is healthy again. Positive review!".format(dog["name"]))
    else:
        dog["happiness"] = max(0, dog["happiness"] - 10)
        game["reviews"] -= 1
        print("Wrong action. {} still needs care.".format(dog["name"]))


def finish_day_care():
    """Apply increasing penalties to dogs whose issues were not resolved."""
    for dog in dogs:
        if dog.get("status", "healthy") == "healthy":
            continue

        dog["issue_days"] = dog.get("issue_days", 0) + 1
        dog["happiness"] = max(
            0, dog.get("happiness", 50) - (5 * dog["issue_days"])
        )
        print(
            "{} was left {} for {} day(s): happiness -{}, reviews -{}.".format(
                dog["name"],
                dog["status"],
                dog["issue_days"],
                5 * dog["issue_days"],
                dog["issue_days"],
            )
        )
        if dog.get("muzzled", False):
            print("{}'s muzzle blocked the review penalty.".format(dog["name"]))
        else:
            game["reviews"] -= dog["issue_days"]
