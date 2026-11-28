#!/usr/bin/env python3
"""Metro Cafe Tycoon - 오리지널 BGM 4곡 합성기 (가사 없는 연주곡, 루프 이음새 없음)
사용: python3 make_bgm.py <출력폴더>
"""
import sys, subprocess
from pathlib import Path
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt
from scipy.io import wavfile

SR = 44100
OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
rng = np.random.default_rng(20261127)


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12.0)


def filt(x, kind, cutoff, order=2):
    sos = butter(order, cutoff, btype=kind, fs=SR, output="sos")
    return sosfilt(sos, x)


# ---------------------------------------------------------------- 악기 ----
def env_ad(n, a, decay):
    t = np.arange(n) / SR
    e = np.minimum(1.0, t / max(a, 1e-4)) * np.exp(-t * decay)
    return e


def piano(f, dur, vel=0.6):
    n = int((dur + 1.6) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for h in range(1, 8):
        fh = f * h * (1 + 0.0004 * h * h)
        if fh > 9000:
            break
        y += (1.0 / h ** 1.15) * np.sin(2 * np.pi * fh * t) * np.exp(-t * (1.6 + 1.7 * h) * (1.0 + f / 1500))
    y *= np.minimum(1, t / 0.004)
    rel = np.minimum(1, np.maximum(0, (dur + 1.2 - t) / 0.3))
    # 건반을 떼면 빠르게 감쇠
    off = np.where(t > dur, np.exp(-(t - dur) * 7), 1.0)
    return y * rel * off * vel * 0.5


def ep(f, dur, vel=0.6, bright=1.0):
    """로즈 계열 FM 전기피아노"""
    n = int((dur + 1.4) * SR)
    t = np.arange(n) / SR
    idx = (2.2 * bright) * np.exp(-t * 4.0) + 0.35
    mod = np.sin(2 * np.pi * f * t) * idx
    y = np.sin(2 * np.pi * f * t + mod) * np.exp(-t * 1.9)
    tine = np.sin(2 * np.pi * f * 7 * t) * np.exp(-t * 18) * 0.05 * bright
    y = (y + tine) * np.minimum(1, t / 0.004)
    off = np.where(t > dur, np.exp(-(t - dur) * 6), 1.0)
    return y * off * vel * 0.55


def pluck(f, dur, vel=0.6):
    """어쿠스틱 기타 풍 (하모닉 가산합성)"""
    n = int((dur + 1.0) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for h in range(1, 10):
        y += (1.0 / h) * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (2.2 + 2.4 * h))
    y *= np.minimum(1, t / 0.002)
    off = np.where(t > dur, np.exp(-(t - dur) * 12), 1.0)
    return y * off * vel * 0.55


def marimba(f, dur, vel=0.6):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 5.5)
    y += 0.45 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 22)
    y += 0.12 * np.sin(2 * np.pi * f * 9.2 * t) * np.exp(-t * 40)
    y *= np.minimum(1, t / 0.002)
    return y * vel * 0.6


def musicbox(f, dur, vel=0.6):
    n = int(2.0 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) * np.exp(-t * 3.2)
    y += 0.35 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 7)
    y += 0.2 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 14)
    y *= np.minimum(1, t / 0.002)
    return y * vel * 0.4


