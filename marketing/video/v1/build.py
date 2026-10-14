#!/usr/bin/env python3
"""마인드씬 기획 영상 편집 — 720p, 30fps."""
import os, re, subprocess, math
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out"); G = os.path.join(ROOT, "gfx")
os.makedirs(OUT, exist_ok=True); os.makedirs(G, exist_ok=True)
W, H, FPS = 1280, 720, 30
APP = os.path.join(ROOT, "rec/app3.webm")
FONT = "/System/Library/Fonts/AppleSDGothicNeo.ttc"
def F(size, w="bold"):
    return ImageFont.truetype(FONT, size, index={"light": 8, "reg": 0, "med": 2, "semi": 4, "bold": 6}[w])

GOLD, PURPLE, INK, MUTED = (255, 210, 122), (196, 166, 255), (246, 242, 255), (176, 168, 200)
BG1, BG2 = (14, 11, 22), (34, 24, 58)

def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode: print(" ".join(cmd)); print(r.stderr[-2500:]); raise SystemExit(1)

# ── 텍스트: ==강조== 는 금색 + 밑 하이라이트 바
def parts(s):
    out = []
    for i, p in enumerate(re.split(r"==", s)):
        if p: out.append((p, i % 2 == 1))
    return out

def text_w(d, s, f):
    return sum(d.textlength(p, font=f) for p, _ in parts(s))

def draw_rich(d, xy, s, f, color=INK, hl=GOLD, anchor="l"):
    x, y = xy
    tw = text_w(d, s, f)
    if anchor == "c": x -= tw / 2
    for p, on in parts(s):
        w = d.textlength(p, font=f)
        if on:
            asc = f.getmetrics()[0]
            d.rounded_rectangle([x - 2, y + asc * 0.62, x + w + 2, y + asc * 1.08], radius=4, fill=(120, 90, 200, 120))
        d.text((x, y), p, font=f, fill=hl if on else color)
        x += w

def gradient(spot=(0.5, 0.0), strength=1.0):
    im = Image.new("RGB", (W, H), BG1)
    px = im.load()
    for y in range(H):
        for x in range(0, W):
            t = y / H
            r = BG1[0] + (BG2[0] - BG1[0]) * t * 0.6
            g = BG1[1] + (BG2[1] - BG1[1]) * t * 0.6
            b = BG1[2] + (BG2[2] - BG1[2]) * t * 0.6
            dx, dy = (x / W - spot[0]) * 1.6, (y / H - spot[1])
            k = max(0, 1 - math.sqrt(dx * dx + dy * dy) / 0.9) ** 2 * strength
            px[x, y] = (int(r + 70 * k), int(g + 50 * k), int(b + 90 * k))
    return im

_BG = {}
def bg(key, spot, strength=1.0):
    if key not in _BG:
        p = os.path.join(G, f"bg_{key}.png")
        if not os.path.exists(p): gradient(spot, strength).save(p)
        _BG[key] = p
    return _BG[key]

# ── 그래픽 PNG 생성기
def subtitle_png(name, line, tag=None):
    """AI 클립용 하단 자막 + 좌상단 태그."""
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    # 하단 그라데이션
    for y in range(H - 220, H):
        a = int(200 * ((y - (H - 220)) / 220) ** 1.4)
        d.line([(0, y), (W, y)], fill=(8, 6, 14, a))
    f = F(38, "bold")
    draw_rich(d, (W / 2, H - 112), line, f, anchor="c")
    if tag:
        ft = F(20, "semi"); tw = d.textlength(tag, font=ft)
        d.rounded_rectangle([40, 36, 40 + tw + 36, 76], radius=20, fill=(20, 14, 34, 200), outline=GOLD + (255,), width=2)
        d.text((58, 44), tag, font=ft, fill=GOLD)
    p = os.path.join(G, name + ".png"); im.save(p); return p

