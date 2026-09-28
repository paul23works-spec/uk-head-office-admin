const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function testBranding() {
  console.log('=== UK ENTERPRISE BRANDING VERIFICATION ===\n');

  // 1. Authoritative image assets
  console.log('1. Checking Authoritative Brand Assets...');
  const pngPath = path.join(__dirname, '../public/images/uk-group-logo.png');
  const jpgPath = path.join(__dirname, '../public/images/uk-group-logo.jpg');

  if (!fs.existsSync(pngPath)) throw new Error('uk-group-logo.png is missing!');
  if (!fs.existsSync(jpgPath)) throw new Error('uk-group-logo.jpg is missing!');

  const pngMeta = await sharp(pngPath).metadata();
  console.log(`   ✓ Image confirmed: ${pngMeta.width}x${pngMeta.height}, ${pngMeta.format}`);
  if (pngMeta.width !== 1024 || pngMeta.height !== 1024) throw new Error('Altered dimensions!');

  // 2. Login Page Branding
  console.log('\n2. Checking Login Page Branding...');
  const loginFile = path.join(__dirname, '../src/app/login/page.tsx');
  const loginCode = fs.readFileSync(loginFile, 'utf8');

  if (loginCode.includes('<Shield')) {
    throw new Error('Generic Shield icon is still present in Login Page!');
  }
  if (!loginCode.includes('/images/uk-group-logo.png')) {
    throw new Error('Authoritative UK GROUP logo is missing from Login Page!');
  }
  console.log('   ✓ Generic Shield icon removed.');
  console.log('   ✓ Authoritative UK GROUP logo asset configured in Login header.');

  // 3. Application Shell / Sidebar Branding
  console.log('\n3. Checking Application Shell / Sidebar Branding...');
  const sidebarFile = path.join(__dirname, '../src/components/layout/Sidebar.tsx');
  const sidebarCode = fs.readFileSync(sidebarFile, 'utf8');

  if (sidebarCode.includes('from-blue-600 to-blue-800') && sidebarCode.includes('>UK<')) {
    throw new Error('Generic blue "UK" square is still present in Sidebar!');
  }
  if (!sidebarCode.includes('/images/uk-group-logo.png')) {
    throw new Error('Authoritative UK GROUP logo is missing from Sidebar!');
  }
  console.log('   ✓ Generic blue "UK" square icon removed.');
  console.log('   ✓ Authoritative UK GROUP logo asset configured in Sidebar brand header.');

  // 4. Header Branding
  console.log('\n4. Checking Header Responsiveness...');
  const headerFile = path.join(__dirname, '../src/components/layout/Header.tsx');
  const headerCode = fs.readFileSync(headerFile, 'utf8');
  if (!headerCode.includes('/images/uk-group-logo.png')) {
    throw new Error('Responsive logo missing from Header!');
  }
  console.log('   ✓ Header mobile responsive branding verified.');

  // 5. UK ENTERPRISE User-Facing Text Check
  console.log('\n5. Checking UK ENTERPRISE User-Facing Text Across Key Touchpoints...');
  const appShellFile = path.join(__dirname, '../src/components/layout/AppShell.tsx');
  const appShellCode = fs.readFileSync(appShellFile, 'utf8');
  const brandIntroFile = path.join(__dirname, '../src/components/common/BrandIntro.tsx');
  const brandIntroCode = fs.readFileSync(brandIntroFile, 'utf8');
  const pageFile = path.join(__dirname, '../src/app/page.tsx');
  const pageCode = fs.readFileSync(pageFile, 'utf8');
  const layoutFile = path.join(__dirname, '../src/app/layout.tsx');
  const layoutCode = fs.readFileSync(layoutFile, 'utf8');

  if (!loginCode.includes('UK Enterprise Admin')) throw new Error('Login page missing UK Enterprise Admin');
  if (!sidebarCode.includes('UK ENTERPRISE')) throw new Error('Sidebar missing UK ENTERPRISE');
  if (!headerCode.includes('UK Enterprise')) throw new Error('Header missing UK Enterprise');
  if (!appShellCode.includes('UK ENTERPRISE')) throw new Error('AppShell footer missing UK ENTERPRISE');
  if (!brandIntroCode.includes('UK Enterprise')) throw new Error('BrandIntro missing UK Enterprise');
  if (!pageCode.includes('UK ENTERPRISE')) throw new Error('Dashboard page missing UK ENTERPRISE');
  if (!layoutCode.includes('UK ENTERPRISE')) throw new Error('Layout metadata missing UK ENTERPRISE');
  console.log('   ✓ All 7 user-facing touchpoints correctly display UK ENTERPRISE.');

  console.log('\nALL BRANDING VERIFICATION CHECKS PASSED!');
}

testBranding().catch(err => {
  console.error('VERIFICATION FAILED:', err);
  process.exit(1);
});
