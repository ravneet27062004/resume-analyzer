import type { AnalysisResult } from "./resumeAnalyzer";

export interface ChatMessage {
  role: "user" | "model";
  content: string;
}

/**
 * Analyzes resume using Google Gemini API based on Resume Worded's dual-score model.
 */
export async function analyzeResumeWithGemini(
  resumeText: string,
  jobDescriptionText: string,
  apiKey: string
): Promise<AnalysisResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemPrompt = `You are an expert resume auditor, acting as the core scoring algorithm for "Resume Worded".
Evaluate the provided RESUME against the target JOB DESCRIPTION (if provided).
Generate a strict audit of the resume and output JSON conforming to the requested schema.

Dual-Scoring Categories:
1. Overall Writing Score (atsScore): Out of 100. Measures overall writing quality across three sub-pillars:
   - Impact (usage of strong action verbs, quantified metrics, active voice)
   - Brevity (skimmability, word count between 400-800, sentence length under 30 words)
   - Style (standard section headers like Experience, Education, Skills, and valid email/phone/LinkedIn links)
2. Job Fit Score (jobFitScore): Out of 100. Measures keyword and tech-stack alignment against the Job Description. If NO Job Description is provided, return null or 0.

Strictness guidelines:
- If there are no numbers/metrics in bullet points, cap the Impact sub-score at 15.
- If there is no email or phone number, cap the Style sub-score at 50.
- If the word count is under 300 or over 1000, cap the Brevity sub-score at 50.
- If a Job Description is provided but keyword overlap is very low (under 30%), the jobFitScore should be under 40.
`;

  const userPrompt = `
TARGET JOB DESCRIPTION:
${jobDescriptionText || "No job description provided. Evaluate writing style, brevity, and layout structure generally. Set jobFitScore to 0 or null."}

RESUME TEXT TO EVALUATE:
${resumeText}
`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }]
          }
        ],
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        },
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              atsScore: {
                type: "INTEGER",
                description: "Writing quality score (0-100) based on Impact, Brevity, and Style."
              },
              jobFitScore: {
                type: "INTEGER",
                description: "Keyword matching score (0-100) against the Job Description. Return 0 if no JD was provided."
              },
              subScores: {
                type: "OBJECT",
                properties: {
                  impact: { type: "INTEGER", description: "Action verbs, active voice, and quantified metrics (0-100)" },
                  brevity: { type: "INTEGER", description: "Word count, formatting, and sentence skimmability (0-100)" },
                  style: { type: "INTEGER", description: "Headers, sections, email, phone, and LinkedIn presence (0-100)" },
                  jobFit: { type: "INTEGER", description: "Keyword overlap rate (0-100). Same as jobFitScore." }
                },
                required: ["impact", "brevity", "style", "jobFit"]
              },
              strengths: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "3-4 key highlights from the resume (e.g. strong metrics, active verbs, standard layout)"
              },
              improvements: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "3-4 critical errors or weaknesses to fix (e.g. passive verbs, missing contact info)"
              },
              missingSkills: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "Specific hard skills or technologies present in the JD but missing from the resume"
              },
              formattingFeedback: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "Formatting critiques (bullet length, buzzwords, word count)"
              },
              tailoringTips: {
                type: "ARRAY",
                items: { type: "STRING" },
                description: "Actionable advice on how to rewrite or reorder information to fit the JD"
              }
            },
            required: [
              "atsScore",
              "jobFitScore",
              "subScores",
              "strengths",
              "improvements",
              "missingSkills",
              "formattingFeedback",
              "tailoringTips"
            ]
          }
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Gemini API Error details:", errBody);
      throw new Error(`Gemini API Error: Status ${response.status}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("Empty response from Gemini API");
    }

    const result = JSON.parse(textResult);
    // Ensure jobFitScore is null if no job description was parsed
    if (!jobDescriptionText.trim()) {
      result.jobFitScore = null;
    }

    return result as AnalysisResult;
  } catch (error) {
    console.error("Error analyzing with Gemini:", error);
    throw error;
  }
}

/**
 * Handles chat communication with Gemini acting as a Resume Coach.
 */
export async function chatWithResumeCoach(
  history: ChatMessage[],
  resumeText: string,
  jobDescriptionText: string,
  apiKey: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const systemPrompt = `You are "AI Resume Coach", an expert career counselor trained on Resume Worded guidelines.
You have access to the user's Resume and the target Job Description (if provided).
Your goal is to help the user rewrite specific parts of their resume, suggest bullet points with action verbs and numbers, answer career questions, and explain why certain keywords are missing.

Keep your answers concise, practical, and highly focused.
When rewriting bullet points, always provide concrete examples using the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".

RESUME TEXT:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescriptionText || "None provided"}
`;

  try {
    const formattedContents = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.content }]
    }));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: formattedContents,
        systemInstruction: {
          parts: [{ text: systemPrompt }]
        }
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Gemini Chat API Error:", errBody);
      throw new Error(`Gemini API Error: Status ${response.status}`);
    }

    const data = await response.json();
    const textResult = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!textResult) {
      throw new Error("Empty response from Gemini chat");
    }

    return textResult;
  } catch (error) {
    console.error("Error communicating with Gemini chat:", error);
    throw error;
  }
}
