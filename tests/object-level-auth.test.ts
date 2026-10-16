import { describe, it, expect } from 'vitest';
import { AuthService } from '@/server/services/auth-service';
import { MemoryUserRepository } from '@/server/repositories/user-repository';

describe('Object-Level Authorization & Private Records Isolation', () => {
  const repo = new MemoryUserRepository();
  const authService = new AuthService(repo);

  const userAliceId = 'user-alice-100';
  const userBobId = 'user-bob-200';

  it('allows User Alice to save a healthcare provider', async () => {
    const record = await authService.saveProvider(userAliceId, 'demo-prov-001', 'Alice private note');
    expect(record).not.toBeNull();
    expect(record?.userId).toBe(userAliceId);
    expect(record?.providerId).toBe('demo-prov-001');
    expect(record?.notes).toBe('Alice private note');
  });

  it('allows User Bob to save a healthcare provider', async () => {
    const record = await authService.saveProvider(userBobId, 'demo-prov-002', 'Bob private note');
    expect(record).not.toBeNull();
    expect(record?.userId).toBe(userBobId);
    expect(record?.providerId).toBe('demo-prov-002');
  });

  it('enforces object-level isolation: Alice cannot see Bob saved records', async () => {
    const aliceRecords = await authService.getSavedProviders(userAliceId);
    expect(aliceRecords.length).toBe(1);
    expect(aliceRecords[0].providerId).toBe('demo-prov-001');
    // Ensure no Bob records leak to Alice
    expect(aliceRecords.some((r) => r.userId === userBobId)).toBe(false);
  });

  it('enforces object-level isolation: Bob cannot see Alice saved records', async () => {
    const bobRecords = await authService.getSavedProviders(userBobId);
    expect(bobRecords.length).toBe(1);
    expect(bobRecords[0].providerId).toBe('demo-prov-002');
    // Ensure no Alice records leak to Bob
    expect(bobRecords.some((r) => r.userId === userAliceId)).toBe(false);
  });

  it('prevents cross-user record deletion: Alice cannot delete Bob saved provider', async () => {
    const bobRecords = await authService.getSavedProviders(userBobId);
    const bobRecordId = bobRecords[0].id;

    // Alice attempts to delete Bob's record ID
    const deleteAttemptByAlice = await authService.removeSavedProvider(userAliceId, bobRecordId);
    expect(deleteAttemptByAlice).toBe(false);

    // Verify Bob's record was NOT deleted
    const bobRecordsAfterAttack = await authService.getSavedProviders(userBobId);
    expect(bobRecordsAfterAttack.length).toBe(1);
    expect(bobRecordsAfterAttack[0].id).toBe(bobRecordId);
  });

  it('allows Bob to delete his own saved record', async () => {
    const bobRecords = await authService.getSavedProviders(userBobId);
    const bobRecordId = bobRecords[0].id;

    const deleteSuccess = await authService.removeSavedProvider(userBobId, bobRecordId);
    expect(deleteSuccess).toBe(true);

    const bobRecordsAfter = await authService.getSavedProviders(userBobId);
    expect(bobRecordsAfter.length).toBe(0);
  });
});
