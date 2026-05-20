export interface PasswordStrengthResult {
  isStrong: boolean;
  score: number;
  errors: string[];
  suggestions: string[];
}

export function validatePasswordStrength(
  password: string,
): PasswordStrengthResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  if (password.length >= 12) score++;
  else errors.push("Mínimo 12 caracteres");

  if (/[A-Z]/.test(password)) score++;
  else errors.push("Deve incluir letra MAIÚSCULA");

  if (/[a-z]/.test(password)) score++;
  else errors.push("Deve incluir letra minúscula");

  if (/[0-9]/.test(password)) score++;
  else errors.push("Deve incluir número");

  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;
  else errors.push("Deve incluir caractere especial: !@#$%^&*");

  if (
    /^123|qwerty|password|admin|user|1234|0000/.test(password.toLowerCase())
  ) {
    errors.push("Contém padrão óbvio ou comum");
    score = Math.max(0, score - 1);
  }

  if (/(.)\1{3,}/.test(password)) {
    errors.push("Não repetir caracteres mais de 3 vezes");
    score = Math.max(0, score - 1);
  }

  if (
    /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/.test(
      password.toLowerCase(),
    )
  ) {
    errors.push("Não use sequências de letras");
    score = Math.max(0, score - 1);
  }

  if (password.length < 16) suggestions.push("16+ caracteres é mais seguro");
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    suggestions.push("Adicione 2+ caracteres especiais para maior segurança");
  }

  return {
    isStrong: errors.length === 0 && score >= 4,
    score: Math.min(4, score),
    errors,
    suggestions,
  };
}

export function sanitizeInput(input: string, maxLength: number = 500): string {
  if (!input) return "";

  return input
    .trim()
    .replace(/[<>\"'`{}]/g, "")
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/\s+/g, " ")
    .substring(0, maxLength);
}

export function validateEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!pattern.test(email)) return false;
  if (email.length > 254) return false;

  const [local, domain] = email.split("@");

  if (local.length > 64) return false;
  if (local.startsWith(".") || local.endsWith(".")) return false;
  if (local.includes("..")) return false;

  if (domain.startsWith(".") || domain.endsWith(".")) return false;

  return true;
}

export function sanitizeFilename(originalName: string): string {
  if (!originalName) return "file";

  const baseName = originalName.split(/[\/\\]/).pop() || "file";

  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 50);

  const ext = sanitized.match(/\.([^.]+)$/)?.[1] || "bin";
  const allowedExts = ["jpg", "jpeg", "png", "gif", "webp", "pdf", "heic"];

  if (!allowedExts.includes(ext.toLowerCase())) {
    return "file.bin";
  }

  return sanitized;
}

interface FileMagicNumbers {
  [key: string]: {
    mime: string;
    bytes: number[][];
  };
}

const FILE_SIGNATURES: FileMagicNumbers = {
  jpeg: {
    mime: "image/jpeg",
    bytes: [[0xff, 0xd8, 0xff]],
  },
  png: {
    mime: "image/png",
    bytes: [[0x89, 0x50, 0x4e, 0x47]],
  },
  gif: {
    mime: "image/gif",
    bytes: [[0x47, 0x49, 0x46, 0x38]],
  },
  pdf: {
    mime: "application/pdf",
    bytes: [[0x25, 0x50, 0x44, 0x46]],
  },
  webp: {
    mime: "image/webp",
    bytes: [[0x52, 0x49, 0x46, 0x46]],
  },
  heic: {
    mime: "image/heic",
    bytes: [
      [0x66, 0x74, 0x79, 0x70, 0x68, 0x65, 0x69, 0x63],
      [0x66, 0x74, 0x79, 0x70, 0x6d, 0x69, 0x66, 0x31],
    ],
  },
};

