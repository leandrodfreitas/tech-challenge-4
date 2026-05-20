import { db } from "@/firebase/config";
import { Transaction, TransactionFilter } from "@/types";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocFromCache,
  getDocFromServer,
  getDocsFromCache,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  QueryConstraint,
  startAfter,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

// ─── Helper de conversão ────────────────

function docToTransaction(id: string, data: any): Transaction {
  return {
    id,
    ...data,
    date: data.date?.toDate() || new Date(),
    createdAt: data.createdAt?.toDate() || new Date(),
    updatedAt: data.updatedAt?.toDate() || new Date(),
  } as Transaction;
}

// ─── Repository ─────────────────────────

export const transactionRepository = {
  async add(
    userId: string,
    data: Omit<Transaction, "id" | "createdAt" | "updatedAt">,
  ): Promise<Transaction> {
    console.log("🔍 DEBUG ADD:", {
      userId,
      data,
      dataKeys: Object.keys(data),
    });

    // Escrita sempre vai ao servidor
    const docRef = await addDoc(collection(db, "transactions"), {
      ...data,
      userId,
      date: Timestamp.fromDate(new Date(data.date)),
    });

    return {
      id: docRef.id,
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Transaction;
  },

  async update(
    transactionId: string,
    userId: string,
    updates: Partial<Omit<Transaction, "id" | "userId" | "createdAt">>,
  ): Promise<void> {
    const ref = doc(db, "transactions", transactionId);

    // Validação de ownership: tenta cache primeiro, servidor como fallback
    let snap;
    try {
      snap = await getDocFromCache(ref);
    } catch {
      snap = await getDocFromServer(ref);
    }

    if (!snap.exists()) throw new Error("Transação não encontrada");
    if (snap.data().userId !== userId)
      throw new Error("Sem permissão para editar esta transação");

    // Escrita sempre vai ao servidor
    await updateDoc(ref, {
      ...updates,
      date: updates.date
        ? Timestamp.fromDate(new Date(updates.date))
        : undefined,
    });
  },

  async remove(transactionId: string, userId: string): Promise<void> {
    const ref = doc(db, "transactions", transactionId);

    // Validação de ownership: tenta cache primeiro, servidor como fallback
    let snap;
    try {
      snap = await getDocFromCache(ref);
    } catch {
      snap = await getDocFromServer(ref);
    }

    if (!snap.exists()) throw new Error("Transação não encontrada");
    if (snap.data().userId !== userId)
      throw new Error("Sem permissão para deletar esta transação");

    // Escrita sempre vai ao servidor
    await deleteDoc(ref);
  },

  async findById(transactionId: string): Promise<Transaction | null> {
    const ref = doc(db, "transactions", transactionId);

    // Cache primeiro: reabre detalhes sem loading nem request ao servidor
    try {
      const snap = await getDocFromCache(ref);
      if (snap.exists()) {
        return docToTransaction(snap.id, snap.data());
      }
    } catch {
      // Cache não tem o documento — busca no servidor
    }

    const snap = await getDocFromServer(ref);
    return snap.exists() ? docToTransaction(snap.id, snap.data()) : null;
  },

  async list(
    userId: string,
    filter?: TransactionFilter,
    pageSize: number = 20,
    lastDoc?: any,
    forceRefresh = false,
  ) {
    const constraints: QueryConstraint[] = [where("userId", "==", userId)];

    if (filter?.startDate) {
      constraints.push(
        where("date", ">=", Timestamp.fromDate(new Date(filter.startDate))),
      );
    }
    if (filter?.endDate) {
      constraints.push(
        where("date", "<=", Timestamp.fromDate(new Date(filter.endDate))),
      );
    }
    if (filter?.type) {
      constraints.push(where("type", "==", filter.type));
    }
    if (filter?.categories && filter.categories.length > 0) {
      constraints.push(where("category", "in", filter.categories));
    }

    const sortField = filter?.sortBy === "amount" ? "amount" : "date";
    const sortOrder = filter?.sortOrder === "asc" ? "asc" : "desc";
    constraints.push(orderBy(sortField, sortOrder));
    constraints.push(limit(pageSize + 1));
    if (lastDoc) constraints.push(startAfter(lastDoc));

    const q = query(collection(db, "transactions"), ...constraints);

    let snapshot;

    if (forceRefresh) {
      // Pull-to-refresh: ignora cache e busca dados atualizados no servidor
      snapshot = await getDocsFromServer(q);
    } else {
      // Navegação normal: cache primeiro (instantâneo, sem internet)
      try {
        snapshot = await getDocsFromCache(q);

        // Cache vazio → busca no servidor
        if (snapshot.empty) {
          snapshot = await getDocsFromServer(q);
        }
      } catch {
        snapshot = await getDocsFromServer(q);
      }
    }

    const transactions = snapshot.docs.map((d) =>
      docToTransaction(d.id, d.data()),
    );

    const hasMore = transactions.length > pageSize;
    if (hasMore) transactions.pop();

    return {
      transactions,
      nextDoc: hasMore ? snapshot.docs[snapshot.docs.length - 2] : null,
      hasMore,
    };
  },
};
