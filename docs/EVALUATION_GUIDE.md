# SIH 2026 Evaluator Walkthrough & Benchmark Evaluation Guide
## ForgeProof AI Document Screening & Border Security System

This guide provides technical evaluators, jury members, and reviewers with a step-by-step walkthrough of the **7 verified benchmark evaluation scenarios** embedded in the ForgeProof platform.

---

### 1. Evaluator Credentials

The workstation enforces role-based access control (RBAC). For testing, use the pre-configured statutory accounts:

| Role | Username / Badge | Password | Security Clearance |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin` | `admin123` | LEVEL_5_DIRECTOR |
| **Senior Border Inspector** | `OFFICER_IND_829` | `border-secure-2026` | LEVEL_3_SUPERVISOR |
| **Border Screening Officer** | `OFFICER_IND_104` | `border-secure-2026` | LEVEL_2_SCREENER |

> **Note**: Click the **Hackathon Reviewer Credentials** shortcut pills on the login screen to auto-fill these credentials instantly.

---

### 2. The 7 Benchmark Scenarios Matrix

Each scenario tests a distinct pillar of identity fraud detection, combining optical layout, mathematical integrity, digital forensics, and biometric matching:

```
+---------------------------------------------------------------------------------------------------------+
| ID           | Document Archetype | Citizen / Persona    | Expected Verdict  | Failure Cause / Forensics|
+---------------------------------------------------------------------------------------------------------+
| CASE_BENCH_01| Indian Passport    | ROHIT SHARMA         | LOW RISK (8.0%)   | Authentic baseline       |
| CASE_BENCH_02| Indian Passport    | RAJESH KHANNA        | HIGH RISK (88.0%) | Photo splice & biometrics|
| CASE_BENCH_03| Indian Passport    | VIKRAM MALHOTRA      | HIGH RISK (82.0%) | Date fraud & MRZ desync  |
| CASE_BENCH_04| Indian Aadhaar     | PRIYA PATEL          | LOW RISK (5.0%)   | Valid UIDAI Verhoeff D5  |
| CASE_BENCH_05| Indian Aadhaar     | SUNIL KUMAR          | CRITICAL (94.0%)  | Invalid Verhoeff checksum|
| CASE_BENCH_06| Tourist Visa       | AMITABH SEN          | HIGH RISK (72.0%) | Altered consular stamp   |
| CASE_BENCH_07| Indian Passport    | VIKRAM SINGHANIA     | CRITICAL (100.0%) | Interpol Red Notice hit  |
+---------------------------------------------------------------------------------------------------------+
```

---

### 3. Scenario Deep Dives

#### Scenario 1: Authentic Indian Passport (`CASE_BENCH_01`)
- **Document Type**: Indian Passport (ICAO Doc 9303 TD3 standard).
- **Subject**: Rohit Sharma.
- **Verification Highlights**:
  - Valid 44-character 2-line TD3 MRZ check digits (`7-3-1` weighting).
  - Uniform Error Level Analysis (ELA) compression curve with no synthetic edges.
  - 1:1 facial biometric match confidence at **96.4%** against live presenter.
  - **Verdict**: `CLEARED & ADMISSIBLE — BORDER PASS ISSUED`.

#### Scenario 2: Tampered Passport — Photo Splice Forgery (`CASE_BENCH_02`)
- **Subject**: Rajesh Khanna.
- **Verification Highlights**:
  - High-frequency ELA noise discontinuity concentrated around the portrait perimeter.
  - Biometric face verification fails (presenter does not match passport portrait).
  - **Verdict**: `REFERRED TO SECONDARY PHYSICAL INSPECTION`.

#### Scenario 3: Date Fraud & MRZ Desync (`CASE_BENCH_03`)
- **Subject**: Vikram Malhotra.
- **Verification Highlights**:
  - Visual inspection zone (VIZ) shows printed expiry year `2036`.
  - Machine Readable Zone (MRZ) encodes expiry year `2031`.
  - MRZ checksum computation fails mathematical `7-3-1` validation.
  - Cross-validation module flags strict inconsistency between MRZ and VIZ.
  - **Verdict**: `HIGH RISK · ANOMALY FLOOR TRIGGERED`.

#### Scenario 4: Genuine Indian Aadhaar Card (`CASE_BENCH_04`)
- **Subject**: Priya Patel.
- **Verification Highlights**:
  - 12-digit UIDAI number passes the Dihedral Group $D_5$ (Verhoeff) checksum test.
  - Demographic layout matches standard UIDAI card template specifications.
  - **Verdict**: `LOW RISK · ADMISSIBLE`.

#### Scenario 5: Forged Aadhaar — Invalid Verhoeff Checksum (`CASE_BENCH_05`)
- **Subject**: Sunil Kumar.
- **Verification Highlights**:
  - Printed Aadhaar number modified by attacker.
  - Mathematical Verhoeff $D_5$ algorithm flags check digit failure: `inv(c) != 0`.
  - PII masking safely converts number to `XXXX-XXXX-9412` in audit logs.
  - **Verdict**: `CRITICAL RISK · CHECKSUM FRAUD DETECTED`.

#### Scenario 6: Forged Visa Consular Stamp (`CASE_BENCH_06`)
- **Subject**: Amitabh Sen.
- **Verification Highlights**:
  - Synthetic edge distortion and color palette mismatch on official consular endorsement stamp.
  - Texture frequency analysis (Laplacian variance) flags anomaly.
  - **Verdict**: `HIGH RISK · TAMPERED VISA ENDORSEMENT`.

#### Scenario 7: Interpol Red Notice Match (`CASE_BENCH_07`)
- **Subject**: Vikram Singhania (Passport `P9823412`, DOB `15/08/1987`).
- **Verification Highlights**:
  - Watchlist screening module matches passport number and name against active CBI Interpol NCB Red Notice bulletin `#2026-9041`.
  - Category: `FUGITIVE_ARREST_WARRANT`.
  - Automated anomaly floor forces risk score to **100.0%**.
  - **Verdict**: `CRITICAL (100%) · PASSENGER DETAINED`.

---

### 4. Demo Sandbox Reset

To reset the entire screening queue and restore the 7 pristine benchmark cases at any time:
1. Navigate to the **Verification Queue** (`Overview`) page.
2. In the top toolbar, click **`[🔄 Reset Demo Sandbox]`**.
3. The queue and blockchain audit ledger will restore to the pristine benchmark baseline in < 200 ms.
