import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, signSessionToken, verifySessionToken } from '@/server/auth/security';
import { AuthService } from '@/server/services/auth-service';
import { MemoryUserRepository } from '@/server/repositories/user-repository';

describe('Auth Security & Password Hashing', () => {
  it('hashes password and verifies successfully with correct password', async () => {
    const password = 'SecurePassword123!';
    const hash = await hashPassword(password);

    expect(hash).toContain(':');
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('rejects incorrect password verification', async () => {
    const hash = await hashPassword('CorrectPassword123!');
    const isValid = await verifyPassword('WrongPassword999!', hash);
    expect(isValid).toBe(false);
  });

  it('signs and verifies session tokens correctly', () => {
    const payload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test Traveler',
      role: 'traveler' as const,
    };

    const token = signSessionToken(payload, 3600);
    const verified = verifySessionToken(token);

    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('test-user-123');
    expect(verified?.email).toBe('test@example.com');
  });

  it('rejects tampered session tokens', () => {
    const payload = {
      userId: 'test-user-123',
      email: 'test@example.com',
      name: 'Test Traveler',
      role: 'traveler' as const,
    };

    const token = signSessionToken(payload, 3600);
    const tampered = token + 'tampered';
    const verified = verifySessionToken(tampered);

    expect(verified).toBeNull();
  });
});

describe('AuthService Registration & Login', () => {
  const repo = new MemoryUserRepository();
  const service = new AuthService(repo);

  it('registers a new user and returns public profile with session token', async () => {
    const result = await service.register({
      name: 'John Traveler',
      email: 'john.traveler@example.com',
      password: 'StrongPassword123!',
      preferredLanguage: 'English',
    });

    expect(result.user).toBeDefined();
    expect(result.user.name).toBe('John Traveler');
    expect(result.user.email).toBe('john.traveler@example.com');
    expect(result.user.role).toBe('traveler');
    // Ensure password hash is not exposed in public profile!
    expect((result.user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    expect(result.token).toBeDefined();
  });

  it('rejects duplicate registration with existing email', async () => {
    await expect(
      service.register({
        name: 'Another John',
        email: 'john.traveler@example.com',
        password: 'AnotherPassword123!',
        preferredLanguage: 'English',
      })
    ).rejects.toThrow('An account with this email address already exists.');
  });

  it('authenticates registered user with valid password', async () => {
    const loginResult = await service.login({
      email: 'john.traveler@example.com',
      password: 'StrongPassword123!',
    });

    expect(loginResult.user.email).toBe('john.traveler@example.com');
    expect(loginResult.token).toBeDefined();
  });

  it('rejects login with invalid password', async () => {
    await expect(
      service.login({
        email: 'john.traveler@example.com',
        password: 'IncorrectPassword!',
      })
    ).rejects.toThrow('Invalid email or password.');
  });

  it('updates profile settings cleanly', async () => {
    const user = await repo.findByEmail('john.traveler@example.com');
    expect(user).not.toBeNull();

    const updated = await service.updateProfile(user!.id, {
      name: 'Johnathan Traveler',
      preferredLanguage: 'Bengali',
    });

    expect(updated?.name).toBe('Johnathan Traveler');
    expect(updated?.preferredLanguage).toBe('Bengali');
  });
});
