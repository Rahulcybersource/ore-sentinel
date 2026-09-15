const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function testVedasMeta() {
  const apiKey = process.env.ISRO_VEDAS_API_KEY;
  // Let's try to get metadata for datasets
  const url = `https://vedas.sac.gov.in/vapi/ridam_server3/meta/datasets?X-API-KEY=${apiKey}`;
  
  try {
    const response = await axios.get(url);
    if (response.data && response.data.result) {
        console.log("Found datasets:", response.data.result.length);
        console.log(response.data.result.slice(0, 5));
    } else {
        console.log(response.data);
    }
  } catch (error) {
    console.error(error.message);
  }
}
testVedasMeta();
