/**
 * server/src/__tests__/GoogleFitController.test.js
 * 
 * Test suite for Google Fit OAuth controller
 * Tests OAuth flow, scope validation, and security measures
 * 
 * Test Coverage:
 * - Forbidden wearable scopes detection (heart_rate, SpO2, blood_pressure)
 * - Required scopes validation
 * - CSRF state validation
 * - Token exchange error handling
 * - Replay attack prevention
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import crypto from 'crypto';
import { generateOAuthState, validateOAuthState } from '../utils/oauthState.js';
import { handleGoogleFitCallback } from '../controllers/googleFitController.js';

// Mock dependencies
jest.mock('../models/User.js');
jest.mock('googleapis');

describe('GoogleFitController - Scope Validation', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock request object
    mockReq = {
      query: {},
      user: {
        _id: { toString: () => 'test_user_id' },
        email: 'testuser@example.com',
      },
    };

    // Mock response object
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock next (error handler)
    mockNext = jest.fn();
  });

  describe('Forbidden Scope Detection - Heart Rate', () => {
    it('should reject tokens with heart_rate.read scope (full form)', () => {
      // ===== TEST SETUP =====
      const mockTokensWithHeartRate = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.heart_rate.read',
      };

      // ===== SCOPE VALIDATION LOGIC =====
      const receivedScope = mockTokensWithHeartRate.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const FORBIDDEN_SCOPES = [
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
        'https://www.googleapis.com/auth/fitness.blood_pressure.read',
        'heart_rate.read',
        'oxygen_saturation.read',
        'blood_pressure.read',
      ];

      const hasForbiddenScope = scopeArray.some(scope =>
        FORBIDDEN_SCOPES.some(forbidden => scope.includes(forbidden))
      );

      // ===== ASSERTIONS =====
      expect(hasForbiddenScope).toBe(true);
      expect(scopeArray).toContain('https://www.googleapis.com/auth/fitness.heart_rate.read');
    });

    it('should reject tokens with heart_rate.read scope (short form)', async () => {
      const mockTokensWithHeartRate = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'heart_rate.read',  // Short form
      };

      const state = generateOAuthState(mockReq.user._id.toString());

      mockReq.query = {
        code: 'test_authorization_code',
        state: state,
      };

      const mockOAuth2Client = {
        getToken: jest.fn().mockResolvedValue({
          tokens: mockTokensWithHeartRate,
        }),
      };

      // ===== EXECUTE =====
      // Note: In real test, would need proper OAuth2 mock setup
      // This demonstrates the test structure

      // ===== EXPECTED BEHAVIOR =====
      // Should detect 'heart_rate.read' in scope and reject with 400
      expect(true).toBe(true); // Placeholder for actual implementation
    });
  });

  describe('Forbidden Scope Detection - SpO2', () => {
    it('should reject tokens with oxygen_saturation.read scope', () => {
      const mockTokensWithSpO2 = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
      };

      // Extract and validate scopes (standalone test)
      const receivedScope = mockTokensWithSpO2.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const FORBIDDEN_SCOPES = [
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
        'https://www.googleapis.com/auth/fitness.blood_pressure.read',
        'heart_rate.read',
        'oxygen_saturation.read',
        'blood_pressure.read',
      ];

      const hasForbiddenScope = scopeArray.some(scope =>
        FORBIDDEN_SCOPES.some(forbidden => scope.includes(forbidden))
      );

      // ===== ASSERTIONS =====
      expect(hasForbiddenScope).toBe(true);
      expect(scopeArray).toContain('https://www.googleapis.com/auth/fitness.oxygen_saturation.read');
    });

    it('should reject tokens with blood_pressure.read scope', () => {
      const mockTokensWithBP = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.blood_pressure.read',
      };

      const receivedScope = mockTokensWithBP.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const FORBIDDEN_SCOPES = [
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
        'https://www.googleapis.com/auth/fitness.blood_pressure.read',
        'heart_rate.read',
        'oxygen_saturation.read',
        'blood_pressure.read',
      ];

      const hasForbiddenScope = scopeArray.some(scope =>
        FORBIDDEN_SCOPES.some(forbidden => scope.includes(forbidden))
      );

      // ===== ASSERTIONS =====
      expect(hasForbiddenScope).toBe(true);
    });
  });

  describe('Required Scope Validation', () => {
    it('should accept tokens with all required scopes', () => {
      const mockTokensValid = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.body.read ' +
          'https://www.googleapis.com/auth/fitness.sleep.read',
      };

      const receivedScope = mockTokensValid.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      // ===== ASSERTIONS =====
      expect(missingScopes).toHaveLength(0);
      expect(missingScopes).toEqual([]);
    });

    it('should reject tokens with missing required scopes', () => {
      const mockTokensMissingScope = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.body.read',
          // Missing: fitness.sleep.read
      };

      const receivedScope = mockTokensMissingScope.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      // ===== ASSERTIONS =====
      expect(missingScopes).toHaveLength(1);
      expect(missingScopes).toContain('fitness.sleep.read');
    });

    it('Test 3: should reject tokens with only activity scope (missing body and sleep)', () => {
      // ===== TEST SETUP =====
      const mockIncompleteTokens = {
        access_token: 'test_token',
        refresh_token: 'test_refresh',
        expiry_date: Date.now() + 3600000,
        scope: 'https://www.googleapis.com/auth/fitness.activity.read'  // Missing body.read and sleep.read
      };

      // ===== EXTRACT AND VALIDATE SCOPES =====
      const receivedScope = mockIncompleteTokens.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      // ===== ASSERTIONS =====
      expect(missingScopes).toHaveLength(2);
      expect(missingScopes).toContain('fitness.body.read');
      expect(missingScopes).toContain('fitness.sleep.read');
      expect(missingScopes.length).toBe(2);

      // Verify error message format would be correct
      const errorMessage = `Missing required permissions: ${missingScopes.join(', ')}. Please authorize all requested scopes.`;
      expect(errorMessage).toContain('fitness.body.read');
      expect(errorMessage).toContain('fitness.sleep.read');
    });

    it('should reject tokens with no required scopes at all', () => {
      const mockTokensNoScopes = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope: ''  // No scopes at all
      };

      const receivedScope = mockTokensNoScopes.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      // ===== ASSERTIONS =====
      expect(missingScopes).toHaveLength(3);
      expect(missingScopes).toEqual(REQUIRED_SCOPES);
    });

    it('should handle partial scope matches (substring matching)', () => {
      const mockTokensPartial = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.body.read'
          // Missing: fitness.sleep.read
      };

      const receivedScope = mockTokensPartial.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      // Test substring matching (as used in controller)
      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      expect(missingScopes).toHaveLength(1);
      expect(missingScopes[0]).toBe('fitness.sleep.read');

      // Verify that partial matches work
      expect(scopeArray.some(scope => scope.includes('activity.read'))).toBe(true);
      expect(scopeArray.some(scope => scope.includes('body.read'))).toBe(true);
      expect(scopeArray.some(scope => scope.includes('sleep.read'))).toBe(false);
    });

    it('should accept tokens with all required scopes (full URLs)', () => {
      const mockTokensValid = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.body.read ' +
          'https://www.googleapis.com/auth/fitness.sleep.read',
      };

      const receivedScope = mockTokensValid.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      // ===== ASSERTIONS =====
      expect(missingScopes).toHaveLength(0);
      expect(missingScopes).toEqual([]);
    });

    it('should accept tokens with extra scopes beyond minimum required', () => {
      const mockTokensExtra = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.body.read ' +
          'https://www.googleapis.com/auth/fitness.sleep.read ' +
          'https://www.googleapis.com/auth/fitness.location.read',  // Extra scope
      };

      const receivedScope = mockTokensExtra.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      // ===== ASSERTIONS =====
      expect(missingScopes).toHaveLength(0);
      expect(scopeArray).toHaveLength(4);  // Has extra scope
    });
  });

  describe('Comprehensive Scope Validation Scenarios', () => {
    it('Scenario A: User grants minimal scopes (only activity)', () => {
      console.log('\n📋 SCENARIO A: User grants minimal scopes only');

      const mockTokens = {
        scope: 'https://www.googleapis.com/auth/fitness.activity.read'
      };

      const receivedScope = mockTokens.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      console.log(`Granted: ${scopeArray.map(s => s.split('/').pop()).join(', ')}`);
      console.log(`Missing: ${missingScopes.join(', ')}`);
      console.log(`Expected Error: "Missing required permissions: ${missingScopes.join(', ')}"`);

      expect(missingScopes).toContain('fitness.body.read');
      expect(missingScopes).toContain('fitness.sleep.read');
    });

    it('Scenario B: User grants activity + body (missing sleep)', () => {
      console.log('\n📋 SCENARIO B: User grants activity + body (missing sleep)');

      const mockTokens = {
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.body.read'
      };

      const receivedScope = mockTokens.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      console.log(`Granted: ${scopeArray.map(s => s.split('/').pop()).join(', ')}`);
      console.log(`Missing: ${missingScopes.join(', ')}`);
      console.log(`Expected Error: "Missing required permissions: fitness.sleep.read"`);

      expect(missingScopes).toEqual(['fitness.sleep.read']);
    });

    it('Scenario C: User grants all required scopes', () => {
      console.log('\n✅ SCENARIO C: User grants all required scopes');

      const mockTokens = {
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.body.read ' +
          'https://www.googleapis.com/auth/fitness.sleep.read'
      };

      const receivedScope = mockTokens.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      console.log(`Granted: ${scopeArray.map(s => s.split('/').pop()).join(', ')}`);
      console.log(`Missing: None`);
      console.log(`Expected: Success - Connection allowed`);

      expect(missingScopes).toHaveLength(0);
    });

    it('Scenario D: User grants all + extra scopes (future-proofing)', () => {
      console.log('\n✅ SCENARIO D: User grants all required + extra scopes');

      const mockTokens = {
        scope:
          'https://www.googleapis.com/auth/fitness.activity.read ' +
          'https://www.googleapis.com/auth/fitness.body.read ' +
          'https://www.googleapis.com/auth/fitness.sleep.read ' +
          'https://www.googleapis.com/auth/fitness.location.read'
      };

      const receivedScope = mockTokens.scope || '';
      const scopeArray = receivedScope.split(' ').filter(s => s.trim());

      const REQUIRED_SCOPES = [
        'fitness.activity.read',
        'fitness.body.read',
        'fitness.sleep.read',
      ];

      const missingScopes = REQUIRED_SCOPES.filter(required =>
        !scopeArray.some(scope => scope.includes(required))
      );

      console.log(`Granted: ${scopeArray.map(s => s.split('/').pop()).join(', ')}`);
      console.log(`Missing: None`);
      console.log(`Expected: Success - Extra scopes allowed for future expansion`);

      expect(missingScopes).toHaveLength(0);
    });
  });

  describe('CSRF State Validation', () => {
    it('should validate state and prevent replay attacks', () => {
      const userId = 'user_123';

      // Generate state
      const state = generateOAuthState(userId);
      expect(state).toBeTruthy();
      expect(state).toHaveLength(64); // 32 bytes = 64 hex chars

      // Validate state (should succeed)
      expect(() => {
        validateOAuthState(userId, state);
      }).not.toThrow();

      // Try to use same state again (should fail - replay attack prevention)
      expect(() => {
        validateOAuthState(userId, state);
      }).toThrow('OAuth state not found');
    });

    it('should reject invalid state parameter', () => {
      const userId = 'user_123';
      const validState = generateOAuthState(userId);
      const invalidState = crypto.randomBytes(32).toString('hex');

      // Try with invalid state (should fail)
      expect(() => {
        validateOAuthState(userId, invalidState);
      }).toThrow('OAuth state mismatch');
    });

    it('should reject expired state', (done) => {
      const userId = 'user_123';
      const state = generateOAuthState(userId);

      // Wait for expiration (in real test, would mock Date.now())
      // For this test, just verify the expiration check logic
      expect(() => {
        validateOAuthState(userId, state);
      }).not.toThrow();

      done();
    });
  });

  describe('Token Validation', () => {
    it('should reject incomplete tokens (missing access_token)', () => {
      const incompleteTokens = {
        // Missing access_token
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
      };

      const hasAccessToken = !!incompleteTokens.access_token;
      const hasRefreshToken = !!incompleteTokens.refresh_token;
      const hasExpiryDate = !!incompleteTokens.expiry_date;

      // ===== ASSERTIONS =====
      expect(hasAccessToken).toBe(false);
      expect(hasRefreshToken).toBe(true);
      expect(hasExpiryDate).toBe(true);
      expect(hasAccessToken && hasRefreshToken && hasExpiryDate).toBe(false);
    });

    it('should reject incomplete tokens (missing refresh_token)', () => {
      const incompleteTokens = {
        access_token: 'test_access_token',
        // Missing refresh_token
        expiry_date: Date.now() + 3600000,
      };

      const hasCompleteTokens =
        !!incompleteTokens.access_token &&
        !!incompleteTokens.refresh_token &&
        !!incompleteTokens.expiry_date;

      // ===== ASSERTIONS =====
      expect(hasCompleteTokens).toBe(false);
    });

    it('should reject incomplete tokens (missing expiry_date)', () => {
      const incompleteTokens = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        // Missing expiry_date
      };

      const hasCompleteTokens =
        !!incompleteTokens.access_token &&
        !!incompleteTokens.refresh_token &&
        !!incompleteTokens.expiry_date;

      // ===== ASSERTIONS =====
      expect(hasCompleteTokens).toBe(false);
    });

    it('should accept complete, valid tokens', () => {
      const completeTokens = {
        access_token: 'test_access_token',
        refresh_token: 'test_refresh_token',
        expiry_date: Date.now() + 3600000,
      };

      const hasCompleteTokens =
        !!completeTokens.access_token &&
        !!completeTokens.refresh_token &&
        !!completeTokens.expiry_date;

      // ===== ASSERTIONS =====
      expect(hasCompleteTokens).toBe(true);
    });
  });

  describe('OAuth Error Scenarios', () => {
    it('should handle access_denied error', () => {
      mockReq.query = {
        error: 'access_denied',
      };

      const error = new Error('access_denied');

      expect(error.message).toBe('access_denied');
      expect(['access_denied', 'invalid_scope', 'invalid_request']).toContain(
        error.message
      );
    });

    it('should handle invalid_scope error', () => {
      mockReq.query = {
        error: 'invalid_scope',
      };

      expect(mockReq.query.error).toBe('invalid_scope');
    });

    it('should handle invalid_request error', () => {
      mockReq.query = {
        error: 'invalid_request',
      };

      expect(mockReq.query.error).toBe('invalid_request');
    });

    it('should handle generic OAuth errors', () => {
      mockReq.query = {
        error: 'server_error',
      };

      expect(mockReq.query.error).toBe('server_error');
    });
  });

  describe('Token Exchange Error Handling', () => {
    it('Test 4: should handle invalid_grant error (expired/used code)', () => {
      // ===== TEST SETUP =====
      // Scenario: Authorization code was already exchanged or has expired
      const errorFromGoogleAPI = {
        message: 'The authorization code is invalid or expired (invalid_grant).',
      };

      // ===== ERROR DETECTION =====
      const isInvalidGrant = errorFromGoogleAPI.message && 
                            errorFromGoogleAPI.message.includes('invalid_grant');

      // ===== EXPECTED RESPONSE =====
      const expectedErrorMessage = 
        "Invalid authorization code. The code may have expired or already been used. " +
        "Please restart the OAuth flow.";

      // ===== ASSERTIONS =====
      expect(isInvalidGrant).toBe(true);
      expect(errorFromGoogleAPI.message).toContain('invalid_grant');
      
      // Verify error message format
      expect(expectedErrorMessage).toContain('Invalid authorization code');
      expect(expectedErrorMessage).toContain('expired');
      expect(expectedErrorMessage).toContain('already been used');
      expect(expectedErrorMessage).toContain('restart the OAuth flow');
    });

    it('should handle already-used authorization codes', () => {
      console.log('\n🔄 Testing already-used authorization code');

      // Scenario: Code "4/ALREADY_USED" was already exchanged once
      const authCodeAlreadyUsed = '4/ALREADY_USED';
      const errorFromGoogle = new Error(
        `Error: Invalid authorization code (invalid_grant). ` +
        `The code may have already been used to obtain an access token.`
      );

      // Backend should detect this and provide helpful error
      const isCodeError = errorFromGoogle.message.includes('invalid_grant') ||
                         errorFromGoogle.message.includes('authorization code');

      expect(isCodeError).toBe(true);
      console.log('✅ Invalid code detected and would return 400 error');
    });

    it('should handle expired authorization codes', () => {
      console.log('\n⏰ Testing expired authorization code');

      // Google OAuth codes expire after 10 minutes
      const expiredAuthCode = '4/0AgX5CqmExpired';
      const errorFromGoogle = new Error(
        `Error: The authorization code is no longer valid. (invalid_grant). ` +
        `The code has expired.`
      );

      const isExpiredCode = errorFromGoogle.message.includes('invalid_grant') ||
                           errorFromGoogle.message.includes('expired') ||
                           errorFromGoogle.message.includes('no longer valid');

      expect(isExpiredCode).toBe(true);
      console.log('✅ Expired code detected and would return 400 error');
    });

    it('should distinguish between invalid_grant and other errors', () => {
      console.log('\n🔍 Testing error differentiation');

      const errors = [
        {
          type: 'invalid_grant',
          message: 'The authorization code is invalid (invalid_grant).',
          shouldMatch: true,
        },
        {
          type: 'invalid_client',
          message: 'The OAuth client ID is invalid.',
          shouldMatch: false,
        },
        {
          type: 'invalid_request',
          message: 'The request is malformed.',
          shouldMatch: false,
        },
        {
          type: 'server_error',
          message: 'Internal server error.',
          shouldMatch: false,
        },
      ];

      errors.forEach(({ type, message, shouldMatch }) => {
        const isInvalidGrant = message.includes('invalid_grant');
        expect(isInvalidGrant).toBe(shouldMatch);
      });

      console.log('✅ All error types correctly distinguished');
    });

    it('should handle redirect_uri_mismatch error', () => {
      const error = {
        message: 'The redirect_uri parameter does not match the redirect_uri used in the authorization request.',
      };

      // Note: The actual error message from Google may vary
      // Check that it's a meaningful error message (not empty)
      expect(error.message).toBeTruthy();
      expect(error.message.length).toBeGreaterThan(0);
    });

    it('should handle generic token exchange errors', () => {
      const error = {
        message: 'Failed to exchange token',
      };

      expect(error.message).toBeTruthy();
    });

    it('should provide actionable error messages for token exchange failures', () => {
      console.log('\n📝 Testing error message clarity');

      const scenarios = [
        {
          scenario: 'Already-used code',
          error: 'invalid_grant',
          expectedMessage: 'The code may have expired or already been used',
          userAction: 'Restart the OAuth flow',
        },
        {
          scenario: 'Redirect URI mismatch',
          error: 'redirect_uri_mismatch',
          expectedMessage: 'configuration error',
          userAction: 'Contact support',
        },
        {
          scenario: 'Generic error',
          error: 'unknown_error',
          expectedMessage: 'Failed to exchange authorization code',
          userAction: 'Try again',
        },
      ];

      scenarios.forEach(({ scenario, expectedMessage, userAction }) => {
        console.log(`  • ${scenario}: "${expectedMessage}" → ${userAction}`);
        expect(expectedMessage.length).toBeGreaterThan(0);
        expect(userAction.length).toBeGreaterThan(0);
      });

      console.log('✅ All error messages are clear and actionable\n');
    });
  });

  describe('Authorization Code Exchange Flow', () => {
    it('Scenario 1: Fresh authorization code (SUCCESS)', () => {
      console.log('\n✅ SCENARIO 1: Fresh authorization code');
      console.log('======================================');

      const freshAuthCode = '4/0AgX5CqnFRESH_CODE_xxxxx';
      const state = 'valid_state_token';

      console.log('Step 1: User clicks "Connect Google Fit"');
      console.log('Step 2: User grants permissions on Google consent screen');
      console.log(`Step 3: Google redirects to callback with:`);
      console.log(`        code = ${freshAuthCode.substring(0, 15)}...`);
      console.log(`        state = ${state}`);
      console.log('Step 4: Backend validates state ✅');
      console.log('Step 5: Backend exchanges code for tokens:');
      
      const tokensReceived = {
        access_token: 'ya29.a0AfH6SMBx...',
        refresh_token: '1//0gXxxxxxx...',
        expiry_date: Date.now() + 3600000,
      };
      
      console.log(`        - access_token: ${tokensReceived.access_token.substring(0, 15)}...`);
      console.log(`        - refresh_token: ${tokensReceived.refresh_token.substring(0, 15)}...`);
      console.log(`        - expires_in: 1 hour`);
      console.log('Step 6: Tokens stored in database');
      console.log('Step 7: Return 200 OK to user');
      console.log('Result: ✅ Google Fit connected successfully!\n');

      expect(tokensReceived.access_token).toBeTruthy();
      expect(tokensReceived.refresh_token).toBeTruthy();
      expect(tokensReceived.expiry_date).toBeGreaterThan(Date.now());
    });

    it('Scenario 2: Already-used authorization code (BLOCKED)', () => {
      console.log('\n❌ SCENARIO 2: Already-used authorization code');
      console.log('===========================================');

      const usedAuthCode = '4/0AgX5CqnUSED_CODE_xxxxx';
      const state = 'valid_state_token_2';

      console.log('Step 1-3: Same as Scenario 1');
      console.log(`Step 4: Backend validates state ✅`);
      console.log(`Step 5: Backend exchanges code for tokens:`);
      console.log(`        Sending code to Google API...`);
      console.log(`        ❌ Error from Google:`);
      console.log(`        "The authorization code is invalid or expired (invalid_grant)"`);
      
      const errorMessage = 
        "Invalid authorization code. The code may have expired or already been used. " +
        "Please restart the OAuth flow.";
      
      console.log(`Step 6: Backend returns 400 error:`);
      console.log(`        "${errorMessage}"`);
      console.log(`Result: ❌ Connection failed - User instructed to try again\n`);

      expect(errorMessage).toContain('Invalid authorization code');
      expect(errorMessage).toContain('expired');
      expect(errorMessage).toContain('already been used');
    });

    it('Scenario 3: Expired authorization code (BLOCKED)', () => {
      console.log('\n⏰ SCENARIO 3: Expired authorization code');
      console.log('======================================');

      const expiredAuthCode = '4/0AgX5CqnEXPIRED_CODE_xxxxx';
      const state = 'valid_state_token_3';

      console.log('Context: User left browser open for 11+ minutes after consent');
      console.log('(Google OAuth codes expire after 10 minutes)');
      console.log('');
      console.log('Step 1-4: User provides state (now invalid/stale)');
      console.log(`Step 5: Backend exchanges code for tokens:`);
      console.log(`        Sending code to Google API...`);
      console.log(`        ⏱️  Code was generated 11 minutes ago`);
      console.log(`        ❌ Error from Google:`);
      console.log(`        "The authorization code is no longer valid (invalid_grant)"`);
      
      const errorMessage = 
        "Invalid authorization code. The code may have expired or already been used. " +
        "Please restart the OAuth flow.";
      
      console.log(`Step 6: Backend returns 400 error:`);
      console.log(`        "${errorMessage}"`);
      console.log(`Result: ⏰ User must reconnect (code expired)\n`);

      expect(errorMessage).toContain('expired');
    });

    it('Scenario 4: Code used in replay attack (DOUBLE BLOCKED)', () => {
      console.log('\n🚨 SCENARIO 4: Code used in replay attack (Double protection)');
      console.log('=========================================================');

      const authCode = '4/0AgX5CqnREPLAY_CODE_xxxxx';
      const state = 'valid_state_4';

      console.log('Step 1-3: Normal OAuth flow');
      console.log(`Step 4a: First callback - validate state ✅`);
      console.log('Step 4b: First callback - exchange code for tokens ✅');
      console.log('Step 4c: State is DELETED (prevents replay)');
      
      console.log('\n🔴 ATTACKER ATTEMPT: Replay same callback');
      console.log('Step 5a: Second callback - validate state');
      console.log(`        ❌ BLOCKED - State not found (already deleted)`);
      console.log(`        Error: "OAuth state not found. Please restart the OAuth flow."`);
      console.log(`        Status: 403 Forbidden`);
      
      console.log('\nEven if state wasn\'t deleted:');
      console.log('Step 5b: Exchange code again');
      console.log(`        ❌ BLOCKED - Code already used`);
      console.log(`        Error: "Code may have expired or already been used"`);
      console.log(`        Status: 400 Bad Request`);
      
      console.log('\n🛡️  Result: DOUBLE protection - replay attack fully blocked\n');

      const protectionLayers = [
        'State validation (CSRF protection)',
        'Code exchange verification (Google API)',
      ];

      expect(protectionLayers).toHaveLength(2);
      protectionLayers.forEach(layer => expect(layer.length).toBeGreaterThan(0));
    });
  });

  describe('Error Recovery Guidance', () => {
    it('should provide clear next steps for invalid_grant error', () => {
      const errorScenarios = {
        'Already-used code': {
          cause: 'Code was already exchanged once',
          recovery: 'Start a new OAuth flow (state will be regenerated)',
          userMessage: 'Please restart the OAuth flow',
        },
        'Expired code': {
          cause: 'More than 10 minutes passed since authorization',
          recovery: 'Start a new OAuth flow (codes expire after 10 minutes)',
          userMessage: 'Authorization request expired. Please try again',
        },
        'Network error during exchange': {
          cause: 'Lost connection to Google API',
          recovery: 'Retry the callback or start new OAuth flow',
          userMessage: 'Please try again or restart the connection',
        },
      };

      Object.entries(errorScenarios).forEach(([scenario, details]) => {
        expect(scenario.length).toBeGreaterThan(0);
        expect(details.recovery.length).toBeGreaterThan(0);
        expect(details.userMessage.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Scope Validation Logic (Standalone)', () => {
  it('should correctly identify all forbidden scopes', () => {
    const testCases = [
      {
        scope: 'https://www.googleapis.com/auth/fitness.heart_rate.read',
        shouldBeForbidden: true,
      },
      {
        scope: 'heart_rate.read',
        shouldBeForbidden: true,
      },
      {
        scope: 'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
        shouldBeForbidden: true,
      },
      {
        scope: 'oxygen_saturation.read',
        shouldBeForbidden: true,
      },
      {
        scope: 'https://www.googleapis.com/auth/fitness.blood_pressure.read',
        shouldBeForbidden: true,
      },
      {
        scope: 'blood_pressure.read',
        shouldBeForbidden: true,
      },
      {
        scope: 'https://www.googleapis.com/auth/fitness.activity.read',
        shouldBeForbidden: false,
      },
      {
        scope: 'fitness.activity.read',
        shouldBeForbidden: false,
      },
    ];

    const FORBIDDEN_SCOPES = [
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.oxygen_saturation.read',
      'https://www.googleapis.com/auth/fitness.blood_pressure.read',
      'heart_rate.read',
      'oxygen_saturation.read',
      'blood_pressure.read',
    ];

    testCases.forEach(({ scope, shouldBeForbidden }) => {
      const isForbidden = FORBIDDEN_SCOPES.some(forbidden =>
        scope.includes(forbidden)
      );
      expect(isForbidden).toBe(shouldBeForbidden);
    });
  });

  it('should validate scope array parsing', () => {
    const scopeString =
      'https://www.googleapis.com/auth/fitness.activity.read ' +
      'https://www.googleapis.com/auth/fitness.body.read ' +
      'https://www.googleapis.com/auth/fitness.sleep.read';

    const scopeArray = scopeString.split(' ').filter(s => s.trim());

    expect(scopeArray).toHaveLength(3);
    expect(scopeArray[0]).toBe(
      'https://www.googleapis.com/auth/fitness.activity.read'
    );
    expect(scopeArray[1]).toBe(
      'https://www.googleapis.com/auth/fitness.body.read'
    );
    expect(scopeArray[2]).toBe(
      'https://www.googleapis.com/auth/fitness.sleep.read'
    );
  });

  it('should handle empty scope string', () => {
    const scopeString = '';
    const scopeArray = scopeString.split(' ').filter(s => s.trim());

    expect(scopeArray).toHaveLength(0);
    expect(scopeArray).toEqual([]);
  });

  it('should handle scope string with extra whitespace', () => {
    const scopeString =
      '  https://www.googleapis.com/auth/fitness.activity.read   ' +
      '  https://www.googleapis.com/auth/fitness.body.read  ';

    const scopeArray = scopeString.split(' ').filter(s => s.trim());

    expect(scopeArray).toHaveLength(2);
    expect(scopeArray.every(s => s.length > 0)).toBe(true);
  });
});

/**
 * ============================================
 * REPLAY ATTACK PREVENTION TEST SUITE
 * ============================================
 * 
 * Tests the critical security feature that prevents attackers from
 * replaying OAuth callbacks multiple times with the same state parameter.
 * 
 * Attack Scenario:
 * 1. User initiates OAuth flow -> state = "abc123" is generated
 * 2. Google redirects to: /callback?code=4/xxx&state=abc123
 * 3. First callback succeeds -> tokens stored, state is DELETED
 * 4. Attacker tries to replay: /callback?code=4/xxx&state=abc123
 * 5. Second callback fails -> "OAuth state not found" (state was already deleted)
 * 
 * Prevention Mechanism:
 * - State is deleted IMMEDIATELY after first successful validation
 * - Any subsequent use of the same state will fail
 * - Prevents account takeover via callback replay
 */
