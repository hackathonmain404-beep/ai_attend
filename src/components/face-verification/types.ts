/**
 * AttendGuard Face Camera & Verification UI Types
 * Specification for Member 1 Frontend Camera Components.
 */

export type FaceFramingStatus =
  | 'no_face'
  | 'good'
  | 'too_close'
  | 'too_far'
  | 'poor_lighting'
  | 'multiple_faces';

export type CameraPermissionState =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'denied'
  | 'unavailable';

export interface FaceCameraError {
  code:
    | 'PERMISSION_DENIED'
    | 'NOT_FOUND'
    | 'NOT_READABLE'
    | 'UNSUPPORTED'
    | 'CAPTURE_FAILED'
    | 'UNKNOWN';
  message: string;
  originalError?: unknown;
}

export interface CapturedFaceData {
  blob: Blob;
  dataUrl: string;
  width: number;
  height: number;
  timestamp: string;
  qualityEstimate?: number;
}

export interface FramingEvaluation {
  status: FaceFramingStatus;
  message: string;
  isCapturable: boolean;
  score: number; // 0 - 100
  lightLevel?: 'dark' | 'optimal' | 'washed_out';
}

export interface FaceVerificationProps {
  /**
   * Callback invoked when user confirms a captured face photograph.
   * Returns a standard Web API Blob ready for form submission, Base64 encoding, or upload.
   */
  onCapture: (image: Blob, dataUrl: string) => void;

  /**
   * Optional callback when user clicks cancel, close, or back.
   */
  onCancel?: () => void;

  /**
   * Optional callback when a camera or permission error occurs.
   */
  onError?: (error: FaceCameraError) => void;

  /**
   * Component headline title.
   * Defaults to "Facial Biometric Verification".
   */
  title?: string;

  /**
   * Explanatory description.
   */
  description?: string;

  /**
   * Confirmation button label (e.g., "Confirm & Submit", "Use This Photo").
   */
  confirmLabel?: string;

  /**
   * Capture button label (e.g., "Capture Face", "Capture Snapshot").
   */
  captureLabel?: string;

  /**
   * Whether to automatically request camera access on mount.
   * Defaults to false for privacy & explicit user interaction.
   */
  autoStart?: boolean;

  /**
   * Whether to show biometric guide oval & corner targeting brackets.
   * Defaults to true.
   */
  showGuidelines?: boolean;

  /**
   * Whether to horizontally mirror front-facing video preview for natural user experience.
   * Defaults to true.
   */
  mirrorVideo?: boolean;

  /**
   * Optional additional CSS classes for container.
   */
  className?: string;
}
