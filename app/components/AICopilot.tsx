import { useState, useRef, useEffect } from "react";
import { chatWithResumeCoach, type ChatMessage } from "~/utils/geminiApi";

interface AICopilotProps {
  resumeText: string;
  jobDescriptionText: string;
  apiKey: string;
}

export default function AICopilot({ resumeText, jobDescriptionText, apiKey }: AICopilotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "model",
      content: "Hi! I am your AI Resume Coach. How can I help you improve your resume today? You can choose one of the quick suggestions below or type a custom question!"
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    { label: "✍️ Rewrite a bullet", prompt: "Rewrite a bullet point from my resume to be more results-oriented." },
    { label: "📝 Write professional summary", prompt: "Generate a powerful professional summary for this resume." },
    { label: "🎯 Tailor for this job", prompt: "How can I specifically tailor my experiences to match this job description?" },
    { label: "🔑 Suggest skills to add", prompt: "Based on the JD and my resume, what tech skills are missing?" }
  ];

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const newMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);

    try {
      if (apiKey) {
        // Send real API request
        // Transform history to Gemini format (role must alternate user/model)
        const responseText = await chatWithResumeCoach(newMessages, resumeText, jobDescriptionText, apiKey);
        setMessages([...newMessages, { role: "model", content: responseText }]);
      } else {
        // Simulate responses
        await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay
        let reply = "";
        
        if (text.toLowerCase().includes("rewrite a bullet")) {
          reply = `Sure! Please paste the exact bullet point you want to improve here. 

For example, if you paste:
*"Responsible for building frontend features."*
I will show you how to rewrite it using the **XYZ Formula** (Accomplished [X], measured by [Y], by doing [Z]):
**"Spearheaded the development of 5+ core UI components, improving user engagement by 18% and reducing page load times by 200ms using React and Tailwind."**

*Configure your Gemini API key in the top right to rewrite your actual bullets!*`;
        } else if (text.toLowerCase().includes("professional summary")) {
          reply = `Here is a strong, tailored professional summary outline for your resume:

*"Results-driven Professional with a proven track record of designing and delivering scalable software solutions. Expert in leveraging modern technologies to optimize system performance and enhance user experience. Skilled collaborator with strong communication abilities and a focus on accelerating project timelines."*

*Add your Gemini API Key in the top right to get an AI summary tailored specifically to your resume skills!*`;
        } else if (text.toLowerCase().includes("tailor")) {
          reply = `To tailor your resume for this role:
1. **Mirror the Job Description**: Use the exact action verbs from the JD in your resume (e.g., if they say "Maintain database schema", don't say "Kept DB up to date").
2. **Prioritize Order**: Reorder your skills section to list their required tech stack first.
3. **Quantify achievements**: Make sure the projects most relevant to their JD are at the top of your experience list.

*For specific, line-by-line tailoring guidance, please add your Gemini API Key!*`;
        } else if (text.toLowerCase().includes("skills") || text.toLowerCase().includes("missing")) {
          reply = `Based on a local heuristic scan, you should verify if you have experience with:
- **Cloud Infrastructure** (AWS, Azure, or GCP)
- **CI/CD Pipelines** (GitHub Actions, Docker, Jenkins)
- **State Management** (Zustand, Redux)
- **Testing Frameworks** (Jest, Cypress, Playwright)

Adding these standard industry keywords will help your resume pass through automated ATS keyword filters.

*To get an exact skill audit matching your target JD, add your Gemini API key!*`;
        } else {
          reply = `Hi! I am currently running in **Demo Mode** because no Gemini API Key is configured. 

If you configure a free key using the button in the top right, I will be able to read your resume text and write customized bullets, outline resumes, and analyze specific sections for you in real-time!`;
        }

        setMessages([...newMessages, { role: "model", content: reply }]);
      }
    } catch (error: any) {
      setMessages([
        ...newMessages,
        {
          role: "model",
          content: `⚠️ Failed to get a response. Error: ${error.message || "Unknown error"}. Please check your internet connection or verify your Gemini API key.`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(inputValue);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 p-6 shadow-xl flex flex-col h-full min-h-[500px] max-h-[580px]">
      {/* Coach Header */}
      <div className="border-b border-slate-800 pb-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
            🤖
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">AI Resume Coach</h3>
            <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {apiKey ? "Gemini Online" : "Demo Mode"}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Window */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col max-w-[85%] ${
              msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"
            } animate-[fadeIn_0.2s_ease-out]`}
          >
            <div
              className={`p-3.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-indigo-600 text-white rounded-tr-none"
                  : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700/50"
              }`}
            >
              {msg.content}
            </div>
            <span className="text-[9px] text-slate-500 font-semibold mt-1 uppercase tracking-wider px-1">
              {msg.role === "user" ? "You" : "Coach"}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="mr-auto max-w-[85%] flex flex-col items-start animate-pulse">
            <div className="p-3.5 bg-slate-800 border border-slate-700/50 rounded-2xl rounded-tl-none text-xs flex gap-1.5 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions (only if history is short / conversation just started) */}
      {messages.length <= 2 && !isLoading && (
        <div className="mb-4 space-y-2 border-t border-slate-800/50 pt-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Suggestions</p>
          <div className="grid grid-cols-2 gap-2">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p.prompt)}
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700/50 hover:border-slate-600 text-left text-[10px] font-semibold text-slate-300 rounded-xl transition-all cursor-pointer truncate"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="relative mt-auto border-t border-slate-800/80 pt-3 flex gap-2 items-center">
        <textarea
          rows={1}
          placeholder={apiKey ? "Ask how to improve a section..." : "Type a message (Gemini key needed for custom chat)"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-slate-800 border border-slate-700/60 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none outline-none max-h-16"
        ></textarea>
        <button
          onClick={() => handleSendMessage(inputValue)}
          disabled={!inputValue.trim() || isLoading}
          className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:border-slate-800 border border-transparent text-white font-bold rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md shadow-indigo-900/10"
        >
          <svg className="w-4 h-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
