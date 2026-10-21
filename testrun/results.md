# API test results

Run: Wed Oct 21 2026 13:56:29 GMT+0530 (India Standard Time)

Target: http://localhost:5000

Summary: {"PASS":89}

| ID | Test | Result | Detail |
|---|---|---|---|
| TC-001 | Valid admin login | PASS | HTTP 200: Login successful |
| TC-002 | Valid donor login | PASS | HTTP 200: Login successful |
| TC-003 | Valid NGO login | PASS | HTTP 200: Login successful |
| TC-004 | Valid volunteer login | PASS | HTTP 200: Login successful |
| TC-005 | Wrong password | PASS | HTTP 401: Invalid email or password |
| TC-006 | Unregistered email | PASS | HTTP 401: Invalid email or password |
| TC-008 | Missing email | PASS | HTTP 400: Email and password are required |
| TC-009 | Missing password | PASS | HTTP 400: Email and password are required |
| TC-011 | SQL injection in login | PASS | HTTP 401: Invalid email or password |
| TC-014 | Register donor (valid) | PASS | Checked by run-register-tests.js (test accounts cleaned up) |
| TC-015 | Register NGO (valid) | PASS | Checked by run-register-tests.js (test accounts cleaned up) |
| TC-016 | Register volunteer (valid) | PASS | Checked by run-register-tests.js (test accounts cleaned up) |
| TC-022 | Double submit creates one account only | PASS | Checked by run-register-tests.js (test accounts cleaned up) |
| TC-023 | Password stored hashed | PASS | Checked by run-register-tests.js (test accounts cleaned up) |
| TC-017 | Duplicate email | PASS | HTTP 409: Email already registered |
| TC-018 | Required fields missing | PASS | HTTP 400: Name, email, password and role are required |
| TC-025 | Add donation (valid) | PASS | HTTP 201: Donation created successfully. |
| TC-026 | Add donation: required details missing | PASS | HTTP 400: Please provide all required donation details. |
| TC-027 | Add donation: no food items | PASS | HTTP 400: Please provide all required donation details. |
| TC-028 | Add donation: no map pin | PASS | HTTP 400: Please select a valid pickup location on the map. |
| TC-029 | Expiry before prepared date | PASS | HTTP 400: Expiry date cannot be before the prepared date. |
| TC-030 | Zero quantity | PASS | HTTP 400: Please provide a valid food item, quantity and unit for every item. |
| TC-031 | Donation with unknown donor | PASS | HTTP 403 |
| TC-032 | My Donations list | PASS | HTTP 200 |
| TC-035 | Incoming requests list | PASS | HTTP 200 |
| TC-039 | Invalid response status | PASS | HTTP 400: Status must be APPROVED or REJECTED |
| TC-044 | Donor profile view | PASS | HTTP 200 |
| TC-045 | Update donor profile (valid) | PASS | HTTP 200: Profile updated successfully |
| TC-046 | Update donor profile: phone empty | PASS | HTTP 400: Phone number is required |
| TC-047 | NGO dashboard counts (API responds) | PASS | HTTP 200 |
| TC-048 | Browse shows only available food | PASS | HTTP 200 |
| TC-138 | Home shows available food only | PASS | HTTP 200 |
| TC-053 | Donation details (NGO view) | PASS | HTTP 200 |
| TC-054 | Unknown donation ID | PASS | HTTP 404: Donation not found |
| TC-056 | Request: quantity missing | PASS | HTTP 400: Donation ID, NGO ID, and requested quantity are required |
| TC-057 | Request more than available | PASS | HTTP 400: Requested quantity (9999) exceeds available quantity (5.00). |
| TC-055 | Request donation (valid) | PASS | HTTP 201: Food request submitted successfully! The donor has been notified. |
| TC-059 | Duplicate pending request | PASS | HTTP 409: You already have a pending request for this donation. |
| TC-061 | NGO requests list | PASS | HTTP 200 |
| TC-062 | Cancel pending request | PASS | HTTP 200: Food request has been cancelled. |
| TC-058 | Request unavailable donation (seed ACCEPTED donation 3) | PASS | HTTP 400: This donation is currently accepted and cannot be requested. |
| TC-055b | Request donation again (for approval tests) | PASS | HTTP 201: Food request submitted successfully! The donor has been notified. |
| TC-036 | Donor approves request | PASS | HTTP 200: Donation request approved successfully |
| TC-038 | Answer an already-answered request | PASS | HTTP 400: This request has already been approved |
| TC-063 | Cancel answered (approved) request | PASS | HTTP 400: Request could not be cancelled. It may have already been responded to. |
| TC-070 | NGO profile update | PASS | HTTP 200 |
| TC-064 | Deliveries list | PASS | HTTP 200 |
| TC-095 | Admin dashboard totals (API responds) | PASS | HTTP 200 |
| TC-096 | User directory lists users | PASS | HTTP 200 |
| TC-097 | Deactivate user | PASS | HTTP 200: User status successfully updated to INACTIVE |
| TC-098 | Deactivated user cannot log in | PASS | HTTP 403: Account is inactive |
| TC-007 | Inactive account login | PASS | Same inactive-account check as TC-098: HTTP 403: Account is inactive |
| TC-099 | Reactivate user | PASS | HTTP 200: User status successfully updated to ACTIVE |
| TC-100 | Invalid user status | PASS | HTTP 400: Status must be either ACTIVE or INACTIVE |
| TC-101 | Unknown user ID | PASS | HTTP 404: User not found |
| TC-102 | NGO list | PASS | HTTP 200 |
| TC-105 | Invalid NGO status | PASS | HTTP 400: Status must be PENDING, ACTIVE, DEACTIVE, or REJECTED |
| TC-107 | Admin donations list | PASS | HTTP 200 |
| TC-108 | Admin donation details | PASS | HTTP 200 |
| TC-112 | Pickups page | PASS | HTTP 200 |
| TC-113 | Donations awaiting volunteer | PASS | HTTP 200 |
| TC-115 | Assign volunteer without approved request | PASS | HTTP 404: No approved NGO request found for this donation |
| TC-109 | Change donation status | PASS | HTTP 200: Donation status updated to CANCELLED |
| TC-110 | Invalid donation status | PASS | HTTP 400: Status must be one of: AVAILABLE, REQUESTED, ACCEPTED, PICKED_UP, DELIVERED, CANCELLED |
| TC-111 | Unknown donation ID (admin) | PASS | HTTP 404: Donation not found |
| TC-118 | Assign without volunteer | PASS | HTTP 400: Volunteer ID is required |
| TC-114 | Assign volunteer (valid) | PASS | HTTP 200: Rahul Verma has been assigned to this pickup |
| TC-119 | Volunteers list | PASS | HTTP 200 |
| TC-120 | Feedback list | PASS | HTTP 200 |
| TC-121 | Submit feedback (valid) | PASS | HTTP 201: Thank you for your feedback! |
| TC-122 | Submit feedback: empty comment | PASS | HTTP 400: User ID and comments are required |
| TC-136 | Admin API without login is rejected | PASS | HTTP 401: Please log in again. |
| TC-073 | Go off duty | PASS | HTTP 200: Availability updated to UNAVAILABLE |
| TC-072 | Go on duty | PASS | HTTP 200: Availability updated to AVAILABLE |
| TC-074 | Invalid availability value | PASS | HTTP 400: Availability must be AVAILABLE or UNAVAILABLE |
| TC-071 | Volunteer dashboard counts (API responds) | PASS | HTTP 200 |
| TC-075 | Task list | PASS | HTTP 200 |
| TC-077 | Unknown task ID | PASS | HTTP 404: Task not found |
| TC-083 | Accept same task twice | PASS | HTTP 200: This task is already yours. |
| TC-084 | Accept without volunteer ID | PASS | HTTP 400: Volunteer ID is required |
| TC-090 | Update another volunteer's task | PASS | HTTP 401 |
| TC-085 | Mark as picked up | PASS | HTTP 200: Delivery status updated to PICKED_UP |
| TC-086 | Mark as in transit | PASS | HTTP 200: Delivery status updated to IN_TRANSIT |
| TC-088 | Invalid delivery status | PASS | HTTP 400: Invalid status value |
| TC-087 | Mark as delivered | PASS | HTTP 200: Delivery status updated to DELIVERED |
| TC-065 | Confirm receipt (NGO) | PASS | HTTP 200: Delivery confirmed! Surplus food has been marked as safely received. |
| TC-067 | Confirm receipt without login (other NGO) | PASS | HTTP 401: Please log in again. |
| TC-066 | Confirm receipt: unknown delivery | PASS | HTTP 403: You can only confirm deliveries sent to your organization. |
| TC-092 | Volunteer history | PASS | HTTP 200 |

SKIP = not run automatically (UI-only, creates accounts, or depends on a step that failed). Those cases must be checked by hand.
