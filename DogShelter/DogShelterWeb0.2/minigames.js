"use strict";

/* =====================================================================
   DOG SHELTER MANAGER 0.2 - minigames.js
   Click a broken fence or a hole in a yard to play:
     1. Shared        - opening/closing the mini-game screen, effects
     2. Fence repair  - drag the panel into the gap, hammer the nails
     3. Hole rescue   - pull the dog out, then fill the hole with dirt
   ===================================================================== */

let minigameOpen = false;
let minigame = null;   // { incident, root, scene, cleanup: [] }

/* =====================================================================
   1. SHARED
   ===================================================================== */
function startMinigame(incidentId, originEl) {
  const incident = game.incidents.find((item) => item.id === incidentId);
  if (!incident || minigameOpen) return;
  closeModal(true);
  minigameOpen = true;
  uiBusy = true;

  const root = $("#minigame");
  const rect = originEl ? originEl.getBoundingClientRect() : null;
  root.style.setProperty("--ox", `${rect ? rect.left + rect.width / 2 : innerWidth / 2}px`);
  root.style.setProperty("--oy", `${rect ? rect.top + rect.height / 2 : innerHeight / 2}px`);
  const isFence = incident.type === "fence";
  root.className = `minigame mg-shift-${game.shift}`;
  root.innerHTML = `
    <div class="mg-scene" id="mg-scene">
      <canvas class="mg-grass"></canvas>
      <div class="mg-sky"></div>
    </div>
    <div class="mg-hud">
      <div class="mg-title">${isFence ? "🔨 Fix the fence" : `🕳️ Rescue ${esc(incident.dogName)}`}</div>
      <div class="mg-steps" id="mg-steps"></div>
      <button class="btn btn-ghost mg-leave" id="mg-leave">Leave it for now</button>
    </div>
    <div class="mg-banner" id="mg-banner" hidden></div>`;
  root.hidden = false;
  void root.offsetWidth;
  root.classList.add("open");

  minigame = { incident, root, scene: $("#mg-scene"), cleanup: [], done: false };
  $("#mg-leave").addEventListener("click", () => endMinigame(false));
  drawSceneGrass(root.querySelector(".mg-grass"), incident.yard);

  if (isFence) startFenceGame();
  else startHoleGame();
}

function endMinigame(success) {
  if (!minigame) return;
  const { root, incident, cleanup } = minigame;
  cleanup.forEach((fn) => fn());
  minigame = null;
  root.classList.remove("open");
  root.classList.add("closing");
  setTimeout(() => {
    root.hidden = true;
    root.className = "minigame";
    root.innerHTML = "";
    minigameOpen = false;
    uiBusy = false;
    if (success) resolveIncident(incident.id);
    renderAll();
    saveGame();
  }, 520);
}

function setSteps(steps, current) {
  $("#mg-steps").innerHTML = steps.map((step, i) =>
    `<span class="mg-step ${i < current ? "done" : i === current ? "now" : ""}">${i < current ? "✔" : i + 1}. ${step}</span>`).join("");
}

function sceneSize() {
  const scene = minigame.scene;
  return { w: scene.clientWidth, h: scene.clientHeight };
}

/** Close-up grass for the mini-game, using the yard's own grass tiles. */
function drawSceneGrass(canvas, yard) {
  const { w, h } = sceneSize();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(w * ratio);
  canvas.height = Math.round(h * ratio);
  const files = YARD_ART.grass[yard].map(artURL);
  const images = [];
  let loaded = 0;
  files.forEach((src, i) => loadImage(src, (img) => {
    images[i] = img;
    if (++loaded < files.length) return;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.imageSmoothingEnabled = false;
    const tile = 32 * Math.max(4, Math.round(w / 260));
    const rand = seededRandom(game.decorSeed + 99);
    for (let y = 0; y < h; y += tile) {
      for (let x = 0; x < w; x += tile) {
        const roll = rand();
        ctx.drawImage(roll < 0.12 ? images[3] : images[Math.floor(roll * 3) % 3], x, y, tile, tile);
      }
    }
  }));
}

