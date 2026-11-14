"use strict";

/* =====================================================================
   DOG SHELTER MANAGER 0.2 - yard.js
   Draws the three yards and everything in them:
     1. Dog sprites      - sprite sheets in sprites/ (same as 0.1)
     2. Yard art         - tiled grass, fence, gate, plants, butterflies
     3. Toys + incidents - bought toys, holes, broken fences
     4. Walking dogs     - wander, idle, lie down, enter through the gate
   ===================================================================== */


/* =====================================================================
   1. DOG SPRITES - one 256x32 sheet per breed: 8 frames facing right.
      Frames 0-3 walk, 4-5 idle, 6-7 lie (from sprites/sprite_manifest.json).
   ===================================================================== */
const SPRITE_FRAME_SIZE = 32;
const SPRITE_FRAME_COUNT = 8;
const SPRITE_ANIMATIONS = { walk: [0, 1, 2, 3], idle: [4, 5], lie: [6, 7] };

// From sprite_manifest.json: sheet file and muzzle [x, y] offset for each frame.
const SPRITE_SHEETS = {
  "Australian Cattle Dog": { file: "sprites/breeds/australian_cattle_dog.png", muzzle: [[5, -1], [5, -2], [5, -1], [5, -2], [5, -1], [5, -1], [5, 8], [5, 7]] },
  "Australian Shepherd": { file: "sprites/breeds/australian_shepherd.png", muzzle: [[5, -1], [5, -2], [5, -1], [5, -2], [5, -1], [5, -1], [5, 8], [5, 7]] },
  "Basset Hound": { file: "sprites/breeds/basset_hound.png", muzzle: [[5, 3], [5, 2], [5, 3], [5, 2], [5, 3], [5, 3], [5, 8], [5, 8]] },
  "Beagle": { file: "sprites/breeds/beagle.png", muzzle: [[4, -1], [4, -2], [4, -1], [4, -2], [4, -1], [4, -1], [4, 9], [4, 8]] },
  "Bernese Mountain Dog": { file: "sprites/breeds/bernese_mountain_dog.png", muzzle: [[5, -1], [5, -2], [5, -1], [5, -2], [5, -1], [5, -1], [5, 6], [5, 6]] },
  "Border Collie": { file: "sprites/breeds/border_collie.png", muzzle: [[5, -1], [5, -2], [5, -1], [5, -2], [5, -1], [5, -1], [5, 9], [5, 8]] },
  "Boston Terrier": { file: "sprites/breeds/boston_terrier.png", muzzle: [[4, 0], [4, -1], [4, 0], [4, -1], [4, 0], [4, 0], [4, 7], [4, 7]] },
  "Boxer": { file: "sprites/breeds/boxer.png", muzzle: [[4, -1], [4, -2], [4, -1], [4, -2], [4, -1], [4, -1], [4, 8], [4, 7]] },
  "Cavalier King Charles Spaniel": { file: "sprites/breeds/cavalier_king_charles_spaniel.png", muzzle: [[4, 1], [4, 0], [4, 1], [4, 0], [4, 1], [4, 1], [4, 8], [4, 8]] },
  "Chihuahua": { file: "sprites/breeds/chihuahua.png", muzzle: [[4, 2], [4, 1], [4, 2], [4, 1], [4, 2], [4, 2], [4, 10], [4, 9]] },
  "Cocker Spaniel": { file: "sprites/breeds/cocker_spaniel.png", muzzle: [[4, -1], [4, -2], [4, -1], [4, -2], [4, -1], [4, -1], [4, 9], [4, 8]] },
  "Dachshund": { file: "sprites/breeds/dachshund.png", muzzle: [[6, 4], [6, 3], [6, 4], [6, 3], [6, 4], [6, 4], [6, 10], [6, 9]] },
  "Doberman Pinscher": { file: "sprites/breeds/doberman_pinscher.png", muzzle: [[5, -3], [5, -4], [5, -3], [5, -4], [5, -3], [5, -3], [5, 9], [5, 9]] },
  "English Springer Spaniel": { file: "sprites/breeds/english_springer_spaniel.png", muzzle: [[4, -1], [4, -2], [4, -1], [4, -2], [4, -1], [4, -1], [4, 9], [4, 8]] },
  "French Bulldog": { file: "sprites/breeds/french_bulldog.png", muzzle: [[4, 0], [4, -1], [4, 0], [4, -1], [4, 0], [4, 0], [4, 7], [4, 7]] },
  "German Shepherd": { file: "sprites/breeds/german_shepherd.png", muzzle: [[6, -1], [6, -2], [6, -1], [6, -2], [6, -1], [6, -1], [6, 8], [6, 7]] },
  "Golden Retriever": { file: "sprites/breeds/golden_retriever.png", muzzle: [[5, -1], [5, -2], [5, -1], [5, -2], [5, -1], [5, -1], [5, 8], [5, 7]] },
  "Great Dane": { file: "sprites/breeds/great_dane.png", muzzle: [[6, -4], [6, -5], [6, -4], [6, -5], [6, -4], [6, -4], [6, 8], [6, 8]] },
  "Labrador Retriever": { file: "sprites/breeds/labrador_retriever.png", muzzle: [[5, -1], [5, -2], [5, -1], [5, -2], [5, -1], [5, -1], [5, 8], [5, 7]] },
  "Maltese": { file: "sprites/breeds/maltese.png", muzzle: [[4, 1], [4, 0], [4, 1], [4, 0], [4, 1], [4, 1], [4, 8], [4, 8]] },
  "Miniature Poodle": { file: "sprites/breeds/miniature_poodle.png", muzzle: [[5, 1], [5, 0], [5, 1], [5, 0], [5, 1], [5, 1], [5, 8], [5, 8]] },
  "Miniature Schnauzer": { file: "sprites/breeds/miniature_schnauzer.png", muzzle: [[4, 0], [4, -1], [4, 0], [4, -1], [4, 0], [4, 0], [4, 8], [4, 8]] },
  "Pembroke Welsh Corgi": { file: "sprites/breeds/pembroke_welsh_corgi.png", muzzle: [[4, 2], [4, 1], [4, 2], [4, 1], [4, 2], [4, 2], [4, 8], [4, 8]] },
  "Pomeranian": { file: "sprites/breeds/pomeranian.png", muzzle: [[4, 1], [4, 0], [4, 1], [4, 0], [4, 1], [4, 1], [4, 8], [4, 8]] },
  "Pug": { file: "sprites/breeds/pug.png", muzzle: [[4, 0], [4, -1], [4, 0], [4, -1], [4, 0], [4, 0], [4, 7], [4, 7]] },
  "Rottweiler": { file: "sprites/breeds/rottweiler.png", muzzle: [[5, -1], [5, -2], [5, -1], [5, -2], [5, -1], [5, -1], [5, 6], [5, 6]] },
  "Shih Tzu": { file: "sprites/breeds/shih_tzu.png", muzzle: [[4, 1], [4, 0], [4, 1], [4, 0], [4, 1], [4, 1], [4, 8], [4, 8]] },
  "Siberian Husky": { file: "sprites/breeds/siberian_husky.png", muzzle: [[4, -1], [4, -2], [4, -1], [4, -2], [4, -1], [4, -1], [4, 9], [4, 8]] },
  "Standard Poodle": { file: "sprites/breeds/standard_poodle.png", muzzle: [[5, -3], [5, -4], [5, -3], [5, -4], [5, -3], [5, -3], [5, 9], [5, 9]] },
  "Whippet": { file: "sprites/breeds/whippet.png", muzzle: [[5, -2], [5, -3], [5, -2], [5, -3], [5, -2], [5, -2], [5, 10], [5, 10]] },
  "Yorkshire Terrier": { file: "sprites/breeds/yorkshire_terrier.png", muzzle: [[4, 2], [4, 1], [4, 2], [4, 1], [4, 2], [4, 2], [4, 10], [4, 9]] },
};

