import { type FormEvent, useState } from "react";
import Navbar from "~/components/Navbar";
import FileUploader from "~/components/FileUploader";
import { usePuterStore } from "~/lib/puter";
import { useNavigate } from "react-router";
import { convertPdfToImage } from "~/lib/pdf2img";
import { generateUUID } from "~/lib/util";
import { prepareInstructions } from "../../constants";

const Upload = () => {
    const { auth, isLoading, fs, ai, kv } = usePuterStore();

    const navigate = useNavigate();

    const [isProcessing, setIsProcessing] = useState(false);
    const [statusText, setStatusText] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleFileSelect = (file: File | null) => {
        setFile(file);
    };

    const handleAnalyze = async ({
        companyName,
        jobTitle,
        jobDescription,
        file,
    }: {
        companyName: string;
        jobTitle: string;
        jobDescription: string;
        file: File;
    }) => {
        try {
            setIsProcessing(true);

            // -----------------------------
            // 1. Upload Resume PDF
            // -----------------------------
            setStatusText("Uploading the file...");

            const uploadedFile = await fs.upload([file]);

            if (!uploadedFile) {
                throw new Error("Failed to upload resume");
            }

            console.log("Uploaded PDF:", uploadedFile);

            // -----------------------------
            // 2. Convert PDF to Image
            // -----------------------------
            setStatusText("Converting to image...");

            const imageFile = await convertPdfToImage(file);

            if (!imageFile.file) {
                throw new Error(
                    imageFile.error || "Failed to convert PDF to image"
                );
            }

            // -----------------------------
            // 3. Upload Image
            // -----------------------------
            setStatusText("Uploading the image...");

            const uploadedImage = await fs.upload([imageFile.file]);

            if (!uploadedImage) {
                throw new Error("Failed to upload resume image");
            }

            console.log("Uploaded Image:", uploadedImage);

            // -----------------------------
            // 4. Prepare Resume Data
            // -----------------------------
            setStatusText("Preparing data...");

            const uuid = generateUUID();

            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback: "",
            };

            // Save initial data
            await kv.set(`resume:${uuid}`, JSON.stringify(data));

            // -----------------------------
            // 5. Ask AI
            // -----------------------------
            setStatusText("Analyzing your resume...");

            console.log("Sending resume to AI...");

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({
                    jobTitle,
                    jobDescription,
                })
            );

            console.log("========== AI RESPONSE ==========");
            console.log(feedback);
            console.log("=================================");

            if (!feedback) {
                throw new Error("AI returned no response");
            }

            // -----------------------------
            // 6. Extract AI Content
            // -----------------------------
            const content = feedback.message?.content;

            console.log("AI CONTENT:", content);
            console.log("CONTENT TYPE:", typeof content);
            console.log("IS ARRAY:", Array.isArray(content));

            let feedbackText = "";

            // Case 1:
            // content is directly a string
            if (typeof content === "string") {
                feedbackText = content;
            }

            // Case 2:
            // content is an array
            else if (Array.isArray(content)) {
                feedbackText = content
                    .map((item: any) => {
                        if (typeof item === "string") {
                            return item;
                        }

                        return item?.text || "";
                    })
                    .join("");
            }

            console.log("EXTRACTED AI TEXT:", feedbackText);

            // -----------------------------
            // 7. Make Sure AI Returned Data
            // -----------------------------
            if (!feedbackText.trim()) {
                console.error("AI RESPONSE:", feedback);

                throw new Error(
                    "AI returned empty or undefined content"
                );
            }

            // -----------------------------
            // 8. Clean Markdown JSON
            // -----------------------------
            const cleanFeedbackText = feedbackText
                .replace(/```json/gi, "")
                .replace(/```/g, "")
                .trim();

            console.log("CLEAN AI JSON:", cleanFeedbackText);

            // -----------------------------
            // 9. Parse JSON
            // -----------------------------
            try {
                data.feedback = JSON.parse(cleanFeedbackText);
            } catch (error) {
                console.error("JSON PARSE ERROR:", error);
                console.error(
                    "AI RESPONSE THAT FAILED:",
                    cleanFeedbackText
                );

                throw new Error(
                    "AI returned invalid JSON. Check prepareInstructions()."
                );
            }

            // -----------------------------
            // 10. Save Final Data
            // -----------------------------
            await kv.set(
                `resume:${uuid}`,
                JSON.stringify(data)
            );

            console.log("FINAL RESUME DATA:", data);

            // -----------------------------
            // 11. Navigate to Result
            // -----------------------------
            setStatusText("Analysis complete, redirecting...");

            navigate(`/resume/${uuid}`);

        } catch (error) {
            console.error("❌ HANDLE ANALYZE ERROR:", error);

            setStatusText(
                error instanceof Error
                    ? error.message
                    : "Something went wrong"
            );

            setIsProcessing(false);
        }
    };

    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const form = e.currentTarget;

        const formData = new FormData(form);

        const companyName =
            formData.get("company-name") as string;

        const jobTitle =
            formData.get("job-title") as string;

        const jobDescription =
            formData.get("job-description") as string;

        if (!file) {
            setStatusText("Please upload your resume");
            return;
        }

        handleAnalyze({
            companyName,
            jobTitle,
            jobDescription,
            file,
        });
    };

    return (
        <main className="bg-[url('/images/bg-main.svg')] bg-cover">
            <Navbar />

            <section className="main-section">
                <div className="page-heading py-16">

                    <h1>
                        Smart feedback for your dream job
                    </h1>

                    {isProcessing ? (
                        <>
                            <h2>{statusText}</h2>

                            <img
                                src="/images/resume-scan.gif"
                                className="w-full"
                                alt="Analyzing resume"
                            />
                        </>
                    ) : (
                        <>
                            <h2>
                                Drop your resume for an ATS score
                                and improvement tips
                            </h2>

                            <form
                                id="upload-form"
                                onSubmit={handleSubmit}
                                className="flex flex-col gap-4 mt-8"
                            >

                                {/* Company Name */}
                                <div className="form-div">
                                    <label htmlFor="company-name">
                                        Company Name
                                    </label>

                                    <input
                                        type="text"
                                        name="company-name"
                                        placeholder="Company Name"
                                        id="company-name"
                                    />
                                </div>

                                {/* Job Title */}
                                <div className="form-div">
                                    <label htmlFor="job-title">
                                        Job Title
                                    </label>

                                    <input
                                        type="text"
                                        name="job-title"
                                        placeholder="Job Title"
                                        id="job-title"
                                    />
                                </div>

                                {/* Job Description */}
                                <div className="form-div">
                                    <label htmlFor="job-description">
                                        Job Description
                                    </label>

                                    <textarea
                                        rows={5}
                                        name="job-description"
                                        placeholder="Paste the job description here..."
                                        id="job-description"
                                    />
                                </div>

                                {/* Resume */}
                                <div className="form-div">
                                    <label htmlFor="uploader">
                                        Upload Resume
                                    </label>

                                    <FileUploader
                                        onFileSelect={
                                            handleFileSelect
                                        }
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    className="primary-button"
                                    type="submit"
                                    disabled={isProcessing}
                                >
                                    Analyze Resume
                                </button>

                            </form>
                        </>
                    )}

                    {/* Error / Status */}
                    {!isProcessing && statusText && (
                        <p className="text-red-500 mt-4">
                            {statusText}
                        </p>
                    )}

                </div>
            </section>
        </main>
    );
};

export default Upload;