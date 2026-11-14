"use strict";

/* =====================================================================
   DOG SHELTER MANAGER 0.2 - game.js
   The rules of the game. No drawing happens in this file.
     1. CONFIG       - every balance number, in one place
     2. DATA         - dogs, intake events, symptoms, toys, staff
     3. Dog class    - mirrors dog.py, plus exercise / stuck-in-hole
     4. GAME RULES   - intake, care, shifts, yards, staff, toys, incidents
     5. SAVE / LOAD  - continue your last game (browser localStorage)
   Other files: yard.js (draws the yards), minigames.js (fence + hole),
   ui.js (screens, panels, buttons).
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
  toyHappiness: 5,

  // Happy dogs sometimes earn a review at the end of the day.
  happyReviewAt: 80,
  happyReviewChance: 0.25,
  plushReviewChance: 0.45,

  // --- Yard capacity ---
  yardCapacity: { "Small Dog Yard": 4, "Medium Dog Yard": 4, "Large Dog Yard": 3 },
  yardExpansionSlots: 2,
  yardExpansionCost: { "Small Dog Yard": 150, "Medium Dog Yard": 200, "Large Dog Yard": 250 },
  yardExpansionGrowth: 1.5,   // each expansion of the same yard costs 50% more

  // --- Noon: walks and play sessions ---
  noonSlots: 3,               // walks + play sessions that fit in one noon shift
  walkHappiness: 12,          // one dog
  playSessionHappiness: 5,    // every dog in one yard
  exercisedBiteMultiplier: 0.3, // walked/played dogs are much calmer for the day

  // --- Night: feeding and kennel cleaning ---
  nightSlots: 4,              // chores that fit in one night shift
  unfedHungryChance: 0.5,     // per dog, if their yard wasn't fed
  uncleanSickChance: 0.3,     // per dog, if their yard wasn't cleaned

  // --- Staff (paid every night) ---
  staff: {
    vetTech:    { wage: 40 },
    walker:     { wage: 30, walks: 2 },
    kennelHand: { wage: 25 },
  },

  // --- Broken fences and holes ---
  incidentChance: 0.12,       // per shift, if an untrained high-energy dog is restless
  fenceRepairCost: 60,        // if you leave a broken fence until night
  fenceRepairReviews: 1,
  holeStuckHappiness: 15,     // if a dog is left in a hole overnight
  holeStuckCost: 20,
  holeRescueHappiness: 5,

  // --- Toys ---
  toyPriceMultiplier: { "Small Dog Yard": 1, "Medium Dog Yard": 1.3, "Large Dog Yard": 1.6 },
  ballHappinessPerShift: 2,
  bedHappinessOvernight: 2,
  bedUntreatedMultiplier: 0.5,
  chewIncidentMultiplier: 0.4,
  waterIssueMultiplier: 0.6,
  houseBiteMultiplier: 0.4,
  playGearMultiplier: 1.5,
  plushHappinessMorning: 3,

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
const YARDS = ["Small Dog Yard", "Medium Dog Yard", "Large Dog Yard"];
const YARD_SHORT = { "Small Dog Yard": "Small", "Medium Dog Yard": "Medium", "Large Dog Yard": "Large" };

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

const STAFF_INFO = {
  vetTech: {
    icon: "🩺", title: "Vet Tech",
    text: "Every morning, treats the dog that has been unwell longest (you still pay for the treatment).",
  },
  walker: {
    icon: "🦮", title: "Dog Walker",
    text: "Every noon, walks the 2 least happy dogs without using your noon slots.",
  },
  kennelHand: {
    icon: "🧹", title: "Kennel Hand",
    text: "Every night, feeds every yard and cleans every kennel for you.",
  },
};

// Toy slots and what they do (art and names per yard are in YARD_ART below).
const TOY_SLOTS = {
  bed:   { basePrice: 40, effect: "+2 happiness each night, and untreated issues hurt half as much." },
  ball:  { basePrice: 30, effect: "+2 happiness for every dog here after each shift." },
  chew:  { basePrice: 35, effect: "Busy jaws: 60% fewer broken fences and holes from dogs here." },
  water: { basePrice: 45, effect: "Fresh water: dogs here are 40% less likely to get sick or hungry." },
  house: { basePrice: 70, effect: "A safe hideout: dogs here are 60% less likely to bite." },
  play:  { basePrice: 55, effect: "Walks and play sessions here give 50% more happiness." },
  plush: { basePrice: 40, effect: "+3 happiness every morning, and happy dogs here leave more reviews." },
};
const TOY_ORDER = ["bed", "ball", "chew", "water", "house", "play", "plush"];

// Yard art from assets/yard/manifest.json (sizes are one frame, in pixels).
const YARD_ART = {
  "base": "assets/yard/",
  "grass": {
    "Small Dog Yard": [
      "grass/grass_small_1.png",
      "grass/grass_small_2.png",
      "grass/grass_small_3.png",
      "grass/grass_small_flowers.png"
    ],
    "Medium Dog Yard": [
      "grass/grass_medium_1.png",
      "grass/grass_medium_2.png",
      "grass/grass_medium_3.png",
      "grass/grass_medium_flowers.png"
    ],
    "Large Dog Yard": [
      "grass/grass_large_1.png",
      "grass/grass_large_2.png",
      "grass/grass_large_3.png",
      "grass/grass_large_flowers.png"
    ]
  },
  "path": "grass/dirt_path.png",
  "fence": {
    "section": "fence/fence_section.png",
    "heart": "fence/fence_section_heart.png",
    "post": "fence/fence_post.png",
    "endLeft": "fence/fence_end_left.png",
    "endRight": "fence/fence_end_right.png",
    "gate": "fence/fence_gate.png"
  },
  "plants": [
    {
      "file": "plants/tulips.png",
      "w": 32,
      "h": 32,
      "frames": 6,
      "fps": 6
    },
    {
      "file": "plants/daisies.png",
      "w": 32,
      "h": 32,
      "frames": 6,
      "fps": 6
    },
    {
      "file": "plants/sunflower.png",
      "w": 32,
      "h": 48,
      "frames": 6,
      "fps": 6
    },
    {
      "file": "plants/bluebells.png",
      "w": 32,
      "h": 32,
      "frames": 6,
      "fps": 6
    },
    {
      "file": "plants/lavender.png",
      "w": 32,
      "h": 32,
      "frames": 6,
      "fps": 6
    },
    {
      "file": "plants/tall_grass.png",
      "w": 32,
      "h": 32,
      "frames": 6,
      "fps": 6
    },
    {
      "file": "plants/fern.png",
      "w": 32,
      "h": 32,
      "frames": 6,
      "fps": 6
    },
    {
      "file": "plants/rose_bush.png",
      "w": 32,
      "h": 32,
      "frames": 6,
      "fps": 6
    },
    {
      "file": "plants/dandelion.png",
      "w": 32,
      "h": 32,
      "frames": 6,
      "fps": 6
    }
  ],
  "butterfly": {
    "file": "plants/butterfly.png",
    "w": 16,
    "h": 16,
    "frames": 4,
    "fps": 10
  },
  "toys": {
    "Small Dog Yard": {
      "bed": {
        "file": "toys/small/bed.png",
        "w": 28,
        "h": 18,
        "frames": 1,
        "fps": 0,
        "name": "Pink cushion bed"
      },
      "ball": {
        "file": "toys/small/ball.png",
        "w": 12,
        "h": 14,
        "frames": 4,
        "fps": 8,
        "name": "Tennis ball"
      },
      "chew": {
        "file": "toys/small/chew.png",
        "w": 16,
        "h": 10,
        "frames": 1,
        "fps": 0,
        "name": "Mini bone"
      },
      "water": {
        "file": "toys/small/water.png",
        "w": 18,
        "h": 12,
        "frames": 4,
        "fps": 4,
        "name": "Little water bowl"
      },
      "house": {
        "file": "toys/small/house.png",
        "w": 30,
        "h": 30,
        "frames": 1,
        "fps": 0,
        "name": "Cottage dog house"
      },
      "play": {
        "file": "toys/small/play.png",
        "w": 34,
        "h": 20,
        "frames": 1,
        "fps": 0,
        "name": "Crinkle tunnel"
      },
      "plush": {
        "file": "toys/small/plush.png",
        "w": 16,
        "h": 16,
        "frames": 1,
        "fps": 0,
        "name": "Squeaky duck"
      }
    },
    "Medium Dog Yard": {
      "bed": {
        "file": "toys/medium/bed.png",
        "w": 36,
        "h": 20,
        "frames": 1,
        "fps": 0,
        "name": "Comfy pillow bed"
      },
      "ball": {
        "file": "toys/medium/ball.png",
        "w": 14,
        "h": 16,
        "frames": 4,
        "fps": 8,
        "name": "Rubber star ball"
      },
      "chew": {
        "file": "toys/medium/chew.png",
        "w": 30,
        "h": 12,
        "frames": 1,
        "fps": 0,
        "name": "Rope tug"
      },
      "water": {
        "file": "toys/medium/water.png",
        "w": 24,
        "h": 14,
        "frames": 4,
        "fps": 4,
        "name": "Water bowl"
      },
      "house": {
        "file": "toys/medium/house.png",
        "w": 38,
        "h": 36,
        "frames": 1,
        "fps": 0,
        "name": "Blue dog house"
      },
      "play": {
        "file": "toys/medium/play.png",
        "w": 32,
        "h": 26,
        "frames": 1,
        "fps": 0,
        "name": "Agility hurdle"
      },
      "plush": {
        "file": "toys/medium/plush.png",
        "w": 22,
        "h": 24,
        "frames": 1,
        "fps": 0,
        "name": "Plush bunny"
      }
    },
    "Large Dog Yard": {
      "bed": {
        "file": "toys/large/bed.png",
        "w": 46,
        "h": 24,
        "frames": 1,
        "fps": 0,
        "name": "Big bolster bed"
      },
      "ball": {
        "file": "toys/large/ball.png",
        "w": 18,
        "h": 20,
        "frames": 4,
        "fps": 8,
        "name": "Beach ball"
      },
      "chew": {
        "file": "toys/large/chew.png",
        "w": 30,
        "h": 24,
        "frames": 1,
        "fps": 0,
        "name": "Chew tire"
      },
      "water": {
        "file": "toys/large/water.png",
        "w": 52,
        "h": 26,
        "frames": 4,
        "fps": 4,
        "name": "Kiddie pool"
      },
      "house": {
        "file": "toys/large/house.png",
        "w": 48,
        "h": 44,
        "frames": 1,
        "fps": 0,
        "name": "Barn dog house"
      },
      "play": {
        "file": "toys/large/play.png",
        "w": 60,
        "h": 34,
        "frames": 1,
        "fps": 0,
        "name": "A-frame ramp"
      },
      "plush": {
        "file": "toys/large/plush.png",
        "w": 30,
        "h": 30,
        "frames": 1,
        "fps": 0,
        "name": "Giant teddy bear"
      }
    }
  },
  "toyScale": {
    "Small Dog Yard": 1.9,
    "Medium Dog Yard": 2.4,
    "Large Dog Yard": 2.9
  }
};


/* =====================================================================
   3. Dog class - mirrors dog.py, with two new bits of state for 0.2
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
    this.exercisedToday = false;  // walked or played at noon
    this.stuckInHole = false;     // dug a hole and got stuck
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
      this.changeHappiness(CONFIG.correctTreatmentHappiness);
      return true;
    }
    this.changeHappiness(-CONFIG.wrongTreatmentHappiness);
    return false;
  }

  /** Another day with an unresolved issue: happiness drops more each day. */
  applyUntreatedDay(multiplier = 1) {
    this.issueDays += 1;
    this.changeHappiness(-Math.round(CONFIG.untreatedHappinessPerDay * this.issueDays * multiplier));
  }

  /** A walk or play session: happier, and calmer for the rest of the day. */
  exercise(amount) {
    this.changeHappiness(amount);
    this.exercisedToday = true;
  }

  changeHappiness(amount) {
    this.happiness = clamp(this.happiness + amount, 0, 100);
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

function emptyPerYard(value) {
  const result = {};
  for (const yard of YARDS) result[yard] = typeof value === "function" ? value() : value;
  return result;
}

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
    moneyPerPoundEffect: null,      // name of today's trade-off
    gameOver: false,
    daysInDebt: 0,
    // 0.2
    yardCapacity: Object.assign({}, CONFIG.yardCapacity),
    yardExpansions: emptyPerYard(0),
    noonSlotsUsed: 0,
    playSessions: emptyPerYard(false),
    nightSlotsUsed: 0,
    chores: emptyPerYard(() => ({ fed: false, cleaned: false })),
    staff: { vetTech: false, walker: false, kennelHand: false },
    toys: emptyPerYard(() => ({})),  // yard -> slot -> { x, y }
    incidents: [],
    nextIncidentId: 1,
    decorSeed: Math.floor(Math.random() * 1e9),
  };
  dogs = [];
  availableDogs = DOG_DIRECTORY.slice();
  offer = null;
  deskResult = null;
}

