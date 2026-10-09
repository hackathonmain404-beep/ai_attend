import { describe, it, expect, vi } from 'vitest';
import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { ScanResultModal } from '@/components/student/ScanResultModal';
import StudentSecurityPage from '@/app/student/security/page';

describe('WebAuthn Frontend Verification UI States (src/components/student/ScanResultModal.tsx)', () => {
  const dummyOnScanAgain = vi.fn();
  const dummyOnClose = vi.fn();

  it('renders null for ready, idle, and scanning states (delegated to viewfinder HUD)', () => {
    const htmlReady = renderToString(
      <ScanResultModal
        status="ready"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(htmlReady).toBe('');

    const htmlScanning = renderToString(
      <ScanResultModal
        status="scanning"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(htmlScanning).toBe('');
  });

  it('renders QR detected state with preparation message', () => {
    const html = renderToString(
      <ScanResultModal
        status="qr_detected"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(html).toContain('Preparing Secure Verification...');
    expect(html).toContain('QR Detected');
  });

  it('renders authenticating prompt state explaining device verification', () => {
    const html = renderToString(
      <ScanResultModal
        status="authenticating"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(html).toContain("Verify it&#x27;s you to submit attendance.");
    expect(html).toContain('fingerprint, Face ID, Windows Hello, or PIN');
    expect(html).toContain('Waiting for device authenticator interaction...');
  });

  it('renders verification successful state pending final server attendance checks', () => {
    const html = renderToString(
      <ScanResultModal
        status="verification_successful"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(html).toContain('Identity verification completed. Checking attendance...');
    expect(html).toContain('Biometric Assertion Verified');
  });

  it('renders confirmed attendance with class name, session ID, and timestamp', () => {
    const mockResult = {
      recordId: 'rec-123',
      sessionId: 'sess-abc-789',
      className: 'Network Security & Cryptography',
      status: 'present' as const,
      checkInTime: '2026-10-09T10:15:30Z',
      reVerified: false,
    };

    const html = renderToString(
      <ScanResultModal
        status="attendance_confirmed"
        result={mockResult}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );

    expect(html).toContain('Attendance Verified');
    expect(html).toContain('Network Security &amp; Cryptography');
    expect(html).toContain('sess-abc-789');
    expect(html).toContain('WebAuthn Verified');
  });

  it('renders QR expired error state with action to scan current active code', () => {
    const html = renderToString(
      <ScanResultModal
        status="qr_expired"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(html).toContain('This attendance QR has expired. Scan the current classroom QR.');
    expect(html).toContain('Scan Current Classroom QR');
  });

  it('renders credential not registered state with link to enrollment page', () => {
    const html = renderToString(
      <ScanResultModal
        status="credential_not_registered"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(html).toContain('Secure authentication is not registered for this account.');
    expect(html).toContain('href="/student/security"');
    expect(html).toContain('Register Secure Authenticator');
  });

  it('renders unsupported authenticator state advising teacher review', () => {
    const html = renderToString(
      <ScanResultModal
        status="unsupported_authenticator"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(html).toContain('This browser or device does not support the required authentication method.');
    expect(html).toContain('teacher-assisted attendance verification');
  });

  it('renders verification cancelled state without marking attendance', () => {
    const html = renderToString(
      <ScanResultModal
        status="verification_cancelled"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(html).toContain('The authentication request was cancelled. No attendance was recorded.');
    expect(html).toContain('Retry Attendance Verification');
  });

  it('renders verification failed state with error message and retry button', () => {
    const html = renderToString(
      <ScanResultModal
        status="verification_failed"
        result={null}
        errorMessage="Invalid cryptographic signature on WebAuthn assertion"
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(html).toContain('Identity verification could not be completed.');
    expect(html).toContain('Invalid cryptographic signature on WebAuthn assertion');
    expect(html).toContain('Retry Verification');
  });

  it('renders network error state with retry button', () => {
    const html = renderToString(
      <ScanResultModal
        status="network_error"
        result={null}
        onScanAgain={dummyOnScanAgain}
        onClose={dummyOnClose}
      />
    );
    expect(html).toContain('Unable to reach the attendance service. Please retry.');
    expect(html).toContain('Retry');
  });
});

describe('Student Security Enrollment Page (src/app/student/security/page.tsx)', () => {
  it('renders title, description, and explanation without claiming to store biometrics', () => {
    const html = renderToString(<StudentSecurityPage />);

    expect(html).toContain('Secure Your Attendance');
    expect(html).toContain('Register a device authenticator so AttendGuard can ask you to verify yourself before submitting attendance.');
    expect(html).toContain('Zero Biometric Storage');
    expect(html).toContain('AttendGuard never collects, uploads, or stores raw fingerprints or facial scans.');
    expect(html).toContain('Multi-Method Support');
    expect(html).toContain('Register Secure Authentication');
  });
});
