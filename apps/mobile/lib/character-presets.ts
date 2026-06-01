import { ImageSourcePropType } from 'react-native';

export type SpriteFormat = 'paladin' | 'lpc';

export interface SpriteConfig {
  format: SpriteFormat;
  source: ImageSourcePropType;
}

export interface StoryChapter {
  minLevel: number;
  title: string;
  text: string;
}

export type CharacterClass = 'warrior' | 'archer' | 'mage';

export const CLASS_META: Record<CharacterClass, { label: string; icon: string; color: string }> = {
  warrior: { label: 'Guerrier', icon: '⚔️', color: '#ef4444' },
  archer:  { label: 'Archer',   icon: '🏹', color: '#22c55e' },
  mage:    { label: 'Mage',     icon: '✨', color: '#8b5cf6' },
};

export interface CharacterPreset {
  id: string;
  gender: 'male' | 'female';
  class: CharacterClass;
  name: string;
  tagline: string;
  emoji: string;
  chapters: StoryChapter[];
  sprite: SpriteConfig;
  // Naked base body strip (832×256) — no torso armor, just body/hair/legs/shoes
  baseStrip: ImageSourcePropType;
}

// ── Equipment item registry ──────────────────────────────────────────────────
// Each value is a transparent 832×256 walk strip (single LPC layer).
// HeroSprite stacks them on top of baseStrip at render time.
export const EQUIPMENT_ITEMS: Record<string, ImageSourcePropType> = {
  // Torso — civilian
  item_torso_shirt_blue:       require('@/assets/sprites/item_torso_shirt_blue.png'),
  item_torso_shirt_brown:      require('@/assets/sprites/item_torso_shirt_brown.png'),
  item_torso_shirt_forest:     require('@/assets/sprites/item_torso_shirt_forest.png'),
  item_torso_shirt_white:      require('@/assets/sprites/item_torso_shirt_white.png'),
  item_torso_blouse_blue:      require('@/assets/sprites/item_torso_blouse_blue.png'),
  item_torso_blouse_red:       require('@/assets/sprites/item_torso_blouse_red.png'),
  item_torso_blouse_purple:    require('@/assets/sprites/item_torso_blouse_purple.png'),
  // Torso — leather (T2)
  item_torso_leather_brown:    require('@/assets/sprites/item_torso_leather_brown.png'),
  item_torso_leather_tan:      require('@/assets/sprites/item_torso_leather_tan.png'),
  item_torso_leather_forest:   require('@/assets/sprites/item_torso_leather_forest.png'),
  item_torso_leather_walnut:   require('@/assets/sprites/item_torso_leather_walnut.png'),
  item_torso_leather_purple_f: require('@/assets/sprites/item_torso_leather_purple_f.png'),
  item_torso_leather_red_f:    require('@/assets/sprites/item_torso_leather_red_f.png'),
  item_torso_leather_green_f:  require('@/assets/sprites/item_torso_leather_green_f.png'),
  item_torso_leather_lavender: require('@/assets/sprites/item_torso_leather_lavender.png'),
  // Torso — plate (T3/T4)
  item_torso_plate_iron:       require('@/assets/sprites/item_torso_plate_iron.png'),
  item_torso_plate_bronze:     require('@/assets/sprites/item_torso_plate_bronze.png'),
  item_torso_plate_steel:      require('@/assets/sprites/item_torso_plate_steel.png'),
  item_torso_plate_brass:      require('@/assets/sprites/item_torso_plate_brass.png'),
  item_torso_plate_gold:       require('@/assets/sprites/item_torso_plate_gold.png'),
  item_torso_plate_iron_f:     require('@/assets/sprites/item_torso_plate_iron_f.png'),
  item_torso_plate_gold_f:     require('@/assets/sprites/item_torso_plate_gold_f.png'),
  // Legs — plate
  item_legs_plate_iron:        require('@/assets/sprites/item_legs_plate_iron.png'),
  item_legs_plate_bronze:      require('@/assets/sprites/item_legs_plate_bronze.png'),
  item_legs_plate_steel:       require('@/assets/sprites/item_legs_plate_steel.png'),
  item_legs_plate_gold:        require('@/assets/sprites/item_legs_plate_gold.png'),
  item_legs_plate_iron_f:      require('@/assets/sprites/item_legs_plate_iron_f.png'),
  item_legs_plate_gold_f:      require('@/assets/sprites/item_legs_plate_gold_f.png'),
  item_legs_plate_brass:       require('@/assets/sprites/item_legs_plate_brass.png'),
  // Weapons
  item_weapon_dagger:                 require('@/assets/sprites/item_weapon_dagger.png'),
  item_weapon_dagger_behind:          require('@/assets/sprites/item_weapon_dagger_behind.png'),
  item_weapon_mace:                   require('@/assets/sprites/item_weapon_mace.png'),
  item_weapon_arming_sword:           require('@/assets/sprites/item_weapon_arming_sword.png'),
  item_weapon_longsword:              require('@/assets/sprites/item_weapon_longsword.png'),
  item_weapon_longsword_front:        require('@/assets/sprites/item_weapon_longsword_front.png'),
  item_weapon_crossbow:               require('@/assets/sprites/item_weapon_crossbow.png'),
  item_weapon_boomerang:              require('@/assets/sprites/item_weapon_boomerang.png'),
  item_weapon_staff_gnarled:          require('@/assets/sprites/item_weapon_staff_gnarled.png'),
  item_weapon_staff_gnarled_behind:   require('@/assets/sprites/item_weapon_staff_gnarled_behind.png'),
  item_weapon_staff_crystal:          require('@/assets/sprites/item_weapon_staff_crystal.png'),
  item_weapon_staff_crystal_behind:   require('@/assets/sprites/item_weapon_staff_crystal_behind.png'),
  item_weapon_staff_loop:             require('@/assets/sprites/item_weapon_staff_loop.png'),
  item_weapon_staff_loop_behind:      require('@/assets/sprites/item_weapon_staff_loop_behind.png'),
  item_weapon_staff_diamond:          require('@/assets/sprites/item_weapon_staff_diamond.png'),
  item_weapon_staff_diamond_behind:   require('@/assets/sprites/item_weapon_staff_diamond_behind.png'),
  // Shield
  item_shield_heater_wood:     require('@/assets/sprites/item_shield_heater_wood.png'),
  // Helms
  item_helm_nasal_steel:       require('@/assets/sprites/item_helm_nasal_steel.png'),
  item_helm_nasal_bronze:      require('@/assets/sprites/item_helm_nasal_bronze.png'),
  item_helm_nasal_iron:        require('@/assets/sprites/item_helm_nasal_iron.png'),
  item_helm_nasal_gold:        require('@/assets/sprites/item_helm_nasal_gold.png'),
  item_helm_wizard_base:       require('@/assets/sprites/item_helm_wizard_base.png'),
  item_helm_wizard_belt:       require('@/assets/sprites/item_helm_wizard_belt.png'),
  item_helm_wizard_buckle:     require('@/assets/sprites/item_helm_wizard_buckle.png'),
};

