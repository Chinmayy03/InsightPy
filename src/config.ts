export const APP_CONFIG = {
  /**
   * Toggle between pure in-browser EDA (false) and FastAPI Python backend (true).
   * In full-stack mode, server.ts starts the Python FastAPI server (backend/main.py)
   * and proxies /api/* requests to it seamlessly.
   */
  USE_PYTHON_BACKEND: true,
  BACKEND_URL: '/api',
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50 MB
  LARGE_ROW_CAP: 50000, // Cap preview & chart sampling above 50,000 rows
  PREVIEW_PAGE_SIZE: 25,
} as const;

export const CHART_PALETTE = [
  '#F32E35',
  '#4E50DE',
  '#22D3EE',
  '#F59E0B',
  '#10B981',
  '#A855F7',
  '#FB7185',
  '#60A5FA',
] as const;
