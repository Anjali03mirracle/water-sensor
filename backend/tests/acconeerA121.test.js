// tests/acconeerA121.test.js
import test from 'node:test';
import assert from 'node:assert';
import { acconeerAdapter } from '../src/services/acconeerA121Adapter.js';

test('AcconeerA121Adapter - calculate water level geometry', () => {
  // Mounting height: 5.2m, Tank height: 5.0m
  // When radar measures distance = 1.2m to water surface:
  // Water level = 5.2 - 1.2 = 4.0m
  // Percentage = (4.0 / 5.0) * 100 = 80.0%
  const result = acconeerAdapter.calculateWaterLevel(1.2);
  assert.strictEqual(result.waterLevelMeters, 4.0);
  assert.strictEqual(result.waterLevelPercentage, 80.0);
  assert.strictEqual(result.status, 'NORMAL');

  // Critical high water level: distance = 0.5m -> level = 4.7m (94% -> HIGH)
  const highResult = acconeerAdapter.calculateWaterLevel(0.5);
  assert.strictEqual(highResult.status, 'HIGH');

  // Low water level: distance = 4.5m -> level = 0.7m (14% -> LOW)
  const lowResult = acconeerAdapter.calculateWaterLevel(4.5);
  assert.strictEqual(lowResult.status, 'LOW');
});
