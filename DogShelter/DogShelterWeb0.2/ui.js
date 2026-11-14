"use strict";

/* =====================================================================
   DOG SHELTER MANAGER 0.2 - ui.js
   Everything the player sees and clicks (except the yards themselves,
   which are in yard.js):
     1. Helpers + log
     2. Screens       - title (New Game / Continue), game, save
     3. HUD + yards   - header, yard carousel, dog cards
     4. Shift panel   - Front Desk (morning), Noon Activities, Night Chores
     5. Windows       - dog stats, upgrades, toy shop, menus, reports
     6. End Shift     - banners and the end-of-day report
     7. Input         - every button goes through one click handler
   ===================================================================== */

const $ = (selector) => document.querySelector(selector);
const YARD_ICONS = ["🐩", "🐕", "🦮"];

let currentYard = 0;
let uiBusy = false;
let modal = null;           // { type: "dog", dogName } etc.
let modalFeedback = null;   // { text, kind }
let logCapture = null;      // array while a banner/report is being collected
let logHistory = [];        // newest first, saved with the game
let lastMoney = null;
let saveTimer = null;


/* =====================================================================
   1. HELPERS + LOG
   ===================================================================== */
function esc(text) {
  return String(text).replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function log(text, kind = "info") {
  if (logCapture) logCapture.push({ text, kind });
  if (!game) return;
  const entry = { tag: `D${game.day} ${SHIFT_SHORT[game.shift]}`, text, kind };
  logHistory.unshift(entry);
  if (logHistory.length > 120) logHistory.length = 120;
  const list = $("#log");
  list.prepend(logItem(entry));
  while (list.children.length > 120) list.lastChild.remove();
}

function logItem(entry) {
  const item = document.createElement("li");
  item.className = `log-${entry.kind}`;
  item.innerHTML = `<span class="log-tag">${esc(entry.tag)}</span> ${esc(entry.text)}`;
  return item;
}

function renderLog() {
  const list = $("#log");
  list.innerHTML = "";
  logHistory.forEach((entry) => list.appendChild(logItem(entry)));
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

function happinessBar(value) {
  const level = value < 25 ? "low" : value < 50 ? "mid" : value < 75 ? "ok" : "high";
  return `<div class="hbar hbar-${level}" role="meter" aria-valuemin="0" aria-valuemax="100"
    aria-valuenow="${value}" aria-label="Happiness"><span style="width:${value}%"></span></div>`;
}

function conditionHTML(dog) {
  if (dog.stuckInHole) {
    return `<p class="condition unwell">🕳️ ${esc(dog.name)} is stuck in a hole!</p>`;
  }
  if (dog.status === "healthy") {
    return `<p class="condition healthy">✅ Healthy</p>`;
  }
  return `<p class="condition unwell">🤒 ${esc(dog.name)} ${esc(dog.describeCondition())}</p>`;
}

function slotPips(used, total) {
  let html = "";
  for (let i = 0; i < total; i++) html += `<span class="pip ${i < used ? "used" : ""}"></span>`;
  return html;
}


/* =====================================================================
   2. SCREENS
   ===================================================================== */
function showTitle() {
  closeModal(true);
  $("#game-screen").hidden = true;
  $("#title-screen").hidden = false;
  document.body.className = "shift-0";
  const save = readSave();
  const continueBtn = $("#btn-continue");
  continueBtn.hidden = !save;
  if (save) {
    const g = save.game;
    $("#continue-info").textContent = `Day ${g.day} · ${SHIFT_SHORT[g.shift]} · ${formatMoney(g.money)} · ${save.dogs.length} dog(s)`;
  }
  buildParade();
}

function enterGameScreen() {
  removeAllWalkers();
  lastMoney = null;
  $("#title-screen").hidden = true;
  $("#game-screen").hidden = false;
  showYard(0, true);
  layoutYards();
}

function startNewGame() {
  closeModal(true);
  newGameState();
  logHistory = [];
  renderLog();
  enterGameScreen();
  log("Welcome to Day 1! Owners are waiting at the Front Desk.", "day");
  startDayCare();
  renderAll();
  saveGame();
  showBanner({ icon: SHIFT_ICONS[0], title: "Day 1", sub: SHIFTS[0], lines: [] });
}

function continueGame() {
  const save = readSave();
  if (!save) {
    showTitle();
    return;
  }
  closeModal(true);
  loadGame(save);
  renderLog();
  enterGameScreen();
  for (const dog of dogs) createWalker(dog, false);
  renderAll();
  showBanner({ icon: "💾", title: `Day ${game.day}`, sub: `Welcome back! ${SHIFTS[game.shift]}`, lines: [] });
}

/** Save shortly after anything changes, so Continue is always up to date. */
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveGame, 300);
}


