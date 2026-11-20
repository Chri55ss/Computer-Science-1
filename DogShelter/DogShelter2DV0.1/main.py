"""Dog Shelter Manager - 2D version.

Run it with:   python main.py
Needs pygame:  pip install pygame-ce
"""
import pygame

from assets import Assets
from screens import HEIGHT, WIDTH, App


def main():
    pygame.init()
    pygame.display.set_caption("Dog Shelter Manager")
    screen = pygame.display.set_mode((WIDTH, HEIGHT), pygame.SCALED | pygame.RESIZABLE)
    app = App(Assets())
    clock = pygame.time.Clock()
    while app.running:
        dt = min(clock.tick(60) / 1000, 0.05)
        app.step(dt, pygame.event.get(), screen)
        pygame.display.flip()
    pygame.quit()


if __name__ == "__main__":
    main()
