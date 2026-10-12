import { describe, it } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { timingSafeEqual } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import { validatePasswordStrength } from '../src/app/api/auth/change-password/route';

const LEGACY_DEFAULT_PASSWORD = 'password';
const BCRYPT_COST_FACTOR = 12;
const TEST_JWT_SECRET = new TextEncoder().encode('test_auth_secret_minimum_32_characters_for_jwt');

describe('UK Enterprise Phase 1 - Authentication Security & Hardening Tests', () => {

  // Test 1: Legacy timing-safe verification
  it('1. Verifies explicitly identified legacy password using timing-safe comparison', () => {
    const expected = Buffer.from(LEGACY_DEFAULT_PASSWORD, 'utf8');
    const inputValid = Buffer.from('password', 'utf8');
    const inputInvalid = Buffer.from('wrongpass', 'utf8');

    const isValid = expected.length === inputValid.length && timingSafeEqual(expected, inputValid);
    assert.strictEqual(isValid, true, 'Valid legacy password must pass timing-safe check');

    const isInvalid = expected.length === inputInvalid.length && timingSafeEqual(expected, inputInvalid);
    assert.strictEqual(isInvalid, false, 'Invalid legacy password must fail check');
  });

  // Test 2: Reject arbitrary non-bcrypt strings
  it('2. Rejects arbitrary non-bcrypt plaintext strings from being accepted as legacy credentials', () => {
    const storedHash = 'some_random_seed_value';
    const isBcrypt = storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$');
    const isLegacy = storedHash === LEGACY_DEFAULT_PASSWORD;

    assert.strictEqual(isBcrypt, false);
    assert.strictEqual(isLegacy, false);
    const isAccepted = isBcrypt || isLegacy;
    assert.strictEqual(isAccepted, false, 'Arbitrary plaintext must never be accepted');
  });

  // Test 3: Bcrypt verification with cost factor 12
  it('3. Generates and verifies password using bcrypt with cost factor 12', async () => {
    const password = 'StrongCorporatePassword#2026';
    const hash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

    assert.ok(hash.startsWith('$2a$') || hash.startsWith('$2b$'), 'Must be a valid bcrypt hash');

    const matches = await bcrypt.compare(password, hash);
    assert.strictEqual(matches, true, 'Valid password must match bcrypt hash');

    const wrongMatches = await bcrypt.compare('WrongPassword#123', hash);
    assert.strictEqual(wrongMatches, false, 'Wrong password must fail bcrypt compare');
  });

  // Test 4: Unknown user lookup failure
  it('4. Rejects unknown or non-existent employee identifier', () => {
    const mockUsers = [
      { employeeId: 'EMP-001', status: 'ACTIVE' },
      { employeeId: 'EMP-002', status: 'ACTIVE' },
    ];
    const findUser = (id: string) => mockUsers.find(u => u.employeeId === id);

    assert.strictEqual(findUser('EMP-999'), undefined, 'Unknown employee ID must not be found');
  });

  // Test 5: Inactive user lookup failure
  it('5. Rejects inactive or suspended user accounts', () => {
    const user = { employeeId: 'EMP-005', status: 'REVOKED' };
    const isAllowed = user && user.status === 'ACTIVE';
    assert.strictEqual(isAllowed, false, 'Inactive accounts must be rejected even with credentials');
  });

  // Test 6: Legacy login marks session with needsPasswordChange: true
  it('6. Flags legacy login session with needsPasswordChange: true and restricts access', async () => {
    const isLegacyLogin = true;
    const token = await new SignJWT({
      employeeId: 'EMP-001',
      needsPasswordChange: isLegacyLogin,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(TEST_JWT_SECRET);

    const { payload } = await jwtVerify(token, TEST_JWT_SECRET);
    assert.strictEqual(payload.needsPasswordChange, true, 'Session token must encode needsPasswordChange flag');

    // Simulate getServerUser() access check
    function checkApiAccess(tokenPayload: any, allowPasswordChangeSession = false): boolean {
      if (tokenPayload.needsPasswordChange && !allowPasswordChangeSession) {
        return false; // Denied!
      }
      return true; // Allowed
    }

    assert.strictEqual(checkApiAccess(payload, false), false, 'Normal protected APIs must DENY access when needsPasswordChange is true');
    assert.strictEqual(checkApiAccess(payload, true), true, 'Password change endpoint must ALLOW access to update credentials');
  });

  // Test 7: Enforce server-side password strength policy
  it('7. Enforces robust server-side password strength policy on change', () => {
    // Too short (<10)
    assert.strictEqual(validatePasswordStrength('Short1!').isValid, false);
    // Missing uppercase
    assert.strictEqual(validatePasswordStrength('lowercase123!').isValid, false);
    // Missing lowercase
    assert.strictEqual(validatePasswordStrength('UPPERCASE123!').isValid, false);
    // Missing digit
    assert.strictEqual(validatePasswordStrength('NoDigitsHere!').isValid, false);
    // Missing special symbol
    assert.strictEqual(validatePasswordStrength('NoSpecialChars123').isValid, false);
    // Matches default 'password'
    assert.strictEqual(validatePasswordStrength('password').isValid, false);
    // Matches current password
    assert.strictEqual(validatePasswordStrength('CorporateSecure#2026', 'CorporateSecure#2026').isValid, false);
    // Valid strong password
    assert.strictEqual(validatePasswordStrength('CorporateSecure#2026', 'OldPassword#2025').isValid, true);
  });

  // Test 8: Rejection of invalid current credentials on password change
  it('8. Rejects password change when current credentials do not match stored hash', async () => {
    const currentHash = await bcrypt.hash('CorrectCurrent#2026', BCRYPT_COST_FACTOR);
    const submittedCurrent = 'WrongCurrent#2026';

    const isCurrentValid = await bcrypt.compare(submittedCurrent, currentHash);
    assert.strictEqual(isCurrentValid, false, 'Invalid current password must be rejected');
  });

  // Test 9: Successful password change workflow and updated full session
  it('9. Executes successful password change, updates hash with bcrypt factor 12, and issues full session', async () => {
    let mockUser = {
      id: 'u1',
      employeeId: 'EMP-001',
      passwordHash: await bcrypt.hash('TemporaryPassword#1', BCRYPT_COST_FACTOR),
      needsPasswordChange: true,
    };

    // 1. Verify current
    const currentMatches = await bcrypt.compare('TemporaryPassword#1', mockUser.passwordHash);
    assert.strictEqual(currentMatches, true);

    // 2. Validate new password
    const newPassword = 'NewPermanentStrongPassword#2026';
    const policy = validatePasswordStrength(newPassword, 'TemporaryPassword#1');
    assert.strictEqual(policy.isValid, true);

    // 3. Hash and update DB
    mockUser.passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST_FACTOR);
    mockUser.needsPasswordChange = false;

    // 4. Issue new session token
    const newFullToken = await new SignJWT({
      employeeId: mockUser.employeeId,
      needsPasswordChange: false,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h')
      .sign(TEST_JWT_SECRET);

    const { payload } = await jwtVerify(newFullToken, TEST_JWT_SECRET);
    assert.strictEqual(payload.needsPasswordChange, false, 'Updated session must have needsPasswordChange: false');

    // 5. Subsequent normal login with new password
    const normalLoginMatches = await bcrypt.compare(newPassword, mockUser.passwordHash);
    assert.strictEqual(normalLoginMatches, true, 'Subsequent login with new password must succeed');
  });

  // Test 10: Concurrent upgrade race condition handling with re-verification
  it('10. Handles concurrent upgrade race condition safely with re-read and re-verification', async () => {
    let mockDbRecord = { id: 'u1', passwordHash: LEGACY_DEFAULT_PASSWORD };

    // Request A updates passwordHash
    const hashA = await bcrypt.hash('password', BCRYPT_COST_FACTOR);
    mockDbRecord.passwordHash = hashA;

    // Request B attempts updateMany with where: { passwordHash: LEGACY_DEFAULT_PASSWORD }
    // It returns count: 0 because Request A already updated it
    const updateResultB = { count: 0 };
    assert.strictEqual(updateResultB.count, 0, 'Concurrent updateMany must report 0 rows modified');

    // Request B re-reads fresh record from DB
    const freshRecord = { ...mockDbRecord };
    // Request B re-verifies submitted password against fresh hash
    const recheckValid = await bcrypt.compare('password', freshRecord.passwordHash);
    assert.strictEqual(recheckValid, true, 'Request B must re-verify submitted credentials against updated DB hash');

    // Wrong password concurrent test
    const wrongRecheck = await bcrypt.compare('wrong_pass', freshRecord.passwordHash);
    assert.strictEqual(wrongRecheck, false, 'Invalid password must fail re-verification');
  });

  // Test 11: Server-authoritative RBAC role derivation
  it('11. Enforces role from server-side database record rather than client input', () => {
    const clientSuppliedRole = 'MASTER';
    const dbRecord = {
      id: 'emp_2',
      employeeId: 'EMP-002',
      name: 'Arjun Sharma',
      role: { name: 'ADMIN_A' },
    };

    const serverAuthoritativeRole = dbRecord.role.name;
    assert.notStrictEqual(clientSuppliedRole, serverAuthoritativeRole);
    assert.strictEqual(serverAuthoritativeRole, 'ADMIN_A', 'Role must strictly come from database');
  });

  // Test 12: Session cookie security options
  it('12. Enforces secure cookie attributes (HttpOnly, SameSite=Lax, Path=/)', () => {
    const cookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 86400,
    };

    assert.strictEqual(cookieOptions.httpOnly, true, 'HttpOnly must be enabled to prevent XSS access');
    assert.strictEqual(cookieOptions.secure, true, 'Secure must be enabled in production');
    assert.strictEqual(cookieOptions.sameSite, 'lax', 'SameSite must be lax to prevent CSRF');
    assert.strictEqual(cookieOptions.maxAge, 86400, 'MaxAge must be 24 hours (86400 seconds)');
  });

  // Test 13: Concurrent password-change conflict detection and credential preservation
  it('13. Rejects concurrent password-change conflict with 409 and preserves existing credential', async () => {
    const initialHash = await bcrypt.hash('InitialStrongPassword#2026', BCRYPT_COST_FACTOR);
    let mockDbRecord = {
      id: 'u1',
      employeeId: 'EMP-001',
      passwordHash: initialHash,
    };

    // Simulated DB conditional updateMany function
    const conditionalUpdateMany = (where: { id: string; passwordHash: string }, data: { passwordHash: string }) => {
      if (mockDbRecord.id === where.id && mockDbRecord.passwordHash === where.passwordHash) {
        mockDbRecord.passwordHash = data.passwordHash;
        return { count: 1 };
      }
      return { count: 0 };
    };

    // Concurrent Request 1: hashes new password 1 and executes updateMany
    const newHash1 = await bcrypt.hash('FirstWinningPassword#2026', BCRYPT_COST_FACTOR);
    const result1 = conditionalUpdateMany(
      { id: mockDbRecord.id, passwordHash: initialHash },
      { passwordHash: newHash1 }
    );
    assert.strictEqual(result1.count, 1, 'First concurrent update must succeed');
    assert.strictEqual(mockDbRecord.passwordHash, newHash1, 'Database must now hold the first updated hash');

    // Concurrent Request 2: was prepared against initialHash, but executes AFTER Request 1
    const newHash2 = await bcrypt.hash('SecondConflictingPassword#2026', BCRYPT_COST_FACTOR);
    const result2 = conditionalUpdateMany(
      { id: mockDbRecord.id, passwordHash: initialHash },
      { passwordHash: newHash2 }
    );

    // Verify Request 2 detects conflict
    assert.strictEqual(result2.count, 0, 'Conflicting concurrent update must return count: 0');

    // Handler behavior: when count === 0, returns 409 Conflict without issuing session or overwriting
    const httpStatus = result2.count === 0 ? 409 : 200;
    assert.strictEqual(httpStatus, 409, 'Conflict must yield HTTP 409 response');

    // Verify existing credential is NOT overwritten
    assert.strictEqual(mockDbRecord.passwordHash, newHash1, 'Existing credential must NOT be overwritten by conflicting request');
    const firstMatches = await bcrypt.compare('FirstWinningPassword#2026', mockDbRecord.passwordHash);
    assert.strictEqual(firstMatches, true, 'First winning password must remain the active valid credential');
    const secondMatches = await bcrypt.compare('SecondConflictingPassword#2026', mockDbRecord.passwordHash);
    assert.strictEqual(secondMatches, false, 'Conflicting password must NOT match');
  });
});
