# Mana Community Hub — Sports Module & Sports Vendor Portal
## Backend Microservice Architecture & Data Specifications

This directory contains the production-grade Spring Boot JPA Entities, Liquibase Database Migrations, and REST API architectural patterns for the Sports Vendor Portal and Court Booking Engine.

---

### 1. High-Level Architecture & Separation of Concerns

```
+-----------------------------------------------------------------------------------+
|                           MANA RESIDENT APP & PORTAL                              |
|   - Court Slot Discovery & Booking Modal         - Academy Batch Enrolment        |
|   - QR Code Check-In Pass Generation             - Tournament Commercial Courts   |
+-----------------------------------------+-----------------------------------------+
                                          |
                                    REST / HTTPS
                                          |
+-----------------------------------------v-----------------------------------------+
|                    SPRING BOOT SPORTS BACKEND MICROSERVICE                        |
|                                                                                   |
|  +---------------------------+                     +---------------------------+  |
|  |    SportsVendorService    |                     |   SportsCoachingService   |  |
|  | - Facility & Court Config |                     | - Coach Verification      |  |
|  | - Slot Scheduling Matrix  |                     | - Batch Roster & Enrol    |  |
|  | - Dynamic Pricing Engine  |                     | - Attendance Verification |  |
|  +-------------+-------------+                     +-------------+-------------+  |
|                |                                                 |                |
|  +-------------v-------------+                     +-------------v-------------+  |
|  |   SportsBookingEngine     |                     |   SportsCommerceService   |  |
|  | - Distributed Slot Locks  |                     | - Match Officials Booking |  |
|  | - 10-Minute Hold Expiry   |                     | - Teamwear & RFQ Quotes   |  |
|  | - QR Token Validator      |                     | - Equipment Rentals       |  |
|  +-------------+-------------+                     +-------------+-------------+  |
+----------------|-------------------------------------------------|----------------+
                 |                                                 |
                 v                                                 v
+-----------------------------------------------------------------------------------+
|                         PERSISTENCE & CONCURRENCY LAYER                           |
|  - PostgreSQL 16: ACID Transactions, GiST / B-Tree Indexes, JSONB Attributes      |
|  - Redis 7.2: Redisson Distributed Locks on `court_slot:{courtId}:{date}:{time}`  |
+-----------------------------------------------------------------------------------+
```

---

### 2. Double-Booking Prevention: Distributed Lock Pattern

To guarantee **zero double-booking** under high concurrency (such as weekend box-cricket or badminton tournament registrations opening):

1. **Step 1: Acquire Redis Distributed Lock**
   ```java
   String lockKey = String.format("lock:slot:%d:%s:%s", courtId, slotDate, startTime);
   RLock lock = redissonClient.getLock(lockKey);
   boolean acquired = lock.tryLock(2, 10, TimeUnit.SECONDS);
   if (!acquired) throw new SlotConflictException("Slot currently being reserved by another resident.");
   ```

2. **Step 2: Check & Transition Slot State (`sports_court_slot`)**
   - Check slot status is `AVAILABLE` (or expired `HELD`).
   - Update `status = 'HELD'`, `held_until = now() + 10 minutes`, `held_by_user_id = residentId`.

3. **Step 3: Release Distributed Lock**
   - Lock released immediately after database state transition.

4. **Step 4: Payment Confirmation Hook**
   - On successful payment webhook from payment gateway, transition `status = 'BOOKED'` and insert immutable record in `sports_vendor_booking`.
   - If payment fails or timer expires, a Spring `@Scheduled` background worker unlocks expired `HELD` slots back to `AVAILABLE`.

---

### 3. Database Table Manifest

| Table Name | Entity Class | Purpose |
|---|---|---|
| `sports_facility` | `SportsFacilityEntity.java` | Commercial sports arena, clubhouse, or sports complex |
| `sports_court` | `SportsCourtEntity.java` | Individual court / pitch / pitch net / turf inside a facility |
| `sports_court_slot` | `SportsCourtSlotEntity.java` | 60-min / 30-min schedulable time slots with hold states |
| `sports_vendor_booking` | `SportsVendorBookingEntity.java` | Resident court reservation, payment state, and QR check-in token |
| `sports_coach` | `SportsCoachEntity.java` | Certified academy coach profile, credentials, and sport disciplines |
| `sports_batch` | `SportsBatchEntity.java` | Recurring coaching batch with day-of-week schedule & capacity |
| `sports_batch_enrollment`| `SportsBatchEnrollmentEntity.java` | Student roster registration and subscription status |
| `sports_official` | `SportsOfficialEntity.java` | Certified tournament umpires, referees, and scorers roster |

---

### 4. Running Migrations with Liquibase

Include the changelog into your `db.changelog-master.yaml` or `db.changelog-master.xml`:

```yaml
databaseChangeLog:
  - include:
      file: db/changelog/changes/001_create_sports_vendor_tables.sql
```
