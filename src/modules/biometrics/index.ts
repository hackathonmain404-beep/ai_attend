/**
 * AttendGuard Biometrics Module (Member 1)
 * Public API for Face Enrollment and Verification Engine.
 */

export * from './types';
export * from './services/face-enrollment.service';
export * from './services/face-verification.service';
export * from './services/biometric-crypto.service';
export * from './services/face-feature-extractor.service';
export * from './repositories/biometric-template.repository';
export * from './validators/biometric.validator';
