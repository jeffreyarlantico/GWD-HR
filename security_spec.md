# Security Specification: Guimba West District HRIS

## 1. Data Invariants
1. **District Scope Enforcement**: All entities (`School`, `Employee`, `PromotionRecord`, `SchoolAssignmentRecord`, `SpecialOrder`, `ServiceCreditEarned`, `ServiceCreditUsed`, `LeaveRecord`) are strictly scoped to the Guimba West District context.
2. **Identity & Authorization**: Unauthenticated users cannot read or write any district personnel or school records.
3. **Data Integrity**: Service credit earned and used records must reference valid IDs and numbers. String length bounds and key constraints prevent wallet denial attacks.
4. **Relational Consistency**: Employee mutations cannot inject arbitrary unexpected fields or exceed data boundaries.

## 2. The Dirty Dozen Payloads (Rejection Matrix)
1. **Unauthenticated Read on Employee Collection**: Anonymous actor attempts to query `/employees`. -> **PERMISSION_DENIED**
2. **Unauthenticated Write to Schools**: Anonymous actor attempts `setDoc` on `/schools/test`. -> **PERMISSION_DENIED**
3. **Huge ID Injection Attack**: Actor attempts to create a document with a 2KB string ID. -> **PERMISSION_DENIED** (`isValidId` check fails).
4. **Shadow Field Injection**: Actor attempts to create an Employee document with an unauthorized ghost field `__systemAdmin: true`. -> **PERMISSION_DENIED**.
5. **String Boundary Overflow**: Actor attempts to send an employee `firstName` with 5,000 characters. -> **PERMISSION_DENIED** (`maxLength` check fails).
6. **Negative Earned Credits**: Actor attempts to record `-10.0` earned service credits. -> **PERMISSION_DENIED**.
7. **Negative Used Credits**: Actor attempts to record `-5.0` used service credits. -> **PERMISSION_DENIED**.
8. **Invalid School Status**: Actor attempts to create a School with status `"PendingApproval"`. -> **PERMISSION_DENIED** (only "Active" or "Inactive" allowed).
9. **Blank Employee Number**: Actor attempts to save an Employee with an empty `employeeNumber`. -> **PERMISSION_DENIED**.
10. **Orphaned Credit Record**: Actor attempts to insert a credit record without `employeeId` or `soId`. -> **PERMISSION_DENIED**.
11. **Malicious Path Traversal ID**: Actor attempts to access `/schools/../../secrets`. -> **PERMISSION_DENIED** (`matches('^[a-zA-Z0-9_\\-]+$')` fails).
12. **Catch-All Default Access**: Actor attempts to read from undeclared collection `/systemConfig`. -> **PERMISSION_DENIED** (catch-all default deny).