function poundageEffect() {
  return POUNDAGE_EFFECTS.find((effect) => effect.name === game.moneyPerPoundEffect) || null;
}

/* ---------- yards ---------- */
function yardDogs(yard) {
  return dogs.filter((dog) => dog.yard === yard);
}
function yardHasRoom(yard) {
  return yardDogs(yard).length < game.yardCapacity[yard];
}
function hasToy(yard, slot) {
  return Boolean(game.toys[yard][slot]);
}
function yardExpansionCost(yard) {
  const cost = CONFIG.yardExpansionCost[yard] *
    Math.pow(CONFIG.yardExpansionGrowth, game.yardExpansions[yard]);
  return Math.round(cost / 10) * 10;
}

function buyYardExpansion(yard) {
  const cost = yardExpansionCost(yard);
  if (game.money < cost) return { done: false, text: "Not enough money." };
  game.money -= cost;
  game.yardCapacity[yard] += CONFIG.yardExpansionSlots;
  game.yardExpansions[yard] += 1;
  log(`Expanded the ${yard} to hold ${game.yardCapacity[yard]} dogs (-$${cost}).`, "info");
  return { done: true, text: `The ${yard} now holds ${game.yardCapacity[yard]} dogs.` };
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
  if (accept && !yardHasRoom(current.dog.yard)) {
    return { error: `The ${current.dog.yard} is full.` };
  }
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
  dog.changeHappiness(happinessChange);
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
    const chance = CONFIG.issueChance * (hasToy(dog.yard, "water") ? CONFIG.waterIssueMultiplier : 1);
    if (dog.status === "healthy" && Math.random() < chance) {
      dog.giveIssue(choice(ISSUE_STATUSES));
      log(`Something is wrong: ${dog.name} ${dog.describeCondition()}.`, "bad");
    }
  }
}

