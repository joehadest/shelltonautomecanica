import type { ConfiguracaoEmpresa } from "./types";

export const DEFAULT_LOGO_PATH = "/shellton-logo.png";

let cachedDefaultLogo: string | null | undefined;

/** Logo do admin ou, em fallback, o arquivo público do site. */
export async function resolveLogoForPdf(
  empresa: ConfiguracaoEmpresa
): Promise<string | null> {
  if (empresa.logo_base64) return empresa.logo_base64;

  if (cachedDefaultLogo !== undefined) return cachedDefaultLogo;

  if (typeof window === "undefined") {
    cachedDefaultLogo = null;
    return null;
  }

  try {
    const res = await fetch(DEFAULT_LOGO_PATH);
    if (!res.ok) {
      cachedDefaultLogo = null;
      return null;
    }
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    cachedDefaultLogo = dataUrl;
    return dataUrl;
  } catch {
    cachedDefaultLogo = null;
    return null;
  }
}
