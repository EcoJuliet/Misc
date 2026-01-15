import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Circle, Ellipse, Polygon, Wedge
import numpy as np

fig, ax = plt.subplots(1, 1, figsize=(6, 8))
ax.set_xlim(0, 500)
ax.set_ylim(0, 600)
ax.set_aspect('equal')
ax.axis('off')

# Background gradient (aproximado)
ax.set_facecolor('#667eea')

# Cauda
tail = Polygon([(310, 450), (380, 430), (390, 480), (395, 510), (370, 520), (340, 525), (320, 490)],
               facecolor='#4A90E2', edgecolor='#2E5C8A', linewidth=3)
ax.add_patch(tail)

# Ponta branca da cauda
tail_tip = Circle((375, 505), 25, facecolor='white', edgecolor='#2E5C8A', linewidth=3)
ax.add_patch(tail_tip)

# Pernas
# Perna esquerda
left_leg = Ellipse((220, 520), 50, 80, facecolor='#4A90E2', edgecolor='#2E5C8A', linewidth=3)
ax.add_patch(left_leg)

# Pé esquerdo
left_foot = Ellipse((220, 555), 60, 30, facecolor='#2E5C8A', edgecolor='#2E5C8A', linewidth=3)
ax.add_patch(left_foot)

# Perna direita
right_leg = Ellipse((280, 520), 50, 80, facecolor='#4A90E2', edgecolor='#2E5C8A', linewidth=3)
ax.add_patch(right_leg)

# Pé direito
right_foot = Ellipse((280, 555), 60, 30, facecolor='#2E5C8A', edgecolor='#2E5C8A', linewidth=3)
ax.add_patch(right_foot)

# Corpo principal
body = Ellipse((250, 420), 140, 180, facecolor='#4A90E2', edgecolor='#2E5C8A', linewidth=3)
ax.add_patch(body)

# Barriga
belly = Ellipse((250, 430), 90, 120, facecolor='white', edgecolor='none')
ax.add_patch(belly)

# Braços
# Braço esquerdo
left_arm = Ellipse((190, 390), 40, 100, angle=-17, facecolor='#4A90E2', edgecolor='#2E5C8A', linewidth=3)
ax.add_patch(left_arm)

# Braço direito
right_arm = Ellipse((310, 390), 40, 100, angle=17, facecolor='#4A90E2', edgecolor='#2E5C8A', linewidth=3)
ax.add_patch(right_arm)

# Cabeça principal
head = Circle((250, 280), 80, facecolor='#4A90E2', edgecolor='#2E5C8A', linewidth=3, zorder=5)
ax.add_patch(head)

# Orelhas
# Orelha esquerda
left_ear = Polygon([(200, 240), (170, 180), (220, 220)], facecolor='#4A90E2', edgecolor='#2E5C8A', linewidth=3, zorder=4)
ax.add_patch(left_ear)

# Interior orelha esquerda
left_ear_inner = Polygon([(205, 235), (185, 195), (215, 225)], facecolor='#FFE0E6', edgecolor='none', zorder=4)
ax.add_patch(left_ear_inner)

# Orelha direita
right_ear = Polygon([(300, 240), (330, 180), (280, 220)], facecolor='#4A90E2', edgecolor='#2E5C8A', linewidth=3, zorder=4)
ax.add_patch(right_ear)

# Interior orelha direita
right_ear_inner = Polygon([(295, 235), (315, 195), (285, 225)], facecolor='#FFE0E6', edgecolor='none', zorder=4)
ax.add_patch(right_ear_inner)

# Focinho
snout = Ellipse((250, 300), 90, 70, facecolor='white', edgecolor='#2E5C8A', linewidth=3, zorder=6)
ax.add_patch(snout)

# Nariz
nose = Circle((250, 290), 10, facecolor='#333', zorder=7)
ax.add_patch(nose)

# Boca (sorriso)
theta = np.linspace(0, np.pi, 100)
mouth_x = 250 + 15 * np.cos(theta)
mouth_y = 295 + 15 * np.sin(theta)
ax.plot(mouth_x, mouth_y, color='#333', linewidth=2, zorder=7)

# Olhos
# Olho esquerdo - branco
left_eye_white = Circle((230, 270), 12, facecolor='white', edgecolor='#333', linewidth=2, zorder=7)
ax.add_patch(left_eye_white)

# Olho esquerdo - pupila
left_eye_pupil = Circle((232, 270), 7, facecolor='#333', zorder=8)
ax.add_patch(left_eye_pupil)

# Olho esquerdo - brilho
left_eye_shine = Circle((229, 267), 3, facecolor='white', zorder=9)
ax.add_patch(left_eye_shine)

# Olho direito - branco
right_eye_white = Circle((270, 270), 12, facecolor='white', edgecolor='#333', linewidth=2, zorder=7)
ax.add_patch(right_eye_white)

# Olho direito - pupila
right_eye_pupil = Circle((272, 270), 7, facecolor='#333', zorder=8)
ax.add_patch(right_eye_pupil)

# Olho direito - brilho
right_eye_shine = Circle((269, 267), 3, facecolor='white', zorder=9)
ax.add_patch(right_eye_shine)

# Chapéu de festa
# Cone do chapéu
hat = Polygon([(250, 80), (180, 200), (320, 200)], facecolor='#FF6B9D', edgecolor='#333', linewidth=2, zorder=10)
ax.add_patch(hat)

# Listras no chapéu
ax.plot([220, 200], [140, 200], color='white', linewidth=3, zorder=11)
ax.plot([250, 250], [100, 200], color='white', linewidth=3, zorder=11)
ax.plot([280, 300], [140, 200], color='white', linewidth=3, zorder=11)

# Pompom no topo
pompom = Circle((250, 80), 15, facecolor='#FFD700', edgecolor='#333', linewidth=2, zorder=12)
ax.add_patch(pompom)

# Base do chapéu
hat_base = Ellipse((250, 200), 140, 30, facecolor='#FF6B9D', edgecolor='#333', linewidth=2, zorder=10)
ax.add_patch(hat_base)

# Título
ax.text(250, 30, 'Claude - A Raposa Azul', fontsize=20, fontweight='bold',
        ha='center', color='white', zorder=15)

plt.tight_layout()
plt.savefig('/home/user/Misc/claude-fox.png', dpi=150, facecolor='#667eea', bbox_inches='tight')
print("Imagem salva como claude-fox.png!")
