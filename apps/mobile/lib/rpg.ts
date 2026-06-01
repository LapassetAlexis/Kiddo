export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'very_hard' | 'legendary';
export type ChildClass     = 'warrior' | 'archer' | 'mage' | 'rogue' | 'paladin';

export const DIFFICULTY_LABELS: Record<TaskDifficulty, string> = {
  easy:       'Facile',
  medium:     'Moyen',
  hard:       'Difficile',
  very_hard:  'Très difficile',
  legendary:  'Légendaire',
};

export const DIFFICULTY_EMOJI: Record<TaskDifficulty, string> = {
  easy:       '🟢',
  medium:     '🟡',
  hard:       '🟠',
  very_hard:  '🔴',
  legendary:  '💜',
};

export const XP_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  easy:       10,
  medium:     25,
  hard:       50,
  very_hard:  100,
  legendary:  200,
};

export const CLASS_LABELS: Record<ChildClass, string> = {
  warrior: 'Guerrier',
  archer:  'Archer',
  mage:    'Mage',
  rogue:   'Voleur',
  paladin: 'Paladin',
};

export const CLASS_EMOJI: Record<ChildClass, string> = {
  warrior: '⚔️',
  archer:  '🏹',
  mage:    '🧙',
  rogue:   '🗡️',
  paladin: '🛡️',
};

function xpToNextLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.6));
}

export function getLevelFromXp(xp: number): number {
  let level = 1;
  let spent = 0;
  while (true) {
    const needed = xpToNextLevel(level);
    if (spent + needed > xp) return level;
    spent += needed;
    level++;
  }
}

const LEVEL_TIERS = [
  { minLevel: 1,  title: 'Apprenti'  },
  { minLevel: 5,  title: 'Aventurier' },
  { minLevel: 10, title: 'Héros'     },
  { minLevel: 20, title: 'Champion'  },
  { minLevel: 35, title: 'Légende'   },
];

export function getLevelTitle(level: number): string {
  return ([...LEVEL_TIERS].reverse().find(t => level >= t.minLevel) ?? LEVEL_TIERS[0]).title;
}

export function getXpProgress(xp: number): { current: number; total: number } {
  let level = 1;
  let spent = 0;
  while (true) {
    const needed = xpToNextLevel(level);
    if (spent + needed > xp) return { current: xp - spent, total: needed };
    spent += needed;
    level++;
  }
}
