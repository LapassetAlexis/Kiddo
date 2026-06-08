/**
 * Tests unitaires pour lib/formatName.ts
 * Fonction pure — aucun mock nécessaire.
 */

import { formatName } from '@/lib/formatName';

describe('formatName — depuis le nom', () => {
  it('capitalise chaque mot d\'un nom en minuscules', () => {
    expect(formatName('alexis lapasset')).toBe('Alexis Lapasset');
  });

  it('met en minuscule les mots entièrement en majuscules', () => {
    expect(formatName('ALEXIS')).toBe('Alexis');
  });

  it('capitalise uniquement le premier caractère quand le nom contient un point', () => {
    // name.trim() = 'alexis.lapasset', pas de split sur '.', → un seul mot → 'Alexis.lapasset'
    expect(formatName('alexis.lapasset')).toBe('Alexis.lapasset');
  });

  it('traite le tiret comme faisant partie du mot (pas de split sur "-")', () => {
    expect(formatName('jean-pierre dupont')).toBe('Jean-pierre Dupont');
  });

  it('ignore les espaces multiples entre les mots', () => {
    expect(formatName('alexis  lapasset')).toBe('Alexis Lapasset');
  });
});

describe('formatName — fallback depuis l\'email', () => {
  it('extrait et formate la partie locale de l\'email (points → espaces)', () => {
    expect(formatName(null, 'alexis.lapasset@example.com')).toBe('Alexis Lapasset');
  });

  it('extrait et formate la partie locale d\'un email simple', () => {
    expect(formatName(null, 'john@example.com')).toBe('John');
  });

  it('remplace les underscores par des espaces dans la partie locale', () => {
    expect(formatName(null, 'jean_paul@example.com')).toBe('Jean Paul');
  });

  it('remplace les tirets par des espaces dans la partie locale', () => {
    expect(formatName(null, 'jean-paul@example.com')).toBe('Jean Paul');
  });
});

describe('formatName — priorité nom vs email', () => {
  it('utilise l\'email quand name est une chaîne de blancs', () => {
    // name.trim() = '' → falsy → fallback sur l'email
    expect(formatName('  ', 'fallback@example.com')).toBe('Fallback');
  });

  it('préfère le nom sur l\'email quand le nom est fourni', () => {
    expect(formatName('alexis', 'other@example.com')).toBe('Alexis');
  });
});

describe('formatName — valeurs vides / nulles', () => {
  it('retourne une chaîne vide quand name et email sont undefined', () => {
    expect(formatName(undefined, undefined)).toBe('');
  });

  it('retourne une chaîne vide quand name et email sont null', () => {
    expect(formatName(null, null)).toBe('');
  });

  it('retourne une chaîne vide sans arguments', () => {
    expect(formatName()).toBe('');
  });
});
