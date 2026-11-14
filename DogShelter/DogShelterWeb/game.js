"use strict";

/* =====================================================================
   DOG SHELTER MANAGER - browser version of DogShelterV0.4
   Sections:
     1. CONFIG       - every balance number, in one place
     2. DATA         - dogs, intake events, symptoms (from the Python game)
     3. Dog class    - mirrors dog.py
     4. GAME RULES   - ported from care.py, intake.py, events.py, ...
     5. PIXEL ART    - draws the dogs
     6. UI           - screens, play areas, cards, modals, animation
   ===================================================================== */


/* =====================================================================
   1. CONFIG - change these numbers to tune the game
   ===================================================================== */
const CONFIG = {
  startMoney: 100,
  dailyIntakeLimit: 3,

  basePayPerPound: 1.50,      // paid per pound, per day of stay, at checkout
  upkeepPerPound: 0.40,       // charged per pound, per dog, at the end of each day
  reviewPayStep: 0.05,        // each review point changes the pay rate by this much
  minPayPerPound: 0.75,
  maxPayPerPound: 2.50,
  stayDaysMin: 1,
  stayDaysMax: 3,

  issueChance: 0.25,          // chance a healthy dog gets an issue each morning
  treatmentCosts: { feed: 5, medicate: 25, play: 0, vet: 40, comfort: 5 },
  correctTreatmentHappiness: 10,
  wrongTreatmentHappiness: 10,
  untreatedHappinessPerDay: 5, // x number of days untreated
  unwellCheckoutMultiplier: 0.75,

  shiftEventChance: 25,       // percent chance of a random shift event
  biteChance: 0.15,
  biteHappinessBelow: 25,
  biteCost: 50,
  biteReviewLoss: 2,
  digCost: 25,
  toyHappiness: 5,

  muzzleCost: 30,
  treatsCost: 20,
  intakeUpgrades: [
    { slots: 2, cost: 100 },
    { slots: 5, cost: 250 },
    { slots: 10, cost: 500 },
  ],
  perPoundUpgradeCost: 200,
  perPoundUpgradeBonus: 0.50,
  perPoundTradeoffChance: 0.25,

  tipChance: 50,              // percent
  tipMin: 5,
  tipMax: 25,

  daysInDebtToClose: 2,
};


/* =====================================================================
   2. DATA
   ===================================================================== */
const SHIFTS = ["Morning Intake", "Noon Shift", "Night Shift"];
const SHIFT_ICONS = ["🌅", "☀️", "🌙"];
const SHIFT_SHORT = ["Morning", "Noon", "Night"];

// [name, breed, weight, age, energy] - copied from game_data.py
const DOG_DIRECTORY = [
  ["Bailey", "Labrador Retriever", 65, 4, "high"],
  ["Clover", "Beagle", 24, 6, "calm"],
  ["Pesto", "Beagle", 23, 2, "high"],
  ["Duke", "German Shepherd", 78, 3, "high"],
  ["Poppy", "Cavalier King Charles Spaniel", 16, 8, "calm"],
  ["Milo", "Border Collie", 42, 2, "high"],
  ["Rosie", "Basset Hound", 48, 7, "calm"],
  ["Rocky", "Boxer", 68, 5, "high"],
  ["Luna", "Miniature Poodle", 19, 3, "calm"],
  ["Scout", "Australian Shepherd", 52, 4, "high"],
  ["Daisy", "French Bulldog", 26, 6, "calm"],
  ["Tucker", "Siberian Husky", 58, 2, "high"],
  ["Maggie", "Shih Tzu", 13, 9, "calm"],
  ["Finn", "Golden Retriever", 62, 3, "high"],
  ["Olive", "Pembroke Welsh Corgi", 27, 5, "calm"],
  ["Ranger", "Rottweiler", 104, 4, "high"],
  ["Winnie", "Pug", 18, 7, "calm"],
  ["Jasper", "Australian Cattle Dog", 47, 2, "high"],
  ["Hazel", "English Springer Spaniel", 44, 6, "high"],
  ["Otis", "Boston Terrier", 22, 8, "calm"],
  ["Maple", "Miniature Schnauzer", 17, 4, "high"],
  ["Archie", "Yorkshire Terrier", 8, 3, "high"],
  ["Nala", "Doberman Pinscher", 76, 5, "high"],
  ["Benny", "Dachshund", 22, 9, "calm"],
  ["Ivy", "Whippet", 28, 4, "high"],
  ["Murphy", "Chihuahua", 6, 6, "high"],
  ["Ruby", "Cocker Spaniel", 27, 5, "high"],
  ["Bruno", "Great Dane", 145, 3, "calm"],
  ["Pearl", "Maltese", 7, 10, "calm"],
  ["Ziggy", "Pomeranian", 9, 2, "high"],
  ["Millie", "Bernese Mountain Dog", 88, 6, "calm"],
  ["Cooper", "Labrador Retriever", 72, 7, "high"],
  ["Fern", "Beagle", 28, 4, "high"],
  ["Samson", "German Shepherd", 84, 8, "calm"],
  ["Maisie", "Cavalier King Charles Spaniel", 14, 3, "high"],
  ["Riley", "Border Collie", 36, 5, "high"],
  ["Mabel", "Basset Hound", 54, 10, "calm"],
  ["Baxter", "Boxer", 74, 3, "high"],
  ["Tilly", "Standard Poodle", 48, 7, "calm"],
  ["Ace", "Australian Shepherd", 58, 6, "high"],
  ["Nellie", "French Bulldog", 21, 4, "calm"],
  ["Koda", "Siberian Husky", 48, 5, "high"],
  ["Phoebe", "Shih Tzu", 11, 4, "calm"],
  ["Harvey", "Golden Retriever", 74, 8, "calm"],
  ["Titan", "Rottweiler", 118, 7, "calm"],
  ["Gus", "Pug", 20, 5, "calm"],
  ["Indy", "Australian Cattle Dog", 42, 4, "high"],
  ["Lottie", "English Springer Spaniel", 49, 3, "high"],
  ["Percy", "Boston Terrier", 18, 6, "calm"],
  ["Suki", "Miniature Schnauzer", 15, 8, "calm"],
  ["Remy", "Yorkshire Terrier", 6, 7, "high"],
  ["Freya", "Doberman Pinscher", 68, 3, "high"],
  ["Louie", "Dachshund", 17, 2, "high"],
  ["Skye", "Whippet", 33, 7, "high"],
  ["Chico", "Chihuahua", 5, 11, "calm"],
  ["Mochi", "Cocker Spaniel", 24, 2, "high"],
  ["Atlas", "Great Dane", 158, 6, "calm"],
  ["Elsie", "Maltese", 9, 5, "calm"],
  ["Pip", "Pomeranian", 7, 6, "high"],
  ["Moose", "Bernese Mountain Dog", 102, 4, "calm"],
  ["Roscoe", "Labrador Retriever", 58, 10, "calm"],
  ["Edie", "Beagle", 21, 11, "calm"],
  ["Kaiser", "German Shepherd", 72, 6, "high"],
  ["Annie", "Cavalier King Charles Spaniel", 18, 6, "calm"],
  ["Dash", "Border Collie", 48, 3, "high"],
  ["Walter", "Basset Hound", 43, 5, "calm"],
  ["Cleo", "Boxer", 59, 9, "calm"],
  ["Sunny", "Miniature Poodle", 14, 8, "high"],
  ["Banjo", "Australian Shepherd", 46, 9, "calm"],
  ["Minnie", "French Bulldog", 28, 3, "calm"],
  ["Yuki", "Siberian Husky", 55, 8, "high"],
  ["Theo", "Shih Tzu", 15, 6, "calm"],
  ["Honey", "Golden Retriever", 57, 2, "high"],
  ["Coco", "Pembroke Welsh Corgi", 30, 8, "calm"],
  ["Dottie", "Rottweiler", 96, 3, "high"],
  ["Frankie", "Pug", 16, 3, "high"],
  ["Penny", "Australian Cattle Dog", 50, 7, "high"],
  ["Ollie", "English Springer Spaniel", 38, 8, "calm"],
  ["Trixie", "Boston Terrier", 25, 4, "high"],
  ["Eddie", "Miniature Schnauzer", 19, 3, "high"],
  ["Gigi", "Yorkshire Terrier", 7, 10, "calm"],
  ["Boone", "Doberman Pinscher", 88, 8, "calm"],
  ["Waffles", "Dachshund", 25, 6, "calm"],
  ["Lacey", "Whippet", 25, 2, "high"],
  ["Nacho", "Chihuahua", 8, 4, "high"],
  ["Murray", "Cocker Spaniel", 30, 9, "calm"],
  ["Darla", "Great Dane", 132, 5, "calm"],
  ["Bubbles", "Maltese", 6, 3, "high"],
  ["Rufus", "Pomeranian", 11, 8, "calm"],
  ["Sasha", "Bernese Mountain Dog", 78, 2, "high"],
  ["Hank", "German Shepherd", 90, 10, "calm"],
  ["Nina", "Cavalier King Charles Spaniel", 13, 11, "calm"],
  ["Bowie", "Border Collie", 39, 8, "high"],
  ["Agnes", "Basset Hound", 61, 12, "calm"],
  ["Rocco", "Boxer", 80, 7, "high"],
  ["Fifi", "Standard Poodle", 56, 4, "high"],
  ["Quincy", "Australian Shepherd", 49, 3, "high"],
  ["Marnie", "French Bulldog", 18, 9, "calm"],
  ["Echo", "Siberian Husky", 40, 11, "calm"],
  ["Lulu", "Shih Tzu", 9, 2, "high"],
].map(([name, breed, weight, age, energy]) => ({ name, breed, weight, age, energy }));