/** Bigger dogs get bigger sprites (multiples of the 32px frame). */
function spriteScale(weight) {
  if (weight < 20) return 1.9;
  if (weight < 50) return 2.4;
  if (weight < 100) return 2.9;
  return 3.4;
}

/** Move a sprite element to a frame number (0-7) and line up its muzzle. */
function setSpriteFrame(el, breed, frame) {
  el.style.setProperty("--frame", frame);
  const muzzle = el.querySelector(".muzzle");
  if (!muzzle) return;
  const [x, y] = SPRITE_SHEETS[breed].muzzle[frame];
  muzzle.style.left = `${(x / SPRITE_FRAME_SIZE) * 100}%`;
  muzzle.style.top = `${(y / SPRITE_FRAME_SIZE) * 100}%`;
}

/**
 * HTML for a dog sprite. anim is "idle", "walk" or "lie".
 * The animation timer below steps through the frames.
 */
function spriteImg(dog, extraClass = "", animate = true, anim = "idle") {
  const sheet = SPRITE_SHEETS[dog.breed];
  const frame = SPRITE_ANIMATIONS[anim || "idle"][0];
  const [mx, my] = sheet.muzzle[frame];
  const muzzle = dog.muzzled
    ? `<span class="muzzle" style="left:${(mx / SPRITE_FRAME_SIZE) * 100}%;top:${(my / SPRITE_FRAME_SIZE) * 100}%"></span>`
    : "";
  return `<span class="dog-sprite ${extraClass}" role="img" aria-label="${esc(dog.breed)}"
    style="background-image:url('${sheet.file}');--frame:${frame}"
    data-breed="${esc(dog.breed)}" ${animate ? `data-anim="${anim || "idle"}" data-step="0"` : ""}>${muzzle}</span>`;
}

