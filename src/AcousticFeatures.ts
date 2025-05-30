export interface AcousticFeatures {
  pitch: number;
  hnr: number;
  loudness: number;
  formant1: number;
  jitter: number;
  shimmer: number;
  mfcc1: number;
  spectralFlux: number;
  zcr: number;
  pitchVariability: number;
  speechRate: number;
  filename?: string;
} 