// Quick health check
import fetch from 'node-fetch';

try {
  const response = await fetch('http://localhost:5000/api/health');
  const data = await response.json();
  console.log('✅ Backend is running');
  console.log(JSON.stringify(data, null, 2));
} catch (error) {
  console.log('❌ Backend is NOT running');
  console.log('Error:', error.message);
}
