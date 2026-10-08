/**
 * AttendGuard Question Intent Classifier
 * 
 * High-precision categorization of student queries into 9 distinct intent categories
 * without inventing facts or hallucinating missing parameters.
 */

import { HardenedQuestionCategory, LegacyQuestionCategory } from './types';

/**
 * Regex patterns for adversarial attacks and prompt injection.
 */
const ADVERSARIAL_PATTERNS = [
  /(?:ignore|disregard|bypass|override|forget|reset|hack|alter|edit|modify|change|update|mark|excuse|remove|delete|pretend|say|claim).*(?:instruction|rule|rules|prompt|data|record|records|attendance|database|policy|status|present|absence|absences|absent|all\s+classes|classes|different\s+numbers|look\s+better|safe|no\s+risk|debarment|debarred|cancelled)/i,
  /(?:pretend|act\s+as\s+if|make\s+believe|say|tell\s+me).*(?:i\s+have|my\s+attendance|attendance\s+is|\d+%|0\s+absences|safe|no\s+risk)/i,
  /(?:official\s+records?|database|system)\s+(?:is|are)\s+(?:wrong|incorrect|false|bugged)/i,
  /(?:developer|system|admin|administrator|root|superuser)\s+(?:mode|override|privilege|access)/i,
  /(?:do\s+not\s+use|don't\s+use|stop\s+using)\s+(?:the\s+)?(?:database|records?|actual\s+numbers?|official)/i,
  /(?:make|show|present)\s+(?:my\s+)?attendance\s+(?:look\s+)?(?:better|higher|100%|great)/i,
  /(?:fake\s+numbers?|fake\s+data|make\s+up\s+good|false\s+attendance|make\s+up\s+numbers?)/i,
  /you\s+are\s+now\s+(?:an?\s+)?(?:administrator|teacher|unrestricted|jailbroken)/i,
  /(?:use\s+this\s+new|use\s+different)\s+(?:attendance|number|percentage)/i,
  /system\s+prompt/i,
  /ignore\s+previous|disregard\s+previous/i,
  /say\s+that\s+i\s+have/i,
  /debarment\s+is\s+cancelled/i,
  /cannot\s+be\s+debarred/i,
];

/**
 * Regex pattern for conversational greetings.
 */
const GREETING_PATTERN =
  /^(?:hi|hello|hey|hiya|howdy|greetings|good\s+(?:morning|afternoon|evening|day))(?:\s+(?:there|attendguard|advisor|ai|bot|team|assistant|everyone))?[!.,\s]*$/i;

/**
 * Regex patterns for unsupported non-academic queries.
 */
const UNSUPPORTED_PATTERNS = [
  /\b(?:joke|funny|weather|temperature|recipe|song|sing|poem|story|movie|game|capital\s+of|president|who\s+won|stock\s+price)\b/i,
];

/**
 * Regex patterns for recovery calculation queries.
 */
const RECOVERY_PATTERNS = [
  /how\s+many\s+(?:[a-z0-9#+.]+\s+)?(?:more\s+)?classes\s+(?:do\s+i\s+)?(?:need|must\s+i)/i,
  /how\s+many\s+(?:[a-z0-9#+.]+\s+)?classes\s+(?:do\s+i\s+)?need/i,
  /classes\s+(?:do\s+i\s+)?need/i,
  /classes\s+needed/i,
  /to\s+reach\s+(?:75%?|threshold|minimum)/i,
  /to\s+get\s+(?:75%?|to\s+75%?)/i,
  /consecutive\s+classes/i,
  /how\s+long\s+will\s+it\s+take\s+to\s+recover/i,
  /how\s+many\s+more\s+classes\s+must\s+i\s+attend/i,
  /recovery\s+(?:target|plan|classes|roadmap)/i,
  /classes\s+needed\s+(?:to\s+reach|for\s+75|in\s+[a-z]+)/i,
];

/**
 * Regex patterns for safe miss queries.
 */
const SAFE_MISSES_PATTERNS = [
  /how\s+many\s+(?:[a-z0-9#+.]+\s+)?classes\s+can\s+i\s+(?:safely\s+)?(?:miss|skip)/i,
  /how\s+many\s+(?:safe\s+)?absences?\s+(?:can\s+i|do\s+i\s+have|can\s+i\s+afford)/i,
  /can\s+i\s+(?:safely\s+)?(?:miss|skip)/i,
  /safely\s+(?:miss|skip)/i,
  /safe\s+(?:miss|skip|absence)/i,
  /how\s+many\s+more\s+classes\s+can\s+i\s+skip\s+safely/i,
  /afford\s+to\s+(?:miss|skip)/i,
  /afford\s+absence/i,
];

/**
 * Regex patterns for purely numerical count/percentage questions.
 */
const NUMERICAL_PATTERNS = [
  /what\s+percentage\s+(?:of\s+classes\s+)?have\s+i\s+attended/i,
  /what\s+is\s+my\s+(?:current\s+)?percentage/i,
  /what\s+is\s+my\s+[a-z0-9#+.]+\s+percentage/i,
  /percentage\s+of\s+classes/i,
  /show\s+my\s+attendance\s+percentage/i,
  /how\s+many\s+classes\s+have\s+i\s+attended/i,
  /how\s+many\s+classes\s+did\s+i\s+attend/i,
  /how\s+many\s+classes\s+have\s+i\s+missed/i,
  /how\s+many\s+classes\s+did\s+i\s+miss/i,
  /attended\s+count/i,
  /missed\s+count/i,
  /exact\s+(?:numbers?|percentage|counts?)/i,
  /total\s+classes\s+(?:held|conducted|attended)/i,
];

/**
 * Regex patterns for subject comparison and risk analysis.
 */
const SUBJECT_ANALYSIS_PATTERNS = [
  /which\s+(?:subject|course|class)s?\s+(?:is|has|are)\s+(?:the\s+|my\s+)?(?:weakest|highest\s+risk|lowest|critical|worst|(?:most\s+)?at\s+risk|in\s+danger|safe|failing)/i,
  /which\s+(?:subject|course|class)s?\s+(?:should\s+i\s+focus\s+on|(?:needs|requires)\s+(?:the\s+most\s+)?attention)/i,
  /needs?\s+(?:the\s+most\s+)?attention/i,
  /which\s+(?:subject|course|class)s?\s+(?:are|is)\s+(?:critical|(?:most\s+)?at\s+risk|safe|in\s+danger)/i,
  /which\s+(?:subject|course|class)s?\s+(?:is|are)\s+(?:most\s+)?at\s+risk/i,
  /which\s+courses\s+are\s+below\s+75/i,
  /rank\s+(?:my\s+)?(?:subjects?|courses?)\s+(?:by\s+risk)?/i,
  /what\s+are\s+my\s+(?:three\s+|top\s+)?weakest\s+(?:subjects|courses)/i,
  /how\s+is\s+my\s+[a-z0-9#+.]+(?:\s+[a-z0-9#+.]+)?\s+(?:attendance|looking)/i,
  /what(?:'s|\s+is)\s+my\s+[a-z0-9#+.]+(?:\s+[a-z0-9#+.]+)?\s+(?:attendance|percentage|standing)/i,
  /standing\s+in\s+[a-z0-9#+.]+/i,
  /attendance\s+in\s+[a-z0-9#+.]+/i,
  /compare\s+my\s+[a-z0-9#+.]+/i,
  /list\s+all\s+my\s+subjects/i,
  /break\s+down\s+all\s+my\s+courses/i,
  /why\s+is\s+that\s+subject\s+risky/i,
];

/**
 * Regex patterns for general guidance / improvement strategy.
 */
const ADVICE_PATTERNS = [
  /how\s+can\s+i\s+improve\s+(?:my\s+)?attendance/i,
  /what\s+should\s+i\s+do\s+(?:first|now)/i,
  /tips?\s+to\s+(?:improve|maintain)/i,
  /study\s+strategy|action\s+plan/i,
  /recommendations?|advice\s+for\s+me/i,
];

/**
 * Regex patterns for factual overview / standing questions.
 */
const FACTUAL_PATTERNS = [
  /how\s+(?:is|am)\s+(?:my|i\s+doing\s+with)\s+attendance/i,
  /how\s+am\s+i\s+doing(?:\s+overall)?/i,
  /am\s+i\s+doing\s+okay/i,
  /what(?:'s|\s+is)\s+my\s+(?:current\s+)?(?:attendance|standing|status)/i,
  /summarize\s+(?:my\s+)?(?:attendance\s+)?(?:status|standing|overview|record)?/i,
  /attendance\s+(?:overview|status|standing|summary)/i,
  /how\s+bad\s+is\s+my\s+attendance/i,
  /am\s+i\s+in\s+danger(?:\s+because\s+of\s+attendance)?/i,
  /what\s+is\s+my\s+biggest\s+attendance\s+problem/i,
  /what\s+should\s+i\s+worry\s+about/i,
];

/**
 * Classifies query into one of the 9 hardened intent categories.
 */
export function classifyHardenedQuestion(query: string): HardenedQuestionCategory {
  const q = (query || '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .trim();

  // 1. Adversarial / Prompt Injection
  for (const pat of ADVERSARIAL_PATTERNS) {
    if (pat.test(q)) {
      return 'ADVERSARIAL';
    }
  }

  // 1b. Greetings
  if (GREETING_PATTERN.test(q)) {
    return 'GREETING';
  }

  // 2. Unsupported / Off-topic
  for (const pat of UNSUPPORTED_PATTERNS) {
    if (pat.test(q)) {
      return 'UNSUPPORTED';
    }
  }

  // 3. Ambiguous queries requiring subject context or clarification
  if (
    /^(?:can\s+i\s+(?:skip|miss)(?:\s+class)?(?:\s+tomorrow)?\??)$/i.test(q) ||
    /^(?:am\s+i\s+(?:safe|okay|good\s+to\s+skip)\??)$/i.test(q) ||
    /^(?:what\s+should\s+i\s+do\??|should\s+i\s+go\s+to\s+class\??)$/i.test(q) ||
    /^(?:can\s+i\s+afford(?:\s+an?)?\s+absence\??)$/i.test(q) ||
    /^(?:is\s+it\s+fine\s+if\s+i\s+take\s+a\s+day\s+off\??)$/i.test(q) ||
    /^(?:how\s+much\s+attendance\s+do\s+i\s+need\??)$/i.test(q)
  ) {
    return 'AMBIGUOUS';
  }

  // 4. Recovery Calculations
  for (const pat of RECOVERY_PATTERNS) {
    if (pat.test(q)) {
      return 'RECOVERY';
    }
  }

  // 5. Safe Miss Calculations
  for (const pat of SAFE_MISSES_PATTERNS) {
    if (pat.test(q)) {
      return 'SAFE_MISSES';
    }
  }

  // 6. Numerical Counts and Percentages
  for (const pat of NUMERICAL_PATTERNS) {
    if (pat.test(q)) {
      return 'NUMERICAL';
    }
  }

  // 7. Subject-Specific and Multi-Subject Analysis
  for (const pat of SUBJECT_ANALYSIS_PATTERNS) {
    if (pat.test(q)) {
      return 'SUBJECT_ANALYSIS';
    }
  }

  // 8. Advice and Strategy
  for (const pat of ADVICE_PATTERNS) {
    if (pat.test(q)) {
      return 'GENERAL_ADVICE';
    }
  }

  // 9. Factual Status and Summaries
  for (const pat of FACTUAL_PATTERNS) {
    if (pat.test(q)) {
      return 'FACTUAL';
    }
  }

  return 'FACTUAL';
}

/**
 * Maps hardened categories back to legacy categories for backwards compatibility.
 */
export function mapToLegacyCategory(
  hardened: HardenedQuestionCategory
): LegacyQuestionCategory {
  switch (hardened) {
    case 'GREETING':
      return 'GREETING';
    case 'ADVERSARIAL':
    case 'UNSUPPORTED':
      return 'UNSUPPORTED';
    case 'RECOVERY':
    case 'SAFE_MISSES':
    case 'NUMERICAL':
      return 'CALCULATION';
    case 'SUBJECT_ANALYSIS':
      return 'RISK';
    case 'FACTUAL':
      return 'SUMMARY';
    case 'GENERAL_ADVICE':
    case 'AMBIGUOUS':
    default:
      return 'GENERAL';
  }
}
