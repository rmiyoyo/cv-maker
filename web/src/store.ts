import { useEffect, useState } from "react";
import { initialState, type CvState } from "./types";

const STORAGE_KEY = "monica-cv-maker:v1";

export function loadState(): CvState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return initialState();
    const parsed = JSON.parse(saved) as Partial<CvState>;
    const base = initialState();
    return {
      resume: { ...base.resume, ...parsed.resume },
      settings: { ...base.settings, ...parsed.settings },
    };
  } catch {
    return initialState();
  }
}

export function useCvState() {
  const [state, setState] = useState<CvState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return [state, setState] as const;
}
