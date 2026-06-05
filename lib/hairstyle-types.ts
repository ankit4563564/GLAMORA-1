export type HairstyleRecommendation = {
  id: string;
  name: string;
  imageUrl: string;
  matchedSalons: {
    _id: string;
    name: string;
    area: string;
    rating: number;
  }[];
};

export type HairstyleAnalysis = {
  hairType: string;
  hairTexture: string;
  faceShape: string;
  recommendedHairstyle: string;
  confidence: number;
};

export type HairstylePreviewResponse = {
  analysis: HairstyleAnalysis;
  recommendations: HairstyleRecommendation[];
  warning?: string;
};
