import { api, getApiBaseUrl, setBackendUrl, DEPLOYED_BACKEND_URL } from './lib/api';

export const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

export { api, getApiBaseUrl, setBackendUrl, DEPLOYED_BACKEND_URL };
export default api;
