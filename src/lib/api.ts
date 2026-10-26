import { 
  FakeNewsResponse, 
  FakeNewsInput, 
  HateSpeechResponse, 
  HealthResponse, 
  BenchmarkResponse,
  ImageVerdictResponse,
  MultimodalResponse,
  SampleImage
} from "@/types/api";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function checkBackendHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    throw new Error(`Health check failed with status ${res.status}`);
  }
  return res.json();
}

export async function getBenchmarks(): Promise<BenchmarkResponse> {
  const res = await fetch(`${API_BASE}/api/benchmarks`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" }
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch model benchmarks: ${res.status}`);
  }
  return res.json();
}

export async function predictFakeNews(payload: FakeNewsInput): Promise<FakeNewsResponse> {
  const res = await fetch(`${API_BASE}/predict_fakenews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Unknown server error" }));
    throw new Error(errorData.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function predictHateSpeech(payload: { text?: string; url?: string }): Promise<HateSpeechResponse> {
  const res = await fetch(`${API_BASE}/predict_hatespeech`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Unknown server error" }));
    throw new Error(errorData.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function predictHateSpeechMedia(file: File): Promise<HateSpeechResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/predict_hatespeech_media`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Unknown media processing error" }));
    throw new Error(errorData.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function predictImage(file: File): Promise<ImageVerdictResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE}/api/predict_image`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Image forensics processing error" }));
    throw new Error(errorData.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function predictMultimodal(text: string, file: File, model: string = "auto"): Promise<MultimodalResponse> {
  const formData = new FormData();
  formData.append("text", text);
  formData.append("file", file);
  formData.append("model", model);

  const res = await fetch(`${API_BASE}/api/predict_multimodal`, {
    method: "POST",
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Multimodal fusion error" }));
    throw new Error(errorData.detail || `Server error: ${res.status}`);
  }

  return res.json();
}

export async function getSampleImages(): Promise<SampleImage[]> {
  const res = await fetch(`${API_BASE}/api/sample_images`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" }
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch sample images: ${res.status}`);
  }

  const data = await res.json();
  return data.samples || [];
}
