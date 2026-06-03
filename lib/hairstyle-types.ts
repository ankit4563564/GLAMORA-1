export type HairstyleAnalysis = {
  hairType: string;
  hairTexture: string;
  hairCondition: string;
  recommendedHairstyle: string;
  confidence: number;
};

export type HairstylePreviewResponse = {
  analysis: HairstyleAnalysis;
  generatedImageUrl: string;
};
