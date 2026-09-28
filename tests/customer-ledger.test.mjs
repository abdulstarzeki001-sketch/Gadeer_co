import test from 'node:test';
import assert from 'node:assert/strict';
import { customerBalance, isDebtIncrease } from '../src/lib/customer-ledger.ts';

test('later customer collection reduces invoice balance after initial payment', () => {
  assert.equal(customerBalance([
    { type: 'charge', amount: 1000 },
    { type: 'receipt', amount: 200 },
    { type: 'تحصيل من عميل', amount: 300 },
  ]), 500);
});
test('Iraqi and Turkish load charges remain payable after collections', () => {
  assert.equal(customerBalance([
    { type: 'income', amount: '700' },
    { type: 'turkish_load_receipt', amount: 300 },
    { type: 'تحصيل من عميل', amount: 400 },
  ]), 600);
});
test('payment labels reduce debt and load receipt increases it', () => {
  for (const type of ['receipt', 'payment', 'قبض من عميل', 'تحصيل من عميل']) assert.equal(isDebtIncrease(type), false);
  for (const type of ['charge', 'income', 'turkish_load_receipt']) assert.equal(isDebtIncrease(type), true);
});
test('full payment clears cents exactly and overpayment remains customer credit', () => {
  assert.equal(customerBalance([{type:'charge',amount:0.3},{type:'receipt',amount:0.1},{type:'تحصيل من عميل',amount:0.2}]),0);
  assert.equal(customerBalance([{type:'charge',amount:100},{type:'تحصيل من عميل',amount:120}]),-20);
});