/** Add an element to the scene at a pixel position. */
function sceneAdd(html) {
  minigame.scene.insertAdjacentHTML("beforeend", html);
  return minigame.scene.lastElementChild;
}

function shake(strength = "hard") {
  const scene = minigame.scene;
  scene.classList.remove("shake-hard", "shake-soft");
  void scene.offsetWidth;
  scene.classList.add(`shake-${strength}`);
}

function dustPuff(x, y, size) {
  const el = sceneAdd(`<span class="mg-dust" style="left:${x}px;top:${y}px;width:${size}px;height:${size}px;
    background-image:url('${FX}dust.png')"></span>`);
  setTimeout(() => el.remove(), 600);
}

function popWord(x, y, text) {
  const el = sceneAdd(`<span class="mg-word" style="left:${x}px;top:${y}px;--tilt:${(Math.random() * 30 - 15).toFixed(0)}deg">${text}</span>`);
  setTimeout(() => el.remove(), 800);
}

function celebrate(text) {
  const { w, h } = sceneSize();
  for (let i = 0; i < 18; i++) {
    const el = sceneAdd(`<span class="mg-confetti" style="left:${w / 2}px;top:${h * 0.45}px;
      --dx:${(Math.random() * 2 - 1) * w * 0.45}px; --dy:${(-Math.random() * 0.5 - 0.1) * h}px;
      --rot:${Math.random() * 720 - 360}deg; animation-delay:${Math.random() * 0.15}s">${choice(["💖", "⭐", "🐾", "✨"])}</span>`);
    setTimeout(() => el.remove(), 1500);
  }
  const banner = $("#mg-banner");
  banner.textContent = text;
  banner.hidden = false;
}


/* =====================================================================
   2. FENCE REPAIR
   ===================================================================== */
