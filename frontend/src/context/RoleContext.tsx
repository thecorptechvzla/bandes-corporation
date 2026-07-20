'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type UserRole = 'ADMIN' | 'OWNER' | 'SUPERADMIN';

interface RoleContextType {
  role: UserRole;
  setRole: (r: UserRole) => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: 'ADMIN',
  setRole: () => {},
  hasRole: () => false,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<UserRole>('ADMIN');

  useEffect(() => {
    const stored = localStorage.getItem('bandes_user_role') as UserRole | null;
    if (stored && ['ADMIN', 'OWNER', 'SUPERADMIN'].includes(stored)) {
      setRoleState(stored);
    }
  }, []);

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
    localStorage.setItem('bandes_user_role', r);
  }, []);

  const hasRole = useCallback((...roles: UserRole[]) => roles.includes(role), [role]);

  return (
    <RoleContext.Provider value={{ role, setRole, hasRole }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
