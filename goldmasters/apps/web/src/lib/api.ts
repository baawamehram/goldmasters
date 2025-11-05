const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const ensureLeadingSlash = (value: string) => (value.startsWith("/") ? value : `/${value}`);

export const getApiBaseUrl = (): string => {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!raw) {
    return "/api/v1";
  }

  const normalized = trimTrailingSlash(raw);
  return normalized.endsWith("/api/v1") ? normalized : `${normalized}/api/v1`;
};

export const buildApiUrl = (path: string): string => {
  const base = getApiBaseUrl();
  return `${base}${ensureLeadingSlash(path)}`;
};