function startFenceGame() {
  const { w, h } = sceneSize();
  const S = clamp(Math.floor(Math.min(w / 5.4, h / 3.3) / 32), 3, 8);
  const T = 32 * S;
  const hudBottom = $(".mg-hud").getBoundingClientRect().bottom - minigame.scene.getBoundingClientRect().top;
  const fenceTop = Math.round(Math.max(h * 0.2, hudBottom + T * 0.35));
  const rowLeft = Math.round((w - 5 * T) / 2);
  const gap = { x: rowLeft + 2 * T, y: fenceTop };
  const fence = YARD_ART.fence;
  minigame.scene.querySelector(".mg-sky").style.height = `${fenceTop + T * 0.4}px`;

  // fence row: section, post, [gap], post, section (+ more off to the sides)
  const cells = ["section", "post", null, "post", "section", "post", "section"];
  cells.forEach((kind, i) => {
    if (!kind) return;
    sceneAdd(`<span class="mg-fence" style="left:${rowLeft + i * T}px;top:${fenceTop}px;width:${T}px;height:${T}px;
      background-image:url('${artURL(fence[kind])}')"></span>`);
    if (i >= 5) {
      sceneAdd(`<span class="mg-fence" style="left:${rowLeft - (i - 4) * T}px;top:${fenceTop}px;width:${T}px;height:${T}px;
        background-image:url('${artURL(fence[kind])}')"></span>`);
    }
  });
  const ghost = sceneAdd(`<span class="mg-ghost" style="left:${gap.x}px;top:${gap.y}px;width:${T}px;height:${T}px"></span>`);

  // the fallen panel, lying in the grass
  const start = { x: Math.max(12, gap.x - T * 1.6), y: Math.min(h - T * 1.25, fenceTop + T * 1.9) };
  const panel = sceneAdd(`<span class="mg-panel" style="left:${start.x}px;top:${start.y}px;width:${T}px;height:${T}px;
    background-image:url('${artURL(fence.section)}');--rot:-16deg"></span>`);
  for (let i = 0; i < 4; i++) {
    sceneAdd(`<span class="mg-chip-static" style="left:${start.x + Math.random() * T}px;top:${start.y + T * (0.85 + Math.random() * 0.25)}px;
      width:${5 * S}px;height:${3 * S}px;background-image:url('${FX}chip.png')"></span>`);
  }

  const steps = ["Drag the panel into the gap", "Hammer in all 4 nails"];
  setSteps(steps, 0);

  // --- step 1: drag ---
  let drag = null;
  const onDown = (event) => {
    event.preventDefault();
    panel.setPointerCapture(event.pointerId);
    const left = parseFloat(panel.style.left);
    const top = parseFloat(panel.style.top);
    drag = { dx: event.clientX - left, dy: event.clientY - top };
    panel.classList.add("dragging");
  };
  const onMove = (event) => {
    if (!drag) return;
    panel.style.left = `${event.clientX - drag.dx}px`;
    panel.style.top = `${event.clientY - drag.dy}px`;
    const near = Math.hypot(parseFloat(panel.style.left) - gap.x, parseFloat(panel.style.top) - gap.y) < T * 0.6;
    ghost.classList.toggle("near", near);
  };
  const onUp = () => {
    if (!drag) return;
    drag = null;
    panel.classList.remove("dragging");
    const distance = Math.hypot(parseFloat(panel.style.left) - gap.x, parseFloat(panel.style.top) - gap.y);
    if (distance < T * 0.6) {
      snapPanel();
    } else {
      panel.classList.add("wobble");
      setTimeout(() => panel.classList.remove("wobble"), 400);
    }
  };
  panel.addEventListener("pointerdown", onDown);
  panel.addEventListener("pointermove", onMove);
  panel.addEventListener("pointerup", onUp);
  panel.addEventListener("pointercancel", onUp);

  function snapPanel() {
    panel.style.pointerEvents = "none";
    panel.classList.add("snapping");
    panel.style.left = `${gap.x}px`;
    panel.style.top = `${gap.y}px`;
    panel.style.setProperty("--rot", "0deg");
    ghost.remove();
    setTimeout(() => {
      shake("soft");
      dustPuff(gap.x, gap.y + T * 0.85, T * 0.45);
      dustPuff(gap.x + T * 0.6, gap.y + T * 0.85, T * 0.45);
      popWord(gap.x + T / 2, gap.y - T * 0.1, "THUNK!");
      startNails();
    }, 260);
  }

  // --- step 2: hammer the nails ---
  function startNails() {
    setSteps(steps, 1);
    const nailScale = S * 0.6;
    const nailW = 8 * nailScale;
    const nailH = 15 * nailScale;
    const headH = 4 * nailScale;
    const hitsNeeded = 3;
    const spots = [[2.5, 10], [29.5, 10], [2.5, 20], [29.5, 20]];
    const nails = spots.map(([px, py]) => {
      const x = gap.x + px * S;
      const railTop = gap.y + py * S;
      const el = sceneAdd(`<span class="mg-nail" style="left:${x - nailW / 2}px;top:${railTop - nailH + headH * 0.2}px;
          width:${nailW}px;height:${nailH}px">
        <span class="mg-nail-img" style="background-image:url('${FX}nail.png')"></span>
        <span class="mg-nail-ring"></span></span>`);
      return { el, img: el.querySelector(".mg-nail-img"), x, headY: railTop - nailH + headH, hits: 0, depth: nailH - headH * 1.1 };
    });

    const hammerScale = S * 0.95;
    const hammerW = 14 * hammerScale;
    const hammerH = 24 * hammerScale;
    const reach = hammerH - 3 * hammerScale;   // grip to hammer head
    const hammer = sceneAdd(`<span class="mg-hammer" style="width:${hammerW}px;height:${hammerH}px;
      background-image:url('${FX}hammer.png')"></span>`);
    minigame.scene.classList.add("hammer-mode");
    let pointer = { x: gap.x + T / 2, y: gap.y };
    let swinging = false;

    const placeHammer = () => {
      hammer.style.left = `${pointer.x + reach - hammerW / 2}px`;
      hammer.style.top = `${pointer.y - hammerH}px`;
    };
    placeHammer();

    const onSceneMove = (event) => {
      const box = minigame.scene.getBoundingClientRect();
      pointer = { x: event.clientX - box.left, y: event.clientY - box.top };
      placeHammer();
    };
    const onSceneDown = (event) => {
      if (event.target.closest(".mg-hud")) return;
      onSceneMove(event);
      if (swinging) return;
      swinging = true;
      hammer.classList.remove("swing");
      void hammer.offsetWidth;
      hammer.classList.add("swing");
      setTimeout(() => {
        const nail = nails.find((n) => n.hits < hitsNeeded &&
          Math.abs(n.x - pointer.x) < T * 0.22 && Math.abs(n.headY - pointer.y) < T * 0.24);
        if (nail) hitNail(nail);
        else popWord(pointer.x, pointer.y - T * 0.2, "whiff");
      }, 95);
      setTimeout(() => { swinging = false; }, 210);
    };
    const scene = minigame.scene;
    scene.addEventListener("pointermove", onSceneMove);
    scene.addEventListener("pointerdown", onSceneDown);
    minigame.cleanup.push(() => {
      scene.removeEventListener("pointermove", onSceneMove);
      scene.removeEventListener("pointerdown", onSceneDown);
    });

    function hitNail(nail) {
      nail.hits += 1;
      nail.img.style.transform = `translateY(${(nail.depth * nail.hits / hitsNeeded).toFixed(1)}px)`;
      nail.headY += nail.depth / hitsNeeded;
      shake("hard");
      const star = sceneAdd(`<span class="mg-impact" style="left:${nail.x}px;top:${nail.headY - T * 0.04}px;
        width:${24 * S * 0.6}px;height:${24 * S * 0.6}px;background-image:url('${FX}impact.png')"></span>`);
      setTimeout(() => star.remove(), 320);
      popWord(nail.x + T * 0.15, nail.headY - T * 0.32, choice(["BANG!", "WHAM!", "TOK!", "BONK!", "CLANG!"]));
      for (let i = 0; i < 4; i++) {
        const chip = sceneAdd(`<span class="mg-chip" style="left:${nail.x}px;top:${nail.headY + T * 0.05}px;
          width:${5 * S * 0.7}px;height:${3 * S * 0.7}px;background-image:url('${FX}chip.png');
          --dx:${(Math.random() * 2 - 1) * T * 0.7}px; --dy:${(Math.random() * 0.6 + 0.2) * T}px;
          --rot:${Math.random() * 540 - 270}deg"></span>`);
        setTimeout(() => chip.remove(), 650);
      }
      if (nail.hits >= hitsNeeded) {
        nail.el.classList.add("done");
        if (nails.every((n) => n.hits >= hitsNeeded)) finishFence();
      }
    }

    function finishFence() {
      scene.removeEventListener("pointerdown", onSceneDown);
      setSteps(steps, 2);
      setTimeout(() => {
        hammer.classList.add("away");
        minigame.scene.classList.remove("hammer-mode");
        panel.classList.add("fixed");
        celebrate("Fence fixed! 🎉");
        setTimeout(() => endMinigame(true), 1500);
      }, 350);
    }
  }
}


