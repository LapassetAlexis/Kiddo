import { View, Image, ImageSourcePropType } from 'react-native';
import { useEffect, useState } from 'react';

// Walk strip: 832×256px — 13 cols × 4 rows × 64px
// Rows: 0=up  1=left  2=south  3=right
const COLS       = 13;
const ROWS       = 4;
const FRAME_SIZE = 64;
const FRAMES     = [1, 2, 3, 4, 5, 6, 7, 8]; // LPC walk cycle (skips frame 0)
const FRAME_MS   = 100;

const DIRECTION_ROW = { up: 0, left: 1, south: 2, right: 3 } as const;
type Direction = keyof typeof DIRECTION_ROW;

interface Props {
  source: ImageSourcePropType;
  size?: number;
  direction?: Direction;
}

export default function HeroSprite({ source, size = 64, direction = 'right' }: Props) {
  const [tick, setTick] = useState(0);
  const row      = DIRECTION_ROW[direction];
  const frameIdx = FRAMES[tick % FRAMES.length];
  const scale    = size / FRAME_SIZE;

  // At size=64: sheet = 832×256px — well within Android GL limits
  // At size=96: sheet = 1248×384px — still fine
  const sheetW = COLS * size;  // e.g. 832 at size=64
  const sheetH = ROWS * size;  // e.g. 256 at size=64

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), FRAME_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <View collapsable={false} style={{ width: size, height: size, overflow: 'hidden' }}>
      <Image
        source={source}
        style={{
          position: 'absolute',
          width:  sheetW,
          height: sheetH,
          left: -frameIdx * size,
          top:  -row * size,
        }}
        resizeMode="stretch"
      />
    </View>
  );
}
