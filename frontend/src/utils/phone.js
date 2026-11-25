// Shows Indian mobile numbers in one format: +91 XXXXX XXXXX
export const formatPhone = (raw) => {
  if (!raw) return "";
  const digits = String(raw).replace(/\D/g, "");
  const last10 = digits.slice(-10);
  if (last10.length !== 10) return String(raw);
  return `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
};
