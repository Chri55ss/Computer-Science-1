"""The title screen, the game screen, and the pop-up windows."""
import math
import random

import pygame

import actions
import game_data as gd
import widgets as w
from yard_view import YardView

WIDTH, HEIGHT = 1280, 780
SHIFT_NAMES = ["Morning", "Noon", "Night"]
SHIFT_ICONS = ["sunrise", "sun", "moon"]
TREATMENTS = ["feed", "medicate", "play", "vet", "comfort"]


class App:
    def __init__(self, assets):
        self.assets = assets
        self.ui = w.UI()
        self.running = True
        self.screen = "title"
        self.time = 0.0
        self.game = None                     # GameScreen while playing
        self.help_open = False
        self.title_bg = w.gradient((WIDTH, HEIGHT), (94, 196, 255), (217, 246, 255))
        self.parade = ["Golden Retriever", "Beagle", "Siberian Husky", "Pembroke Welsh Corgi",
                       "Dachshund", "Border Collie"]

    # ---------- one frame ----------
    def step(self, dt, events, surface):
        self.time += dt
        self.ui.begin_frame(events)
        for event in events:
            if event.type == pygame.QUIT:
                self.running = False
            if event.type == pygame.KEYDOWN and event.key == pygame.K_ESCAPE:
                if self.help_open:
                    self.help_open = False
                elif self.game:
                    self.game.escape()
        if self.screen == "title":
            self.draw_title(surface)
        else:
            self.game.update(dt)
            self.game.draw(surface)
        if self.help_open:
            self.draw_help(surface)

    def start_game(self):
        self.game = GameScreen(self)
        self.screen = "game"

    # ---------- title screen ----------
    def draw_title(self, surface):
        ui = self.ui
        ui.enabled = not self.help_open
        surface.blit(self.title_bg, (0, 0))
        t = self.time
        sun = (1040, 110 + round(math.sin(t * 1.5) * 6))
        pygame.draw.circle(surface, (255, 236, 160), sun, 70)
        pygame.draw.circle(surface, w.YELLOW, sun, 48)
        pygame.draw.circle(surface, w.INK, sun, 48, 3)
        for i, (speed, y, size) in enumerate(((22, 90, 1.0), (14, 170, 0.75), (30, 260, 0.9))):
            x = (t * speed + i * 470) % (WIDTH + 300) - 200
            self.draw_cloud(surface, x, y, size)

        ground = pygame.Rect(0, HEIGHT - 190, WIDTH, 190)
        pygame.draw.rect(surface, (90, 200, 90), ground)
        for x in range(0, WIDTH, 28):
            for y in range(ground.top, HEIGHT, 28):
                if (x // 28 + y // 28) % 2:
                    pygame.draw.rect(surface, (104, 214, 100), (x, y, 28, 28))
        pygame.draw.line(surface, w.INK, ground.topleft, ground.topright, 4)
        for i, breed in enumerate(self.parade):
            size = 88 if i % 2 else 104
            x = (t * 70 + i * 230) % (WIDTH + 240) - 160
            frame = self.assets.anim_frame("walk", t + i * 0.3, 8)
            image = self.assets.dog_frame(breed, frame, size)
            surface.blit(image, image.get_rect(midbottom=(x, ground.top + 120)))

        card = pygame.Rect(0, 0, 560, 290)
        card.center = (WIDTH // 2, 300)
        w.box(surface, card, w.PAPER, radius=16, border=4, shadow=8)
        w.text(surface, "DOG SHELTER", w.font(60, bold=True, mono=True), w.ORANGE,
               (card.centerx, card.top + 30), "midtop", outline=w.INK)
        w.text(surface, "M A N A G E R", w.font(34, bold=True, mono=True), w.PURPLE,
               (card.centerx, card.top + 104), "midtop", outline=w.INK)
        w.text(surface, "Take in dogs. Keep them happy. Keep the lights on.", w.font(18, bold=True),
               w.INK, (card.centerx, card.top + 158), "midtop")
        if ui.button(surface, (card.x + 40, card.top + 200, 150, 54), "New Game", w.GREEN, w.WHITE,
                     fnt=w.font(20, bold=True)):
            self.start_game()
        if ui.button(surface, (card.x + 205, card.top + 200, 150, 54), "How to Play", w.BLUE, w.WHITE,
                     fnt=w.font(20, bold=True)):
            self.help_open = True
        if ui.button(surface, (card.x + 370, card.top + 200, 150, 54), "Quit", w.RED, w.WHITE,
                     fnt=w.font(20, bold=True)):
            self.running = False

    def draw_cloud(self, surface, x, y, size):
        parts = [(0, 18, 140, 40), (32, -6, 66, 54)]
        for px, py, pw, ph in parts:
            rect = pygame.Rect(x + px * size, y + py * size, pw * size, ph * size)
            pygame.draw.ellipse(surface, w.WHITE, rect)
            pygame.draw.ellipse(surface, w.INK, rect, 3)
        pygame.draw.rect(surface, w.WHITE, (x + 6 * size, y + 24 * size, 128 * size, 22 * size))

    # ---------- how to play ----------
    def draw_help(self, surface):
        dim(surface)
        self.ui.enabled = True
        rect = pygame.Rect(0, 0, 660, 560)
        rect.center = (WIDTH // 2, HEIGHT // 2)
        w.box(surface, rect, w.PAPER, radius=14, border=4, shadow=8)
        w.text(surface, "How to Play", w.font(30, bold=True, mono=True), w.INK, (rect.x + 28, rect.y + 22))
        tips = [
            "Every day has three shifts: Morning, Noon and Night. Press End Shift to move on.",
            "MORNING - the Front Desk offers dogs. Every offer uses one of your daily slots, "
            "whether you Accept or Decline. Each yard only holds so many dogs.",
            "Use the arrows or yard buttons to visit the Small, Medium and Large yards.",
            "Click a dog to see its stats. You only see symptoms, so pick the treatment you think it "
            "needs: feed $5, medicate $25, play $0, vet $40, comfort $5. Right = +1 review.",
            "PLAY SESSIONS give every dog in a yard +5 happiness, once per yard per day.",
            "Dogs pay when they check out. Every dog costs $0.40 per pound per day. "
            "End two days in a row in debt and the shelter closes.",
        ]
        y = rect.y + 76
        for tip in tips:
            y = w.text_block(surface, tip, w.font(17), w.INK, (rect.x + 28, y, rect.width - 56, 120)) + 10
        if self.ui.button(surface, (rect.centerx - 80, rect.bottom - 70, 160, 48), "Got it!", w.GREEN, w.WHITE):
            self.help_open = False


def dim(surface, alpha=140):
    shade = pygame.Surface(surface.get_size(), pygame.SRCALPHA)
    shade.fill((42, 27, 61, alpha))
    surface.blit(shade, (0, 0))


class GameScreen:
    def __init__(self, app):
        self.app = app
        self.assets = app.assets
        self.ui = app.ui
        actions.new_game()
        self.yard_view = YardView((16, 140, 840, 400), self.assets, random.randrange(10 ** 9))
        self.log = [("Welcome to Day 1! Owners are waiting at the Front Desk.", "day")]
        self.offer = None
        self.desk_result = None
        self.modal = None          # {"type": "dog" | "report" | "gameover" | "menu", ...}
        self.feedback = None
        self.banner = None
        self.backgrounds = {}
        self.show_banner("Day 1", "Morning Intake", [])

    # ---------- helpers ----------
    def add_log(self, lines):
        for line in lines:
            self.log.insert(0, (line, actions.kind_of(line)))
        del self.log[60:]

    def escape(self):
        if self.banner:
            self.banner = None
        elif self.modal and self.modal["type"] in ("dog", "menu"):
            self.modal = None
        elif not self.modal:
            self.modal = {"type": "menu"}

    def show_banner(self, title, sub, lines, done=None):
        self.banner = {"title": title, "sub": sub, "lines": lines, "t": 0.0,
                       "duration": 1.6 + 1.1 * len(lines), "done": done}

    def update(self, dt):
        self.yard_view.sync()
        self.yard_view.update(dt)
        if self.banner:
            self.banner["t"] += dt
            if self.banner["t"] > self.banner["duration"]:
                self.close_banner()

    def close_banner(self):
        done = self.banner["done"]
        self.banner = None
        if done:
            done()

    # ---------- end shift ----------
    def end_shift(self):
        game = gd.game
        money_before = game["money"]
        day_before = game["day"]
        self.offer = None
        self.desk_result = None
        lines = actions.end_shift()
        self.add_log(lines)
        if game["game_over"]:
            self.modal = {"type": "report", "day": day_before, "lines": lines, "before": money_before,
                          "next": lambda: setattr(self, "modal", {"type": "gameover", "closed": True})}
        elif game["day"] != day_before:
            split = next((i for i, line in enumerate(lines) if line.startswith("Welcome to Day")), len(lines))
            night, morning = lines[:split], lines[split + 1:]
            self.modal = {"type": "report", "day": day_before, "lines": night, "before": money_before,
                          "next": lambda: self.show_banner("Day {}".format(game["day"]), "Morning Intake", morning)}
        else:
            shown = [line for line in lines if line != "No special event this shift." and not line.startswith("Starting")]
            self.show_banner(gd.SHIFTS[game["shift"]], "Day {}".format(game["day"]), shown)

    # ---------- drawing ----------
    def background(self, shift):
        if shift not in self.backgrounds:
            colors = [((255, 179, 122), (255, 243, 214)), ((110, 203, 255), (253, 243, 216)),
                      ((29, 27, 79), (107, 74, 156))][shift]
            self.backgrounds[shift] = w.gradient((WIDTH, HEIGHT), *colors)
        return self.backgrounds[shift]

    def draw(self, surface):
        ui = self.ui
        game = gd.game
        help_open = self.app.help_open
        ui.enabled = not (self.modal or self.banner or help_open)
        surface.blit(self.background(game["shift"]), (0, 0))
        self.draw_hud(surface)
        self.draw_yard_nav(surface)
        selected = self.modal["dog"] if self.modal and self.modal["type"] == "dog" else None
        dog = self.yard_view.draw(surface, ui, game["shift"], selected)
        if dog:
            self.open_dog(dog)
        hint_color = w.WHITE if game["shift"] == 2 else w.INK
        w.text(surface, "Use the arrows to visit each yard. Click a dog to see its stats and give care.  ! = needs help",
               w.font(15, bold=True), hint_color, (18, 550))
        self.draw_cards(surface)
        self.draw_desk(surface, pygame.Rect(876, 84, 388, 450))
        self.draw_play_panel(surface, pygame.Rect(876, 546, 388, 96))
        self.draw_log(surface, pygame.Rect(876, 654, 388, 112))

        if self.modal:
            dim(surface)
            ui.enabled = not (self.banner or help_open)
            getattr(self, "draw_" + self.modal["type"] + "_modal")(surface)
        if self.banner:
            self.draw_banner(surface)

    def draw_hud(self, surface):
        game = gd.game
        pygame.draw.rect(surface, w.PURPLE, (0, 0, WIDTH, 70))
        pygame.draw.line(surface, w.INK, (0, 70), (WIDTH, 70), 4)
        w.text(surface, "Dog Shelter", w.font(24, bold=True, mono=True), w.WHITE, (18, 20), outline=w.INK)
        stats = [("DAY", str(game["day"]), w.PAPER),
                 ("SHIFT", SHIFT_NAMES[game["shift"]], w.PAPER),
                 ("MONEY", "${:,.2f}".format(game["money"]) if game["money"] >= 0
                  else "-${:,.2f}".format(-game["money"]), w.GREEN_BG),
                 ("REVIEWS", "{:+d}".format(game["reviews"]) if game["reviews"] else "0", w.YELLOW_BG),
                 ("PAY RATE", "${:.2f}/lb".format(actions.pay_per_pound()), w.PAPER)]
        x = 200
        for label, value, fill in stats:
            value_font = w.font(19, bold=True, mono=True)
            width = max(84, value_font.size(value)[0] + 22)
            rect = pygame.Rect(x, 10, width, 50)
            w.box(surface, rect, fill, radius=8, shadow=3)
            w.text(surface, label, w.font(11, bold=True), (110, 100, 125), (rect.x + 10, rect.y + 6))
            bad = (label == "MONEY" and game["money"] < 0) or (label == "REVIEWS" and game["reviews"] < 0)
            w.text(surface, value, value_font, w.RED if bad else w.INK, (rect.x + 10, rect.y + 22))
            x += width + 10
        labels = ["End Morning >", "End Noon >", "End Day >"]
        if self.ui.button(surface, (1036, 12, 168, 46), labels[game["shift"]], w.ORANGE, w.WHITE,
                          fnt=w.font(18, bold=True)):
            self.end_shift()
        if self.ui.button(surface, (1214, 12, 50, 46), "=", w.PAPER, w.INK, fnt=w.font(24, bold=True)):
            self.modal = {"type": "menu"}

    def draw_yard_nav(self, surface):
        ui = self.ui
        if ui.button(surface, (16, 84, 56, 44), "<", w.BLUE, w.WHITE, fnt=w.font(24, bold=True)):
            self.yard_view.show(self.yard_view.index - 1)
        if ui.button(surface, (800, 84, 56, 44), ">", w.BLUE, w.WHITE, fnt=w.font(24, bold=True)):
            self.yard_view.show(self.yard_view.index + 1)
        for i, yard in enumerate(gd.yards):
            rect = pygame.Rect(82 + i * 242, 84, 232, 44)
            active = i == self.yard_view.index
            unwell = sum(1 for dog in yard.dogs if dog.status != "healthy")
            label = "{}  {}/{}".format(yard.name.replace(" Dog Yard", " yard"), len(yard.dogs), yard.capacity)
            if ui.button(surface, rect, label, w.YELLOW if active else w.PAPER, w.INK):
                self.yard_view.show(i)
            if unwell:
                badge = pygame.Rect(rect.right - 30, rect.y - 10, 32, 22)
                pygame.draw.rect(surface, w.RED, badge, border_radius=11)
                pygame.draw.rect(surface, w.INK, badge, 2, border_radius=11)
                w.text(surface, "{}!".format(unwell), w.font(14, bold=True), w.WHITE, badge.center, "center")

    def draw_cards(self, surface):
        yard = gd.yards[self.yard_view.index]
        heading = "Dogs in the {} ({}/{})".format(yard.name, len(yard.dogs), yard.capacity)
        color = w.WHITE if gd.game["shift"] == 2 else w.INK
        w.text(surface, heading, w.font(20, bold=True, mono=True), color, (18, 576))
        if not yard.dogs:
            rect = pygame.Rect(16, 606, 840, 150)
            w.box(surface, rect, w.PAPER, radius=12, shadow=0)
            sizes = ["under 20 lbs", "20 to 49 lbs", "50 lbs and up"][self.yard_view.index]
            w.text_block(surface, "No dogs in this yard. Dogs {} stay here (room for {}). Take dogs in at the "
                         "Front Desk during Morning Intake.".format(sizes, yard.capacity),
                         w.font(17, bold=True), w.INK, rect.inflate(-40, -50))
            return
        for i, dog in enumerate(yard.dogs[:4]):
            rect = pygame.Rect(16 + i * 213, 606, 201, 160)
            if self.draw_card(surface, rect, dog):
                self.open_dog(dog)

    def draw_card(self, surface, rect, dog):
        unwell = dog.status != "healthy"
        hover = self.ui.hovering(rect)
        w.box(surface, rect.move(0, -3 if hover else 0), w.RED_BG if unwell else w.PAPER, radius=12)
        r = rect.move(0, -3 if hover else 0)
        portrait = pygame.Rect(r.x + 10, r.y + 10, 58, 50)
        pygame.draw.rect(surface, w.SKY_DAY[1], portrait, border_radius=6)
        pygame.draw.rect(surface, (142, 230, 123), (portrait.x, portrait.y + 30, portrait.width, 20),
                         border_bottom_left_radius=6, border_bottom_right_radius=6)
        pygame.draw.rect(surface, w.INK, portrait, 2, border_radius=6)
        frame = self.assets.anim_frame("lie" if unwell else "idle", self.app.time, 2.2)
        image = self.assets.dog_frame(dog.breed, frame, 50, False, dog.muzzled)
        surface.blit(image, image.get_rect(midbottom=(portrait.centerx, portrait.bottom + 2)))
        w.text(surface, dog.name, w.font(17, bold=True, mono=True), w.INK, (r.x + 76, r.y + 10))
        breed = dog.breed if len(dog.breed) <= 18 else dog.breed[:16] + "..."
        w.text(surface, breed, w.font(13), w.INK, (r.x + 76, r.y + 32))
        w.text(surface, "{} lbs  {} day{} left".format(dog.weight, dog.stay_days, "" if dog.stay_days == 1 else "s"),
               w.font(13, bold=True), w.INK, (r.x + 10, r.y + 66))
        condition = "Healthy" if not unwell else "{} {}".format(dog.name, dog.describe_condition())
        w.text_block(surface, condition, w.font(13, bold=True), (190, 40, 60) if unwell else (30, 130, 70),
                     (r.x + 10, r.y + 86, r.width - 20, 34))
        w.text(surface, "Happiness {}".format(dog.happiness), w.font(12, bold=True), w.INK, (r.x + 10, r.y + 122))
        w.happiness_bar(surface, (r.x + 10, r.y + 138, r.width - 20, 12), dog.happiness)
        return self.ui.clicked(rect)

    # ---------- right side ----------
    def draw_desk(self, surface, rect):
        ui = self.ui
        game = gd.game
        w.box(surface, rect, w.PAPER, radius=12)
        w.text(surface, "Front Desk", w.font(21, bold=True, mono=True), w.INK, (rect.x + 14, rect.y + 12))
        reason = actions.intake_blocked_reason()
        sign = pygame.Rect(rect.right - 92, rect.y + 12, 78, 26)
        pygame.draw.rect(surface, w.GREEN if reason != "closed" else w.RED, sign, border_radius=6)
        pygame.draw.rect(surface, w.INK, sign, 2, border_radius=6)
        w.text(surface, "OPEN" if reason != "closed" else "CLOSED", w.font(15, bold=True, mono=True), w.WHITE,
               sign.center, "center")

        y = rect.y + 48
        w.text(surface, "Offers today", w.font(14, bold=True), w.INK, (rect.x + 14, y))
        for i in range(game["daily_intake_limit"]):
            pip = pygame.Rect(rect.x + 112 + i * 18, y + 1, 14, 14)
            pygame.draw.rect(surface, (207, 198, 218) if i < game["intakes_today"] else w.GREEN, pip)
            pygame.draw.rect(surface, w.INK, pip, 2)
        y += 26

        if self.desk_result:
            kind = "good" if self.desk_result["accepted"] else "info"
            lines = self.desk_result["lines"]
            box = pygame.Rect(rect.x + 12, y, rect.width - 24, 54)
            pygame.draw.rect(surface, w.KIND_BG[kind], box, border_radius=8)
            pygame.draw.rect(surface, w.INK, box, 2, border_radius=8)
            w.text_block(surface, " ".join(lines[:2]), w.font(13, bold=True), w.INK, box.inflate(-14, -10))
            y += 62

        inner = pygame.Rect(rect.x + 12, y, rect.width - 24, rect.bottom - y - 12)
        if reason == "closed":
            self.desk_message(surface, inner, "Intake is closed",
                              "Owners only drop dogs off during Morning Intake. Check on your dogs in the yards!")
        elif reason == "full":
            self.desk_message(surface, inner, "All {} offers used today".format(game["daily_intake_limit"]),
                              "Come back tomorrow morning, or end the shift.")
        elif reason == "empty":
            self.desk_message(surface, inner, "No dogs are waiting", "More dogs come back after checkout.")
        else:
            if self.offer is None:
                self.offer = actions.Offer()
            self.draw_offer(surface, inner)

    def desk_message(self, surface, rect, title, body):
        w.text(surface, title, w.font(19, bold=True, mono=True), w.INK, (rect.centerx, rect.y + 40), "midtop")
        w.text_block(surface, body, w.font(16), w.INK, (rect.x + 20, rect.y + 76, rect.width - 40, 100))

    def draw_offer(self, surface, rect):
        ui = self.ui
        offer = self.offer
        dog = offer.dog
        card = pygame.Rect(rect.x, rect.y, rect.width, min(rect.height, 330))
        w.box(surface, card, w.WHITE, radius=10, shadow=0)
        ribbon = pygame.Rect(card.x, card.y, card.width, 28)
        pygame.draw.rect(surface, w.ORANGE, ribbon, border_top_left_radius=10, border_top_right_radius=10)
        pygame.draw.rect(surface, w.INK, card, 3, border_radius=10)
        w.text(surface, "New intake offer", w.font(15, bold=True), w.WHITE, (card.x + 12, card.y + 5))

        portrait = pygame.Rect(card.x + 12, card.y + 38, 92, 80)
        pygame.draw.rect(surface, w.SKY_DAY[1], portrait, border_radius=8)
        pygame.draw.rect(surface, (142, 230, 123), (portrait.x, portrait.y + 48, portrait.width, 32),
                         border_bottom_left_radius=8, border_bottom_right_radius=8)
        pygame.draw.rect(surface, w.INK, portrait, 3, border_radius=8)
        frame = self.assets.anim_frame("idle", self.app.time, 2.2)
        image = self.assets.dog_frame(dog.breed, frame, 84)
        surface.blit(image, image.get_rect(midbottom=(portrait.centerx, portrait.bottom + 4)))
        w.text(surface, dog.name, w.font(22, bold=True, mono=True), w.INK, (card.x + 116, card.y + 38))
        w.text(surface, dog.breed, w.font(14), w.INK, (card.x + 116, card.y + 66))
        w.text(surface, "{} yrs  {} lbs  {}".format(dog.age, dog.weight, "High energy" if dog.energy == "high" else "Calm"),
               w.font(14, bold=True), w.INK, (card.x + 116, card.y + 90))

        yard = offer.yard
        cap = pygame.Rect(card.x + 12, card.y + 126, card.width - 24, 26)
        pygame.draw.rect(surface, w.GREEN_BG if yard.has_room() else w.RED_BG, cap, border_radius=6)
        pygame.draw.rect(surface, w.INK, cap, 2, border_radius=6)
        w.text(surface, "{}: {}/{}{}".format(yard.name, len(yard.dogs), yard.capacity,
                                             "" if yard.has_room() else "  FULL"),
               w.font(14, bold=True), w.INK, (cap.x + 10, cap.y + 4))

        cells = [("Stay", "{} day{}".format(dog.stay_days, "s" if dog.stay_days > 1 else "")),
                 ("Pay rate", "${:.2f}/lb/day".format(offer.rate)),
                 ("Upkeep", "${:.2f}/day".format(dog.weight * gd.UPKEEP_PER_POUND)),
                 ("Payment at checkout", "${:.2f}".format(dog.care_payment))]
        for i, (label, value) in enumerate(cells):
            if i < 3:
                cell = pygame.Rect(card.x + 12 + i * 116, card.y + 160, 108, 46)
                fill = w.LILAC_BG
            else:
                cell = pygame.Rect(card.x + 12, card.y + 212, card.width - 24, 46)
                fill = w.YELLOW_BG
            pygame.draw.rect(surface, fill, cell, border_radius=6)
            pygame.draw.rect(surface, w.INK, cell, 2, border_radius=6)
            w.text(surface, label, w.font(12, bold=True), (110, 100, 125), (cell.x + 8, cell.y + 4))
            w.text(surface, value, w.font(19 if i == 3 else 14, bold=True, mono=True), w.INK, (cell.x + 8, cell.y + 20))

        buttons_y = card.y + 268
        if ui.button(surface, (card.x + 12, buttons_y, 162, 48), "Accept", w.GREEN, w.WHITE,
                     enabled=yard.has_room(), fnt=w.font(20, bold=True)):
            self.answer(True)
        if ui.button(surface, (card.right - 174, buttons_y, 162, 48), "Decline", w.RED, w.WHITE,
                     fnt=w.font(20, bold=True)):
            self.answer(False)

    def answer(self, accept):
        result = actions.answer_offer(self.offer, accept)
        self.add_log(result["lines"])
        self.desk_result = result
        if result["accepted"]:
            self.yard_view.show(gd.yards.index(self.offer.yard))
        self.offer = None

    def draw_play_panel(self, surface, rect):
        w.box(surface, rect, w.PAPER, radius=12)
        w.text(surface, "Play sessions  (+{} happiness, once a day)".format(gd.PLAY_SESSION_HAPPINESS),
               w.font(14, bold=True), w.INK, (rect.x + 14, rect.y + 10))
        for i, yard in enumerate(gd.yards):
            button = pygame.Rect(rect.x + 12 + i * 124, rect.y + 36, 116, 46)
            name = yard.name.split()[0]
            sub = "done" if yard.played_today else "{} dog{}".format(len(yard.dogs), "" if len(yard.dogs) == 1 else "s")
            enabled = not yard.played_today and bool(yard.dogs)
            if self.ui.button(surface, button, name, w.GREEN_BG if yard.played_today else w.WHITE, w.INK,
                              enabled=enabled, sub=sub, fnt=w.font(15, bold=True)):
                self.add_log([actions.play_session(yard)])
                self.yard_view.show(i)

    def draw_log(self, surface, rect):
        w.box(surface, rect, w.PAPER, radius=12)
        w.text(surface, "Shelter Log", w.font(16, bold=True, mono=True), w.INK, (rect.x + 14, rect.y + 8))
        old_clip = surface.get_clip()
        area = pygame.Rect(rect.x + 10, rect.y + 32, rect.width - 20, rect.height - 40)
        surface.set_clip(area)
        y = area.y
        small = w.font(13)
        for line, kind in self.log:
            lines = w.wrap(line, small, area.width - 14)
            height = len(lines) * (small.get_height() + 1) + 4
            pygame.draw.rect(surface, w.KIND_COLORS[kind], (area.x, y, 4, height - 2))
            for i, part in enumerate(lines):
                w.text(surface, part, small, w.INK, (area.x + 10, y + 1 + i * (small.get_height() + 1)))
            y += height + 2
            if y > area.bottom:
                break
        surface.set_clip(old_clip)

    # ---------- windows ----------
    def open_dog(self, dog):
        self.feedback = None
        self.modal = {"type": "dog", "dog": dog}

    def window(self, surface, width, height, close=True):
        rect = pygame.Rect(0, 0, width, height)
        rect.center = (WIDTH // 2, HEIGHT // 2)
        w.box(surface, rect, w.PAPER, radius=14, border=4, shadow=8)
        if close and self.ui.button(surface, (rect.right - 54, rect.y + 14, 40, 40), "X", w.RED, w.WHITE):
            self.modal = None
        return rect

    def draw_dog_modal(self, surface):
        dog = self.modal["dog"]
        if dog not in gd.all_dogs():
            self.modal = None
            return
        rect = self.window(surface, 780, 560)
        unwell = dog.status != "healthy"
        portrait = pygame.Rect(rect.x + 26, rect.y + 26, 220, 190)
        pygame.draw.rect(surface, w.RED_BG if unwell else w.SKY_DAY[1], portrait, border_radius=10)
        pygame.draw.rect(surface, (142, 230, 123), (portrait.x, portrait.y + 120, portrait.width, 70),
                         border_bottom_left_radius=10, border_bottom_right_radius=10)
        pygame.draw.rect(surface, w.INK, portrait, 3, border_radius=10)
        frame = self.assets.anim_frame("lie" if unwell else "idle", self.app.time, 2.2)
        image = self.assets.dog_frame(dog.breed, frame, 176, False, dog.muzzled)
        surface.blit(image, image.get_rect(midbottom=(portrait.centerx, portrait.bottom + 6)))

        x = rect.x + 270
        w.text(surface, dog.name, w.font(30, bold=True, mono=True), w.INK, (x, rect.y + 24))
        w.text(surface, "{}  -  {} years old".format(dog.breed, dog.age), w.font(16), w.INK, (x, rect.y + 62))
        facts = [("WEIGHT", "{} lbs".format(dog.weight)),
                 ("ENERGY", ("High" if dog.energy == "high" else "Calm") + (" (trained)" if dog.trained else "")),
                 ("YARD", dog.yard.replace(" Dog Yard", "")),
                 ("DAYS LEFT", str(dog.stay_days)),
                 ("BASE PAY", "${:.2f}".format(dog.care_payment)),
                 ("PAY IF LEAVING NOW", "${:.2f}".format(actions.checkout_payment(dog)))]
        for i, (label, value) in enumerate(facts):
            cell = pygame.Rect(x + (i % 3) * 160, rect.y + 92 + (i // 3) * 52, 152, 44)
            pygame.draw.rect(surface, w.WHITE, cell, border_radius=6)
            pygame.draw.rect(surface, w.INK, cell, 2, border_radius=6)
            w.text(surface, label, w.font(11, bold=True), (110, 100, 125), (cell.x + 8, cell.y + 4))
            w.text(surface, value, w.font(16, bold=True), w.INK, (cell.x + 8, cell.y + 20))
        cond = pygame.Rect(x, rect.y + 200, rect.right - x - 26, 40)
        pygame.draw.rect(surface, w.RED_BG if unwell else w.GREEN_BG, cond, border_radius=8)
        pygame.draw.rect(surface, w.INK, cond, 2, border_radius=8)
        condition = "{} {}".format(dog.name, dog.describe_condition()) if unwell else "Healthy"
        w.text_block(surface, condition, w.font(16, bold=True), w.INK, cond.inflate(-20, -12))

        w.text(surface, "Happiness {}".format(dog.happiness), w.font(14, bold=True), w.INK, (rect.x + 26, rect.y + 232))
        w.happiness_bar(surface, (rect.x + 26, rect.y + 254, rect.width - 52, 18), dog.happiness)

        w.text(surface, "Treatments", w.font(20, bold=True, mono=True), w.INK, (rect.x + 26, rect.y + 290))
        for i, action in enumerate(TREATMENTS):
            cost = actions.TREATMENT_COSTS[action]
            button = pygame.Rect(rect.x + 26 + i * 148, rect.y + 324, 136, 70)
            enabled = unwell and gd.game["money"] >= cost
            if self.ui.button(surface, button, action.capitalize(), w.WHITE, w.INK, enabled=enabled,
                              sub="${}".format(cost), fnt=w.font(19, bold=True)):
                result = actions.treat(dog, action)
                self.feedback = result
                self.add_log([result["text"]])

        box = pygame.Rect(rect.x + 26, rect.y + 414, rect.width - 52, 52)
        if self.feedback:
            kind = "good" if self.feedback.get("correct") else "bad" if self.feedback.get("done") else "info"
            message = self.feedback["text"]
        else:
            kind = "info"
            message = ("Read the symptom and pick the treatment you think it needs." if unwell
                       else "{} is healthy - no treatment needed.".format(dog.name))
        pygame.draw.rect(surface, w.KIND_BG[kind], box, border_radius=8)
        pygame.draw.rect(surface, w.INK, box, 2, border_radius=8)
        w.text_block(surface, message, w.font(16, bold=True), w.INK, box.inflate(-24, -16))
        w.text(surface, "Play sessions for {}'s yard are on the right side of the screen.".format(dog.name),
               w.font(14), (90, 80, 105), (rect.x + 26, rect.bottom - 40))

    def draw_report_modal(self, surface):
        modal = self.modal
        rect = self.window(surface, 680, 620, close=False)
        w.text(surface, "End of Day {}".format(modal["day"]), w.font(28, bold=True, mono=True), w.INK,
               (rect.x + 28, rect.y + 22))
        y = rect.y + 70
        small = w.font(15, bold=True)
        for line in modal["lines"]:
            if line == "No special event this shift.":
                continue
            kind = actions.kind_of(line)
            parts = w.wrap(line, small, rect.width - 80)
            height = len(parts) * (small.get_height() + 2) + 12
            if y + height > rect.bottom - 150:
                w.text(surface, "...and more in the Shelter Log", small, w.INK, (rect.x + 32, y))
                break
            row = pygame.Rect(rect.x + 28, y, rect.width - 56, height)
            pygame.draw.rect(surface, w.KIND_BG[kind], row, border_radius=8)
            pygame.draw.rect(surface, w.INK, row, 2, border_radius=8)
            for i, part in enumerate(parts):
                w.text(surface, part, small, w.INK, (row.x + 12, row.y + 6 + i * (small.get_height() + 2)))
            y += height + 6
        money = gd.game["money"]
        change = money - modal["before"]
        bar = pygame.Rect(rect.x + 28, rect.bottom - 140, rect.width - 56, 50)
        pygame.draw.rect(surface, w.YELLOW_BG, bar, border_radius=10)
        pygame.draw.rect(surface, w.INK, bar, 3, border_radius=10)
        w.text(surface, "Money  ${:,.2f}  ->  ${:,.2f}".format(modal["before"], money),
               w.font(18, bold=True, mono=True), w.INK, (bar.x + 14, bar.y + 13))
        w.text(surface, "{}${:,.2f}".format("+" if change >= 0 else "-", abs(change)),
               w.font(18, bold=True, mono=True), (30, 140, 70) if change >= 0 else w.RED, (bar.right - 14, bar.y + 13), "topright")
        label = "See final results" if gd.game["game_over"] else "Start Day {}".format(gd.game["day"])
        if self.ui.button(surface, (rect.centerx - 130, rect.bottom - 74, 260, 54), label,
                          w.RED if gd.game["game_over"] else w.GREEN, w.WHITE, fnt=w.font(20, bold=True)):
            next_step = modal["next"]
            self.modal = None
            next_step()

    def draw_gameover_modal(self, surface):
        rect = self.window(surface, 520, 520, close=False)
        closed = self.modal.get("closed")
        game = gd.game
        w.text(surface, "The shelter had to close" if closed else "You retired!", w.font(26, bold=True, mono=True),
               w.INK, (rect.centerx, rect.y + 30), "midtop")
        w.text(surface, "Two days in a row in debt." if closed else "Here's how your shelter did.",
               w.font(16), w.INK, (rect.centerx, rect.y + 72), "midtop")
        stats = [("Days completed", actions.days_completed()),
                 ("Money", "${:,.2f}".format(game["money"])),
                 ("Total dogs processed", game["total_dogs"]),
                 ("Dogs in shelter", len(gd.all_dogs())),
                 ("Shelter reviews", game["reviews"])]
        for i, (label, value) in enumerate(stats):
            row = pygame.Rect(rect.x + 40, rect.y + 110 + i * 48, rect.width - 80, 40)
            pygame.draw.rect(surface, w.WHITE, row, border_radius=8)
            pygame.draw.rect(surface, w.INK, row, 2, border_radius=8)
            w.text(surface, label, w.font(16, bold=True), w.INK, (row.x + 14, row.y + 10))
            w.text(surface, str(value), w.font(17, bold=True, mono=True), w.INK, (row.right - 14, row.y + 10), "topright")
        if self.ui.button(surface, (rect.x + 40, rect.bottom - 88, 200, 54), "Play Again", w.GREEN, w.WHITE,
                          fnt=w.font(20, bold=True)):
            self.app.start_game()
        if self.ui.button(surface, (rect.right - 240, rect.bottom - 88, 200, 54), "Main Menu", w.BLUE, w.WHITE,
                          fnt=w.font(20, bold=True)):
            self.app.screen = "title"
            self.app.game = None

    def draw_menu_modal(self, surface):
        rect = self.window(surface, 420, 400, close=False)
        w.text(surface, "Paused", w.font(28, bold=True, mono=True), w.INK, (rect.centerx, rect.y + 26), "midtop")
        options = [("Resume", w.GREEN), ("How to Play", w.BLUE), ("Retire & see results", w.ORANGE), ("Quit game", w.RED)]
        for i, (label, color) in enumerate(options):
            if self.ui.button(surface, (rect.x + 60, rect.y + 86 + i * 70, rect.width - 120, 54), label, color, w.WHITE,
                              fnt=w.font(20, bold=True)):
                if i == 0:
                    self.modal = None
                elif i == 1:
                    self.app.help_open = True
                elif i == 2:
                    self.modal = {"type": "gameover", "closed": False}
                else:
                    self.app.running = False

    def draw_banner(self, surface):
        banner = self.banner
        t = banner["t"]
        fade_in = min(1.0, t / 0.35)
        fade_out = min(1.0, max(0.0, (banner["duration"] - t) / 0.35))
        alpha = min(fade_in, fade_out)
        colors = [((255, 138, 92), (255, 207, 92)), ((58, 134, 255), (122, 211, 255)),
                  ((29, 27, 79), (118, 56, 201))][gd.game["shift"]]
        key = "banner{}".format(gd.game["shift"])
        if key not in self.backgrounds:
            self.backgrounds[key] = w.gradient((WIDTH, HEIGHT), *colors).convert()
        layer = self.backgrounds[key]
        layer.set_alpha(round(235 * alpha))
        surface.blit(layer, (0, 0))
        if alpha < 0.05:
            return
        lift = round((1 - fade_in) * 40)
        title = w.font(70, bold=True, mono=True)
        w.text(surface, banner["title"], title, w.WHITE, (WIDTH // 2, 210 + lift), "midtop", outline=w.INK)
        w.text(surface, banner["sub"], w.font(28, bold=True), w.WHITE, (WIDTH // 2, 300 + lift), "midtop", outline=w.INK)
        y = 370 + lift
        for line in banner["lines"][:5]:
            kind = actions.kind_of(line)
            small = w.font(17, bold=True)
            width = min(760, small.size(line)[0] + 36)
            row = pygame.Rect(0, y, width, 40)
            row.centerx = WIDTH // 2
            pygame.draw.rect(surface, w.KIND_BG[kind], row, border_radius=10)
            pygame.draw.rect(surface, w.INK, row, 3, border_radius=10)
            w.text(surface, line if small.size(line)[0] < 740 else line[:80] + "...", small, w.INK, row.center, "center")
            y += 50
        w.text(surface, "click to continue", w.font(15, bold=True), w.WHITE, (WIDTH // 2, y + 20), "midtop")
        if self.ui.any_click() and t > 0.3:
            self.close_banner()