/* =====================================================================
   3. HOLE RESCUE
   ===================================================================== */
function startHoleGame() {
  const { w, h } = sceneSize();
  const incident = minigame.incident;
  const dog = findDogByName(incident.dogName);
  const S = clamp(Math.floor(Math.min(w / (56 * 1.9), h / (32 * 4.2))), 3, 9);
  const holeW = 56 * S;
  const holeH = 32 * S;
  const cx = Math.round(w * 0.55);
  const cy = Math.round(h * 0.6);
  const holeLeft = cx - holeW / 2;
  const holeTop = cy - holeH / 2;
  const lineY = holeTop + 18 * S;                 // the hole's opening
  const D = Math.round(32 * S * 1.15);            // dog size
  minigame.scene.querySelector(".mg-sky").style.height = `${Math.round(h * 0.16)}px`;

  let stage = 0;
  const holeBack = sceneAdd(`<span class="mg-hole" style="left:${holeLeft}px;top:${holeTop}px;width:${holeW}px;height:${holeH}px;
    background-image:url('${FX}hole.png')"></span>`);
  const clipH = D * 1.6;
  const clip = sceneAdd(`<span class="mg-dog-clip" style="left:${cx - D / 2}px;top:${lineY - clipH}px;width:${D}px;height:${clipH}px">
      ${spriteImg(dog, "mg-dog stuck", true, "idle")}
    </span>`);
  const holeFront = sceneAdd(`<span class="mg-hole mg-hole-front" style="left:${holeLeft}px;top:${holeTop}px;width:${holeW}px;height:${holeH}px;
    background-image:url('${FX}hole_front.png')"></span>`);
  const dogEl = clip.querySelector(".mg-dog");
  dogEl.style.setProperty("--size", `${D}px`);
  const baseTop = clipH - D * 0.58;               // only the top part shows
  dogEl.style.top = `${baseTop}px`;
  const arrow = sceneAdd(`<span class="mg-arrow" style="left:${cx}px;top:${lineY - D * 0.95}px">⬆️<small>Pull!</small></span>`);

  const steps = [`Drag ${dog.name} up out of the hole`, "Click the dirt pile to fill the hole"];
  setSteps(steps, 0);

  const setStage = (k) => {
    stage = k;
    holeBack.style.backgroundPosition = `${k * 25}% 0`;
    holeFront.style.backgroundPosition = `${k * 25}% 0`;
  };

  // --- step 1: pull the dog out ---
  let pull = null;
  const popAt = D * 0.42;
  const onDown = (event) => {
    event.preventDefault();
    clip.setPointerCapture(event.pointerId);
    pull = { startY: event.clientY, amount: 0 };
    dogEl.classList.add("pulling");
    arrow.classList.add("hide");
  };
  const onMove = (event) => {
    if (!pull) return;
    pull.amount = clamp(pull.startY - event.clientY, 0, D);
    dogEl.style.top = `${baseTop - pull.amount}px`;
    if (pull.amount >= popAt) popOut();
  };
  const onUp = () => {
    if (!pull) return;
    pull = null;
    dogEl.classList.remove("pulling");
    dogEl.classList.add("spring");
    dogEl.style.top = `${baseTop}px`;
    arrow.classList.remove("hide");
    setTimeout(() => dogEl.classList.remove("spring"), 260);
  };
  clip.addEventListener("pointerdown", onDown);
  clip.addEventListener("pointermove", onMove);
  clip.addEventListener("pointerup", onUp);
  clip.addEventListener("pointercancel", onUp);

  function popOut() {
    pull = null;
    clip.remove();
    arrow.remove();
    shake("soft");
    dustPuff(cx - D * 0.4, lineY - D * 0.3, D * 0.55);
    dustPuff(cx + D * 0.1, lineY - D * 0.25, D * 0.55);
    popWord(cx, lineY - D * 1.2, "POP!");

    // The dog flies out, lands beside the hole, and gets a fright.
    const free = sceneAdd(`<span class="mg-free-dog" style="left:${cx - D / 2}px;top:${lineY - D}px;width:${D}px;height:${D}px">
        <span class="mg-shock" style="background-image:url('${FX}shock.png')"></span>
        ${spriteImg(dog, "mg-dog", false, "idle")}
        <span class="mg-surprise" style="background-image:url('${FX}surprise.png')"></span>
      </span>`);
    const sprite = free.querySelector(".mg-dog");
    sprite.style.setProperty("--size", `${D}px`);
    setSpriteFrame(sprite, dog.breed, SPRITE_ANIMATIONS.idle[0]);
    const landX = Math.min(w - D * 1.2, holeLeft + holeW * 0.95);
    const landY = lineY - D * 0.35;
    const jump = free.animate([
      { transform: "translate(0, 0) rotate(-8deg)" },
      { transform: `translate(${(landX - cx + D / 2) * 0.5}px, ${-D * 1.1}px) rotate(12deg)`, offset: 0.45 },
      { transform: `translate(${landX - cx + D / 2}px, ${landY - (lineY - D)}px) rotate(0deg)` },
    ], { duration: 620, easing: "cubic-bezier(.3,.7,.4,1)", fill: "forwards" });

    jump.onfinish = () => {
      free.style.left = `${landX}px`;
      free.style.top = `${landY}px`;
      jump.cancel();
      free.classList.add("landed", "surprised");     // squash + "!" + shock lines
      dustPuff(landX + D * 0.2, landY + D * 0.75, D * 0.5);
      // hop, hop... then walk away
      setTimeout(() => {
        free.classList.remove("surprised");
        free.classList.add("calm");
        walkAway(free, sprite, landX);
      }, 1150);
      showDirtPile();
    };
  }

  function walkAway(free, sprite, fromX) {
    let step = 0;
    const timer = setInterval(() => {
      step += 1;
      setSpriteFrame(sprite, dog.breed, SPRITE_ANIMATIONS.walk[step % 4]);
    }, 110);
    const distance = w - fromX + D;
    const walk = free.animate([
      { transform: "translateX(0)" },
      { transform: `translateX(${distance}px)` },
    ], { duration: distance / (D * 2.2) * 1000, easing: "linear", fill: "forwards" });
    const stop = () => { clearInterval(timer); free.remove(); };
    walk.onfinish = stop;
    minigame.cleanup.push(() => clearInterval(timer));
  }

  // --- step 2: fill the hole ---
  function showDirtPile() {
    setSteps(steps, 1);
    const pw = 36 * S * 0.95;
    const ph = 26 * S * 0.95;
    const px = Math.max(10, holeLeft - pw * 0.95);
    const py = cy - ph * 0.55;
    let pending = 0;
    const pile = sceneAdd(`<button class="mg-pile" style="left:${px}px;top:${py}px;width:${pw}px;height:${ph}px;
      background-image:url('${FX}dirt_pile.png')" aria-label="Dirt pile: click to fill the hole"></button>`);
    const hint = sceneAdd(`<span class="mg-arrow mg-arrow-down" style="left:${px + pw / 2}px;top:${py - S * 14}px">👇<small>Click!</small></span>`);
    pile.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (pending >= 4) return;
      pending += 1;
      hint.classList.add("hide");
      pile.style.backgroundPosition = `${pending * 25}% 0`;
      pile.classList.remove("bump");
      void pile.offsetWidth;
      pile.classList.add("bump");
      const size = 8 * S;
      const clump = sceneAdd(`<span class="mg-clump" style="left:${px + pw / 2 - size / 2}px;top:${py}px;width:${size}px;height:${size * 0.62}px;
        background-image:url('${FX}dirt_clump.png')"></span>`);
      const dx = cx - (px + pw / 2);
      const dy = cy - py;
      const fly = clump.animate([
        { transform: "translate(0,0) rotate(0deg)" },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - S * 22}px) rotate(200deg)`, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) rotate(380deg)` },
      ], { duration: 430, easing: "ease-in", fill: "forwards" });
      fly.onfinish = () => {
        clump.remove();
        setStage(stage + 1);
        shake("soft");
        dustPuff(cx - S * 8, cy - S * 6, S * 18);
        popWord(cx, cy - S * 16, choice(["FLUMP!", "PLOP!", "THUD!"]));
        if (stage >= 4) {
          pile.disabled = true;
          setSteps(steps, 2);
          holeBack.classList.add("filled");
          celebrate("Hole filled! 🌱");
          setTimeout(() => endMinigame(true), 1500);
        }
      };
    });
  }
}
