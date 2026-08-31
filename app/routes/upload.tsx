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
        setIsProcessing(true);

        try {
            console.log("========== ANALYSIS STARTED ==========");
            console.log("Selected file:", file);
            console.log("Company:", companyName);
            console.log("Job Title:", jobTitle);
            console.log("Job Description:", jobDescription);

            // --------------------------------
            // 1. Upload resume
            // --------------------------------

            setStatusText("Uploading the file...");

            console.log("1️⃣ Uploading resume...");

            const uploadedFile = await fs.upload([file]);

            console.log("2️⃣ Uploaded resume:", uploadedFile);

            if (!uploadedFile) {
                throw new Error("Failed to upload resume");
            }

            // --------------------------------
            // 2. Convert PDF to image
            // --------------------------------

            setStatusText("Converting to image...");

            console.log("3️⃣ Converting PDF to image...");

            const imageFile = await convertPdfToImage(file);

            console.log("4️⃣ Converted image:", imageFile);

            if (!imageFile.file) {
                throw new Error("Failed to convert PDF to image");
            }

            // --------------------------------
            // 3. Upload image
            // --------------------------------

            setStatusText("Uploading the image...");

            console.log("5️⃣ Uploading image...");

            const uploadedImage = await fs.upload([imageFile.file]);

            console.log("6️⃣ Uploaded image:", uploadedImage);

            if (!uploadedImage) {
                throw new Error("Failed to upload image");
            }

            // --------------------------------
            // 4. Create resume data
            // --------------------------------

            setStatusText("Preparing data...");

            console.log("7️⃣ Creating resume data...");

            const uuid = generateUUID();
console.log("UUID:", uuid);
console.log("NAVIGATE TO:", `/resume/${uuid}`);
            const data = {
                id: uuid,
                resumePath: uploadedFile.path,
                imagePath: uploadedImage.path,
                companyName,
                jobTitle,
                jobDescription,
                feedback: "",
            };

            // IMPORTANT:
            // This log is BEFORE AI and JSON.parse
            console.log("🔥 DATA CREATED:", data);

            // --------------------------------
            // 5. Save initial data
            // --------------------------------

            console.log("8️⃣ Saving initial data to KV...");

            await kv.set(
                `resume:${uuid}`,
                JSON.stringify(data)
            );

            console.log("9️⃣ Initial data saved!");

            // --------------------------------
            // 6. AI analysis
            // --------------------------------

            setStatusText("Analyzing...");

            console.log("🔟 Calling AI feedback...");

            const feedback = await ai.feedback(
                uploadedFile.path,
                prepareInstructions({
                    jobTitle,
                    jobDescription,
                })
            );

            console.log("🔥 AI RESPONSE:", feedback);

            if (!feedback) {
                throw new Error("Failed to analyze resume");
            }

            // --------------------------------
            // 7. Extract AI response
            // --------------------------------

            console.log("1️⃣1️⃣ Extracting feedback...");

            const feedbackText =
                typeof feedback.message.content === "string"
                    ? feedback.message.content
                    : feedback.message.content[0].text;

            console.log("🔥 FEEDBACK TEXT:", feedbackText);

            // --------------------------------
            // 8. Parse JSON
            // --------------------------------

            console.log("1️⃣2️⃣ Parsing feedback JSON...");

            try {
                data.feedback = JSON.parse(feedbackText);
            } catch (parseError) {
                console.error(
                    "❌ JSON PARSE ERROR:",
                    parseError
                );

                console.error(
                    "❌ AI returned:",
                    feedbackText
                );

                throw new Error(
                    "AI returned invalid JSON"
                );
            }

            // --------------------------------
            // 9. Final data
            // --------------------------------

            console.log("🔥 FINAL DATA:", data);

            // --------------------------------
            // 10. Save final data
            // --------------------------------

            console.log("1️⃣3️⃣ Saving final data...");

            await kv.set(
                `resume:${uuid}`,
                JSON.stringify(data)
            );

            console.log("✅ FINAL DATA SAVED");

            // --------------------------------
            // 11. Navigate
            // --------------------------------

            setStatusText(
                "Analysis complete, redirecting..."
            );

            console.log(
                "🚀 Navigating to:",
                `/resume/${uuid}`
            );

            navigate(`/resume/${uuid}`);

        } catch (error) {
            console.error(
                "❌ HANDLE ANALYZE ERROR:",
                error
            );

            if (error instanceof Error) {
                console.error(
                    "❌ ERROR MESSAGE:",
                    error.message
                );

                setStatusText(
                    `Error: ${error.message}`
                );
            } else {
                setStatusText(
                    "Something went wrong"
                );
            }

        } finally {
            setIsProcessing(false);

            console.log(
                "========== ANALYSIS FINISHED =========="
            );
        }
    };

    const handleSubmit = (
        e: FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        console.log("📝 Form submitted");

        const form = e.currentTarget;

        const formData = new FormData(form);

        const companyName =
            formData.get("company-name") as string;

        const jobTitle =
            formData.get("job-title") as string;

        const jobDescription =
            formData.get("job-description") as string;

        console.log("Company:", companyName);
        console.log("Job:", jobTitle);

        if (!file) {
            console.error("❌ No resume selected");

            setStatusText(
                "Please upload your resume"
            );

            return;
        }

        console.log(
            "✅ Resume selected:",
            file.name
        );

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
                            <h2>
                                {statusText}
                            </h2>

                            <img
                                src="/images/resume-scan.gif"
                                className="w-full"
                                alt="Resume scanning"
                            />
                        </>
                    ) : (
                        <h2>
                            Drop your resume for an ATS
                            score and improvement tips
                        </h2>
                    )}

                    {!isProcessing && (
                        <form
                            id="upload-form"
                            onSubmit={handleSubmit}
                            className="flex flex-col gap-4 mt-8"
                        >

                            {/* Company */}

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
                                    placeholder="Job Description"
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
                    )}

                </div>
            </section>
        </main>
    );
};

export default Upload;