/* Cards, portraits and the title parade step through their frames here. */
let spriteTicks = 0;
setInterval(() => {
  spriteTicks += 1;
  document.querySelectorAll(".dog-sprite[data-anim]").forEach((el) => {
    const frames = SPRITE_ANIMATIONS[el.dataset.anim];
    // walk steps every tick; idle and lie breathe more slowly
    if (el.dataset.anim !== "walk" && spriteTicks % 3 !== 0) return;
    const step = (Number(el.dataset.step) + 1) % frames.length;
    el.dataset.step = step;
    setSpriteFrame(el, el.dataset.breed, frames[step]);
  });
}, 140);


/* =====================================================================
   2. YARD ART
   ===================================================================== */
const FX = "assets/fx/";
const yardLayout = {};            // yard -> sizes, fence cells, walk bounds
const imageCache = {};

function artURL(path) {
  return YARD_ART.base + path;
}

/** Load an image once; the callback runs when it is ready. */
function loadImage(src, callback) {
  let entry = imageCache[src];
  if (!entry) {
    entry = imageCache[src] = { img: new Image(), ready: false, waiting: [] };
    entry.img.onload = () => {
      entry.ready = true;
      entry.waiting.forEach((fn) => fn(entry.img));
      entry.waiting = [];
    };
    entry.img.src = src;
  }
  if (entry.ready) callback(entry.img);
  else entry.waiting.push(callback);
}

/** A small seeded random generator, so a yard looks the same after a reload. */
function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pixelScale() {
  return window.innerWidth < 720 ? 2 : 3;
}
function zoomFactor() {
  return window.innerWidth < 720 ? 0.75 : 1;
}

function yardElement(yardName) {
  return document.querySelector(`.yard[data-yard="${yardName}"]`);
}

/** Build the fixed layers of each yard once. */
function initYards() {
  for (const yard of YARDS) {
    const el = yardElement(yard);
    if (el.querySelector(".yard-grass")) continue;
    el.insertAdjacentHTML("afterbegin", `
      <canvas class="yard-grass" aria-hidden="true"></canvas>
      <div class="yard-sky" aria-hidden="true"></div>
      <div class="yard-fence" aria-hidden="true"></div>
      <div class="yard-items"></div>`);
  }
  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutYards, 120);
  });
}