export function validateFileContent(buffer: ArrayBuffer): boolean {
  const view = new Uint8Array(buffer);

  for (const [type, sig] of Object.entries(FILE_SIGNATURES)) {
    for (const bytes of sig.bytes) {
      let matches = true;
      for (let i = 0; i < bytes.length; i++) {
        if (view[i] !== bytes[i]) {
          matches = false;
          break;
        }
      }

      if (matches) {
        if (type === "webp") {
          const str = String.fromCharCode(...view.slice(8, 12));
          if (str !== "WEBP") continue;
        }

        return true;
      }
    }
  }

  return false;
}

export function validateFileSize(
  size: number,
  maxSize: number = 5 * 1024 * 1024,
): boolean {
  if (size > maxSize) return false;

  return true;
}

import { z } from "zod";

export const TransactionSchema = z.object({
  amount: z
    .number()
    .positive("Valor deve ser positivo")
    .max(999999.99, "Valor máximo é R$ 999.999,99")
    .finite("Valor deve ser um número válido"),

  description: z
    .string()
    .min(1, "Descrição é obrigatória")
    .max(500, "Descrição muito longa"),

  category: z
    .string()
    .min(1, "Categoria é obrigatória")
    .max(100, "Categoria muito longa")
    .trim(),

  date: z.coerce
    .date()
    .refine((date) => {
      const amanaPlus24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
      return date <= amanaPlus24h;
    }, "Data não pode ser no futuro")
    .refine((date) => {
      const tenYearsAgo = new Date();
      tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
      return date >= tenYearsAgo;
    }, "Data muito antiga"),

  type: z.enum(["income", "expense"], {
    errorMap: () => ({ message: "Tipo deve ser 'income' ou 'expense'" }),
  }),

  receiptUrl: z.string().url("URL de recibo inválida").optional(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export function validateTransaction(data: unknown) {
  const result = TransactionSchema.safeParse(data);

  if (!result.success) {
    const issues = result.error.issues || result.error.errors || [];

    return {
      success: false,
      errors:
        issues.length > 0
          ? issues.map((e) => ({
              field: e.path.join("."),
              message: e.message,
            }))
          : [{ field: "unknown", message: "Erro de validação estrutural" }],
    };
  }

  return {
    success: true,
    data: result.data,
  };
}
export const EmailSchema = z
  .string()
  .email("Email inválido")
  .max(254, "Email muito longo")
  .refine(validateEmail, "Email inválido");

export const PasswordSchema = z
  .string()
  .min(12, "Mínimo 12 caracteres")
  .refine(
    (pwd) => {
      const result = validatePasswordStrength(pwd);
      return result.isStrong;
    },
    (pwd) => {
      const result = validatePasswordStrength(pwd);
      return {
        message: result.errors.join(", "),
      };
    },
  );

export const SignupSchema = z
  .object({
    name: z
      .string()
      .min(2, "Nome deve ter pelo menos 2 caracteres")
      .max(100, "Nome muito longo")
      .trim(),

    email: EmailSchema,

    password: PasswordSchema,

    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não conferem",
    path: ["confirmPassword"],
  });

export type Signup = z.infer<typeof SignupSchema>;

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Keychain from "react-native-keychain";

export interface SecureStorage {
  setAuthToken(token: string): Promise<void>;
  getAuthToken(): Promise<string | null>;
  deleteAuthToken(): Promise<void>;

  setUserPreferences(key: string, value: string): Promise<void>;
  getUserPreferences(key: string): Promise<string | null>;
  deleteUserPreferences(key: string): Promise<void>;
}

export const secureStorage: SecureStorage = {
  async setAuthToken(token: string): Promise<void> {
    try {
      await Keychain.setGenericPassword("auth", token, {
        service: "com.techchallenge.auth",
        storage: Keychain.STORAGE_TYPE.keychainServices,
        accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.error("Erro ao salvar token:", error);
      throw new Error("Falha ao salvar token");
    }
  },

  async getAuthToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: "com.techchallenge.auth",
      });
      return credentials ? credentials.password : null;
    } catch (error) {
      console.error("Erro ao recuperar token:", error);
      return null;
    }
  },

  async deleteAuthToken(): Promise<void> {
    try {
      await Keychain.resetGenericPassword({
        service: "com.techchallenge.auth",
      });
    } catch (error) {
      console.error("Erro ao deletar token:", error);
    }
  },

  async setUserPreferences(key: string, value: string): Promise<void> {
    try {
      await AsyncStorage.setItem(`@pref_${key}`, value);
    } catch (error) {
      console.error("Erro ao salvar preferência:", error);
    }
  },

  async getUserPreferences(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(`@pref_${key}`);
    } catch (error) {
      console.error("Erro ao recuperar preferência:", error);
      return null;
    }
  },

  async deleteUserPreferences(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(`@pref_${key}`);
    } catch (error) {
      console.error("Erro ao deletar preferência:", error);
    }
  },
};