/** Treat a dog. Money and reviews change here, the dog changes itself. */
function provideCare(dog, action, who = "") {
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
    log(`${who}Used ${action} on ${dog.name} ($${cost}): ${text}`, "good");
    return { done: true, correct: true, text };
  }
  game.reviews -= 1;
  const text = `That didn't help. ${dog.name} still needs care.`;
  log(`${who}Used ${action} on ${dog.name} ($${cost}): ${text} Reviews -1.`, "bad");
  return { done: true, correct: false, text };
}

/** Apply increasing penalties to dogs whose issues were not resolved. */
function finishDayCare() {
  for (const dog of dogs) {
    if (dog.status === "healthy") continue;
    const multiplier = hasToy(dog.yard, "bed") ? CONFIG.bedUntreatedMultiplier : 1;
    const before = dog.happiness;
    dog.applyUntreatedDay(multiplier);
    game.reviews -= dog.issueDays;
    log(
      `${dog.name} was left untreated for ${dog.issueDays} day(s): happiness -${before - dog.happiness}, reviews -${dog.issueDays}.`,
      "bad"
    );
  }
}

/* ---------- noon: walks and play sessions ---------- */
function noonSlotsLeft() {
  return CONFIG.noonSlots - game.noonSlotsUsed;
}

function exerciseAmount(yard, base) {
  return Math.round(base * (hasToy(yard, "play") ? CONFIG.playGearMultiplier : 1));
}

