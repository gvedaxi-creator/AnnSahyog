// Picks a placeholder photo for a donation that has no uploaded image, so
// listing cards don't all show the same picture. Matches the food type first,
// then falls back to a pool keyed by donation id.
const unsplash = (id, w) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const BY_KEYWORD = [
  { match: /packag|packed|box|tiffin|parcel/i, id: "1540189549336-e6e99c3679fe" },
  { match: /cook|curry|dal|sabzi|meal|thali/i, id: "1565557623262-b51c2513a641" },
  { match: /rice|biryani|pulao|khichdi/i, id: "1516684732162-798a0062be99" },
  { match: /bread|roti|chapati|bakery|bun/i, id: "1509440159596-0249088772ff" },
  { match: /fruit/i, id: "1610832958506-aa56368176cf" },
  { match: /veg|produce|raw|grocer/i, id: "1488459716781-31db52582fe9" },
  { match: /salad/i, id: "1512621776951-a57141f2eefd" },
];

const POOL = [
  "1504674900247-0877df9cc836",
  "1546833999-b9f581a1996d",
  "1512621776951-a57141f2eefd",
  "1540189549336-e6e99c3679fe",
  "1565557623262-b51c2513a641",
];

export function getFoodImage(food, width = 900) {
  if (food?.image) return food.image;

  const text = `${food?.food_type || ""} ${food?.category || ""}`;
  const hit = BY_KEYWORD.find((entry) => entry.match.test(text));
  if (hit) return unsplash(hit.id, width);

  const key = String(food?.donation_id ?? text);
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return unsplash(POOL[hash % POOL.length], width);
}
