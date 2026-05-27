import { TaskDifficulty } from '../tasks/task.entity';
import { ChildClass }     from '../children/child.entity';

export const XP_BY_DIFFICULTY: Record<TaskDifficulty, number> = {
  easy:       10,
  medium:     25,
  hard:       50,
  very_hard:  100,
  legendary:  200,
};

// XP needed to go from level N to N+1
export function xpToNextLevel(level: number): number {
  return Math.floor(50 * Math.pow(level, 1.6));
}

// Compute level from total cumulative XP
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

// XP spent to reach current level (floor of current level)
export function getXpForCurrentLevel(xp: number): number {
  let level = 1;
  let spent = 0;
  while (true) {
    const needed = xpToNextLevel(level);
    if (spent + needed > xp) return xp - spent;
    spent += needed;
    level++;
  }
}

type LevelTier = { minLevel: number; title: string; emoji: Record<ChildClass, string> };

const LEVEL_TIERS: LevelTier[] = [
  {
    minLevel: 1,
    title: 'Apprenti',
    emoji: { warrior: '🧒⚔️', archer: '🧒🏹', mage: '🧒✨', rogue: '🧒🗡️', paladin: '🧒🛡️' },
  },
  {
    minLevel: 5,
    title: 'Aventurier',
    emoji: { warrior: '🧑⚔️', archer: '🧑🏹', mage: '🧑✨', rogue: '🧑🗡️', paladin: '🧑🛡️' },
  },
  {
    minLevel: 10,
    title: 'Héros',
    emoji: { warrior: '🦸⚔️', archer: '🦸🏹', mage: '🦸✨', rogue: '🦸🗡️', paladin: '🦸🛡️' },
  },
  {
    minLevel: 20,
    title: 'Champion',
    emoji: { warrior: '👑⚔️', archer: '👑🏹', mage: '👑✨', rogue: '👑🗡️', paladin: '👑🛡️' },
  },
  {
    minLevel: 35,
    title: 'Légende',
    emoji: { warrior: '🌟⚔️', archer: '🌟🏹', mage: '🌟✨', rogue: '🌟🗡️', paladin: '🌟🛡️' },
  },
];

export function getTierForLevel(level: number): LevelTier {
  return [...LEVEL_TIERS].reverse().find(t => level >= t.minLevel) ?? LEVEL_TIERS[0];
}

export function getLevelTitle(level: number): string {
  return getTierForLevel(level).title;
}

export function getLevelEmoji(level: number, cls: ChildClass): string {
  return getTierForLevel(level).emoji[cls];
}
