import axios from 'axios';
import type { CatMatch } from '../results/types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function submitAnswers(tags: string[]): Promise<CatMatch[]> {
  const res = await axios.post<{ matches: CatMatch[] }>(`${API_BASE}/api/match`, { tags });
  return res.data.matches;
}
