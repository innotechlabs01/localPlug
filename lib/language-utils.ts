/**
 * Detects the language of a given text.
 * This is a simple heuristic-based detector for English and Spanish.
 * For production, consider using a more robust library like 'langdetect' or 'franc'.
 * 
 * @param text - The text to analyze
 * @returns 'en' for English, 'es' for Spanish, or 'unknown' if unable to determine
 */
export function detectLanguage(text: string): 'en' | 'es' | 'unknown' {
  if (!text || typeof text !== 'string') {
    return 'unknown';
  }

  // Convert to lowercase for easier matching
  const lowerText = text.toLowerCase();

  // Common Spanish words and characters
  const spanishIndicators = [
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', // articles
    'y', 'o', 'pero', 'porque', 'como', 'cuando', 'donde', 'quien', 'que', // conjunctions and question words
    'estoy', 'estas', 'esta', 'estamos', 'estais', 'estan', // estar
    'soy', 'eres', 'es', 'somos', 'sois', 'son', // ser
    'tengo', 'tienes', 'tiene', 'tenemos', 'teneis', 'tienen', // tener
    'hacer', 'hago', 'haces', 'hace', 'hacemos', 'haceis', 'hacen', // hacer
    'ir', 'voy', 'vas', 'va', 'vamos', 'vais', 'van', // ir
    'por', 'para', 'con', 'sin', 'sobre', 'bajo', 'entre', // prepositions
    'gracias', 'por favor', 'disculpe', 'perdón', 'lo siento', // polite words
    'si', 'no', 'también', 'pero', 'aunque', // adverbs
    '¿', '¡', 'ñ', 'á', 'é', 'í', 'ó', 'ú', 'ü' // special Spanish characters
  ];

  // Common English words
  const englishIndicators = [
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see',
    'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think',
    'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well',
    'way', 'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
  ];

  // Count matches for each language
  let spanishCount = 0;
  let englishCount = 0;

  // Check for special Spanish characters first (strong indicator)
  if (/[áéíóúüñ]/i.test(text)) {
    spanishCount += 3; // Give extra weight to special characters
  }
  if (/[¿¡]/.test(text)) {
    spanishCount += 2; // Inverted question/exclamation marks are strong indicators
  }

  // Check for word matches
  const words = lowerText.match(/\b\w+\b/g) || [];
  for (const word of words) {
    if (spanishIndicators.includes(word)) {
      spanishCount++;
    }
    if (englishIndicators.includes(word)) {
      englishCount++;
    }
  }

  // Determine the language based on counts
  if (spanishCount > englishCount) {
    return 'es';
  } else if (englishCount > spanishCount) {
    return 'en';
  } else {
    // If equal or neither, default to unknown
    // In a real app, we might look at the user's profile or default to a language
    return 'unknown';
  }
}