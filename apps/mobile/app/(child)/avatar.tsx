import {
  View, Text, ScrollView, StyleSheet, Animated,
  Easing, Image, useWindowDimensions,
} from 'react-native';
import { useEffect, useRef, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Radii, Spacing } from '@/constants/theme';
import type { ThemeColors } from '@/constants/theme';
import { LoadingScreen, ErrorScreen } from '@/components/ui/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useApiData } from '@/lib/useApiData';
import { childrenApi } from '@/lib/api/children';
import { getXpProgress } from '@/lib/rpg';
import HeroSprite from '@/components/HeroSprite';
import { getPresetById, getUnlockedChapters, getEquippedItems, getEquippedBehindItems, DEFAULT_PRESET } from '@/lib/character-presets';
import { useTheme } from '@/contexts/ThemeContext';

// Chapter backgrounds — one per story milestone
const BG_BY_CHAPTER = [
  require('@/assets/sprites/bg_forest.png'), // ch1: forêt verte  (niv. 1)
  require('@/assets/sprites/bg_ch2.png'),    // ch2: hiver bleu   (niv. 10)
  require('@/assets/sprites/bg_ch3.png'),    // ch3: grotte noire (niv. 20)
  require('@/assets/sprites/bg_ch4.png'),    // ch4: ruines rouge (niv. 30)
  require('@/assets/sprites/bg_ch5.png'),    // ch5: épique dorée (niv. 40)
];
const BG_NATIVE_W = 128;
const BG_NATIVE_H = 160;
const SCENE_HEIGHT  = 220;
const SPRITE_SIZE   = 80;  // HeroSprite renders walk strip 4×80=320px — no GL issue
const GROUND_OFFSET = -4;

