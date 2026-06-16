export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export interface Settings extends AiSettings {
  cyberpulseApiKey: string;
}

export const SETTINGS_KEY = 'cyberpulse_settings';

export const DEFAULT_AI_SETTINGS: AiSettings = {
  apiKey: '',
  model: 'gpt-4o-mini',
  baseUrl: 'https://api.openai.com/v1',
};

export const DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_AI_SETTINGS,
  cyberpulseApiKey: '',
};

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      apiKey: parsed.apiKey ?? DEFAULT_SETTINGS.apiKey,
      model: parsed.model ?? DEFAULT_SETTINGS.model,
      baseUrl: parsed.baseUrl ?? DEFAULT_SETTINGS.baseUrl,
      cyberpulseApiKey: parsed.cyberpulseApiKey ?? DEFAULT_SETTINGS.cyberpulseApiKey,
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/* Backward-compatible AI settings helpers */
export function getAiSettings(): AiSettings {
  const settings = getSettings();
  return {
    apiKey: settings.apiKey,
    model: settings.model,
    baseUrl: settings.baseUrl,
  };
}

export function saveAiSettings(settings: AiSettings): void {
  const current = getSettings();
  saveSettings({ ...current, ...settings });
}
