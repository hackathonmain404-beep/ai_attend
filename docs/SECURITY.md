# AttendGuard — Security Model & Limitations
**Module:** Member 4 (AI Engineer: Intelligence & Analytics)  
**Status:** Security Specification & Threat Audit

---

## 1. Threat Model & Countermeasures

### 1. Credential Exposure
- **Threat:** Leaking `GEMINI_API_KEY` in client-side JavaScript bundles or GitHub commits.
- **Countermeasures:**
  - Strict exclusion in `.gitignore` for all `.env*` local files.
  - Prohibition of `NEXT_PUBLIC_` prefixes on secret variables.
  - All AI invocations are mediated strictly through server-side route handlers (`/api/student/advisor`).

### 2. Prompt Injection & Jailbreaking
- **Threat:** Students manipulating prompts to claim full attendance or bypass institution detention policies.
- **Countermeasures:**
  - Context is treated as immutable, read-only system truth.
  - The system prompt enforces strict refusal of instructions asking to override verified calculations.
  - Client-side input length is clamped to $\le 1000$ characters to prevent buffer-flooding attacks.

### 3. PII & Privacy Minimization
- **Threat:** Transmitting sensitive student identification or auth credentials to external AI providers.
- **Countermeasures:**
  - Only course names, attendance fractions, and threshold metrics are serialized into AI context.
  - Student emails, passwords, auth tokens, session IDs, Supabase service keys, and biometric data are strictly forbidden from AI payloads.

### 4. Denial of Service & Quota Exhaustion
- **Threat:** Malicious automated spamming of the advisor endpoint.
- **Countermeasures:**
  - Client interface disables input and submit triggers while a request is in flight.
  - HTTP 429 (`RATE_LIMIT_EXCEEDED`) errors are intercepted and translated to localized fallbacks without crashing the application.

---

## 2. Institutional & Technical Limitations

In the interest of engineering honesty and academic integrity, AttendGuard documents the following real-world boundaries:

1. **No Absolute Physical Proof:** No software-only system can prove continuous, physical in-seat classroom presence with 100% mathematical certainty. Rotating QR challenges and registered device binding raise the barrier against casual proxy check-ins, but cannot replace observant human proctoring.
2. **AI Is Not the Legal Record:** The AI Attendance Advisor is an educational decision-support layer. The PostgreSQL database maintained by the backend team remains the sole legal source of attendance records.
3. **Network Dependability:** While deterministic fallbacks guarantee advice continuity during Gemini outages, initial attendance record retrieval depends on active network connectivity to the institution's backend.
