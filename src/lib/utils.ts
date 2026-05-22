import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

/** Snake draft pick order for n teams and r rounds */
export function buildSnakeOrder(teamIds: string[], rounds: number): string[][] {
  const order: string[][] = [];
  for (let r = 0; r < rounds; r++) {
    order.push(r % 2 === 0 ? [...teamIds] : [...teamIds].reverse());
  }
  return order;
}

/** Get the teamId whose turn it is given current round and pick index */
export function getCurrentPicker(
  draftOrder: string[],
  round: number,
  pickIndex: number
): string {
  const roundOrder = round % 2 === 1 ? draftOrder : [...draftOrder].reverse();
  return roundOrder[pickIndex % roundOrder.length];
}
