# Security Specification: Guimba West District HRIS

## 1. Data Invariants
1. **Authenticated Access**: All read and write operations require authenticated requests (`request.auth != null`).
2. **Schema Integrity**: Every document creation and mutation must pass strict entity validation (`isValid[Entity]`) enforcing field types, max lengths, and required attributes.
3. **ID Hardening**: All document ID path variables must conform to `^[a-zA-Z0-9_\-]+$` with maximum length <= 128 characters (`isValidId`).
4. **Relational Integrity**: Service credits earned (`soId`, `employeeId`) and used (`soId`, `employeeId`) must link to valid identifiers.
5. **No Blanket Reads**: All read operations are scoped to authenticated users, with PII fields protected against unauthorized access.
6. **Immutable Creation Timestamps**: Creation metadata and record identity keys cannot be modified or forged during updates.

## 2. The "Dirty Dozen" Threat Payloads
1. **Payload 1 (Unauthenticated Write)**: Attacker attempts `setDoc('/employees/hacked', {...})` without auth token -> **REJECTED**.
2. **Payload 2 (ID Poisoning Attack)**: Injecting 2KB malicious string into `{employeeId}` path -> **REJECTED** by `isValidId`.
3. **Payload 3 (Shadow Field Injection)**: Creating employee with unapproved shadow property `__role: 'SUPERADMIN'` -> **REJECTED** by key boundary validation.
4. **Payload 4 (String Buffer Overflow)**: Sending `firstName` of 50,000 characters -> **REJECTED** by `.size() <= 100`.
5. **Payload 5 (Negative Credits Bypass)**: Sending negative `earnedCredits: -100` or `usedCredits: -50` -> **REJECTED** by type and numerical constraints.
6. **Payload 6 (Unauthorized Deletion)**: Non-admin trying to delete school document -> **REJECTED**.
7. **Payload 7 (Special Order Forgery)**: Creating special order without required `soNumber` or `soDate` -> **REJECTED** by `isValidSpecialOrder`.
8. **Payload 8 (Invalid Enum Value)**: Setting `status: 'Banned'` on School or Employee -> **REJECTED** by enum validation `['Active', 'Inactive']`.
9. **Payload 9 (Orphaned Service Credit)**: Writing earned credits with empty `employeeId` or missing `soId` -> **REJECTED**.
10. **Payload 10 (Leave Days Overflow)**: Submitting leave record with negative or invalid `numberOfDays` -> **REJECTED**.
11. **Payload 11 (Query Scraping)**: Unrestricted collection scan by unauthenticated client -> **REJECTED** by default-deny catch-all.
12. **Payload 12 (Archive Tampering)**: Modifying immutable archive timestamp on `deletedRecords` -> **REJECTED**.