// [outcome, description, money, happiness, reviews] - from intake_events.py
const INTAKE_EVENTS = [
  ["positive", "A volunteer donated a new leash.", 8, 0, 0],
  ["positive", "A visitor made a small donation after meeting the dog.", 12, 0, 0],
  ["positive", "A local shop donated cleaning supplies.", 10, 0, 0],
  ["positive", "The dog made the volunteers smile.", 0, 8, 0],
  ["positive", "A volunteer spent extra time with the dog.", 0, 10, 0],
  ["positive", "The dog received a kind note from a visitor.", 0, 5, 1],
  ["positive", "A regular visitor left a good review.", 0, 0, 1],
  ["positive", "A small community donation arrived with the dog.", 15, 0, 0],
  ["positive", "The dog settled in quickly and seems content.", 0, 5, 0],
  ["positive", "A volunteer brought a gently used bed.", 6, 5, 0],
  ["negative", "The dog chewed a toy. Replacing it cost $8.", -8, 0, 0],
  ["negative", "A food bowl broke during settling-in. Replacement cost $10.", -10, 0, 0],
  ["negative", "The dog tracked mud through the lobby. Cleanup cost $8.", -8, 0, 0],
  ["negative", "A visitor left a mildly critical review.", 0, 0, -1],
  ["negative", "The dog is unsettled in the new kennel.", 0, -8, 0],
  ["negative", "The dog misses its familiar surroundings.", 0, -10, 0],
  ["negative", "A small supply spill cost $12 to replace.", -12, 0, 0],
  ["negative", "A visitor complained about the noise.", 0, 0, -1],
  ["negative", "A worn blanket needed replacing. It cost $15.", -15, 0, 0],
  ["negative", "The dog had a stressful arrival.", 0, -5, -1],
  ["neutral", "The dog explored its kennel and settled in.", 0, 0, 0],
  ["neutral", "A volunteer updated the dog's paperwork.", 0, 0, 0],
  ["neutral", "The dog spent some time watching the other dogs.", 0, 0, 0],
  ["neutral", "The dog took a nap after arriving.", 0, 0, 0],
  ["neutral", "A volunteer organized the dog's supplies.", 0, 0, 0],
  ["neutral", "The dog sniffed around its new yard.", 0, 0, 0],
  ["neutral", "The shelter received a routine supply delivery.", 0, 0, 0],
  ["neutral", "The dog met a volunteer and then rested.", 0, 0, 0],
  ["neutral", "The intake paperwork was completed without delay.", 0, 0, 0],
  ["neutral", "The dog had a quiet, uneventful arrival.", 0, 0, 0],
];

const STATUS_ACTIONS = {
  hungry: "feed",
  sick: "medicate",
  sad: "play",
  injured: "vet",
  stressed: "comfort",
};
const ISSUE_STATUSES = Object.keys(STATUS_ACTIONS);

// The player sees a symptom, not the status, and has to work out the cause.
const SYMPTOMS = {
  hungry: [
    "keeps licking the empty food bowl",
    "is begging at the kennel door",
    "is sniffing around the supply closet",
  ],
  sick: [
    "has a runny nose and warm ears",
    "threw up this morning",
    "is coughing and sleeping a lot",
  ],
  sad: [
    "is lying in the corner with ears down",
    "ignores the other dogs",
    "won't touch any of the toys",
  ],
  injured: [
    "is limping on one paw",
    "yelps when touched on the side",
    "has a cut on one leg",
  ],
  stressed: [
    "is pacing and panting",
    "is hiding and trembling",
    "barks at every noise",
  ],
};

const TREATMENT_ICONS = { feed: "🍖", medicate: "💊", play: "🎾", vet: "🩺", comfort: "🧸" };

const POUNDAGE_EFFECTS = [
  { name: "review", description: "25% chance of losing 1 review at day end." },
  { name: "repairs", description: "25% chance of a $50 repair bill at day end." },
  { name: "supplies", description: "25% chance of a $30 supply expense at day end." },
];


/* =====================================================================
   3. Dog class - mirrors dog.py
   ===================================================================== */
class Dog {
  constructor(name, breed, weight, age, energy, yard, stayDays, carePayment) {
    this.name = name;
    this.breed = breed;
    this.weight = weight;
    this.age = age;
    this.energy = energy;
    this.yard = yard;
    this.stayDays = stayDays;
    this.carePayment = carePayment;
    this.status = "healthy";
    this.symptom = null;
    this.issueDays = 0;
    this.happiness = 50;
    this.muzzled = false;
    this.trained = false;
  }

  /** What the player can see about the dog's condition. */
  describeCondition() {
    if (this.status === "healthy") {
      return "healthy";
    }
    return this.symptom;
  }

  giveIssue(status) {
    this.status = status;
    this.symptom = choice(SYMPTOMS[status]);
    this.issueDays = 0;
  }

  /** Apply a treatment. Return true if it was the right one. */
  treat(action) {
    if (action === STATUS_ACTIONS[this.status]) {
      this.status = "healthy";
      this.symptom = null;
      this.issueDays = 0;
      this.happiness = Math.min(100, this.happiness + CONFIG.correctTreatmentHappiness);
      return true;
    }
    this.happiness = Math.max(0, this.happiness - CONFIG.wrongTreatmentHappiness);
    return false;
  }

  /** Another day with an unresolved issue: happiness drops more each day. */
  applyUntreatedDay() {
    this.issueDays += 1;
    this.happiness = Math.max(
      0, this.happiness - CONFIG.untreatedHappinessPerDay * this.issueDays
    );
  }
}


/* =====================================================================
   4. GAME RULES
   ===================================================================== */
function randint(low, high) {
  return low + Math.floor(Math.random() * (high - low + 1));
}
function choice(items) {
  return items[Math.floor(Math.random() * items.length)];
}
function round2(n) {
  return Math.round(n * 100) / 100;
}
function clamp(n, low, high) {
  return Math.max(low, Math.min(high, n));
}
function formatMoney(n) {
  return (n < 0 ? "-$" : "$") + Math.abs(n).toFixed(2);
}

let game = null;          // like the Python `game` dict
let dogs = [];            // Dog objects in the shelter
let availableDogs = [];   // plain directory entries that can be offered
let offer = null;         // the intake offer waiting at the front desk
let deskResult = null;    // what happened with the last offer

function newGameState() {
  game = {
    money: CONFIG.startMoney,
    day: 1,
    dailyIntakeLimit: CONFIG.dailyIntakeLimit,
    intakesToday: 0,
    shift: 0,
    totalDogs: 0,
    reviews: 0,
    moneyPerPoundBonus: 0,
    moneyPerPoundEffect: null,
    gameOver: false,
    daysInDebt: 0,
  };
  dogs = [];
  availableDogs = DOG_DIRECTORY.slice();
  offer = null;
  deskResult = null;
}

/* ---------- intake.py ---------- */

/** Better reviews mean owners pay more per pound; bad reviews mean less. */
function payPerPound() {
  const rate = clamp(
    CONFIG.basePayPerPound + game.reviews * CONFIG.reviewPayStep,
    CONFIG.minPayPerPound,
    CONFIG.maxPayPerPound
  );
  return rate + game.moneyPerPoundBonus;
}

function yardForWeight(weight) {
  if (weight < 20) return "Small Dog Yard";
  if (weight < 50) return "Medium Dog Yard";
  return "Large Dog Yard";
}

/** Returns null if an offer can be made, otherwise the reason it can't. */
function intakeBlockedReason() {
  if (game.shift !== 0) return "closed";
  if (game.intakesToday >= game.dailyIntakeLimit) return "full";
  if (availableDogs.length === 0) return "empty";
  return null;
}

function makeOffer() {
  const candidate = choice(availableDogs);
  const stayDays = randint(CONFIG.stayDaysMin, CONFIG.stayDaysMax);
  const rate = payPerPound();
  const carePayment = round2(candidate.weight * rate * stayDays);
  const dog = new Dog(
    candidate.name,
    candidate.breed,
    candidate.weight,
    candidate.age,
    candidate.energy,
    yardForWeight(candidate.weight),
    stayDays,
    carePayment
  );
  return { candidate, dog, rate };
}

/** Accept or decline the current offer. Every offer uses one slot. */
function answerOffer(accept) {
  const current = offer;
  offer = null;
  game.intakesToday += 1;

  if (!accept) {
    log(`${current.dog.name} was not accepted. Offers used: ${game.intakesToday}/${game.dailyIntakeLimit}.`, "info");
    return { accepted: false, dog: current.dog };
  }

  availableDogs.splice(availableDogs.indexOf(current.candidate), 1);
  dogs.push(current.dog);
  game.totalDogs += 1;
  log(`${current.dog.name} joined the shelter (${current.dog.yard}). Offers used: ${game.intakesToday}/${game.dailyIntakeLimit}.`, "good");
  const event = resolveIntakeEvent(current.dog);
  return { accepted: true, dog: current.dog, event };
}

