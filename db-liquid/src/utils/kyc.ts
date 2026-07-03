export function normalizeAadhar(input: string) {
  return input.replace(/\D/g, '');
}

export function normalizePan(input: string) {
  return input.trim().toUpperCase();
}

export function isValidAadhar(value: string) {
  return /^\d{12}$/.test(normalizeAadhar(value));
}

export function isValidPan(value: string) {
  return /^[A-Z]{5}\d{4}[A-Z]$/.test(normalizePan(value));
}

export function maskAadhar(value: string) {
  const digits = normalizeAadhar(value);
  if (digits.length < 4) return digits;
  return `XXXX XXXX ${digits.slice(-4)}`;
}

export function maskPan(value: string) {
  const pan = normalizePan(value);
  if (pan.length < 10) return pan;
  return `${pan.slice(0, 2)}XXX${pan.slice(5, 9)}${pan.slice(9)}`;
}

export function formatAadharInput(value: string) {
  const digits = normalizeAadhar(value).slice(0, 12);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}
