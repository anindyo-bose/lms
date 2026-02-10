/**
 * Auth Service - Tests
 */

import { TokenService } from '../src/services/tokenService';

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService('test-secret', 'test-refresh-secret');
  });

  describe('createTokenPair', () => {
    it('should create access and refresh tokens', () => {
      const tokens = tokenService.createTokenPair('user-123', 'user@example.com', 'student');

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(tokens).toHaveProperty('refreshTokenHash');
      expect(tokens.accessToken).toBeTruthy();
      expect(tokens.refreshToken).toBeTruthy();
      expect(tokens.refreshTokenHash).toBeTruthy();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const tokens = tokenService.createTokenPair('user-123', 'user@example.com', 'student');
      const result = tokenService.verifyAccessToken(tokens.accessToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe('user-123');
      expect(result.payload?.type).toBe('access');
    });

    it('should reject invalid access token', () => {
      const result = tokenService.verifyAccessToken('invalid-token');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const tokens = tokenService.createTokenPair('user-123', 'user@example.com', 'student');
      const result = tokenService.verifyRefreshToken(tokens.refreshToken);

      expect(result.valid).toBe(true);
      expect(result.payload).toBeDefined();
      expect(result.payload?.userId).toBe('user-123');
      expect(result.payload?.type).toBe('refresh');
    });
  });

  describe('hashToken', () => {
    it('should hash token consistently', () => {
      const token = 'test-token-123';
      const hash1 = tokenService.hashToken(token);
      const hash2 = tokenService.hashToken(token);

      expect(hash1).toBe(hash2);
    });

    it('should produce different hash for different tokens', () => {
      const hash1 = tokenService.hashToken('token-1');
      const hash2 = tokenService.hashToken('token-2');

      expect(hash1).not.toBe(hash2);
    });
  });
});
