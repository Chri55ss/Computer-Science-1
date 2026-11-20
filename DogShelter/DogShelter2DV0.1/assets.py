"""Loads the pixel art: dog sprite sheets, grass, fence and plants."""
import json
import os

import pygame

HERE = os.path.dirname(os.path.abspath(__file__))


def path(*parts):
    return os.path.join(HERE, *parts)


def load(*parts):
    return pygame.image.load(path(*parts)).convert_alpha()


def scale(image, factor):
    w, h = image.get_size()
    return pygame.transform.scale(image, (max(1, round(w * factor)), max(1, round(h * factor))))


class Assets:
    def __init__(self):
        # --- dog sprite sheets: 8 frames of 32x32 facing right ---
        with open(path("sprites", "sprite_manifest.json")) as f:
            manifest = json.load(f)
        self.frame_size = manifest["frame_size"]
        self.animations = manifest["animations"]      # walk, idle, lie -> frame numbers
        self.sheets = {}
        self.muzzle_offsets = {}
        for breed, info in manifest["breeds"].items():
            self.sheets[breed] = load("sprites", info["file"])
            self.muzzle_offsets[breed] = info["muzzle_offsets"]
        self.muzzle = load("sprites", "muzzle.png")
        self._frames = {}

        # --- yard art ---
        with open(path("assets", "yard", "manifest.json")) as f:
            yard_manifest = json.load(f)["files"]
        self.grass = {}
        for size in ("small", "medium", "large"):
            self.grass[size] = [load("assets", "yard", "grass", "grass_{}_{}.png".format(size, n))
                                for n in ("1", "2", "3", "flowers")]
        self.dirt_path = load("assets", "yard", "grass", "dirt_path.png")
        fence = {}
        for name in ("section", "section_heart", "post", "end_left", "end_right", "gate"):
            fence[name] = load("assets", "yard", "fence", "fence_{}.png".format(name))
        self.fence = fence
        self.plants = []
        for file, info in yard_manifest.items():
            if file.startswith("plants/") and "butterfly" not in file:
                w, h = info["frame"]
                sheet = load("assets", "yard", *file.split("/"))
                frames = [sheet.subsurface(pygame.Rect(i * w, 0, w, h)) for i in range(info["frames"])]
                self.plants.append({"frames": frames, "fps": info["fps"]})

    def dog_frame(self, breed, frame, size, flip=False, muzzled=False):
        """One frame of a dog, scaled to size x size pixels."""
        key = (breed, frame, size, flip, muzzled)
        if key not in self._frames:
            fs = self.frame_size
            image = pygame.Surface((fs, fs), pygame.SRCALPHA)
            image.blit(self.sheets[breed], (0, 0), pygame.Rect(frame * fs, 0, fs, fs))
            if muzzled:
                x, y = self.muzzle_offsets[breed][frame]
                image.blit(self.muzzle, (x, y))
            image = pygame.transform.scale(image, (size, size))
            if flip:
                image = pygame.transform.flip(image, True, False)
            self._frames[key] = image
        return self._frames[key]

    def anim_frame(self, anim, t, fps):
        """The frame number for an animation ('walk', 'idle', 'lie') at time t."""
        frames = self.animations[anim]
        return frames[int(t * fps) % len(frames)]
