export interface SubScores {
  impact: number;     // Resume Worded: Action verbs, metrics, active voice (0-100)
  brevity: number;    // Resume Worded: Word count, sentence lengths, skimmability (0-100)
  style: number;      // Resume Worded: Section headers, contact info, standard formats (0-100)
  jobFit: number;     // Resume Worded: Target keyword alignment against Job Description (0-100)
}

export interface AnalysisResult {
  atsScore: number;       // Resume Worded Writing Score (0-100)
  jobFitScore: number | null; // Targeted Job Match Score (0-100, null if no JD)
  subScores: SubScores;
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  formattingFeedback: string[];
  tailoringTips: string[];
}

const STRONG_ACTION_VERBS = [
  "led", "developed", "optimized", "designed", "managed", "created", "increased",
  "reduced", "architected", "built", "implemented", "delivered", "guided", "steered",
  "streamlined", "formulated", "championed", "analyzed", "coordinated", "executed",
  "engineered", "established", "headed", "launched", "maximized", "pioneered",
  "supervised", "transformed", "upgraded", "initiated", "founded", "revamped",
  "spearheaded", "accelerated", "accomplished", "administered", "boosted", "overhauled"
];

const WEAK_PHRASES = [
  "responsible for", "assisted with", "helped to", "duties included", "worked on",
  "part of a team", "involved in", "assisted in", "participated in", "handled"
];

const CLICHES = [
  "team player", "detail-oriented", "results-driven", "synergy", "hardworking",
  "go-getter", "self-motivated", "think outside the box", "dynamic", "excellent communication",
  "detail oriented", "motivated"
];

