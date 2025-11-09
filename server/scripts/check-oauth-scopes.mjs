import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';

(async () => {
  await connectDB();
  
  const user = await User.findOne({ googleFitConnected: true }).select('+googleFitTokens');
  
  if (!user) {
    console.log('❌ No user with Google Fit connected');
    process.exit(1);
  }
  
  console.log(`\n👤 User: ${user.email}`);
  console.log(`✅ Google Fit Connected: ${user.googleFitConnected}`);
  
  const tokens = user.googleFitTokens;
  console.log(`\n🔑 OAuth Tokens:`);
  console.log(`   Access Token: ${tokens.access_token ? tokens.access_token.substring(0, 50) + '...' : 'NOT SET'}`);
  console.log(`   Refresh Token: ${tokens.refresh_token ? tokens.refresh_token.substring(0, 50) + '...' : 'NOT SET'}`);
  
  const now = new Date();
  const expiresAt = new Date(tokens.token_expiry);
  const isExpired = now > expiresAt;
  
  console.log(`\n⏱️  Token Expiry:`);
  console.log(`   Expires At: ${expiresAt.toISOString()}`);
  console.log(`   Current Time: ${now.toISOString()}`);
  console.log(`   Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);
  
  if (isExpired) {
    console.log(`   ⚠️  Token has expired and needs refresh!`);
  } else {
    const minsLeft = Math.round((expiresAt - now) / 1000 / 60);
    console.log(`   ✅ ${minsLeft} minutes remaining`);
  }
  
  console.log(`\n📋 Token Scopes from OAuth:`);
  const grantedScopes = tokens.scope ? tokens.scope.split(' ') : [];
  const expectedScopes = [
    'https://www.googleapis.com/auth/fitness.activity.read',
    'https://www.googleapis.com/auth/fitness.body.read',
    'https://www.googleapis.com/auth/fitness.nutrition.read',
    'https://www.googleapis.com/auth/fitness.sleep.read',
    'https://www.googleapis.com/auth/fitness.location.read',
  ];
  
  expectedScopes.forEach(scope => {
    const has = grantedScopes.includes(scope);
    const shortName = scope.split('/').pop();
    console.log(`   ${has ? '✅' : '❌'} ${shortName}`);
  });
  
  if (grantedScopes.length > expectedScopes.length) {
    console.log(`\n📌 Additional scopes granted:`);
    grantedScopes.forEach(scope => {
      if (!expectedScopes.includes(scope)) {
        console.log(`   ✅ ${scope}`);
      }
    });
  }
  
  console.log('\n');
  process.exit(0);
})().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
