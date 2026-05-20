import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type { Transporter } from "nodemailer";
import {
  APP_BRAND_NAME,
  getEmailConfig,
  type ResolvedEmailConfig,
} from "../config/email.config";
import { BadRequestException } from "../utils/appError";

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

type SendEmailResult = {
  delivered: boolean;
  previewUrl?: string;
};

let transporter: Transporter | null = null;
let transporterConfigKey: string | null = null;

const buildConfigKey = (cfg: ResolvedEmailConfig): string =>
  [cfg.host, cfg.port, cfg.secure, cfg.user, cfg.pass.length].join("|");

const buildTransportOptions = (
  cfg: ResolvedEmailConfig
): SMTPTransport.Options => ({
  host: cfg.host,
  port: cfg.port,
  secure: cfg.secure,
  auth: {
    user: cfg.user,
    pass: cfg.pass,
  },
  ...(cfg.requireTLS
    ? {
        requireTLS: true,
        tls: { minVersion: "TLSv1.2" as const },
      }
    : {}),
});

const getTransporter = (): Transporter | null => {
  const cfg = getEmailConfig();
  if (!cfg.isConfigured) {
    return null;
  }

  const configKey = buildConfigKey(cfg);
  if (transporter && transporterConfigKey === configKey) {
    return transporter;
  }

  transporter = nodemailer.createTransport(buildTransportOptions(cfg));
  transporterConfigKey = configKey;
  return transporter;
};

const isSmtpAuthError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; responseCode?: number };
  return err.code === "EAUTH" || err.responseCode === 535;
};

const toDeliveryErrorMessage = (
  error: unknown,
  cfg: ResolvedEmailConfig
): string => {
  if (isSmtpAuthError(error)) {
    if (cfg.isGmail) {
      return (
        "Email could not be sent: Gmail rejected the SMTP login. Use a Google App Password " +
        "(Google Account → Security → 2-Step Verification → App passwords), not your normal " +
        "Gmail password. Put the 16-character password in SMTP_PASS with no spaces."
      );
    }
    return (
      "Email could not be sent: SMTP username or password was rejected. " +
      "Check SMTP_USER and SMTP_PASS in your environment configuration."
    );
  }

  const message =
    error instanceof Error ? error.message : "Unknown mail transport error";
  return `Email could not be sent: ${message}`;
};

export const sendEmail = async ({
  to,
  subject,
  text,
  html,
}: SendEmailInput): Promise<SendEmailResult> => {
  const cfg = getEmailConfig();
  const mailer = getTransporter();

  if (!mailer) {
    console.info(`[email:${APP_BRAND_NAME}] dev fallback (SMTP not configured)`, {
      to,
      subject,
      text,
    });
    return { delivered: false };
  }

  try {
    await mailer.verify();
  } catch (error) {
    transporter = null;
    transporterConfigKey = null;
    throw new BadRequestException(toDeliveryErrorMessage(error, cfg));
  }

  try {
    const info = await mailer.sendMail({
      from: cfg.from,
      to,
      subject,
      text,
      html: html ?? text.replace(/\n/g, "<br/>"),
    });

    const previewUrlRaw =
      typeof nodemailer.getTestMessageUrl === "function"
        ? nodemailer.getTestMessageUrl(info)
        : false;
    const previewUrl =
      typeof previewUrlRaw === "string" ? previewUrlRaw : undefined;

    if (previewUrl) {
      console.info("[email] Preview URL:", previewUrl);
    }

    return { delivered: true, previewUrl };
  } catch (error) {
    if (isSmtpAuthError(error)) {
      transporter = null;
      transporterConfigKey = null;
    }
    throw new BadRequestException(toDeliveryErrorMessage(error, cfg));
  }
};
