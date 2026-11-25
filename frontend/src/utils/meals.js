// Rough "meals provided" estimate for a delivered quantity.
// A plate is already one meal; other units use the ~2.5 meals per kg estimate.
export const MEALS_PER_KG = 2.5;

const MEAL_UNITS = ["plates", "plate", "meals", "meal"];

export function estimateMeals(quantity, unit) {
  const qty = Number(quantity || 0);
  const isMealUnit = MEAL_UNITS.includes(String(unit || "").toLowerCase());
  return isMealUnit ? qty : qty * MEALS_PER_KG;
}
