import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CreditTransaction } from '../types/credits';
import type { User } from '../types/user';
import {
  clearAuthUserId,
  clearLegacyLocalStorageSession,
  ensureDualRole,
  findUserById,
  setAuthUserId,
  topUpCredits as topUpCreditsForUser,
  updateUserProfile,
  changeUserPassword,
} from '../utils/users';
import { loginViaApi, notifyDataRefresh, reloadListingsFromServer, reloadUsersFromServer, registerViaApi, fetchAuthMe, logoutViaApi } from '../utils/sharedStore';
import { setBuyerName, setBuyerPhone } from '../utils/buyer';
import { migrateListingsSellerId, syncUserProfileOnListings } from '../utils/listingsStorage';
import { setSellerName, setSellerPhone } from '../utils/seller';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  sessionReady: boolean;
  login: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  signup: (input: {
    email: string;
    phone: string;
    name: string;
    password: string;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  logout: () => void;
  hasRole: (role: 'buyer' | 'seller') => boolean;
  isAdmin: boolean;
  buyerCredits: number;
  creditHistory: CreditTransaction[];
  topUpCredits: (
    creditAmount: number,
  ) => Promise<{ ok: true; credits: number; added: number } | { ok: false; error: string }>;
  refreshUser: () => Promise<void>;
  syncCreditWallet: () => void;
  updateUserCredits: (credits: number) => void;
  updateProfile: (patch: {
    email?: string;
    phone?: string;
    name?: string;
    profileImageUrl?: string | null;
    aadharNumber?: string | null;
    aadharVerified?: boolean;
    panNumber?: string | null;
    panVerified?: boolean;
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  changePassword: (
    currentPassword: string,
    newPassword: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function syncIdentityForUser(user: User) {
  const previousSellerId = sessionStorage.getItem('db-liquid-seller-id');
  if (previousSellerId && previousSellerId !== user.id) {
    migrateListingsSellerId(previousSellerId, user.id, user.name, user.phone);
  }
  sessionStorage.setItem('db-liquid-seller-id', user.id);
  setSellerName(user.name);
  setSellerPhone(user.phone);
  setBuyerName(user.name);
  setBuyerPhone(user.phone);
}

function applyAuthenticatedUser(user: User, setUser: (u: User) => void) {
  const fullUser = ensureDualRole({ ...user, password: '' } as User);
  setAuthUserId(fullUser.id);
  clearLegacyLocalStorageSession();
  setUser(fullUser);
  syncIdentityForUser(fullUser);
  return fullUser;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      clearLegacyLocalStorageSession();
      const me = await fetchAuthMe();
      if (cancelled) return;

      if (me.ok) {
        applyAuthenticatedUser(me.user, setUser);
      } else {
        clearAuthUserId();
        setUser(null);
      }

      setSessionReady(true);
    }

    void restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user) {
      syncIdentityForUser(user);
    }
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginViaApi(email, password);
    if (!result.ok) return result;

    applyAuthenticatedUser(result.user, setUser);
    await Promise.all([
      reloadUsersFromServer({ force: true }),
      reloadListingsFromServer({ force: true }),
    ]);
    notifyDataRefresh();
    return { ok: true as const };
  }, []);

  const signup = useCallback(
    async (input: { email: string; phone: string; name: string; password: string }) => {
      const result = await registerViaApi(input);
      if (!result.ok) return result;

      applyAuthenticatedUser(result.user, setUser);
      await Promise.all([
        reloadUsersFromServer({ force: true }),
        reloadListingsFromServer({ force: true }),
      ]);
      notifyDataRefresh();
      return { ok: true as const };
    },
    [],
  );

  const refreshUser = useCallback(async () => {
    const me = await fetchAuthMe();
    if (!me.ok) {
      clearAuthUserId();
      setUser(null);
      return;
    }
    await reloadUsersFromServer();
    const found = findUserById(me.user.id);
    applyAuthenticatedUser(found ? { ...me.user, ...found, password: '' } : me.user, setUser);
  }, []);

  const syncCreditWallet = useCallback(() => {
    const userId = user?.id;
    if (!userId) return;
    const fresh = findUserById(userId);
    if (fresh) setUser(ensureDualRole(fresh));
  }, [user?.id]);

  const updateUserCredits = useCallback((credits: number) => {
    setUser((prev) => (prev ? { ...prev, credits } : prev));
  }, []);

  const updateProfile = useCallback(
    async (patch: {
      email?: string;
      phone?: string;
      name?: string;
      profileImageUrl?: string | null;
      aadharNumber?: string | null;
      aadharVerified?: boolean;
      panNumber?: string | null;
      panVerified?: boolean;
    }) => {
      if (!user?.id) {
        return { ok: false as const, error: 'Log in to update your profile.' };
      }

      const result = await updateUserProfile(user.id, patch);
      if (!result.ok) return result;

      setUser(result.user);
      setAuthUserId(result.user.id);
      syncIdentityForUser(result.user);
      syncUserProfileOnListings(result.user.id, result.user.name, result.user.phone);
      return { ok: true as const };
    },
    [user],
  );

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string) => {
      if (!user?.id) {
        return { ok: false as const, error: 'Log in to change your password.' };
      }

      const result = await changeUserPassword(user.id, currentPassword, newPassword);
      return result;
    },
    [user],
  );

  const topUpCredits = useCallback(async (creditAmount: number) => {
    if (!user?.id) {
      return { ok: false as const, error: 'Log in to top up credits.' };
    }
    const result = await topUpCreditsForUser(user.id, creditAmount);
    if (result.ok) {
      const fresh = findUserById(user.id);
      if (fresh) setUser(ensureDualRole(fresh));
    }
    return result;
  }, [user]);

  const logout = useCallback(() => {
    void logoutViaApi();
    clearAuthUserId();
    clearLegacyLocalStorageSession();
    setUser(null);
    sessionStorage.removeItem('db-liquid-seller-id');
    sessionStorage.removeItem('db-liquid-seller-name');
    sessionStorage.removeItem('db-liquid-seller-phone');
    sessionStorage.removeItem('db-liquid-buyer-name');
    sessionStorage.removeItem('db-liquid-buyer-phone');
  }, []);

  // Cookie/JWT is source of truth — re-check /api/auth/me periodically (AUTH-001)
  useEffect(() => {
    if (!user) return;

    const verifyCookieSession = async () => {
      const me = await fetchAuthMe();
      if (!me.ok) {
        logout();
      }
    };

    const intervalId = window.setInterval(() => {
      void verifyCookieSession();
    }, 60_000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void verifyCookieSession();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user, logout]);

  const hasRole = useCallback(
    (role: 'buyer' | 'seller') => Boolean(user?.roles.includes(role)),
    [user],
  );

  const isAdmin = Boolean(user?.roles.includes('admin'));

  const buyerCredits = user ? (user.credits ?? 0) : 0;
  const creditHistory = user?.creditHistory ?? [];

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      sessionReady,
      login,
      signup,
      logout,
      hasRole,
      isAdmin,
      buyerCredits,
      creditHistory,
      topUpCredits,
      refreshUser,
      syncCreditWallet,
      updateUserCredits,
      updateProfile,
      changePassword,
    }),
    [
      user,
      sessionReady,
      login,
      signup,
      logout,
      hasRole,
      isAdmin,
      buyerCredits,
      creditHistory,
      topUpCredits,
      refreshUser,
      syncCreditWallet,
      updateUserCredits,
      updateProfile,
      changePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