def phone_bg_png(name, tag, title, sub, step=None):
    im = Image.open(bg("phone", (0.72, 0.1), 0.9)).convert("RGBA"); d = ImageDraw.Draw(im)
    x0 = 90
    ft = F(22, "semi"); tw = d.textlength(tag, font=ft)
    d.rounded_rectangle([x0, 170, x0 + tw + 40, 214], radius=22, fill=(40, 30, 64, 255), outline=GOLD + (255,), width=2)
    d.text((x0 + 20, 178), tag, font=ft, fill=GOLD)
    y = 250
    for ln in title.split("\n"):
        draw_rich(d, (x0, y), ln, F(56, "bold")); y += 76
    y += 14
    for ln in sub.split("\n"):
        draw_rich(d, (x0, y), ln, F(28, "med"), color=MUTED, hl=PURPLE); y += 44
    if step:
        i, n = step
        for k in range(n):
            cx = x0 + k * 26
            d.ellipse([cx, 600, cx + 12, 612], fill=GOLD if k == i else (70, 60, 100))
    # 폰 그림자/베젤
    px, py, pw, ph = 846, 30, 316, 660
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sh)
    sd.rounded_rectangle([px - 6, py + 6, px + pw + 6, py + ph + 16], radius=52, fill=(0, 0, 0, 170))
    sh = sh.filter(ImageFilter.GaussianBlur(18)); im = Image.alpha_composite(im, sh); d = ImageDraw.Draw(im)
    d.rounded_rectangle([px, py, px + pw, py + ph], radius=46, fill=(10, 8, 16, 255), outline=(90, 78, 130, 255), width=3)
    p = os.path.join(G, name + ".png"); im.convert("RGB").save(p); return p

def phone_mask():
    p = os.path.join(G, "mask.png")
    m = Image.new("L", (296, 640), 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, 295, 639], radius=38, fill=255); m.save(p)
    return p

def card_pngs(name, layers):
    """layers: list of draw callables → 누적 PNG(단계별 등장)."""
    base = Image.open(bg("card", (0.5, 0.25), 1.1)).convert("RGBA")
    paths = []
    for i, fn in enumerate(layers):
        im = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fn(ImageDraw.Draw(im), im)
        p = os.path.join(G, f"{name}_{i}.png"); im.save(p); paths.append(p)
    bp = os.path.join(G, f"{name}_bg.png"); base.convert("RGB").save(bp)
    return bp, paths

# ── 세그먼트 렌더러
SEGS = []
def seg_path(): return os.path.join(OUT, f"s{len(SEGS):02d}.mp4")

ENC = ["-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-r", str(FPS), "-an"]

def ai_clip(src, line, tag=None, fade=True):
    out = seg_path(); sub = subtitle_png(os.path.basename(out)[:-4] + "_sub", line, tag)
    fx = f"fade=t=in:st=0:d=0.35,fade=t=out:st={5-0.35}:d=0.35," if fade else ""
    run(["ffmpeg", "-y", "-i", src, "-loop", "1", "-t", "5", "-i", sub, "-filter_complex",
         f"[0:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},setsar=1,trim=0:5,setpts=PTS-STARTPTS[v];"
         f"[1:v]format=rgba,fade=t=in:st=0.5:d=0.5:alpha=1[s];[v][s]overlay=0:0,{fx}format=yuv420p",
         "-t", "5", *ENC, out]); SEGS.append(out)

def phone(t0, t1, speed, tag, title, sub, step=None, fin=False, fout=False):
    out = seg_path(); dur = (t1 - t0) / speed
    bgp = phone_bg_png(os.path.basename(out)[:-4] + "_bg", tag, title, sub, step)
    fx = []
    if fin: fx.append("fade=t=in:st=0:d=0.35")
    if fout: fx.append(f"fade=t=out:st={dur-0.35:.2f}:d=0.35")
    tail = ("," + ",".join(fx)) if fx else ""
    run(["ffmpeg", "-y", "-loop", "1", "-i", bgp, "-ss", f"{t0}", "-to", f"{t1}", "-i", APP, "-loop", "1", "-i", phone_mask(),
         "-filter_complex",
         f"[1:v]setpts=(PTS-STARTPTS)/{speed},fps={FPS},crop=390:844:0:0,scale=296:640:flags=lanczos,format=rgba[ph];[2:v]scale=296:640,format=gray[m];"
         f"[ph][m]alphamerge[pm];[0:v][pm]overlay=856:40:shortest=1,format=yuv420p{tail}",
         "-t", f"{dur:.2f}", *ENC, out]); SEGS.append(out)