/** Work out sizes and redraw everything that depends on them. */
function layoutYards() {
  if (!game) return;
  for (const [index, yard] of YARDS.entries()) {
    const el = yardElement(yard);
    const width = el.clientWidth;
    const height = el.clientHeight;
    if (!width || !height) continue;
    const scale = pixelScale();
    const tile = 32 * scale;
    const skyH = Math.round(tile * 0.45);
    const fenceBottom = skyH + tile;
    const count = Math.ceil(width / tile) + 1;
    const fenceLeft = Math.round((width - count * tile) / 2);
    const gateIndex = Math.floor(count / 2);
    const layout = {
      width, height, scale, tile, skyH, fenceBottom, count, fenceLeft, gateIndex,
      gateX: (fenceLeft + gateIndex * tile + tile / 2) / width,
      top: (fenceBottom + 18) / height,
      bottom: 1 - 8 / height,
      seed: game.decorSeed + index * 7919,
    };
    yardLayout[yard] = layout;
    el.querySelector(".yard-sky").style.height = `${skyH + tile * 0.5}px`;
    drawGrass(el.querySelector(".yard-grass"), yard, layout);
    buildFence(el.querySelector(".yard-fence"), yard, layout);
    buildPlants(yard, layout);
  }
  lastItemsKey = "";
  renderYardItems();
  placeAllWalkers();
}

/** Random grass tiles (with a few flowers) and a dirt path from the gate. */
function drawGrass(canvas, yard, layout) {
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(layout.width * ratio);
  canvas.height = Math.round(layout.height * ratio);
  canvas.style.width = `${layout.width}px`;
  canvas.style.height = `${layout.height}px`;
  const files = YARD_ART.grass[yard].concat([YARD_ART.path]).map(artURL);
  let loaded = 0;
  const images = [];
  files.forEach((src, i) => loadImage(src, (img) => {
    images[i] = img;
    loaded += 1;
    if (loaded < files.length) return;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const rand = seededRandom(layout.seed);
    const { tile } = layout;
    const cols = Math.ceil(layout.width / tile) + 1;
    const rows = Math.ceil(layout.height / tile) + 1;
    const gateCol = layout.fenceLeft + layout.gateIndex * tile;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const roll = rand();
        const img = roll < 0.12 ? images[3] : images[Math.floor(roll * 3) % 3];
        ctx.drawImage(img, c * tile, r * tile, tile, tile);
      }
    }
    // dirt path from the gate down to the bottom of the yard
    for (let y = layout.fenceBottom - tile * 0.3; y < layout.height; y += tile) {
      ctx.drawImage(images[4], gateCol, y, tile, tile);
    }
  }));
}

/** Fence: end posts, sections with posts between, a few hearts, and a gate. */
function buildFence(fenceEl, yard, layout) {
  const rand = seededRandom(layout.seed + 11);
  const { tile, count, gateIndex } = layout;
  const cells = [];
  for (let i = 0; i < count; i++) {
    let kind;
    if (i === 0) kind = "endLeft";
    else if (i === count - 1) kind = "endRight";
    else if (i === gateIndex) kind = "gate";
    else if (i % 2 === 1) kind = rand() < 0.2 ? "heart" : "section";
    else kind = "post";
    cells.push(kind);
  }
  layout.cells = cells;
  fenceEl.style.left = `${layout.fenceLeft}px`;
  fenceEl.style.top = `${layout.skyH}px`;
  fenceEl.style.height = `${tile}px`;
  fenceEl.innerHTML = cells.map((kind, i) => `<span class="fence-cell fence-${kind}" data-cell="${i}"
    style="width:${tile}px;height:${tile}px;background-image:url('${artURL(YARD_ART.fence[kind])}')"></span>`).join("");
}

/** Open the gate for a moment (when a new dog arrives). */
function openGate(yard) {
  const gate = yardElement(yard).querySelector(".fence-gate");
  if (!gate) return;
  gate.classList.add("open");
  clearTimeout(gate.closeTimer);
  gate.closeTimer = setTimeout(() => gate.classList.remove("open"), 1600);
}

