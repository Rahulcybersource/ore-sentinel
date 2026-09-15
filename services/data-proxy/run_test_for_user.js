const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config();

async function runTest() {
  const apiKey = process.env.ISRO_VEDAS_API_KEY;
  const url = `https://vedas.sac.gov.in/vapi/ridam_server3/info/?X-API-KEY=[REDACTED]`;
  
  const payload = {
    layer: "T5S1I1",
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
    console.log("--- VEDAS API DEBUG LOG ---");
    console.log("Endpoint:", url);
    console.log("Request Payload:", JSON.stringify(payload, null, 2));
    
    const response = await axios.post(`https://vedas.sac.gov.in/vapi/ridam_server3/info/?X-API-KEY=${apiKey}`, payload);
    console.log("HTTP Status:", response.status);
    console.log("Response Body (first 3 entries):", JSON.stringify({ result: response.data.result.slice(0,3), status: response.data.status }, null, 2));
    
    // Simulate Parsing
    const parsed = response.data.result.slice(0,3).map(entry => {
      const [dateStr, value] = entry;
      const timestamp = new Date(dateStr).getTime();
      const val = Array.isArray(value) ? value[0] : value;
      return { timestamp, value: val !== null ? val : 0, dateStr: new Date(dateStr).toLocaleDateString() };
    });
    console.log("Parsed Response:", JSON.stringify(parsed, null, 2));

  } catch (error) {
    console.log("Error:", error.message);
  }
}
runTest();