/* ---------- intake_events.py ---------- */
function resolveIntakeEvent(dog) {
  const [outcome, description, moneyChange, happinessChange, reviewChange] = choice(INTAKE_EVENTS);

  game.money += moneyChange;
  dog.happiness = clamp(dog.happiness + happinessChange, 0, 100);
  game.reviews += reviewChange;

  const changes = [];
  if (moneyChange) changes.push(`Money ${moneyChange > 0 ? "+" : "-"}$${Math.abs(moneyChange)}`);
  if (happinessChange) changes.push(`Happiness ${happinessChange > 0 ? "+" : ""}${happinessChange}`);
  if (reviewChange) changes.push(`Reviews ${reviewChange > 0 ? "+" : ""}${reviewChange}`);

  const kind = outcome === "positive" ? "good" : outcome === "negative" ? "bad" : "info";
  log(`Intake event (${dog.name}): ${description}${changes.length ? " " + changes.join(", ") + "." : ""}`, kind);
  return { outcome, description, changes };
}

/* ---------- care.py ---------- */
function findDogByName(name) {
  return dogs.find((dog) => dog.name.toLowerCase() === name.toLowerCase()) || null;
}

/** Give each healthy dog a chance to develop an issue at the start of a day. */
function startDayCare() {
  for (const dog of dogs) {
    if (dog.status === "healthy" && Math.random() < CONFIG.issueChance) {
      dog.giveIssue(choice(ISSUE_STATUSES));
      log(`Something is wrong: ${dog.name} ${dog.describeCondition()}.`, "bad");
    }
  }
}

/** Treat a dog. Money and reviews change here, the dog changes itself. */
function provideCare(dog, action) {
  if (dog.status === "healthy") {
    return { done: false, text: `${dog.name} does not need treatment.` };
  }
  const cost = CONFIG.treatmentCosts[action];
  if (game.money < cost) {
    return { done: false, text: "Not enough money for that treatment." };
  }
  game.money -= cost;

  if (dog.treat(action)) {
    game.reviews += 1;
    const text = `${dog.name} is healthy again. Positive review!`;
    log(`Used ${action} on ${dog.name} ($${cost}): ${text}`, "good");
    return { done: true, correct: true, text };
  }
  game.reviews -= 1;
  const text = `That didn't help. ${dog.name} still needs care.`;
  log(`Used ${action} on ${dog.name} ($${cost}): ${text} Reviews -1.`, "bad");
  return { done: true, correct: false, text };
}

/** Apply increasing penalties to dogs whose issues were not resolved. */
function finishDayCare() {
  for (const dog of dogs) {
    if (dog.status === "healthy") continue;
    dog.applyUntreatedDay();
    game.reviews -= dog.issueDays;
    log(
      `${dog.name} was left untreated for ${dog.issueDays} day(s): happiness -${CONFIG.untreatedHappinessPerDay * dog.issueDays}, reviews -${dog.issueDays}.`,
      "bad"
    );
  }
}

/* ---------- upgrades.py ---------- */
function nextPoundageEffect(current) {
  return choice(POUNDAGE_EFFECTS.filter((effect) => effect !== current));
}

function buyIntakeUpgrade(index) {
  const upgrade = CONFIG.intakeUpgrades[index];
  if (game.money < upgrade.cost) {
    return { done: false, text: "Not enough money." };
  }
  game.money -= upgrade.cost;
  game.dailyIntakeLimit += upgrade.slots;
  log(`Bought +${upgrade.slots} daily intake slots for $${upgrade.cost}. Daily intake limit: ${game.dailyIntakeLimit}.`, "info");
  return { done: true };
}

function buyPerPoundUpgrade() {
  if (game.moneyPerPoundBonus) {
    return { done: false, text: "The per-pound upgrade has already been purchased." };
  }
  if (game.money < CONFIG.perPoundUpgradeCost) {
    return { done: false, text: "Not enough money." };
  }
  game.money -= CONFIG.perPoundUpgradeCost;
  game.moneyPerPoundBonus = CONFIG.perPoundUpgradeBonus;
  game.moneyPerPoundEffect = choice(POUNDAGE_EFFECTS);
  log(`Per-pound upgrade purchased. Today's trade-off: ${game.moneyPerPoundEffect.description}`, "info");
  return { done: true };
}

/** itemName is "muzzle" or "treats". */
function buyAndUseItem(itemName, dog) {
  const price = itemName === "muzzle" ? CONFIG.muzzleCost : CONFIG.treatsCost;
  if (game.money < price) {
    return { done: false, text: `Not enough money to buy ${itemName}.` };
  }
  if (itemName === "muzzle" && dog.muzzled) {
    return { done: false, text: `${dog.name} already has a muzzle.` };
  }
  if (itemName === "treats" && dog.trained) {
    return { done: false, text: `${dog.name} has already been trained with treats.` };
  }
  if (itemName === "treats" && dog.energy !== "high") {
    return { done: false, text: "Treat training is only needed for high-energy dogs." };
  }

  game.money -= price;
  let text;
  if (itemName === "muzzle") {
    dog.muzzled = true;
    text = `${dog.name} is muzzled and can't bite anyone during their stay.`;
  } else {
    dog.trained = true;
    dog.energy = "calm";
    text = `${dog.name} was calmed and trained with treats.`;
  }
  log(`${text} (-$${price})`, "info");
  return { done: true, text };
}

/** Why a dog can't get an item right now, or null if it can. */
function itemBlockedReason(itemName, dog) {
  if (itemName === "muzzle" && dog.muzzled) return "Already muzzled";
  if (itemName === "treats" && dog.trained) return "Already trained";
  if (itemName === "treats" && dog.energy !== "high") return "Already calm";
  return null;
}

/* ---------- tips.py ---------- */
function offerEndOfDayTip() {
  if (randint(1, 100) <= CONFIG.tipChance) {
    const tip = randint(CONFIG.tipMin, CONFIG.tipMax);
    game.money += tip;
    log(`A visitor left a $${tip.toFixed(2)} tip.`, "good");
  } else {
    log("No one left a tip today.", "info");
  }
}

/* ---------- events.py ---------- */
function randomEvent() {
  const event = randint(1, 20);
  const gain = (amount, text) => { game.money += amount; log(text, "good"); };
  const lose = (amount, text) => { game.money -= amount; log(text, "bad"); };

  switch (event) {
    case 1: gain(50, "A donor gave $50."); break;
    case 2: gain(100, "Community fundraiser earned $100."); break;
    case 3: lose(50, "Fence repairs cost $50."); break;
    case 4: lose(100, "Kennel maintenance cost $100."); break;
    case 5:
      for (const dog of dogs) {
        dog.happiness = Math.min(100, dog.happiness + CONFIG.toyHappiness);
      }
      log("Several toys were donated. Every dog is a little happier.", "good");
      break;
    case 6: gain(75, "Local news featured the shelter. Donations: $75."); break;
    case 7: log("Nothing special happened this shift.", "info"); break;
    case 8: lose(80, "Storm cleanup cost $80."); break;
    case 9: gain(150, "Celebrity donation of $150!"); break;
    case 10: lose(120, "A water pipe burst. Repairs cost $120."); break;
    case 11:
      game.reviews += 1;
      log("Volunteer appreciation day. +1 review.", "good");
      break;
    case 12: gain(40, "Food supplier discount saved $40."); break;
    case 13: lose(40, "Broken kennel gate cost $40."); break;
    case 14: gain(120, "Grant approved for $120!"); break;
    case 15: log("The dogs had a peaceful shift.", "info"); break;
    case 16:
      game.dailyIntakeLimit += 1;
      log("A volunteer increased the daily intake limit.", "good");
      break;
    case 17: gain(60, "Adoption fair raised $60."); break;
    case 18: lose(60, "Power outage repairs cost $60."); break;
    case 19: gain(200, "Big donation of $200!"); break;
    default: {
      const energetic = dogs.filter((dog) => dog.energy === "high" && !dog.trained);
      if (energetic.length > 0) {
        const dog = choice(energetic);
        lose(CONFIG.digCost, `${dog.name} dug a giant hole. Repairs cost $${CONFIG.digCost}.`);
      } else {
        log("The shelter avoided damage; no untrained high-energy dogs.", "info");
      }
    }
  }
}

/** Stressed, injured, or very unhappy dogs may bite unless muzzled. */
function checkForBites() {
  for (const dog of dogs) {
    const upset = dog.status === "stressed" || dog.status === "injured" ||
      dog.happiness < CONFIG.biteHappinessBelow;
    if (upset && !dog.muzzled && Math.random() < CONFIG.biteChance) {
      game.money -= CONFIG.biteCost;
      game.reviews -= CONFIG.biteReviewLoss;
      log(`🦷 BITE! ${dog.name} bit a volunteer! Medical bill $${CONFIG.biteCost}, reviews -${CONFIG.biteReviewLoss}.`, "bad");
    }
  }
}