function walkDog(dog, byWalker = false) {
  if (!byWalker) {
    if (game.shift !== 1) return { done: false, text: "Walks happen during the Noon shift." };
    if (noonSlotsLeft() <= 0) return { done: false, text: "No time left this noon for another walk." };
  }
  if (dog.exercisedToday) return { done: false, text: `${dog.name} already had exercise today.` };
  if (dog.stuckInHole) return { done: false, text: `${dog.name} is stuck in a hole!` };
  if (!byWalker) game.noonSlotsUsed += 1;
  const amount = exerciseAmount(dog.yard, CONFIG.walkHappiness);
  dog.exercise(amount);
  const text = `${byWalker ? "The dog walker" : "You"} took ${dog.name} for a walk: happiness +${amount}, calmer for the day.`;
  log(text, "good");
  return { done: true, text };
}

function playSession(yard) {
  if (game.shift !== 1) return { done: false, text: "Play sessions happen during the Noon shift." };
  if (noonSlotsLeft() <= 0) return { done: false, text: "No time left this noon." };
  if (game.playSessions[yard]) return { done: false, text: `The ${yard} already had a play session.` };
  const players = yardDogs(yard).filter((dog) => !dog.stuckInHole);
  if (players.length === 0) return { done: false, text: `No dogs in the ${yard}.` };
  game.noonSlotsUsed += 1;
  game.playSessions[yard] = true;
  const amount = exerciseAmount(yard, CONFIG.playSessionHappiness);
  for (const dog of players) dog.exercise(amount);
  const text = `Play session in the ${yard}: ${players.length} dog(s) happiness +${amount}, calmer for the day.`;
  log(text, "good");
  return { done: true, text };
}