// ── Level gear (auto-equip by level tier) ────────────────────────────────────
// Keys match EQUIPMENT_ITEMS. Higher minLevel wins when multiple tiers match.
const LEVEL_GEAR: Record<string, Record<number, string[]>> = {
  // Weapon layers: longsword/dagger use behind+front split; arming_sword/mace/shield are universal front only
  'm_1': {
    1:  ['item_torso_shirt_blue',    'item_weapon_mace'],
    10: ['item_torso_leather_brown', 'item_weapon_arming_sword'],
    20: ['item_torso_plate_iron',    'item_legs_plate_iron',   'item_weapon_longsword', 'item_weapon_longsword_front'],
    35: ['item_torso_plate_gold',    'item_legs_plate_gold',   'item_helm_nasal_gold',  'item_weapon_longsword', 'item_weapon_longsword_front', 'item_shield_heater_wood'],
  },
  'm_2': {
    1:  ['item_torso_shirt_brown',   'item_weapon_mace'],
    10: ['item_torso_leather_tan',   'item_weapon_arming_sword'],
    20: ['item_torso_plate_bronze',  'item_legs_plate_bronze', 'item_weapon_longsword', 'item_weapon_longsword_front'],
    35: ['item_torso_plate_gold',    'item_legs_plate_gold',   'item_helm_nasal_gold',  'item_weapon_longsword', 'item_weapon_longsword_front', 'item_shield_heater_wood'],
  },
  'm_3': {
    1:  ['item_torso_shirt_forest',  'item_weapon_dagger_behind', 'item_weapon_dagger'],
    10: ['item_torso_leather_forest','item_weapon_crossbow'],
    20: ['item_torso_plate_brass',   'item_legs_plate_brass',  'item_weapon_crossbow'],
    35: ['item_torso_plate_brass',   'item_legs_plate_brass',  'item_weapon_crossbow'],
  },
  'm_4': {
    1:  ['item_torso_shirt_white',   'item_weapon_mace'],
    10: ['item_torso_leather_walnut','item_weapon_arming_sword'],
    20: ['item_torso_plate_steel',   'item_legs_plate_steel',  'item_weapon_longsword', 'item_weapon_longsword_front'],
    35: ['item_torso_plate_gold',    'item_legs_plate_gold',   'item_helm_nasal_gold',  'item_weapon_longsword', 'item_weapon_longsword_front', 'item_shield_heater_wood'],
  },
  'f_1': {
    1:  ['item_torso_blouse_blue',      'item_weapon_staff_gnarled_behind',  'item_weapon_staff_gnarled'],
    10: ['item_torso_leather_purple_f', 'item_weapon_staff_crystal_behind',  'item_weapon_staff_crystal'],
    20: ['item_torso_leather_purple_f', 'item_weapon_staff_loop_behind',     'item_weapon_staff_loop'],
    35: ['item_torso_leather_lavender', 'item_weapon_staff_diamond_behind',  'item_weapon_staff_diamond'],
  },
  'f_2': {
    1:  ['item_torso_blouse_red',    'item_weapon_mace'],
    10: ['item_torso_leather_red_f', 'item_weapon_arming_sword'],
    20: ['item_torso_plate_iron_f',  'item_legs_plate_iron_f', 'item_weapon_longsword', 'item_weapon_longsword_front'],
    35: ['item_torso_plate_gold_f',  'item_legs_plate_gold_f', 'item_helm_nasal_gold',  'item_weapon_longsword', 'item_weapon_longsword_front', 'item_shield_heater_wood'],
  },
  'f_3': {
    1:  ['item_torso_shirt_forest',  'item_weapon_dagger_behind', 'item_weapon_dagger'],
    10: ['item_torso_leather_green_f','item_weapon_crossbow'],
    20: ['item_torso_plate_brass',   'item_legs_plate_brass',  'item_weapon_crossbow'],
    35: ['item_torso_plate_brass',   'item_legs_plate_brass',  'item_weapon_crossbow'],
  },
  'f_4': {
    1:  ['item_torso_blouse_purple',    'item_weapon_staff_gnarled_behind',  'item_weapon_staff_gnarled'],
    10: ['item_torso_leather_purple_f', 'item_weapon_staff_crystal_behind',  'item_weapon_staff_crystal'],
    20: ['item_torso_leather_purple_f', 'item_weapon_staff_loop_behind',     'item_weapon_staff_loop'],
    35: ['item_torso_leather_lavender', 'item_weapon_staff_diamond_behind',  'item_weapon_staff_diamond'],
  },
};

