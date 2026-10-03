const { SignJWT } = require('jose');

async function main() {
  const secretKey = new TextEncoder().encode(
    process.env.AUTH_SECRET || 'super_secret_key_change_me_in_production'
  );

  // user.employeeId (UUID of the employee record)
  const token = await new SignJWT({ employeeId: '41c09426-dbf4-4596-a7d0-3367bd69c01f' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(secretKey);

  console.log('Generated token:', token);

  const response = await fetch('http://localhost:3000/api/ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': `auth_session=${token}`
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: 'What are our current projects, what organizations are registered, and what are the system notifications?' }
      ]
    })
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main().catch(console.error);
