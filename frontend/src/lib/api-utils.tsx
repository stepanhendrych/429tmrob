import { ApiError } from "./types";

export async function safeApiCall<T>(
  fn: () => Promise<T>,
  onError?: (error: ApiError) => void,
): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError) {
      onError?.(err);
    } else {
      const message = err instanceof Error ? err.message : "Neočekávaná chyba";
      onError?.(new ApiError(message, 0));
    }
    return null;
  }
}

export function getErrorAction(status: number, path: string) {
  if (status === 401) {
    return {
      label: "Přejít na přihlášení",
      onClick: () => {
        window.location.href = `/login/${path}`;
      },
    };
  }
  if (status === 404) {
    return {
      label: "Zpět na přehled",
      onClick: () => {
        window.location.href = "/";
      },
    };
  }
  if (status >= 500) {
    return {
      label: "Zkusit znovu",
      onClick: () => {
        window.location.reload();
      },
    };
  }
  if (status === 429) {
    return {
      label: "Počkat a obnovit",
      onClick: () => {
        setTimeout(() => window.location.reload(), 3000);
      },
    };
  }
  return {
    label: "Obnovit stránku",
    onClick: () => window.location.reload(),
  };
}