def pad(f, dur, vel=0.3):
    n = int((dur + 1.5) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for det in (-0.004, 0.0, 0.004):
        ff = f * (1 + det)
        for h, a in ((1, 1.0), (2, 0.35), (3, 0.12)):
            y += a * np.sin(2 * np.pi * ff * h * t + rng.uniform(0, 6.28))
    y = filt(y, "low", 1800)
    a = np.minimum(1, t / 0.9)
    r = np.where(t > dur, np.exp(-(t - dur) * 2.2), 1.0)
    return y * a * r * vel * 0.2


def bass(f, dur, vel=0.7):
    n = int((dur + 0.5) * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 2 * t) * np.exp(-t * 6) + 0.12 * np.sin(2 * np.pi * f * 3 * t) * np.exp(-t * 10)
    y *= np.minimum(1, t / 0.006) * np.exp(-t * 2.8)
    off = np.where(t > dur, np.exp(-(t - dur) * 14), 1.0)
    return y * off * vel * 0.7


def upright(f, dur, vel=0.7):
    n = int((dur + 0.4) * SR)
    t = np.arange(n) / SR
    y = np.zeros(n)
    for h in range(1, 6):
        y += (1.0 / h ** 1.4) * np.sin(2 * np.pi * f * h * t) * np.exp(-t * (2.5 + 2.0 * h))
    thump = np.sin(2 * np.pi * (f * 2) * t) * np.exp(-t * 40) * 0.25
    y = (y + thump) * np.minimum(1, t / 0.005)
    off = np.where(t > dur, np.exp(-(t - dur) * 16), 1.0)
    return y * off * vel * 0.75


def lead_flute(f, dur, vel=0.6, vib=5.0):
    """부드러운 뮤트 트럼펫/플루트 풍 리드"""
    n = int((dur + 0.35) * SR)
    t = np.arange(n) / SR
    vdepth = np.minimum(1, np.maximum(0, (t - 0.18) / 0.25)) * 0.006
    ph = 2 * np.pi * f * t + (vdepth * f / vib) * np.sin(2 * np.pi * vib * t) * 2 * np.pi
    y = np.sin(ph) + 0.38 * np.sin(2 * ph) + 0.14 * np.sin(3 * ph)
    breath = filt(rng.standard_normal(n), "band", [f * 0.9, f * 3.0], 2) * 0.015
    a = np.minimum(1, t / 0.045)
    r = np.where(t > dur, np.exp(-(t - dur) * 14), 1.0)
    return (y + breath) * a * r * vel * 0.34


def kick(vel=0.7):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    f = 52 + 70 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 11) * vel * 0.8


def brush(vel=0.5, length=0.16):
    n = int(length * SR)
    x = filt(rng.standard_normal(n), "band", [2500, 9000], 2)
    t = np.arange(n) / SR
    return x * np.minimum(1, t / 0.012) * np.exp(-t * (6 / length) * 0.5) * vel * 0.12


def hat(vel=0.5):
    n = int(0.06 * SR)
    x = filt(rng.standard_normal(n), "high", 7000, 2)
    return x * np.exp(-np.arange(n) / SR * 70) * vel * 0.09


def shaker(vel=0.5):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    x = filt(rng.standard_normal(n), "band", [4500, 11000], 2)
    return x * np.minimum(1, t / 0.02) * np.exp(-t * 38) * vel * 0.1


def rimclick(vel=0.5):
    n = int(0.05 * SR)
    t = np.arange(n) / SR
    y = np.sin(2 * np.pi * 1700 * t) * np.exp(-t * 90) + filt(rng.standard_normal(n), "high", 3000) * np.exp(-t * 120) * 0.5
    return y * vel * 0.25


# ------------------------------------------------------------ 믹서/렌더 ----
class Track:
    def __init__(self, bpm, bars, swing=False):
        self.bpm = bpm
        self.bars = bars
        self.spb = 60.0 / bpm
        self.swing = swing
        self.loop_len = int(bars * 4 * self.spb * SR)
        self.tail = int(3.5 * SR)
        self.L = np.zeros(self.loop_len + self.tail)
        self.R = np.zeros(self.loop_len + self.tail)

    def tpos(self, bar, beat):
        if self.swing:
            fr = beat % 1.0
            if abs(fr - 0.5) < 1e-6:
                beat = beat + 1 / 6.0
        return (bar * 4 + beat) * self.spb

    def add(self, sig, bar, beat, pan=0.0, gain=1.0, humanize=0.006):
        start = int((self.tpos(bar, beat) + rng.uniform(-humanize, humanize)) * SR)
        start = max(0, start)
        end = min(len(self.L), start + len(sig))
        seg = sig[: end - start] * gain
        gl = np.cos((pan + 1) * np.pi / 4)
        gr = np.sin((pan + 1) * np.pi / 4)
        self.L[start:end] += seg * gl
        self.R[start:end] += seg * gr

    def dur(self, beats):
        return beats * self.spb

    def finish(self, wet=0.22, rev_time=1.9, rev_lp=5500):
        # 리버브 (합성 IR)
        n = int(rev_time * SR)
        t = np.arange(n) / SR
        irs = []
        for _ in range(2):
            ir = filt(rng.standard_normal(n), "low", rev_lp, 2) * np.exp(-t * (6.9 / rev_time))
            ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
            irs.append(ir / np.sqrt(np.sum(ir ** 2)))
        mono = (self.L + self.R) * 0.5
        wl = fftconvolve(mono, irs[0])[: len(self.L)]
        wr = fftconvolve(mono, irs[1])[: len(self.R)]
        L = self.L + wl * wet * 6
        R = self.R + wr * wet * 6
        # 꼬리를 앞쪽으로 접어 끊김 없는 루프 만들기
        tail = len(L) - self.loop_len
        L[:tail] += L[self.loop_len:]
        R[:tail] += R[self.loop_len:]
        L, R = L[: self.loop_len], R[: self.loop_len]
        out = np.stack([L, R], 1)
        out = filt(out.T, "high", 28, 2).T  # 초저역 제거
        peak = np.max(np.abs(out))
        out = out / peak * 0.89
        out = np.tanh(out * 1.15) / np.tanh(1.15)
        return out


