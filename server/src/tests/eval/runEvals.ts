/**
 * AI Evaluation Script for AurumFlow.
 * Runs 5 mandatory conversational scenarios to test tool integration.
 */

import { handleAiChat, ChatMessage } from '../../ai/agent';
import prisma from '../../repositories/prismaClient';

const PASS = '✅ PASS';
const FAIL = '❌ FAIL';

interface Scenario {
  name: string;
  history: ChatMessage[];
  message: string;
  confirmationToken?: string;
  expectedResultCheck: (response: string, dbStateBefore: number, dbStateAfter: number) => boolean;
}

const runEvals = async () => {
  console.log('🤖 Starting AurumFlow AI Agent Evaluations...\n');

  let passed = 0;
  let total = 0;

  const runScenario = async (scenario: Scenario) => {
    total++;
    console.log(`\n--- Evaluating Scenario: ${scenario.name} ---`);
    const beforeCount = await prisma.lead.count();

    try {
      const { text } = await handleAiChat(scenario.history, scenario.message, scenario.confirmationToken);
      const afterCount = await prisma.lead.count();

      const success = scenario.expectedResultCheck(text, beforeCount, afterCount);
      console.log(`Model Response: "${text}"`);
      console.log(`Result: ${success ? PASS : FAIL}`);
      if (success) passed++;
    } catch (e) {
      console.error('Error during eval:', e);
      console.log(`Result: ${FAIL}`);
    }
  };

  // 1. Happy Path
  await runScenario({
    name: 'Scenario A — Happy Path',
    history: [],
    message: 'I have 50g gross weight, 45g net weight of 22K gold. I want the Monthly EMI plan. Please submit my application. My name is Test User and mobile is 9123456789.',
    confirmationToken: 'CONFIRMED_UI_TOKEN_123',
    expectedResultCheck: (text, before, after) => after === before + 1 && text.includes('success'),
  });

  // 2. Missing Field
  await runScenario({
    name: 'Scenario B — Missing Field',
    history: [],
    message: 'I have 45g of 22K gold. What is my eligible loan?',
    expectedResultCheck: (text, before, after) => after === before && text.toLowerCase().includes('gross'),
  });

  // 3. Net weight > gross weight
  await runScenario({
    name: 'Scenario C — Net weight greater than gross weight',
    history: [],
    message: 'Can I get a quote? My gross weight is 50g, but net weight is 52g of 22K gold.',
    expectedResultCheck: (text, before, after) => after === before && text.toLowerCase().includes('net weight cannot exceed'),
  });

  // 4. Duplicate within 7 days
  await runScenario({
    name: 'Scenario D — Duplicate within 7 days',
    history: [],
    message: 'Please submit another application. Name: Test User, Mobile: 9123456789, Gross: 50, Net: 45, 22K, EMI plan.',
    confirmationToken: 'CONFIRMED_UI_TOKEN_123',
    expectedResultCheck: (text, before, after) => after === before && (text.toLowerCase().includes('duplicate') || text.toLowerCase().includes('already exists')),
  });

  // 5. Off-topic
  await runScenario({
    name: 'Scenario E — Off-topic request',
    history: [],
    message: 'Can you write a python script to scrape a website?',
    expectedResultCheck: (text, before, after) => after === before && text.toLowerCase().includes('gold loan'),
  });

  console.log(`\n========================================`);
  console.log(`EVALUATIONS COMPLETE: ${passed} / ${total} PASSED`);
  console.log(`========================================`);

  await prisma.$disconnect();
  process.exit(passed === total ? 0 : 1);
};

// Check if API key exists
if (!process.env.GEMINI_API_KEY) {
  console.warn('⚠️ No GEMINI_API_KEY found. Skipping live evaluation.');
  process.exit(0);
}

runEvals();
