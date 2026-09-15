const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function testVedas() {
  const apiKey = process.env.ISRO_VEDAS_API_KEY;
  const url = `https://vedas.sac.gov.in/vapi/ridam_server3/info/?X-API-KEY=${apiKey}`;
  
  // Try numbers for lat/lon, different layer if needed? No, let's just try numbers
  const payload = {
    layer: "T5S1I1", // Maybe it doesn't need layer? 
    args: {
      dataset_id: "T3S1P1",
      from_time: "20230101",
      to_time: "20231231",
      param: "NDVI",
      lon: 80.20,
      lat: 21.80,
      filter_nodata: "no",
      composite: false
    }
  };

  try {
    const response = await axios.post(url, payload);
    console.log("Payload:", payload);
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