const STOP_WORDS = new Set([
  "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "arent", "as", "at",
  "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "cant", "cannot", "could",
  "couldnt", "did", "didnt", "do", "does", "doesnt", "doing", "dont", "down", "during", "each", "few", "for", "from",
  "further", "had", "hadnt", "has", "hasnt", "have", "havent", "having", "he", "hed", "hell", "hes", "her", "here",
  "heres", "hers", "herself", "him", "himself", "his", "how", "hows", "i", "id", "ill", "im", "ive", "if", "in",
  "into", "is", "isnt", "it", "its", "itself", "lets", "me", "more", "most", "mustnt", "my", "myself", "no", "nor",
  "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
  "same", "shant", "she", "shed", "shell", "shes", "should", "shouldnt", "so", "some", "such", "than", "that",
  "thats", "the", "their", "theirs", "them", "themselves", "then", "there", "theres", "these", "they", "theyd",
  "theyll", "theyre", "theyve", "this", "those", "through", "to", "too", "under", "until", "up", "very", "was",
  "wasnt", "we", "wed", "well", "were", "weve", "werent", "what", "whats", "when", "whens", "where", "wheres",
  "which", "while", "who", "whos", "whom", "why", "whys", "with", "wont", "would", "wouldnt", "you", "youd",
  "youll", "youre", "youve", "your", "yours", "yourself", "yourselves"
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s+#.-]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 1 && !STOP_WORDS.has(word) && !/^\d+$/.test(word));
}

/**
 * Resume Worded Scoring Algorithm
 */
export function analyzeResume(resumeText: string, jobDescriptionText: string = ""): AnalysisResult {
  const normalizedText = resumeText.toLowerCase();
  
  const strengths: string[] = [];
  const improvements: string[] = [];
  const formattingFeedback: string[] = [];
  const tailoringTips: string[] = [];
  const missingSkills: string[] = [];

  // ==========================================
  // 1. IMPACT SCORE (40 Points Max)
  // ==========================================
  let impactScore = 100;
  
  // A. Quantified Bullet Points Check
  const numbers = resumeText.match(/\b\d+(?:,\d+)*(?:\.\d+)?%?\b/g) || [];
  const years = resumeText.match(/\b(19|20)\d{2}\b/g) || [];
  const metricsCount = Math.max(0, numbers.length - years.length);
  
  if (metricsCount === 0) {
    impactScore -= 45;
    improvements.push("IMPACT: No numbers, statistics, or metrics found. Recruiters prioritize results over listed tasks.");
  } else if (metricsCount < 3) {
    impactScore -= 25;
    improvements.push(`IMPACT: Low metric density (only ${metricsCount} found). Quantify achievements using the XYZ formula (e.g. 'improved speed by 25%').`);
  } else if (metricsCount >= 6) {
    strengths.push(`Quantified Achievements: Excellent density of metrics (${metricsCount} numbers/percentages) demonstrating business outcomes.`);
  } else {
    strengths.push("Quantified Achievements: Resume includes metrics supporting professional performance.");
  }

  // B. Strong Action Verbs vs Passive Phrases
  const verbMatches = STRONG_ACTION_VERBS.filter(verb => {
    const regex = new RegExp(`\\b${verb}\\b`, "i");
    return regex.test(normalizedText);
  });
  
  if (verbMatches.length < 3) {
    impactScore -= 25;
    improvements.push("IMPACT: Lacks strong action verbs. Swap passive duties for power words (e.g., 'Spearheaded', 'Engineered').");
  } else if (verbMatches.length < 7) {
    impactScore -= 15;
    improvements.push(`IMPACT: Average variety of action verbs (${verbMatches.length} found). Expand your vocabulary to show ownership.`);
  } else {
    strengths.push(`Action-oriented: Strong variety of execution verbs (found ${verbMatches.length} unique verbs).`);
  }

  // C. Weak/Passive Phrases Check
  const foundWeakPhrases = WEAK_PHRASES.filter(phrase => normalizedText.includes(phrase));
  if (foundWeakPhrases.length > 0) {
    impactScore -= foundWeakPhrases.length * 10;
    improvements.push(`IMPACT: Remove passive phrases: '${foundWeakPhrases.slice(0, 2).join("', '")}'. Always begin bullet points with active verbs.`);
  }

  // D. Clichés & Buzzwords Check
  const foundCliches = CLICHES.filter(cliche => normalizedText.includes(cliche));
  if (foundCliches.length > 0) {
    impactScore -= foundCliches.length * 5;
    formattingFeedback.push(`Buzzwords found: Avoid generic descriptors like '${foundCliches.slice(0, 2).join("', '")}'. Prove these qualities with accomplishments.`);
  }

  impactScore = Math.max(0, impactScore);

  // ==========================================
  // 2. BREVITY & READABILITY SCORE (30 Points Max)
  // ==========================================
  let brevityScore = 100;
  
  // A. Resume Word Count Check
  const wordCount = resumeText.split(/\s+/).length;
  if (wordCount < 300) {
    brevityScore -= 40;
    improvements.push("BREVITY: Resume is too brief (under 300 words). Add details regarding your experience scope and project metrics.");
  } else if (wordCount > 900) {
    brevityScore -= 30;
    improvements.push(`BREVITY: Resume is too long (${wordCount} words). Condense your descriptions. Standard resumes should be 400-800 words.`);
  } else {
    strengths.push(`Skimmable length: Word count (${wordCount} words) fits the ideal 1-to-2 page standard.`);
  }

  // B. Bullet Point Sentence Length Checks
  // Count how many sentences exceed 30 words (hurts skimmability)
  const sentences = resumeText.split(/[.!?]\s+/);
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 30);
  if (longSentences.length > 3) {
    brevityScore -= Math.min(30, longSentences.length * 8);
    formattingFeedback.push(`Long bullet points: Found ${longSentences.length} sentences exceeding 30 words. Keep bullets concise (under 2 lines) for recruiters.`);
  } else {
    strengths.push("Skimmable details: Sentence lengths are balanced, maintaining focus.");
  }

  brevityScore = Math.max(0, brevityScore);

  // ==========================================
  // 3. STYLE & STRUCTURE SCORE (30 Points Max)
  // ==========================================
  let styleScore = 100;
  const sectionsFound: string[] = [];
  const sectionsMissing: string[] = [];

  const sectionPatterns = {
    Experience: ["experience", "employment", "work history", "professional history", "career history", "professional background"],
    Education: ["education", "academic", "university", "degree", "schooling"],
    Skills: ["skills", "technologies", "core competencies", "expertise", "technical skills", "languages"]
  };

  for (const [sectionName, patterns] of Object.entries(sectionPatterns)) {
    const hasSection = patterns.some(pattern => {
      const regex = new RegExp(`\\b${pattern}\\b`, "i");
      return regex.test(normalizedText);
    });

    if (hasSection) {
      sectionsFound.push(sectionName);
    } else {
      sectionsMissing.push(sectionName);
    }
  }

  // Deduct for missing essential structural categories
  if (sectionsMissing.includes("Experience")) {
    styleScore -= 45;
    improvements.push("STYLE: Missing a clear 'Work Experience' section. Standard ATS scanners will fail to construct your history.");
  }
  if (sectionsMissing.includes("Education")) {
    styleScore -= 30;
    improvements.push("STYLE: Missing an 'Education' section. Standard credential checks will fail.");
  }
  if (sectionsMissing.includes("Skills")) {
    styleScore -= 25;
    improvements.push("STYLE: Dedicated 'Skills' section not detected. ATS parsers look for organized lists of technologies.");
  }

  // Contact detail checks
  const emailMatch = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/.test(resumeText);
  const phoneMatch = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(resumeText);
  const linkedinMatch = /linkedin\.com\b/.test(normalizedText);

  if (!emailMatch) {
    styleScore -= 20;
    improvements.push("STYLE: No valid email address found. Add a professional email to your header.");
  }
  if (!phoneMatch) {
    styleScore -= 20;
    improvements.push("STYLE: No phone number parsed. Add a phone number for recruiter screening.");
  }
  if (!linkedinMatch) {
    styleScore -= 10;
    formattingFeedback.push("Add your LinkedIn URL. Over 85% of recruiters cross-reference resumes with LinkedIn.");
  }

  if (emailMatch && phoneMatch && linkedinMatch && sectionsMissing.length === 0) {
    strengths.push("Professional Style: Formatting guidelines, contact headers, and core sections follow standard recruiting layouts.");
  }

  styleScore = Math.max(0, styleScore);

  // ==========================================
  // 4. JOB FIT SCORE (Keyword Alignment)
  // ==========================================
  let jobFitScore: number | null = null;
  let jobFitSubScore = 0;

  if (jobDescriptionText.trim()) {
    const resumeWords = new Set(extractKeywords(resumeText));
    const jdKeywords = Array.from(new Set(extractKeywords(jobDescriptionText)));
    
    if (jdKeywords.length > 0) {
      const matches = jdKeywords.filter(word => resumeWords.has(word));
      const matchRate = matches.length / jdKeywords.length;
      
      jobFitScore = Math.round(matchRate * 100);
      jobFitSubScore = jobFitScore;
      
      const missing = jdKeywords
        .filter(word => !resumeWords.has(word))
        .slice(0, 8);
        
      missingSkills.push(...missing);
      
      if (missing.length > 0) {
        tailoringTips.push(`Integrate missing keywords: ${missing.slice(0, 4).join(", ")} inside your experience or skills list.`);
      }
    }
  } else {
    // If no JD, we list generic missing items but jobFit remains null
    const genericTechSkills = [
      "react", "javascript", "typescript", "python", "node", "sql", "api", "cloud",
      "docker", "agile", "git", "ci/cd", "aws"
    ];
    const resumeWords = new Set(extractKeywords(resumeText));
    const missing = genericTechSkills.filter(s => !resumeWords.has(s)).slice(0, 5);
    missingSkills.push(...missing);
    tailoringTips.push("⚠️ Paste a specific Job Description to generate your target Job Fit Score and tailored keyword list.");
  }

  // ==========================================
  // FINAL ATS SCORE (Resume Worded Writing Score)
  // ==========================================
  // Impact 40%, Brevity 30%, Style & Structure 30%
  const atsScore = Math.round(
    (impactScore * 0.40) +
    (brevityScore * 0.30) +
    (styleScore * 0.30)
  );

  return {
    atsScore,
    jobFitScore,
    subScores: {
      impact: impactScore,
      brevity: brevityScore,
      style: styleScore,
      jobFit: jobFitSubScore
    },
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 4),
    missingSkills,
    formattingFeedback,
    tailoringTips
  };
}
