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
    { name: "1. Empty State", content: "Can you list all my active projects?" },
    { name: "2. Graceful Failure", content: "Can you show me the summary for project ID '00000000-0000-0000-0000-000000000000'?" },
    { name: "3. Multi-turn Clarification", content: "Can you show me the documents for my project?" }
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