function shiftEvent() {
  if (randint(1, 100) <= CONFIG.shiftEventChance) {
    randomEvent();
  } else {
    log("No special event this shift.", "info");
  }
  checkForBites();
}

/** Happiness 50 pays the full price; 100 pays 150%, 0 pays 50%. */
function checkoutPayment(dog) {
  let payment = dog.carePayment * (0.5 + dog.happiness / 100);
  if (dog.status !== "healthy") {
    payment *= CONFIG.unwellCheckoutMultiplier;
  }
  return round2(payment);
}

function payDailyUpkeep() {
  if (dogs.length === 0) return;
  const pounds = dogs.reduce((total, dog) => total + dog.weight, 0);
  const upkeep = round2(pounds * CONFIG.upkeepPerPound);
  game.money -= upkeep;
  log(`Daily upkeep for ${dogs.length} dog(s): -$${upkeep.toFixed(2)}`, "bad");
}

function checkOutDogs() {
  for (const dog of dogs.slice()) {
    dog.stayDays -= 1;
    if (dog.stayDays > 0) continue;

    const payment = checkoutPayment(dog);
    game.money += payment;
    log(`${dog.name} completed their stay (happiness ${dog.happiness}). Shelter received $${payment.toFixed(2)}.`, "good");
    if (dog.status !== "healthy") {
      game.reviews -= 1;
      log(`The owner picked up ${dog.name} still unwell: -25% pay, reviews -1.`, "bad");
    }
    dogs.splice(dogs.indexOf(dog), 1);

    // The dog can come back for another stay later.
    const original = DOG_DIRECTORY.find((entry) => entry.name === dog.name);
    if (original) availableDogs.push(original);
  }
}

/** First half of events.py end_day(): everything up to the debt check. */
function endDayCore() {
  finishDayCare();
  payDailyUpkeep();

  const effect = game.moneyPerPoundEffect;
  if (effect && Math.random() < CONFIG.perPoundTradeoffChance) {
    if (effect.name === "review") {
      game.reviews -= 1;
      log("Per-pound upgrade trade-off: -1 review.", "bad");
    } else if (effect.name === "repairs") {
      game.money -= 50;
      log("Per-pound upgrade trade-off: $50 repair bill.", "bad");
    } else if (effect.name === "supplies") {
      game.money -= 30;
      log("Per-pound upgrade trade-off: $30 supply expense.", "bad");
    }
  }

  checkOutDogs();
  offerEndOfDayTip();

  if (game.money < 0) {
    game.daysInDebt += 1;
    if (game.daysInDebt >= CONFIG.daysInDebtToClose) {
      log(`The shelter ended a second day in a row in debt (${formatMoney(game.money)}) and had to close.`, "bad");
      game.gameOver = true;
      return;
    }
    log(`WARNING: The shelter is ${formatMoney(-game.money)} in debt! Get back above $0 by the end of tomorrow or the shelter will close.`, "bad");
  } else {
    game.daysInDebt = 0;
  }
}

/** Second half of end_day(): move to the next morning. */
function startNewDay() {
  game.day += 1;
  game.intakesToday = 0;
  game.shift = 0;
  if (game.moneyPerPoundEffect) {
    game.moneyPerPoundEffect = nextPoundageEffect(game.moneyPerPoundEffect);
    log(`Today's per-pound upgrade trade-off: ${game.moneyPerPoundEffect.description}`, "info");
  }
  log(`Welcome to Day ${game.day}!`, "day");
  startDayCare();
}

function daysCompleted() {
  return game.gameOver ? game.day : game.day - 1;
}


/* =====================================================================
   5. PIXEL ART - each dog is drawn from this 18x13 pixel map
      B body, D dark (ears/tail/paws), W light (belly/snout),
      E eye, N nose, T tongue. Outlines are added automatically.
   ===================================================================== */
const SPRITE_TOP = [
  "..................",
  "............DD....",
  "...........DBBD...",
  "...........BBBBB..",
  "..D........BBEBBB.",
  "..DD.......BBBBWWN",
  "...DBBBBBBBBBBWWT.",
  "...BBBBBBBBBBBB...",
  "...BBBBBBBBBBBB...",
  "...BWWWWWWWWWBB...",
];
const SPRITE_FRAMES = {
  a: SPRITE_TOP.concat([
    "...BB.BB..BB.BB...",
    "...BB.BB..BB.BB...",
    "...DD.DD..DD.DD...",
  ]),
  b: SPRITE_TOP.slice(0, 4).concat([
    ".D.........BBEBBB.",
    "..DD.......BBBBWWN",
  ], SPRITE_TOP.slice(6), [
    "...BB..BBBB..BB...",
    "..BB...BBBB...BB..",
    "..DD...DDDD...DD..",
  ]),
  lie: ["..................", "..................", ".................."]
    .concat(SPRITE_TOP.slice(1), ["...DDDD....DDDD..."]),
};

const BREED_COLORS = {
  "Labrador Retriever": ["#f0c674", "#c99a4e", "#f8e6b8"],
  "Beagle": ["#c97a3a", "#3a2a20", "#fbf4ea"],
  "German Shepherd": ["#c8873e", "#2e2219", "#e6b878"],
  "Cavalier King Charles Spaniel": ["#c0602e", "#7d3417", "#fff7ee"],
  "Border Collie": ["#2e2e36", "#15151a", "#ffffff"],
  "Basset Hound": ["#b0733a", "#5a3518", "#fbf0e0"],
  "Boxer": ["#cf7a33", "#3b2a1f", "#fff4e6"],
  "Miniature Poodle": ["#f2c9a0", "#d49a6a", "#fff3e6"],
  "Standard Poodle": ["#4a4a5a", "#26262e", "#7a7a8a"],
  "Australian Shepherd": ["#8f9bb3", "#3b3f4c", "#f4f4f4"],
  "French Bulldog": ["#dcc4a2", "#5a4636", "#f7eee2"],
  "Siberian Husky": ["#8590a0", "#454c57", "#ffffff"],
  "Shih Tzu": ["#ead8bb", "#9a7552", "#ffffff"],
  "Golden Retriever": ["#e8a843", "#b97a25", "#f7d48e"],
  "Rottweiler": ["#2d2420", "#141010", "#c06a2c"],
  "Pug": ["#e6cd9e", "#2e2420", "#f4e3c3"],
  "Australian Cattle Dog": ["#6278a0", "#2a3347", "#dce2ec"],
  "English Springer Spaniel": ["#80421f", "#4a220c", "#ffffff"],
  "Boston Terrier": ["#2b2b30", "#121214", "#ffffff"],
  "Miniature Schnauzer": ["#9a9a9a", "#555555", "#e0e0e0"],
  "Yorkshire Terrier": ["#c4914f", "#3a3f55", "#e8c88f"],
  "Doberman Pinscher": ["#2d211b", "#120c0a", "#b25d2c"],
  "Dachshund": ["#a5501f", "#5e2a0e", "#cf8550"],
  "Whippet": ["#cbbaa6", "#8a7461", "#f6efe6"],
  "Chihuahua": ["#ebbb80", "#b98049", "#fbe8cc"],
  "Cocker Spaniel": ["#dc9e58", "#a5652c", "#f4c890"],
  "Great Dane": ["#7f8b98", "#2b2f35", "#c9cfd6"],
  "Maltese": ["#fbfaf6", "#d9d2c5", "#ffffff"],
  "Pomeranian": ["#f39b3c", "#c46e1d", "#ffd59c"],
  "Bernese Mountain Dog": ["#2a2424", "#b4592b", "#ffffff"],
  "Pembroke Welsh Corgi": ["#e48d3d", "#b8611e", "#ffffff"],
};
const DEFAULT_COLORS = ["#c08850", "#6b4423", "#f2dcc0"];
const OUTLINE = "#24170f";
const FIXED_COLORS = { E: "#140c08", N: "#140c08", T: "#ff6f91", M: "#7d8aa3" };

const spriteCache = new Map();

/** Returns a data URL for a dog sprite (20x15 pixels with outline). */
function spriteURL(breed, frame, muzzled) {
  const key = `${breed}|${frame}|${muzzled}`;
  if (spriteCache.has(key)) return spriteCache.get(key);

  const rows = SPRITE_FRAMES[frame].map((row) => row.split(""));
  if (muzzled) {
    const top = frame === "lie" ? 2 : 0;
    for (let y = 3; y <= 6; y++) rows[y + top][14] = "M";
    rows[6 + top][15] = "M";
    rows[6 + top][16] = "M";
  }

  const [body, dark, light] = BREED_COLORS[breed] || DEFAULT_COLORS;
  const colors = Object.assign({ B: body, D: dark, W: light }, FIXED_COLORS);
  const width = 20;
  const height = 15;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  const filled = (x, y) => y >= 0 && y < rows.length && x >= 0 && x < 18 &&
    rows[y][x] !== "." && rows[y][x] !== undefined;

  for (let y = -1; y <= rows.length; y++) {
    for (let x = -1; x <= 18; x++) {
      if (filled(x, y)) {
        ctx.fillStyle = colors[rows[y][x]];
      } else if (filled(x + 1, y) || filled(x - 1, y) || filled(x, y + 1) || filled(x, y - 1)) {
        ctx.fillStyle = OUTLINE;
      } else {
        continue;
      }
      ctx.fillRect(x + 1, y + 1, 1, 1);
    }
  }

  const url = canvas.toDataURL();
  spriteCache.set(key, url);
  return url;
}

