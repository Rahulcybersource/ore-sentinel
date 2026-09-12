import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function verify() {
  console.log('Verifying Copernicus OAuth...');
  try {
    const copResp = await axios.post('https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token', 
      new URLSearchParams({
        client_id: process.env.COPERNICUS_CLIENT_ID || '',
        client_secret: process.env.COPERNICUS_CLIENT_SECRET || '',
        grant_type: 'client_credentials'
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    console.log('[SUCCESS] Copernicus Client ID & Secret generated a valid token.');
  } catch(e: any) {
    console.log('[FAILED] Copernicus authentication failed:', e.response?.data || e.message);
  }

  console.log('\nVerifying NASA Earthdata Token structure...');
  const token = process.env.NASA_EARTHDATA_TOKEN || '';
  if(token.split('.').length === 3) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString('utf8'));
      console.log('[SUCCESS] NASA Token is a valid JWT. Issued to UID:', payload.uid);
      console.log('NASA Token Issuer:', payload.iss);
    } catch(e) {
      console.log('[FAILED] NASA Token could not be parsed as a JWT.');
    }
  } else {
    console.log('[FAILED] NASA Token does not look like a 3-part JWT.');
  }
}
verify();
