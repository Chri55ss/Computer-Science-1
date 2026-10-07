import random

from game_data import game


# Every event is equally likely. The 30 entries are split evenly by outcome.
INTAKE_EVENTS = [
    ("positive", "A volunteer donated a new leash.", 8, 0, 0),
    ("positive", "A visitor made a small donation after meeting the dog.", 12, 0, 0),
    ("positive", "A local shop donated cleaning supplies.", 10, 0, 0),
    ("positive", "The dog made the volunteers smile.", 0, 8, 0),
    ("positive", "A volunteer spent extra time with the dog.", 0, 10, 0),
    ("positive", "The dog received a kind note from a visitor.", 0, 5, 1),
    ("positive", "A regular visitor left a good review.", 0, 0, 1),
    ("positive", "A small community donation arrived with the dog.", 15, 0, 0),
    ("positive", "The dog settled in quickly and seems content.", 0, 5, 0),
    ("positive", "A volunteer brought a gently used bed.", 6, 5, 0),
    ("negative", "The dog chewed a toy. Replacing it cost $8.", -8, 0, 0),
    ("negative", "A food bowl broke during settling-in. Replacement cost $10.", -10, 0, 0),
    ("negative", "The dog tracked mud through the lobby. Cleanup cost $8.", -8, 0, 0),
    ("negative", "A visitor left a mildly critical review.", 0, 0, -1),
    ("negative", "The dog is unsettled in the new kennel.", 0, -8, 0),
    ("negative", "The dog misses its familiar surroundings.", 0, -10, 0),
    ("negative", "A small supply spill cost $12 to replace.", -12, 0, 0),
    ("negative", "A visitor complained about the noise.", 0, 0, -1),
    ("negative", "A worn blanket needed replacing. It cost $15.", -15, 0, 0),
    ("negative", "The dog had a stressful arrival.", 0, -5, -1),
    ("neutral", "The dog explored its kennel and settled in."),
    ("neutral", "A volunteer updated the dog's paperwork."),
    ("neutral", "The dog spent some time watching the other dogs."),
    ("neutral", "The dog took a nap after arriving."),
    ("neutral", "A volunteer organized the dog's supplies."),
    ("neutral", "The dog sniffed around its new yard."),
    ("neutral", "The shelter received a routine supply delivery."),
    ("neutral", "The dog met a volunteer and then rested."),
    ("neutral", "The intake paperwork was completed without delay."),
    ("neutral", "The dog had a quiet, uneventful arrival."),
]


def resolve_intake_event(dog):
    event = random.choice(INTAKE_EVENTS)
    outcome, description = event[:2]
    money_change, happiness_change, review_change = (
        event[2:] if outcome != "neutral" else (0, 0, 0)
    )

    print("\n=== INTAKE EVENT: {} ===".format(outcome.upper()))
    print("{} {}".format(dog["name"], description))

    game["money"] += money_change
    dog["happiness"] = max(
        0, min(100, dog.get("happiness", 50) + happiness_change)
    )
    game["reviews"] += review_change

    if money_change:
        print("Money: {:+.2f}".format(money_change))
    if happiness_change:
        print("Happiness: {:+}".format(happiness_change))
    if review_change:
        print("Reviews: {:+}".format(review_change))
