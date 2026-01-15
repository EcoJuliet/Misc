from PIL import Image, ImageDraw
import math

# Criar imagem
width, height = 500, 600
img = Image.new('RGB', (width, height), '#667eea')
draw = ImageDraw.Draw(img)

def draw_circle(draw, x, y, r, fill, outline=None, width=3):
    draw.ellipse([x-r, y-r, x+r, y+r], fill=fill, outline=outline, width=width)

def draw_ellipse(draw, x, y, w, h, fill, outline=None, width=3):
    draw.ellipse([x-w/2, y-h/2, x+w/2, y+h/2], fill=fill, outline=outline, width=width)

# Cauda
tail_points = [(310, 150), (380, 170), (390, 120), (395, 90), (370, 80), (340, 75), (320, 110)]
draw.polygon(tail_points, fill='#4A90E2', outline='#2E5C8A')

# Ponta branca da cauda
draw_circle(draw, 375, 95, 25, fill='white', outline='#2E5C8A')

# Pernas
draw_ellipse(draw, 220, 80, 50, 80, fill='#4A90E2', outline='#2E5C8A')
draw_ellipse(draw, 220, 45, 60, 30, fill='#2E5C8A', outline='#2E5C8A')

draw_ellipse(draw, 280, 80, 50, 80, fill='#4A90E2', outline='#2E5C8A')
draw_ellipse(draw, 280, 45, 60, 30, fill='#2E5C8A', outline='#2E5C8A')

# Corpo
draw_ellipse(draw, 250, 180, 140, 180, fill='#4A90E2', outline='#2E5C8A')
draw_ellipse(draw, 250, 170, 90, 120, fill='white', outline=None)

# Braços
draw_ellipse(draw, 190, 210, 40, 100, fill='#4A90E2', outline='#2E5C8A')
draw_ellipse(draw, 310, 210, 40, 100, fill='#4A90E2', outline='#2E5C8A')

# Cabeça
draw_circle(draw, 250, 320, 80, fill='#4A90E2', outline='#2E5C8A')

# Orelhas
left_ear = [(200, 360), (170, 420), (220, 380)]
draw.polygon(left_ear, fill='#4A90E2', outline='#2E5C8A')
left_ear_inner = [(205, 365), (185, 405), (215, 375)]
draw.polygon(left_ear_inner, fill='#FFE0E6', outline='#FFE0E6')

right_ear = [(300, 360), (330, 420), (280, 380)]
draw.polygon(right_ear, fill='#4A90E2', outline='#2E5C8A')
right_ear_inner = [(295, 365), (315, 405), (285, 375)]
draw.polygon(right_ear_inner, fill='#FFE0E6', outline='#FFE0E6')

# Focinho
draw_ellipse(draw, 250, 300, 90, 70, fill='white', outline='#2E5C8A')

# Nariz
draw_circle(draw, 250, 310, 10, fill='#333333', outline='#333333')

# Boca (arco)
draw.arc([235, 305, 265, 320], 0, 180, fill='#333333', width=2)

# Olhos
# Esquerdo
draw_circle(draw, 230, 330, 12, fill='white', outline='#333333')
draw_circle(draw, 232, 330, 7, fill='#333333', outline='#333333')
draw_circle(draw, 229, 333, 3, fill='white', outline='white')

# Direito
draw_circle(draw, 270, 330, 12, fill='white', outline='#333333')
draw_circle(draw, 272, 330, 7, fill='#333333', outline='#333333')
draw_circle(draw, 269, 333, 3, fill='white', outline='white')

# Chapéu de festa
hat = [(250, 520), (180, 400), (320, 400)]
draw.polygon(hat, fill='#FF6B9D', outline='#333333')

# Listras no chapéu
draw.line([(220, 460), (200, 400)], fill='white', width=3)
draw.line([(250, 500), (250, 400)], fill='white', width=3)
draw.line([(280, 460), (300, 400)], fill='white', width=3)

# Pompom
draw_circle(draw, 250, 520, 15, fill='#FFD700', outline='#333333')

# Base do chapéu
draw_ellipse(draw, 250, 400, 140, 30, fill='#FF6B9D', outline='#333333')

# Salvar
img = img.transpose(Image.FLIP_TOP_BOTTOM)
img.save('/home/user/Misc/claude-fox.png')
print("Imagem salva como claude-fox.png!")
