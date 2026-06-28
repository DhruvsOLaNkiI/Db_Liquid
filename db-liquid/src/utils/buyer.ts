const BUYER_NAME_KEY = 'db-liquid-buyer-name';
const BUYER_PHONE_KEY = 'db-liquid-buyer-phone';

export function setBuyerName(name: string) {
  if (name.trim()) sessionStorage.setItem(BUYER_NAME_KEY, name.trim());
}

export function getBuyerName() {
  return sessionStorage.getItem(BUYER_NAME_KEY) ?? '';
}

export function setBuyerPhone(phone: string) {
  if (phone.trim()) sessionStorage.setItem(BUYER_PHONE_KEY, phone.trim());
}

export function getBuyerPhone() {
  return sessionStorage.getItem(BUYER_PHONE_KEY) ?? '';
}

export function isBuyerIdentity(name: string, phone: string) {
  return getBuyerName() === name && getBuyerPhone() === phone;
}
