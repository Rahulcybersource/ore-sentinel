const axios = require('axios');

async function testTimestamps() {
  const url = `https://vedas.sac.gov.in/ridam_server3/meta/dataset_timestamp?prefix=T3S1P1`;
  try {
    const response = await axios.get(url);
    console.log("Timestamps available:", Object.keys(response.data.result || {}).length > 0 ? "Yes" : "No");
    if (response.data.result && response.data.result['T3S1P1']) {
      const ts = response.data.result['T3S1P1'];
      console.log("Number of timestamps:", ts.length);
      console.log("First 5:", ts.slice(0, 5));
      console.log("Last 5:", ts.slice(-5));
    } else {
      console.log(response.data);
    }
  } catch (error) {
    console.error(error.message);
  }
}
testTimestamps();
