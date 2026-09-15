const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function testVedas() {
  const apiKey = process.env.ISRO_VEDAS_API_KEY;
  if (!apiKey) {
    console.error("Missing ISRO_VEDAS_API_KEY in .env");
    return;
  }
  
  // Test current implementation
  const url = `https://vedas.sac.gov.in/vapi/ridam_server3/info/`;
  // The user said: "authentication header (X-API-KEY)". Let's test passing it in header instead.
  
  const payload = {
    layer: "T5S1I1",
    args: {
      dataset_id: "T3S1P1",
      from_time: "20230101",
      to_time: "20231231",
      param: "NDVI",
      lon: "80.20", // Balaghat approx
      lat: "21.80",
      filter_nodata: "no",
      composite: false
    }
  };

  try {
    console.log("Endpoint:", url);
    console.log("Headers: X-API-KEY=[REDACTED]");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    
    // Trying header instead of query param
    const response = await axios.post(url, payload, {
      headers: {
        'X-API-KEY': apiKey
      }
    });
    
    console.log("HTTP Status:", response.status);
    console.log("Response Data:", JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response) {
      console.log("HTTP Status:", error.response.status);
      console.log("Error Data:", JSON.stringify(error.response.data, null, 2));
    } else {
      console.error("Error:", error.message);
    }
  }
}

testVedas();