def card(name, dur, layers, times, zoom=True):
    """단계별로 레이어가 페이드인되는 타이틀 카드."""
    out = seg_path(); bp, pngs = card_pngs(name, layers)
    inputs = ["-loop", "1", "-t", f"{dur}", "-i", bp]
    for p in pngs: inputs += ["-loop", "1", "-t", f"{dur}", "-i", p]
    z = f"scale=1344:756,zoompan=z='1+0.0008*on':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS}" if zoom else f"fps={FPS}"
    fc = f"[0:v]{z}[b0];"; last = "b0"
    for i, t in enumerate(times):
        fc += f"[{i+1}:v]format=rgba,fade=t=in:st={t}:d=0.45:alpha=1[l{i}];[{last}][l{i}]overlay=0:'if(lt(t,{t}+0.45),12*(1-(t-{t})/0.45),0)'[b{i+1}];"
        last = f"b{i+1}"
    fc += f"[{last}]fade=t=in:st=0:d=0.35,fade=t=out:st={dur-0.4}:d=0.4,format=yuv420p"
    run(["ffmpeg", "-y", *inputs, "-filter_complex", fc, "-t", f"{dur}", *ENC, out]); SEGS.append(out)

# ── 카드 레이어 정의
def L_center(text, y, size=48, w="bold", color=INK, hl=GOLD):
    return lambda d, im: draw_rich(d, (W / 2, y), text, F(size, w), color=color, hl=hl, anchor="c")

def L_pill(text, y):
    def fn(d, im):
        f = F(22, "semi"); tw = d.textlength(text, font=f)
        d.rounded_rectangle([W / 2 - tw / 2 - 22, y, W / 2 + tw / 2 + 22, y + 44], radius=22, outline=GOLD, width=2, fill=(30, 22, 50, 230))
        d.text((W / 2 - tw / 2, y + 8), text, font=f, fill=GOLD)
    return fn

def L_item(no, head, body, y):
    def fn(d, im):
        x = 330
        d.ellipse([x, y, x + 54, y + 54], fill=(60, 44, 100, 255), outline=GOLD, width=2)
        f = F(26, "bold"); d.text((x + 27 - d.textlength(no, font=f) / 2, y + 10), no, font=f, fill=GOLD)
        draw_rich(d, (x + 80, y - 2), head, F(38, "bold"))
        d.text((x + 80, y + 44), body, font=F(24, "med"), fill=MUTED)
    return fn

def L_row(cells, y, header=False):
    def fn(d, im):
        xs = [220, 520, 830]
        fill = (40, 30, 64, 235) if header else (24, 18, 40, 225)
        d.rounded_rectangle([200, y - 12, 1080, y + 52], radius=14, fill=fill)
        for i, c in enumerate(cells):
            f = F(26 if header else 28, "bold" if (i == 2 or i == 0) else "med")
            col = MUTED if i == 1 else (GOLD if i == 2 else INK)
            if header: col = PURPLE if i else MUTED
            d.text((xs[i], y), c, font=f, fill=col)
    return fn

def L_bottom_url(d, im):
    f = F(24, "med"); s = "teen-dramaro.vercel.app"
    d.text((W / 2 - d.textlength(s, font=f) / 2, 560), s, font=f, fill=MUTED)

AI = os.path.join(ROOT, "ai")
TAG = "기획 영상 · 마인드씬"