def save(name, audio, title):
    wav = OUT / f"{name}.wav"
    wavfile.write(wav, SR, (audio * 32767).astype(np.int16))
    mp3 = OUT / f"{name}.mp3"
    # 곡마다 음량을 -18 LUFS로 맞춤 (효과음/빗소리와 섞이기 좋은 BGM 음량)
    m = subprocess.run(["ffmpeg", "-hide_banner", "-i", str(wav), "-af", "ebur128", "-f", "null", "-"], capture_output=True, text=True).stderr
    lufs = float([l for l in m.splitlines() if l.strip().startswith("I:")][-1].split()[1])
    gain_db = -18.0 - lufs
    subprocess.run([
        "ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-af", f"volume={gain_db:.2f}dB",
        "-codec:a", "libmp3lame", "-b:a", "128k",
        "-metadata", f"title={title}", "-metadata", "artist=Metro Cafe Tycoon OST",
        "-metadata", "album=Metro Cafe Tycoon BGM", str(mp3)], check=True)
    wav.unlink()
    print(f"{mp3.name}: {len(audio)/SR:.1f}s, {mp3.stat().st_size/1024:.0f}KB")


# ------------------------------------------------------------ 곡 정의 ----
def play_chord_roll(T, fn, bar, beat, notes, gain, pan=0.0, dur_beats=2, roll=0.03):
    for i, m in enumerate(notes):
        T.add(fn(mtof(m), T.dur(dur_beats), 0.55), bar, beat + i * roll / T.spb, pan=pan + (i - 1.5) * 0.06, gain=gain)


def melody(T, fn, bars_notes, gain, pan=0.0, repeat=2, octave_shift=None, **kw):
    for rep in range(repeat):
        for b, notes in enumerate(bars_notes):
            for beat, m, d in notes:
                sh = octave_shift[rep] if octave_shift else 0
                T.add(fn(mtof(m + sh), T.dur(d), **kw) if kw else fn(mtof(m + sh), T.dur(d)), rep * len(bars_notes) + b, beat, pan=pan, gain=gain, humanize=0.004)


