import { useMemo } from 'react';
import { useAuth } from './useAuth';

export const ADMIN_EMAILS: string[] = [
  'emanuel.adm10@gmail.com',
  'teste@reune.com',
  'teste2@reune.dot',
];

export interface UseAdminReturn {
  isAdmin: boolean;
  userEmail: string | null;
  loading: boolean;
  user: ReturnType<typeof useAuth>['user'];
  session: ReturnType<typeof useAuth>['session'];
}

export const useAdmin = (): UseAdminReturn => {
  const { user, session, loading } = useAuth();

  const userEmail = user?.email?.trim().toLowerCase() || null;

  const isAdmin = useMemo(() => {
    if (!userEmail) return false;
    return ADMIN_EMAILS.some((admin) => admin.toLowerCase() === userEmail);
  }, [userEmail]);

  return {
    isAdmin,
    userEmail,
    loading,
    user,
    session,
  };
};
