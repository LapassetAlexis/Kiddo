import { View, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { getPresetSprite } from '@/lib/character-presets';

// Android GL max texture: 4096px. LPC has 51 rows:
//   64px/frame → 51×64 = 3264px ✓
//   80px/frame → 51×80 = 4080px ✓
//   96px/frame → 51×96 = 4896px ✗  (exceeds limit, image silently distorted)
// Cap LPC rendering at 80px. Paladin has 5 rows so no constraint at normal sizes.
const LPC_MAX = 80;

const PALADIN_COLS = 10;
const PALADIN_ROWS = 5;
const PALADIN_FRAMES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const PALADIN_MS = 120;
function paladinRow(level: number): number {
  if (level <= 10) return 0;
  if (level <= 20) return 1;
  if (level <= 30) return 2;
  if (level <= 40) return 3;
  return 4;
}

const LPC_COLS = 13;
const LPC_ROWS = 51;
const LPC_WALK = { up: 8, left: 9, south: 10, right: 11 } as const;
const LPC_FRAMES = [1, 2, 3, 4, 5, 6, 7, 8];
const LPC_MS = 100;

type Direction = keyof typeof LPC_WALK;

interface Props {
  presetId: string;
  level?: number;
  size?: number;
  direction?: Direction;
}

export default function SpriteAvatar({
  presetId, level = 1, size = 64, direction = 'south',
}: Props) {
  const [tick, setTick] = useState(0);
  const { format, source } = getPresetSprite(presetId);

  const isLpc    = format === 'lpc';
  const frames   = isLpc ? LPC_FRAMES  : PALADIN_FRAMES;
  const cols     = isLpc ? LPC_COLS    : PALADIN_COLS;
  const nRows    = isLpc ? LPC_ROWS    : PALADIN_ROWS;
  const ms       = isLpc ? LPC_MS      : PALADIN_MS;
  const row      = isLpc ? LPC_WALK[direction] : paladinRow(level);
  const frameIdx = frames[tick % frames.length];

  // Clamp render size to avoid exceeding Android GL texture limit
  const renderSize = isLpc ? Math.min(size, LPC_MAX) : size;

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), ms);
    return () => clearInterval(id);
  }, [ms]);

  return (
    <View
      collapsable={false}
      style={{ width: renderSize, height: renderSize, overflow: 'hidden' }}
    >
      <Image
        source={source}
        style={{
          position: 'absolute',
          width:  cols * renderSize,
          height: nRows * renderSize,
          left: -frameIdx * renderSize,
          top:  -row * renderSize,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