/** Bigger dogs get bigger sprites. */
function spriteScale(weight) {
  if (weight < 20) return 3;
  if (weight < 50) return 4;
  if (weight < 100) return 5;
  return 6;
}

/** HTML for an <img> sprite that the animation timer flips between frames. */
function spriteImg(dog, extraClass = "", animate = true) {
  const muzzled = Boolean(dog.muzzled);
  return `<img class="sprite ${animate ? "anim-sprite" : ""} ${extraClass}" alt=""
    src="${spriteURL(dog.breed, "a", muzzled)}"
    data-breed="${esc(dog.breed)}" data-muzzled="${muzzled}" data-frame="a">`;
}


/* =====================================================================
   6. UI
   ===================================================================== */
const $ = (selector) => document.querySelector(selector);
const YARDS = ["Small Dog Yard", "Medium Dog Yard", "Large Dog Yard"];
const YARD_ICONS = ["🐩", "🐕", "🦮"];

let currentYard = 0;
let uiBusy = false;
let modal = null;           // { type: "dog", dogName } etc.
let modalFeedback = null;   // { text, kind }
let logCapture = null;      // array while a banner/report is being collected
let lastMoney = null;
const walkers = new Map();  // Dog -> walker state for the Play Yard

function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

/* ---------- log ---------- */
function log(text, kind = "info") {
  if (logCapture) logCapture.push({ text, kind });
  if (!game) return;
  const item = document.createElement("li");
  item.className = `log-${kind}`;
  item.innerHTML = `<span class="log-tag">D${game.day} ${SHIFT_SHORT[game.shift]}</span> ${esc(text)}`;
  const list = $("#log");
  list.prepend(item);
  while (list.children.length > 120) list.lastChild.remove();
}

/** Run fn and return everything it logged. */
function capture(fn) {
  const lines = [];
  logCapture = lines;
  try {
    fn();
  } finally {
    logCapture = null;
  }
  return lines;
}

/* ---------- screens ---------- */
function showTitle() {
  closeModal(true);
  $("#game-screen").hidden = true;
  $("#title-screen").hidden = false;
  document.body.className = "shift-0";
  buildParade();
}

function startNewGame() {
  closeModal(true);
  newGameState();
  $("#log").innerHTML = "";
  for (const walker of walkers.values()) walker.el.remove();
  walkers.clear();
  lastMoney = null;

  $("#title-screen").hidden = true;
  $("#game-screen").hidden = false;
  log("Welcome to Day 1! Owners are waiting at the Front Desk.", "day");
  startDayCare();
  showYard(0, true);
  renderAll();
  showBanner({ icon: SHIFT_ICONS[0], title: "Day 1", sub: SHIFTS[0], lines: [] });
}

/* ---------- the assigned yards (main play area) ---------- */
function showYard(index, instant = false) {
  currentYard = (index + YARDS.length) % YARDS.length;
  const track = $("#yard-track");
  track.classList.toggle("instant", instant);
  track.style.transform = `translateX(${-100 * currentYard / YARDS.length}%)`;
  if (instant) {
    void track.offsetWidth;
    track.classList.remove("instant");
  }
  renderYardTabs();
  renderCards();
}

function renderAll() {
  renderHUD();
  renderYardTabs();
  renderDesk();
  renderCards();
  syncWalkers();
  if (modal && modal.type === "dog") renderDogModal();
  if (modal && modal.type === "shop") renderShopModal();
}

function renderHUD() {
  document.body.className = `shift-${game.shift}`;
  $("#hud-day").textContent = game.day;
  $("#hud-shift").textContent = `${SHIFT_ICONS[game.shift]} ${SHIFT_SHORT[game.shift]}`;
  const moneyEl = $("#hud-money");
  moneyEl.textContent = formatMoney(game.money);
  moneyEl.classList.toggle("negative", game.money < 0);
  if (lastMoney !== null && lastMoney !== game.money) {
    const stat = moneyEl.parentElement;
    stat.classList.remove("flash-up", "flash-down");
    void stat.offsetWidth; // restart the animation
    stat.classList.add(game.money > lastMoney ? "flash-up" : "flash-down");
  }
  lastMoney = game.money;
  $("#hud-reviews").textContent = `⭐ ${game.reviews > 0 ? "+" : ""}${game.reviews}`;
  $("#hud-reviews").classList.toggle("negative", game.reviews < 0);
  $("#hud-rate").textContent = `$${payPerPound().toFixed(2)}/lb`;
  const labels = ["End Morning ➜", "End Noon ➜", "End Day 🌙"];
  $("#btn-end-shift").textContent = labels[game.shift];
}

function renderYardTabs() {
  $("#yard-tabs").innerHTML = YARDS.map((yard, index) => {
    const inYard = dogs.filter((dog) => dog.yard === yard);
    const unwell = inYard.filter((dog) => dog.status !== "healthy").length;
    return `<button class="yard-tab ${index === currentYard ? "active" : ""}" data-action="yard-go"
        data-index="${index}" aria-pressed="${index === currentYard}">
      <span class="yard-tab-icon">${YARD_ICONS[index]}</span>
      <span class="yard-tab-name">${yard.replace(" Dog Yard", "")}<small> yard</small></span>
      <span class="yard-tab-count">${inYard.length} 🐾</span>
      ${unwell ? `<b class="badge" title="Dogs needing care">${unwell}❗</b>` : ""}
    </button>`;
  }).join("");
  for (const yard of YARDS) {
    const empty = yardElement(yard).querySelector(".yard-empty");
    empty.hidden = dogs.some((dog) => dog.yard === yard);
  }
}

/* ---------- Front Desk ---------- */
function renderDesk() {
  const reason = intakeBlockedReason();
  if (reason === null && !offer) offer = makeOffer();
  if (reason !== null) offer = null;

  const sign = $("#desk-sign");
  sign.textContent = reason === "closed" ? "CLOSED" : "OPEN";
  sign.classList.toggle("closed", reason === "closed");

  const pips = [];
  for (let i = 0; i < game.dailyIntakeLimit; i++) {
    pips.push(`<span class="pip ${i < game.intakesToday ? "used" : ""}"></span>`);
  }
  let html = `<div class="offer-pips" title="Intake offers used today">
    <span>Offers today</span> ${pips.join("")}
    <b>${game.intakesToday}/${game.dailyIntakeLimit}</b></div>`;

  if (deskResult) html += renderDeskResult();

  if (reason === "closed") {
    html += `<div class="desk-message">
      <div class="big-emoji">🔒</div>
      <h2>Intake is closed</h2>
      <p>Owners only drop dogs off during <b>Morning Intake</b>. Check on your dogs in the yards!</p>
    </div>`;
  } else if (reason === "full") {
    html += `<div class="desk-message">
      <div class="big-emoji">📋</div>
      <h2>All ${game.dailyIntakeLimit} offers used today</h2>
      <p>Buy more intake slots with 🛒 Upgrades, or end the shift.</p>
    </div>`;
  } else if (reason === "empty") {
    html += `<div class="desk-message">
      <div class="big-emoji">🫙</div>
      <h2>No dogs are waiting</h2>
      <p>Every dog is already staying with you. More come back after checkout.</p>
    </div>`;
  } else {
    html += renderOfferCard();
  }
  $("#desk-content").innerHTML = html;
}

function renderOfferCard() {
  const dog = offer.dog;
  return `<article class="offer-card" key="${esc(dog.name)}">
    <div class="offer-ribbon">🛎️ New intake offer</div>
    <div class="offer-body">
      <div class="offer-portrait">${spriteImg(dog, "portrait")}</div>
      <div class="offer-info">
        <h2>${esc(dog.name)}</h2>
        <p class="sub">${esc(dog.breed)}</p>
        <ul class="facts">
          <li>🎂 ${dog.age} years</li>
          <li>⚖️ ${dog.weight} lbs</li>
          <li>${dog.energy === "high" ? "⚡ High energy" : "😌 Calm"}</li>
          <li>🏡 ${esc(dog.yard)}</li>
        </ul>
      </div>
    </div>
    <div class="care-plan">
      <div><span>Stay</span><b>${dog.stayDays} day${dog.stayDays > 1 ? "s" : ""}</b></div>
      <div><span>Pay rate</span><b>$${offer.rate.toFixed(2)}/lb/day</b></div>
      <div><span>Upkeep</span><b>$${(dog.weight * CONFIG.upkeepPerPound).toFixed(2)}/day</b></div>
      <div class="pay"><span>Payment at checkout</span><b>$${dog.carePayment.toFixed(2)}</b></div>
    </div>
    <p class="small-note">Happy dogs pay more; unhappy or sick dogs pay less. Declining still uses an offer.</p>
    <div class="offer-buttons">
      <button class="btn btn-big btn-green" data-action="accept-offer">✔ Accept</button>
      <button class="btn btn-big btn-red" data-action="decline-offer">✖ Decline</button>
    </div>
  </article>`;
}

