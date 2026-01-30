// Urdu language detection and text filtering utilities

// Unicode ranges for Urdu characters
const URDU_UNICODE_RANGES = [
  [0x0600, 0x06FF],   // Arabic block (includes Urdu)
  [0x0750, 0x077F],   // Arabic Supplement
  [0x08A0, 0x08FF],   // Arabic Extended-A
  [0xFB50, 0xFDFF],   // Arabic Presentation Forms-A
  [0xFE70, 0xFEFF],   // Arabic Presentation Forms-B
]

// Common Urdu words that might appear in mixed text
const COMMON_URDU_WORDS = [
  'آپ', 'تم', 'ہم', 'وہ', 'یہ', 'کہ', 'کو', 'سے', 'پر', 'میں', 'کا', 'کی', 'کے',
  'ہے', 'ہیں', 'تھا', 'تھی', 'تھے', 'ہوں', 'ہوگا', 'ہوگی', 'ہوںگے',
  'کرنا', 'کرے', 'کرتا', 'کرو', 'دیں', 'دے', 'دیتا', 'دو',
  'جانا', 'جائے', 'جاتا', 'جاؤ',
  'لینا', 'لے', 'لیا', 'لو',
  'دیکھنا', 'دیکھو', 'دیکھتا', 'دیکھی',
  'سننا', 'سنو', 'سنتا', 'سنی',
  'پڑھنا', 'پڑھو', 'پڑھتا', 'پڑھی',
  'لکھنا', 'لکھو', 'لکھتا', 'لکھی',
  'بہت', 'زیادہ', 'کم', 'اچھا', 'خراب', 'بڑا', 'چھوٹا',
  'محمد', 'علی', 'حسن', 'حسین', 'فاطمہ', 'خدیجہ', 'عیشہ',
  'السلام', 'والسلام', 'اللہ', 'محمد', 'رسول', 'نبی',
  'شکریہ', 'مہربانی', 'معذرت', 'برائے مہربانی',
  'جی', 'جی ہاں', 'نہیں', 'ہاں', 'نہ',
  'براہ کرم', 'خیال', 'خیر', 'خیریت'
]

/**
 * Check if a character is in Urdu Unicode range
 */
export const isUrduCharacter = (char: string): boolean => {
  const code = char.charCodeAt(0)
  return URDU_UNICODE_RANGES.some(([start, end]) => code >= start && code <= end)
}

/**
 * Count Urdu characters in text
 */
export const countUrduCharacters = (text: string): number => {
  return Array.from(text).filter(char => isUrduCharacter(char)).length
}

/**
 * Check if text contains any Urdu words
 */
export const containsUrduWords = (text: string): boolean => {
  return COMMON_URDU_WORDS.some(word => text.includes(word))
}

/**
 * Calculate percentage of Urdu characters in text
 */
export const getUrduCharacterPercentage = (text: string): number => {
  if (!text || text.length === 0) return 0
  const urduChars = countUrduCharacters(text)
  return (urduChars / text.length) * 100
}

/**
 * Detect if text is primarily Urdu (contains more than 30% Urdu characters)
 */
export const isPrimarilyUrdu = (text: string): boolean => {
  return getUrduCharacterPercentage(text) > 30
}

/**
 * Remove Urdu words from mixed text while preserving English content
 */
export const removeUrduWordsFromText = (text: string): string => {
  let cleanedText = text
  
  // Remove common Urdu words
  COMMON_URDU_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi')
    cleanedText = cleanedText.replace(regex, '')
  })
  
  // Remove isolated Urdu characters
  cleanedText = cleanedText.replace(/[؀-ۿ]/g, '')
  
  // Clean up extra spaces
  cleanedText = cleanedText.replace(/\s+/g, ' ').trim()
  
  return cleanedText
}

/**
 * Extract Urdu text from mixed content
 */
export const extractUrduText = (text: string): string => {
  const urduChars = Array.from(text).filter(char => isUrduCharacter(char))
  return urduChars.join('')
}

/**
 * Detect language of text with confidence score
 */
