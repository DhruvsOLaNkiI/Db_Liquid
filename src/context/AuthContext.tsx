import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CreditTransaction } from '../types/credits';
import type { User, UserRole } from '../types/user';
import {
  clearSession,
  createUser,
  findUserById,
  getSession,
  setSession,
  topUpCredits as topUpCreditsForUser,
  validateLogin,
} from '../utils/users';
import { getBuyerCredits } from '../utils/buyerCredits';
import { reloadUsersFromServer } from '../utils/sharedStore';
import { setBuyerName, setBuyerPhone } from '../utils/buyer';
import { migrateListingsSellerId } from '../utils/listingsStorage';
import { setSellerName, setSellerPhone } from '../utils/seller';

interface AuthContextValue {
  user: User | null;
  activeRole: UserRole | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => { ok: true } | { ok: false; error: string };
  signup: (input: {
    email: string;
    phone: string;
    name: string;
    password: string;
    role: UserRole;
  }) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  hasRole: (role: UserRole) => boolean;
  buyerCredits: number;
  creditHistory: CreditTransaction[];
  topUpCredits: (
    creditAmount: number,
  ) => Promise<{ ok: true; credits: number; added: number } | { ok: false; error: string }>;
  refreshUser: () => Promise<void>;
  syncCreditWallet: () => void;
  updateUserCredits: (credits: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function syncIdentityForRole(user: User, role: UserRole) {
  if (role === 'seller') {
    const previousSellerId = sessionStorage.getItem('db-liquid-seller-id');
    if (previousSellerId && previousSellerId !== user.id) {
      migrateListingsSellerId(previousSellerId, user.id, user.name, user.phone);
    }
    sessionStorage.setItem('db-liquid-seller-id', user.id);
    setSellerName(user.name);
    setSellerPhone(user.phone);
  }
  if (role === 'buyer') {
    setBuyerName(user.name);
    setBuyerPhone(user.phone);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const session = getSession();
    return session ? findUserById(session.userId) ?? null : null;
  });
  const [activeRole, setActiveRole] = useState<UserRole | null>(() => getSession()?.activeRole ?? null);

  useEffect(() => {
    if (user && activeRole) {
      syncIdentityForRole(user, activeRole);
    }
  }, [user, activeRole]);

  const login = useCallback((email: string, password: string, role: UserRole) => {
    const result = validateLogin(email, password, role);
    if (!result.ok) return result;

    setSession({ userId: result.user.id, activeRole: role });
    setUser(result.user);
    setActiveRole(role);
    syncIdentityForRole(result.user, role);
    return { ok: true as const };
  }, []);

  const signup = useCallback(
    (input: { email: string; phone: string; name: string; password: string; role: UserRole }) => {
      const result = createUser(input);
      if (!result.ok) return result;

      setSession({ userId: result.user.id, activeRole: input.role });
      setUser(result.user);
      setActiveRole(input.role);
      syncIdentityForRole(result.user, input.role);
      return { ok: true as const };
    },
    []
  );

  const refreshUser = useCallback(async () => {
    await reloadUsersFromServer();
    const session = getSession();
    if (session) {
      setUser(findUserById(session.userId) ?? null);
    }
  }, []);

  const syncCreditWallet = useCallback(() => {
    const session = getSession();
    if (!session) return;
    const fresh = findUserById(session.userId);
    if (fresh) setUser(fresh);
  }, []);

  const updateUserCredits = useCallback((credits: number) => {
    setUser((prev) => (prev ? { ...prev, credits } : prev));
  }, []);

  const topUpCredits = useCallback(async (creditAmount: number) => {
    if (!user?.id || !user.roles.includes('buyer')) {
      return { ok: false as const, error: 'Log in as a buyer to top up credits.' };
    }
    const result = await topUpCreditsForUser(user.id, creditAmount);
    if (result.ok) {
      syncCreditWallet();
    }
    return result;
  }, [user, syncCreditWallet]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setActiveRole(null);
    sessionStorage.removeItem('db-liquid-seller-id');
    sessionStorage.removeItem('db-liquid-seller-name');
    sessionStorage.removeItem('db-liquid-seller-phone');
    sessionStorage.removeItem('db-liquid-buyer-name');
    sessionStorage.removeItem('db-liquid-buyer-phone');
  }, []);

  const hasRole = useCallback(
    (role: UserRole) => Boolean(user?.roles.includes(role)),
    [user]
  );

  const buyerCredits = user?.roles.includes('buyer') ? (user.credits ?? 0) : 0;
  const creditHistory = user?.creditHistory ?? [];

  const value = useMemo(
    () => ({
      user,
      activeRole,
      isAuthenticated: Boolean(user),
      login,
      signup,
      logout,
      hasRole,
      buyerCredits,
      creditHistory,
      topUpCredits,
      refreshUser,
      syncCreditWallet,
      updateUserCredits,
    }),
    [
      user,
      activeRole,
      login,
      signup,
      logout,
      hasRole,
      buyerCredits,
      creditHistory,
      topUpCredits,
      refreshUser,
      syncCreditWallet,
      updateUserCredits,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
