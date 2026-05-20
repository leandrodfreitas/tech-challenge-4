import { storageRepository } from "@/repositories/storageRepository";
import { transactionRepository } from "@/repositories/transactionRepository";
import { Transaction, TransactionFilter } from "@/types";
import {
  RateLimiter,
  sanitizeFilename,
  sanitizeInput,
  securityLogger,
  validateFileSize,
  validateTransaction,
} from "@/utils/securityUtils";

const transactionLimiter = new RateLimiter(100, 60000);
const uploadLimiter = new RateLimiter(20, 60000);

export const transactionUseCases = {
  async add(
    userId: string,
    data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<Transaction> {
    if (!userId) throw new Error("Usuário não autenticado");

    if (!transactionLimiter.isAllowed(`tx_add_${userId}`)) {
      securityLogger.suspiciousActivity(
        userId,
        "Excesso de tentativas de criar transação",
      );
      throw new Error("Muitas requisições. Tente novamente em alguns segundos");
    }

    const sanitizedData = {
      ...data,
      description: sanitizeInput(data.description, 500),
      category: sanitizeInput(data.category, 100),
    };

    const validation = validateTransaction(sanitizedData);

    if (!validation.success) {
      const errorMsg = validation.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join("; ");
      securityLogger.suspiciousActivity(
        userId,
        `Validação falhou: ${errorMsg}`,
      );
      throw new Error(`Validação falhou: ${errorMsg}`);
    }

    return transactionRepository.add(userId, validation.data);
  },

  async update(
    transactionId: string,
    userId: string,
    updates: Partial<Omit<Transaction, "id" | "userId" | "createdAt">>,
  ): Promise<void> {
    if (!userId) throw new Error("Usuário não autenticado");

    if (!transactionLimiter.isAllowed(`tx_update_${userId}`)) {
      securityLogger.suspiciousActivity(
        userId,
        "Excesso de tentativas de atualizar transação",
      );
      throw new Error("Muitas requisições. Tente novamente em alguns segundos");
    }

    const sanitized = {
      ...updates,
      description:
        updates.description !== undefined
          ? sanitizeInput(updates.description, 500)
          : undefined,
      category:
        updates.category !== undefined
          ? sanitizeInput(updates.category, 100)
          : undefined,
    };

    if (sanitized.amount !== undefined) {
      if (sanitized.amount <= 0) {
        throw new Error("O valor deve ser maior que zero");
      }
      if (sanitized.amount > 999999.99) {
        throw new Error("Valor máximo é R$ 999.999,99");
      }
    }

    return transactionRepository.update(transactionId, userId, sanitized);
  },

  async remove(transactionId: string, userId: string): Promise<void> {
    if (!userId) throw new Error("Usuário não autenticado");

    if (!transactionLimiter.isAllowed(`tx_delete_${userId}`)) {
      securityLogger.suspiciousActivity(
        userId,
        "Excesso de tentativas de deletar transação",
      );
      throw new Error("Muitas requisições. Tente novamente em alguns segundos");
    }

    return transactionRepository.remove(transactionId, userId);
  },

  async getById(transactionId: string): Promise<Transaction | null> {
    return transactionRepository.findById(transactionId);
  },

  async list(
    userId: string,
    filter?: TransactionFilter,
    pageSize?: number,
    lastDoc?: any,
  ) {
    if (!userId) throw new Error("Usuário não autenticado");
    return transactionRepository.list(userId, filter, pageSize, lastDoc);
  },

  async uploadReceipt(
    userId: string,
    file: { uri: string; name: string; type: string },
  ): Promise<string> {
    if (!userId) throw new Error("Usuário não autenticado");

    if (!uploadLimiter.isAllowed(`upload_${userId}`)) {
      securityLogger.suspiciousActivity(
        userId,
        "Excesso de tentativas de upload",
      );
      throw new Error("Muitos uploads. Tente novamente em alguns segundos");
    }

    if (!validateFileSize(file.uri.length, 5 * 1024 * 1024)) {
      securityLogger.invalidFile(userId, file.name, "Arquivo muito grande");
      throw new Error("Arquivo excede 5MB");
    }

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "image/heic",
    ];

    if (!allowedTypes.includes(file.type)) {
      securityLogger.invalidFile(userId, file.name, "Tipo MIME inválido");
      throw new Error("Tipo de arquivo não permitido");
    }

    const sanitizedName = sanitizeFilename(file.name);

    const { downloadUrl } = await storageRepository.upload(userId, {
      ...file,
      name: sanitizedName,
    });

    return downloadUrl;
  },

  async deleteReceipt(filePath: string): Promise<void> {
    return storageRepository.remove(filePath);
  },
};