# 1) Morning Cafe ---------------------------------------------------------
def morning_cafe():
    T = Track(bpm=96, bars=16)
    chords = {
        "Cmaj7": (36, [52, 55, 59, 64]), "Am7": (33, [52, 55, 60, 64]), "Fmaj7": (29, [53, 57, 60, 64]),
        "G6": (31, [50, 55, 59, 64]), "Em7": (40, [55, 59, 62, 64]), "G7": (31, [50, 55, 59, 65]),
    }
    prog = ["Cmaj7", "Am7", "Fmaj7", "G6", "Cmaj7", "Em7", "Fmaj7", "G7"]
    mel = [
        [(0, 76, 1), (1, 79, .5), (1.5, 76, .5), (2, 74, 1), (3, 72, 1)],
        [(0, 69, 1.5), (1.5, 72, .5), (2, 76, 1), (3, 74, 1)],
        [(0, 72, 1), (1, 69, 1), (2, 67, .5), (2.5, 69, .5), (3, 72, 1)],
        [(0, 71, 1.5), (1.5, 74, .5), (2, 79, 2)],
        [(0, 76, 1), (1, 79, .5), (1.5, 81, .5), (2, 79, 1), (3, 76, 1)],
        [(0, 74, 1), (1, 76, 1), (2, 79, 1), (3, 76, .5), (3.5, 74, .5)],
        [(0, 72, 1.5), (1.5, 69, .5), (2, 72, 1), (3, 76, 1)],
        [(0, 74, 1), (1, 71, 1), (2, 67, 2)],
    ]
    pat = [0, 1, 2, 3, 2, 1, 2, 3]
    for bar in range(16):
        name = prog[bar % 8]
        root, up = chords[name]
        for i, idx in enumerate(pat):
            T.add(pluck(mtof(up[idx] + 0), T.dur(.6), 0.55 if i % 2 == 0 else 0.4), bar, i * .5, pan=-0.3, gain=0.55 if bar < 8 else 0.62)
        T.add(bass(mtof(root + 12), T.dur(1.6), .8), bar, 0, gain=0.9)
        T.add(bass(mtof(root + 19), T.dur(1.2), .6), bar, 2, gain=0.7)
        T.add(pad(mtof(up[0]), T.dur(4), .5), bar, 0, gain=0.5, pan=0.2) if bar % 2 == 0 else None
        # 드럼: 가벼운 킥/브러시/셰이커
        T.add(kick(.55), bar, 0, gain=0.75)
        T.add(kick(.4), bar, 2.5, gain=0.5)
        T.add(brush(.7, .2), bar, 1, gain=1.0)
        T.add(brush(.7, .2), bar, 3, gain=1.0)
        for i in range(8):
            T.add(shaker(.4 if i % 2 else .6), bar, i * .5, pan=0.35, gain=0.9)
    for rep in range(2):
        for b, notes in enumerate(mel):
            for beat, m, d in notes:
                T.add(ep(mtof(m), T.dur(d), .7, 0.8), rep * 8 + b, beat, pan=0.1, gain=0.85, humanize=0.004)
                if rep == 1:  # 2번째 반복은 뮤직박스가 옥타브 위에서 반짝임
                    T.add(musicbox(mtof(m + 12), T.dur(d), .45), rep * 8 + b, beat, pan=0.35, gain=0.45, humanize=0.004)
    return T.finish(wet=0.20, rev_time=1.6)


# 2) Rainy Day ------------------------------------------------------------
def rainy_day():
    T = Track(bpm=70, bars=16)
    ch = {
        "Am9": (33, [60, 64, 67, 71]), "Fmaj7": (29, [57, 60, 64, 67]), "Dm9": (38, [60, 64, 65, 69]),
        "E7": (40, [56, 59, 62, 64]), "C": (36, [55, 60, 64, 67]),
    }
    prog = ["Am9", "Fmaj7", "Dm9", "E7", "Am9", "C", "Fmaj7", "E7"]
    mel = [
        [(0, 76, 2), (2, 74, 1), (3, 72, 1)],
        [(0, 72, 1.5), (1.5, 69, .5), (2, 71, 2)],
        [(0, 69, 2), (2, 72, 1), (3, 74, 1)],
        [(0, 76, 1.5), (1.5, 74, .5), (2, 71, 2)],
        [(0, 72, 1), (1, 76, 1), (2, 79, 2)],
        [(0, 76, 1.5), (1.5, 74, .5), (2, 72, 2)],
        [(0, 69, 1), (1, 72, 1), (2, 74, 1), (3, 72, 1)],
        [(0, 71, 1), (1, 68, 1), (2, 69, 2)],
    ]
    for bar in range(16):
        root, up = ch[prog[bar % 8]]
        play_chord_roll(T, ep, bar, 0, up, 0.7, pan=-0.2, dur_beats=2.2, roll=0.05)
        play_chord_roll(T, ep, bar, 2, up[1:], 0.4, pan=-0.2, dur_beats=1.8, roll=0.06)
        for i, m in enumerate(up[:3]):
            T.add(pad(mtof(m - 12), T.dur(4), .55), bar, 0, gain=0.55, pan=-0.4 + i * 0.4) if bar % 2 == 0 else None
        T.add(bass(mtof(root + 12), T.dur(3), .8), bar, 0, gain=0.85)
        T.add(brush(.5, .25), bar, 1, gain=0.8)
        T.add(brush(.5, .25), bar, 3, gain=0.8)
        T.add(hat(.3), bar, 2.5, gain=0.6, pan=0.3)
    for rep in range(2):
        for b, notes in enumerate(mel):
            for beat, m, d in notes:
                T.add(ep(mtof(m + (12 if rep == 1 and b in (3, 7) else 0)), T.dur(d), .75, 1.1), rep * 8 + b, beat, pan=0.15, gain=0.95, humanize=0.01)
    return T.finish(wet=0.34, rev_time=2.6, rev_lp=4200)


