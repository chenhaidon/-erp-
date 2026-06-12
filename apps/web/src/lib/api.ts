import axios from "axios";

type SessionAccessor = () => { accessToken: string; factoryId: string; clear: () => void };

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api"
});

let installed = false;
let sessionAccessor: SessionAccessor = () => ({
  accessToken: "",
  factoryId: "",
  clear: () => undefined
});

export function attachInterceptors(getSession: SessionAccessor) {
  sessionAccessor = getSession;

  if (installed) {
    return;
  }

  api.interceptors.request.use((config) => {
    const session = sessionAccessor();

    if (session.accessToken) {
      config.headers.Authorization = `Bearer ${session.accessToken}`;
    }

    if (session.factoryId) {
      config.headers["x-factory-id"] = session.factoryId;
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        sessionAccessor().clear();
      }
      return Promise.reject(error);
    }
  );

  installed = true;
}

export { api };