function renderDeskResult() {
  const r = deskResult;
  if (!r.accepted) {
    return `<div class="desk-result result-info">👋 ${esc(r.dog.name)} went home with their owner.</div>`;
  }
  const kind = r.event.outcome === "positive" ? "good" : r.event.outcome === "negative" ? "bad" : "info";
  const changes = r.event.changes.length ? ` <b>${esc(r.event.changes.join(", "))}</b>` : "";
  return `<div class="desk-result result-${kind}">
    ✅ ${esc(r.dog.name)} went to the ${esc(r.dog.yard)}.
    <span class="result-event">${esc(r.event.description)}${changes}</span>
  </div>`;
}

/* ---------- dog cards for the yard on screen ---------- */
function happinessBar(value) {
  const level = value < 25 ? "low" : value < 50 ? "mid" : value < 75 ? "ok" : "high";
  return `<div class="hbar hbar-${level}" role="meter" aria-valuemin="0" aria-valuemax="100"
    aria-valuenow="${value}" aria-label="Happiness"><span style="width:${value}%"></span></div>`;
}

function conditionHTML(dog) {
  if (dog.status === "healthy") {
    return `<p class="condition healthy">✅ Healthy</p>`;
  }
  return `<p class="condition unwell">🤒 ${esc(dog.name)} ${esc(dog.describeCondition())}</p>`;
}

function renderCards() {
  const grid = $("#dog-cards");
  const yard = YARDS[currentYard];
  const inYard = dogs.filter((dog) => dog.yard === yard);
  $("#cards-heading").textContent = `${YARD_ICONS[currentYard]} Dogs in the ${yard} (${inYard.length})`;
  if (inYard.length === 0) {
    const sizes = ["under 20 lbs", "20 to 49 lbs", "50 lbs and up"];
    grid.innerHTML = `<div class="empty-state">
      <div class="big-emoji">🐾</div>
      <p>No dogs in this yard. Dogs <b>${sizes[currentYard]}</b> stay here.
        Take dogs in at the <b>🛎️ Front Desk</b> during Morning Intake.</p>
    </div>`;
    return;
  }
  grid.innerHTML = inYard.map((dog) => `
    <article class="dog-card ${dog.status !== "healthy" ? "needs-care" : ""}">
      <button class="dog-card-hit" data-action="open-dog" data-dog="${esc(dog.name)}"
        aria-label="Open ${esc(dog.name)}"></button>
      <div class="dog-card-top">
        <div class="mini-portrait">${spriteImg(dog, "mini")}</div>
        <div>
          <h3>${esc(dog.name)}</h3>
          <p class="sub">${esc(dog.breed)}</p>
        </div>
      </div>
      <ul class="facts">
        <li>⚖️ ${dog.weight} lbs</li>
        <li>📅 ${dog.stayDays} day${dog.stayDays === 1 ? "" : "s"} left</li>
        ${dog.muzzled ? "<li>🔒 Muzzled</li>" : ""}
        ${dog.trained ? "<li>🎓 Trained</li>" : ""}
      </ul>
      ${conditionHTML(dog)}
      <div class="happy-row"><span>Happiness ${dog.happiness}</span>${happinessBar(dog.happiness)}</div>
      <div class="card-button">${dog.status !== "healthy" ? "💉 Treat now" : "📋 Stats & care"}</div>
    </article>`).join("");
}

/* ---------- Upgrades (shop window) ---------- */
function openShop() {
  modalFeedback = null;
  modal = { type: "shop" };
  renderShopModal(true);
}

function renderShopModal(first = false) {
  const items = CONFIG.intakeUpgrades.map((upgrade, index) => ({
    icon: ["📋", "🗂️", "🏢"][index],
    title: `+${upgrade.slots} daily intake slots`,
    text: `See more dogs each morning. Your limit is ${game.dailyIntakeLimit}.`,
    cost: upgrade.cost,
    action: `data-action="buy-slots" data-index="${index}"`,
    disabled: game.money < upgrade.cost,
  }));

  const effect = game.moneyPerPoundEffect;
  items.push({
    icon: "💵",
    title: `+$${CONFIG.perPoundUpgradeBonus.toFixed(2)} per pound`,
    text: effect
      ? `Owned! Today's trade-off: ${effect.description}`
      : "Earn more at checkout. Trade-off: a random daily cost (lost review or repair/supply bill) that changes every day.",
    cost: CONFIG.perPoundUpgradeCost,
    action: `data-action="buy-perpound"`,
    disabled: Boolean(effect) || game.money < CONFIG.perPoundUpgradeCost,
    owned: Boolean(effect),
  });

  items.push({
    icon: "🔒",
    title: "Muzzle",
    text: "Stops one dog from biting for the rest of its stay.",
    cost: CONFIG.muzzleCost,
    action: `data-action="pick-dog" data-item="muzzle"`,
    disabled: game.money < CONFIG.muzzleCost || dogs.length === 0,
    pick: true,
  });
  items.push({
    icon: "🦴",
    title: "Training treats",
    text: "Calms one high-energy dog so it stops digging holes.",
    cost: CONFIG.treatsCost,
    action: `data-action="pick-dog" data-item="treats"`,
    disabled: game.money < CONFIG.treatsCost || dogs.length === 0,
    pick: true,
  });

  const cards = items.map((item) => `
    <article class="shop-item ${item.owned ? "owned" : ""}">
      <div class="shop-icon">${item.icon}</div>
      <h3>${esc(item.title)}</h3>
      <p>${esc(item.text)}</p>
      <button class="btn ${item.owned ? "btn-ghost" : "btn-yellow"}" ${item.action} ${item.disabled ? "disabled" : ""}>
        ${item.owned ? "✔ Owned" : `${item.pick ? "Choose dog · " : "Buy · "}$${item.cost}`}
      </button>
    </article>`).join("");

  const feedback = modalFeedback
    ? `<p class="feedback feedback-${modalFeedback.kind}" role="status">${esc(modalFeedback.text)}</p>` : "";
  const html = `
    <button class="modal-close" data-action="close-modal" aria-label="Close">✖</button>
    <h2>🛒 Upgrades</h2>
    <p class="sub">You have <b>${formatMoney(game.money)}</b> · Daily intake limit: <b>${game.dailyIntakeLimit}</b></p>
    ${feedback}
    <div class="shop-grid">${cards}</div>`;
  if (first) {
    openModal(modal, html);
  } else {
    $("#modal").innerHTML = html;
  }
}

/* ---------- Play Yard (walking dogs) ---------- */
function yardElement(yardName) {
  return document.querySelector(`.yard[data-yard="${yardName}"]`);
}

function syncWalkers() {
  for (const dog of dogs) {
    if (!walkers.has(dog)) createWalker(dog);
  }
  for (const [dog, walker] of walkers) {
    if (!dogs.includes(dog)) {
      walkers.delete(dog);
      walker.el.classList.add("leaving");
      setTimeout(() => walker.el.remove(), 700);
      continue;
    }
    walker.el.classList.toggle("unwell", dog.status !== "healthy");
    walker.el.classList.toggle("selected", Boolean(modal && modal.dogName === dog.name));
  }
  const hint = $("#yard-hint");
  hint.textContent = dogs.length
    ? "Use ◀ ▶ to visit each yard. Click a dog to see its stats and give care. ❗ = needs help."
    : "The yards are empty. Take in dogs at the 🛎️ Front Desk during Morning Intake.";
}

function createWalker(dog) {
  const el = document.createElement("button");
  el.className = "walker";
  el.dataset.action = "open-dog";
  el.dataset.dog = dog.name;
  el.setAttribute("aria-label", `${dog.name}, ${dog.breed}`);
  el.style.setProperty("--s", spriteScale(dog.weight));
  el.innerHTML = `<span class="bubble">❗</span><img class="sprite" alt=""><span class="tag">${esc(dog.name)}</span>`;
  yardElement(dog.yard).appendChild(el);

  const walker = {
    el,
    img: el.querySelector("img"),
    x: 0.3 + Math.random() * 0.4,
    y: 0.97,                   // walk in through the gate at the bottom
    tx: 0.5,
    ty: 0.6,
    pause: 0,
    facing: 1,
    frame: "a",
    frameTime: 0,
    src: "",
  };
  pickTarget(walker);
  walkers.set(dog, walker);
  placeWalker(dog, walker);
}

function pickTarget(walker) {
  walker.tx = 0.08 + Math.random() * 0.84;
  walker.ty = 0.42 + Math.random() * 0.5;
}

function walkerSpeed(dog) {
  let speed = dog.energy === "high" ? 0.13 : 0.075;
  if (dog.status !== "healthy") speed *= 0.4;
  return speed;
}

