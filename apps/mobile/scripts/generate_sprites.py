#!/usr/bin/env python3
"""
generate_sprites.py — Kiddo LPC sprite generation pipeline

Generates two categories of walk strips (832×256, 4 dirs × 13 frames):

  1. Base bodies — body + hair + legs + shoes, NO torso armor
     Output: lpc_{id}_base.png  (one per character, 8 total)

  2. Equipment items — single transparent layer each
     Output: item_{slot}_{name}.png  (torso, weapon, legs, helm, etc.)

HeroSprite stacks base + equipped items at render time.
No per-tier compositing — items are independent.

Usage:
    pip3 install Pillow requests
    python3 apps/mobile/scripts/generate_sprites.py [--probe] [--only bases|items]

Options:
    --probe         Check which LPC layer paths exist (no generation)
    --only bases    Only regenerate base body strips
    --only items    Only regenerate equipment item strips

Cache: apps/mobile/scripts/.sprite_cache/ (gitignored)
Layer reference: https://github.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator/tree/master/spritesheets
"""

import os
import sys
import hashlib
import requests
from PIL import Image
from io import BytesIO

# ── Config ────────────────────────────────────────────────────────────────────

REPO_RAW   = "https://raw.githubusercontent.com/sanderfrenken/Universal-LPC-Spritesheet-Character-Generator/master/spritesheets"
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CACHE_DIR  = os.path.join(SCRIPT_DIR, ".sprite_cache")
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "assets", "sprites")
FRAME_SIZE = 64
WALK_ROWS  = [8, 9, 10, 11]   # up / left / south / right (LPC standard)

