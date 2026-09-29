import { describe, it, expect } from "vitest";
import { simplifyDebts } from "../lib/debtSimplification.js";
function totalTransacted(transactions) {
  return transactions.reduce((sum, t) => sum + t.amount, 0);
}

describe("simplifyDebts", () => {
  it("returns nothing when everyone is already settled", () => {
    const result = simplifyDebts({ A: 0, B: 0, C: 0 });
    expect(result).toEqual([]);
  });

  it("handles the simple two-person case with one transaction", () => {
    const result = simplifyDebts({ A: 50, B: -50 });
    expect(result).toEqual([{ from: "B", to: "A", amount: 50 }]);
  });

  it("fully cancels a perfect 3-person cycle (net balances all zero)", () => {
    // A owes B 10, B owes C 10, C owes A 10 -> in net terms everyone is
    // already even. This is the classic case pairwise ledgers get wrong:
    // a naive per-pair view still shows 3 separate debts, but nobody
    // actually owes anything once you look at net position.
    const result = simplifyDebts({ A: 0, B: 0, C: 0 });
    expect(result.length).toBe(0);
  });

  it("collapses a 3-person chain into fewer transactions than the raw pairwise debts", () => {
    // Raw pairwise debts (what a naive per-pair ledger would show):
    //   A owes B $10, B owes C $10, A owes C $10  -> 3 transactions
    // Net position: A owes $20 total, B nets to $0, C is owed $20 total.
    // Minimum settlement: exactly 1 transaction, not 3.
    const netBalances = { A: -20, B: 0, C: 20 };
    const result = simplifyDebts(netBalances);
    expect(result.length).toBe(1);
    expect(result[0]).toEqual({ from: "A", to: "C", amount: 20 });
  });

  it("never invents or loses money — total transacted equals total owed", () => {
    const netBalances = { A: -30, B: -20, C: 25, D: 25 };
    const result = simplifyDebts(netBalances);
    const totalOwed = Object.values(netBalances)
      .filter((n) => n < 0)
      .reduce((sum, n) => sum + -n, 0);
    expect(totalTransacted(result)).toBeCloseTo(totalOwed);
  });

  it("produces at most n-1 transactions for n participants with non-zero balance", () => {
    const netBalances = { A: -40, B: -10, C: 20, D: 30 };
    const result = simplifyDebts(netBalances);
    const nonZeroParticipants = Object.values(netBalances).filter(
      (n) => Math.abs(n) > 0.01,
    ).length;
    expect(result.length).toBeLessThanOrEqual(nonZeroParticipants - 1);
  });

  it("ignores balances within the rounding epsilon", () => {
    const result = simplifyDebts({ A: 0.005, B: -0.005 });
    expect(result).toEqual([]);
  });
});