/** Swaying plants: a few along the fence, some out in the grass. */
function buildPlants(yard, layout) {
  const el = yardElement(yard);
  el.querySelectorAll(".plant, .butterfly").forEach((p) => p.remove());
  const rand = seededRandom(layout.seed + 23);
  const plants = YARD_ART.plants;
  const html = [];
  for (let i = 0; i < 8; i++) {
    const art = plants[Math.floor(rand() * plants.length)];
    let x = 0.04 + rand() * 0.92;
    if (Math.abs(x - layout.gateX) < 0.08) x += 0.16;
    const nearFence = i < 3;
    const y = nearFence
      ? (layout.fenceBottom + 6) / layout.height
      : layout.top + 0.1 + rand() * (layout.bottom - layout.top - 0.1);
    const size = layout.scale * 0.9;
    html.push(`<span class="plant anim-${art.frames}" aria-hidden="true" style="
      left:${(x * 100).toFixed(2)}%; top:${(y * 100).toFixed(2)}%;
      width:${art.w * size}px; height:${art.h * size}px; z-index:${10 + Math.round(y * 100) - 1};
      background-image:url('${artURL(art.file)}');
      animation-duration:${(art.frames / art.fps).toFixed(2)}s; animation-delay:-${(rand() * 2).toFixed(2)}s"></span>`);
  }
  const fly = YARD_ART.butterfly;
  html.push(`<span class="butterfly anim-${fly.frames}" aria-hidden="true" style="
    width:${fly.w * layout.scale}px; height:${fly.h * layout.scale}px;
    background-image:url('${artURL(fly.file)}'); animation-duration:${(fly.frames / fly.fps).toFixed(2)}s"></span>`);
  el.querySelector(".yard-items").insertAdjacentHTML("beforebegin", html.join(""));
}


/* =====================================================================
   3. TOYS AND INCIDENTS (holes, broken fences)
   ===================================================================== */
let lastItemsKey = "";

/** Turn a 0-1 spot inside the walkable area into yard percentages. */
function walkSpot(yard, x, y) {
  const layout = yardLayout[yard];
  return { left: x * 100, top: (layout.top + y * (layout.bottom - layout.top)) * 100 };
}

function renderYardItems() {
  if (!game) return;
  const key = JSON.stringify([game.toys, game.incidents, pixelScale(),
    YARDS.map((yard) => yardLayout[yard] && yardLayout[yard].width)]);
  if (key === lastItemsKey) return;
  lastItemsKey = key;

  for (const yard of YARDS) {
    const layout = yardLayout[yard];
    if (!layout) continue;
    const el = yardElement(yard);
    const items = el.querySelector(".yard-items");
    const html = [];

    // toys
    const toyScale = YARD_ART.toyScale[yard] * zoomFactor();
    for (const slot of TOY_ORDER) {
      const spot = game.toys[yard][slot];
      if (!spot) continue;
      const art = YARD_ART.toys[yard][slot];
      const pos = walkSpot(yard, spot.x, spot.y);
      const animated = art.frames > 1
        ? ` anim-${art.frames}" style="animation-duration:${(art.frames / art.fps).toFixed(2)}s;` : `" style="`;
      html.push(`<span class="toy toy-${slot}${animated}
        left:${pos.left.toFixed(2)}%; top:${pos.top.toFixed(2)}%;
        width:${art.w * toyScale}px; height:${art.h * toyScale}px; z-index:${9 + Math.round(pos.top)};
        background-image:url('${artURL(art.file)}')" title="${esc(art.name)}"></span>`);
    }

    // fence cells back to normal, then mark broken ones
    el.querySelectorAll(".fence-cell.broken").forEach((cell) => {
      cell.classList.remove("broken");
      cell.style.backgroundImage = `url('${artURL(YARD_ART.fence[layout.cells[cell.dataset.cell]])}')`;
    });

    for (const incident of game.incidents.filter((item) => item.yard === yard)) {
      if (incident.type === "fence") {
        const cellIndex = brokenCellIndex(layout, incident.x);
        const cell = el.querySelector(`.fence-cell[data-cell="${cellIndex}"]`);
        cell.classList.add("broken");
        cell.style.backgroundImage = `url('${FX}fence_broken.png')`;
        const cx = (layout.fenceLeft + cellIndex * layout.tile + layout.tile / 2) / layout.width * 100;
        const cy = (layout.fenceBottom + layout.tile * 0.35) / layout.height * 100;
        html.push(`<button class="incident fence-incident" data-action="fix-incident" data-incident="${incident.id}"
            style="left:${cx.toFixed(2)}%; top:${cy.toFixed(2)}%; z-index:120"
            aria-label="Broken fence: click to fix it">
          <span class="fallen-panel" style="width:${layout.tile}px;height:${layout.tile}px;
            background-image:url('${artURL(YARD_ART.fence.section)}')"></span>
          <span class="incident-bubble">🔨 Fix!</span>
        </button>`);
      } else {
        const dog = findDogByName(incident.dogName);
        if (!dog) continue;
        const pos = walkSpot(yard, incident.x, incident.y);
        const holeScale = layout.scale * zoomFactor() * 0.95;
        const dogSize = 32 * spriteScale(dog.weight) * zoomFactor();
        html.push(`<button class="incident hole-incident" data-action="fix-incident" data-incident="${incident.id}"
            style="left:${pos.left.toFixed(2)}%; top:${pos.top.toFixed(2)}%; z-index:${10 + Math.round(pos.top)};
              --hole-w:${56 * holeScale}px; --hole-h:${32 * holeScale}px; --dog:${dogSize}px"
            aria-label="${esc(dog.name)} is stuck in a hole: click to help">
          <span class="hole-back" style="background-image:url('${FX}hole.png')"></span>
          <span class="hole-dog-clip">${spriteImg(dog, "stuck-dog", true, "idle")}</span>
          <span class="hole-front" style="background-image:url('${FX}hole_front.png')"></span>
          <span class="incident-bubble">🆘 Help!</span>
        </button>`);
      }
    }
    items.innerHTML = html.join("");
  }
}