# ───────────── 타임라인 ─────────────
# 1. 동기
ai_clip(f"{AI}/v1.mp4", "제 꿈은 ==아이돌의 스토리==를 기획하는 디렉터예요.", TAG)
ai_clip(f"{AI}/v2.mp4", "스토리를 연습하려고 ==제타 · character.ai==로 이야기를 만들어 봤어요.", TAG)
ai_clip(f"{AI}/v3.mp4", "몇 시간을 썼는데, ==내 이야기==는 한 줄도 남지 않았어요.", TAG)
card("why", 7.0, [
    L_pill("기획자의 눈으로 다시 보니", 140),
    L_item("1", "==끝이 없다==", "시작 · 갈등 · 마지막 장면 없이 채팅만 계속 이어진다", 250),
    L_item("2", "==내가 없다==", "주인공은 AI 캐릭터, 나는 맞춰 주기만 했다", 370),
    L_item("3", "==남는 게 없다==", "앱을 닫으면 내 이야기는 한 줄도 남지 않는다", 490),
], [0.2, 1.2, 2.6, 4.0])
ai_clip(f"{AI}/v4.mp4", "그래서 직접 기획했어요. AI와 함께 ==내 이야기 한 편==을 만드는 무대.", TAG)
card("title", 4.0, [
    L_pill("TEENDRAMARO", 210),
    L_center("마인드씬", 280, 96, "bold", color=GOLD),
    L_center("내 안의 무대, ==한 씬씩.==", 420, 40, "med"),
], [0.1, 0.5, 1.4])

# 2. About 으로 소개
A = "About · 한눈에 보기"
phone(0.8, 3.6, 1.0, A, "내 안의 무대,\n==한 씬씩.==", "짧은 장면을 연기하듯 해 보며\n내 마음을 조금씩 들여다보는 곳", (0, 6), fin=True)
phone(3.6, 7.0, 1.0, A, "씬 = ==한 테이크==\n작은 이야기 한 편", "시작 → 흔들림 → 마지막 컷\n3~10분이면 한 편이 끝나요", (1, 6))
phone(7.0, 9.6, 1.0, A, "두 무대\n==놀거나, 털어놓거나==", "상황극: 유명 장면 속 주인공 되기\n내 무대: 마음에 남은 장면 세우기", (2, 6))
phone(9.6, 12.4, 1.0, A, "==순한 맛==부터,\n천천히.", "얼마나 깊이 들어갈지는\n언제나 내가 골라요", (3, 6))
phone(12.4, 15.0, 1.0, A, "모으면,\n==나만의 이야기==", "씬을 이어 붙이면\n인트로부터 결론까지 짧은 성장 영화", (4, 6))
phone(15.0, 20.0, 1.0, A, "캐묻지 않아.\n==이름표도 없어.==", "「너는 ○○형」 진단 없음 · 기록은 내 폰에만\n위험해 보이면 씬보다 먼저 멈춰요", (5, 6), fout=True)

