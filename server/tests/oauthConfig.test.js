
import oauthConfig, {
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    GOOGLE_FIT_OAUTH_SCOPE,
    SYNC_WORKER_CONFIG,
    GOOGLE_FIT_CONFIG,
    OAUTH_STATE_CONFIG,
    TOKEN_CONFIG,
    SCOPE_VALIDATION
} from '../src/config/oauth.config.js';
import dotenv from 'dotenv';

dotenv.config();

const runTest = async () => {
    console.log('🧪 Starting OAuth Configuration Test...');

    const originalExit = process.exit;
    process.exit = (code) => {
        console.error(`❌ Process exited with code: ${code}`);
        throw new Error(`Process exited with code ${code}`);
    };

    try {
        // 1. Verify Environment Variables Loading
        console.log('🔄 Verifying Environment Variables...');
        if (process.env.GOOGLE_CLIENT_ID) {
            console.log('✅ GOOGLE_CLIENT_ID is set.');
        } else {
            console.warn('⚠️ GOOGLE_CLIENT_ID is NOT set in environment.');
        }

        if (process.env.GOOGLE_CLIENT_SECRET) {
            console.log('✅ GOOGLE_CLIENT_SECRET is set.');
        } else {
            console.warn('⚠️ GOOGLE_CLIENT_SECRET is NOT set in environment.');
        }

        // 2. Verify Exported Constants
        console.log('🔄 Verifying Exported Constants...');

        if (GOOGLE_CLIENT_ID === process.env.GOOGLE_CLIENT_ID) {
            console.log('✅ GOOGLE_CLIENT_ID matches process.env');
        } else {
            console.error('❌ GOOGLE_CLIENT_ID mismatch');
        }

        if (GOOGLE_REDIRECT_URI) {
            console.log(`✅ GOOGLE_REDIRECT_URI: ${GOOGLE_REDIRECT_URI}`);
        } else {
            console.error('❌ GOOGLE_REDIRECT_URI is missing');
        }

        if (GOOGLE_FIT_OAUTH_SCOPE && typeof GOOGLE_FIT_OAUTH_SCOPE === 'string') {
            console.log('✅ GOOGLE_FIT_OAUTH_SCOPE is defined and is a string');
        } else {
            console.error('❌ GOOGLE_FIT_OAUTH_SCOPE is invalid');
        }

        // 3. Verify Configurations Objects
        console.log('🔄 Verifying Configuration Objects...');

        // Sync Worker Config
        if (SYNC_WORKER_CONFIG.cronSchedule && SYNC_WORKER_CONFIG.batchSize) {
            console.log('✅ SYNC_WORKER_CONFIG is valid');
            console.log(`   - Enabled: ${SYNC_WORKER_CONFIG.enabled}`);
            console.log(`   - Schedule: ${SYNC_WORKER_CONFIG.cronSchedule}`);
        } else {
            console.error('❌ SYNC_WORKER_CONFIG is invalid');
        }

        // Google Fit Config
        if (GOOGLE_FIT_CONFIG.apiBaseUrl && GOOGLE_FIT_CONFIG.apiTimeout) {
            console.log('✅ GOOGLE_FIT_CONFIG is valid');
        } else {
            console.error('❌ GOOGLE_FIT_CONFIG is invalid');
        }

        // Validation Rules
        if (SCOPE_VALIDATION.requiredScopes && Array.isArray(SCOPE_VALIDATION.requiredScopes)) {
            console.log('✅ SCOPE_VALIDATION is valid');
        } else {
            console.error('❌ SCOPE_VALIDATION is invalid');
        }

        // 4. Verify Default Export
        console.log('🔄 Verifying Default Export...');
        if (oauthConfig.google && oauthConfig.syncWorker && oauthConfig.token) {
            console.log('✅ Default export object structure is valid');
        } else {
            console.error('❌ Default export object structure is invalid');
        }

        console.log('🎉 OAuth Configuration Test Completed Successfully!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        process.exit = originalExit;
    }
};

runTest();