export async function secureLogout(): Promise<void> {
  try {
    await secureStorage.deleteAuthToken();

    const allKeys = await AsyncStorage.getAllKeys();
    const keysToDelete = allKeys.filter(
      (key) =>
        key.startsWith("@app_") ||
        key.startsWith("@cache_") ||
        key.startsWith("@user_"),
    );
    await AsyncStorage.multiRemove(keysToDelete);

    console.log("Logout seguro concluído");
  } catch (error) {
    console.error("Erro no logout seguro:", error);
    throw error;
  }
}

export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private limit: number;
  private windowMs: number;

  constructor(limit: number = 10, windowMs: number = 60000) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.attempts.get(key) || [];

    const validTimestamps = timestamps.filter((ts) => now - ts < this.windowMs);

    if (validTimestamps.length < this.limit) {
      validTimestamps.push(now);
      this.attempts.set(key, validTimestamps);
      return true;
    }

    return false;
  }

  getRetryAfter(key: string): number {
    const timestamps = this.attempts.get(key) || [];
    if (timestamps.length === 0) return 0;

    const oldest = Math.min(...timestamps);
    const retryAfter = oldest + this.windowMs - Date.now();
    return Math.max(0, retryAfter);
  }

  reset(key?: string): void {
    if (key) {
      this.attempts.delete(key);
    } else {
      this.attempts.clear();
    }
  }
}

export const loginLimiter = new RateLimiter(5, 60000);

export function verifyTransactionOwnership(
  transaction: any,
  currentUserId: string,
): boolean {
  if (!transaction || !currentUserId) return false;
  return transaction.userId === currentUserId;
}

export function verifyFileOwnership(filePath: string, userId: string): boolean {
  const [owner] = filePath.split("/");
  return owner === userId;
}

export interface SecurityEvent {
  type:
    | "failed_login"
    | "suspicious_activity"
    | "invalid_file"
    | "rate_limit_exceeded";
  userId?: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export const securityLogger = {
  events: [] as SecurityEvent[],

  log(event: SecurityEvent): void {
    console.warn(`[SECURITY] ${event.type}: ${event.message}`);
    this.events.push(event);
  },

  failedLogin(userId: string, reason: string): void {
    this.log({
      type: "failed_login",
      userId,
      message: `Falha na autenticação: ${reason}`,
      timestamp: new Date(),
    });
  },

  suspiciousActivity(userId: string, description: string): void {
    this.log({
      type: "suspicious_activity",
      userId,
      message: description,
      timestamp: new Date(),
      metadata: { severity: "high" },
    });
  },

  invalidFile(userId: string, filename: string, reason: string): void {
    this.log({
      type: "invalid_file",
      userId,
      message: `Arquivo rejeitado: ${filename} - ${reason}`,
      timestamp: new Date(),
    });
  },

  rateLimitExceeded(key: string): void {
    this.log({
      type: "rate_limit_exceeded",
      message: `Rate limit excedido para: ${key}`,
      timestamp: new Date(),
    });
  },
};
