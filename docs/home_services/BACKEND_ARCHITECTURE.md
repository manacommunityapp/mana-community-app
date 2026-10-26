# Mana Community — Home Services / Community Help Backend Architecture

## 1. Overview
The Home Services module is implemented in the existing Spring Boot + Java 21 + PostgreSQL architecture under the package:
```
com.manacommunity.homeservice
├── controller
│   ├── HomeServiceCategoryController.java
│   ├── HomeServiceWorkerController.java
│   ├── HomeServicePackageController.java
│   ├── HomeServiceAvailabilityController.java
│   ├── HomeServiceBookingController.java
│   ├── HomeServiceScheduleController.java
│   ├── HomeServiceAttendanceController.java
│   ├── HomeServiceReviewController.java
│   ├── HomeServiceRequestController.java
│   ├── HomeServiceReportController.java
│   └── HomeServiceAdminController.java
├── service
│   ├── HomeServiceCategoryService.java
│   ├── HomeServiceWorkerService.java
│   ├── HomeServicePackageService.java
│   ├── HomeServiceBookingService.java
│   ├── HomeServiceScheduleService.java
│   ├── HomeServiceAttendanceService.java
│   ├── HomeServicePaymentService.java
│   ├── HomeServiceReviewService.java
│   ├── HomeServiceRequestService.java
│   ├── HomeServiceReportService.java
│   ├── HomeServiceSecurityGateService.java
│   └── impl/
├── repository
│   ├── HomeServiceCategoryRepository.java
│   ├── HomeServiceWorkerRepository.java
│   ├── HomeServiceWorkerSkillRepository.java
│   ├── HomeServiceWorkerAvailabilityRepository.java
│   ├── HomeServiceWorkerFlatAssignmentRepository.java
│   ├── HomeServicePackageRepository.java
│   ├── HomeServiceBookingRepository.java
│   ├── HomeServiceScheduleRepository.java
│   ├── HomeServiceAttendanceRepository.java
│   ├── HomeServicePaymentRepository.java
│   ├── HomeServiceReviewRepository.java
│   ├── HomeServiceRequestRepository.java
│   ├── HomeServiceRequestResponseRepository.java
│   └── HomeServiceReportRepository.java
├── entity
│   ├── HomeServiceCategoryEntity.java
│   ├── HomeServiceWorkerEntity.java
│   ├── HomeServiceWorkerSkillEntity.java
│   ├── HomeServiceWorkerAvailabilityEntity.java
│   ├── HomeServiceWorkerFlatAssignmentEntity.java
│   ├── HomeServicePackageEntity.java
│   ├── HomeServiceBookingEntity.java
│   ├── HomeServiceScheduleEntity.java
│   ├── HomeServiceAttendanceEntity.java
│   ├── HomeServicePaymentEntity.java
│   ├── HomeServiceReviewEntity.java
│   ├── HomeServiceRequestEntity.java
│   ├── HomeServiceRequestResponseEntity.java
│   └── HomeServiceReportEntity.java
├── dto
│   ├── request/
│   │   ├── CreateWorkerRequest.java
│   │   ├── CreateBookingRequest.java
│   │   ├── UpdateAttendanceRequest.java
│   │   ├── CreatePackageRequest.java
│   │   ├── PostRequirementRequest.java
│   │   ├── WorkerBidRequest.java
│   │   └── CreateReviewRequest.java
│   └── response/
│       ├── WorkerSummaryDto.java
│       ├── WorkerDetailDto.java
│       ├── BookingDetailDto.java
│       ├── AttendanceMonthlySummaryDto.java
│       ├── RequirementSummaryDto.java
│       └── AdminAnalyticsDto.java
├── security
│   ├── HomeServiceSecurityGuard.java
│   └── PiiDataMasker.java
└── audit
    └── HomeServiceAuditListener.java
```

## 2. Concurrency and Booking Safety
- **Isolation Level**: `@Transactional(isolation = Isolation.REPEATABLE_READ)` or `SERIALIZABLE` for slot reservation.
- **Pessimistic Locking**: Worker booking queries utilize `SELECT ... FOR UPDATE` on conflicting schedules where `max_bookings` is 1.
- **Idempotency**: Requests enforce idempotency headers to avoid duplicate booking charges.

## 3. Privacy & IDOR Protection
- Endpoints enforce `@PreAuthorize("@homeServiceSecurityGuard.canAccessBooking(#bookingId, authentication)")`.
- All response DTOs mask personal worker/resident phone numbers (e.g., `98******10`) and never expose Aadhaar, PAN, or full residential addresses.
