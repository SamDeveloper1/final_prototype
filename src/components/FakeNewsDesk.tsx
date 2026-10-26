"use client";

import React, { useState, useRef } from "react";
import { predictFakeNews, predictImage, predictMultimodal, API_BASE } from "@/lib/api";
import { FakeNewsResponse, ImageVerdictResponse, MultimodalResponse } from "@/types/api";
import { RubberStamp } from "./RubberStamp";
import { 
  Globe, 
  FileText, 
  Send, 
  Sparkles, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Code2, 
  Zap, 
  Image as ImageIcon, 
  UploadCloud, 
  X, 
  CheckCircle2, 
  AlertTriangle,
  Layers
} from "lucide-react";
import confetti from "canvas-confetti";

export const FakeNewsDesk: React.FC = () => {
  const [mode, setMode] = useState<"text" | "url" | "multimodal">("text");
  const [selectedModel, setSelectedModel] = useState<string>("auto");
  const [inputText, setInputText] = useState("");
  const [inputUrl, setInputUrl] = useState("");
  
  // Image & Multimodal State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageHeadline, setImageHeadline] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Result States
  const [textResult, setTextResult] = useState<FakeNewsResponse | null>(null);
  const [imageResult, setImageResult] = useState<ImageVerdictResponse | null>(null);
  const [multimodalResult, setMultimodalResult] = useState<MultimodalResponse | null>(null);
  const [showJson, setShowJson] = useState(false);

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (.jpg, .jpeg, .png, .webp).");
      return;
    }
    setError(null);
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Helper to load sample image from backend
  const loadRemoteSample = async (filename: string, headline: string, promptMode: "multimodal") => {
    setError(null);
    setMode(promptMode);
    setImageHeadline(headline);
    setLoading(true);

    try {
      let res = await fetch(`${API_BASE}/api/sample_images/${filename}`);
      if (!res.ok) {
        // Fallback to local static asset in frontend public directory
        res = await fetch(`/sample_images/${filename}`);
      }
      if (!res.ok) throw new Error("Could not fetch sample image.");
      const blob = await res.blob();
      const file = new File([blob], filename, { type: "image/jpeg" });
      handleImageSelect(file);
    } catch (err: any) {
      setError(err.message || "Failed to load sample image.");
    } finally {
      setLoading(false);
    }
  };

  // Quick Test Samples for Examiners
  const loadSample = (type: "real_text" | "fake_text" | "real_url" | "real_image" | "fake_image" | "mismatch_multimodal") => {
    setError(null);
    if (type === "real_text") {
      setMode("text");
      setSelectedModel("auto");
      setInputText(
        "India and France hold bilateral strategic dialogue in New Delhi to strengthen defense cooperation, cyber security resilience, and joint maritime surveillance across the Indo-Pacific region."
      );
    } else if (type === "fake_text") {
      setMode("text");
      setSelectedModel("auto");
      setInputText(
        "Central government is offering free laptops and smartphones to all students across India under PM Free Laptop Yojana viral message."
      );
    } else if (type === "real_url") {
      setMode("url");
      setSelectedModel("auto");
      setInputUrl(
        "https://indianexpress.com/article/cities/ahmedabad/vadodara-narendra-pm-modi-inertia-swipe-upa-era-dedicated-freight-corridor-10868440/?ref=hometop_hp"
      );
    } else if (type === "real_image") {
      loadRemoteSample(
        "real_3_real_2489_77228096.jpg",
        "Manipur musician killed in Delhi; eight held for mob lynching - The Hindu verified report",
        "multimodal"
      );
    } else if (type === "fake_image") {
      loadRemoteSample(
        "fake_2_fake_3191_d3dcc318.jpg",
        "Bangladesh Mosque Resurfaces As Donation Received In Shirdi Sai Temple - Fact Check",
        "multimodal"
      );
    } else if (type === "mismatch_multimodal") {
      loadRemoteSample(
        "real_4_real_2748_e736a49a.jpg",
        "ALERT: Massive oil refinery explosion reported in Jamnagar today destroying entire district (Cross-Modal False Claim)",
        "multimodal"
      );
    }
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTextResult(null);
    setImageResult(null);
    setMultimodalResult(null);

    setLoading(true);
    try {
      if (mode === "text" || mode === "url") {
        if (mode === "text" && (!inputText || inputText.trim().length < 5)) {
          throw new Error("Please enter at least a complete sentence (5+ characters) to verify.");
        }
        if (mode === "url" && (!inputUrl || !inputUrl.startsWith("http"))) {
          throw new Error("Please provide a valid web article URL starting with http:// or https://");
        }

        const payload = mode === "text" 
          ? { text: inputText, model: selectedModel } 
          : { url: inputUrl, model: selectedModel };

        const data = await predictFakeNews(payload);
        setTextResult(data);
        if (data.verdict === "Real News") {
          confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
        }
      } else {
        // Multimodal / Image mode
        if (!imageFile) {
          throw new Error("Please upload or select an image to analyze.");
        }

        if (imageHeadline && imageHeadline.trim().length >= 5) {
          // Both text & image provided: execute Multimodal Late Fusion
          const data = await predictMultimodal(imageHeadline, imageFile, selectedModel);
          setMultimodalResult(data);
          if (data.verdict === "REAL") {
            confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
          }
        } else {
          // Pure image forensics
          const data = await predictImage(imageFile);
          setImageResult(data);
          if (data.verdict === "REAL") {
            confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  // Active verdict for display
  const activeVerdict = multimodalResult 
    ? (multimodalResult.verdict === "REAL" ? "Real News" : "Fake News")
    : imageResult 
    ? (imageResult.verdict === "REAL" ? "Real News" : "Fake News")
    : textResult?.verdict || null;

  const activeConfidence = multimodalResult
    ? multimodalResult.confidence
    : imageResult
    ? imageResult.confidence
    : textResult?.confidence_score || 0;

  const activeLatency = multimodalResult
    ? multimodalResult.total_latency_ms
    : imageResult
    ? imageResult.latency_ms
    : textResult?.inference_time_ms || 0;

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        {/* Left Column: Input Desk */}
        <div className="lg:col-span-5 bg-[#FAF8F5] border-2 border-[#CBC8B9] p-4 sm:p-6 shadow-xs rounded-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#CBC8B9] pb-3 mb-4">
              <span className="text-xs font-mono-meta font-bold uppercase tracking-wider text-[#353535]">
                Dispatch Submission Box
              </span>
              <span className="text-xs font-mono-meta text-[#D74108] font-bold bg-[#EDE8DF] px-2 py-0.5 rounded-xs border border-[#CBC8B9]">
                {mode === "multimodal" ? "ResNet-50 + SVM Fusion" : (selectedModel === "auto" ? "V2 Production ML" : selectedModel.toUpperCase())}
              </span>
            </div>

            {/* Runtime Model Architecture Selector */}
            <div className="mb-4">
              <label className="block text-[11px] font-mono-meta font-bold uppercase tracking-wider mb-1 text-[#353535] flex items-center justify-between">
                <span>Text Classifier Engine:</span>
                <span className="text-[10px] text-[#D74108] lowercase font-normal">runtime selectable</span>
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full bg-[#FAF8F5] border-2 border-[#CBC8B9] rounded-xs p-2 text-xs font-mono-meta font-bold text-[#131112] focus:outline-hidden focus:border-[#D74108] cursor-pointer"
              >
                <optgroup label="── Third Prototype (Dataset V2 Flagship 2020-2026) ──">
                  <option value="auto">★ Auto: Calibrated Linear SVM (V2 Production | 91.3% F1 | 1.4ms)</option>
                  <option value="svm_v2">Linear SVM (Dataset V2 | 91.3% F1 | 1.4ms)</option>
                  <option value="logistic_v2">Logistic Regression (Dataset V2 | 90.0% F1 | 0.2ms)</option>
                  <option value="naive_bayes_v2">Multinomial Naive Bayes (Dataset V2 | 85.9% F1 | 0.3ms)</option>
                  <option value="random_forest_v2">Random Forest Ensemble (Dataset V2 | 86.5% F1 | 14ms)</option>
                  <option value="bert_v2">Fine-Tuned BERT Transformer (Dataset V2 | 94.6% F1 | Cloud T4)</option>
                  <option value="bilstm_v2">Bidirectional LSTM (Dataset V2 | 94.6% F1 | Cloud T4)</option>
                </optgroup>
                <optgroup label="── Second Prototype (Dataset V1 Baseline) ──">
                  <option value="svm_v1">Linear SVM (Dataset V1 Baseline | 93.0% F1)</option>
                  <option value="logistic_v1">Logistic Regression (Dataset V1 | 92.8% F1)</option>
                  <option value="naive_bayes_v1">Multinomial Naive Bayes (Dataset V1 | 89.1% F1)</option>
                  <option value="random_forest_v1">Random Forest (Dataset V1 | 92.6% F1)</option>
                  <option value="bert_v1">BERT Transformer (Dataset V1 | 97.0% F1)</option>
                </optgroup>
              </select>
            </div>

            {/* Input Mode Selector */}
            <div className="grid grid-cols-3 rounded-xs bg-[#EAE4D9] p-1 mb-4 border border-[#CBC8B9] gap-1">
              <button
                type="button"
                onClick={() => setMode("text")}
                className={`flex items-center justify-center gap-1.5 py-2 text-[11px] font-mono-meta font-bold uppercase rounded-xs transition-all ${
                  mode === "text" ? "bg-[#FAF8F5] text-[#131112] shadow-xs" : "text-[#353535] hover:text-[#131112]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Text Claim
              </button>
              <button
                type="button"
                onClick={() => setMode("url")}
                className={`flex items-center justify-center gap-1.5 py-2 text-[11px] font-mono-meta font-bold uppercase rounded-xs transition-all ${
                  mode === "url" ? "bg-[#FAF8F5] text-[#131112] shadow-xs" : "text-[#353535] hover:text-[#131112]"
                }`}
              >
                <Globe className="w-3.5 h-3.5" /> Web URL
              </button>
              <button
                type="button"
                onClick={() => setMode("multimodal")}
                className={`flex items-center justify-center gap-1.5 py-2 text-[11px] font-mono-meta font-bold uppercase rounded-xs transition-all ${
                  mode === "multimodal" ? "bg-[#FAF8F5] text-[#D74108] shadow-xs" : "text-[#353535] hover:text-[#131112]"
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" /> Visual/Image
              </button>
            </div>

            <form onSubmit={handleAnalyze} className="space-y-4">
              {mode === "text" && (
                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider mb-1 text-[#131112]">
                    Enter News Headline or Full Article Text:
                  </label>
                  <textarea
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Paste news claim, social media rumor, or press statement here..."
                    className="w-full p-3 bg-[#EDE8DF]/60 border border-[#CBC8B9] rounded-xs text-sm font-headline text-[#131112] placeholder-[#737A87] focus:bg-[#FAF8F5] focus:outline-hidden focus:border-[#131112] focus:ring-1 focus:ring-[#131112] transition-all"
                  />
                </div>
              )}

              {mode === "url" && (
                <div>
                  <label className="block text-xs font-headline font-bold uppercase tracking-wider mb-1 text-[#131112]">
                    Enter Article URL to Live Scrape:
                  </label>
                  <input
                    type="url"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    placeholder="https://indianexpress.com/article/..."
                    className="w-full p-3 bg-[#EDE8DF]/60 border border-[#CBC8B9] rounded-xs text-sm font-mono-meta text-[#131112] placeholder-[#737A87] focus:bg-[#FAF8F5] focus:outline-hidden focus:border-[#131112] focus:ring-1 focus:ring-[#131112] transition-all"
                  />
                  <p className="mt-1.5 text-[11px] font-mono-meta text-[#353535]">
                    Supports Indian Express, PIB Releases, The Hindu, NDTV, Alt News, etc.
                  </p>
                </div>
              )}

              {mode === "multimodal" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-headline font-bold uppercase tracking-wider mb-1 text-[#131112]">
                      Upload News Image (Forensic Analysis):
                    </label>
                    
                    {/* Drag and Drop Zone */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xs p-4 text-center cursor-pointer transition-all ${
                        imagePreview ? "border-[#1E5E41] bg-[#EDE8DF]/30" : "border-[#CBC8B9] bg-[#EDE8DF]/60 hover:bg-[#FAF8F5]"
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleImageSelect(e.target.files[0]);
                          }
                        }}
                      />
                      
                      {imagePreview ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={imagePreview}
                            alt="Upload preview"
                            className="w-20 h-20 object-cover rounded-xs border border-[#131112]"
                          />
                          <div className="text-left flex-1 min-w-0">
                            <div className="text-xs font-mono-meta font-bold text-[#131112] truncate">
                              {imageFile?.name}
                            </div>
                            <div className="text-[11px] font-mono-meta text-[#353535]">
                              {imageFile ? `${(imageFile.size / 1024).toFixed(1)} KB` : ""}
                            </div>
                            <div className="text-[10px] font-mono-meta text-[#1E5E41] font-semibold mt-1 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Image Loaded (ResNet 256x256)
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearImage();
                            }}
                            className="p-1.5 rounded-full hover:bg-[#DFD9CE] text-[#353535]"
                            title="Remove image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="py-4">
                          <UploadCloud className="w-8 h-8 text-[#D74108] mx-auto mb-2" />
                          <div className="text-xs font-mono-meta font-bold text-[#131112]">
                            Drag & Drop or Click to Select News Image
                          </div>
                          <div className="text-[10px] font-mono-meta text-[#6B7280] mt-1">
                            Supports JPG, PNG, WebP (Analyzed via ResNet-50 Vision CNN)
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-headline font-bold uppercase tracking-wider mb-1 text-[#131112] flex items-center justify-between">
                      <span>Accompanying Headline / Claim Text:</span>
                      <span className="text-[10px] font-mono-meta text-[#6B7280] lowercase">optional for multimodal late fusion</span>
                    </label>
                    <textarea
                      rows={3}
                      value={imageHeadline}
                      onChange={(e) => setImageHeadline(e.target.value)}
                      placeholder="Enter the viral headline or news statement that accompanied this image..."
                      className="w-full p-2.5 bg-[#EDE8DF]/60 border border-[#CBC8B9] rounded-xs text-xs font-headline text-[#131112] placeholder-[#737A87] focus:bg-[#FAF8F5] focus:outline-hidden focus:border-[#131112] focus:ring-1 focus:ring-[#131112] transition-all"
                    />
                    <div className="text-[10px] font-mono-meta text-[#6B7280] mt-0.5">
                      • With Text: Executes Multimodal Late Fusion (Text + Image + Context Mismatch Check).<br />
                      • Without Text: Executes Pure ResNet-50 Visual Forensic Classification.
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-mono-meta rounded-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] px-4 py-3 bg-[#131112] hover:bg-[#D74108] text-white text-xs sm:text-sm font-mono-meta font-bold uppercase tracking-wider sm:tracking-widest rounded-xs flex items-center justify-center gap-2.5 transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-center"
              >
                {loading ? (
                  <>
                    <span className="inline-block w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin shrink-0" />
                    <span className="truncate">
                      {mode === "multimodal" ? "Running ResNet-50 Vision Forensics..." : "Executing Verification Engine..."}
                    </span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 shrink-0" />
                    <span>
                      {mode === "multimodal" 
                        ? (imageHeadline.trim() ? "Execute Multimodal Late Fusion" : "Run Visual Forensic Scan")
                        : "Verify Claim & Print Edition"}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick-Load Samples */}
          <div className="mt-6 pt-4 border-t border-[#CBC8B9]">
            <div className="text-[11px] font-mono-meta font-bold uppercase tracking-wider text-[#353535] mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D74108]" /> One-Click Examiner Benchmarks:
            </div>
            
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono-meta uppercase tracking-wider text-[#6B7280] font-semibold">
                Text Verification:
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadSample("real_text")}
                  className="text-[11px] font-mono-meta px-2 py-1 bg-[#EDE8DF] hover:bg-[#DFD9CE] text-[#131112] rounded-xs border border-[#CBC8B9] transition-all font-semibold"
                >
                  ✓ Real News Text
                </button>
                <button
                  type="button"
                  onClick={() => loadSample("fake_text")}
                  className="text-[11px] font-mono-meta px-2 py-1 bg-[#EDE8DF] hover:bg-[#DFD9CE] text-[#D74108] rounded-xs border border-[#CBC8B9] transition-all font-semibold"
                >
                  ⚠ Viral Fake Claim
                </button>
                <button
                  type="button"
                  onClick={() => loadSample("real_url")}
                  className="text-[11px] font-mono-meta px-2 py-1 bg-[#EDE8DF] hover:bg-[#DFD9CE] text-[#1E5E41] rounded-xs border border-[#CBC8B9] transition-all font-semibold"
                >
                  📰 Live Express URL
                </button>
              </div>

              <div className="text-[10px] font-mono-meta uppercase tracking-wider text-[#6B7280] font-semibold pt-1">
                Visual Forensics & Multimodal (IFND):
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => loadSample("real_image")}
                  className="text-[11px] font-mono-meta px-2 py-1 bg-[#EDE8DF] hover:bg-[#DFD9CE] text-[#1E5E41] rounded-xs border border-[#CBC8B9] transition-all font-semibold flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#1E5E41]" /> The Hindu (Real Photo)
                </button>
                <button
                  type="button"
                  onClick={() => loadSample("fake_image")}
                  className="text-[11px] font-mono-meta px-2 py-1 bg-[#EDE8DF] hover:bg-[#DFD9CE] text-[#D74108] rounded-xs border border-[#CBC8B9] transition-all font-semibold flex items-center gap-1"
                >
                  <AlertTriangle className="w-3 h-3 text-[#D74108]" /> BoomLive (Debunked Viral)
                </button>
                <button
                  type="button"
                  onClick={() => loadSample("mismatch_multimodal")}
                  className="text-[11px] font-mono-meta px-2 py-1 bg-[#EDE8DF] hover:bg-[#DFD9CE] text-amber-800 rounded-xs border border-[#CBC8B9] transition-all font-semibold flex items-center gap-1"
                >
                  <Layers className="w-3 h-3 text-amber-700" /> Cross-Modal Mismatch
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Front Page Result Card */}
        <div className="lg:col-span-7 bg-[#FAF8F5] border-2 border-[#131112] p-4 sm:p-6 md:p-8 shadow-xs rounded-xs flex flex-col justify-between relative overflow-hidden">
          {activeVerdict ? (
            <div>
              {/* Card Broadsheet Header */}
              <div className="border-b-2 border-[#131112] pb-2 flex items-center justify-between text-xs font-mono-meta text-[#353535]">
                <span>
                  {multimodalResult ? "MULTIMODAL FORENSIC INTELLIGENCE DOSSIER" : (imageResult ? "VISUAL FORENSIC SCAN REPORT" : "SPECIAL EDITORIAL VERIFICATION REPORT")}
                </span>
                <span className="flex items-center gap-1 text-[#131112] font-bold">
                  <Zap className="w-3 h-3 text-[#D74108] shrink-0" /> {activeLatency}ms
                </span>
              </div>

              {/* Headline */}
              <div className="mt-3 sm:mt-4 mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-headline font-bold text-[#131112] leading-tight">
                  {textResult?.headline_analyzed || imageHeadline || (imageFile ? `Visual Asset: ${imageFile.name}` : "Disinformation Assessment Summary")}
                </h2>
                <div className="mt-1 text-xs font-mono-meta text-[#353535]">
                  {multimodalResult 
                    ? `Fused Modality (ResNet-50 Vision + ${multimodalResult.text_modality.model})`
                    : (imageResult ? "ResNet-50 Visual Forensics (IFND Benchmark)" : `Analyzed via ${textResult?.model_used}`)}
                </div>
              </div>

              {/* Multimodal Asset Inspection Grid */}
              {(multimodalResult || imageResult) && imagePreview && (
                <div className="mb-4 p-3 bg-[#EDE8DF]/60 border border-[#CBC8B9] rounded-xs flex flex-col sm:flex-row gap-4 items-center">
                  <div className="relative shrink-0">
                    <img
                      src={imagePreview}
                      alt="Analyzed news asset"
                      className="w-36 h-28 object-cover rounded-xs border border-[#131112]"
                    />
                    <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/80 text-white font-mono-meta text-[9px] rounded-xs uppercase">
                      Input Asset
                    </div>
                  </div>
                  <div className="flex-1 text-xs font-mono-meta space-y-1 w-full">
                    <div className="font-bold text-[#131112] flex items-center justify-between border-b border-[#CBC8B9] pb-1">
                      <span>Visual Forensic Telemetry</span>
                      <span className="text-[#D74108]">ResNet-50 Backbone</span>
                    </div>
                    {imageResult?.forensics || multimodalResult?.image_modality.forensics ? (
                      (() => {
                        const f = imageResult?.forensics || multimodalResult?.image_modality.forensics!;
                        return (
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 text-[11px]">
                            <div>Dimensions: <span className="font-bold text-[#131112]">{f.width} × {f.height} px</span></div>
                            <div>Aspect Ratio: <span className="font-bold text-[#131112]">{f.aspect_ratio}:1</span></div>
                            <div>Laplacian Sharpness: <span className="font-bold text-[#131112]">{f.sharpness_score}</span></div>
                            <div>Artifact Status: <span className={`font-bold ${f.is_blurry ? "text-amber-700" : "text-[#1E5E41]"}`}>{f.is_blurry ? "Heavy Blur/Noise" : "Crisp Editorial"}</span></div>
                          </div>
                        );
                      })()
                    ) : null}
                  </div>
                </div>
              )}

              {/* Cross-Modal Consistency Analysis Banner (IFND Benchmark Key Feature) */}
              {multimodalResult && (
                <div className={`mb-4 p-3.5 rounded-xs border text-xs font-mono-meta ${
                  multimodalResult.modality_analysis.status.includes("Mismatch") || multimodalResult.modality_analysis.status.includes("Recontextualized")
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : (multimodalResult.verdict === "REAL" ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-red-50 border-red-300 text-red-900")
                }`}>
                  <div className="font-bold uppercase tracking-wider flex items-center gap-1.5 text-sm mb-1">
                    <Layers className="w-4 h-4 shrink-0" />
                    <span>Cross-Modal Synthesis: {multimodalResult.modality_analysis.status}</span>
                  </div>
                  <p className="font-headline text-[13px] leading-relaxed mb-2">
                    {multimodalResult.modality_analysis.explanation}
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-black/10 text-center text-[10px]">
                    <div className="p-1 bg-white/60 rounded-xs">
                      <div className="text-[#6B7280]">Text Modality</div>
                      <div className="font-bold text-xs">{multimodalResult.text_modality.verdict} ({multimodalResult.text_modality.confidence}%)</div>
                    </div>
                    <div className="p-1 bg-white/60 rounded-xs">
                      <div className="text-[#6B7280]">Visual Modality</div>
                      <div className="font-bold text-xs">{multimodalResult.image_modality.verdict} ({multimodalResult.image_modality.confidence}%)</div>
                    </div>
                    <div className="p-1 bg-white/60 rounded-xs">
                      <div className="text-[#6B7280]">Late Fusion Score</div>
                      <div className="font-bold text-xs">{multimodalResult.verdict} ({multimodalResult.confidence}%)</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Centerpiece: Rubber Stamp & Confidence Meter */}
              <div className="p-4 sm:p-6 bg-[#EDE8DF] border border-[#CBC8B9] rounded-xs my-4 sm:my-6 flex flex-col sm:flex-row items-center justify-center sm:justify-around gap-6">
                {/* Physics Animated Rubber Stamp */}
                <RubberStamp
                  verdict={activeVerdict}
                  confidence={activeConfidence}
                  type="fakenews"
                />

                {/* Circular / Radial Confidence Meter */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke="#CBC8B9"
                        strokeWidth="8"
                        fill="transparent"
                      />
                      <circle
                        cx="48"
                        cy="48"
                        r="38"
                        stroke={activeVerdict === "Real News" ? "#1E5E41" : "#D74108"}
                        strokeWidth="8"
                        strokeDasharray={2 * Math.PI * 38}
                        strokeDashoffset={
                          2 * Math.PI * 38 * (1 - activeConfidence / 100)
                        }
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center justify-center text-center">
                      <span className="text-xl font-headline font-bold text-[#131112]">
                        {activeConfidence.toFixed(0)}%
                      </span>
                      <span className="text-[9px] font-mono-meta text-[#353535]">
                        CONFIDENCE
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] font-mono-meta font-bold text-[#353535]">
                    {activeConfidence >= 80
                      ? "High Statistical Certainty"
                      : "Moderate Significance"}
                  </div>
                </div>
              </div>

              {/* Scraped Article Preview / Context */}
              {textResult?.preview_text && (
                <div className="mt-4">
                  <div className="text-xs font-mono-meta font-bold uppercase tracking-wider text-[#353535] mb-1">
                    Scraped Article Lead Excerpt:
                  </div>
                  <div className="p-3 bg-[#EDE8DF]/50 border-l-2 border-[#131112] text-xs font-headline italic text-[#353535] leading-relaxed">
                    "{textResult.preview_text}"
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[350px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[#CBC8B9] rounded-xs bg-[#FAF8F5]">
              <div className="w-16 h-16 rounded-full bg-[#EDE8DF] flex items-center justify-center text-[#353535] mb-3">
                {mode === "multimodal" ? <ImageIcon className="w-8 h-8" /> : <FileText className="w-8 h-8" />}
              </div>
              <h3 className="text-lg font-headline font-bold text-[#131112]">
                {mode === "multimodal" ? "Visual & Multimodal Forensics Awaiting Input" : "Front Page Verification Awaiting Input"}
              </h3>
              <p className="mt-1 max-w-sm text-xs font-headline italic text-[#353535]">
                {mode === "multimodal"
                  ? "Upload a news photo or click a benchmark sample to test ResNet-50 visual forensics and cross-modal consistency."
                  : "Submit a raw news story or paste a live URL from the left panel to execute forensic classification."}
              </p>
            </div>
          )}

          {/* Expandable "Inspect Raw API JSON" Drawer */}
          {(textResult || imageResult || multimodalResult) && (
            <div className="mt-6 pt-4 border-t border-[#CBC8B9]">
              <button
                type="button"
                onClick={() => setShowJson(!showJson)}
                className="flex items-center gap-2 text-xs font-mono-meta text-[#353535] hover:text-[#131112] transition-colors"
              >
                <Code2 className="w-4 h-4 text-[#D74108]" />
                <span className="font-semibold">
                  {showJson ? "Hide API Raw Log" : "Inspect Raw API JSON (FastAPI Output)"}
                </span>
                {showJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showJson && (
                <pre className="mt-3 p-3 bg-[#131112] text-emerald-400 font-mono-meta text-[11px] rounded-xs overflow-x-auto max-h-48 border border-black shadow-inner">
                  {JSON.stringify(multimodalResult || imageResult || textResult, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
