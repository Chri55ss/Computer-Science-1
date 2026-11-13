import random


STATUS_ACTIONS = {
    "hungry": "feed",
    "sick": "medicate",
    "sad": "play",
    "injured": "vet",
    "stressed": "comfort",
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


class Dog:
    """One dog staying at the shelter."""

    def __init__(self, name, breed, weight, age, energy, yard, stay_days,
                 care_payment):
        self.name = name
        self.breed = breed
        self.weight = weight
        self.age = age
        self.energy = energy
        self.yard = yard
        self.stay_days = stay_days
        self.care_payment = care_payment
        self.status = "healthy"
        self.symptom = None
        self.issue_days = 0
        self.happiness = 50
        self.muzzled = False
        self.trained = False

    def describe_condition(self):
        """Return what the player can see about the dog's condition."""
        if self.status == "healthy":
            return "healthy"
        return self.symptom

    def give_issue(self, status):
        self.status = status
        self.symptom = random.choice(SYMPTOMS[status])
        self.issue_days = 0

    def treat(self, action):
        """Apply a treatment. Return True if it was the right one."""
        if action == STATUS_ACTIONS[self.status]:
            self.status = "healthy"
            self.symptom = None
            self.issue_days = 0
            self.happiness = min(100, self.happiness + 10)
            return True
        self.happiness = max(0, self.happiness - 10)
        return False

    def apply_untreated_day(self):
        """Another day with an unresolved issue: happiness drops more each day."""
        self.issue_days += 1
        self.happiness = max(0, self.happiness - 5 * self.issue_days)