// LPC universal_behind weapons — must render behind the body (zPos < body zPos=10)
const BEHIND_ITEM_KEYS = new Set([
  'item_weapon_longsword',
  'item_weapon_dagger_behind',
  'item_weapon_staff_gnarled_behind',
  'item_weapon_staff_crystal_behind',
  'item_weapon_staff_loop_behind',
  'item_weapon_staff_diamond_behind',
]);

function resolveGearKeys(preset: CharacterPreset, level: number): string[] {
  const tiers = LEVEL_GEAR[preset.id];
  if (!tiers) return [];
  return Object.entries(tiers)
    .filter(([minLvl]) => level >= Number(minLvl))
    .sort(([a], [b]) => Number(b) - Number(a))[0]?.[1] ?? [];
}

export function getEquippedItems(preset: CharacterPreset, level: number): ImageSourcePropType[] {
  return resolveGearKeys(preset, level)
    .filter(k => !BEHIND_ITEM_KEYS.has(k))
    .map(k => EQUIPMENT_ITEMS[k])
    .filter(Boolean);
}

export function getEquippedBehindItems(preset: CharacterPreset, level: number): ImageSourcePropType[] {
  return resolveGearKeys(preset, level)
    .filter(k => BEHIND_ITEM_KEYS.has(k))
    .map(k => EQUIPMENT_ITEMS[k])
    .filter(Boolean);
}

const LPC_M_1 = require('@/assets/sprites/lpc_m_1.png');
const LPC_M_2 = require('@/assets/sprites/lpc_m_2.png');
const LPC_M_3 = require('@/assets/sprites/lpc_m_3.png');
const LPC_M_4 = require('@/assets/sprites/lpc_m_4.png');
const LPC_F_1 = require('@/assets/sprites/lpc_f_1.png');
const LPC_F_2 = require('@/assets/sprites/lpc_f_2.png');
const LPC_F_3 = require('@/assets/sprites/lpc_f_3.png');
const LPC_F_4 = require('@/assets/sprites/lpc_f_4.png');

// Base body strips — naked body, hair, legs, shoes (no torso armor)
const BASE_M_1 = require('@/assets/sprites/lpc_m_1_base.png');
const BASE_M_2 = require('@/assets/sprites/lpc_m_2_base.png');
const BASE_M_3 = require('@/assets/sprites/lpc_m_3_base.png');
const BASE_M_4 = require('@/assets/sprites/lpc_m_4_base.png');
const BASE_F_1 = require('@/assets/sprites/lpc_f_1_base.png');
const BASE_F_2 = require('@/assets/sprites/lpc_f_2_base.png');
const BASE_F_3 = require('@/assets/sprites/lpc_f_3_base.png');
const BASE_F_4 = require('@/assets/sprites/lpc_f_4_base.png');