/** The fence section closest to where the dog broke it. */
function brokenCellIndex(layout, x) {
  let best = 1;
  let bestDistance = Infinity;
  layout.cells.forEach((kind, i) => {
    if (kind !== "section" && kind !== "heart") return;
    const cx = (layout.fenceLeft + i * layout.tile + layout.tile / 2) / layout.width;
    if (cx < 0.03 || cx > 0.97) return;
    const distance = Math.abs(cx - x);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = i;
    }
  });
  return best;
}


/* =====================================================================
   4. WALKING DOGS
   ===================================================================== */
const walkers = new Map();  // Dog -> walker state

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
    if (walker.wasStuck && !dog.stuckInHole) {
      // freed from a hole: start walking from where the hole was
      walker.x = walker.holeX;
      walker.y = walker.holeY;
      walker.pause = 0;
    }
    if (dog.stuckInHole) {
      const incident = game.incidents.find((item) => item.type === "hole" && item.dogName === dog.name);
      if (incident) {
        const layout = yardLayout[dog.yard];
        walker.holeX = incident.x;
        walker.holeY = layout ? layout.top + incident.y * (layout.bottom - layout.top) : 0.6;
      }
    }
    walker.wasStuck = dog.stuckInHole;
    walker.el.classList.toggle("hidden", dog.stuckInHole);
    walker.el.classList.toggle("unwell", dog.status !== "healthy");
    walker.el.classList.toggle("selected", Boolean(modal && modal.dogName === dog.name));
  }
  const hint = $("#yard-hint");
  hint.textContent = dogs.length
    ? "Use ◀ ▶ to visit each yard. Click a dog to see its stats and give care. ❗ = needs help."
    : "The yards are empty. Take in dogs at the 🛎️ Front Desk during Morning Intake.";
}

function createWalker(dog, fromGate = true) {
  const el = document.createElement("button");
  el.className = "walker";
  el.dataset.action = "open-dog";
  el.dataset.dog = dog.name;
  el.setAttribute("aria-label", `${dog.name}, ${dog.breed}`);
  el.innerHTML = `<span class="bubble">❗</span>${spriteImg(dog, "", false, "idle")}<span class="tag">${esc(dog.name)}</span>`;
  yardElement(dog.yard).appendChild(el);

  const layout = yardLayout[dog.yard];
  const walker = {
    el,
    sprite: el.querySelector(".dog-sprite"),
    yard: dog.yard,
    x: fromGate && layout ? layout.gateX : 0.2 + Math.random() * 0.6,
    y: fromGate && layout ? layout.top : 0.7,
    tx: 0.5,
    ty: 0.7,
    pause: 0,
    facing: 1,
    anim: "walk",
    step: 0,
    frameTime: 0,
    shown: "",
    wasStuck: false,
    holeX: 0.5,
    holeY: 0.7,
  };
  if (fromGate) {
    walker.tx = walker.x + (Math.random() - 0.5) * 0.2;
    walker.ty = layout ? layout.top + 0.25 + Math.random() * 0.3 : 0.7;
  } else {
    pickTarget(walker);
  }
  walkers.set(dog, walker);
  placeWalker(dog, walker);
}

