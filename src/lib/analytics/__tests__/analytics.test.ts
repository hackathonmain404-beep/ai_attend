/**
 * AttendGuard Analytics Engine - Automated Unit Test Suite
 * Tests deterministic attendance calculations, edge cases, projections, and risk tiers.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  calculateAttendance,
  calculateRequiredClasses,
  calculateSafeMisses,
  calculateRiskLevel,
  calculateAttendanceTrend,
  calculateSubjectAnalytics,
  DEFAULT_ANALYTICS_POLICY,
} from '../index.ts';

describe('1. Attendance Percentage Tests (calculateAttendance)', () => {
  it('handles standard fractions correctly', () => {
    assert.strictEqual(calculateAttendance(0, 10), 0);
    assert.strictEqual(calculateAttendance(5, 10), 50.0);
    assert.strictEqual(calculateAttendance(17, 25), 68.0);
    assert.strictEqual(calculateAttendance(75, 100), 75.0);
    assert.strictEqual(calculateAttendance(100, 100), 100.0);
  });

  it('handles 0 / 0 edge case without NaN', () => {
    assert.strictEqual(calculateAttendance(0, 0), 0);
  });

  it('rejects negative numbers and invalid states', () => {
    assert.throws(() => calculateAttendance(-1, 10), RangeError);
    assert.throws(() => calculateAttendance(5, -10), RangeError);
    assert.throws(() => calculateAttendance(11, 10), RangeError); // attended > total
  });

  it('rounds floating decimals to 1 decimal place cleanly', () => {
    // 1 / 3 = 33.3333...% -> 33.3%
    assert.strictEqual(calculateAttendance(1, 3), 33.3);
    // 2 / 3 = 66.6666...% -> 66.7%
    assert.strictEqual(calculateAttendance(2, 3), 66.7);
  });
});

describe('2. Required Classes Projections (calculateRequiredClasses)', () => {
  it('calculates required classes for realistic deficit (17/25 aiming for 75%)', () => {
    // Current: 17/25 = 68%. Needs 7 classes: (17+7)/(25+7) = 24/32 = 75.0%
    const needed = calculateRequiredClasses(17, 25, 75);
    assert.strictEqual(needed, 7);
  });

  it('returns 0 when already meeting or exceeding target', () => {
    // Current: 80/100 = 80% (target 75%) -> 0 needed
    assert.strictEqual(calculateRequiredClasses(80, 100, 75), 0);
    // Current: 75/100 = 75% (target 75%) -> 0 needed
    assert.strictEqual(calculateRequiredClasses(75, 100, 75), 0);
  });

  it('handles low attendance recovery', () => {
    // Current: 5/20 = 25%. Target 75%.
    // Formula: (75*20 - 100*5) / (100 - 75) = (1500 - 500) / 25 = 1000 / 25 = 40 classes.
    // Check: (5+40)/(20+40) = 45/60 = 75.0%
    assert.strictEqual(calculateRequiredClasses(5, 20, 75), 40);
  });

  it('handles edge case when target is 100% and a class was missed', () => {
    // 9/10 = 90%. Target 100%. Reaching 100% is impossible after a miss.
    assert.strictEqual(calculateRequiredClasses(9, 10, 100), Infinity);
    // 10/10 = 100%. Target 100%. Already at 100% -> 0 needed
    assert.strictEqual(calculateRequiredClasses(10, 10, 100), 0);
  });
});

describe('3. Safe-to-Miss Projections (calculateSafeMisses)', () => {
  it('calculates safe misses when comfortably above threshold (41/50 at 75% target)', () => {
    // Current: 41/50 = 82%.
    // Missing 4 classes: 41 / (50 + 4) = 41 / 54 = 75.92% >= 75%
    // Missing 5 classes: 41 / (50 + 5) = 41 / 55 = 74.54% < 75%
    // Therefore safe misses must be exactly 4.
    const misses = calculateSafeMisses(41, 50, 75);
    assert.strictEqual(misses, 4);
  });

  it('returns 0 when below or exactly at boundary', () => {
    // 17/25 = 68% (< 75%) -> cannot miss any
    assert.strictEqual(calculateSafeMisses(17, 25, 75), 0);
    // 75/100 = 75% (target 75%). Missing 1 makes it 75/101 = 74.2% -> cannot miss any
    assert.strictEqual(calculateSafeMisses(75, 100, 75), 0);
  });

  it('handles 100% attendance safe misses', () => {
    // 20/20 = 100%. Target 75%.
    // m <= (2000 - 75*20) / 75 = (2000 - 1500) / 75 = 500 / 75 = 6.666 -> 6 misses.
    // Check: 20 / 26 = 76.9% >= 75%. 20 / 27 = 74.07% < 75%.
    assert.strictEqual(calculateSafeMisses(20, 20, 75), 6);
  });
});

describe('4. Risk Level Evaluation (calculateRiskLevel)', () => {
  it('classifies tiers properly under standard policy (safe >= 80%, critical < 75%)', () => {
    assert.strictEqual(calculateRiskLevel(85, 75), 'SAFE');
    assert.strictEqual(calculateRiskLevel(80, 75), 'SAFE');
    assert.strictEqual(calculateRiskLevel(79.9, 75), 'AT_RISK');
    assert.strictEqual(calculateRiskLevel(75, 75), 'AT_RISK');
    assert.strictEqual(calculateRiskLevel(74.9, 75), 'CRITICAL');
    assert.strictEqual(calculateRiskLevel(50, 75), 'CRITICAL');
    assert.strictEqual(calculateRiskLevel(0, 75), 'CRITICAL');
  });
});

describe('5. Trend Detection (calculateAttendanceTrend)', () => {
  it('detects improving trajectory', () => {
    assert.strictEqual(calculateAttendanceTrend(76.0, 74.5), 'improving');
  });

  it('detects declining trajectory', () => {
    assert.strictEqual(calculateAttendanceTrend(74.0, 75.2), 'declining');
  });

  it('detects stable status within tolerance deadband', () => {
    assert.strictEqual(calculateAttendanceTrend(75.2, 75.0), 'stable');
    assert.strictEqual(calculateAttendanceTrend(75.0, 75.0), 'stable');
  });
});

describe('6. Batch Subject Analytics (calculateSubjectAnalytics)', () => {
  it('processes multiple subjects accurately into structured objects', () => {
    const input = [
      {
        subjectId: 'sub-1',
        subjectName: 'C Programming',
        attended: 17,
        total: 25,
        requiredPercentage: 75,
      },
      {
        subjectId: 'sub-2',
        subjectName: 'Physics',
        attended: 41,
        total: 50,
        requiredPercentage: 75,
      },
    ];

    const results = calculateSubjectAnalytics(input);

    assert.strictEqual(results.length, 2);

    // Subject 1: C Programming
    assert.strictEqual(results[0].subjectName, 'C Programming');
    assert.strictEqual(results[0].percentage, 68.0);
    assert.strictEqual(results[0].riskLevel, 'CRITICAL');
    assert.strictEqual(results[0].classesNeeded, 7);
    assert.strictEqual(results[0].safeMisses, 0);

    // Subject 2: Physics
    assert.strictEqual(results[1].subjectName, 'Physics');
    assert.strictEqual(results[1].percentage, 82.0);
    assert.strictEqual(results[1].riskLevel, 'SAFE');
    assert.strictEqual(results[1].classesNeeded, 0);
    assert.strictEqual(results[1].safeMisses, 4);
  });
});
