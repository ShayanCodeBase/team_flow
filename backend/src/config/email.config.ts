import { getEnv } from "../utils/get-env";

export const APP_BRAND_NAME = "Team Flow";

export const normalizeSmtpPassword = (raw: string): string =>
  raw.trim().replace(/[\s_-]+/g, "");

const extractEmailAddress = (value: string): string => {
  const trimmed = value.trim();
  const bracketMatch = trimmed.match(/<([^>]+)>/);
  return (bracketMatch ? bracketMatch[1] : trimmed).trim();
};

export type ResolvedEmailConfig = {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  user: string;
  pass: string;
  from: string;
  isConfigured: boolean;
  isGmail: boolean;
};

export const getEmailConfig = (): ResolvedEmailConfig => {
  const host = getEnv("SMTP_HOST", "").trim();
  const user = getEnv("SMTP_USER", "").trim();
  const pass = normalizeSmtpPassword(getEnv("SMTP_PASS", ""));
  const port = Number(getEnv("SMTP_PORT", "587"));
  const secureFlag = getEnv("SMTP_SECURE", "").trim().toLowerCase();

  const isGmail = host.includes("gmail.com");
  const secure =
    secureFlag === "true" || (secureFlag !== "false" && port === 465);
  const requireTLS = port === 587 && !secure;

  let from = getEnv("EMAIL_FROM", `${APP_BRAND_NAME} <${user}>`).trim();

  if (user) {
    const fromEmail = extractEmailAddress(from).toLowerCase();
    const userEmail = user.toLowerCase();

    if (isGmail && fromEmail !== userEmail) {
      const displayMatch = from.match(/^([^<]+)</);
      const displayName = displayMatch?.[1]?.trim() || APP_BRAND_NAME;
      from = `${displayName} <${user}>`;
    }
  }

  return {
    host,
    port,
    secure,
    requireTLS,
    user,
    pass,
    from,
    isConfigured: Boolean(host && user && pass),
    isGmail,
  };
};
