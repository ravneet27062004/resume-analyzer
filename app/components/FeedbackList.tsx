import { useState } from "react";

interface FeedbackListProps {
  strengths: string[];
  improvements: string[];
  missingSkills: string[];
  formattingFeedback: string[];
  tailoringTips: string[];
}

type TabType = "all" | "improvements" | "strengths" | "alignment" | "formatting";

export default function FeedbackList({
  strengths,
  improvements,
  missingSkills,
  formattingFeedback,
  tailoringTips
}: FeedbackListProps) {
  const [activeTab, setActiveTab] = useState<TabType>("all");

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "all", label: "Overview", count: strengths.length + improvements.length },
    { id: "improvements", label: "Fixes Needed", count: improvements.length },
    { id: "strengths", label: "Strengths", count: strengths.length },
    { id: "alignment", label: "Job Fit", count: missingSkills.length + tailoringTips.length },
    { id: "formatting", label: "Formatting", count: formattingFeedback.length }
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm flex flex-col h-full min-h-[500px]">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 tracking-tight">Audit Findings</h3>
          <p className="text-xs text-slate-400 font-medium">Categorized review of your resume content</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-50 rounded-xl self-start sm:self-center">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-slate-100 text-slate-600">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 space-y-6 overflow-y-auto max-h-[460px] pr-2">
        {/* Critical Fixes / Improvements */}
        {(activeTab === "all" || activeTab === "improvements") && improvements.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              ⚠️ Major Issues ({improvements.length})
            </h4>
            <div className="space-y-2">
              {improvements.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-4 bg-rose-50/50 border border-rose-100/50 rounded-2xl animate-[fadeIn_0.3s_ease-out]"
                >
                  <span className="text-base text-rose-500 font-bold">✕</span>
                  <p className="text-xs font-semibold text-rose-950 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths */}
        {(activeTab === "all" || activeTab === "strengths") && strengths.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              ✅ Things Done Well ({strengths.length})
            </h4>
            <div className="space-y-2">
              {strengths.map((item, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 p-4 bg-emerald-50/30 border border-emerald-100/30 rounded-2xl animate-[fadeIn_0.3s_ease-out]"
                >
                  <span className="text-base text-emerald-500 font-bold">✓</span>
                  <p className="text-xs font-semibold text-emerald-950 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Job Description Alignment */}
        {activeTab === "alignment" && (
          <div className="space-y-6">
            {/* Missing Skills */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                🎯 Missing Key Skills & Terms
              </h4>
              {missingSkills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-700 animate-[fadeIn_0.3s_ease-out]"
                    >
                      + {skill}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl text-center">
                  <p className="text-xs text-slate-500 font-semibold">
                    No missing skills detected! Make sure you paste a job description.
                  </p>
                </div>
              )}
            </div>

            {/* Tailoring Tips */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                💡 Alignment Tips
              </h4>
              {tailoringTips.length > 0 ? (
                <div className="space-y-2">
                  {tailoringTips.map((tip, idx) => (
                    <div
                      key={idx}
                      className="flex gap-3 p-4 bg-indigo-50/30 border border-indigo-100/30 rounded-2xl animate-[fadeIn_0.3s_ease-out]"
                    >
                      <span className="text-base">📍</span>
                      <p className="text-xs font-semibold text-indigo-950 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No specific tailoring tips.</p>
              )}
            </div>
          </div>
        )}

        {/* Formatting */}
        {activeTab === "formatting" && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              📏 Formatting & Structure Audits
            </h4>
            {formattingFeedback.length > 0 ? (
              <div className="space-y-2">
                {formattingFeedback.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex gap-3 p-4 bg-amber-50/40 border border-amber-100/40 rounded-2xl animate-[fadeIn_0.3s_ease-out]"
                  >
                    <span className="text-base">📏</span>
                    <p className="text-xs font-semibold text-amber-950 leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50/30 border border-emerald-100/30 rounded-2xl text-center">
                <p className="text-xs text-emerald-800 font-bold">
                  ✓ Resume structure and formatting metrics look excellent!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {activeTab === "improvements" && improvements.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 rounded-3xl min-h-[300px]">
            <span className="text-4xl mb-3">🎉</span>
            <h4 className="text-sm font-bold text-slate-800">No issues found!</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
              Your resume scored perfectly in our structural checks. Great job!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
