import axios, { type AxiosError } from "axios";

interface ApiErrorBody {
  message?: string;
}

// Same-origin API: the httpOnly session cookie rides along automatically.
export const apiClient = axios.create({ baseURL: "/api", withCredentials: true });

// A 401 anywhere except the login screen means the session expired: go to login.
apiClient.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ApiErrorBody>) => {
    const onLogin = typeof window !== "undefined" && window.location.pathname.startsWith("/login");
    if (error.response?.status === 401 && typeof window !== "undefined" && !onLogin) {
      window.location.assign("/login");
    }
    return Promise.reject(error);
  },
);

export const apiFetch = {
  get: <T>(url: string, params?: object): Promise<T> => apiClient.get<T>(url, { params }).then((r) => r.data),
  post: <T>(url: string, body?: unknown): Promise<T> => apiClient.post<T>(url, body).then((r) => r.data),
  patch: <T>(url: string, body?: unknown): Promise<T> => apiClient.patch<T>(url, body).then((r) => r.data),
  put: <T>(url: string, body?: unknown): Promise<T> => apiClient.put<T>(url, body).then((r) => r.data),
};
