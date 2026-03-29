import { ENV } from '../config/env';
import { supabase } from './supabase';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  formData?: FormData;
  params?: Record<string, string | number | boolean>;
}

class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = ENV.API_BASE_URL;
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (token) {
      return { authorization: `Bearer ${token}` };
    }
    return {};
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean>): string {
    // Simple string concatenation to avoid Hermes URL constructor quirks
    const base = this.baseUrl.endsWith('/') ? this.baseUrl.slice(0, -1) : this.baseUrl;
    const p = path.startsWith('/') ? path : `/${path}`;
    let url = `${base}${p}`;
    if (params) {
      const qs = Object.entries(params)
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
        .join('&');
      if (qs) url += `?${qs}`;
    }
    return url;
  }

  async request<T>(method: HttpMethod, path: string, options?: RequestOptions): Promise<T> {
    const authHeaders = await this.getAuthHeader();
    const url = this.buildUrl(path, options?.params);

    const headers: Record<string, string> = {
      ...authHeaders,
    };

    let body: string | FormData | undefined;

    if (options?.formData) {
      body = options.formData;
      // Don't set Content-Type for FormData - browser/RN will set it with boundary
    } else if (options?.body !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(options.body);
    }

    if (__DEV__) {
      console.log(`[API] ${method} ${url}`, body ? (typeof body === 'string' ? body.substring(0, 200) : '(FormData)') : '(no body)');
    }

    const response = await fetch(url, { method, headers, body });

    if (response.status === 204) {
      return undefined as T;
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let message = `API Error: ${response.status}`;
      try {
        const parsed = JSON.parse(errorBody);
        message = parsed.detail || parsed.message || message;
      } catch {
        message = errorBody || message;
      }
      console.error(`[API] ${method} ${url} → ${response.status}:`, errorBody, '\nSent body:', typeof body === 'string' ? body : '(FormData/none)');
      throw new ApiError(message, response.status);
    }

    return response.json();
  }

  get<T>(path: string, params?: Record<string, string | number | boolean>) {
    return this.request<T>('GET', path, { params });
  }

  post<T>(path: string, body?: unknown) {
    return this.request<T>('POST', path, { body });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>('PUT', path, { body });
  }

  delete<T>(path: string) {
    return this.request<T>('DELETE', path);
  }

  upload<T>(path: string, formData: FormData) {
    return this.request<T>('POST', path, { formData });
  }
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export const api = new ApiClient();
