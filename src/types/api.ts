/**
 * API Response and Request Types
 * ==============================
 * Maps directly to FastAPI backend schemas in sec_prototype/main.py
 */

export interface FakeNewsInput {
  text?: string;
  url?: string;
  model?: string;
}

export interface FakeNewsResponse {
  status: "success" | "error";
  verdict: "Real News" | "Fake News";
  confidence_score: number;
  model_used?: string;
  input_type: "text" | "url";
  headline_analyzed: string;
  preview_text: string;
  inference_time_ms: number;
}

export interface BenchmarkModel {
  name: string;
  type: string;
  accuracy: number;
  f1_score: number;
  macro_f1?: number;
  precision: number;
  recall: number;
  badge: string;
  latency_ms: string;
  confusion_matrix?: number[][];
}

export interface BenchmarkPrototype {
  version: string;
  description: string;
  test_sample_count: number;
  models: BenchmarkModel[];
}

export interface BenchmarkResponse {
  prototype_3_v2: BenchmarkPrototype;
  prototype_2_v1: BenchmarkPrototype;
}

export interface HateSpeechResponse {
  status: "success" | "error";
  verdict: "Safe / Non-Hate" | "Hate Speech / Hostile";
  confidence_score: number;
  model_used?: string;
  input_type: "text" | "url" | "audio" | "video";
  preview_text: string;
  transcribed_text?: string;
  inference_time_ms: number;
}

export interface HealthResponse {
  status: string;
  models: {
    fake_news: string;
    hate_speech: string;
    audio_transcription: string;
  };
}

export interface ImageForensicsData {
  width: number;
  height: number;
  aspect_ratio: number;
  sharpness_score: number;
  is_blurry: boolean;
  mean_rgb: number[];
}

export interface ImageVerdictResponse {
  verdict: "REAL" | "FAKE";
  is_fake: boolean;
  confidence: number;
  prob_fake: number;
  prob_real: number;
  model: string;
  resolution: [number, number];
  input_tensor_shape: [number, number, number, number];
  forensics: ImageForensicsData;
  latency_ms: number;
}

export interface MultimodalResponse {
  verdict: "REAL" | "FAKE";
  confidence: number;
  fused_prob_fake: number;
  fused_prob_real: number;
  fusion_weights: {
    text_weight: number;
    image_weight: number;
  };
  modality_analysis: {
    status: string;
    explanation: string;
    text_prob_fake: number;
    image_prob_fake: number;
    cross_modal_gap: number;
  };
  text_modality: {
    verdict: string;
    confidence: number;
    model: string;
    latency_ms: number;
  };
  image_modality: ImageVerdictResponse;
  total_latency_ms: number;
}

export interface SampleImage {
  filename: string;
  label: "REAL" | "FAKE";
  label_numeric: number;
  relative_url: string;
  size_bytes: number;
}