/* ---------- night: feeding and cleaning ---------- */
function nightSlotsLeft() {
  return CONFIG.nightSlots - game.nightSlotsUsed;
}

function doChore(yard, chore, byStaff = false) {
  if (!byStaff) {
    if (game.shift !== 2) return { done: false, text: "Chores happen during the Night shift." };
    if (nightSlotsLeft() <= 0) return { done: false, text: "No time left tonight." };
  }
  const key = chore === "feed" ? "fed" : "cleaned";
  if (game.chores[yard][key]) return { done: false, text: "Already done tonight." };
  if (yardDogs(yard).length === 0) return { done: false, text: `No dogs in the ${yard}.` };
  if (!byStaff) game.nightSlotsUsed += 1;
  game.chores[yard][key] = true;
  const what = chore === "feed" ? "fed the dogs in" : "cleaned the kennels in";
  const text = `${byStaff ? "The kennel hand" : "You"} ${what} the ${yard}.`;
  log(text, "good");
  return { done: true, text };
}

/** Skipped chores: dogs go to bed hungry or wake up sick. */
function applyChorePenalties() {
  for (const yard of YARDS) {
    const here = yardDogs(yard);
    if (here.length === 0) continue;
    const { fed, cleaned } = game.chores[yard];
    for (const dog of here) {
      if (dog.status !== "healthy") continue;
      if (!fed && Math.random() < CONFIG.unfedHungryChance) {
        dog.giveIssue("hungry");
        log(`Nobody fed the ${yard}. ${dog.name} went to bed hungry.`, "bad");
      } else if (!cleaned && Math.random() < CONFIG.uncleanSickChance) {
        dog.giveIssue("sick");
        log(`The ${yard} kennels were dirty. ${dog.name} got sick.`, "bad");
      }
    }
  }
}

/* ---------- staff ---------- */
function hireStaff(key) {
  if (game.staff[key]) return { done: false, text: "Already hired." };
  game.staff[key] = true;
  log(`Hired a ${STAFF_INFO[key].title} ($${CONFIG.staff[key].wage}/day).`, "info");
  return { done: true, text: `${STAFF_INFO[key].title} hired! Wages are paid every night.` };
}

function fireStaff(key) {
  if (!game.staff[key]) return { done: false };
  game.staff[key] = false;
  log(`The ${STAFF_INFO[key].title} was let go.`, "info");
  return { done: true, text: `${STAFF_INFO[key].title} let go.` };
}

function dailyWages() {
  return Object.keys(game.staff)
    .filter((key) => game.staff[key])
    .reduce((total, key) => total + CONFIG.staff[key].wage, 0);
}

function payWages() {
  const wages = dailyWages();
  if (wages > 0) {
    game.money -= wages;
    log(`Staff wages: -$${wages}.`, "bad");
  }
}

function vetTechRound() {
  if (!game.staff.vetTech) return;
  const patients = dogs.filter((dog) => dog.status !== "healthy")
    .sort((a, b) => b.issueDays - a.issueDays || a.happiness - b.happiness);
  if (patients.length === 0) {
    log("The vet tech checked everyone. All healthy!", "info");
    return;
  }
  const dog = patients[0];
  const action = STATUS_ACTIONS[dog.status];
  const result = provideCare(dog, action, "🩺 Vet tech: ");
  if (!result.done) log(`🩺 The vet tech couldn't afford to treat ${dog.name}.`, "bad");
}

