const { SignJWT } = require('jose');

async function main() {
  const secretKey = new TextEncoder().encode(
    process.env.AUTH_SECRET || 'super_secret_key_change_me_in_production'
  );

  const token = await new SignJWT({ employeeId: '41c09426-dbf4-4596-a7d0-3367bd69c01f' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);

  const tests = [
    { name: "1. General Knowledge", content: "What is the capital of France? Please just tell me the answer directly without searching." },
    { name: "2. Current Events", content: "What is the top news headline globally today? Please search the web for the latest." },
    { name: "3. Internal UK Enterprise", content: "What projects are currently active in our system?" },
    { name: "4. Mixed Question", content: "What are our current active projects in our system, and also what is the current price of Bitcoin?" }
  ];

  for (const test of tests) {
    console.log(`\n--- RUNNING TEST: ${test.name} ---`);
    console.log(`Query: ${test.content}`);
    
    const response = await fetch('http://localhost:3001/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `auth_session=${token}`
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: test.content }]
      })
    });

    const data = await response.json();
    console.log(`Response:`);
    console.log(JSON.stringify(data, null, 2));
  }
}

main().catch(console.error);