/* =====================================================================
   3. HUD + YARDS
   ===================================================================== */
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
  if (!game) return;
  renderHUD();
  renderYardTabs();
  renderShiftPanel();
  renderCards();
  syncWalkers();
  renderYardItems();
  if (modal && modal.type === "dog") renderDogModal();
  if (modal && modal.type === "shop") renderShopModal();
  if (modal && modal.type === "toys") renderToyModal();
  if (!game.gameOver) scheduleSave();
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
  const staff = Object.keys(game.staff).filter((key) => game.staff[key]);
  $("#hud-staff").textContent = staff.length ? staff.map((key) => STAFF_INFO[key].icon).join(" ") : "none";
  const labels = ["End Morning ➜", "End Noon ➜", "End Day 🌙"];
  $("#btn-end-shift").textContent = labels[game.shift];
}

function renderYardTabs() {
  $("#yard-tabs").innerHTML = YARDS.map((yard, index) => {
    const inYard = yardDogs(yard);
    const unwell = inYard.filter((dog) => dog.status !== "healthy").length;
    const incident = incidentInYard(yard);
    const full = inYard.length >= game.yardCapacity[yard];
    return `<button class="yard-tab ${index === currentYard ? "active" : ""}" data-action="yard-go"
        data-index="${index}" aria-pressed="${index === currentYard}">
      <span class="yard-tab-icon">${YARD_ICONS[index]}</span>
      <span class="yard-tab-name">${YARD_SHORT[yard]}<small> yard</small></span>
      <span class="yard-tab-count ${full ? "full" : ""}">${inYard.length}/${game.yardCapacity[yard]} 🐾</span>
      ${unwell ? `<b class="badge" title="Dogs needing care">${unwell}❗</b>` : ""}
      ${incident ? `<b class="badge badge-left" title="Needs fixing">${incident.type === "fence" ? "🔨" : "🕳️"}</b>` : ""}
    </button>`;
  }).join("");
  for (const yard of YARDS) {
    const empty = yardElement(yard).querySelector(".yard-empty");
    empty.hidden = yardDogs(yard).length > 0;
  }
}

function renderCards() {
  const grid = $("#dog-cards");
  const yard = YARDS[currentYard];
  const inYard = yardDogs(yard);
  $("#cards-heading").textContent =
    `${YARD_ICONS[currentYard]} Dogs in the ${yard} (${inYard.length}/${game.yardCapacity[yard]})`;
  if (inYard.length === 0) {
    const sizes = ["under 20 lbs", "20 to 49 lbs", "50 lbs and up"];
    grid.innerHTML = `<div class="empty-state">
      <div class="big-emoji">🐾</div>
      <p>No dogs in this yard. Dogs <b>${sizes[currentYard]}</b> stay here (room for
        ${game.yardCapacity[yard]}). Take dogs in at the <b>🛎️ Front Desk</b> during Morning Intake.</p>
    </div>`;
    return;
  }
  grid.innerHTML = inYard.map((dog) => `
    <article class="dog-card ${dog.status !== "healthy" || dog.stuckInHole ? "needs-care" : ""}">
      <button class="dog-card-hit" data-action="open-dog" data-dog="${esc(dog.name)}"
        aria-label="Open ${esc(dog.name)}"></button>
      <div class="dog-card-top">
        <div class="mini-portrait">${spriteImg(dog, "mini", true, dog.status !== "healthy" ? "lie" : "idle")}</div>
        <div>
          <h3>${esc(dog.name)}</h3>
          <p class="sub">${esc(dog.breed)}</p>
        </div>
      </div>
      <ul class="facts">
        <li>⚖️ ${dog.weight} lbs</li>
        <li>📅 ${dog.stayDays} day${dog.stayDays === 1 ? "" : "s"} left</li>
        ${dog.exercisedToday ? "<li>🦮 Exercised</li>" : ""}
        ${dog.muzzled ? "<li>🔒 Muzzled</li>" : ""}
        ${dog.trained ? "<li>🎓 Trained</li>" : ""}
      </ul>
      ${conditionHTML(dog)}
      <div class="happy-row"><span>Happiness ${dog.happiness}</span>${happinessBar(dog.happiness)}</div>
      <div class="card-button">${dog.stuckInHole ? "🕳️ Help!" : dog.status !== "healthy" ? "💉 Treat now" : "📋 Stats & care"}</div>
    </article>`).join("");
}


/* =====================================================================
   4. SHIFT PANEL - changes with the shift
   ===================================================================== */