function pickTarget(walker) {
  const layout = yardLayout[walker.yard];
  const top = layout ? layout.top : 0.42;
  const bottom = layout ? layout.bottom : 0.95;
  walker.tx = 0.08 + Math.random() * 0.84;
  walker.ty = top + Math.random() * (bottom - top);
}

function walkerSpeed(dog) {
  let speed = dog.energy === "high" ? 0.13 : 0.075;
  if (dog.status !== "healthy") speed *= 0.4;
  return speed;
}

function updateWalker(dog, walker, dt) {
  if (dog.stuckInHole) return;
  const layout = yardLayout[walker.yard];
  if (layout) {
    walker.y = clamp(walker.y, layout.top - 0.02, layout.bottom);
    walker.ty = clamp(walker.ty, layout.top, layout.bottom);
  }
  walker.frameTime += dt;
  if (walker.pause > 0) {
    walker.pause -= dt;
    walker.anim = dog.status !== "healthy" ? "lie" : "idle";
    if (walker.frameTime > 0.45) {
      walker.frameTime = 0;
      walker.step += 1;
    }
    if (walker.pause <= 0) pickTarget(walker);
    return;
  }
  walker.anim = "walk";
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
  if (walker.frameTime > (dog.energy === "high" ? 0.11 : 0.16)) {
    walker.frameTime = 0;
    walker.step += 1;
  }
}

function placeWalker(dog, walker) {
  const el = walker.el;
  el.style.setProperty("--s", spriteScale(dog.weight));
  el.style.left = `${(walker.x * 100).toFixed(2)}%`;
  el.style.top = `${(walker.y * 100).toFixed(2)}%`;
  el.style.zIndex = String(10 + Math.round(walker.y * 100));
  el.classList.toggle("flip", walker.facing < 0);
  const frames = SPRITE_ANIMATIONS[walker.anim];
  const frame = frames[walker.step % frames.length];
  const shown = `${frame}|${dog.muzzled}`;
  if (shown !== walker.shown) {
    // Add the muzzle the moment one is bought.
    if (dog.muzzled && !walker.sprite.querySelector(".muzzle")) {
      walker.sprite.innerHTML = '<span class="muzzle"></span>';
    }
    setSpriteFrame(walker.sprite, dog.breed, frame);
    walker.shown = shown;
  }
}

function placeAllWalkers() {
  for (const [dog, walker] of walkers) placeWalker(dog, walker);
}

function removeAllWalkers() {
  for (const walker of walkers.values()) walker.el.remove();
  walkers.clear();
}

/** Butterflies drift around on a looping path (daytime only). */
function moveButterflies(time) {
  document.querySelectorAll(".butterfly").forEach((fly, i) => {
    const t = time / 1000 + i * 4.1;
    const x = 0.5 + 0.38 * Math.sin(t * 0.21) + 0.08 * Math.sin(t * 0.9);
    const y = 0.42 + 0.22 * Math.sin(t * 0.33 + 1) + 0.05 * Math.sin(t * 2.1);
    const dx = Math.cos(t * 0.21) * 0.21 + Math.cos(t * 0.9) * 0.072;
    fly.style.left = `${(x * 100).toFixed(2)}%`;
    fly.style.top = `${(y * 100).toFixed(2)}%`;
    fly.style.transform = `translate(-50%, -50%) scaleX(${dx < 0 ? -1 : 1})`;
  });
}

let lastTick = 0;
function tick(time) {
  const dt = Math.min(0.05, (time - lastTick) / 1000 || 0);
  lastTick = time;
  const watching = !$("#game-screen").hidden && !minigameOpen;
  for (const [dog, walker] of walkers) {
    updateWalker(dog, walker, dt);
    if (watching) placeWalker(dog, walker);
  }
  if (watching) moveButterflies(time);
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

function buildParade() {
  const parade = $("#title-parade");
  const breeds = ["Golden Retriever", "Beagle", "Siberian Husky", "Pembroke Welsh Corgi", "Dachshund", "Border Collie"];
  parade.innerHTML = breeds.map((breed, i) => `
    <div class="parade-dog" style="--delay:${-i * 2.6}s; --s:${i % 2 ? 2.3 : 2.8}">
      ${spriteImg({ breed, muzzled: false }, "", true, "walk")}
    </div>`).join("");
}
