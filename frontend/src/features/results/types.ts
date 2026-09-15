export interface CatMatch {
  id: number;
  name: string;
  description: string;
  keywords: string[];
  adoptionUrl: string;
  imageUrl: string | null;
  matchScore: number;
}