function updateWalker(dog, walker, dt) {
  if (walker.pause > 0) {
    walker.pause -= dt;
    walker.frame = dog.status !== "healthy" ? "lie" : "a";
    if (walker.pause <= 0) pickTarget(walker);
    return;
  }
  const dx = walker.tx - walker.x;
  const dy = walker.ty - walker.y;
  const distance = Math.hypot(dx, dy);
  const step = walkerSpeed(dog) * dt;
  if (distance <= step) {
    walker.x = walker.tx;
    walker.y = walker.ty;
    const lazy = dog.status !== "healthy" ? 2.5 : 1;
    walker.pause = (0.6 + Math.random() * 2.4) * lazy;
    return;
  }
  walker.x += (dx / distance) * step;
  walker.y += (dy / distance) * step;
  if (Math.abs(dx) > 0.002) walker.facing = dx > 0 ? 1 : -1;
  walker.frameTime += dt;
  if (walker.frameTime > (dog.energy === "high" ? 0.14 : 0.2)) {
    walker.frameTime = 0;
    walker.frame = walker.frame === "a" ? "b" : "a";
  }
}

function placeWalker(dog, walker) {
  const el = walker.el;
  el.style.left = `${(walker.x * 100).toFixed(2)}%`;
  el.style.top = `${(walker.y * 100).toFixed(2)}%`;
  el.style.zIndex = String(10 + Math.round(walker.y * 100));
  el.classList.toggle("flip", walker.facing < 0);
  const src = spriteURL(dog.breed, walker.frame, dog.muzzled);
  if (src !== walker.src) {
    walker.img.src = src;
    walker.src = src;
  }
}

function placeAllWalkers() {
  for (const [dog, walker] of walkers) placeWalker(dog, walker);
}

let lastTick = 0;
function tick(time) {
  const dt = Math.min(0.05, (time - lastTick) / 1000 || 0);
  lastTick = time;
  const watching = !$("#game-screen").hidden;
  for (const [dog, walker] of walkers) {
    updateWalker(dog, walker, dt);
    if (watching) placeWalker(dog, walker);
  }
  requestAnimationFrame(tick);
}

/** A floating emoji (heart, coin...) over a dog in the yard. */
function floatOverDog(dog, text) {
  const walker = walkers.get(dog);
  if (!walker) return;
  const el = document.createElement("span");
  el.className = "float";
  el.textContent = text;
  el.style.left = walker.el.style.left;
  el.style.top = walker.el.style.top;
  walker.el.parentElement.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

/* ---------- sprite frame flipping (cards, portraits, title) ---------- */
setInterval(() => {
  document.querySelectorAll("img.anim-sprite").forEach((img) => {
    const next = img.dataset.frame === "a" ? "b" : "a";
    img.dataset.frame = next;
    img.src = spriteURL(img.dataset.breed, next, img.dataset.muzzled === "true");
  });
}, 260);

function buildParade() {
  const parade = $("#title-parade");
  const breeds = ["Golden Retriever", "Beagle", "Siberian Husky", "Pembroke Welsh Corgi", "Dachshund", "Border Collie"];
  parade.innerHTML = breeds.map((breed, i) => `
    <div class="parade-dog" style="--delay:${-i * 2.6}s; --s:${i % 2 ? 3.6 : 4.4}">
      ${spriteImg({ breed, muzzled: false })}
    </div>`).join("");
}

/* ---------- banners (shift / day transitions) ---------- */
function showBanner({ icon, title, sub, lines }, done) {
  const banner = $("#banner");
  uiBusy = true;
  $("#banner-icon").textContent = icon;
  $("#banner-title").textContent = title;
  $("#banner-sub").textContent = sub;
  $("#banner-lines").innerHTML = lines
    .map((line) => `<li class="log-${line.kind}">${esc(line.text)}</li>`).join("");
  banner.className = `banner banner-shift-${game.shift}`;
  banner.hidden = false;
  void banner.offsetWidth;
  banner.classList.add("show");

  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    clearTimeout(timer);
    banner.classList.add("hide");
    setTimeout(() => {
      banner.hidden = true;
      banner.classList.remove("show", "hide");
      uiBusy = false;
      if (done) done();
    }, 380);
  };
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const timer = setTimeout(finish, (reduced ? 900 : 1500) + lines.length * 1100);
  banner.onclick = finish;
}

/* ---------- End Shift ---------- */
function endShift() {
  if (uiBusy || game.gameOver) return;
  closeModal(true);
  offer = null;
  deskResult = null;
  const moneyBefore = game.money;

  const shiftLines = capture(shiftEvent);

  if (game.shift < SHIFTS.length - 1) {
    game.shift += 1;
    renderAll();
    showBanner({
      icon: SHIFT_ICONS[game.shift],
      title: SHIFTS[game.shift],
      sub: `Day ${game.day}`,
      lines: shiftLines.filter((line) => line.text !== "No special event this shift."),
    });
    return;
  }

  const dayNumber = game.day;
  const dayLines = capture(endDayCore);
  if (game.gameOver) {
    renderAll();
    showDayReport(dayNumber, shiftLines, dayLines, moneyBefore, () => showGameOver("closed"));
    return;
  }
  const morningLines = capture(startNewDay);
  renderAll();
  showDayReport(dayNumber, shiftLines, dayLines, moneyBefore, () => {
    showBanner({
      icon: SHIFT_ICONS[0],
      title: `Day ${game.day}`,
      sub: SHIFTS[0],
      lines: morningLines.filter((line) => !line.text.startsWith("Welcome")),
    });
  });
}

/* ---------- modals ---------- */
function openModal(state, html) {
  modal = state;
  const root = $("#modal-root");
  const box = $("#modal");
  box.className = `modal modal-${state.type}`;
  box.innerHTML = html;
  root.hidden = false;
  const focusTarget = box.querySelector("[data-autofocus]") || box.querySelector("button");
  if (focusTarget) focusTarget.focus({ preventScroll: true });
}

function closeModal(force = false) {
  if (!modal) return;
  if (!force && modal.locked) return;
  modal = null;
  modalFeedback = null;
  $("#modal-root").hidden = true;
  $("#modal").innerHTML = "";
  if (game) syncWalkers();
}

function openDogModal(name) {
  modalFeedback = null;
  modal = { type: "dog", dogName: name };
  renderDogModal(true);
  syncWalkers();
}

function renderDogModal(first = false) {
  const dog = findDogByName(modal.dogName);
  if (!dog) {
    closeModal(true);
    return;
  }
  const unwell = dog.status !== "healthy";
  const treatments = Object.keys(CONFIG.treatmentCosts).map((action) => {
    const cost = CONFIG.treatmentCosts[action];
    const disabled = !unwell || game.money < cost;
    return `<button class="treat-btn" data-action="treat" data-treatment="${action}" ${disabled ? "disabled" : ""}>
      <span class="treat-icon">${TREATMENT_ICONS[action]}</span>
      <span class="treat-name">${action}</span>
      <span class="treat-cost">$${cost}</span>
    </button>`;
  }).join("");

  const muzzleBlocked = itemBlockedReason("muzzle", dog);
  const treatsBlocked = itemBlockedReason("treats", dog);
  const feedback = modalFeedback
    ? `<p class="feedback feedback-${modalFeedback.kind}" role="status">${esc(modalFeedback.text)}</p>`
    : `<p class="feedback" role="status">${unwell ? "Read the symptom and pick the treatment you think it needs." : `${esc(dog.name)} is healthy - no treatment needed.`}</p>`;

  const html = `
    <button class="modal-close" data-action="close-modal" aria-label="Close">✖</button>
    <div class="dog-sheet">
      <div class="dog-portrait-box ${unwell ? "unwell" : ""}">
        ${spriteImg(dog, "portrait-big")}
        <div class="portrait-floats" id="portrait-floats"></div>
      </div>
      <div class="dog-sheet-info">
        <h2>${esc(dog.name)}</h2>
        <p class="sub">${esc(dog.breed)} · ${dog.age} years old</p>
        <ul class="facts facts-grid">
          <li><span>Weight</span><b>${dog.weight} lbs</b></li>
          <li><span>Energy</span><b>${dog.energy === "high" ? "⚡ High" : "😌 Calm"}${dog.trained ? " 🎓" : ""}</b></li>
          <li><span>Yard</span><b>${esc(dog.yard.replace(" Dog Yard", ""))}</b></li>
          <li><span>Days left</span><b>${dog.stayDays}</b></li>
          <li><span>Base pay</span><b>$${dog.carePayment.toFixed(2)}</b></li>
          <li><span>Pay if leaving now</span><b>$${checkoutPayment(dog).toFixed(2)}</b></li>
        </ul>
        ${conditionHTML(dog)}
        <div class="happy-row"><span>Happiness ${dog.happiness}</span>${happinessBar(dog.happiness)}</div>
      </div>
    </div>
    <h3 class="section-title">💉 Treatments</h3>
    <div class="treat-grid">${treatments}</div>
    ${feedback}
    <h3 class="section-title">🧰 Supplies</h3>
    <div class="supply-row">
      <button class="btn btn-purple" data-action="use-item" data-item="muzzle"
        ${muzzleBlocked || game.money < CONFIG.muzzleCost ? "disabled" : ""}>
        🔒 ${muzzleBlocked || `Muzzle · $${CONFIG.muzzleCost}`}</button>
      <button class="btn btn-purple" data-action="use-item" data-item="treats"
        ${treatsBlocked || game.money < CONFIG.treatsCost ? "disabled" : ""}>
        🦴 ${treatsBlocked || `Training treats · $${CONFIG.treatsCost}`}</button>
    </div>`;

  if (first) {
    openModal(modal, html);
  } else {
    $("#modal").innerHTML = html;
  }
}

