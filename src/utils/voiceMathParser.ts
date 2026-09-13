// Voice Speech-to-Math Intelligent Natural Language Parser
// 100% Client-Side, Zero Network Overhead, Fully Offline Capable

export interface ParsedVoiceResult {
  rawTranscript: string;
  mathExpression: string;
  displayExpression: string;
  isClearCommand: boolean;
  isComplete: boolean;
  spokenIntentSummary: string;
}

/**
 * Normalizes and converts spoken speech transcript into structured, evaluatable math expressions.
 * Handles conversational queries, colloquial mathematical terms (additional, sub, multiple, div, percentage, etc.),
 * spoken word numbers, scales (lakh, crore, million, billion, k), powers, roots, trigonometry, and compound percent math.
 */
export function parseVoiceToMath(transcript: string): ParsedVoiceResult {
  if (!transcript || !transcript.trim()) {
    return {
      rawTranscript: '',
      mathExpression: '',
      displayExpression: '',
      isClearCommand: false,
      isComplete: false,
      spokenIntentSummary: '',
    };
  }

  let text = transcript.toLowerCase().trim();

  // 1. Check for immediate Reset / Clear Commands
  if (
    /\b(clear all|all clear|clear|reset|start over|erase all|erase|delete all|wipe out)\b/i.test(text) &&
    !/\b(plus|add|minus|sub|multiple|div|times)\b/i.test(text)
  ) {
    return {
      rawTranscript: transcript,
      mathExpression: '0',
      displayExpression: '0',
      isClearCommand: true,
      isComplete: true,
      spokenIntentSummary: 'Reset / Cleared calculator',
    };
  }

  // 2. Remove conversational intro stems & filler phrases
  text = text
    .replace(
      /\b(what is|what's|what will be|how much is|how much|calculate|compute|solve|tell me|please|can you|find|result of|value of|give me|evaluate|total of|sum of all|answer of)\b/gi,
      ' '
    )
    .trim();

  // 3. Remove politeness or question words at ends
  text = text.replace(/\b(please|thanks|thank you|now)\b/gi, '').trim();

  // 4. Transform prepositional prefix operations:
  // "sub 20 from 100" -> "100 - 20"
  // "subtract 35 from 500" -> "500 - 35"
  // "deduct 50 from 200" -> "200 - 50"
  text = text.replace(
    /\b(?:sub|subtract|subtraction|deduct|take away)\s+([a-z0-9.]+(?:\s+[a-z0-9.]+)?)\s+from\s+([a-z0-9.]+(?:\s+[a-z0-9.]+)?)\b/gi,
    '$2 - $1'
  );

  // "additional 50 to 100" / "add 50 to 100" -> "100 + 50"
  text = text.replace(
    /\b(?:additional|addition|add)\s+([a-z0-9.]+(?:\s+[a-z0-9.]+)?)\s+to\s+([a-z0-9.]+(?:\s+[a-z0-9.]+)?)\b/gi,
    '$2 + $1'
  );

  // "multiple 8 and 9" / "multiply 8 and 9" -> "8 * 9"
  text = text.replace(
    /\b(?:multiple|multiply|multiplication)\s+([a-z0-9.]+(?:\s+[a-z0-9.]+)?)\s+(?:and|with|by)\s+([a-z0-9.]+(?:\s+[a-z0-9.]+)?)\b/gi,
    '$1 * $2'
  );

  // "div 100 by 4" / "divide 100 by 4" -> "100 / 4"
  text = text.replace(
    /\b(?:div|divide|division)\s+([a-z0-9.]+(?:\s+[a-z0-9.]+)?)\s+(?:by|into|with)\s+([a-z0-9.]+(?:\s+[a-z0-9.]+)?)\b/gi,
    '$1 / $2'
  );

  // 5. Spoken word number conversion:
  // Handle compound tens & units like "twenty five" -> 25
  const smallNumberWords: Record<string, number> = {
    zero: 0,
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
  };

  const tensNumberWords: Record<string, number> = {
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
  };

  // Convert "hundred and X" -> "hundred X"
  text = text.replace(/hundred\s+and\s+/gi, 'hundred ');

  // Combine tens and units: "twenty five" -> 25
  for (const [tenWord, tenVal] of Object.entries(tensNumberWords)) {
    for (const [unitWord, unitVal] of Object.entries(smallNumberWords)) {
      if (unitVal > 0 && unitVal < 10) {
        const regex = new RegExp(`\\b${tenWord}\\s+${unitWord}\\b`, 'gi');
        text = text.replace(regex, String(tenVal + unitVal));
      }
    }
  }

  // Convert "X hundred" -> e.g. "five hundred" -> 500
  for (const [unitWord, unitVal] of Object.entries(smallNumberWords)) {
    if (unitVal > 0 && unitVal < 10) {
      const regex = new RegExp(`\\b${unitWord}\\s+hundred\\b`, 'gi');
      text = text.replace(regex, String(unitVal * 100));
    }
  }

  // Convert standalone tens words
  for (const [tenWord, tenVal] of Object.entries(tensNumberWords)) {
    const regex = new RegExp(`\\b${tenWord}\\b`, 'gi');
    text = text.replace(regex, String(tenVal));
  }

  // Convert standalone small unit words
  for (const [word, val] of Object.entries(smallNumberWords)) {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    text = text.replace(regex, String(val));
  }

  // Handle common spoken fractional words
  text = text
    .replace(/\b(?:half of|half)\b/gi, '0.5 * ')
    .replace(/\b(?:quarter of|quarter)\b/gi, '0.25 * ')
    .replace(/\b(?:one third of|one third)\b/gi, '(1/3) * ')
    .replace(/\b(?:three quarters of|three quarters)\b/gi, '0.75 * ');

  // 6. Number scales & Indian/Global Units:
  // "5 lakh" -> 500000, "2.5 crore" -> 25000000, "50k" -> 50000, "1 million" -> 1000000
  text = text
    .replace(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lac|lacs?)\b/gi, (_, n) => String(Number(n) * 100000))
    .replace(/(\d+(?:\.\d+)?)\s*(?:crores?|cr)\b/gi, (_, n) => String(Number(n) * 10000000))
    .replace(/(\d+(?:\.\d+)?)\s*k\b/gi, (_, n) => String(Number(n) * 1000))
    .replace(/(\d+(?:\.\d+)?)\s*(?:thousand|thousands)\b/gi, (_, n) => String(Number(n) * 1000))
    .replace(/(\d+(?:\.\d+)?)\s*(?:million|millions|m)\b/gi, (_, n) => String(Number(n) * 1000000))
    .replace(/(\d+(?:\.\d+)?)\s*(?:billion|billions|b)\b/gi, (_, n) => String(Number(n) * 1000000000))
    .replace(/(\d+(?:\.\d+)?)\s*(?:trillion|trillions)\b/gi, (_, n) => String(Number(n) * 1000000000000))
    .replace(/\bhundred\b/gi, '100')
    .replace(/\bthousand\b/gi, '1000')
    .replace(/\blakh\b/gi, '100000')
    .replace(/\bcrore\b/gi, '10000000')
    .replace(/\bmillion\b/gi, '1000000')
    .replace(/\bbillion\b/gi, '1000000000');

  // Decimal points: "point", "dot", "decimal"
  text = text.replace(/\b(?:point|dot|decimal)\b/gi, '.');

  // 7. Advanced Percentage patterns handling:
  // "18 percentage GST on 5000" / "18 percent gst on 5000" -> 5000 + (5000 * 0.18)
  text = text.replace(
    /(\d+(?:\.\d+)?)\s*(?:%|percent|percentage)\s+(?:gst|tax|vat)\s+(?:on|of|for)\s+(\d+(?:\.\d+)?)/gi,
    '$2 + ($2 * ($1 / 100))'
  );

  // "discount of 20 percentage on 1000" / "20 percent discount on 1000" -> 1000 - (1000 * 0.20)
  text = text.replace(
    /(?:discount of\s+)?(\d+(?:\.\d+)?)\s*(?:%|percent|percentage)\s+(?:discount|off)\s+(?:on|from|of)\s+(\d+(?:\.\d+)?)/gi,
    '$2 - ($2 * ($1 / 100))'
  );

  // "X percentage of Y" / "X percent of Y" -> (X / 100) * Y
  text = text.replace(
    /(\d+(?:\.\d+)?)\s*(?:%|percent|percentage|pct)\s+(?:of|on)\s+(\d+(?:\.\d+)?)/gi,
    '($1 / 100) * $2'
  );

  // "Y plus X percent" / "Y additional X percentage" -> Y + (Y * (X / 100))
  text = text.replace(
    /(\d+(?:\.\d+)?)\s+(?:plus|add|addition|additional|\+)\s+(\d+(?:\.\d+)?)\s*(?:%|percent|percentage|pct)/gi,
    '$1 + ($1 * ($2 / 100))'
  );

  // "Y minus X percent" / "Y sub X percentage" / "Y less X percent" -> Y - (Y * (X / 100))
  text = text.replace(
    /(\d+(?:\.\d+)?)\s+(?:minus|sub|subtract|subtraction|less|deduct|\-)\s+(\d+(?:\.\d+)?)\s*(?:%|percent|percentage|pct)/gi,
    '$1 - ($1 * ($2 / 100))'
  );

  // 8. Operator and Mathematical Function Replacements
  // Support specific user-requested terms: "additional", "sub", "multiple", "div", "percentage"
  text = text
    // Addition
    .replace(/\b(additional|addition|add on|added to|add|plus to|plus|increased by|sum of|sum)\b/gi, ' + ')
    // Subtraction
    .replace(/\b(subtraction|subtracted by|subtract|sub|minus of|minus|take away|less than|less|decreased by|deducted by|deduct|reduced by)\b/gi, ' - ')
    // Multiplication
    .replace(/\b(multiplication|multiplied by|multiply by|multiple by|multiply|multiple|mult|times of|times|into|product of|product|\bx\b)\b/gi, ' × ')
    // Division
    .replace(/\b(division|divided by|divide by|divide|div by|div|split into|split by|shared by|out of|over|slash)\b/gi, ' ÷ ')
    // Powers & Roots
    .replace(/\b(square root of|square root|root of|sqrt of|sqrt)\b/gi, 'sqrt(')
    .replace(/\b(cube root of|cube root|cbrt of|cbrt)\b/gi, 'cbrt(')
    .replace(/\b(squared|square)\b/gi, '^2')
    .replace(/\b(cubed|cube)\b/gi, '^3')
    .replace(/\b(raised to power|raised to the power of|raised to|to the power of|to the power|power of|power|\^)\b/gi, '^')
    // Percentage standalone
    .replace(/\b(percent|percentage|pct)\b/gi, ' % ')
    // Parentheses / Brackets
    .replace(/\b(open bracket|open parentheses|open parenthesis|bracket open|parenthesis open)\b/gi, '(')
    .replace(/\b(close bracket|close parentheses|close parenthesis|bracket close|parenthesis close)\b/gi, ')')
    // Trigonometric functions
    .replace(/\b(hyperbolic sine of|hyperbolic sine|sinh of|sinh)\b/gi, 'sinh(')
    .replace(/\b(hyperbolic cosine of|hyperbolic cosine|cosh of|cosh)\b/gi, 'cosh(')
    .replace(/\b(hyperbolic tangent of|hyperbolic tangent|tanh of|tanh)\b/gi, 'tanh(')
    .replace(/\b(inverse sine of|inverse sine|arcsin of|arcsin|asin of|asin)\b/gi, 'asin(')
    .replace(/\b(inverse cosine of|inverse cosine|arccos of|arccos|acos of|acos)\b/gi, 'acos(')
    .replace(/\b(inverse tangent of|inverse tangent|arctan of|arctan|atan of|atan)\b/gi, 'atan(')
    .replace(/\b(sine of|sine|sin of|sin)\b/gi, 'sin(')
    .replace(/\b(cosine of|cosine|cos of|cos)\b/gi, 'cos(')
    .replace(/\b(tangent of|tangent|tan of|tan)\b/gi, 'tan(')
    // Logarithms & Exponential
    .replace(/\b(natural logarithm of|natural log of|natural log|ln of|ln)\b/gi, 'ln(')
    .replace(/\b(logarithm of|log of|log)\b/gi, 'log(')
    .replace(/\b(exponential of|exp of|exp)\b/gi, 'exp(')
    // Factorials, Absolute, Modulo, Constants
    .replace(/\b(factorial of|fact of|fact)\b/gi, 'fact(')
    .replace(/(\d+)\s*(?:factorial|fact|!)\b/gi, 'fact($1)')
    .replace(/\b(absolute value of|abs of|abs)\b/gi, 'abs(')
    .replace(/\b(modulo of|modulo|mod by|mod|remainder of)\b/gi, ' mod ')
    .replace(/\b(pi|pie)\b/gi, 'π')
    .replace(/\b(phi)\b/gi, 'φ')
    .replace(/\b(euler's number|euler number)\b/gi, 'e');

  // Replace residual "and" between numbers with addition: "20 and 30" -> "20 + 30"
  text = text.replace(/(\d+(?:\.\d+)?)\s+and\s+(\d+(?:\.\d+)?)/gi, '$1 + $2');

  // 9. Auto-balance parentheses if unclosed
  const openCount = (text.match(/\(/g) || []).length;
  const closeCount = (text.match(/\)/g) || []).length;
  if (openCount > closeCount) {
    text += ')'.repeat(openCount - closeCount);
  }

  // 10. Clean up extra spaces and equal signs
  text = text.replace(/\b(equals?|equal to|is equal to|gives|gives me|is)\b/gi, '').trim();
  text = text.replace(/\s+/g, ' ').trim();

  // Prepare display-ready string
  const displayExpr = text;

  // Prepare standard evaluatable string (with internal * and / operators)
  let evalExpr = text
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/mod/g, '%');

  return {
    rawTranscript: transcript,
    mathExpression: evalExpr,
    displayExpression: displayExpr,
    isClearCommand: false,
    isComplete: true,
    spokenIntentSummary: `Recognized: "${transcript.trim()}"`,
  };
}