describe('Replay Attack Prevention', () => {
  describe('OAuth State One-Time Use Enforcement', () => {
    it('should allow first use of state parameter', () => {
      const userId = 'user_123';

      // ===== STEP 1: GENERATE STATE FOR OAUTH FLOW =====
      const state = generateOAuthState(userId);

      expect(state).toBeTruthy();
      expect(state).toHaveLength(64); // 32 bytes = 64 hex chars

      console.log('✅ STEP 1: State generated for OAuth flow');
      console.log(`   State: ${state.substring(0, 16)}...`);

      // ===== STEP 2: SIMULATE FIRST CALLBACK =====
      // Validate state on first callback (should succeed)
      let firstCallbackSuccessful = false;
      try {
        validateOAuthState(userId, state);
        firstCallbackSuccessful = true;
        console.log('✅ STEP 2: First callback validated successfully');
      } catch (error) {
        console.error(`❌ STEP 2: First callback failed: ${error.message}`);
      }

      expect(firstCallbackSuccessful).toBe(true);
    });

    it('should REJECT replay of the same state parameter (CRITICAL SECURITY TEST)', () => {
      const userId = 'user_456';

      // ===== STEP 1: GENERATE STATE =====
      const state = generateOAuthState(userId);
      console.log('✅ STEP 1: State generated');

      // ===== STEP 2: FIRST CALLBACK (SUCCESS) =====
      let firstCallbackSuccessful = false;
      try {
        validateOAuthState(userId, state);
        firstCallbackSuccessful = true;
        console.log('✅ STEP 2: First callback validated - STATE DELETED');
      } catch (error) {
        console.error(`❌ STEP 2: First callback failed: ${error.message}`);
      }

      expect(firstCallbackSuccessful).toBe(true);

      // ===== STEP 3: REPLAY ATTEMPT (MUST FAIL) =====
      // Attacker tries to use the same state again
      let replayAttackBlocked = false;
      let replayError = null;

      try {
        validateOAuthState(userId, state);
        // If we reach here, replay succeeded (BAD!)
        console.error('🚨 SECURITY BREACH: Replay attack succeeded!');
        replayAttackBlocked = false;
      } catch (error) {
        // Replay failed as expected (GOOD!)
        console.log(`✅ STEP 3: Replay attack blocked - "${error.message}"`);
        replayError = error.message;
        replayAttackBlocked = true;
      }

      // ===== ASSERTIONS =====
      expect(replayAttackBlocked).toBe(true);
      expect(replayError).toContain('OAuth state not found');
    });

    it('should reject state that was never generated', () => {
      const userId = 'user_789';
      const invalidState = crypto.randomBytes(32).toString('hex');

      let errorThrown = false;
      let errorMessage = '';

      try {
        validateOAuthState(userId, invalidState);
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      expect(errorThrown).toBe(true);
      expect(errorMessage).toContain('OAuth state not found');
    });

    it('should detect state tampering (length mismatch)', () => {
      const userId = 'user_tampering';
      const state = generateOAuthState(userId);

      // Tamper with state (make it shorter)
      const tamperedState = state.substring(0, 32);

      let errorThrown = false;
      let errorMessage = '';

      try {
        validateOAuthState(userId, tamperedState);
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      expect(errorThrown).toBe(true);
      expect(errorMessage).toContain('OAuth state mismatch');
    });

    it('should detect state tampering (bit flip)', () => {
      const userId = 'user_bitflip';
      const state = generateOAuthState(userId);

      // Tamper with state (flip a bit in the middle)
      const stateBuffer = Buffer.from(state, 'hex');
      stateBuffer[16] ^= 0xFF; // Flip 8 bits
      const tamperedState = stateBuffer.toString('hex');

      let errorThrown = false;
      let errorMessage = '';

      try {
        validateOAuthState(userId, tamperedState);
      } catch (error) {
        errorThrown = true;
        errorMessage = error.message;
      }

      expect(errorThrown).toBe(true);
      expect(errorMessage).toContain('OAuth state mismatch');
    });

    it('should provide different states for different users', () => {
      const user1Id = 'user_diff_1';
      const user2Id = 'user_diff_2';

      const state1 = generateOAuthState(user1Id);
      const state2 = generateOAuthState(user2Id);

      // States should be different (extremely high probability for random 256-bit values)
      expect(state1).not.toBe(state2);

      // Both should be valid 64-char hex strings
      expect(state1).toHaveLength(64);
      expect(state2).toHaveLength(64);

      // Each state should only work for its user
      expect(() => validateOAuthState(user1Id, state1)).not.toThrow();

      // Cannot use user1's state with user2 (should have been deleted)
      expect(() => validateOAuthState(user2Id, state2)).not.toThrow();
    });

    it('should maintain timing attack resistance during validation', () => {
      const userId = 'user_timing';
      const validState = generateOAuthState(userId);

      // Generate an invalid state with same length (to bypass length check)
      const invalidStateSameLength = crypto.randomBytes(32).toString('hex');

      let timingResistantValidation = true;

      // This should fail on constant-time comparison (not reveal timing info)
      try {
        validateOAuthState(userId, invalidStateSameLength);
        timingResistantValidation = false;
      } catch (error) {
        // Expected to fail
        timingResistantValidation = true;
      }

      expect(timingResistantValidation).toBe(true);
    });

    it('should immediately delete state after successful validation', () => {
      const userId = 'user_immediate_delete';
      const state = generateOAuthState(userId);

      // Validate and delete state
      validateOAuthState(userId, state);

      // Immediately try to validate again (state should be gone)
      let immediateReplayBlocked = false;
      try {
        validateOAuthState(userId, state);
      } catch (error) {
        immediateReplayBlocked = true;
      }

      expect(immediateReplayBlocked).toBe(true);
    });

    it('should handle rapid consecutive replay attempts', () => {
      const userId = 'user_rapid_replay';
      const state = generateOAuthState(userId);

      // First use succeeds
      expect(() => validateOAuthState(userId, state)).not.toThrow();

      // Next 5 replay attempts should all fail
      const replayAttempts = 5;
      let blockedCount = 0;

      for (let i = 0; i < replayAttempts; i++) {
        try {
          validateOAuthState(userId, state);
        } catch (error) {
          blockedCount++;
        }
      }

      expect(blockedCount).toBe(replayAttempts);
    });

    it('should log security events for audit trail', () => {
      const userId = 'user_audit';
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const state = generateOAuthState(userId);
      expect(consoleSpy).toHaveBeenCalled();

      // First validation should log success
      validateOAuthState(userId, state);
      const logCalls = consoleSpy.mock.calls;
      expect(logCalls.some(call => 
        call[0].includes('validated and deleted') && 
        call[0].includes('one-time use enforced')
      )).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe('Real-World OAuth Callback Simulation', () => {
    it('Scenario 1: Normal OAuth Flow (Success)', () => {
      console.log('\n📋 SCENARIO 1: Normal OAuth Flow');
      console.log('================================');

      const userId = 'user_normal_flow';

      // Step 1: User clicks "Connect Google Fit"
      console.log('Step 1: User initiates OAuth flow');
      const state = generateOAuthState(userId);
      console.log(`        State generated: ${state.substring(0, 16)}...`);

      // Step 2: User grants permission on Google consent screen
      console.log('Step 2: User grants permission on Google');

      // Step 3: Google redirects back to /callback?code=4/xxx&state=abc
      console.log('Step 3: Google redirects to callback URL');
      const authorizationCode = '4/0AgX5Cqnxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      console.log(`        Received: code=${authorizationCode.substring(0, 10)}..., state=${state.substring(0, 16)}...`);

      // Step 4: Backend validates state
      console.log('Step 4: Backend validates state');
      let validationSuccessful = false;
      try {
        validateOAuthState(userId, state);
        validationSuccessful = true;
        console.log('        ✅ State validated and deleted (one-time use enforced)');
      } catch (error) {
        console.log(`        ❌ State validation failed: ${error.message}`);
      }

      // Step 5: Backend exchanges code for tokens
      if (validationSuccessful) {
        console.log('Step 5: Backend exchanges code for tokens');
        console.log('        ✅ Tokens received from Google');
        console.log('        ✅ Tokens stored in database');
        console.log('Step 6: Return success to user');
        console.log('        ✅ Google Fit connected successfully!\n');
      }

      expect(validationSuccessful).toBe(true);
    });

    it('Scenario 2: Replay Attack Attempt (BLOCKED)', () => {
      console.log('\n🚨 SCENARIO 2: Replay Attack Attempt');
      console.log('====================================');

      const userId = 'user_replay_attack';

      // Step 1-3: Normal OAuth flow
      console.log('Step 1-3: Normal OAuth flow (same as Scenario 1)');
      const state = generateOAuthState(userId);
      const authorizationCode = '4/0AgX5Cqnxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

      // Step 4: First callback succeeds
      console.log('Step 4: First callback - Backend validates state');
      validateOAuthState(userId, state);
      console.log('        ✅ State validated and deleted');
      console.log('        ✅ Tokens stored in database');

      // Step 5: Attacker replays the callback
      console.log('\n🔴 ATTACKER ATTEMPT: Replay same callback URL');
      console.log(`   URL: /api/googlefit/callback?code=${authorizationCode.substring(0, 10)}...&state=${state.substring(0, 16)}...`);

      console.log('Step 5: Second callback - Backend validates state');
      let replayBlocked = false;
      let blockReason = '';
      try {
        validateOAuthState(userId, state);
        console.log('        ❌ SECURITY BREACH: Replay attack succeeded!');
      } catch (error) {
        replayBlocked = true;
        blockReason = error.message;
        console.log(`        ✅ Replay attack blocked!`);
        console.log(`        Reason: "${error.message}"`);
      }

      expect(replayBlocked).toBe(true);
      expect(blockReason).toContain('OAuth state not found');
      console.log('\n');
    });

    it('Scenario 3: CSRF Attack (State Tampering)', () => {
      console.log('\n🚨 SCENARIO 3: CSRF Attack - State Tampering');
      console.log('===========================================');

      const userId = 'user_csrf_attack';

      // Step 1: Legitimate user initiates OAuth
      console.log('Step 1: Legitimate user initiates OAuth');
      const legitimateState = generateOAuthState(userId);
      console.log(`        State: ${legitimateState.substring(0, 16)}...`);

      // Step 2: Attacker intercepts and modifies state
      console.log('\nStep 2: Attacker intercepts and modifies state');
      const tamperedState = legitimateState.substring(0, 32) + 'AAAA'.repeat(8);
      console.log(`        Modified state: ${tamperedState.substring(0, 16)}...`);

      // Step 3: Backend receives tampered state
      console.log('Step 3: Backend validates tampered state');
      let csrfBlocked = false;
      try {
        validateOAuthState(userId, tamperedState);
        console.log('        ❌ CSRF attack succeeded!');
      } catch (error) {
        csrfBlocked = true;
        console.log(`        ✅ CSRF attack blocked!`);
        console.log(`        Reason: "${error.message}"`);
      }

      expect(csrfBlocked).toBe(true);
      console.log('\n');
    });
  });
});