function renderShiftPanel() {
  const titles = ["🛎️ Front Desk", "☀️ Noon Activities", "🌙 Night Chores"];
  $("#panel-title").textContent = titles[game.shift];
  const sign = $("#desk-sign");
  const reason = intakeBlockedReason();
  sign.textContent = game.shift === 0 ? "OPEN" : game.shift === 1 ? "NOON" : "NIGHT";
  sign.className = `desk-sign sign-${game.shift}`;

  let html = "";
  if (game.incidents.length) {
    html += game.incidents.map((incident) => `<button class="incident-alert" data-action="goto-incident" data-incident="${incident.id}">
      ${incident.type === "fence" ? "🔨 Broken fence" : `🕳️ ${esc(incident.dogName)} stuck in a hole`} in the
      ${esc(YARD_SHORT[incident.yard])} yard. <b>Fix it before night!</b></button>`).join("");
  }
  if (game.shift === 0) html += deskHTML(reason);
  else if (game.shift === 1) html += noonHTML();
  else html += nightHTML();
  $("#desk-content").innerHTML = html;
}

/* ---------- morning: Front Desk ---------- */
function deskHTML(reason) {
  if (reason === null && !offer) offer = makeOffer();
  if (reason !== null) offer = null;

  let html = `<div class="offer-pips" title="Intake offers used today">
    <span>Offers today</span> ${slotPips(game.intakesToday, game.dailyIntakeLimit)}
    <b>${game.intakesToday}/${game.dailyIntakeLimit}</b></div>`;
  if (deskResult) html += renderDeskResult();

  if (reason === "full") {
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
  return html;
}

function renderOfferCard() {
  const dog = offer.dog;
  const room = yardHasRoom(dog.yard);
  const count = yardDogs(dog.yard).length;
  const capacity = game.yardCapacity[dog.yard];
  return `<article class="offer-card">
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
        </ul>
      </div>
    </div>
    <div class="capacity-row ${room ? "" : "full"}">
      🏡 ${esc(dog.yard)}: <b>${count}/${capacity}</b>
      <span class="capacity-bar">${slotPips(count, capacity)}</span>
    </div>
    <div class="care-plan">
      <div><span>Stay</span><b>${dog.stayDays} day${dog.stayDays > 1 ? "s" : ""}</b></div>
      <div><span>Pay rate</span><b>$${offer.rate.toFixed(2)}/lb/day</b></div>
      <div><span>Upkeep</span><b>$${(dog.weight * CONFIG.upkeepPerPound).toFixed(2)}/day</b></div>
      <div class="pay"><span>Payment at checkout</span><b>$${dog.carePayment.toFixed(2)}</b></div>
    </div>
    <p class="small-note">${room
      ? "Happy dogs pay more; unhappy or sick dogs pay less. Declining still uses an offer."
      : `<b>No room!</b> The ${esc(dog.yard)} is full. Expand it in 🛒 Upgrades, or decline.`}</p>
    <div class="offer-buttons">
      <button class="btn btn-big btn-green" data-action="accept-offer" ${room ? "" : "disabled"}>✔ Accept</button>
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

/* ---------- noon: walks and play sessions ---------- */
function noonHTML() {
  const left = noonSlotsLeft();
  let html = `<div class="offer-pips"><span>Noon time</span> ${slotPips(game.noonSlotsUsed, CONFIG.noonSlots)}
    <b>${left} left</b></div>
    <p class="panel-note">Exercise makes dogs happier and <b>much less likely to bite</b> or dig for the rest of the day.
    ${game.staff.walker ? "🦮 Your dog walker already took out the least happy dogs." : ""}</p>`;
  if (dogs.length === 0) return html + `<div class="desk-message"><p>No dogs to exercise yet.</p></div>`;

  html += `<h3 class="panel-sub">🎾 Play sessions <small>(1 slot, whole yard +${CONFIG.playSessionHappiness})</small></h3><div class="task-list">`;
  for (const yard of YARDS) {
    const count = yardDogs(yard).filter((dog) => !dog.stuckInHole).length;
    if (count === 0) continue;
    const done = game.playSessions[yard];
    const gear = hasToy(yard, "play") ? " ×1.5 🏁" : "";
    html += `<button class="task-btn ${done ? "done" : ""}" data-action="play-session" data-yard="${esc(yard)}"
      ${done || left <= 0 ? "disabled" : ""}>
      <span>${done ? "✅" : "🎾"} ${esc(YARD_SHORT[yard])} yard</span><small>${count} dog(s)${gear}</small></button>`;
  }
  html += `</div><h3 class="panel-sub">🦮 Walks <small>(1 slot, one dog +${CONFIG.walkHappiness})</small></h3><div class="task-list">`;
  const sorted = dogs.slice().sort((a, b) => a.happiness - b.happiness);
  for (const dog of sorted) {
    const blocked = dog.exercisedToday || dog.stuckInHole || left <= 0;
    html += `<button class="task-btn ${dog.exercisedToday ? "done" : ""}" data-action="walk-dog" data-dog="${esc(dog.name)}"
      ${blocked ? "disabled" : ""}>
      <span>${dog.exercisedToday ? "✅" : "🦮"} ${esc(dog.name)}</span>
      <small>😊 ${dog.happiness}${dog.energy === "high" && !dog.trained ? " ⚡" : ""}</small></button>`;
  }
  return html + "</div>";
}

/* ---------- night: feeding and cleaning ---------- */
function nightHTML() {
  const left = nightSlotsLeft();
  let html = `<div class="offer-pips"><span>Night time</span> ${slotPips(game.nightSlotsUsed, CONFIG.nightSlots)}
    <b>${left} left</b></div>
    <p class="panel-note">Skip feeding and dogs may go to bed <b>hungry</b>. Skip cleaning and they may wake up <b>sick</b>.
    ${game.staff.kennelHand ? "🧹 Your kennel hand did every chore tonight." : ""}</p>`;
  const occupied = YARDS.filter((yard) => yardDogs(yard).length > 0);
  if (occupied.length === 0) return html + `<div class="desk-message"><p>No dogs tonight. Nothing to do!</p></div>`;
  html += `<div class="chore-grid">`;
  for (const yard of occupied) {
    const chores = game.chores[yard];
    html += `<div class="chore-yard"><b>${YARD_ICONS[YARDS.indexOf(yard)]} ${esc(YARD_SHORT[yard])}</b>
      <button class="task-btn ${chores.fed ? "done" : ""}" data-action="chore" data-yard="${esc(yard)}" data-chore="feed"
        ${chores.fed || left <= 0 ? "disabled" : ""}><span>${chores.fed ? "✅" : "🍖"} Feed</span></button>
      <button class="task-btn ${chores.cleaned ? "done" : ""}" data-action="chore" data-yard="${esc(yard)}" data-chore="clean"
        ${chores.cleaned || left <= 0 ? "disabled" : ""}><span>${chores.cleaned ? "✅" : "🧽"} Clean</span></button>
    </div>`;
  }
  return html + "</div>";
}


/* =====================================================================
   5. WINDOWS
   ===================================================================== */
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

function feedbackHTML(fallback = "") {
  if (modalFeedback) {
    return `<p class="feedback feedback-${modalFeedback.kind}" role="status">${esc(modalFeedback.text)}</p>`;
  }
  return fallback ? `<p class="feedback" role="status">${fallback}</p>` : "";
}

/* ---------- dog stats ---------- */
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
  const fallback = unwell ? "Read the symptom and pick the treatment you think it needs."
    : `${esc(dog.name)} is healthy - no treatment needed.`;

  let activity;
  if (dog.stuckInHole) {
    const incident = game.incidents.find((item) => item.type === "hole" && item.dogName === dog.name);
    activity = `<button class="btn btn-orange" data-action="goto-incident" data-incident="${incident ? incident.id : ""}">🕳️ Go pull ${esc(dog.name)} out of the hole</button>`;
  } else if (dog.exercisedToday) {
    activity = `<p class="activity-note">✅ ${esc(dog.name)} had exercise today: calmer, less likely to bite or dig.</p>`;
  } else if (game.shift === 1) {
    activity = `<button class="btn btn-green" data-action="walk-dog" data-dog="${esc(dog.name)}" ${noonSlotsLeft() <= 0 ? "disabled" : ""}>
      🦮 Walk ${esc(dog.name)} (+${exerciseAmount(dog.yard, CONFIG.walkHappiness)} happiness · ${noonSlotsLeft()} noon slot(s) left)</button>`;
  } else {
    activity = `<p class="activity-note">🦮 Walks and play sessions happen during the <b>Noon</b> shift.</p>`;
  }

  const html = `
    <button class="modal-close" data-action="close-modal" aria-label="Close">✖</button>
    <div class="dog-sheet">
      <div class="dog-portrait-box ${unwell ? "unwell" : ""}">
        ${spriteImg(dog, "portrait-big", true, unwell ? "lie" : "idle")}
        <div class="portrait-floats" id="portrait-floats"></div>
      </div>
      <div class="dog-sheet-info">
        <h2>${esc(dog.name)}</h2>
        <p class="sub">${esc(dog.breed)} · ${dog.age} years old</p>
        <ul class="facts facts-grid">
          <li><span>Weight</span><b>${dog.weight} lbs</b></li>
          <li><span>Energy</span><b>${dog.energy === "high" ? "⚡ High" : "😌 Calm"}${dog.trained ? " 🎓" : ""}</b></li>
          <li><span>Yard</span><b>${esc(YARD_SHORT[dog.yard])}</b></li>
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
    ${feedbackHTML(fallback)}
    <h3 class="section-title">🦮 Activities</h3>
    <div class="supply-row">${activity}</div>
    <h3 class="section-title">🧰 Supplies</h3>
    <div class="supply-row">
      <button class="btn btn-purple" data-action="use-item" data-item="muzzle"
        ${muzzleBlocked || game.money < CONFIG.muzzleCost ? "disabled" : ""}>
        🔒 ${muzzleBlocked || `Muzzle · $${CONFIG.muzzleCost}`}</button>
      <button class="btn btn-purple" data-action="use-item" data-item="treats"
        ${treatsBlocked || game.money < CONFIG.treatsCost ? "disabled" : ""}>
        🦴 ${treatsBlocked || `Training treats · $${CONFIG.treatsCost}`}</button>
    </div>`;

  if (first) openModal(modal, html);
  else $("#modal").innerHTML = html;
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

/* ---------- upgrades ---------- */
function openShop() {
  modalFeedback = null;
  modal = { type: "shop" };
  renderShopModal(true);
}

function shopCard(item) {
  return `<article class="shop-item ${item.owned ? "owned" : ""}">
    <div class="shop-icon">${item.icon}</div>
    <h3>${esc(item.title)}</h3>
    <p>${esc(item.text)}</p>
    <button class="btn ${item.btnClass || (item.owned ? "btn-ghost" : "btn-yellow")}" ${item.action} ${item.disabled ? "disabled" : ""}>
      ${item.label}</button>
  </article>`;
}

function renderShopModal(first = false) {
  const intake = CONFIG.intakeUpgrades.map((upgrade, index) => shopCard({
    icon: ["📋", "🗂️", "🏢"][index],
    title: `+${upgrade.slots} daily intake slots`,
    text: `See more dogs each morning. Your limit is ${game.dailyIntakeLimit}.`,
    action: `data-action="buy-slots" data-index="${index}"`,
    disabled: game.money < upgrade.cost,
    label: `Buy · $${upgrade.cost}`,
  })).join("");

  const space = YARDS.map((yard, index) => {
    const cost = yardExpansionCost(yard);
    return shopCard({
      icon: YARD_ICONS[index],
      title: `Expand the ${YARD_SHORT[yard]} yard`,
      text: `Room for ${game.yardCapacity[yard]} dogs now (${yardDogs(yard).length} staying). +${CONFIG.yardExpansionSlots} spaces.`,
      action: `data-action="expand-yard" data-yard="${esc(yard)}"`,
      disabled: game.money < cost,
      label: `Expand · $${cost}`,
    });
  }).join("");

  const staff = Object.keys(STAFF_INFO).map((key) => {
    const info = STAFF_INFO[key];
    const hired = game.staff[key];
    return shopCard({
      icon: info.icon,
      title: `${info.title} · $${CONFIG.staff[key].wage}/day`,
      text: info.text,
      action: `data-action="${hired ? "fire" : "hire"}" data-staff="${key}"`,
      owned: hired,
      btnClass: hired ? "btn-red" : "btn-green",
      label: hired ? "Let go" : "Hire",
    });
  }).join("");

  const effect = poundageEffect();
  const extras = [
    shopCard({
      icon: "💵",
      title: `+$${CONFIG.perPoundUpgradeBonus.toFixed(2)} per pound`,
      text: effect ? `Owned! Today's trade-off: ${effect.description}`
        : "Earn more at checkout. Trade-off: a random daily cost (lost review or repair/supply bill).",
      action: `data-action="buy-perpound"`,
      disabled: Boolean(effect) || game.money < CONFIG.perPoundUpgradeCost,
      owned: Boolean(effect),
      label: effect ? "✔ Owned" : `Buy · $${CONFIG.perPoundUpgradeCost}`,
    }),
    shopCard({
      icon: "🔒", title: "Muzzle", text: "Stops one dog from biting for the rest of its stay.",
      action: `data-action="pick-dog" data-item="muzzle"`,
      disabled: game.money < CONFIG.muzzleCost || dogs.length === 0,
      label: `Choose dog · $${CONFIG.muzzleCost}`,
    }),
    shopCard({
      icon: "🦴", title: "Training treats", text: "Calms one high-energy dog: no more holes or broken fences from it.",
      action: `data-action="pick-dog" data-item="treats"`,
      disabled: game.money < CONFIG.treatsCost || dogs.length === 0,
      label: `Choose dog · $${CONFIG.treatsCost}`,
    }),
  ].join("");

  const wages = dailyWages();
  const html = `
    <button class="modal-close" data-action="close-modal" aria-label="Close">✖</button>
    <h2>🛒 Upgrades</h2>
    <p class="sub">You have <b>${formatMoney(game.money)}</b> · Staff wages: <b>$${wages}/day</b></p>
    ${feedbackHTML()}
    <button class="toy-banner" data-action="browse-toys">
      <span class="toy-banner-art">${["Small Dog Yard", "Medium Dog Yard", "Large Dog Yard"].map((yard) =>
        `<span class="toy-thumb" style="background-image:url('${artURL(YARD_ART.toys[yard].house.file)}')"></span>`).join("")}</span>
      <span><b>🧸 Browse toys</b><small>Beds, balls, pools and more for each yard</small></span>
      <span class="toy-banner-go">➜</span>
    </button>
    <h3 class="section-title">🏡 Yard space</h3><div class="shop-grid">${space}</div>
    <h3 class="section-title">👥 Staff &amp; volunteers</h3><div class="shop-grid">${staff}</div>
    <h3 class="section-title">📋 Intake</h3><div class="shop-grid">${intake}</div>
    <h3 class="section-title">🧰 Supplies &amp; extras</h3><div class="shop-grid">${extras}</div>`;
  if (first) openModal(modal, html);
  else $("#modal").innerHTML = html;
}

