import useStore from "../store/useStore";
import { useState } from "react";

const CASE_TYPES = [
    "Accident",
    "Property Dispute",
    "Contract Breach",
    "Theft",
    "Workplace Issue",
    "Other",
];

const TRIAL_DEPTH = [
    { id: "quick", label: "Quick Trial (2 rounds)" },
    { id: "standard", label: "Standard Trial (4 rounds)" },
    { id: "full", label: "Full Trial (6 rounds)" },
];

const TONES = [
    { id: "serious", label: "Serious Legal Style" },
    { id: "parody", label: "Parody / Meme Style" },
];

const VERDICT_OUTPUT = [
    { id: "prob", label: "Probability of Winning (%)" },
    { id: "summary", label: "Judge's Written Summary + Probability" },
    { id: "both", label: "Both" },
];

export default function Form() {
    const [title, setTitle] = useState("");
    const [caseType, setCaseType] = useState(CASE_TYPES[0]);
    const [incidentDate, setIncidentDate] = useState("");
    const [location, setLocation] = useState("");

    const [mainClaim, setMainClaim] = useState("");
    const [objective, setObjective] = useState("");
    const [supportingStatement, setSupportingStatement] = useState("");

    const [evidenceList, setEvidenceList] = useState("");
    const [files, setFiles] = useState([]);
    const [strongestEvidence, setStrongestEvidence] = useState("");

    const [opposingArgs, setOpposingArgs] = useState("");
    const [caseWeaknesses, setCaseWeaknesses] = useState("");

    const [trialDepth, setTrialDepth] = useState(TRIAL_DEPTH[1].id);
    const [tone, setTone] = useState(TONES[0].id);
    const [verdictOutput, setVerdictOutput] = useState(VERDICT_OUTPUT[2].id);

    const [submitting, setSubmitting] = useState(false);
    const [response, setResponse] = useState(null);
    const [errors, setErrors] = useState({});

    const toggleFormSubmitted = useStore(state => state.toggleFormSubmitted);
    const setResponseStore = useStore((state) => state.setResponse);
    const setDataReady = useStore((state) => state.setDataReady);

    function validate() {
        const e = {};
        if (!title.trim()) e.title = "Case title is required";
        if (!mainClaim.trim()) e.mainClaim = "Main claim is required";
        if (!objective.trim()) e.objective = "Objective is required";
        if (!evidenceList.trim() && files.length === 0)
            e.evidence = "Either list evidence or upload files";
        return e;
    }

    function handleFileChange(ev) {
        const chosen = Array.from(ev.target.files);
        setFiles((prev) => [...prev, ...chosen]);
    }

    function removeFile(idx) {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});
        setResponse(null);
        toggleFormSubmitted();

        const validation = validate();
        if (Object.keys(validation).length > 0) {
            setErrors(validation);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        setSubmitting(true);

        try {
            // 1️⃣ Create the case
            const resCase = await fetch("https://dev-xpo-backend.vercel.app/cases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: title.trim(),
                    description: mainClaim.trim() + (objective ? `\nObjective: ${objective}` : ""),
                    case_type: caseType,
                }),
            });

            if (!resCase.ok) {
                const text = await resCase.text();
                throw new Error(text || "Failed to create case");
            }

            const caseData = await resCase.json();
            const caseId = caseData.id; // get the real id from backend

            // 2️⃣ Upload evidence files if any
            for (let file of files) {
                const fd = new FormData();
                fd.append("file", file);
                fd.append("party", "Defense"); // adjust if needed
                await fetch(`https://dev-xpo-backend.vercel.app/cases/${caseId}/evidence`, {
                    method: "POST",
                    body: fd,
                });
            }

            // 3️⃣ Simulate the case
            const resSim = await fetch(`https://dev-xpo-backend.vercel.app/cases/${caseId}/simulate`, { method: "POST" });

            if (!resSim.ok) {
                const text = await resSim.text();
                throw new Error(text || "Failed to simulate case");
            }

            const simData = await resSim.json();
            setResponse(simData);
            setResponseStore(simData);
            setDataReady();
        } catch (err) {
            console.error(err);
            setResponse({ error: err.message || "Failed to submit" });
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="max-w-5xl mx-auto p-8">
            <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
                ⚖️ AI Courtroom Simulator
            </h1>

            {Object.keys(errors).length > 0 && (
                <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-lg mb-6 shadow">
                    <strong className="block mb-1">Please fix the following:</strong>
                    <ul className="list-disc ml-6 text-sm space-y-1">
                        {Object.entries(errors).map(([k, v]) => (
                            <li key={k}>{v}</li>
                        ))}
                    </ul>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-2xl shadow-lg border">
                {/* Case Information */}
                <section>
                    <h2 className="text-lg font-semibold mb-3 border-b pb-1">1. Case Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Case Title *" value={title} onChange={setTitle} placeholder="Accident at Main Street Junction" />
                        <Select label="Case Type" value={caseType} onChange={setCaseType} options={CASE_TYPES} />
                        <Input type="date" label="Date of Incident" value={incidentDate} onChange={setIncidentDate} />
                        <Input label="Location" value={location} onChange={setLocation} placeholder="Main Street Junction" />
                    </div>
                </section>

                {/* User Claim */}
                <section>
                    <h2 className="text-lg font-semibold mb-3 border-b pb-1">2. Your Claim</h2>
                    <div className="space-y-4">
                        <Input label="Main Claim *" value={mainClaim} onChange={setMainClaim} placeholder="I am not responsible for the accident." />
                        <Input label="Objective (What do you want to prove?) *" value={objective} onChange={setObjective} placeholder="The other driver was negligent." />
                        <Textarea label="Supporting Statement" value={supportingStatement} onChange={setSupportingStatement} placeholder="I was within speed limits, and a witness saw the other driver texting." />
                    </div>
                </section>

                {/* Evidence */}
                <section>
                    <h2 className="text-lg font-semibold mb-3 border-b pb-1">3. Evidence</h2>
                    <Textarea label="List Your Evidence (one per line)" value={evidenceList} onChange={setEvidenceList} placeholder="Witness testimony\nCar repair bill\nAccident photo" />
                    <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">Upload Files (images, pdfs)</label>
                        <input type="file" multiple onChange={handleFileChange} className="block w-full text-sm border rounded p-2 cursor-pointer" />
                        {files.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {files.map((f, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-gray-50 border rounded-lg p-3 shadow-sm">
                                        <div>
                                            <p className="text-sm font-medium">{f.name}</p>
                                            <p className="text-xs text-gray-500">{Math.round(f.size / 1024)} KB</p>
                                        </div>
                                        <button type="button" onClick={() => removeFile(idx)} className="text-red-600 text-xs hover:underline">Remove</button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <Input label="Strongest Evidence" value={strongestEvidence} onChange={setStrongestEvidence} placeholder="Witness testimony" className="mt-4" />
                </section>

                {/* Buttons */}
                <div className="flex items-center justify-between pt-4">
                    <button type="submit" disabled={submitting} className={`px-6 py-2.5 rounded-lg text-white font-medium shadow transition ${submitting ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}>
                        {submitting ? "Submitting..." : "🚀 Start Simulation"}
                    </button>
                    <button type="button" onClick={() => window.location.reload()} className="px-5 py-2.5 rounded-lg border font-medium text-gray-700 hover:bg-gray-100">
                        Reset
                    </button>
                </div>
            </form>

            {/* Response */}
            {response && (
                <div className="mt-8 p-6 rounded-2xl border bg-green-50 shadow">
                    <h3 className="font-semibold mb-3 text-green-800">Server Response</h3>
                    <pre className="text-sm">{JSON.stringify(response, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

/* 🔹 Reusable Components */
function Input({ label, value, onChange, type = "text", placeholder, className }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
    );
}

function Textarea({ label, value, onChange, placeholder, rows = 3 }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
    );
}

function Select({ label, value, onChange, options, rawOptions }) {
    return (
        <div>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <select value={value} onChange={(e) => rawOptions ? onChange(e.target.value) : onChange(options.find((opt) => opt === e.target.value))} className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                {(rawOptions || options).map((opt) => (
                    <option key={opt.id || opt} value={opt.id || opt}>{opt.label || opt}</option>
                ))}
            </select>
        </div>
    );
}
