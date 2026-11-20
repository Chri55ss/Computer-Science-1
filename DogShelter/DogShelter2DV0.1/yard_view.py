"""Draws the three yards and the dogs walking around in them."""
import math
import random

import pygame

import game_data as gd
import widgets as w

TILE = 32 * 3            # grass and fence tiles are drawn 3x bigger
SKY_H = 44
YARD_SIZE_NAMES = ["small", "medium", "large"]


def sprite_size(weight):
    """Bigger dogs get bigger sprites."""
    if weight < 20:
        return 61
    if weight < 50:
        return 77
    if weight < 100:
        return 93
    return 109


class Walker:
    """A dog wandering around its yard."""

    def __init__(self, dog, x, y, bounds):
        self.dog = dog
        self.x, self.y = x, y
        self.bounds = bounds
        self.tx, self.ty = x + random.uniform(-60, 60), bounds.top + random.uniform(40, 140)
        self.pause = 0.0
        self.facing = 1
        self.anim = "walk"
        self.step = 0
        self.frame_time = 0.0
        self.alpha = 255

    def pick_target(self):
        self.tx = random.uniform(self.bounds.left + 40, self.bounds.right - 40)
        self.ty = random.uniform(self.bounds.top, self.bounds.bottom)

    def speed(self):
        speed = 95 if self.dog.energy == "high" else 55
        return speed * (0.4 if self.dog.status != "healthy" else 1)

    def update(self, dt):
        unwell = self.dog.status != "healthy"
        self.frame_time += dt
        if self.pause > 0:
            self.pause -= dt
            self.anim = "lie" if unwell else "idle"
            if self.frame_time > 0.45:
                self.frame_time = 0
                self.step += 1
            if self.pause <= 0:
                self.pick_target()
            return
        self.anim = "walk"
        dx, dy = self.tx - self.x, self.ty - self.y
        distance = math.hypot(dx, dy)
        step = self.speed() * dt
        if distance <= step:
            self.x, self.y = self.tx, self.ty
            self.pause = random.uniform(0.6, 3.0) * (2.5 if unwell else 1)
            return
        self.x += dx / distance * step
        self.y += dy / distance * step
        if abs(dx) > 1:
            self.facing = 1 if dx > 0 else -1
        if self.frame_time > (0.11 if self.dog.energy == "high" else 0.16):
            self.frame_time = 0
            self.step += 1


