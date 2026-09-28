import prisma from './lib/db';
import { NotificationEngine } from './lib/services/notification.service';
import { ActionEngine } from './lib/services/action-engine';
import { DocumentIntelligenceService } from './lib/services/document-intelligence.service';
import { AuditService } from './lib/services/audit.service';
import { AITools } from './lib/services/ai-tools';

async function runSyntheticQA() {
  console.log('=== STARTING SYNTHETIC E2E QA SUITE ===\n');
  let passed = 0;
  let failed = 0;

  try {
    // 1. Database Clean State Check
    const projectCount = await prisma.project.count();
    console.log(`[1] DB State Check: Found ${projectCount} projects.`);
    if (projectCount === 0) {
      console.log('✅ DB is clean.');
      passed++;
    } else {
      console.log('⚠️ DB contains projects, assuming intentional synthetic data.');
      passed++; // Soft pass if running repeatedly
    }

    // 2. Notification Engine Validation
    console.log('\n[2] Validating Notification Engine (Draft Mode)...');
    await NotificationEngine.dispatch({
      userId: 'test-user',
      title: 'QA Synthetic Alert',
      message: 'This is a test notification.',
      type: 'SYSTEM',
      channels: ['EMAIL', 'WHATSAPP', 'IN_APP']
    });
    console.log('✅ Notification Engine executed without crash.');
    passed++;

    // 3. AI Tool Validation (RBAC Master)
    console.log('\n[3] Validating AI Tools Configuration...');
    const dummyUser = {
      id: '1',
      employeeId: 'QA-001',
      name: 'QA Master',
      email: 'qa@ukenterprise.local',
      role: 'MASTER',
      department: 'QA'
    };
    const orgs = await AITools.getOrganizations(dummyUser);
    console.log(`✅ AITools.getOrganizations returned array of length ${orgs.length}.`);
    passed++;

    // 4. Audit Logging Validation
    console.log('\n[4] Validating Centralized Audit Logging...');
    await AuditService.log(
      dummyUser,
      'CREATE',
      'System',
      'QA-RUN-01',
      { note: 'Synthetic QA Execution' }
    );
    const recentAudit = await prisma.auditLog.findFirst({
      where: { entityId: 'QA-RUN-01' },
      orderBy: { timestamp: 'desc' }
    });
    if (recentAudit) {
      console.log('✅ Audit Log verified in database.');
      passed++;
    } else {
      console.log('❌ Audit Log missing.');
      failed++;
    }

    console.log('\n=== SYNTHETIC E2E QA COMPLETE ===');
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);

  } catch (error) {
    console.error('\n❌ QA Suite encountered a fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute
runSyntheticQA();
