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
    { name: "1. Internal Query", content: "What is the BOQ value of Project X?" },
    { name: "2. General Knowledge Query", content: "What is quantum computing?" },
    { name: "3. Current-Events Query", content: "Who won yesterday's football match?" },
    { name: "4. Mixed Query", content: "Give me our current project status and explain what's happening in the global power industry." }
  ];

  for (const test of tests) {
    console.log(`\n--- RUNNING TEST: ${test.name} ---`);
    console.log(`Query: ${test.content}`);
    
    try {
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
    } catch (err) {
      console.error('Fetch error:', err.message);
    }
  }
}

main().catch(console.error);
