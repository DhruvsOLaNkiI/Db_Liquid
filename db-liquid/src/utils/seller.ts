const SELLER_ID_KEY = 'db-liquid-seller-id';
const SELLER_NAME_KEY = 'db-liquid-seller-name';
const SELLER_PHONE_KEY = 'db-liquid-seller-phone';

export function getOrCreateSellerId() {
  let id = sessionStorage.getItem(SELLER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SELLER_ID_KEY, id);
  }
  return id;
}

/** Prefer logged-in seller account id so listings stay linked after login. */
export function resolveSellerId(authUserId?: string | null) {
  if (authUserId) return authUserId;
  return getOrCreateSellerId();
}

export function setSellerName(name: string) {
  if (name.trim()) sessionStorage.setItem(SELLER_NAME_KEY, name.trim());
}

export function getSellerName() {
  return sessionStorage.getItem(SELLER_NAME_KEY) ?? 'Property Owner';
}

export function setSellerPhone(phone: string) {
  if (phone.trim()) sessionStorage.setItem(SELLER_PHONE_KEY, phone.trim());
}

export function getSellerPhone() {
  return sessionStorage.getItem(SELLER_PHONE_KEY) ?? '';
}
