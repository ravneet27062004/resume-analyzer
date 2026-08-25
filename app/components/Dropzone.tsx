import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { extractTextFromPdf } from "~/utils/pdfParser";

interface DropzoneProps {
  onTextExtracted: (text: string, filename: string) => void;
  onClear: () => void;
  fileName: string;
}

export default function Dropzone({ onTextExtracted, onClear, fileName }: DropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"file" | "text">("file");
  const [rawText, setRawText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Please upload a PDF file only.");
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const text = await extractTextFromPdf(file);
      if (!text.trim()) {
        throw new Error("No text content could be extracted from this PDF.");
      }
      onTextExtracted(text, file.name);
    } catch (err: any) {
      setError(err.message || "Failed to extract text from PDF.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  const handleTextSubmit = () => {
    if (!rawText.trim()) {
      setError("Please paste some text before submitting.");
      return;
    }
    onTextExtracted(rawText.trim(), "Pasted Resume Text");
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Mode Selector */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-xl max-w-xs mx-auto mb-6">
        <button
          type="button"
          onClick={() => setMode("file")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            mode === "file" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Upload PDF
        </button>
        <button
          type="button"
          onClick={() => setMode("text")}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            mode === "text" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Paste Text
        </button>
      </div>

      {mode === "file" ? (
        <div className="space-y-4">
          {!fileName ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`uplader-drag-area flex flex-col items-center justify-center border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer group select-none min-h-[220px] ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-50/20 scale-[0.99]"
                  : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                disabled={isParsing}
              />

              {isParsing ? (
                <div className="space-y-3">
                  <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mx-auto"></div>
                  <p className="text-sm font-semibold text-slate-600">Extracting text from PDF...</p>
                </div>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-3xl mb-4 group-hover:scale-110 transition-transform shadow-sm">
                    📄
                  </div>
                  <h3 className="text-base font-bold text-slate-800 mb-1">
                    Drag & drop your Resume PDF
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Supports text-based PDF resumes. Or click to browse folders.
                  </p>
                </>
              )}
            </div>
          ) : (
            <div className="uploader-selected-file border border-slate-100 shadow-sm flex items-center justify-between p-4 bg-slate-50 rounded-2xl animate-[fadeIn_0.3s_ease-out]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl">📄</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{fileName}</p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                    PDF Resume Loaded
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClear}
                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4 animate-[fadeIn_0.2s_ease-out]">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600">Paste your Resume Text</label>
            <textarea
              placeholder="Paste the full text of your resume here..."
              rows={8}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-4 border border-slate-200 rounded-2xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all text-sm outline-none resize-none font-sans"
            ></textarea>
          </div>
          <button
            type="button"
            onClick={handleTextSubmit}
            disabled={!rawText.trim()}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm transition-colors shadow-md shadow-indigo-100 cursor-pointer"
          >
            Process Resume Text
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 flex items-start gap-2.5 animate-[fadeIn_0.2s_ease-out]">
          <span className="text-sm">⚠️</span>
          <p className="font-semibold leading-relaxed">{error}</p>
        </div>
      )}
    </div>
  );
}
