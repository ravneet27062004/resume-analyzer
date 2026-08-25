import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

/**
 * Utility to extract text from a PDF file on the client side using pdfjs-dist.
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    // Dynamically import pdfjs-dist to prevent Node SSR import failures
    const pdfjs = await import("pdfjs-dist");
    
    // Configure worker path pointing to the bundler-resolved worker URL
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true
    });
    
    const pdf = await loadingTask.promise;
    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ");
      fullText += pageText + "\n";
    }

    if (!fullText.trim()) {
      throw new Error("No text content could be extracted. The file may be a scanned image PDF or empty.");
    }

    return fullText.trim();
  } catch (error: any) {
    console.error("PDF parsing error:", error);
    throw new Error(
      `Failed to parse PDF file: ${error.message || error}. Please ensure it is a text-based PDF and not scanned images.`
    );
  }
}
