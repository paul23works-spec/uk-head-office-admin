const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AITools = require('./src/lib/services/ai-tools.service.js');
// Wait, I need to compile TS or use ts-node.
// I'll just write a quick TS script and use ts-node.
