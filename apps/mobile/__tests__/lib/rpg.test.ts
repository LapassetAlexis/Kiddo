/**
 * Tests unitaires pour lib/rpg.ts
 * Fonctions pures — aucun mock nécessaire.
 */

import {
  getLevelFromXp,
  getLevelTitle,
  getXpProgress,
  XP_BY_DIFFICULTY,
  CLASS_LABELS,
  CLASS_EMOJI,
  DIFFICULTY_LABELS,
  DIFFICULTY_EMOJI,
} from '@/lib/rpg';

// Seuils cumulés utiles dans les tests
// Niveau 1 → 50 XP pour passer au niveau 2  (Math.floor(50 * 1^1.6) = 50)
// Niveau 2 → 151 XP pour passer au niveau 3 (Math.floor(50 * 2^1.6) = 151)
// Niveau 3 → 291 XP pour passer au niveau 4 (Math.floor(50 * 3^1.6) = 291)
const L1 = 50;        // xpToNextLevel(1)
const L2 = 151;       // xpToNextLevel(2)

describe('getLevelFromXp', () => {
  it('retourne 1 avec 0 XP', () => {
    expect(getLevelFromXp(0)).toBe(1);
  });

  it('reste niveau 1 juste sous le seuil (49 XP)', () => {
    expect(getLevelFromXp(L1 - 1)).toBe(1);
  });

  it('passe au niveau 2 exactement à 50 XP', () => {
    expect(getLevelFromXp(L1)).toBe(2);
  });

  it('passe au niveau 3 une fois les seuils des niveaux 1 et 2 cumulés atteints', () => {
    expect(getLevelFromXp(L1 + L2)).toBe(3);
  });
});

describe('getLevelTitle', () => {
  it('niveau 1 → "Apprenti"', () => {
    expect(getLevelTitle(1)).toBe('Apprenti');
  });

  it('niveau 4 → "Apprenti" (en-dessous du seuil 5)', () => {
    expect(getLevelTitle(4)).toBe('Apprenti');
  });

  it('niveau 5 → "Aventurier"', () => {
    expect(getLevelTitle(5)).toBe('Aventurier');
  });

  it('niveau 10 → "Héros"', () => {
    expect(getLevelTitle(10)).toBe('Héros');
  });

  it('niveau 20 → "Champion"', () => {
    expect(getLevelTitle(20)).toBe('Champion');
  });

  it('niveau 35 → "Légende"', () => {
    expect(getLevelTitle(35)).toBe('Légende');
  });
});

describe('getXpProgress', () => {
  it('0 XP → { current: 0, total: 50 } (niveau 1, rien de dépensé)', () => {
    expect(getXpProgress(0)).toEqual({ current: 0, total: L1 });
  });

  it('50 XP → { current: 0, total: 151 } (début du niveau 2)', () => {
    expect(getXpProgress(L1)).toEqual({ current: 0, total: L2 });
  });

  it('75 XP → { current: 25, total: 151 } (25 XP dans le niveau 2)', () => {
    expect(getXpProgress(L1 + 25)).toEqual({ current: 25, total: L2 });
  });
});

describe('XP_BY_DIFFICULTY', () => {
  it('easy → 10', () => {
    expect(XP_BY_DIFFICULTY.easy).toBe(10);
  });

  it('medium → 25', () => {
    expect(XP_BY_DIFFICULTY.medium).toBe(25);
  });

  it('hard → 50', () => {
    expect(XP_BY_DIFFICULTY.hard).toBe(50);
  });

  it('very_hard → 100', () => {
    expect(XP_BY_DIFFICULTY.very_hard).toBe(100);
  });

  it('legendary → 200', () => {
    expect(XP_BY_DIFFICULTY.legendary).toBe(200);
  });
});

describe('CLASS_LABELS', () => {
  const keys: Array<keyof typeof CLASS_LABELS> = ['warrior', 'archer', 'mage', 'rogue', 'paladin'];

  it.each(keys)('CLASS_LABELS.%s est une chaîne non vide', key => {
    expect(typeof CLASS_LABELS[key]).toBe('string');
    expect(CLASS_LABELS[key].length).toBeGreaterThan(0);
  });
});

describe('CLASS_EMOJI', () => {
  const keys: Array<keyof typeof CLASS_EMOJI> = ['warrior', 'archer', 'mage', 'rogue', 'paladin'];

  it.each(keys)('CLASS_EMOJI.%s est une chaîne non vide', key => {
    expect(typeof CLASS_EMOJI[key]).toBe('string');
    expect(CLASS_EMOJI[key].length).toBeGreaterThan(0);
  });
});

describe('DIFFICULTY_LABELS', () => {
  const keys: Array<keyof typeof DIFFICULTY_LABELS> = ['easy', 'medium', 'hard', 'very_hard', 'legendary'];

  it.each(keys)('DIFFICULTY_LABELS.%s est une chaîne non vide', key => {
    expect(typeof DIFFICULTY_LABELS[key]).toBe('string');
    expect(DIFFICULTY_LABELS[key].length).toBeGreaterThan(0);
  });
});

describe('DIFFICULTY_EMOJI', () => {
  const keys: Array<keyof typeof DIFFICULTY_EMOJI> = ['easy', 'medium', 'hard', 'very_hard', 'legendary'];

  it.each(keys)('DIFFICULTY_EMOJI.%s est une chaîne non vide', key => {
    expect(typeof DIFFICULTY_EMOJI[key]).toBe('string');
    expect(DIFFICULTY_EMOJI[key].length).toBeGreaterThan(0);
  });
});
