import { useCallback, useEffect, useState } from "react";

export type Customer = {
  id: string;
  name: string;
  phone: string;
  company: string;
  balance: number;
};
export type Receipt = {
  id: string;
  customer: string;
  amount: number;
  type: "قبض" | "صرف";
  date: string;
  note: string;
};
export type Expense = {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  note: string;
};

const KEYS = {
  customers: "gadeer-customers",
  receipts: "gadeer-receipts",
  expenses: "gadeer-expenses",
} as const;

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]") as T[];
  } catch {
    return [];
  }
}

export function useLocalCollection<T>(key: keyof typeof KEYS) {
  const [items, setItems] = useState<T[]>([]);
  useEffect(() => setItems(read<T>(KEYS[key])), [key]);
  const save = useCallback(
    (next: T[]) => {
      setItems(next);
      localStorage.setItem(KEYS[key], JSON.stringify(next));
    },
    [key],
  );
  const add = useCallback(
    (item: Omit<T, "id">) => save([{ ...item, id: crypto.randomUUID() } as T, ...items]),
    [items, save],
  );
  const remove = useCallback(
    (id: string) => save(items.filter((item) => (item as { id: string }).id !== id)),
    [items, save],
  );
  return { items, add, remove };
}

export const money = (value: number) => new Intl.NumberFormat("ar-IQ").format(value) + " د.ع";