function HeroScene({ preset, level, chapterIndex }: { preset: ReturnType<typeof getPresetById> & {}; level: number; chapterIndex: number }) {
  const { width } = useWindowDimensions();
  const tileW = Math.ceil((BG_NATIVE_W / BG_NATIVE_H) * SCENE_HEIGHT); // ~176px
  // Need enough tiles to cover 2× screen width for seamless loop
  const copies = Math.ceil((width * 2) / tileW) + 1;
  const totalW = copies * tileW;

  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(scrollX, {
        toValue: -tileW,
        duration: 4000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [tileW]);

  return (
    <View style={[sceneStyles.scene, { height: SCENE_HEIGHT }]}>
      {/* Scrolling background tiles */}
      <Animated.View
        style={[sceneStyles.bgRow, { width: totalW, transform: [{ translateX: scrollX }] }]}
      >
        {Array.from({ length: copies }).map((_, i) => (
          <Image
            key={i}
            source={BG_BY_CHAPTER[Math.min(chapterIndex, BG_BY_CHAPTER.length - 1)]}
            style={{ width: tileW, height: SCENE_HEIGHT }}
            resizeMode="stretch"
          />
        ))}
      </Animated.View>

      {/* Dark overlay at bottom for depth */}
      <View style={sceneStyles.sceneGradient} />

      {/* Character walking right, feet on the ground */}
      <View style={sceneStyles.spriteAnchor}>
        <HeroSprite source={preset.baseStrip} items={getEquippedItems(preset, level)} behindItems={getEquippedBehindItems(preset, level)} size={SPRITE_SIZE} direction="right" />
      </View>
    </View>
  );
}

const sceneStyles = StyleSheet.create({
  scene:        { overflow: 'hidden', backgroundColor: '#0a1a0a' },
  bgRow:        { position: 'absolute', top: 0, left: 0, bottom: 0, flexDirection: 'row' },
  sceneGradient:{
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  spriteAnchor: {
    position: 'absolute',
    bottom: GROUND_OFFSET,
    left: '50%',
    marginLeft: -(SPRITE_SIZE / 2),
  },
});

const makeStyles = (colors: ThemeColors) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgScreen },

  // Zone infos
  infoArea:    { flex: 1, backgroundColor: colors.bgScreen },
  infoContent: { padding: Spacing.screen, gap: 12 },

  nameBlock:   { gap: 2, paddingTop: 4 },
  heroName:    { fontSize: 26, fontWeight: '900', color: colors.textPrimary },
  heroTagline: { fontSize: 14, fontWeight: '700', color: colors.textDim },

  xpCard: {
    backgroundColor: colors.bgCard,
    borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border,
    padding: 14, gap: 8,
  },
  xpRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  levelPill:  {
    backgroundColor: 'rgba(139,92,246,0.15)', borderRadius: Radii.pill,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  levelPillText: { fontSize: 12, fontWeight: '900', color: '#a78bfa' },
  xpLabel:       { fontSize: 11, fontWeight: '700', color: colors.textFaint },
  xpBarTrack:    { height: 6, borderRadius: 99, backgroundColor: 'rgba(139,92,246,0.15)', overflow: 'hidden' },
  xpBarFill:     { height: '100%', borderRadius: 99, backgroundColor: '#8b5cf6' },

  sectionLabel: {
    fontSize: 11, fontWeight: '900', color: colors.textFaint,
    textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 4,
  },

  chapterCard: {
    backgroundColor: colors.bgCard,
    borderRadius: Radii.card, borderWidth: 1, borderColor: colors.border,
    padding: 16, gap: 8,
  },
  chapterHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chapterBadge: {
    backgroundColor: 'rgba(255,184,0,0.12)', borderRadius: Radii.pill,
    paddingHorizontal: 10, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(255,184,0,0.25)',
  },
  chapterBadgeText: { fontSize: 11, fontWeight: '900', color: colors.gold },
  chapterMinLevel:  { fontSize: 11, fontWeight: '700', color: colors.textFaint },
  chapterTitle:     { fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  chapterText:      { fontSize: 14, fontWeight: '500', color: colors.textDim, lineHeight: 22 },

  chapterCardLocked: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: Radii.card, borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
    padding: 16,
  },
  lockRow:            { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lockIcon:           { fontSize: 20 },
  chapterTitleLocked: { fontSize: 15, fontWeight: '800', color: colors.textFaint },
  lockHint:           { fontSize: 12, fontWeight: '600', color: colors.textFaint, marginTop: 2, opacity: 0.6 },
});

export default function AvatarScreen() {
  const { user } = useAuth();
  const { bottom } = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { data: statsData, loading, error, refresh } = useApiData(
    () => childrenApi.get(user?.id ?? ''),
    [user?.id],
  );

  if (loading) return <LoadingScreen />;
  if (error)   return <ErrorScreen message={error} onRetry={refresh} />;

  const childLevel  = statsData?.level ?? 1;
  const childXp     = statsData?.xp ?? 0;
  const childSprite = statsData?.sprite ?? DEFAULT_PRESET;
  const preset      = getPresetById(childSprite) ?? getPresetById(DEFAULT_PRESET)!;
  const xpProgress  = getXpProgress(childXp);
  const xpPercent   = xpProgress.total > 0
    ? Math.round((xpProgress.current / xpProgress.total) * 100)
    : 0;

  const unlocked = getUnlockedChapters(preset, childLevel);
  const locked   = preset.chapters.filter(c => childLevel < c.minLevel);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* ── Zone 1 : scène animée ── */}
      <HeroScene preset={preset} level={childLevel} chapterIndex={unlocked.length - 1} />

      {/* ── Zone 2 : infos scrollables ── */}
      <ScrollView
        style={styles.infoArea}
        contentContainerStyle={[styles.infoContent, { paddingBottom: bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Nom + tagline */}
        <View style={styles.nameBlock}>
          <Text style={styles.heroName}>{preset.name}</Text>
          <Text style={styles.heroTagline}>{preset.tagline}</Text>
        </View>

        {/* Niveau + XP */}
        <View style={styles.xpCard}>
          <View style={styles.xpRow}>
            <View style={styles.levelPill}>
              <Text style={styles.levelPillText}>Niveau {childLevel}</Text>
            </View>
            <Text style={styles.xpLabel}>{xpProgress.current} / {xpProgress.total} XP</Text>
          </View>
          <View style={styles.xpBarTrack}>
            <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
          </View>
        </View>

        {/* Chapitres */}
        <Text style={styles.sectionLabel}>Histoire</Text>

        {unlocked.map((chapter, i) => (
          <View key={chapter.title} style={styles.chapterCard}>
            <View style={styles.chapterHeaderRow}>
              <View style={styles.chapterBadge}>
                <Text style={styles.chapterBadgeText}>Chapitre {i + 1}</Text>
              </View>
              <Text style={styles.chapterMinLevel}>Niv. {chapter.minLevel}</Text>
            </View>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
            <Text style={styles.chapterText}>{chapter.text}</Text>
          </View>
        ))}

        {locked.map((chapter) => (
          <View key={chapter.title} style={styles.chapterCardLocked}>
            <View style={styles.lockRow}>
              <Text style={styles.lockIcon}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.chapterTitleLocked}>{chapter.title}</Text>
                <Text style={styles.lockHint}>Se débloque au niveau {chapter.minLevel}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
