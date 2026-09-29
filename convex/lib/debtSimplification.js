/**
 * Given net balances per user (positive = owed money overall,
 * negative = owes money overall), returns the minimum-ish set of
 * transactions that settles everyone up.
 *
 * Approach: greedy — repeatedly match the biggest creditor with the
 * biggest debtor. This is NOT provably minimal in the strict sense
 * (finding the true minimum number of transactions is NP-hard for
 * the general case), but it's a well-known, easily explained
 * heuristic that performs very close to optimal in practice, and is
 * exactly what real Splitwise-style apps use.
 */
export function simplifyDebts(netBalances) {
  const EPS = 0.01;
  const creditors = [];
  const debtors = [];

  for (const [userId, amount] of Object.entries(netBalances)) {
    if (amount > EPS) creditors.push({ userId, amount });
    else if (amount < -EPS) debtors.push({ userId, amount: -amount });
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > EPS) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: Math.round(settleAmount * 100) / 100,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount <= EPS) i++;
    if (creditor.amount <= EPS) j++;
  }

  return transactions;
}