# 3) Sweet Dessert --------------------------------------------------------
def sweet_dessert():
    T = Track(bpm=112, bars=16)
    ch = {
        "Fmaj7": (29, [57, 60, 64, 69]), "Dm7": (38, [57, 60, 65, 69]), "Gm7": (31, [58, 62, 65, 67]),
        "C7": (36, [55, 58, 64, 67]), "Am7": (33, [55, 60, 64, 67]), "Bbmaj7": (34, [57, 62, 65, 69]),
    }
    prog = ["Fmaj7", "Dm7", "Gm7", "C7", "Fmaj7", "Am7", "Bbmaj7", "C7"]
    nxt = {"Fmaj7": 31, "Dm7": 31, "Gm7": 36, "C7": 29, "Am7": 34, "Bbmaj7": 36}
    mel = [
        [(0, 69, .5), (.5, 72, .5), (1, 76, 1), (2, 72, .5), (2.5, 69, .5), (3, 67, 1)],
        [(0, 65, .5), (.5, 69, .5), (1, 74, 1), (2, 72, 1), (3, 69, 1)],
        [(0, 70, .5), (.5, 74, .5), (1, 77, 1), (2, 74, .5), (2.5, 70, .5), (3, 67, 1)],
        [(0, 67, 1), (1, 70, .5), (1.5, 72, .5), (2, 76, 1.5), (3.5, 72, .5)],
        [(0, 77, 1), (1, 76, .5), (1.5, 72, .5), (2, 69, 1), (3, 72, 1)],
        [(0, 72, .5), (.5, 76, .5), (1, 79, 1), (2, 76, .5), (2.5, 72, .5), (3, 69, 1)],
        [(0, 74, 1), (1, 77, 1), (2, 74, .5), (2.5, 72, .5), (3, 70, 1)],
        [(0, 72, .5), (.5, 70, .5), (1, 67, 1), (2, 64, .5), (2.5, 67, .5), (3, 70, 1)],
    ]
    for bar in range(16):
        name = prog[bar % 8]
        root, up = ch[name]
        T.add(bass(mtof(root + 12), T.dur(.9), .85), bar, 0, gain=0.9)
        T.add(bass(mtof(root + 19), T.dur(.9), .7), bar, 2, gain=0.8)
        T.add(bass(mtof(nxt[name] + 12), T.dur(.45), .6), bar, 3.5, gain=0.6)
        for beat in (1, 3):  # 오프비트 피치카토
            for i, m in enumerate(up):
                T.add(pluck(mtof(m), T.dur(.3), .5), bar, beat, pan=-0.35 + i * 0.05, gain=0.5, humanize=0.004)
        T.add(kick(.6), bar, 0, gain=0.7)
        T.add(kick(.5), bar, 2, gain=0.65)
        T.add(rimclick(.7), bar, 1, gain=0.7)
        T.add(rimclick(.7), bar, 3, gain=0.7)
        for i in range(8):
            T.add(hat(.35 if i % 2 else .55), bar, i * .5, pan=0.3, gain=0.8)
        if bar % 2 == 0:
            T.add(pad(mtof(up[0]), T.dur(8), .4), bar, 0, gain=0.4, pan=0.2)
    for rep in range(2):
        for b, notes in enumerate(mel):
            for beat, m, d in notes:
                T.add(marimba(mtof(m + 12 * rep if rep == 1 and b % 4 == 3 else m), T.dur(d), .8), rep * 8 + b, beat, pan=0.15, gain=0.95, humanize=0.004)
                if rep == 1:
                    T.add(musicbox(mtof(m + 12), T.dur(d), .6), rep * 8 + b, beat, pan=0.4, gain=0.55, humanize=0.004)
    return T.finish(wet=0.17, rev_time=1.4, rev_lp=7000)


