import type { IFLAHFundLevel, LevelBreakdownItem } from '@/types';

export function parseLevels(description: string | null): IFLAHFundLevel[] {
  if (description) {
    try {
      const parsed = JSON.parse(description);
      if (Array.isArray(parsed.levels) && parsed.levels.length > 0) {
        return parsed.levels;
      }
    } catch {
      // not json or legacy description
    }
  }
  return [
    { id: 'rabee', name: "Rabee'", target: 600 },
    { id: 'ramadan', name: 'Ramadan', target: 600 },
  ];
}

export function computeLevelBreakdown(
  levels: IFLAHFundLevel[],
  payments: { amount: number; notes?: string | null }[],
  totalPaid: number
): LevelBreakdownItem[] {
  const levelPaidMap: Record<string, number> = {};
  levels.forEach((l) => (levelPaidMap[l.id] = 0));
  let unassignedPaid = 0;

  for (const p of payments) {
    const notes = p.notes || '';
    const match = notes.match(/\[Level:\s*([^\]]+)\]/i);
    if (match) {
      const matchedStr = match[1].trim().toLowerCase();
      const matchedLevel = levels.find(
        (l) => l.name.toLowerCase() === matchedStr || l.id.toLowerCase() === matchedStr
      );
      if (matchedLevel) {
        levelPaidMap[matchedLevel.id] = (levelPaidMap[matchedLevel.id] || 0) + p.amount;
        continue;
      }
    }
    unassignedPaid += p.amount;
  }

  // Allocate unassigned payments sequentially across levels
  for (const level of levels) {
    const current = levelPaidMap[level.id] || 0;
    const remainingNeeded = Math.max(0, level.target - current);
    if (unassignedPaid > 0 && remainingNeeded > 0) {
      const toAllocate = Math.min(unassignedPaid, remainingNeeded);
      levelPaidMap[level.id] = current + toAllocate;
      unassignedPaid -= toAllocate;
    }
  }

  // Overpayment attributed to the last level
  if (unassignedPaid > 0 && levels.length > 0) {
    const lastLevelId = levels[levels.length - 1].id;
    levelPaidMap[lastLevelId] = (levelPaidMap[lastLevelId] || 0) + unassignedPaid;
  }

  return levels.map((l) => {
    const paid = levelPaidMap[l.id] || 0;
    const isPaid = paid >= l.target;
    return {
      levelId: l.id,
      levelName: l.name,
      target: l.target,
      paid,
      balance: Math.max(0, l.target - paid),
      isPaid,
    };
  });
}