os.makedirs(CACHE_DIR,  exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

SHADOW = "shadow/adult/shadow.png"

# ── Helpers ───────────────────────────────────────────────────────────────────

def fetch_layer(path: str) -> Image.Image | None:
    url        = f"{REPO_RAW}/{path}"
    cache_key  = hashlib.md5(url.encode()).hexdigest() + ".png"
    cache_path = os.path.join(CACHE_DIR, cache_key)
    if os.path.exists(cache_path):
        return Image.open(cache_path).convert("RGBA")
    try:
        r = requests.get(url, timeout=20)
        if r.status_code != 200:
            print(f"    ⚠  {r.status_code}: {path}")
            return None
        img = Image.open(BytesIO(r.content)).convert("RGBA")
        img.save(cache_path)
        return img
    except Exception as e:
        print(f"    ⚠  {e}: {path}")
        return None

def composite(layers: list[str]) -> Image.Image | None:
    base = None
    for path in layers:
        layer = fetch_layer(path)
        if layer is None:
            continue
        if base is None:
            base = Image.new("RGBA", layer.size, (0, 0, 0, 0))
        if layer.size != base.size:
            layer = layer.resize(base.size, Image.NEAREST)
        base = Image.alpha_composite(base, layer)
    return base

def walk_strip(sheet: Image.Image) -> Image.Image:
    strip = Image.new("RGBA", (sheet.width, FRAME_SIZE * len(WALK_ROWS)))
    for i, row in enumerate(WALK_ROWS):
        band = sheet.crop((0, row * FRAME_SIZE, sheet.width, (row + 1) * FRAME_SIZE))
        strip.paste(band, (0, i * FRAME_SIZE))
    return strip

def save(layers: list[str], filename: str) -> bool:
    sheet = composite(layers)
    if sheet is None:
        print(f"    ✗ no layers loaded")
        return False
    strip = walk_strip(sheet)
    out = os.path.join(OUTPUT_DIR, filename)
    strip.save(out)
    print(f"    ✓ {filename}")
    return True


# ── Base bodies ───────────────────────────────────────────────────────────────
# Extracted directly from the original full LPC sheets (lpc_*.png) bundled in the
# project — same visual quality and style as before. Walk rows 8-11 → 832×256px.
# No LPC repo download needed for bases.

BASE_ORIGINALS = {
    "m_1": "lpc_m_1.png",
    "m_2": "lpc_m_2.png",
    "m_3": "lpc_m_3.png",
    "m_4": "lpc_m_4.png",
    "f_1": "lpc_f_1.png",
    "f_2": "lpc_f_2.png",
    "f_3": "lpc_f_3.png",
    "f_4": "lpc_f_4.png",
}

# ── Equipment items ───────────────────────────────────────────────────────────
# Each item is a SINGLE transparent layer — rendered on top of the base body.
# filename → [lpc layer paths]
#
# Naming convention: item_{slot}_{name}.png
#   slots: torso, legs, weapon, helm, cape
#
# Add new items here freely; they'll be auto-generated and available for equip.

ITEMS: dict[str, list[str]] = {
    # ── Torso ──────────────────────────────────────────────────────────────
    # Civilian shirts (T1 default per character class)
    "item_torso_shirt_blue":       ["torso/clothes/vest/male/blue.png"],
    "item_torso_shirt_brown":      ["torso/clothes/vest/male/brown.png"],
    "item_torso_shirt_forest":     ["torso/clothes/vest/male/forest.png"],
    "item_torso_shirt_white":      ["torso/clothes/longsleeve/laced/male/white.png"],
    "item_torso_blouse_blue":      ["torso/clothes/blouse_longsleeve/female/blue.png"],
    "item_torso_blouse_red":       ["torso/clothes/blouse_longsleeve/female/red.png"],
    "item_torso_blouse_purple":    ["torso/clothes/blouse_longsleeve/female/purple.png"],

    # Leather armor (T2 — level 10)
    "item_torso_leather_brown":    ["torso/armour/leather/male/brown.png"],
    "item_torso_leather_tan":      ["torso/armour/leather/male/tan.png"],
    "item_torso_leather_forest":   ["torso/armour/leather/male/forest.png"],
    "item_torso_leather_walnut":   ["torso/armour/leather/male/walnut.png"],
    "item_torso_leather_purple_f": ["torso/armour/leather/female/purple.png"],
    "item_torso_leather_red_f":    ["torso/armour/leather/female/red.png"],
    "item_torso_leather_green_f":  ["torso/armour/leather/female/green.png"],

    # Plate armor (T3 — level 20)
    "item_torso_plate_iron":       ["torso/armour/plate/male/iron.png"],
    "item_torso_plate_bronze":     ["torso/armour/plate/male/bronze.png"],
    "item_torso_plate_steel":      ["torso/armour/plate/male/steel.png"],
    "item_torso_plate_brass":      ["torso/armour/plate/male/brass.png"],
    "item_torso_plate_iron_f":     ["torso/armour/plate/female/iron.png"],

    # Legendary armor (T4 — level 35)
    "item_torso_plate_gold":       ["torso/armour/plate/male/gold.png"],
    "item_torso_plate_gold_f":     ["torso/armour/plate/female/gold.png"],
    "item_torso_leather_lavender": ["torso/armour/leather/female/lavender.png"],

    # ── Legs ───────────────────────────────────────────────────────────────
    "item_legs_plate_iron":        ["legs/armour/plate/male/iron.png"],
    "item_legs_plate_bronze":      ["legs/armour/plate/male/bronze.png"],
    "item_legs_plate_steel":       ["legs/armour/plate/male/steel.png"],
    "item_legs_plate_gold":        ["legs/armour/plate/male/gold.png"],
    "item_legs_plate_iron_f":      ["legs/armour/plate/female/iron.png"],
    "item_legs_plate_gold_f":      ["legs/armour/plate/female/gold.png"],
    "item_legs_plate_brass":       ["legs/armour/plate/male/brass.png"],

    # ── Weapons ────────────────────────────────────────────────────────────
    # Dagger: behind layer (right/left/up) + front layer (south)
    "item_weapon_dagger":          ["weapon/sword/dagger/dagger.png"],
    "item_weapon_dagger_behind":   ["weapon/sword/dagger/behind/dagger.png"],
    # Mace: single universal front layer
    "item_weapon_mace":            ["weapon/blunt/mace/mace.png"],
    # Arming sword: single universal front (right + south visible)
    "item_weapon_arming_sword":    ["weapon/sword/arming/universal/fg.png"],
    # Longsword: behind layer (right/left/up) + front layer (south)
    "item_weapon_longsword":       ["weapon/sword/longsword/universal_behind/longsword.png"],
    "item_weapon_longsword_front": ["weapon/sword/longsword/longsword.png"],
    # Ranged
    "item_weapon_crossbow":        ["weapon/ranged/crossbow/crossbow.png"],
    "item_weapon_boomerang":       ["weapon/ranged/boomerang/boomerang.png"],
    # Staves: behind layer (right/left/up) + front layer (south)
    "item_weapon_staff_gnarled":         ["weapon/magic/gnarled/universal/foreground.png"],
    "item_weapon_staff_gnarled_behind":  ["weapon/magic/gnarled/universal/background.png"],
    "item_weapon_staff_crystal":         ["weapon/magic/crystal/universal/foreground.png"],
    "item_weapon_staff_crystal_behind":  ["weapon/magic/crystal/universal/background.png"],
    "item_weapon_staff_loop":            ["weapon/magic/loop/universal/foreground.png"],
    "item_weapon_staff_loop_behind":     ["weapon/magic/loop/universal/background.png"],
    "item_weapon_staff_diamond":         ["weapon/magic/s/universal/foreground.png"],
    "item_weapon_staff_diamond_behind":  ["weapon/magic/s/universal/background.png"],
    # Shield: single universal front layer (right + south visible)
    "item_shield_heater_wood":     ["shield/heater/original/wood/fg.png"],

    # ── Helm ───────────────────────────────────────────────────────────────
    "item_helm_nasal_steel":       ["hat/helmet/nasal/adult/steel.png"],
    "item_helm_nasal_bronze":      ["hat/helmet/nasal/adult/bronze.png"],
    "item_helm_nasal_iron":        ["hat/helmet/nasal/adult/iron.png"],
    "item_helm_nasal_gold":        ["hat/helmet/nasal/adult/gold.png"],
    "item_helm_wizard_base":       ["hat/magic/wizard/base/adult.png"],
    "item_helm_wizard_belt":       ["hat/magic/wizard/belt/adult.png"],
    "item_helm_wizard_buckle":     ["hat/magic/wizard/buckle/adult.png"],
}

# ── Auto-equip by level tier ──────────────────────────────────────────────────
# Defines which items each character automatically wears at each level tier.
# Keys: character id → { minLevel: [item keys] }
# Used by getEquippedItems(preset, level) in character-presets.ts

LEVEL_GEAR: dict[str, dict[int, list[str]]] = {
    "m_1": {
        1:  ["item_torso_shirt_blue"],
        10: ["item_torso_leather_brown", "item_weapon_longsword"],
        20: ["item_torso_plate_iron",    "item_legs_plate_iron"],
        35: ["item_torso_plate_gold",    "item_legs_plate_gold", "item_helm_crown", "item_weapon_longsword"],
    },
    "m_2": {
        1:  ["item_torso_shirt_brown"],
        10: ["item_torso_leather_tan",    "item_weapon_longsword"],
        20: ["item_torso_plate_bronze",   "item_legs_plate_bronze"],
        35: ["item_torso_plate_gold",     "item_legs_plate_gold",  "item_helm_crown", "item_weapon_longsword"],
    },
    "m_3": {
        1:  ["item_torso_shirt_forest"],
        10: ["item_torso_leather_forest", "item_weapon_crossbow"],
        20: ["item_torso_leather_forest", "item_weapon_crossbow"],
        35: ["item_torso_plate_brass",    "item_legs_plate_brass", "item_weapon_boomerang"],
    },
    "m_4": {
        1:  ["item_torso_shirt_white"],
        10: ["item_torso_leather_walnut", "item_weapon_longsword"],
        20: ["item_torso_plate_steel",    "item_legs_plate_steel", "item_weapon_longsword"],
        35: ["item_torso_plate_gold",     "item_legs_plate_gold",  "item_helm_crown", "item_weapon_longsword"],
    },
    "f_1": {
        1:  ["item_torso_blouse_blue"],
        10: ["item_torso_leather_purple_f",  "item_weapon_staff_gnarled"],
        20: ["item_torso_leather_purple_f",  "item_helm_wizard_base", "item_weapon_staff_crystal"],
        35: ["item_torso_leather_lavender",  "item_helm_wizard_buckle", "item_helm_crown", "item_weapon_staff_diamond"],
    },
    "f_2": {
        1:  ["item_torso_blouse_red"],
        10: ["item_torso_leather_red_f",  "item_weapon_longsword"],
        20: ["item_torso_plate_iron_f",   "item_legs_plate_iron_f"],
        35: ["item_torso_plate_gold_f",   "item_legs_plate_gold_f", "item_helm_crown", "item_weapon_longsword"],
    },
    "f_3": {
        1:  ["item_torso_leather_forest"],
        10: ["item_torso_leather_green_f",  "item_weapon_crossbow"],
        20: ["item_torso_leather_forest",   "item_weapon_crossbow"],
        35: ["item_torso_plate_brass",      "item_legs_plate_brass",  "item_weapon_boomerang"],
    },
    "f_4": {
        1:  ["item_torso_blouse_purple"],
        10: ["item_torso_leather_purple_f",  "item_weapon_staff_gnarled"],
        20: ["item_torso_leather_purple_f",  "item_helm_wizard_base", "item_weapon_staff_crystal"],
        35: ["item_torso_leather_lavender",  "item_helm_wizard_buckle", "item_helm_crown", "item_weapon_staff_diamond"],
    },
}


# ── Generation ────────────────────────────────────────────────────────────────

def generate_bases() -> tuple[int, int]:
    print("\n── Base bodies (extracted from original sprites) ────────")
    ok, total = 0, 0
    for char_id, src_file in BASE_ORIGINALS.items():
        total += 1
        src_path = os.path.join(OUTPUT_DIR, src_file)
        out_path = os.path.join(OUTPUT_DIR, f"lpc_{char_id}_base.png")
        try:
            sheet = Image.open(src_path).convert("RGBA")
            strip = walk_strip(sheet)
            strip.save(out_path)
            print(f"    ✓ lpc_{char_id}_base.png  ({strip.size[0]}×{strip.size[1]})")
            ok += 1
        except Exception as e:
            print(f"    ✗ lpc_{char_id}_base.png — {e}")
    return ok, total


def generate_items() -> tuple[int, int]:
    print("\n── Equipment items ──────────────────────────────────────")
    ok, total = 0, 0
    for name, layers in ITEMS.items():
        total += 1
        if save(layers, f"{name}.png"):
            ok += 1
    return ok, total


def probe_all() -> None:
    all_paths: set[str] = set()
    for layers in BASE_BODIES.values():
        all_paths.update(layers)
    for layers in ITEMS.values():
        all_paths.update(layers)
    print(f"Probing {len(all_paths)} unique layer paths…\n")
    for path in sorted(all_paths):
        r = requests.head(f"{REPO_RAW}/{path}", timeout=8)
        status = "✓" if r.status_code == 200 else f"✗ {r.status_code}"
        print(f"  {status}  {path}")


def export_level_gear() -> None:
    """Print LEVEL_GEAR as a TypeScript const for character-presets.ts."""
    print("\n── LEVEL_GEAR TypeScript export ─────────────────────────")
    print("export const LEVEL_GEAR: Record<string, Record<number, string[]>> = {")
    for char_id, tiers in LEVEL_GEAR.items():
        print(f"  {char_id!r}: {{")
        for lvl, items in sorted(tiers.items()):
            items_str = ", ".join(f"{i!r}" for i in items)
            print(f"    {lvl}: [{items_str}],")
        print("  },")
    print("};")


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    args      = sys.argv[1:]
    do_probe  = "--probe" in args
    only      = args[args.index("--only") + 1] if "--only" in args else None
    do_export = "--export-gear" in args

    if do_probe:
        probe_all()
        return

    if do_export:
        export_level_gear()
        return

    b_ok = b_total = i_ok = i_total = 0

    if only != "items":
        b_ok, b_total = generate_bases()
    if only != "bases":
        i_ok, i_total = generate_items()

    print(f"\n{'═'*52}")
    print(f"  bases  : {b_ok}/{b_total}")
    print(f"  items  : {i_ok}/{i_total}")
    print(f"  output : {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
