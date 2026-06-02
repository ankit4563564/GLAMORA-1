export type HairstyleAnalysis = {
  faceShape: string;
  skinTone: string;
  hairType: string;
  recommendedHairstyle: string;
  confidence: number;
};

export type HairstylePreviewResponse = {
  analysis: HairstyleAnalysis;
  generatedImageUrl: string;
};
