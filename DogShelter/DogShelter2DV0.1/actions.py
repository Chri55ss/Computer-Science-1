"""The bridge between the pygame screens and the V0.5 game rules.

The rule files (dog.py, yard.py, care.py, events.py, ...) are the same ones
the text version uses. They talk to the player with print() and input().
This file:
  - calls the rule functions that only print, and catches what they print
    so the screen can show it in the log, and
  - redoes the few steps that ask questions with input() (intake and
    treatment) using button clicks instead, with the same rules.
"""
import contextlib
import io
import random

import game_data as gd
from care import TREATMENT_COSTS, start_day_care
from dog import STATUS_ACTIONS, Dog
from events import checkout_payment, end_shift as rules_end_shift
from intake import pay_per_pound
from intake_events import resolve_intake_event

DEFAULT_GAME = dict(gd.game)          # the starting values, for New Game


# ---------- catching print() ----------
def capture(fn, *args):
    """Run fn and return (result, list of printed lines)."""
    buffer = io.StringIO()
    with contextlib.redirect_stdout(buffer):
        result = fn(*args)
    lines = []
    for line in buffer.getvalue().splitlines():
        line = line.strip()
        if not line or line.startswith("==="):
            continue
        lines.append(line)
    return result, lines


BAD_WORDS = ("cost", "bit a", "BITE", "untreated", "WARNING", "debt", "trade-off",
             "unwell", "Something is wrong", "dug", "burst", "close", "didn't help", "-$")
GOOD_WORDS = ("received", "tip.", "donat", "earned", "raised", "Grant", "happier",
              "saved", "appreciation", "increased", "healthy again", "+")


def kind_of(line):
    """good / bad / info, used to color the log."""
    if line.startswith("Welcome to Day"):
        return "day"
    if ": -" in line or any(word in line for word in BAD_WORDS):
        return "bad"
    if any(word in line for word in GOOD_WORDS):
        return "good"
    return "info"


# ---------- new game ----------
def new_game():
    gd.game.clear()
    gd.game.update(DEFAULT_GAME)
    for yard in gd.yards:
        yard.dogs.clear()
        yard.played_today = False
    gd.available_dogs[:] = list(gd.dog_directory)
    capture(start_day_care)


# ---------- intake (same rules as intake.process_dog_intake) ----------
class Offer:
    """A dog waiting at the front desk."""

    def __init__(self):
        self.candidate = random.choice(gd.available_dogs)
        self.yard = gd.find_yard(self.candidate["weight"])
        stay_days = random.randint(1, 3)
        self.rate = pay_per_pound()
        care_payment = round(self.candidate["weight"] * self.rate * stay_days, 2)
        c = self.candidate
        self.dog = Dog(c["name"], c["breed"], c["weight"], c["age"], c["energy"],
                       self.yard.name, stay_days, care_payment)


def intake_blocked_reason():
    if gd.game["shift"] != 0:
        return "closed"
    if gd.game["intakes_today"] >= gd.game["daily_intake_limit"]:
        return "full"
    if not gd.available_dogs:
        return "empty"
    return None


def answer_offer(offer, accept):
    """Every offer uses one of today's slots, accepted or not."""
    game = gd.game
    if accept and not offer.yard.has_room():
        return {"accepted": False, "lines": ["The {} is full.".format(offer.yard.name)]}
    game["intakes_today"] += 1
    if not accept:
        return {"accepted": False, "lines": ["{} was not accepted. Offers used: {}/{}.".format(
            offer.dog.name, game["intakes_today"], game["daily_intake_limit"])]}
    offer.yard.add_dog(offer.dog)
    gd.available_dogs.remove(offer.candidate)
    game["total_dogs"] += 1
    _, event_lines = capture(resolve_intake_event, offer.dog)
    lines = ["{} joined the {}. Offers used: {}/{}.".format(
        offer.dog.name, offer.yard.name, game["intakes_today"], game["daily_intake_limit"])]
    return {"accepted": True, "lines": lines + event_lines, "event": event_lines}


# ---------- treatment (same rules as care.provide_care) ----------
def treat(dog, action):
    if dog.status == "healthy":
        return {"done": False, "text": "{} does not need treatment.".format(dog.name)}
    cost = TREATMENT_COSTS[action]
    if gd.game["money"] < cost:
        return {"done": False, "text": "Not enough money for that treatment."}
    gd.game["money"] -= cost
    if dog.treat(action):
        gd.game["reviews"] += 1
        return {"done": True, "correct": True,
                "text": "{} is healthy again. Positive review!".format(dog.name)}
    gd.game["reviews"] -= 1
    return {"done": True, "correct": False,
            "text": "That didn't help. {} still needs care. Reviews -1.".format(dog.name)}


# ---------- play session (Yard.play_session calls Dog.play) ----------
def play_session(yard):
    if yard.played_today:
        return "The {} already had a play session today.".format(yard.name)
    if not yard.dogs:
        return "There are no dogs in the {}.".format(yard.name)
    count = yard.play_session(gd.PLAY_SESSION_HAPPINESS)
    return "Play session in the {}: {} dog(s) happiness +{}.".format(
        yard.name, count, gd.PLAY_SESSION_HAPPINESS)


# ---------- end shift ----------
def end_shift():
    """Runs events.end_shift() and returns what it printed."""
    _, lines = capture(rules_end_shift)
    return [line for line in lines
            if not line.startswith("Starting ") and line != "No special event this shift."]


def days_completed():
    return gd.game["day"] if gd.game["game_over"] else gd.game["day"] - 1


__all__ = ["capture", "kind_of", "new_game", "Offer", "intake_blocked_reason", "answer_offer",
           "treat", "play_session", "end_shift", "days_completed", "checkout_payment",
           "TREATMENT_COSTS", "STATUS_ACTIONS"]
