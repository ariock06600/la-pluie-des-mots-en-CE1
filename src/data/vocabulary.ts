/**
 * Base de vocabulaire CE1 (élèves de 7-8 ans en France).
 * Thèmes : animaux, nature, école, famille, objets du quotidien, verbes simples.
 * Tous les mots sont triés par longueur (<= 5 lettres et 6 à 10 lettres)
 * et par présence d'accents ou caractères spéciaux (' et -).
 */

export const SINGLE_LETTERS_PLAIN: readonly string[] = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm',
  'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z',
];

export const SINGLE_SPECIAL_CHARS: readonly string[] = [
  'é', 'è', 'ê', 'à', 'ç', 'ô', 'ù', 'î', 'â', "'", '-',
];

/** Mots CE1 de 5 lettres maximum, sans accent ni caractère spécial */
export const SHORT_PLAIN_WORDS: readonly string[] = [
  // Animaux
  'chat', 'chien', 'loup', 'ours', 'lion', 'lapin', 'poule', 'vache', 'tigre', 'singe',
  'rat', 'coq', 'cerf', 'biche', 'merle', 'cygne', 'paon', 'ver',
  // Nature
  'mer', 'lac', 'ciel', 'vent', 'pluie', 'neige', 'fleur', 'arbre', 'herbe', 'terre',
  'lune', 'nuage', 'bois', 'roche', 'sable', 'eau', 'feu', 'pont',
  // École & Objets
  'livre', 'stylo', 'gomme', 'colle', 'table', 'banc', 'craie', 'sac', 'page', 'mot',
  'lit', 'porte', 'mur', 'toit', 'train', 'moto', 'bus', 'tasse', 'verre', 'bol',
  'robe', 'jupe', 'pull', 'gant', 'balle', 'cube', 'carte', 'lampe', 'clef',
  // Famille & Corps
  'papa', 'maman', 'fille', 'ami', 'amie', 'main', 'pied', 'nez', 'yeux', 'bras',
  'dos', 'dent', 'joue', 'front', 'voix',
  // Nourriture
  'pain', 'lait', 'pomme', 'poire', 'jus', 'sucre', 'sel', 'miel', 'oeuf', 'soupe',
  // Verbes simples
  'jouer', 'lire', 'rire', 'voir', 'dire', 'aller', 'venir', 'aimer', 'poser', 'laver',
];

/** Mots CE1 de 5 lettres maximum, avec accents français ou caractères spéciaux (' -) */
export const SHORT_ACCENTED_WORDS: readonly string[] = [
  'école', 'élève', 'père', 'mère', 'frère', 'bébé', 'forêt', 'chêne', 'bête', 'tête',
  'fête', 'rêve', 'crème', 'vélo', 'café', 'thé', 'côté', 'rôti', 'flûte', 'guêpe',
  'poêle', 'noël', 'maïs', 'reçu', 'déçu', 'leçon', 'façon', 'pièce', 'nièce', 'fière',
  'lèvre', 'chère', 'pêche', 'bûche', 'règle', 'fusée', 'dîner', 'rêver', 'tôt', 'zèbre',
  "l'eau", "l'ami", "l'âne", "l'été", "l'or", "l'île", "d'or", "d'eau", 'âne', 'île',
  'âge', 'épée', 'fée', 'clé', 'blé', 'pré', 'dé', 'héros', 'mûre', 'sûr',
];

/** Mots CE1 de 6 à 10 lettres, sans accent ni caractère spécial */
export const LONG_PLAIN_WORDS: readonly string[] = [
  // Animaux
  'cheval', 'mouton', 'tortue', 'oiseau', 'canard', 'souris', 'cochon', 'girafe', 'renard',
  'dauphin', 'requin', 'abeille', 'fourmi', 'papillon', 'grenouille', 'crocodile', 'kangourou',
  // Nature
  'soleil', 'montagne', 'jardin', 'prairie', 'feuille', 'caillou', 'cascade', 'colline',
  'volcan', 'nuages', 'orage', 'printemps',
  // École & Objets
  'cartable', 'crayon', 'cahier', 'trousse', 'ardoise', 'bureau', 'classe', 'peinture',
  'ciseaux', 'classeur', 'ballon', 'camion', 'voiture', 'bateau', 'chapeau', 'manteau',
  'bonnet', 'chaussure', 'chemise', 'pantalon', 'chaussette', 'fourchette', 'couteau', 'assiette',
  // Famille & Maison
  'copain', 'copine', 'famille', 'cousin', 'cousine', 'maison', 'cuisine', 'chambre', 'couloir',
  // Nourriture
  'salade', 'tomate', 'carotte', 'banane', 'orange', 'fraise', 'cerise', 'citron', 'bonbon',
  'chocolat', 'biscuit', 'tartine', 'fromage',
  // Verbes simples
  'chanter', 'danser', 'sauter', 'courir', 'dormir', 'manger', 'parler', 'dessiner', 'compter',
  'trouver', 'montrer', 'marcher', 'souffler', 'sourire', 'grandir', 'regarder', 'attraper',
];

/** Mots CE1 de 6 à 10 lettres, avec accents français ou caractères spéciaux (' -) */
export const LONG_ACCENTED_WORDS: readonly string[] = [
  'éléphant', 'hérisson', 'araignée', 'écureuil', 'caméléon', 'lézard', 'guépard',
  'château', 'rivière', 'tempête', 'grand-père', 'grand-mère', 'porte-clé', 'téléphone',
  'récréation', 'maîtresse', 'écriture', 'géométrie', 'poésie', "l'école", "l'oiseau",
  "l'étoile", "l'arbre", "l'enfant", "l'automne", "l'histoire", "l'océan", 'pâtisserie',
  'crêperie', 'garçon', 'français', 'glaçon', 'hameçon', 'balançoire', 'fenêtre',
  'théâtre', 'gâteau', 'cuillère', 'lumière', 'étoile', 'planète', 'météore', 'cinéma',
  'numéro', 'télévision', 'déjeuner', 'goûter', 'célébrer', 'écouter', 'écrire', 'préparer',
  'protéger', 'réussir', 'découvrir', 'aperçu', 'bientôt', 'après-midi', 'demi-tour',
  'peut-être', 'sous-marin', 'tire-lire', 'écharpe', 'poupée', 'étiquette', 'compléter',
];
