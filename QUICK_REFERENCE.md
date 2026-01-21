# Quick Reference Card - Payment Service API

## Base URL

```
http://localhost:9441/api/v1
```

## Authentication

All requests require header:

```
X-API-Key: your-api-key-here
```

---

## 📋 Payment Methods Endpoints

### List Payment Methods

```
GET /payments/payment-methods
Body: { "email": "user@example.com" }
Response: Array of payment profiles
```

### Add Payment Method

```
POST /payments/payment-methods
Body: {
  "payment_provider": "fabzsolutions",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "streetNumber": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "phoneNumber": "2125551234",
  "cardlast4": "1111",
  "opaqueData": {
    "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
    "dataValue": "token_from_form"
  }
}
```

### Charge Payment

```
POST /payments/charge
Body: {
  "payment_provider": "fabzsolutions",
  "email": "user@example.com",
  "amount": 99.99,
  "callbackSite": "realtoruplift"
}
```

### Update Payment Method

```
PUT /payments
Body: {
  "payment_provider": "fabzsolutions",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "streetAddress": "456 Oak Ave",
  "city": "Boston",
  "state": "MA",
  "zipCode": "02101",
  "country": "USA",
  "phoneNumber": "6175551234",
  "cardlast4": "4242",
  "opaqueData": { "dataDescriptor": "...", "dataValue": "..." }
}
```

### Delete Payment Method

```
DELETE /payments
Body: {
  "payment_provider": "fabzsolutions",
  "email": "user@example.com"
}
```

---

## 🏷️ Vendor Plans Endpoints

### List All Plans

```
GET /vendor-plans
Response: Array of all plans
```

### Get Plans by Vendor

```
GET /vendor-plans/vendor?vendorName=callaxis
Response: Array of plans for vendor
```

### Get Single Plan

```
GET /vendor-plans/starter
Response: Single plan object
```

### Create Plan

```
POST /vendor-plans
Body: {
  "vendorName": "callaxis",
  "planName": "professional",
  "price": 99.99
}
```

### Update Plan

```
PUT /vendor-plans/vendor
Body: {
  "vendorName": "callaxis",
  "planName": "professional",
  "price": 129.99
}
```

### Delete Plan

```
DELETE /vendor-plans/1?vendorName=callaxis&planName=professional
```

---

## ✅ Response Format

**Success (200/201):**

```json
{
  "success": true,
  "code": 200,
  "message": "Operation succeeded",
  "data": { ... },
  "requestId": "req_..."
}
```

**Error (4xx/5xx):**

```json
{
  "success": false,
  "code": 400,
  "message": "Error description",
  "data": null,
  "requestId": "req_..."
}
```

---

## 🔴 Status Codes

| Code | Meaning                        |
| ---- | ------------------------------ |
| 200  | Success                        |
| 201  | Created                        |
| 400  | Bad Request                    |
| 401  | Unauthorized (missing API key) |
| 403  | Forbidden (invalid API key)    |
| 404  | Not Found                      |
| 409  | Conflict (duplicate)           |
| 500  | Server Error                   |

---

## ⚙️ Common Error Messages

```
"API key missing"
→ Add X-API-Key header

"Invalid API key"
→ Check API_KEYS in .env

"invalid email"
→ Invalid email format

"amount must be >= 1"
→ Minimum charge is $1.00

"Duplicate transaction already submitted"
→ Same charge already processing

"Customer profile not found"
→ Add payment method first

"Payment profile not found"
→ Add payment method first

"This payment provider is not currently set up"
→ Provider doesn't exist in database
```

---

## 🧪 Quick Test Commands

### List Plans

```bash
curl -X GET http://localhost:9441/api/v1/vendor-plans \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json"
```

### List Payment Methods

```bash
curl -X GET http://localhost:9441/api/v1/payments/payment-methods \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

### Charge Payment

```bash
curl -X POST http://localhost:9441/api/v1/payments/charge \
  -H "X-API-Key: your-key" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_provider": "fabzsolutions",
    "email": "test@example.com",
    "amount": 99.99
  }'
```

---

## 💾 Environment Variables (Key Ones)

```env
# Server
APP_PORT=9441
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payment_service_db
DB_USER=postgres
DB_PASSWORD=postgres

# API
API_KEYS=key1,key2,key3

# Authorize.Net
AUTHORIZE_NET_ENVIRONMENT=SANDBOX
AUTHORIZE_NET_API_LOGIN_ID_TEST=your_id
AUTHORIZE_NET_TRANSACTION_KEY_TEST=your_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=your_app_password
```

---

## 📦 Payment Providers

Valid values for `payment_provider`:

- `fabzsolutions`
- `carebusinessconsultingsolutions`
- `chase`

---

## 🎯 Quick Workflows

### Add Card & Charge

1. Get token from payment form
2. POST to `/payments/payment-methods`
3. POST to `/payments/charge` with same email
4. Receive transaction confirmation
5. Email sent to customer with invoice

### Manage Pricing Plans

1. POST to `/vendor-plans` to create plan
2. PUT to `/vendor-plans/vendor` to update price
3. GET `/vendor-plans/vendor?vendorName=xxx` to list
4. DELETE `/vendor-plans/{id}` to remove

### Update Customer Card

1. Get new token from payment form
2. PUT to `/payments` with new card data
3. Authorize.Net profile updated
4. Database record updated

---

## 📚 Documentation Files

- **README.md** - Complete API reference + setup
- **API_INTEGRATION_GUIDE.md** - Code examples (JS, Python, cURL)
- **SETUP_AND_DEPLOYMENT_GUIDE.md** - Deployment & infrastructure
- **Postman_Collection.json** - Import to Postman for testing
- **QUICK_REFERENCE.md** - This file

---

## 🚀 Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up .env
cp .env.example .env
# Edit .env with your values

# 3. Create database
createdb payment_service_db

# 4. Run development server
npm run dev

# 5. Test with Postman or cURL
curl -X GET http://localhost:9441/api/v1/vendor-plans \
  -H "X-API-Key: dev-key-1"
```

---

## 📱 Response Example

**Request:**

```bash
POST /api/v1/payments/charge
X-API-Key: your-key
Content-Type: application/json

{
  "payment_provider": "fabzsolutions",
  "email": "john@example.com",
  "amount": 99.99
}
```

**Response (200 - Success):**

```json
{
  "success": true,
  "code": 200,
  "message": "Charge successful",
  "data": {
    "id": 42,
    "payment_provider_id": 1,
    "user_email": "john@example.com",
    "customer_profile_id": 5,
    "payment_profile_id": 1,
    "amount": "99.99",
    "transaction_id": "60123456789",
    "transaction_status": "approved",
    "created_at": "2025-01-21T16:22:15.000Z"
  },
  "requestId": "req_abc123xyz"
}
```

---

## 🔗 Useful Links

- Local: http://localhost:9441/api/v1
- Database: localhost:5432
- Authorize.Net Sandbox: https://sandbox.authorize.net/
- Documentation: See README.md

---

**Version:** 1.0.0 | **Updated:** Jan 21, 2025