function walkerRound() {
  if (!game.staff.walker) return;
  const walkers = dogs.filter((dog) => !dog.exercisedToday && !dog.stuckInHole)
    .sort((a, b) => a.happiness - b.happiness)
    .slice(0, CONFIG.staff.walker.walks);
  for (const dog of walkers) walkDog(dog, true);
}

function kennelHandRound() {
  if (!game.staff.kennelHand) return;
  for (const yard of YARDS) {
    if (yardDogs(yard).length === 0) continue;
    doChore(yard, "feed", true);
    doChore(yard, "clean", true);
  }
}

/* ---------- toys ---------- */
function toyPrice(yard, slot) {
  return Math.round(TOY_SLOTS[slot].basePrice * CONFIG.toyPriceMultiplier[yard] / 5) * 5;
}

/** A random spot in the yard, away from other toys. Different every game. */
function randomToySpot(yard) {
  const taken = Object.values(game.toys[yard]);
  let best = null;
  for (let tries = 0; tries < 40; tries++) {
    const spot = { x: 0.08 + Math.random() * 0.84, y: 0.15 + Math.random() * 0.75 };
    if (Math.abs(spot.x - 0.5) < 0.07) continue;           // keep the gate path clear
    const nearest = Math.min(1, ...taken.map((t) => Math.hypot(t.x - spot.x, (t.y - spot.y) * 0.8)));
    if (!best || nearest > best.nearest) best = { spot, nearest };
    if (nearest > 0.22) break;
  }
  return best.spot;
}

function buyToy(yard, slot) {
  if (hasToy(yard, slot)) return { done: false, text: "Already in the yard." };
  const price = toyPrice(yard, slot);
  if (game.money < price) return { done: false, text: "Not enough money." };
  game.money -= price;
  game.toys[yard][slot] = randomToySpot(yard);
  const name = YARD_ART.toys[yard][slot].name;
  log(`Bought a ${name} for the ${yard} (-$${price}).`, "good");
  return { done: true, text: `${name} added to the ${yard}!` };
}

/** After every shift: balls keep dogs happy. */
function applyToyShiftEffects() {
  for (const yard of YARDS) {
    if (!hasToy(yard, "ball")) continue;
    for (const dog of yardDogs(yard)) dog.changeHappiness(CONFIG.ballHappinessPerShift);
  }
}

/** Each morning: beds and plushies. */
function applyToyMorningEffects() {
  for (const yard of YARDS) {
    const bonus = (hasToy(yard, "bed") ? CONFIG.bedHappinessOvernight : 0) +
      (hasToy(yard, "plush") ? CONFIG.plushHappinessMorning : 0);
    if (!bonus) continue;
    for (const dog of yardDogs(yard)) dog.changeHappiness(bonus);
  }
}

/** Very happy dogs sometimes make their owners leave a review. */
function happyDogReviews() {
  for (const dog of dogs) {
    if (dog.happiness < CONFIG.happyReviewAt) continue;
    const chance = hasToy(dog.yard, "plush") ? CONFIG.plushReviewChance : CONFIG.happyReviewChance;
    if (Math.random() < chance) {
      game.reviews += 1;
      log(`${dog.name}'s owner saw a happy photo and left a review! +1 review.`, "good");
    }
  }
}

/* ---------- upgrades.py ---------- */
function nextPoundageEffect(currentName) {
  return choice(POUNDAGE_EFFECTS.filter((effect) => effect.name !== currentName)).name;
}

