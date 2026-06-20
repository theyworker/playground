import type { DrinkEntry, NewDrinkInput } from "./types";

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    return body.error || `Request failed (${res.status})`;
  } catch {
    return `Request failed (${res.status})`;
  }
}

export async function listEntries(): Promise<DrinkEntry[]> {
  const res = await fetch("/api/alcohol", { cache: "no-store" });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { entries: DrinkEntry[] };
  return body.entries;
}

export async function createEntry(input: NewDrinkInput): Promise<DrinkEntry> {
  const res = await fetch("/api/alcohol", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { entry: DrinkEntry };
  return body.entry;
}

export async function deleteEntry(id: string): Promise<void> {
  const res = await fetch(`/api/alcohol/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await readError(res));
}
