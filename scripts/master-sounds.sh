#!/usr/bin/env bash
# Üretilen sesleri masterlar (ffmpeg): baştaki boşluğu kırpar, sondaki uzun boşluğu keser, seviyeleri eşitler.
# Kısa efektler ortalama ≈ -20 dB, fon (vals, fitil) ≈ -26 dB; tepe en fazla -1.5 dBFS. Kullanım: bash scripts/master-sounds.sh
set -euo pipefail
cd public/sfx
for f in *.mp3; do
  name="${f%.mp3}"
  case "$name" in waltz*|fuse) target=-26; trim=0 ;; *) target=-20; trim=1 ;; esac
  src="$f"
  if [ "$trim" = 1 ]; then
    ffmpeg -v error -y -i "$f" -af "silenceremove=start_periods=1:start_threshold=-50dB:start_silence=0.01,areverse,silenceremove=start_periods=1:start_threshold=-55dB:start_silence=0.12,areverse" /tmp/_m.wav
    src=/tmp/_m.wav
  fi
  read mean peak < <(ffmpeg -hide_banner -i "$src" -af volumedetect -f null - 2>&1 | awk '/mean_volume/{m=$5} /max_volume/{p=$5} END{print m, p}')
  gain=$(python3 -c "print(round(min(-1.5 - ($peak), $target - ($mean)), 2))")
  ffmpeg -v error -y -i "$src" -af "volume=${gain}dB" -ar 44100 -b:a 128k "/tmp/_o.mp3"
  mv /tmp/_o.mp3 "$f"
  echo "$name: ortalama $mean → $(python3 -c "print(round($mean + $gain,1))") dB (kazanç $gain dB)"
done