# 4) Midnight Jazz --------------------------------------------------------
def midnight_jazz():
    T = Track(bpm=88, bars=16, swing=True)
    ch = {
        "Dm7": (38, [53, 57, 60, 64], [50, 53, 57, 54]), "G7": (31, [53, 59, 62, 67], [43, 47, 50, 49]),
        "Cmaj7": (36, [52, 59, 62, 67], [48, 52, 55, 46]), "A7": (33, [55, 61, 64, 67], [45, 49, 52, 40]),
    }
    prog = ["Dm7", "G7", "Cmaj7", "A7", "Dm7", "G7", "Cmaj7", "A7"]
    # 베이스 워킹 (음역 낮춤)
    walk_fix = {"Dm7": [38, 41, 45, 42], "G7": [43, 47, 50, 49], "Cmaj7": [48, 52, 55, 46], "A7": [45, 49, 52, 40]}
    mel = [
        [(0, 74, 1), (1, 72, .5), (1.5, 69, .5), (2, 65, 2)],
        [(0, 67, 1), (1, 71, 1), (2, 74, 1.5), (3.5, 72, .5)],
        [(0, 71, 2), (2, 67, 1), (3, 64, 1)],
        [(0, 61, 1), (1, 64, 1), (2, 67, 1), (3, 69, 1)],
        [(0, 74, 1.5), (1.5, 77, .5), (2, 76, 1), (3, 74, 1)],
        [(0, 71, 1), (1, 74, .5), (1.5, 77, .5), (2, 76, 1), (3, 74, 1)],
        [(0, 72, 1), (1, 76, 1), (2, 79, 1.5), (3.5, 76, .5)],
        [(0, 73, 1), (1, 76, .5), (1.5, 73, .5), (2, 69, 2)],
    ]
    for bar in range(16):
        name = prog[bar % 8]
        root, up, _ = ch[name]
        for i, m in enumerate(walk_fix[name]):
            T.add(upright(mtof(m + (0 if m < 52 else 0)), T.dur(.92), .75 if i % 2 == 0 else .6), bar, i, gain=0.95, humanize=0.008)
        hits = [0, 2.5] if bar % 2 == 0 else [0.5, 2]
        if bar % 4 == 3:
            hits = [1.5, 3]
        for h in hits:
            for i, m in enumerate(up):
                T.add(piano(mtof(m), T.dur(.8), .5), bar, h, pan=-0.2 + i * 0.05, gain=0.8, humanize=0.012)
        # 브러시 라이드 + 풋 하이햇
        for beat in (0, 1, 1.5, 2, 3, 3.5):
            T.add(brush(.55 if beat % 1 == 0 else .4, .14), bar, beat, pan=0.25, gain=0.9, humanize=0.005)
        for beat in (1, 3):
            T.add(hat(.45), bar, beat, pan=0.2, gain=0.8)
        if bar % 2 == 0:
            T.add(pad(mtof(up[0]), T.dur(8), .3), bar, 0, gain=0.3, pan=-0.3)
    for rep in range(2):
        for b, notes in enumerate(mel):
            for beat, m, d in notes:
                T.add(lead_flute(mtof(m + (12 if rep == 1 and b in (0, 4) else 0)), T.dur(d * 0.95), .85 if rep == 0 else 0.95), rep * 8 + b, beat, pan=0.12, gain=0.95, humanize=0.006)
    return T.finish(wet=0.27, rev_time=2.2, rev_lp=5000)


if __name__ == "__main__":
    save("morning-cafe", morning_cafe(), "Morning Cafe")
    save("rainy-day", rainy_day(), "Rainy Day")
    save("sweet-dessert", sweet_dessert(), "Sweet Dessert")
    save("midnight-jazz", midnight_jazz(), "Midnight Jazz")
