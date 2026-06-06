export function expandTransactionsForMonth(transactions, month) {
  const [year, mon] = month.split('-').map(Number);
  const result = [];

  for (const tx of transactions) {
    const txMonth = tx.date.slice(0, 7);

    if (!tx.isRecurring) {
      if (txMonth === month) result.push(tx);
      continue;
    }

    if (txMonth > month) continue;

    const txDate = new Date(tx.date + 'T12:00:00');
    const interval = tx.recurrenceInterval || 'monthly';

    if (interval === 'monthly') {
      const lastDay = new Date(year, mon, 0).getDate();
      const day = Math.min(txDate.getDate(), lastDay);
      result.push({
        ...tx,
        date: `${month}-${String(day).padStart(2, '0')}`,
        _generated: txMonth !== month
      });
    } else if (interval === 'yearly') {
      if (txDate.getMonth() + 1 === mon) {
        result.push({
          ...tx,
          date: `${year}-${String(mon).padStart(2, '0')}-${String(txDate.getDate()).padStart(2, '0')}`,
          _generated: txDate.getFullYear() !== year
        });
      }
    } else if (interval === 'weekly') {
      const startOfMonth = new Date(year, mon - 1, 1);
      const endOfMonth = new Date(year, mon, 0);
      let cur = new Date(txDate);
      while (cur < startOfMonth) cur = new Date(cur.getTime() + 7 * 86400000);
      let idx = 0;
      while (cur <= endOfMonth) {
        const d = cur;
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        result.push({ ...tx, _id: `${tx._id}_w${idx}`, date: dateStr, _generated: true });
        cur = new Date(cur.getTime() + 7 * 86400000);
        idx++;
      }
    }
  }

  return result.sort((a, b) => b.date.localeCompare(a.date));
}

export function getMonthsInRange(fromYM, toYM) {
  const months = [];
  let [y, m] = fromYM.split('-').map(Number);
  const [ey, em] = toYM.split('-').map(Number);
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return months;
}