class YardView:
    def __init__(self, rect, assets, seed):
        self.rect = pygame.Rect(rect)
        self.assets = assets
        self.index = 0
        self.scroll = 0.0                     # which yard we're looking at (slides)
        self.walkers = {}                     # Dog -> Walker
        self.time = 0.0
        width, height = self.rect.size
        self.bounds = pygame.Rect(30, SKY_H + TILE + 22, width - 60, height - (SKY_H + TILE + 22) - 10)
        count = math.ceil(width / TILE) + 1
        self.fence_left = (width - count * TILE) // 2
        self.gate_index = count // 2
        self.gate_x = self.fence_left + self.gate_index * TILE + TILE // 2
        self.backgrounds = [self.build_background(i, seed + i * 7919, count) for i in range(3)]
        self.plants = [self.place_plants(seed + i * 101) for i in range(3)]
        self.sky = {}
        self.tints = {}
        self.gate_open_until = [0.0, 0.0, 0.0]

    # ---------- the fixed picture of each yard ----------
    def build_background(self, index, seed, count):
        rand = random.Random(seed)
        width, height = self.rect.size
        surface = pygame.Surface((width, height), pygame.SRCALPHA)
        tiles = [pygame.transform.scale(t, (TILE, TILE)) for t in self.assets.grass[YARD_SIZE_NAMES[index]]]
        for y in range(0, height, TILE):
            for x in range(0, width, TILE):
                roll = rand.random()
                surface.blit(tiles[3] if roll < 0.12 else tiles[int(roll * 3) % 3], (x, y))
        path = pygame.transform.scale(self.assets.dirt_path, (TILE, TILE))
        for y in range(SKY_H + TILE - TILE // 3, height, TILE):
            surface.blit(path, (self.gate_x - TILE // 2, y))
        surface.fill((0, 0, 0, 0), pygame.Rect(0, 0, width, SKY_H + TILE // 2))   # sky goes here
        fence = {name: pygame.transform.scale(image, (image.get_width() * 3, TILE))
                 for name, image in self.assets.fence.items()}
        for i in range(count):
            x = self.fence_left + i * TILE
            if i == 0:
                image = fence["end_left"]
            elif i == count - 1:
                image = fence["end_right"]
            elif i == self.gate_index:
                continue                       # the gate is drawn every frame (it opens)
            elif i % 2 == 1:
                image = fence["section_heart"] if rand.random() < 0.2 else fence["section"]
            else:
                image = fence["post"]
            surface.blit(image, (x, SKY_H))
        self.gate_frames = [fence["gate"].subsurface(pygame.Rect(0, 0, TILE, TILE)),
                            fence["gate"].subsurface(pygame.Rect(TILE, 0, TILE, TILE))]
        return surface

    def place_plants(self, seed):
        rand = random.Random(seed)
        plants = []
        for i in range(8):
            art = rand.choice(self.assets.plants)
            x = rand.uniform(30, self.rect.width - 30)
            if abs(x - self.gate_x) < 70:
                x += 140
            y = SKY_H + TILE + 8 if i < 3 else rand.uniform(self.bounds.top + 40, self.bounds.bottom)
            frames = [pygame.transform.scale_by(f, 2.6) for f in art["frames"]]
            plants.append({"x": x, "y": y, "frames": frames, "fps": art["fps"], "phase": rand.random() * 3})
        return plants

    def sky_surface(self, shift):
        if shift not in self.sky:
            top, bottom = (w.SKY_MORNING, w.SKY_DAY, w.SKY_NIGHT)[shift]
            self.sky[shift] = w.gradient((self.rect.width, SKY_H + TILE // 2), top, bottom)
        return self.sky[shift]

    def tint_surface(self, shift):
        if shift not in self.tints:
            tint = pygame.Surface(self.rect.size, pygame.SRCALPHA)
            if shift == 0:
                tint.fill((255, 140, 60, 26))
            elif shift == 2:
                tint.fill((18, 16, 70, 120))
                # two soft pools of lamp light: less dark toward the middle
                for cx in (0.25, 0.75):
                    center = (int(self.rect.width * cx), int(self.rect.height * 0.62))
                    for r in range(180, 0, -6):
                        alpha = round(120 - 75 * (1 - r / 180) ** 0.7)
                        pygame.draw.circle(tint, (24, 20, 70, alpha), center, r)
            self.tints[shift] = tint
        return self.tints[shift]

    # ---------- keeping walkers in step with the yards ----------
    def sync(self):
        living = set()
        for index, yard in enumerate(gd.yards):
            for dog in yard.dogs:
                living.add(dog)
                if dog not in self.walkers:
                    # new dog: walk in through the gate
                    self.walkers[dog] = Walker(dog, self.gate_x, self.bounds.top - 6, self.bounds)
                    self.gate_open_until[index] = self.time + 1.6
        for dog in list(self.walkers):
            if dog not in living:
                del self.walkers[dog]

    def show(self, index):
        self.index = index % 3

    def update(self, dt):
        self.time += dt
        self.scroll += (self.index - self.scroll) * min(1.0, dt * 7)
        if abs(self.index - self.scroll) < 0.001:
            self.scroll = float(self.index)
        for walker in self.walkers.values():
            walker.update(dt)

    # ---------- drawing ----------
    def draw(self, surface, ui, shift, selected=None):
        """Draw the yards. Returns the dog that was clicked, if any."""
        old_clip = surface.get_clip()
        surface.set_clip(self.rect)
        width = self.rect.width
        clicked = None
        hit_boxes = []
        for index, yard in enumerate(gd.yards):
            ox = self.rect.x + round((index - self.scroll) * width)
            if ox >= self.rect.right or ox + width <= self.rect.x:
                continue
            oy = self.rect.y
            surface.blit(self.sky_surface(shift), (ox, oy))
            surface.blit(self.backgrounds[index], (ox, oy))
            gate = self.gate_frames[1 if self.time < self.gate_open_until[index] else 0]
            surface.blit(gate, (ox + self.gate_x - TILE // 2, oy + SKY_H))

            # plants and dogs, drawn from back to front
            things = [("plant", p["y"], p) for p in self.plants[index]]
            things += [("dog", wk.y, wk) for dog, wk in self.walkers.items() if dog in yard.dogs]
            things.sort(key=lambda thing: thing[1])
            for kind, _, thing in things:
                if kind == "plant":
                    frame = thing["frames"][int((self.time + thing["phase"]) * thing["fps"]) % len(thing["frames"])]
                    surface.blit(frame, frame.get_rect(midbottom=(ox + thing["x"], oy + thing["y"])))
                else:
                    box = self.draw_dog(surface, thing, ox, oy, selected)
                    if index == self.index:
                        hit_boxes.append((thing.y, box, thing.dog))

            # sign with the yard's name and how full it is
            sign = "{}  {}/{}".format(yard.name, len(yard.dogs), yard.capacity)
            label = w.font(17, bold=True, mono=True)
            sign_rect = pygame.Rect(0, 0, label.size(sign)[0] + 24, 30)
            sign_rect.midtop = (ox + width // 2, oy + 6)
            w.box(surface, sign_rect, w.YELLOW_BG if yard.has_room() else w.RED_BG, radius=6, shadow=3)
            w.text(surface, sign, label, w.INK, sign_rect.center, "center")
            if not yard.dogs:
                msg = "No {} dogs yet".format(YARD_SIZE_NAMES[index])
                m = w.font(18, bold=True)
                r = pygame.Rect(0, 0, m.size(msg)[0] + 28, 36)
                r.center = (ox + width // 2, oy + self.rect.height * 0.62)
                w.box(surface, r, w.PAPER, radius=8, shadow=0)
                w.text(surface, msg, m, w.INK, r.center, "center")

        surface.blit(self.tint_surface(shift), self.rect.topleft)
        surface.set_clip(old_clip)
        pygame.draw.rect(surface, w.INK, self.rect.inflate(6, 6), 4, border_radius=12)

        # click: the dog in front wins
        for _, box, dog in sorted(hit_boxes, key=lambda item: -item[0]):
            if ui.clicked(box):
                clicked = dog
                break
        return clicked

    def draw_dog(self, surface, walker, ox, oy, selected):
        dog = walker.dog
        size = sprite_size(dog.weight)
        frames = self.assets.animations[walker.anim]
        frame = frames[walker.step % len(frames)]
        image = self.assets.dog_frame(dog.breed, frame, size, walker.facing < 0, dog.muzzled)
        feet = (ox + round(walker.x), oy + round(walker.y))
        rect = image.get_rect(midbottom=(feet[0], feet[1] + round(size * 0.06)))
        shadow = pygame.Rect(0, 0, size * 0.6, 9)
        shadow.center = (feet[0], feet[1] - 2)
        shade = pygame.Surface(shadow.size, pygame.SRCALPHA)
        pygame.draw.ellipse(shade, (42, 27, 61, 60), shade.get_rect())
        surface.blit(shade, shadow)
        if dog is selected:
            outline = pygame.mask.from_surface(image).to_surface(setcolor=(255, 255, 255, 255), unsetcolor=(0, 0, 0, 0))
            for dx, dy in ((3, 0), (-3, 0), (0, 3), (0, -3)):
                surface.blit(outline, rect.move(dx, dy))
        surface.blit(image, rect)

        tag_font = w.font(13, bold=True)
        tag = pygame.Rect(0, 0, tag_font.size(dog.name)[0] + 12, 18)
        tag.midtop = (feet[0], feet[1] + 4)
        pygame.draw.rect(surface, w.PAPER, tag, border_radius=5)
        pygame.draw.rect(surface, w.INK, tag, 2, border_radius=5)
        w.text(surface, dog.name, tag_font, w.INK, tag.center, "center")

        if dog.status != "healthy":
            bob = math.sin(self.time * 6) * 4
            center = (rect.centerx, rect.top + round(bob))
            pygame.draw.circle(surface, w.INK, (center[0] + 2, center[1] + 2), 12)
            pygame.draw.circle(surface, w.RED, center, 12)
            pygame.draw.circle(surface, w.INK, center, 12, 2)
            w.text(surface, "!", w.font(18, bold=True), w.WHITE, center, "center")
        return rect.inflate(-size * 0.2, -size * 0.25)
