"""Colors, fonts, boxes, text and buttons (in the same style as DogShelterWeb).

Buttons are "immediate mode": each frame the screen draws a button and asks
`if ui.button(...):` - it returns True on the frame it was clicked.
"""
import pygame

# ---------- colors ----------
INK = (42, 27, 61)
PAPER = (255, 250, 240)
WHITE = (255, 255, 255)
PURPLE = (155, 93, 229)
GREEN = (62, 207, 110)
BLUE = (58, 134, 255)
RED = (255, 93, 115)
ORANGE = (255, 159, 28)
YELLOW = (255, 210, 63)
GREEN_BG = (220, 251, 227)
RED_BG = (255, 224, 229)
BLUE_BG = (227, 239, 255)
YELLOW_BG = (255, 244, 194)
LILAC_BG = (243, 237, 255)
SKY_DAY = ((110, 203, 255), (201, 241, 255))
SKY_MORNING = ((255, 159, 110), (255, 217, 160))
SKY_NIGHT = ((18, 15, 58), (44, 36, 104))
KIND_COLORS = {"good": GREEN, "bad": RED, "info": BLUE, "day": ORANGE}
KIND_BG = {"good": GREEN_BG, "bad": RED_BG, "info": BLUE_BG, "day": YELLOW_BG}


def lighten(color, amount):
    return tuple(min(255, c + amount) for c in color)


def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


# ---------- fonts ----------
_fonts = {}


def font(size, bold=False, mono=False):
    key = (size, bold, mono)
    if key not in _fonts:
        if mono:
            names = ["consolas", "menlo", "dejavusansmono", "couriernew", "monospace"]
        else:
            names = ["trebuchetms", "segoeui", "verdana", "dejavusans", "arial"]
        _fonts[key] = pygame.font.SysFont(names, size, bold=bold)
    return _fonts[key]


# ---------- drawing ----------
def box(surface, rect, fill, radius=10, border=3, shadow=4):
    rect = pygame.Rect(rect)
    if shadow:
        pygame.draw.rect(surface, INK, rect.move(shadow, shadow), border_radius=radius)
    pygame.draw.rect(surface, fill, rect, border_radius=radius)
    if border:
        pygame.draw.rect(surface, INK, rect, border, border_radius=radius)
    return rect


def text(surface, words, fnt, color, pos, anchor="topleft", outline=None):
    image = fnt.render(str(words), True, color)
    rect = image.get_rect(**{anchor: pos})
    if outline:
        shadow = fnt.render(str(words), True, outline)
        for dx, dy in ((3, 3), (-2, -2), (2, -2), (-2, 2), (3, 0)):
            surface.blit(shadow, rect.move(dx, dy))
    surface.blit(image, rect)
    return rect


def wrap(words, fnt, width):
    lines, line = [], ""
    for word in str(words).split():
        test = (line + " " + word).strip()
        if fnt.size(test)[0] <= width:
            line = test
        else:
            if line:
                lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines


def text_block(surface, words, fnt, color, rect, line_gap=2):
    """Wrapped text inside a rect. Returns the y below the last line."""
    rect = pygame.Rect(rect)
    y = rect.y
    for line in wrap(words, fnt, rect.width):
        if y + fnt.get_height() > rect.bottom + 2:
            break
        text(surface, line, fnt, color, (rect.x, y))
        y += fnt.get_height() + line_gap
    return y


def gradient(size, top, bottom):
    surface = pygame.Surface(size)
    w, h = size
    for y in range(h):
        pygame.draw.line(surface, mix(top, bottom, y / max(1, h - 1)), (0, y), (w, y))
    return surface


def happiness_bar(surface, rect, value):
    rect = pygame.Rect(rect)
    pygame.draw.rect(surface, WHITE, rect, border_radius=4)
    color = RED if value < 25 else ORANGE if value < 50 else YELLOW if value < 75 else GREEN
    filled = rect.inflate(-4, -4)
    filled.width = round(filled.width * value / 100)
    if filled.width > 0:
        pygame.draw.rect(surface, color, filled, border_radius=3)
    pygame.draw.rect(surface, INK, rect, 2, border_radius=4)


# ---------- input ----------
class UI:
    """Collects clicks each frame and draws buttons."""

    def __init__(self):
        self.clicks = []
        self.mouse = (0, 0)
        self.down = False
        self.enabled = True

    def begin_frame(self, events):
        self.clicks = [event.pos for event in events
                       if event.type == pygame.MOUSEBUTTONUP and event.button == 1]
        self.mouse = pygame.mouse.get_pos()
        self.down = pygame.mouse.get_pressed()[0]
        self.enabled = True

    def clicked(self, rect):
        """True (once) if this rect was clicked this frame."""
        if not self.enabled:
            return False
        for pos in self.clicks:
            if rect.collidepoint(pos):
                self.clicks.remove(pos)
                return True
        return False

    def any_click(self):
        if self.clicks:
            self.clicks.clear()
            return True
        return False

    def hovering(self, rect):
        return self.enabled and rect.collidepoint(self.mouse)

    def button(self, surface, rect, label, fill=WHITE, color=INK, enabled=True,
               fnt=None, sub=None, radius=8):
        rect = pygame.Rect(rect)
        fnt = fnt or font(17, bold=True)
        hover = enabled and self.hovering(rect)
        pressed = hover and self.down
        face = rect.move(0, 3 if pressed else 0)
        fill_now = fill if enabled else mix(fill, (200, 196, 210), 0.65)
        if hover and not pressed:
            fill_now = lighten(fill_now, 22)
        pygame.draw.rect(surface, INK, rect.move(0, 4), border_radius=radius)
        pygame.draw.rect(surface, fill_now, face, border_radius=radius)
        pygame.draw.rect(surface, INK, face, 3, border_radius=radius)
        text_color = color if enabled else mix(color, (150, 145, 160), 0.6)
        if sub:
            text(surface, label, fnt, text_color, (face.centerx, face.centery - 2), "midbottom")
            text(surface, sub, font(15, bold=True, mono=True), text_color,
                 (face.centerx, face.centery + 1), "midtop")
        else:
            text(surface, label, fnt, text_color, face.center, "center")
        return enabled and self.clicked(rect)