# 3. 시연
card("demo", 3.0, [
    L_pill("시연", 220),
    L_center("〈시라노〉 → ==「대신 쓰는 DM」==", 290, 52),
    L_center("친구 대신 짝사랑 DM을 써 주는 중학생 버전", 380, 28, "med", color=MUTED),
], [0.1, 0.5, 1.1])
D = "시연 · 상황극"
phone(22.3, 25.9, 1.0, D, "고전을\n==중학생 일상==으로", "학원 자습실 맨 뒤, 밤 9시 40분\n정해진 사실 3개 + 열린 것 3개", (0, 9), fin=True)
phone(25.9, 31.0, 1.0, D, "AI는 ==상대 인물==만", "도윤 역할만 연기해요\n내 과제: 내 마음은 안 들키고, 도윤 마음은 들키게", (1, 9))
phone(31.0, 52.0, 2.5, D, "내가 말하면,\n==도윤이 받아친다==", "중간에 「새 사실」이 떠오르며\n장면이 흔들려요", (2, 9))
phone(52.0, 58.3, 1.3, D, "결정적 자리\n==「너였다면?」==", "AI가 대신 고르지 않아요\n고르는 건 나", (3, 9))
phone(58.3, 64.6, 1.3, D, "==마지막 컷==은\n내 손으로", "대사 한 줄 + 몸짓 한 줄\nAI가 대신 끝내 주지 않아요", (4, 9))
phone(64.6, 69.6, 1.0, D, "원작과 ==나란히==", "정답은 없어요\n같은 자리, 다른 길", (5, 9))
phone(69.6, 81.4, 2.6, D, "작가실 ==돌아보기==", "판단 대신\n내가 한 말만 비춰 줘요", (6, 9))
phone(82.5, 90.8, 1.3, D, "끝나면\n==씬 카드 한 장==", "저장 버튼 없이 자동으로 남아요\n다시 찍으면 Take 2", (7, 9))
phone(90.8, 98.9, 1.2, D, "모으면\n==내 이야기==가 된다", "「내 씬」에 쌓인 씬을 이어 붙이면\n나만의 짧은 성장 영화", (8, 9), fout=True)

# 4. 차별점 · 좋은 점
card("diff", 8.0, [
    L_pill("무엇이 다른가", 110),
    L_row(["", "제타 · character.ai", "마인드씬"], 200, header=True),
    L_row(["주인공", "AI 캐릭터", "나"], 285),
    L_row(["끝", "없음", "5분이면 한 편"], 370),
    L_row(["남는 것", "채팅 기록", "씬 카드 · 내 이야기"], 455),
    L_row(["AI 역할", "친구 · 연인", "상대 인물 · 진행자만"], 540),
], [0.1, 0.5, 1.5, 2.6, 3.7, 4.8], zoom=False)
ai_clip(f"{AI}/v5.mp4", "빠져들지 않고 · ==내 이야기가 남고== · 안전하게", "쓰면 좋은 점")
ai_clip(f"{AI}/v6.mp4", "친구들과 한 씬씩, ==진짜 마음==에서 시작하는 이야기.", TAG)
card("end", 5.5, [
    L_center("사람을 움직이는 스토리는 ==진짜 마음==에서 시작돼요.", 200, 34, "med"),
    L_center("마인드씬", 290, 92, "bold", color=GOLD),
    L_center("내 안의 무대, ==한 씬씩.==", 420, 38, "med"),
    L_bottom_url,
], [0.1, 1.0, 1.6, 2.2])

# ── 이어 붙이기 + 배경음
lst = os.path.join(OUT, "list.txt")
open(lst, "w").write("".join(f"file '{s}'\n" for s in SEGS))
silent = os.path.join(OUT, "silent.mp4")
run(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy", silent])
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", silent], capture_output=True, text=True).stdout)
# 잔잔한 패드: 화음이 8초마다 바뀌는 사인파 + 트레몰로
chords = [(220.0, 277.18, 329.63), (196.0, 246.94, 293.66), (174.61, 220.0, 261.63), (196.0, 246.94, 329.63)]
expr = []
for k in range(3):
    f = "+".join(f"{c[k]}*between(mod(t,32),{i*8},{i*8+8}-0.0001)" for i, c in enumerate(chords))
    expr.append(f"sin(2*PI*({f})*t)")
pad = f"0.06*({'+'.join(expr)})*(0.75+0.25*sin(2*PI*0.25*t))"
final = os.path.join(ROOT, "mindscene_plan_720p.mp4")
run(["ffmpeg", "-y", "-i", silent, "-f", "lavfi", "-t", f"{dur}", "-i", f"aevalsrc='{pad}|{pad}':s=44100",
     "-filter_complex", f"[1:a]lowpass=f=1400,aecho=0.8:0.7:120:0.25,afade=t=in:d=2,afade=t=out:st={dur-3}:d=3,volume=0.9[a]",
     "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", final])
print("DONE", final, f"{dur:.1f}s", len(SEGS), "segments")
