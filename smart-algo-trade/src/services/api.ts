/**
 * API client with automatic error handling
 */

interface FetchOptions extends RequestInit {
  timeout?: number;
}

interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error?: string;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://127.0.0.1:8001') {
    this.baseUrl = baseUrl;
  }

  private async fetchWithTimeout(
    url: string,
    options: FetchOptions = {}
  ): Promise<Response> {
    const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get<T>(path: string, options?: FetchOptions): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
        method: 'GET',
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async post<T>(
    path: string,
    data?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async put<T>(
    path: string,
    data?: any,
    options?: FetchOptions
  ): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async delete<T>(path: string, options?: FetchOptions): Promise<ApiResponse<T>> {
    try {
      const response = await this.fetchWithTimeout(`${this.baseUrl}${path}`, {
        method: 'DELETE',
        ...options,
      });

      return this.handleResponse<T>(response);
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    try {
      const data = await response.json();

      if (!response.ok) {
        return {
          status: 'error',
          error: data.message || data.detail || `HTTP ${response.status}`,
          message: data.message || 'Request failed',
        };
      }

      return {
        status: 'success',
        data: data.data || data,
        message: data.message || 'Success',
      };
    } catch (error) {
      return {
        status: 'error',
        error: 'Failed to parse response',
        message: 'Server response was invalid',
      };
    }
  }

  private handleError<T>(error: any): ApiResponse<T> {
    if (error.name === 'AbortError') {
      return {
        status: 'error',
        error: 'Request timeout',
        message: 'Request took too long to complete',
      };
    }

    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      return {
        status: 'error',
        error: 'Network error',
        message: 'Unable to connect to server',
      };
    }

    return {
      status: 'error',
      error: error.message || 'Unknown error',
      message: error.message || 'An unexpected error occurred',
    };
  }
}

export const apiClient = new ApiClient();
