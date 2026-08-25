import { useEffect, useState } from "react";
import type { SubScores } from "~/utils/resumeAnalyzer";

interface ScoreGaugeProps {
  score: number;
  jobFitScore: number | null;
  subScores: SubScores;
}

export default function ScoreGauge({ score, jobFitScore, subScores }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [animatedJobFit, setAnimatedJobFit] = useState(0);

  useEffect(() => {
    // Animate overall writing score
    const duration = 1000;
    const steps = 30;
    const stepTime = duration / steps;
    let currentStep = 0;

    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easedProgress = progress * (2 - progress);
      
      setAnimatedScore(Math.round(easedProgress * score));
      if (jobFitScore !== null) {
        setAnimatedJobFit(Math.round(easedProgress * jobFitScore));
      }

      if (currentStep >= steps) {
        setAnimatedScore(score);
        if (jobFitScore !== null) {
          setAnimatedJobFit(jobFitScore);
        }
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score, jobFitScore]);

  // Styling helper for scores
  const getScoreTheme = (val: number) => {
    if (val >= 80) return { stroke: "stroke-emerald-500", text: "text-emerald-600", bg: "bg-emerald-50", label: "Strong" };
    if (val >= 50) return { stroke: "stroke-amber-500", text: "text-amber-600", bg: "bg-amber-50", label: "Fair" };
    return { stroke: "stroke-rose-500", text: "text-rose-600", bg: "bg-rose-50", label: "Weak" };
  };

  const writingTheme = getScoreTheme(score);
  const jobFitTheme = jobFitScore !== null ? getScoreTheme(jobFitScore) : null;

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col justify-between h-full min-h-[460px]">
      <div className="text-center pb-4 border-b border-slate-50">
        <h3 className="text-sm font-bold text-slate-800 tracking-tight">Resume Worded Evaluation</h3>
        <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Recruiter & ATS Emulation</p>
      </div>

      {/* Dual Gauges Layout */}
      <div className="flex flex-row items-center justify-evenly py-6 gap-2">
        {/* Gauge 1: Resume Writing Score */}
        <div className="flex flex-col items-center">
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
              <circle cx="55" cy="55" r={radius} className="stroke-slate-100 fill-none" strokeWidth="8" />
              <circle
                cx="55"
                cy="55"
                r={radius}
                className={`fill-none transition-all duration-300 ${writingTheme.stroke}`}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (animatedScore / 100) * circumference}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-slate-800 leading-none">{animatedScore}</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{writingTheme.label}</span>
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-700 mt-2 text-center block">
            Resume Score
          </span>
          <span className="text-[9px] text-slate-400 font-medium text-center">Structure & Impact</span>
        </div>

        {/* Gauge 2: Job Fit Score */}
        <div className="flex flex-col items-center">
          {jobFitScore !== null ? (
            <div className="relative w-28 h-28 flex items-center justify-center animate-[fadeIn_0.3s_ease-out]">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 110 110">
                <circle cx="55" cy="55" r={radius} className="stroke-slate-100 fill-none" strokeWidth="8" />
                <circle
                  cx="55"
                  cy="55"
                  r={radius}
                  className={`fill-none transition-all duration-300 ${jobFitTheme?.stroke}`}
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference - (animatedJobFit / 100) * circumference}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-800 leading-none">{animatedJobFit}</span>
                <span className="text-[8px] text-slate-400 font-bold uppercase mt-0.5">{jobFitTheme?.label}</span>
              </div>
            </div>
          ) : (
            <div className="w-28 h-28 rounded-full border-8 border-slate-50 bg-slate-50/50 flex flex-col items-center justify-center text-center p-2 border-dashed">
              <span className="text-lg">🔒</span>
              <span className="text-[8px] text-slate-400 font-bold uppercase mt-1 leading-tight">JD Missing</span>
            </div>
          )}
          <span className="text-[11px] font-bold text-slate-700 mt-2 text-center block">
            Job Fit Score
          </span>
          <span className="text-[9px] text-slate-400 font-medium text-center">Keyword Match</span>
        </div>
      </div>

      {/* Sub-Scores Breakdown */}
      <div className="space-y-3.5 pt-4 border-t border-slate-50">
        {[
          { label: "Impact (Action verbs & metrics)", val: subScores.impact, color: "bg-indigo-500" },
          { label: "Brevity (Sentence & word density)", val: subScores.brevity, color: "bg-amber-500" },
          { label: "Style & Contact Details", val: subScores.style, color: "bg-emerald-500" }
        ].map((sub, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-600 uppercase tracking-wide">
              <span>{sub.label}</span>
              <span className="font-extrabold text-slate-800">{sub.val}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${sub.color} transition-all duration-1000 ease-out`}
                style={{ width: `${sub.val}%` }}
              ></div>
            </div>
          </div>
        ))}

        {jobFitScore !== null && (
          <div className="space-y-1 pt-1 border-t border-slate-50/60 animate-[fadeIn_0.3s_ease-out]">
            <div className="flex items-center justify-between text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
              <span>Targeted Keyword Overlap</span>
              <span className="font-extrabold text-indigo-900">{subScores.jobFit}%</span>
            </div>
            <div className="w-full h-2 bg-indigo-50 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-1000 ease-out"
                style={{ width: `${subScores.jobFit}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {jobFitScore === null && (
        <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-[10px] text-slate-500 leading-normal text-center">
          💡 <strong>Want to unlock your Job Fit Score?</strong> Go back and paste a specific Job Description to audit targeted keywords.
        </div>
      )}
    </div>
  );
}
