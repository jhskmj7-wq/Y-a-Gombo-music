# AFRIGOMBO Security Specification

## Data Invariants
- **I1: Identity Match**: Users can only modify their own profile data.
- **I2: Role Protection**: Users cannot modify their `role` or `isVerified` status.
- **I3: Financial Lockdown**: Collections like `escrow`, `commissions`, `withdrawals`, and `payments` are read-only for standard users and write-restricted to authorized processes/admins.
- **I4: Contract State Integrity**: Contracts cannot be modified once they reach terminal states (`completed`, `cancelled`).
- **I5: Admin Logs**: `admin_logs` and `security_logs` are write-protected (system/admin only).
- **I6: PII Privacy**: Detailed user PII (phone, payment numbers) is restricted.

## The Dirty Dozen (Attack Payloads)
1.  **P1 (Self-Promotion)**: User attempts to update `role` to 'admin' in `/users/{uid}`.
2.  **P2 (Shadow Profile)**: User A attempts to update User B's profile.
3.  **P3 (Fake Verification)**: User attempts to set `isVerified: true` on their own profile.
4.  **P4 (Escrow Theft)**: User attempts to update `status` to 'released' in `/escrow/{id}` without authorization.
5.  **P5 (Contract Forgery)**: User attempts to create a contract with an arbitrary `amount` and `status: 'completed'`.
6.  **P6 (Log Erasure)**: User attempts to delete an entry in `admin_logs`.
7.  **P7 (Payment Spoofing)**: User attempts to create a `Payment` record with `status: 'success'`.
8.  **P8 (Identity Hijack)**: User attempts to create a `User` document with a different `uid` than their `auth.uid`.
9.  **P9 (Withdrawal Hijack)**: User A attempts to create a `Withdrawal` request for User B.
10. **P10 (System Media Hack)**: User attempts to disable a `SystemMedia` asset.
11. **P11 (Message Injection)**: User attempts to send a `Message` as another `senderId`.
12. **P12 (Commission Bypass)**: User attempts to modify a `Commission` record to set `amount: 0`.