function buyIntakeUpgrade(index) {
  const upgrade = CONFIG.intakeUpgrades[index];
  if (game.money < upgrade.cost) {
    return { done: false, text: "Not enough money." };
  }
  game.money -= upgrade.cost;
  game.dailyIntakeLimit += upgrade.slots;
  log(`Bought +${upgrade.slots} daily intake slots for $${upgrade.cost}. Daily intake limit: ${game.dailyIntakeLimit}.`, "info");
  return { done: true, text: `Daily intake limit is now ${game.dailyIntakeLimit}.` };
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
  game.moneyPerPoundEffect = choice(POUNDAGE_EFFECTS).name;
  log(`Per-pound upgrade purchased. Today's trade-off: ${poundageEffect().description}`, "info");
  return { done: true, text: `Purchased! Today's trade-off: ${poundageEffect().description}` };
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
    text = `${dog.name} was calmed and trained with treats. No more digging or fence breaking!`;
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

/* ---------- broken fences and holes ---------- */
function incidentInYard(yard) {
  return game.incidents.find((incident) => incident.yard === yard) || null;
}

/** Untrained, un-walked, high-energy dogs in a yard without a problem already. */
function restlessDogs() {
  return dogs.filter((dog) => dog.energy === "high" && !dog.trained &&
    !dog.exercisedToday && !dog.stuckInHole && !incidentInYard(dog.yard));
}

function createIncident(dog, type = Math.random() < 0.5 ? "fence" : "hole") {
  const incident = {
    id: game.nextIncidentId++,
    type,
    yard: dog.yard,
    dogName: dog.name,
    x: type === "fence" ? choice([0.15, 0.3, 0.7, 0.85]) : 0.15 + Math.random() * 0.7,
    y: type === "fence" ? 0 : 0.35 + Math.random() * 0.45,
  };
  if (type === "hole") {
    if (Math.abs(incident.x - 0.5) < 0.1) incident.x += 0.2;
    dog.stuckInHole = true;
    log(`🕳️ ${dog.name} dug a hole in the ${dog.yard} and got stuck! Click the hole to pull them out.`, "bad");
  } else {
    log(`🔨 ${dog.name} broke the fence in the ${dog.yard}! Click the broken fence to fix it before night.`, "bad");
  }
  game.incidents.push(incident);
  return incident;
}

/** A restless dog might break the fence or dig a hole this shift. */
function maybeIncident() {
  const restless = restlessDogs();
  if (restless.length === 0) return;
  // Chew toys keep jaws busy: each dog's chance is weighed by its yard's toys.
  const weights = restless.map((dog) => (hasToy(dog.yard, "chew") ? CONFIG.chewIncidentMultiplier : 1));
  const average = weights.reduce((a, b) => a + b, 0) / weights.length;
  if (Math.random() >= CONFIG.incidentChance * average) return;
  let pick = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < restless.length; i++) {
    pick -= weights[i];
    if (pick <= 0) {
      createIncident(restless[i]);
      return;
    }
  }
}

/** You fixed it yourself in the mini-game. */
function resolveIncident(id) {
  const incident = game.incidents.find((item) => item.id === id);
  if (!incident) return;
  game.incidents = game.incidents.filter((item) => item.id !== id);
  const dog = findDogByName(incident.dogName);
  if (incident.type === "hole") {
    if (dog) {
      dog.stuckInHole = false;
      dog.changeHappiness(CONFIG.holeRescueHappiness);
    }
    log(`You pulled ${incident.dogName} out and filled the hole. Happiness +${CONFIG.holeRescueHappiness}.`, "good");
  } else {
    log(`You fixed the fence in the ${incident.yard} yourself and saved the $${CONFIG.fenceRepairCost} repair bill.`, "good");
  }
}

/** Anything still broken at night costs you. */
function unresolvedIncidents() {
  for (const incident of game.incidents) {
    const dog = findDogByName(incident.dogName);
    if (incident.type === "hole") {
      if (dog) {
        dog.stuckInHole = false;
        dog.changeHappiness(-CONFIG.holeStuckHappiness);
      }
      game.money -= CONFIG.holeStuckCost;
      log(`${incident.dogName} was stuck in the hole until a volunteer dug them out: happiness -${CONFIG.holeStuckHappiness}, -$${CONFIG.holeStuckCost}.`, "bad");
    } else {
      game.money -= CONFIG.fenceRepairCost;
      game.reviews -= CONFIG.fenceRepairReviews;
      log(`A contractor fixed the broken fence in the ${incident.yard}: -$${CONFIG.fenceRepairCost}, reviews -${CONFIG.fenceRepairReviews}.`, "bad");
    }
  }
  game.incidents = [];
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
      for (const dog of dogs) dog.changeHappiness(CONFIG.toyHappiness);
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
      // 0.2: an energetic dog digs a hole or breaks the fence (a mini-game)
      const restless = restlessDogs();
      if (restless.length > 0) {
        createIncident(choice(restless));
      } else {
        log("The shelter avoided damage; no restless high-energy dogs.", "info");
      }
    }
  }
}

