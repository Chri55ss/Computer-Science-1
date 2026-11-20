class Yard:
    """One of the shelter's yards. The yard owns the Dog objects living in it."""

    def __init__(self, name, min_weight, max_weight, capacity):
        self.name = name
        self.min_weight = min_weight
        self.max_weight = max_weight
        self.capacity = capacity
        self.dogs = []              # Dog objects living in this yard
        self.played_today = False

    def fits(self, weight):
        """Is a dog of this weight the right size for this yard?"""
        return self.min_weight <= weight < self.max_weight

    def has_room(self):
        return len(self.dogs) < self.capacity

    def add_dog(self, dog):
        """Move a dog into this yard. Returns False if the yard is full."""
        if not self.has_room():
            return False
        self.dogs.append(dog)
        dog.yard = self.name
        return True

    def remove_dog(self, dog):
        self.dogs.remove(dog)

    def play_session(self, amount):
        """Play with every dog in the yard. Returns how many dogs played."""
        for dog in self.dogs:
            dog.play(amount)
        self.played_today = True
        return len(self.dogs)

    def report(self):
        """Lines describing the yard and every dog in it."""
        lines = ["{} ({}/{} dogs)".format(self.name, len(self.dogs), self.capacity)]
        for dog in self.dogs:
            lines.append("  - {}: {}, happiness {}".format(
                dog.name, dog.describe_condition(), dog.happiness
            ))
        if not self.dogs:
            lines.append("  (empty)")
        return lines
