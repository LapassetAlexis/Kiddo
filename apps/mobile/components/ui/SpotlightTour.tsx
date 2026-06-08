import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors, Radii } from '@/constants/theme';

const PAD = 10;
const OVERLAY = 'rgba(0,0,0,0.82)';

export interface TourStep {
  ref: React.RefObject<any>;
  title: string;
  body: string;
}

interface MeasuredRect { x: number; y: number; w: number; h: number; }

interface Props {
  steps: TourStep[];
  visible: boolean;
  onFinish: () => void;
}

export default function SpotlightTour({ steps, visible, onFinish }: Props) {
  const [index, setIndex] = useState(0);
  const [spot, setSpot] = useState<MeasuredRect | null>(null);
  const [containerH, setContainerH] = useState(900);
  const containerRef = useRef<View>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  useEffect(() => {
    if (!visible) { setIndex(0); setSpot(null); return; }
    measureTarget(index);
  }, [visible, index]);

  function measureTarget(i: number) {
    setSpot(null);
    const node = steps[i]?.ref?.current;
    if (!node) return;
    setTimeout(() => {
      const sbH = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) : 0;
      node.measureInWindow((x: number, y: number, w: number, h: number) => {
        if (w > 0 && h > 0) {
          setSpot({
            x: x - PAD,
            y: y + sbH - PAD,
            w: w + PAD * 2,
            h: h + PAD * 2,
          });
        }
      });
    }, 200);
  }

  function next() {
    if (isLast) onFinish();
    else setIndex(i => i + 1);
  }

  if (!visible || !step) return null;

  const sx = spot?.x ?? 0;
  const sy = spot?.y ?? 0;
  const sw = spot?.w ?? 0;
  const sh = spot?.h ?? 0;
  const showBelow = !spot || sy < containerH * 0.55;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onFinish}>
      <View
        ref={containerRef}
        style={StyleSheet.absoluteFill}
        onLayout={e => setContainerH(e.nativeEvent.layout.height)}
      >
        {/* 4-piece overlay */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={{ position: 'absolute', top: 0,       left: 0, right: 0,            height: Math.max(0, sy),  backgroundColor: OVERLAY }} />
          <View style={{ position: 'absolute', top: sy + sh, left: 0, right: 0, bottom: 0,                           backgroundColor: OVERLAY }} />
          <View style={{ position: 'absolute', top: sy,      left: 0, width: Math.max(0, sx), height: sh,            backgroundColor: OVERLAY }} />
          <View style={{ position: 'absolute', top: sy,      left: sx + sw, right: 0,        height: sh,             backgroundColor: OVERLAY }} />
          {spot && (
            <View style={{
              position: 'absolute', top: sy, left: sx, width: sw, height: sh,
              borderRadius: 12, borderWidth: 2, borderColor: Colors.gold,
            }} />
          )}
        </View>

        {/* Tooltip */}
        <View style={[styles.tooltip, showBelow ? { top: sy + sh + 16 } : { bottom: containerH - sy + 16 }]}>
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
            ))}
          </View>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.skipBtn} onPress={onFinish} activeOpacity={0.7}>
              <Text style={styles.skipText}>Passer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.nextBtn} onPress={next} activeOpacity={0.85}>
              <Text style={styles.nextText}>{isLast ? 'Terminer ✓' : 'Suivant →'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    left: 20, right: 20,
    backgroundColor: '#1e1e26',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 30,
  },
  dots: { flexDirection: 'row', gap: 5, marginBottom: 14 },
  dot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: { width: 18, backgroundColor: Colors.gold },
  title: {
    fontSize: 17, fontWeight: '900',
    color: Colors.textPrimary, marginBottom: 8,
  },
  body: {
    fontSize: 14, fontWeight: '500',
    color: Colors.textDim, lineHeight: 20,
    marginBottom: 16,
  },
  actions: { flexDirection: 'row', gap: 10 },
  skipBtn: {
    flex: 1, alignItems: 'center', padding: 12,
    borderRadius: Radii.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  skipText: { fontSize: 13, fontWeight: '700', color: Colors.textFaint },
  nextBtn: {
    flex: 2, alignItems: 'center', padding: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.gold,
  },
  nextText: { fontSize: 14, fontWeight: '900', color: '#000' },
});
