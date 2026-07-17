const fetch = require('node-fetch'); // we can just use native fetch if node > 18
async function test() {
  const response = await fetch("https://api.mercadolibre.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json"
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: "1597556409269940",
      client_secret: "invalid_secret",
      code: "fake_code",
      redirect_uri: "https://prueba.n-sistemas.com/api/auth/mercadolibre/callback"
    })
  });
  const data = await response.json();
  console.log("Status:", response.status);
  console.log("Response:", data);
}
test();