/* ---------- toy shop ---------- */
function openToys() {
  modalFeedback = null;
  modal = { type: "toys" };
  renderToyModal(true);
}

function renderToyModal(first = false) {
  const sections = YARDS.map((yard, index) => {
    const cards = TOY_ORDER.map((slot) => {
      const art = YARD_ART.toys[yard][slot];
      const owned = hasToy(yard, slot);
      const price = toyPrice(yard, slot);
      const big = Math.min(3, 84 / Math.max(art.w, art.h));
      return `<article class="toy-card ${owned ? "owned" : ""}">
        <div class="toy-art"><span class="toy-preview ${art.frames > 1 ? `anim-${art.frames}` : ""}" style="
          width:${art.w * big}px;height:${art.h * big}px;background-image:url('${artURL(art.file)}');
          ${art.frames > 1 ? `animation-duration:${(art.frames / art.fps).toFixed(2)}s` : ""}"></span></div>
        <h4>${esc(art.name)}</h4>
        <p>${esc(TOY_SLOTS[slot].effect)}</p>
        <button class="btn ${owned ? "btn-ghost" : "btn-yellow"}" data-action="buy-toy" data-yard="${esc(yard)}" data-slot="${slot}"
          ${owned || game.money < price ? "disabled" : ""}>${owned ? "✔ In the yard" : `Buy · $${price}`}</button>
      </article>`;
    }).join("");
    return `<section class="toy-section toy-${index}">
      <h3>${YARD_ICONS[index]} ${esc(yard)}</h3>
      <div class="toy-grid">${cards}</div>
    </section>`;
  }).join("");

  const html = `
    <button class="modal-close" data-action="close-modal" aria-label="Close">✖</button>
    <button class="btn btn-ghost back-btn" data-action="upgrades">← Upgrades</button>
    <h2>🧸 Toys</h2>
    <p class="sub">You have <b>${formatMoney(game.money)}</b>. Toys only help the dogs in their own yard and show up there
      in a random spot.</p>
    ${feedbackHTML()}
    ${sections}`;
  if (first) openModal(modal, html);
  else $("#modal").innerHTML = html;
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
    <button class="btn btn-ghost back-btn" data-action="upgrades">← Upgrades</button>
    <h2>Choose a dog to ${label}</h2>
    <div class="pick-grid">${buttons}</div>`);
}

function showHowTo() {
  openModal({ type: "howto" }, `
    <button class="modal-close" data-action="close-modal" aria-label="Close">✖</button>
    <h2>🐾 How to Play</h2>
    <div class="howto">
      <p><b>Every day has three shifts.</b> Press <b>End Shift</b> to move on.</p>
      <p><b>🌅 Morning - Front Desk:</b> owners drop dogs off. Every offer uses one of your daily slots,
        whether you <b>Accept</b> or <b>Decline</b>. Each yard only has so much room, so a full yard means
        saying no (or expanding it in 🛒 Upgrades).</p>
      <p><b>☀️ Noon - walks &amp; play:</b> you have ${CONFIG.noonSlots} slots. A walk gives one dog
        +${CONFIG.walkHappiness} happiness; a play session gives a whole yard +${CONFIG.playSessionHappiness}.
        Exercised dogs are calmer: less biting and no digging for the rest of the day.</p>
      <p><b>🌙 Night - chores:</b> you have ${CONFIG.nightSlots} slots to <b>feed</b> and <b>clean</b> each yard.
        Skip feeding and dogs go to bed hungry; skip cleaning and they can get sick.</p>
      <p><b>🤒 Care:</b> you only see symptoms. Click a dog and pick a treatment: 🍖 feed $5, 💊 medicate $25,
        🎾 play $0, 🩺 vet $40, 🧸 comfort $5. Right = happier dog and +1 review. Wrong = -1 review.</p>
      <p><b>🔨🕳️ Trouble:</b> restless high-energy dogs can break the fence or dig a hole. Click it in the yard to
        fix it yourself in a mini-game, or pay for it at night.</p>
      <p><b>💰 Money:</b> dogs pay at checkout. Every dog costs $${CONFIG.upkeepPerPound.toFixed(2)}/lb per day,
        and staff are paid every night. Two days in a row in debt and the shelter closes.</p>
      <p><b>👥 Staff:</b> a Vet Tech treats one dog every morning, a Dog Walker walks dogs at noon, and a
        Kennel Hand does the night chores.</p>
      <p><b>🧸 Toys</b> make the dogs in their yard happier and help in other ways. Very happy dogs
        (${CONFIG.happyReviewAt}+) sometimes earn you a review at night.</p>
      <p><b>💾 Saving:</b> the game saves itself as you play. Press <b>Continue</b> on the title screen to pick up
        where you left off (in the same browser).</p>
    </div>
    <button class="btn btn-green" data-action="close-modal" data-autofocus>Got it!</button>`);
}

function showPauseMenu() {
  openModal({ type: "menu" }, `
    <h2>⏸️ Paused</h2>
    <div class="menu-stack">
      <button class="btn btn-big btn-green" data-action="close-modal" data-autofocus>▶ Resume</button>
      <button class="btn btn-big btn-blue" data-action="save-game">💾 Save game</button>
      <button class="btn btn-big btn-blue" data-action="how-to">? How to Play</button>
      <button class="btn btn-big btn-yellow" data-action="main-menu">🏠 Save &amp; quit to title</button>
      <button class="btn btn-big btn-red" data-action="retire">🏁 Retire &amp; see results</button>
    </div>
    <p class="save-note" id="save-note"></p>`);
}

function confirmNewGame() {
  openModal({ type: "menu" }, `
    <button class="modal-close" data-action="close-modal" aria-label="Close">✖</button>
    <h2>Start a new game?</h2>
    <p class="sub">Your saved game will be replaced.</p>
    <div class="menu-stack">
      <button class="btn btn-big btn-red" data-action="new-game-confirmed">Yes, start over</button>
      <button class="btn btn-big btn-green" data-action="close-modal" data-autofocus>Keep my save</button>
    </div>`);
}

function showDayReport(dayNumber, lines, moneyBefore, done) {
  const shown = lines.filter((line) => line.text !== "No special event this shift.");
  const icons = { good: "🟢", bad: "🔴", info: "🔵", day: "🌅" };
  const change = game.money - moneyBefore;
  openModal({ type: "report", locked: true, done }, `
    <h2>🌙 End of Day ${dayNumber}</h2>
    <ul class="report-lines">
      ${shown.map((line) => `<li class="log-${line.kind}">${icons[line.kind] || "•"} ${esc(line.text)}</li>`).join("")}
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
  game.gameOver = true;
  deleteSave();
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
      <button class="btn btn-big btn-green" data-action="new-game-confirmed" data-autofocus>🔁 Play Again</button>
      <button class="btn btn-big btn-blue" data-action="main-menu">🏠 Main Menu</button>
    </div>`);
}


/* =====================================================================
   6. END SHIFT - banners and the end-of-day report
   ===================================================================== */
function showBanner({ icon, title, sub, lines }, done) {
  const banner = $("#banner");
  uiBusy = true;
  $("#banner-icon").textContent = icon;
  $("#banner-title").textContent = title;
  $("#banner-sub").textContent = sub;
  $("#banner-lines").innerHTML = lines
    .map((line) => `<li class="log-${line.kind}">${esc(line.text)}</li>`).join("");
  banner.className = `banner banner-shift-${game ? game.shift : 0}`;
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

function endShift() {
  if (uiBusy || game.gameOver) return;
  closeModal(true);
  offer = null;
  deskResult = null;
  const moneyBefore = game.money;

  const shiftLines = capture(shiftEvent);

  if (game.shift < SHIFTS.length - 1) {
    game.shift += 1;
    const startLines = capture(beginShift);
    renderAll();
    showBanner({
      icon: SHIFT_ICONS[game.shift],
      title: SHIFTS[game.shift],
      sub: game.shift === 1 ? `Day ${game.day} · walks & play time` : `Day ${game.day} · feeding & cleaning time`,
      lines: shiftLines.concat(startLines).filter((line) => line.text !== "No special event this shift."),
    });
    return;
  }

  const dayNumber = game.day;
  const dayLines = capture(endDayCore);
  if (game.gameOver) {
    renderAll();
    showDayReport(dayNumber, shiftLines.concat(dayLines), moneyBefore, () => showGameOver("closed"));
    return;
  }
  const morningLines = capture(startNewDay);
  renderAll();
  saveGame();
  showDayReport(dayNumber, shiftLines.concat(dayLines), moneyBefore, () => {
    showBanner({
      icon: SHIFT_ICONS[0],
      title: `Day ${game.day}`,
      sub: SHIFTS[0],
      lines: morningLines.filter((line) => !line.text.startsWith("Welcome")),
    });
  });
}


/* =====================================================================
   7. INPUT
   ===================================================================== */
function feedback(result) {
  modalFeedback = { text: result.text, kind: result.done ? "good" : "info" };
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) {
    if (event.target === $("#modal-root") && modal && !modal.locked) closeModal();
    return;
  }
  if (uiBusy) return;
  const action = target.dataset.action;
  const data = target.dataset;

  switch (action) {
    case "new-game":
      if (readSave()) confirmNewGame();
      else startNewGame();
      break;
    case "new-game-confirmed":
      deleteSave();
      startNewGame();
      break;
    case "continue":
      continueGame();
      break;
    case "how-to":
      showHowTo();
      break;
    case "main-menu":
      if (game && !game.gameOver) saveGame();
      showTitle();
      break;
    case "menu":
      showPauseMenu();
      break;
    case "save-game": {
      const ok = saveGame();
      const note = $("#save-note");
      if (note) note.textContent = ok ? "💾 Game saved! Use Continue on the title screen to come back."
        : "Couldn't save: your browser is blocking storage for local files.";
      break;
    }
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
      showYard(Number(data.index));
      break;
    case "upgrades":
      openShop();
      break;
    case "browse-toys":
      openToys();
      break;
    case "jump-intake":
      $("#intake-panel").scrollIntoView({ behavior: "smooth", block: "start" });
      break;
    case "end-shift":
      endShift();
      break;
    case "accept-offer":
    case "decline-offer": {
      if (!offer) break;
      const result = answerOffer(action === "accept-offer");
      if (result.error) break;
      deskResult = result;
      if (result.accepted) {
        // Slide to the dog's assigned yard so you can watch it walk in.
        showYard(YARDS.indexOf(result.dog.yard));
        openGate(result.dog.yard);
      }
      renderAll();
      if (result.accepted) setTimeout(() => floatOverDog(result.dog, "🏠"), 50);
      break;
    }
    case "open-dog":
      openDogModal(data.dog);
      break;
    case "treat": {
      const dog = findDogByName(modal.dogName);
      const result = provideCare(dog, data.treatment);
      modalFeedback = { text: result.text, kind: !result.done ? "info" : result.correct ? "good" : "bad" };
      renderAll();
      if (result.done) {
        floatInPortrait(result.correct ? "💖" : "💢");
        floatOverDog(dog, result.correct ? "💖" : "💢");
      }
      break;
    }
    case "walk-dog": {
      const dog = findDogByName(data.dog);
      const result = walkDog(dog);
      if (modal && modal.type === "dog") feedback(result);
      renderAll();
      if (result.done) floatOverDog(dog, "🦮");
      break;
    }
    case "play-session": {
      const result = playSession(data.yard);
      renderAll();
      if (result.done) {
        showYard(YARDS.indexOf(data.yard));
        yardDogs(data.yard).forEach((dog, i) => setTimeout(() => floatOverDog(dog, "🎾"), i * 120));
      }
      break;
    }
    case "chore": {
      const result = doChore(data.yard, data.chore);
      renderAll();
      if (result.done) {
        showYard(YARDS.indexOf(data.yard));
        yardDogs(data.yard).forEach((dog, i) =>
          setTimeout(() => floatOverDog(dog, data.chore === "feed" ? "🍖" : "✨"), i * 120));
      }
      break;
    }
    case "use-item": {
      const dog = findDogByName(modal.dogName);
      feedback(buyAndUseItem(data.item, dog));
      renderAll();
      break;
    }
    case "pick-dog":
      openPicker(data.item);
      break;
    case "pick-item-dog": {
      const dog = findDogByName(data.dog);
      const result = buyAndUseItem(data.item, dog);
      closeModal();
      openShop();
      feedback(result);
      renderAll();
      if (result.done) floatOverDog(dog, data.item === "muzzle" ? "🔒" : "🦴");
      break;
    }
    case "buy-slots":
      feedback(buyIntakeUpgrade(Number(data.index)));
      renderAll();
      break;
    case "buy-perpound":
      feedback(buyPerPoundUpgrade());
      renderAll();
      break;
    case "expand-yard":
      feedback(buyYardExpansion(data.yard));
      renderAll();
      break;
    case "hire":
      feedback(hireStaff(data.staff));
      renderAll();
      break;
    case "fire":
      feedback(fireStaff(data.staff));
      renderAll();
      break;
    case "buy-toy": {
      const result = buyToy(data.yard, data.slot);
      feedback(result);
      renderAll();
      break;
    }
    case "goto-incident": {
      const incident = game.incidents.find((item) => item.id === Number(data.incident));
      closeModal(true);
      if (!incident) break;
      showYard(YARDS.indexOf(incident.yard));
      $(".yards-main").scrollIntoView({ behavior: "smooth", block: "start" });
      const marker = document.querySelector(`.incident[data-incident="${incident.id}"]`);
      if (marker) {
        marker.classList.remove("ping");
        void marker.offsetWidth;
        marker.classList.add("ping");
      }
      break;
    }
    case "fix-incident":
      startMinigame(Number(data.incident), target);
      break;
    case "report-continue": {
      const done = modal.done;
      closeModal(true);
      if (done) done();
      break;
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (minigameOpen) endMinigame(false);
  else if (modal && !modal.locked) closeModal();
});

/* ---------- start ---------- */
initYards();
showTitle();
requestAnimationFrame(tick);
