import { describe, it, expect } from 'vitest';
import { ADMIN_EMAILS } from '@/hooks/useAdmin';

describe('useAdmin authorization rules', () => {
  it('deve conter emanuel.adm10@gmail.com como administrador', () => {
    expect(ADMIN_EMAILS).toContain('emanuel.adm10@gmail.com');
  });

  it('deve conter os emails de teste na lista de administradores', () => {
    expect(ADMIN_EMAILS).toContain('teste@reune.com');
    expect(ADMIN_EMAILS).toContain('teste2@reune.dot');
  });

  it('não deve conter emails não autorizados', () => {
    expect(ADMIN_EMAILS).not.toContain('hacker@email.com');
    expect(ADMIN_EMAILS).not.toContain('usuario@reune.com');
  });

  it('deve validar match case-insensitive', () => {
    const testEmail = 'EMANUEL.ADM10@GMAIL.COM'.toLowerCase().trim();
    const isAuthorized = ADMIN_EMAILS.some((admin) => admin.toLowerCase() === testEmail);
    expect(isAuthorized).toBe(true);
  });
});