/** Stressed, injured, or very unhappy dogs may bite unless muzzled. */
function checkForBites() {
  for (const dog of dogs) {
    if (dog.stuckInHole) continue;
    const upset = dog.status === "stressed" || dog.status === "injured" ||
      dog.happiness < CONFIG.biteHappinessBelow;
    let chance = CONFIG.biteChance;
    if (dog.exercisedToday) chance *= CONFIG.exercisedBiteMultiplier;
    if (hasToy(dog.yard, "house")) chance *= CONFIG.houseBiteMultiplier;
    if (upset && !dog.muzzled && Math.random() < chance) {
      game.money -= CONFIG.biteCost;
      game.reviews -= CONFIG.biteReviewLoss;
      log(`🦷 BITE! ${dog.name} bit a volunteer! Medical bill $${CONFIG.biteCost}, reviews -${CONFIG.biteReviewLoss}.`, "bad");
    }
  }
}

function shiftEvent() {
  const incidentsBefore = game.incidents.length;
  if (randint(1, 100) <= CONFIG.shiftEventChance) {
    randomEvent();
  } else {
    log("No special event this shift.", "info");
  }
  applyToyShiftEffects();
  checkForBites();
  if (game.incidents.length === incidentsBefore) maybeIncident();
}

/** Called when a new shift starts (noon or night). */
function beginShift() {
  if (game.shift === 1) {
    game.noonSlotsUsed = 0;
    game.playSessions = emptyPerYard(false);
    walkerRound();
  } else if (game.shift === 2) {
    game.nightSlotsUsed = 0;
    game.chores = emptyPerYard(() => ({ fed: false, cleaned: false }));
    kennelHandRound();
  }
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

/** First half of the night: everything up to the debt check. */
function endDayCore() {
  finishDayCare();
  unresolvedIncidents();
  payDailyUpkeep();
  payWages();

  const effect = poundageEffect();
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

  happyDogReviews();
  checkOutDogs();
  applyChorePenalties();
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

/** Second half of the night: move to the next morning. */
function startNewDay() {
  game.day += 1;
  game.intakesToday = 0;
  game.shift = 0;
  for (const dog of dogs) dog.exercisedToday = false;
  if (game.moneyPerPoundEffect) {
    game.moneyPerPoundEffect = nextPoundageEffect(game.moneyPerPoundEffect);
    log(`Today's per-pound upgrade trade-off: ${poundageEffect().description}`, "info");
  }
  log(`Welcome to Day ${game.day}!`, "day");
  applyToyMorningEffects();
  startDayCare();
  vetTechRound();
}

function daysCompleted() {
  return game.gameOver ? game.day : game.day - 1;
}


/* =====================================================================
   5. SAVE / LOAD - stored in the browser (localStorage), so "Continue"
      works the next time you double-click index.html in the same browser.
   ===================================================================== */
const SAVE_KEY = "DogShelterWeb0.2-save";
const SAVE_VERSION = 2;

function saveGame() {
  if (!game || game.gameOver) return false;
  const data = {
    version: SAVE_VERSION,
    savedAt: Date.now(),
    game,
    dogs,
    available: availableDogs.map((entry) => entry.name),
    offer: offer && {
      name: offer.dog.name, stayDays: offer.dog.stayDays,
      carePayment: offer.dog.carePayment, rate: offer.rate,
    },
    log: logHistory.slice(0, 80),
  };
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    return false;   // private browsing or storage turned off
  }
}

function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.version === SAVE_VERSION ? data : null;
  } catch (error) {
    return null;
  }
}

function deleteSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (error) {
    // nothing to do
  }
}

function loadGame(data) {
  game = data.game;
  dogs = data.dogs.map((saved) => Object.assign(
    new Dog(saved.name, saved.breed, saved.weight, saved.age, saved.energy,
      saved.yard, saved.stayDays, saved.carePayment),
    saved
  ));
  availableDogs = data.available
    .map((name) => DOG_DIRECTORY.find((entry) => entry.name === name))
    .filter(Boolean);
  offer = null;
  if (data.offer) {
    const candidate = availableDogs.find((entry) => entry.name === data.offer.name);
    if (candidate) {
      const dog = new Dog(candidate.name, candidate.breed, candidate.weight, candidate.age,
        candidate.energy, yardForWeight(candidate.weight), data.offer.stayDays, data.offer.carePayment);
      offer = { candidate, dog, rate: data.offer.rate };
    }
  }
  deskResult = null;
  logHistory = data.log || [];
}