export const detectLanguageWithConfidence = (text: string): {
  language: 'english' | 'urdu' | 'mixed'
  urduPercentage: number
  englishPercentage: number
  confidence: number
} => {
  const totalLength = text.length
  if (totalLength === 0) {
    return {
      language: 'english',
      urduPercentage: 0,
      englishPercentage: 0,
      confidence: 0
    }
  }

  const urduCharCount = countUrduCharacters(text)
  const urduPercentage = (urduCharCount / totalLength) * 100
  const englishPercentage = ((totalLength - urduCharCount) / totalLength) * 100

  let language: 'english' | 'urdu' | 'mixed'
  let confidence: number

  if (urduPercentage > 70) {
    language = 'urdu'
    confidence = urduPercentage / 100
  } else if (urduPercentage < 10) {
    language = 'english'
    confidence = englishPercentage / 100
  } else {
    language = 'mixed'
    confidence = Math.min(urduPercentage, englishPercentage) / 100
  }

  return {
    language,
    urduPercentage,
    englishPercentage,
    confidence
  }
}

/**
 * Clean mixed content by separating Urdu and English
 */
export const separateUrduAndEnglish = (text: string): {
  englishText: string
  urduText: string
  originalText: string
  containsMixed: boolean
} => {
  const detection = detectLanguageWithConfidence(text)
  const containsMixed = detection.language === 'mixed'

  let englishText = ''
  let urduText = ''

  if (containsMixed) {
    // Separate character by character
    let currentEnglishWord = ''
    let currentUrduWord = ''
    let inEnglishMode = null

    for (const char of text) {
      const isUrdu = isUrduCharacter(char)
      const isSpace = char === ' ' || char === '\n' || char === '\t'

      if (isSpace) {
        // Add words to respective buckets
        if (currentEnglishWord) {
          englishText += currentEnglishWord + char
          currentEnglishWord = ''
        }
        if (currentUrduWord) {
          urduText += currentUrduWord + char
          currentUrduWord = ''
        }
        englishText += char
        urduText += char
        inEnglishMode = null
      } else if (isUrdu) {
        if (inEnglishMode === true && currentEnglishWord) {
          englishText += currentEnglishWord
          currentEnglishWord = ''
        }
        currentUrduWord += char
        inEnglishMode = false
      } else {
        if (inEnglishMode === false && currentUrduWord) {
          urduText += currentUrduWord
          currentUrduWord = ''
        }
        currentEnglishWord += char
        inEnglishMode = true
      }
    }

    // Add remaining words
    if (currentEnglishWord) englishText += currentEnglishWord
    if (currentUrduWord) urduText += currentUrduWord

    // Clean up extra spaces
    englishText = englishText.replace(/\s+/g, ' ').trim()
    urduText = urduText.replace(/\s+/g, ' ').trim()
  } else if (detection.language === 'urdu') {
    urduText = text
    englishText = ''
  } else {
    englishText = text
    urduText = ''
  }

  return {
    englishText,
    urduText,
    originalText: text,
    containsMixed
  }
}

/**
 * Check if a review should be flagged for mixed language
 */
export const shouldFlagForMixedLanguage = (text: string): boolean => {
  const detection = detectLanguageWithConfidence(text)
  return detection.language === 'mixed' && detection.confidence > 0.5
}

/**
 * Generate language analysis report
 */
export const generateLanguageReport = (text: string): {
  totalCharacters: number
  urduCharacters: number
  englishCharacters: number
  urduPercentage: number
  englishPercentage: number
  detectedLanguage: string
  containsUrduWords: boolean
  hasMixedContent: boolean
  recommendations: string[]
} => {
  const totalCharacters = text.length
  const urduCharacters = countUrduCharacters(text)
  const englishCharacters = totalCharacters - urduCharacters
  const urduPercentage = (urduCharacters / totalCharacters) * 100
  const englishPercentage = (englishCharacters / totalCharacters) * 100
  const containsUrduWordsCheck = containsUrduWords(text)
  const detection = detectLanguageWithConfidence(text)
  const hasMixedContent = detection.language === 'mixed'

  const recommendations: string[] = []
  
  if (hasMixedContent) {
    recommendations.push('Content contains mixed Urdu and English text')
    recommendations.push('Consider separating languages for better clarity')
  }
  
  if (urduPercentage > 20 && urduPercentage < 80) {
    recommendations.push('Mixed language detected - may affect AI response quality')
  }
  
  if (containsUrduWordsCheck) {
    recommendations.push('Common Urdu words found in text')
  }

  return {
    totalCharacters,
    urduCharacters,
    englishCharacters,
    urduPercentage,
    englishPercentage,
    detectedLanguage: detection.language,
    containsUrduWords: containsUrduWordsCheck,
    hasMixedContent,
    recommendations
  }
}