export const CHARACTER_PRESETS: CharacterPreset[] = [
  {
    id: 'm_1', gender: 'male', class: 'warrior',
    name: 'Aldric', tagline: 'Le Chevalier Errant', emoji: '⚔️',
    sprite: { format: 'lpc', source: LPC_M_1 }, baseStrip: BASE_M_1,
    chapters: [
      { minLevel: 1,  title: 'Les origines',         text: 'Aldric grandit dans un petit village des terres de l\'ouest, bercé par les récits de chevaliers que lui contait son grand-père chaque soir au coin du feu. Dès l\'enfance, il passait ses journées à s\'entraîner avec un bâton de bois dans la cour de la ferme, imaginant des dragons et des batailles épiques. Sa mère s\'inquiétait, mais son grand-père souriait toujours. « Ce garçon a quelque chose », disait-il. « Je le sens dans ses yeux. »' },
      { minLevel: 10, title: 'La première épreuve',   text: 'Son premier voyage l\'emmena seul vers les montagnes du Nord, à dix jours de marche du village. Les nuits étaient glaciales, les chemins traîtres, et plus d\'une fois il faillit rebrousser chemin. Mais c\'est là, dans une grotte battue par la tempête, qu\'il comprit quelque chose d\'essentiel : la peur n\'est pas l\'ennemi, elle est le signal. Elle indique l\'endroit précis où il faut avancer. Il repartit le lendemain, les mains gelées mais le cœur chaud.' },
      { minLevel: 20, title: 'Le serment',            text: 'Dans la forêt de Véromar, Aldric découvrit une épée plantée dans une pierre au pied d\'un chêne millénaire. La lame était gravée d\'une inscription ancienne : « Protège les faibles, toujours. » Il essaya de la soulever, certain qu\'elle résisterait comme dans les vieilles légendes. Elle vint dans sa main comme si elle l\'attendait depuis longtemps. Cette nuit-là, il fit le serment à voix haute, seul dans la forêt. Les arbres semblèrent frémir.' },
      { minLevel: 30, title: 'La légende commence',   text: 'Les récits de ses exploits commencèrent à voyager plus vite que lui. On racontait qu\'il avait défendu un village entier contre des brigands armés, sans demander ni or ni remerciements. Que dans le col de Brume-Grise, il avait guidé une caravane égarée au péril de sa vie. Les anciens consultèrent les parchemins et murmurèrent un nom qu\'on n\'avait pas prononcé depuis cent ans. Aldric, lui, continuait simplement d\'avancer, une étape après l\'autre.' },
      { minLevel: 40, title: 'La quête accomplie',    text: 'Au sommet de la Tour des Vents, après des années de voyage, Aldric s\'assit enfin et regarda derrière lui. Il avait cherché la gloire, la vérité, le sens de son existence. Il trouva quelque chose de plus simple et de plus grand à la fois : il avait été utile. À des inconnus, à des amis, à des villages dont il avait oublié les noms. La paix qui l\'envahit ce soir-là n\'était pas celle des vainqueurs — c\'était celle des hommes qui savent pourquoi ils se lèvent chaque matin.' },
    ],
  },
  {
    id: 'm_2', gender: 'male', class: 'warrior',
    name: 'Rajan', tagline: 'L\'Explorateur Curieux', emoji: '🗡️',
    sprite: { format: 'lpc', source: LPC_M_2 }, baseStrip: BASE_M_2,
    chapters: [
      { minLevel: 1,  title: 'La cité des marchands', text: 'Rajan grandit au cœur de la plus grande cité marchande du monde connu, entouré de soieries, d\'épices rares et de langues qu\'il ne comprenait pas encore. Son père voulait en faire un commerçant prospère. Sa mère rêvait qu\'il reprenne la boutique familiale. Mais chaque soir, Rajan grimpait sur le toit de la maison pour regarder les bateaux disparaître à l\'horizon. C\'est là, dans ce silence, qu\'il comprit que l\'or ne l\'intéressait pas autant que ce qui se trouvait de l\'autre côté.' },
      { minLevel: 10, title: 'La première traversée', text: 'Sa première traversée maritime dura quarante jours et faillit tourner au désastre. Tempêtes, fièvres, provisions à moitié pourries — Rajan découvrit que les voyages de conte n\'avaient rien à voir avec la réalité. Pourtant, c\'est sur ce bateau qu\'il apprit à naviguer aux étoiles, à lire les courants dans la couleur de l\'eau, et surtout à s\'adapter. Quand il toucha enfin terre, il était sale, épuisé, et plus vivant qu\'il ne l\'avait jamais été.' },
      { minLevel: 20, title: 'Le texte des dix langues', text: 'Dans les archives poussiéreuses d\'un vieux port, Rajan tomba sur un parchemin rédigé en dix langues différentes. La plupart des érudits l\'avaient jugé illisible et l\'avaient mis de côté. Lui passa trois semaines à le déchiffrer, croisant ses connaissances linguistiques comme les fils d\'une broderie. Le texte décrivait un lieu où avait été rassemblée toute la sagesse d\'une civilisation disparue. Ce n\'était pas un trésor d\'or. C\'était quelque chose de bien plus précieux.' },
      { minLevel: 30, title: 'Le Savant des mers',    text: 'On l\'appelait désormais « Le Savant des mers », et ses carnets de voyage circulaient dans les plus grandes bibliothèques du monde connu. Des rois le consultaient. Des universités lui proposaient des chaires. Il refusait toujours poliment, rangeait ses affaires dans son sac usé, et repartait. Il y avait encore trop de choses à voir, trop de questions sans réponse, trop de langues qu\'il ne parlait pas encore.' },
      { minLevel: 40, title: 'Le plus grand trésor',  text: 'Après des décennies de voyage, Rajan s\'installa un soir dans une vieille auberge et ouvrit ses carnets. Des milliers de pages couvertes de cartes, de mots, de recettes de cuisine, de légendes locales. Il chercha longtemps ce qu\'il avait réellement trouvé. Pas une richesse, ni une vérité ultime. Mais des dizaines de noms — des gens rencontrés sur la route, qui lui avaient fait confiance, partagé leur table, sauvé la vie parfois. C\'était ça, le vrai trésor. Et il avait les carnets pour le prouver.' },
    ],
  },
  {
    id: 'm_3', gender: 'male', class: 'archer',
    name: 'Zéphyr', tagline: 'Le Fils des Steppes', emoji: '🏹',
    sprite: { format: 'lpc', source: LPC_M_3 }, baseStrip: BASE_M_3,
    chapters: [
      { minLevel: 1,  title: 'Né du vent',            text: 'Zéphyr naquit pendant une nuit de grand vent dans les steppes sans fin, et sa mère dit toujours que c\'est pour ça qu\'il ne tenait pas en place. Avant même de savoir parler, il passait ses journées à observer les nuages, à toucher la terre, à imiter les cris des oiseaux. Les autres enfants jouaient ensemble. Lui jouait avec la nature. Ce n\'était pas de la solitude — c\'était une conversation que les autres ne savaient pas encore entendre.' },
      { minLevel: 10, title: 'Maître de la steppe',   text: 'À quatorze ans, Zéphyr passa trois semaines seul dans la steppe comme épreuve de passage à l\'âge adulte. Il n\'emportait qu\'un couteau et une gourde. Il apprit à trouver l\'eau en creusant là où les insectes se rassemblent, à lire le vent pour anticiper les tempêtes, à approcher un faucon sauvage sans gestes brusques. Il revint au campement plus silencieux qu\'avant, les yeux plus calmes. On le regarda différemment après ça.' },
      { minLevel: 20, title: 'Le don des anciens',    text: 'Un vieux chamane le convoqua un soir et lui parla jusqu\'à l\'aube. Il lui expliqua qu\'il existait, très rarement, des êtres capables de « sentir » l\'équilibre du vivant — là où il se maintient, là où il vacille. Ce don ne s\'enseigne pas. Il se porte. Zéphyr écouta en silence, puis repartit chez lui sans rien dire. Mais à partir de ce jour, il commença à voir le monde différemment : chaque animal blessé, chaque rivière asséchée, chaque conflit entre hommes lui parlait.' },
      { minLevel: 30, title: 'La voix des tribus',    text: 'Sa réputation franchit les limites de sa tribu sans qu\'il ne fasse rien pour la répandre. Des messagers vinrent le chercher pour résoudre un conflit entre deux clans qui se disputaient un point d\'eau depuis une génération. Zéphyr passa deux jours à écouter chaque côté, sans interrompre, sans juger. Puis il dit quelques mots. Et les chefs signèrent une trêve. Les anciens des deux camps se regardèrent, stupéfaits. Lui était déjà reparti.' },
      { minLevel: 40, title: 'Le Gardien des Plaines', text: 'On lui offrit des terres, des titres, des armées. Il refusa tout. Ce qu\'il voulait, c\'était que la steppe reste vivante — que les troupeaux aient de l\'espace, que les sources ne soient pas empoisonnées, que les hommes se respectent assez pour ne pas tout détruire. Il devint le Gardien des Plaines, non pas par décret, mais parce que tout le monde, un jour ou l\'autre, avait eu besoin de lui. Son nom se chante encore autour des feux quand le vent se lève.' },
    ],
  },
  {
    id: 'm_4', gender: 'male', class: 'warrior',
    name: 'Kwame', tagline: 'Le Gardien Ancestral', emoji: '🛡️',
    sprite: { format: 'lpc', source: LPC_M_4 }, baseStrip: BASE_M_4,
    chapters: [
      { minLevel: 1,  title: 'Le chant des tambours', text: 'Dans le village de Kwame, l\'histoire ne s\'écrivait pas dans des livres — elle se jouait dans les tambours. Chaque rythme racontait une bataille, une victoire, un sacrifice. Dès qu\'il fut assez grand pour rester assis le soir, Kwame écouta ces rythmes avec une attention que les adultes remarquèrent. Il apprit leurs noms, leurs significations, les histoires derrière chaque battement. Ses ancêtres n\'étaient pas morts. Ils vivaient dans le son.' },
      { minLevel: 10, title: 'Le rite de passage',    text: 'Le rite de passage exigeait trois jours seul dans la forêt profonde, sans feu, sans arme, sans nourriture apportée. La plupart des jeunes en revenaient amaigris mais soulagés que ce soit terminé. Kwame, lui, repartit dans la forêt le lendemain, de son propre chef. Il voulait comprendre ce qu\'il avait ressenti — cette étrange sensation que la forêt lui avait parlé. Ce deuxième séjour dura cinq jours. À son retour, son regard avait changé. Personne ne lui demanda ce qu\'il avait vu.' },
      { minLevel: 20, title: 'Le bouclier ancestral', text: 'Le bouclier de Mansa Djeli était exposé dans la maison des anciens depuis cent ans, et nul n\'avait tenté de le porter depuis la mort de son dernier gardien. Les anciens réunirent le village et demandèrent à Kwame de s\'avancer. Il souleva le bouclier d\'un geste naturel, comme si son bras l\'avait toujours attendu. Il sentit aussitôt un poids qui n\'était pas physique — le poids de tous ceux qui l\'avaient porté avant lui, leurs victoires, leurs sacrifices. Il inclina la tête. Le village retint son souffle.' },
      { minLevel: 30, title: 'L\'union des clans',    text: 'Quatre clans se disputaient une même vallée fertile depuis trois générations. Les palabres avaient échoué. Les batailles avaient saigné les familles. Kwame demanda à parler, seul, devant tous les chefs réunis. Il parla pendant une heure, sans hausser la voix, sans menacer ni promettre. Il rappela les ancêtres communs, les temps où ces mêmes clans avaient combattu côte à côte. À la fin, un vieux chef en larmes se leva et tendit la main à son ennemi de toujours. Kwame s\'effaça et laissa les hommes sceller leur propre paix.' },
      { minLevel: 40, title: 'Gravé dans les tambours', text: 'Le soir de la grande cérémonie, les joueurs de tambours entonnèrent un rythme que personne n\'avait entendu depuis cent ans — celui qu\'on réservait aux plus grands. Le nom de Kwame fut gravé dans le bois sacré, aux côtés de Mansa Djeli et des héros d\'avant. Il s\'assit parmi les anciens, les yeux brillants, et pensa à son grand-père qui lui avait appris à écouter. Le tambour chantait. L\'histoire continuait.' },
    ],
  },
  {
    id: 'f_1', gender: 'female', class: 'mage',
    name: 'Lyra', tagline: 'La Tisseuse de Sorts', emoji: '✨',
    sprite: { format: 'lpc', source: LPC_F_1 }, baseStrip: BASE_F_1,
    chapters: [
      { minLevel: 1,  title: 'Les lucioles de minuit', text: 'Lyra avait quatre ans quand elle fit briller des lucioles dans sa chambre en murmurant des mots qu\'elle n\'avait jamais appris. Sa mère, qui était elle-même mage, s\'arrêta net sur le seuil de la porte. Elle ne dit rien ce soir-là. Mais le lendemain matin, elle s\'assit en face de sa fille et lui demanda doucement de recommencer. Lyra s\'exécuta, l\'air de rien, comme si c\'était la chose la plus naturelle du monde. Sa mère ferma les yeux et sourit.' },
      { minLevel: 10, title: 'L\'académie des mages',  text: 'L\'académie était impressionnante, avec ses tours de pierre et ses bibliothèques qui sentaient la cire et le vieux parchemin. Lyra avait été acceptée deux ans avant l\'âge habituel. Ses camarades la regardaient avec un mélange de curiosité et de méfiance. Elle n\'apprenait pas la magie comme eux — elle ne mémorisait pas les formules, elle les ressentait. Parfois elle modifiait un sort instinctivement, sans réfléchir, et ça fonctionnait mieux. Les professeurs ne savaient pas si c\'était du génie ou un danger.' },
      { minLevel: 20, title: 'Le grimoire personnel',  text: 'À vingt ans, son grimoire personnel comptait déjà trois cents pages de sorts qu\'elle avait inventés elle-même. Certains maîtres essayaient de les reproduire et n\'y arrivaient pas. Ce n\'était pas une question de technique — c\'est qu\'il fallait les ressentir d\'une certaine façon pour qu\'ils fonctionnent. Lyra comprit alors quelque chose d\'important : la magie n\'était pas dans les mots. Elle était dans l\'état d\'esprit de celui qui les prononce. Cette idée allait tout changer.' },
      { minLevel: 30, title: 'La forêt empoisonnée',   text: 'La forêt de Sel-Noir était mourante depuis dix ans. Les arbres noircissaient, les rivières ne portaient plus de poissons, les oiseaux avaient fui. Trois grands mages avaient essayé de la guérir et renoncé. Lyra passa un mois seule là-bas, à écouter, à toucher, à comprendre. Elle ne lança aucun grand sort spectaculaire — juste des centaines de petits gestes quotidiens, comme soigner un malade plutôt que de chercher un miracle. Un matin, une pousse verte apparut au pied d\'un arbre mort. Puis une autre. Puis des dizaines.' },
      { minLevel: 40, title: 'La Tisseuse Suprême',    text: 'La nomination de Tisseuse Suprême était la plus haute distinction que le Conseil des Mages puisse décerner. Elle était accordée, en moyenne, une fois par siècle. Lyra l\'apprit par lettre un mardi matin, en buvant son thé. Elle posa la lettre, finit son thé, et alla arroser ses plantes. Elle accepta la cérémonie parce que c\'était important pour les autres. Mais ce soir-là, seule dans sa tour, elle rouvrit son grimoire et ajouta une note en marge de la première page : « La vraie magie, c\'est l\'intention. Tout le reste n\'est que décoration. »' },
    ],
  },
  {
    id: 'f_2', gender: 'female', class: 'warrior',
    name: 'Saoirse', tagline: 'L\'Intrépide', emoji: '🔥',
    sprite: { format: 'lpc', source: LPC_F_2 }, baseStrip: BASE_F_2,
    chapters: [
      { minLevel: 1,  title: 'Fille de la tempête',   text: 'Saoirse grandit dans une famille de pêcheurs sur une île battue par les vents, là où la mer ne se calme que deux mois par an. Ses frères avaient peur des tempêtes. Pas elle. À sept ans, elle s\'asseyait sur les rochers pendant les grandes houles, les yeux grands ouverts, à regarder les vagues s\'écraser en riant. Sa grand-mère disait qu\'elle était née avec le sel dans les veines. Son père disait plutôt qu\'elle allait le rendre fou. Les deux avaient raison.' },
      { minLevel: 10, title: 'Les ruines hantées',    text: 'Les ruines de Craomor avaient mauvaise réputation depuis deux générations. On disait que ceux qui y entraient n\'en revenaient pas entiers. Saoirse y alla un dimanche matin, seule, avec une lanterne et un carnet. Elle y passa deux jours. Elle en revint avec quarante pages de relevés, des esquisses de salles souterraines inconnues, et les restes d\'un pique-nique. « Il n\'y avait rien de hanté, dit-elle. Juste de vieilles pierres et quelques chauves-souris. Les gens exagèrent. »' },
      { minLevel: 20, title: 'La légende des tavernes', text: 'Les récits de ses aventures précédaient Saoirse partout où elle allait. Dans les ports, dans les auberges, dans les marchés — on racontait qu\'elle avait ri en face d\'une bête à six pattes, qu\'elle avait traversé le Marais des Ombres en sifflotant, qu\'elle avait remporté un pari contre un pirate en mangeant une plante que personne d\'autre n\'osait approcher. La plupart de ces histoires étaient vraies. Quelques-unes étaient même en dessous de la réalité.' },
      { minLevel: 30, title: 'L\'équipe d\'explorateurs', text: 'Saoirse forma une troupe de sept aventuriers qui passèrent trois ans à cartographier des territoires que les cartes officielles laissaient vides ou marquaient d\'un simple « ici, danger ». Ils en revinrent avec des dizaines de cartes détaillées, des spécimens de plantes inconnues, et assez d\'histoires pour remplir une bibliothèque. Ce fut durant ce voyage qu\'elle comprit quelque chose d\'inattendu : une aventure partagée était infiniment plus belle que la plus grande des gloires solitaires.' },
      { minLevel: 40, title: 'La vie comme aventure', text: 'À l\'âge où la plupart des gens s\'installent et regardent en arrière, Saoirse préparait déjà son prochain départ. Elle avait vu des cités enfouies, traversé des déserts à pied, dormi sous des étoiles que personne d\'autre n\'avait nommées. On lui demandait parfois si elle avait peur. Elle réfléchissait toujours un moment, comme si la question méritait d\'être prise au sérieux, puis elle répondait : « De quoi ? J\'ai déjà tout vu. » Et elle riait, ce rire particulier qu\'on reconnaissait d\'une lieue.' },
    ],
  },
  {
    id: 'f_3', gender: 'female', class: 'archer',
    name: 'Amara', tagline: 'La Gardienne des Forêts', emoji: '🌿',
    sprite: { format: 'lpc', source: LPC_F_3 }, baseStrip: BASE_F_3,
    chapters: [
      { minLevel: 1,  title: 'L\'enfant de la lisière', text: 'La maison d\'Amara se trouvait exactement à la frontière entre le village et la grande forêt — comme si ses parents avaient voulu placer leur fille entre deux mondes. Elle choisit très vite le sien. Dès qu\'elle sut marcher, elle passa plus de temps sous les arbres que dans les rues. Les oiseaux atterrissaient sur son épaule sans qu\'elle les appelle. Un renard vint manger dans sa main un matin, au grand effroi de sa mère. Amara trouva ça parfaitement normal.' },
      { minLevel: 10, title: 'Le langage des plantes',  text: 'Ce que les autres appelaient « la forêt » était pour Amara une conversation permanente qu\'il fallait apprendre à écouter. La couleur des feuilles qui tourne avant la pluie. Le parfum de la mousse humide qui annonce un champignon médicinal. Le silence soudain des oiseaux qui précède un prédateur. Elle passa des années à noter, à tester, à comprendre. Ce n\'était pas de la magie — c\'était de l\'attention. Une attention si profonde qu\'elle finissait par ressembler à de la magie.' },
      { minLevel: 20, title: 'La négociation',          text: 'Des bûcherons arrivèrent un printemps avec des haches et des contrats signés par le seigneur local. Ils avaient le droit de couper. Amara se plaça devant le premier arbre. Elle ne cria pas, ne menaça pas. Elle demanda juste à leur chef de l\'écouter trois jours. Il accepta, un peu surpris. Elle lui montra ce que ces arbres contenaient : des espèces rares, des sources cachées, des équilibres fragiles. Le chef repartit avec ses hommes. Il n\'avait pas renoncé à l\'argent. Il avait compris ce que ça coûterait vraiment.' },
      { minLevel: 30, title: 'Les druides anciens',     text: 'Un groupe de vieillards vêtus de vert parut un soir à l\'orée de la forêt et demanda à parler à « celle qui entend les arbres ». C\'étaient des druides d\'une tradition que la plupart croyaient disparue depuis des siècles. Ils la reconnurent comme l\'une des leurs sans qu\'elle ait jamais su qu\'ils existaient. Ils lui enseignèrent des rites et des savoirs que nul n\'avait transmis depuis des générations. Amara comprit alors que certains héritages n\'attendent pas qu\'on les cherche — ils vous trouvent.' },
      { minLevel: 40, title: 'La voix de la forêt',    text: 'Les années passèrent, et quelque chose changea dans la façon dont les gens parlaient de la forêt. On ne disait plus « le bois » ou « les arbres » — on disait « chez Amara ». Les décisions qui touchaient la nature passaient par elle. Pas par obligation légale, mais parce que les gens avaient appris ce qui arrivait quand on n\'écoutait pas. La forêt était en paix. Et Amara, assise chaque soir sur ses racines préférées, entendait les arbres lui raconter ce qui s\'était passé dans la journée.' },
    ],
  },
  {
    id: 'f_4', gender: 'female', class: 'mage',
    name: 'Nadia', tagline: 'L\'Œil du Destin', emoji: '🔮',
    sprite: { format: 'lpc', source: LPC_F_4 }, baseStrip: BASE_F_4,
    chapters: [
      { minLevel: 1,  title: 'Née sous l\'éclipse',    text: 'Nadia naquit pendant une éclipse totale, dans un village où les anciens prenaient ces choses-là au sérieux. Ils dirent que les étoiles elles-mêmes avaient guidé son âme jusqu\'à eux, et ils la regardèrent différemment depuis ce premier jour. Elle grandit entourée de cette réputation qu\'elle n\'avait pas choisie. Les enfants la craignaient un peu. Les adultes lui posaient parfois des questions étranges, comme si elle était censée avoir les réponses. Elle apprit très tôt à écouter avant de parler.' },
      { minLevel: 10, title: 'Les rêves des autres',   text: 'Nadia découvrit son don par accident, en dormant chez une amie : elle se réveilla en connaissant un secret que son amie n\'avait jamais dit à voix haute, mais qui flottait dans ses rêves. Elle apprit à naviguer dans les songes des autres comme on explore une maison inconnue — avec respect, sans ouvrir les portes fermées. Ce qu\'elle y trouvait n\'était jamais aussi simple que prévu. Les gens rêvaient de ce qu\'ils désiraient, de ce qu\'ils craignaient, et souvent des deux en même temps.' },
      { minLevel: 20, title: 'Le miroir du sorcier',   text: 'Un sorcier vint la trouver un soir, avec l\'intention claire de lui prendre ses dons par la force. Il était puissant, expérimenté, et convaincu de gagner. Nadia n\'essaya pas de combattre. Elle le regarda simplement dans les yeux — longtemps, sans ciller. Le sorcier commença à trembler. Il voyait quelque chose dans ce regard qu\'il n\'avait jamais voulu affronter. Il repartit sans un mot, et ne revint jamais. On lui demanda plus tard ce qu\'elle lui avait fait. « Rien, dit-elle. Je lui ai juste montré qui il était vraiment. »' },
      { minLevel: 30, title: 'La Conseillère',         text: 'Des gens commencèrent à venir de loin pour la voir — des rois, des marchands, des pères de famille ordinaires, tous portant leurs doutes et leurs peurs comme un fardeau trop lourd. Nadia écoutait longuement, posait parfois une question, et se taisait. Elle ne donnait pas de réponses. Elle aidait les gens à trouver les leurs, celles qu\'ils portaient déjà en eux mais n\'osaient pas regarder en face. Certains repartaient déçus. La plupart repartaient soulagés. Quelques-uns revenaient la remercier des mois plus tard.' },
      { minLevel: 40, title: 'Le vrai don',            text: 'Nadia passa des années à croire que son don était de voir l\'avenir. Elle finit par comprendre que c\'était une erreur — et que c\'était tant mieux. L\'avenir n\'est pas fixe. Il se construit, se modifie, se choisit. Son vrai don était tout autre : aider les gens à voir clairement le présent, pour qu\'ils puissent forger eux-mêmes leur propre chemin. Un soir, en regardant les étoiles depuis le toit de sa maison, elle se dit que c\'était de loin la chose la plus utile qu\'on puisse faire pour quelqu\'un.' },
    ],
  },
];

export function getPresetById(id: string): CharacterPreset | undefined {
  return CHARACTER_PRESETS.find(p => p.id === id);
}

export function getPresetSprite(id: string): SpriteConfig {
  const preset = getPresetById(id);
  return preset?.sprite ?? { format: 'lpc', source: LPC_M_1 };
}

export function getUnlockedChapters(preset: CharacterPreset, level: number): StoryChapter[] {
  return preset.chapters.filter(c => level >= c.minLevel);
}

export const DEFAULT_PRESET = 'm_1';
