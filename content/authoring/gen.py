# Kartları JSON destelerine yazar. Kullanım: python3 gen.py <repo>
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from cards_a import classic, who
from cards_b import confess, chaos, homeland, spicy, clean, sketch, duel

PREFIX = {"question": "q", "dare": "d", "mostLikely": "w", "neverHave": "n", "rule": "r", "curse": "cu",
          "duel": "du", "mirror": "m", "confession": "c", "minigame": "mg", "golden": "g", "tableEvent": "e", "mission": "gg", "sketch": "k", "gallery": "s"}
INPUT = {"question": "judge", "dare": "judge", "mostLikely": "votePlayer", "neverHave": "yesNo", "rule": "catch", "curse": "catch",
         "duel": "votePlayer", "mirror": "choice", "confession": "text", "minigame": "minigame", "golden": "judge", "tableEvent": "none", "mission": "catch", "sketch": "draw", "gallery": "drawAll"}
ORDER = ["id", "deck", "type", "intensity", "rarity", "target", "input", "text", "penalty", "timer", "duration", "tags", "quip", "choices", "minigame", "secret"]

def build(deck, rows):
    out, n = [], {}
    for typ, inten, target, text, pen, extra in rows:
        extra = dict(extra)
        n[typ] = n.get(typ, 0) + 1
        cid = extra.pop("id", f"{deck}-{PREFIX[typ]}-{n[typ]:02d}")
        c = {"id": cid, "deck": deck, "type": typ, "intensity": inten, "rarity": extra.pop("rarity", "common"),
             "target": target, "input": extra.pop("input", INPUT[typ]), "text": text, "penalty": pen}
        c.update(extra)
        # Her destenin birkaç kartı nadir olsun (çekilişte gümüş parıltı)
        out.append({k: c[k] for k in ORDER if k in c})
    return out

def rare_some(cards, every=7):
    for i, c in enumerate(cards):
        if c["rarity"] == "common" and c["type"] not in ("tableEvent",) and i % every == every - 1:
            c["rarity"] = "rare"
    return cards

repo = sys.argv[1]
for deck, rows in [("classic", classic), ("who", who), ("confess", confess), ("chaos", chaos), ("homeland", homeland), ("spicy", spicy), ("clean", clean), ("sketch", sketch), ("duel", duel)]:
    cards = rare_some(build(deck, rows))
    lines = ",\n".join("    " + json.dumps(c, ensure_ascii=False) for c in cards)
    with open(f"{repo}/content/cards/{deck}.json", "w") as f:
        f.write('{\n  "deck": "%s",\n  "cards": [\n%s\n  ]\n}\n' % (deck, lines))
    print(deck, len(cards))