function floatInPortrait(text) {
  const box = $("#portrait-floats");
  if (!box) return;
  const el = document.createElement("span");
  el.className = "float";
  el.textContent = text;
  el.style.left = "50%";
  el.style.top = "45%";
  box.appendChild(el);
  setTimeout(() => el.remove(), 1300);
}

function openPicker(itemName) {
  const label = itemName === "muzzle" ? "muzzle" : "train with treats";
  const buttons = dogs.map((dog) => {
    const blocked = itemBlockedReason(itemName, dog);
    return `<button class="pick-btn" data-action="pick-item-dog" data-item="${itemName}"
        data-dog="${esc(dog.name)}" ${blocked ? "disabled" : ""}>
      ${spriteImg(dog, "mini", false)}
      <span><b>${esc(dog.name)}</b><small>${blocked ? esc(blocked) : esc(dog.breed)}</small></span>
    </button>`;
  }).join("");
  openModal({ type: "picker" }, `
    <button class="modal-close" data-action="close-modal" aria-label="Close">✖</button>
    <h2>Choose a dog to ${label}</h2>
    <div class="pick-grid">${buttons}</div>`);
}

function showHowTo() {
  openModal({ type: "howto" }, `
    <button class="modal-close" data-action="close-modal" aria-label="Close">✖</button>
    <h2>🐾 How to Play</h2>
    <div class="howto">
      <p><b>Every day has three shifts:</b> 🌅 Morning Intake, ☀️ Noon and 🌙 Night.
        Press <b>End Shift</b> to move on.</p>
      <p><b>🛎️ Front Desk:</b> owners only drop dogs off in the morning. Every offer uses
        one of your daily slots, whether you <b>Accept</b> or <b>Decline</b>.</p>
      <p><b>💰 Money:</b> dogs pay when they check out, but every dog costs
        <b>$${CONFIG.upkeepPerPound.toFixed(2)} per pound per day</b>. End two days in a row
        in debt and the shelter closes.</p>
      <p><b>🤒 Care:</b> you only see symptoms. Click a dog in the <b>Play Yard</b> or
        <b>Kennel</b> and pick a treatment: 🍖 feed $5, 💊 medicate $25, 🎾 play $0,
        🩺 vet $40, 🧸 comfort $5. Right = happier dog and +1 review. Wrong = -1 review.</p>
      <p><b>😊 Happiness</b> changes the checkout payment (50 = full price, 100 = 150%).
        <b>⭐ Reviews</b> change the pay rate for new dogs.</p>
      <p><b>🦷 Bites:</b> stressed, injured or very unhappy dogs can bite ($50, -2 reviews).
        A 🔒 muzzle stops it.</p>
    </div>
    <button class="btn btn-green" data-action="close-modal" data-autofocus>Got it!</button>`);
}

function showPauseMenu() {
  openModal({ type: "menu" }, `
    <h2>⏸️ Paused</h2>
    <div class="menu-stack">
      <button class="btn btn-big btn-green" data-action="close-modal" data-autofocus>▶ Resume</button>
      <button class="btn btn-big btn-blue" data-action="how-to">? How to Play</button>
      <button class="btn btn-big btn-red" data-action="retire">🏁 Retire &amp; see results</button>
    </div>`);
}

function showDayReport(dayNumber, shiftLines, dayLines, moneyBefore, done) {
  const lines = shiftLines.concat(dayLines)
    .filter((line) => line.text !== "No special event this shift.");
  const icons = { good: "🟢", bad: "🔴", info: "🔵", day: "🌅" };
  const change = game.money - moneyBefore;
  openModal({ type: "report", locked: true, done }, `
    <h2>🌙 End of Day ${dayNumber}</h2>
    <ul class="report-lines">
      ${lines.map((line) => `<li class="log-${line.kind}">${icons[line.kind] || "•"} ${esc(line.text)}</li>`).join("")}
    </ul>
    <div class="report-money">
      <span>Money</span>
      <b>${formatMoney(moneyBefore)} ➜ ${formatMoney(game.money)}</b>
      <em class="${change >= 0 ? "up" : "down"}">${change >= 0 ? "+" : "-"}$${Math.abs(change).toFixed(2)}</em>
    </div>
    <button class="btn btn-big ${game.gameOver ? "btn-red" : "btn-green"}" data-action="report-continue" data-autofocus>
      ${game.gameOver ? "See final results" : `Start Day ${game.day} ☀️`}</button>`);
}

function showGameOver(reason) {
  const closed = reason === "closed";
  openModal({ type: "gameover", locked: true }, `
    <div class="gameover-icon">${closed ? "🏚️" : "🏁"}</div>
    <h2>${closed ? "The shelter had to close" : "You retired!"}</h2>
    <p class="sub">${closed ? "Two days in a row in debt." : "Here's how your shelter did."}</p>
    <ul class="final-stats">
      <li><span>Days completed</span><b>${daysCompleted()}</b></li>
      <li><span>Money</span><b>${formatMoney(game.money)}</b></li>
      <li><span>Total dogs processed</span><b>${game.totalDogs}</b></li>
      <li><span>Dogs in shelter</span><b>${dogs.length}</b></li>
      <li><span>Shelter reviews</span><b>${game.reviews}</b></li>
    </ul>
    <div class="menu-stack">
      <button class="btn btn-big btn-green" data-action="new-game" data-autofocus>🔁 Play Again</button>
      <button class="btn btn-big btn-blue" data-action="main-menu">🏠 Main Menu</button>
    </div>`);
  game.gameOver = true;
}

/* ---------- input ---------- */
document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) {
    if (event.target === $("#modal-root") && modal && !modal.locked) closeModal();
    return;
  }
  if (uiBusy) return;
  const action = target.dataset.action;

  switch (action) {
    case "new-game":
      startNewGame();
      break;
    case "how-to":
      showHowTo();
      break;
    case "main-menu":
      showTitle();
      break;
    case "menu":
      showPauseMenu();
      break;
    case "retire":
      closeModal(true);
      showGameOver("retired");
      break;
    case "close-modal":
      closeModal();
      break;
    case "yard-prev":
      showYard(currentYard - 1);
      break;
    case "yard-next":
      showYard(currentYard + 1);
      break;
    case "yard-go":
      showYard(Number(target.dataset.index));
      break;
    case "upgrades":
      openShop();
      break;
    case "jump-intake":
      $("#intake-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    case "end-shift":
      endShift();
      break;
    case "accept-offer":
    case "decline-offer":
      if (!offer) break;
      deskResult = answerOffer(action === "accept-offer");
      renderAll();
      if (deskResult.accepted) {
        // Slide to the dog's assigned yard so you can watch it walk in.
        showYard(YARDS.indexOf(deskResult.dog.yard));
        setTimeout(() => floatOverDog(deskResult.dog, "🏠"), 50);
      }
      break;
    case "open-dog":
      openDogModal(target.dataset.dog);
      break;
    case "treat": {
      const dog = findDogByName(modal.dogName);
      const result = provideCare(dog, target.dataset.treatment);
      modalFeedback = {
        text: result.text,
        kind: !result.done ? "info" : result.correct ? "good" : "bad",
      };
      renderAll();
      if (result.done) {
        floatInPortrait(result.correct ? "💖" : "💢");
        floatOverDog(dog, result.correct ? "💖" : "💢");
      }
      break;
    }
    case "use-item": {
      const dog = findDogByName(modal.dogName);
      const result = buyAndUseItem(target.dataset.item, dog);
      modalFeedback = { text: result.text, kind: result.done ? "good" : "info" };
      renderAll();
      break;
    }
    case "pick-dog":
      openPicker(target.dataset.item);
      break;
    case "pick-item-dog": {
      const dog = findDogByName(target.dataset.dog);
      const result = buyAndUseItem(target.dataset.item, dog);
      closeModal();
      openShop();
      modalFeedback = { text: result.text, kind: result.done ? "good" : "info" };
      renderAll();
      if (result.done) floatOverDog(dog, target.dataset.item === "muzzle" ? "🔒" : "🦴");
      break;
    }
    case "buy-slots": {
      const result = buyIntakeUpgrade(Number(target.dataset.index));
      modalFeedback = result.done
        ? { text: `Daily intake limit is now ${game.dailyIntakeLimit}.`, kind: "good" }
        : { text: result.text, kind: "info" };
      renderAll();
      break;
    }
    case "buy-perpound": {
      const result = buyPerPoundUpgrade();
      modalFeedback = result.done
        ? { text: `Purchased! Today's trade-off: ${game.moneyPerPoundEffect.description}`, kind: "good" }
        : { text: result.text, kind: "info" };
      renderAll();
      break;
    }
    case "report-continue": {
      const done = modal.done;
      closeModal(true);
      if (done) done();
      break;
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal && !modal.locked) closeModal();
});

/* ---------- start ---------- */
buildParade();
requestAnimationFrame(tick);
