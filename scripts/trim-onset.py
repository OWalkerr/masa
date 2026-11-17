# Kısa efektleri asıl vuruştan başlatır: tepe değerin -24 dB altına ilk çıkılan andan 10 ms önce keser, 5 ms yumuşak giriş.
# Kullanım: python3 scripts/trim-onset.py public/sfx/paper.mp3 …
import subprocess, sys, array
for path in sys.argv[1:]:
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '44100', '-'], capture_output=True, check=True).stdout
    a = array.array('h'); a.frombytes(raw)
    peak = max(abs(x) for x in a) or 1
    thr = peak * 0.063
    i = next(i for i, x in enumerate(a) if abs(x) >= thr)
    start = max(0, i / 44100 - 0.01)
    if start < 0.03:
        print(f'{path}: zaten hemen başlıyor'); continue
    tmp = path + '.tmp.mp3'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{start:.3f}', '-i', path, '-af', 'afade=t=in:d=0.005', '-b:a', '128k', tmp], check=True)
    subprocess.run(['mv', tmp, path], check=True)
    print(f'{path}: {start*1000:.0f} ms kırpıldı')
