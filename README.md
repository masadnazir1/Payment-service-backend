# Payment Service Backend - CallAxis

A robust, production-ready payment processing service built with **Express.js**, **TypeScript**, and **Authorize.Net** payment gateway integration. This service handles payment method management, transaction processing, and vendor plan management with enterprise-grade logging and error handling.

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
  - [Authentication](#authentication)
  - [Payment Methods Endpoints](#payment-methods-endpoints)
  - [Vendor Plans Endpoints](#vendor-plans-endpoints)
- [Postman Collection Examples](#postman-collection-examples)
- [Error Handling](#error-handling)
- [Logging & Monitoring](#logging--monitoring)
- [Architecture & Design Patterns](#architecture--design-patterns)
- [Key Features](#key-features)
- [Contributing](#contributing)

---

## Overview

The Payment Service Backend is a comprehensive payment processing service that:

- ✅ Creates and manages customer payment profiles via Authorize.Net
- ✅ Processes secure payment transactions with error handling
- ✅ Maintains vendor pricing plans and subscriptions
- ✅ Generates invoices and sends payment notifications via email
- ✅ Tracks transaction history and payment records
- ✅ Provides robust logging and request tracing
- ✅ Supports multiple payment providers (FABZ Solutions, Care Business Consulting, Chase)
- ✅ Integrates with third-party services (RealtorUplift)

---

## Tech Stack

| Layer               | Technology                 |
| ------------------- | -------------------------- |
| **Runtime**         | Node.js with ts-node/ESM   |
| **Framework**       | Express.js 4.21.2          |
| **Language**        | TypeScript 5.9.3           |
| **Database**        | PostgreSQL 8.16.3          |
| **Payment Gateway** | Authorize.Net              |
| **Authentication**  | JWT + API Keys             |
| **Email**           | Nodemailer 7.0.11          |
| **Validation**      | Zod 4.1.12                 |
| **Development**     | Nodemon, Prettier, ts-node |

---

## Project Structure

```
payment-service-backend/
├── app.ts                          # Express app initialization
├── server.ts                       # Server entry point
├── package.json
├── tsconfig.json
├── .env                            # Environment configuration (not included)
│
├── src/
│   ├── config/
│   │   └── dataBase.ts            # PostgreSQL connection setup
│   │
│   ├── constants/
│   │   └── constants.ts           # API endpoints and constants
│   │
│   ├── controllers/
│   │   ├── payments.Controller.ts # Payment operations logic
│   │   └── plans.Controller.ts    # Vendor plans logic
│   │
│   ├── middlewares/
│   │   ├── ApiKey.Middleware.ts   # API key validation
│   │   ├── AuthMiddleware.ts      # JWT authentication
│   │   └── Cors.Middleware.ts     # CORS configuration
│   │
│   ├── repositories/
│   │   ├── CustomerProfiles.Repository.ts
│   │   ├── PaymentProfiles.Repository.ts
│   │   ├── PaymentTransactions.Repository.ts
│   │   ├── Payment_providers.Repository.ts
│   │   └── VendorPlans.Repository.ts
│   │
│   ├── routes/
│   │   ├── index.ts               # Route registration
│   │   ├── payments.Routes.ts     # Payment endpoints
│   │   └── vendorPlans.Routes.ts  # Vendor plan endpoints
│   │
│   ├── services/
│   │   ├── AuthorizeNet.Service.ts     # Authorize.Net integration
│   │   ├── Email.service.ts            # Email sending
│   │   └── Update.ThirdParty.service.ts # Third-party updates
│   │
│   ├── loggingFeats/
│   │   ├── ErrorLoggingMiddleware.ts    # Error logging
│   │   ├── RequestLoggingMiddleware.ts  # Request tracking
│   │   ├── FileLogger.ts                # File-based logging
│   │   ├── RequestContext.ts            # Request context tracking
│   │   └── types.ts                     # Logging types
│   │
│   ├── types/
│   │   └── express.d.ts           # TypeScript declarations
│   │
│   ├── utils/
│   │   ├── ResponseHandler.ts          # Standardized responses
│   │   ├── Email.Validator.ts          # Email validation
│   │   ├── Email.TemplateBuilder.Utils.ts # Invoice templates
│   │   ├── InvoiceNumberGenerator.Util.ts
│   │   ├── OrderNumberGenerator.Util.ts
│   │   └── PaymentError.ts             # Custom error class
│   │
│   ├── validation/
│   │   └── vendorPlans.schema.ts  # Zod schemas
│   │
│   └── HTML/
│       └── checkout/               # Frontend payment forms
│
├── LOGS/                           # Application logs directory
├── dist/                           # Compiled JavaScript (generated)
└── README.md
```

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js**: v18.0.0 or higher
- **PostgreSQL**: v12.0 or higher
- **npm**: v9.0.0 or higher
- **Authorize.Net Account**: Both Sandbox and Live credentials
- **Email Service**: SMTP credentials (Gmail, SendGrid, etc.)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/payment-service-backend.git
cd payment-service-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create Environment File

Create a `.env` file in the root directory:

```bash
cp .env.example .env  # if available
# or create manually
nano .env
```

### 4. Configure Database

```bash
# Create PostgreSQL database
createdb payment_service_db

# Or from psql terminal
psql -U postgres
CREATE DATABASE payment_service_db;
```

### 5. Build TypeScript

```bash
npm run build
```

---

## Environment Variables

Create a `.env` file with the following configuration:

```env
# Server Configuration
APP_PORT=9441
NODE_ENV=development

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/payment_service_db
DB_HOST=localhost
DB_PORT=5432
DB_NAME=payment_service_db
DB_USER=postgres
DB_PASSWORD=your_password

# API Authentication
API_KEYS=your-api-key-1,your-api-key-2,your-api-key-3
JWT_SECRET=your-super-secret-jwt-key

# Authorize.Net Configuration (Sandbox)
AUTHORIZE_NET_ENVIRONMENT=SANDBOX  # or LIVE
AUTHORIZE_NET_API_LOGIN_ID_TEST=your_sandbox_login_id
AUTHORIZE_NET_TRANSACTION_KEY_TEST=your_sandbox_transaction_key

# Authorize.Net Configuration (Live - Provider Specific)
AUTHORIZE_NET_API_LOGIN_ID_LIVE__FABZ=fabz_live_login_id
AUTHORIZE_NET_TRANSACTION_KEY_LIVE__FABZ=fabz_live_transaction_key

AUTHORIZE_NET_API_LOGIN_ID_LIVE__CAREBUZ=carebuz_live_login_id
AUTHORIZE_NET_TRANSACTION_KEY_LIVE__CAREBUZ=carebuz_live_transaction_key

AUTHORIZE_NET_API_LOGIN_ID_LIVE__CHASE=chase_live_login_id
AUTHORIZE_NET_TRANSACTION_KEY_LIVE__CHASE=chase_live_transaction_key

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@callaxis.com

# Third-party Integration
REALTOR_UPLIFT_API_URL=https://api.realtoruplift.com
REALTOR_UPLIFT_API_KEY=your_realtor_uplift_key

# Logging
LOG_DIR=./LOGS
LOG_LEVEL=info
```

---

## Database Setup

### Initialize Database Schema

The application automatically creates tables on startup. To manually create tables:

```bash
# Uncomment in server.ts and run once
# await createTables();
npm run dev
```

### Database Schema Overview

#### `customer_profiles` Table

```sql
CREATE TABLE customer_profiles (
  id SERIAL PRIMARY KEY,
  user_email_id VARCHAR(255) UNIQUE NOT NULL,
  authorize_customer_profile_id VARCHAR(255) UNIQUE,
  payment_provider_id INTEGER REFERENCES payment_providers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `payment_profiles` Table

```sql
CREATE TABLE payment_profiles (
  id SERIAL PRIMARY KEY,
  customer_profile_id INTEGER REFERENCES customer_profiles(id),
  authorize_payment_profile_id VARCHAR(255) UNIQUE,
  card_last4 VARCHAR(4),
  card_brand VARCHAR(50),
  email VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  streetnumber VARCHAR(255),
  city VARCHAR(100),
  state_province VARCHAR(100),
  zip_code VARCHAR(20),
  country VARCHAR(100),
  phonenumber VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `payment_transactions` Table

```sql
CREATE TABLE payment_transactions (
  id SERIAL PRIMARY KEY,
  payment_provider_id INTEGER REFERENCES payment_providers(id),
  user_email VARCHAR(255),
  customer_profile_id INTEGER REFERENCES customer_profiles(id),
  payment_profile_id INTEGER REFERENCES payment_profiles(id),
  amount DECIMAL(10, 2),
  transaction_id VARCHAR(255) UNIQUE,
  transaction_status VARCHAR(50), -- approved, declined, error, held_for_review
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `vendor_plans` Table

```sql
CREATE TABLE vendor_plans (
  id SERIAL PRIMARY KEY,
  vendor_name VARCHAR(255),
  plan_name VARCHAR(255),
  price DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_name, plan_name)
);
```

---

## Running the Application

### Development Mode

```bash
npm run dev
```

This starts the server with nodemon watching for TypeScript changes on port 9441.

### Production Build & Run

```bash
npm run build
npm start
```

### Expected Output

```
(node:xxxxx) ExperimentalWarning: `--experimental-loader` may be removed in the future
Database connected successfully!
payment-service-backend running at 9441
```

---

## API Documentation

### Base URL

```
http://localhost:9441/api/v1
```

### Authentication

All endpoints (except health checks) require an **API Key** passed in the request header:

```
X-API-Key: your-api-key-here
```

**Example:**

```bash
curl -X GET http://localhost:9441/api/v1/payments/payment-methods \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json"
```

#### API Key Validation

- API keys are read from environment variable `API_KEYS` (comma-separated)
- Invalid or missing API keys return `401` or `403` status
- Configured in `src/middlewares/ApiKey.Middleware.ts`

---

## Payment Methods Endpoints

### 1. List Payment Methods

**Endpoint:** `GET /api/v1/payments/payment-methods`

**Description:** Retrieve all payment methods for a specific user.

**Authentication:** Required (API Key)

**Headers:**

```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "code": 200,
  "message": "Payments fetched successfully",
  "data": [
    {
      "id": 1,
      "customer_profile_id": 5,
      "authorize_payment_profile_id": "28967390",
      "card_last4": "1111",
      "card_brand": "Visa",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "streetnumber": "123 Main St",
      "city": "New York",
      "state_province": "NY",
      "zip_code": "10001",
      "country": "USA",
      "phonenumber": "2125551234",
      "created_at": "2025-01-20T14:30:22.000Z",
      "updated_at": "2025-01-20T14:30:22.000Z"
    }
  ],
  "requestId": "req_abc123xyz"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "code": 400,
  "message": "invalid email",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

---

### 2. Add Payment Method

**Endpoint:** `POST /api/v1/payments/payment-methods`

**Description:** Add a new payment method for a customer using a payment token.

**Authentication:** Required (API Key)

**Headers:**

```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "payment_provider": "fabzsolutions",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "streetNumber": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "country": "USA",
  "phoneNumber": "2125551234",
  "cardlast4": "1111",
  "callbackSite": "realtoruplift",
  "opaqueData": {
    "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
    "dataValue": "eyJkYXRhRGVzY3JpcHRvciI6IkNPTU1PTi5BQ0NFUlQuSU5BUFAuUEFZTUVOVCIsImRhdGFWYWx1ZSI6IjEyMzQ1Njc4OTAifQ=="
  }
}
```

**Success Response (201):**

```json
{
  "success": true,
  "code": 201,
  "message": "Payment profile successfully created",
  "data": {
    "id": 1,
    "customer_profile_id": 5,
    "authorize_payment_profile_id": "28967390",
    "card_last4": "1111",
    "card_brand": "Visa",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "streetnumber": "123 Main Street",
    "city": "New York",
    "state_province": "NY",
    "zip_code": "10001",
    "country": "USA",
    "phonenumber": "2125551234",
    "created_at": "2025-01-20T14:30:22.000Z",
    "updated_at": "2025-01-20T14:30:22.000Z"
  },
  "requestId": "req_abc123xyz"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "code": 400,
  "message": "This payment provider is not currently set up in our system.",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

**Error Response (409 - Conflict):**

```json
{
  "success": false,
  "code": 409,
  "message": "We could not create a new customer profile because one already exists with this payment provider.",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

---

### 3. Update Payment Method

**Endpoint:** `PUT /api/v1/payments`

**Description:** Update an existing payment method with new card/billing information.

**Authentication:** Required (API Key)

**Headers:**

```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "payment_provider": "fabzsolutions",
  "email": "john.doe@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "streetAddress": "456 Oak Avenue",
  "city": "Boston",
  "state": "MA",
  "zipCode": "02101",
  "country": "USA",
  "phoneNumber": "6175551234",
  "cardlast4": "4242",
  "opaqueData": {
    "dataDescriptor": "COMMON.ACCEPT.INAPP.PAYMENT",
    "dataValue": "updated_payment_token_here"
  }
}
```

**Success Response (200):**

```json
{
  "success": true,
  "code": 200,
  "message": "Payment method updated successfully",
  "data": {
    "id": 1,
    "customer_profile_id": 5,
    "authorize_payment_profile_id": "28967390",
    "card_last4": "4242",
    "email": "john.doe@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "streetnumber": "456 Oak Avenue",
    "city": "Boston",
    "state_province": "MA",
    "zip_code": "02101",
    "country": "USA",
    "phonenumber": "6175551234",
    "updated_at": "2025-01-20T15:45:33.000Z"
  },
  "requestId": "req_abc123xyz"
}
```

---

### 4. Charge Payment

**Endpoint:** `POST /api/v1/payments/charge`

**Description:** Process a payment charge using an existing payment method.

**Authentication:** Required (API Key)

**Headers:**

```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "payment_provider": "fabzsolutions",
  "email": "john.doe@example.com",
  "amount": 99.99,
  "callbackSite": "realtoruplift"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "code": 200,
  "message": "Charge successful",
  "data": {
    "id": 42,
    "payment_provider_id": 1,
    "user_email": "john.doe@example.com",
    "customer_profile_id": 5,
    "payment_profile_id": 1,
    "amount": "99.99",
    "transaction_id": "60123456789",
    "transaction_status": "approved",
    "created_at": "2025-01-20T16:22:15.000Z"
  },
  "requestId": "req_abc123xyz"
}
```

**Error Response (400 - Invalid Card):**

```json
{
  "success": false,
  "code": 400,
  "message": "The credit card number is invalid.",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

**Error Response (409 - Duplicate Transaction):**

```json
{
  "success": false,
  "code": 409,
  "message": "Duplicate transaction already submitted",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

**Error Response (404 - Customer Not Found):**

```json
{
  "success": false,
  "code": 404,
  "message": "Customer profile not found",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

---

### 5. Delete Payment Method

**Endpoint:** `DELETE /api/v1/payments`

**Description:** Delete a payment method and associated customer profile.

**Authentication:** Required (API Key)

**Headers:**

```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "payment_provider": "fabzsolutions",
  "email": "john.doe@example.com"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "code": 200,
  "message": "Payment method john.doe@example.com deleted successfully",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "code": 404,
  "message": "Customer Profile not found",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

---

## Vendor Plans Endpoints

### 1. List All Vendor Plans

**Endpoint:** `GET /api/v1/vendor-plans`

**Description:** Retrieve all available vendor plans.

**Authentication:** Required (API Key)

**Headers:**

```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Success Response (200):**

```json
{
  "success": true,
  "code": 200,
  "message": "Vendor plans fetched successfully",
  "data": [
    {
      "id": 1,
      "vendor_name": "callaxis",
      "plan_name": "starter",
      "price": "29.99",
      "created_at": "2025-01-15T10:00:00.000Z",
      "updated_at": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": 2,
      "vendor_name": "callaxis",
      "plan_name": "professional",
      "price": "99.99",
      "created_at": "2025-01-15T10:05:00.000Z",
      "updated_at": "2025-01-15T10:05:00.000Z"
    },
    {
      "id": 3,
      "vendor_name": "callaxis",
      "plan_name": "enterprise",
      "price": "299.99",
      "created_at": "2025-01-15T10:10:00.000Z",
      "updated_at": "2025-01-15T10:10:00.000Z"
    }
  ],
  "requestId": "req_abc123xyz"
}
```

---

### 2. Get Plans by Vendor Name

**Endpoint:** `GET /api/v1/vendor-plans/vendor?vendorName=callaxis`

**Description:** Get all plans for a specific vendor.

**Authentication:** Required (API Key)

**Query Parameters:** | Parameter | Type | Required | Description | |-----------|------|----------|-------------| | vendorName | string | Yes | Name of the vendor |

**Success Response (200):**

```json
{
  "success": true,
  "code": 200,
  "message": "Vendor plan fetched successfully",
  "data": [
    {
      "id": 1,
      "vendor_name": "callaxis",
      "plan_name": "starter",
      "price": "29.99",
      "created_at": "2025-01-15T10:00:00.000Z"
    },
    {
      "id": 2,
      "vendor_name": "callaxis",
      "plan_name": "professional",
      "price": "99.99",
      "created_at": "2025-01-15T10:05:00.000Z"
    }
  ],
  "requestId": "req_abc123xyz"
}
```

---

### 3. Get Single Plan by Name

**Endpoint:** `GET /api/v1/vendor-plans/:planName`

**Description:** Get a specific vendor plan by plan name.

**Authentication:** Required (API Key)

**URL Parameters:** | Parameter | Type | Required | Description | |-----------|------|----------|-------------| | planName | string | Yes | Name of the plan (e.g., "starter") |

**Example:** `GET /api/v1/vendor-plans/professional`

**Success Response (200):**

```json
{
  "success": true,
  "code": 200,
  "message": "Vendor plan fetched successfully",
  "data": {
    "id": 2,
    "vendor_name": "callaxis",
    "plan_name": "professional",
    "price": "99.99",
    "created_at": "2025-01-15T10:05:00.000Z",
    "updated_at": "2025-01-15T10:05:00.000Z"
  },
  "requestId": "req_abc123xyz"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "code": 404,
  "message": "Vendor plan not found",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

---

### 4. Create Vendor Plan

**Endpoint:** `POST /api/v1/vendor-plans`

**Description:** Create a new vendor plan.

**Authentication:** Required (API Key)

**Headers:**

```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "vendorName": "callaxis",
  "planName": "premium",
  "price": 199.99
}
```

**Success Response (201):**

```json
{
  "success": true,
  "code": 201,
  "message": "Vendor plan created successfully",
  "data": {
    "id": 4,
    "vendor_name": "callaxis",
    "plan_name": "premium",
    "price": "199.99",
    "created_at": "2025-01-20T17:30:00.000Z",
    "updated_at": "2025-01-20T17:30:00.000Z"
  },
  "requestId": "req_abc123xyz"
}
```

**Error Response (400):**

```json
{
  "success": false,
  "code": 400,
  "message": "vendorName, planName, and price are required",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

---

### 5. Update Vendor Plan

**Endpoint:** `PUT /api/v1/vendor-plans/vendor`

**Description:** Update an existing vendor plan.

**Authentication:** Required (API Key)

**Headers:**

```
X-API-Key: your-api-key-here
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": 4,
  "vendorName": "callaxis",
  "planName": "premium",
  "price": 229.99
}
```

**Success Response (200):**

```json
{
  "success": true,
  "code": 200,
  "message": "Vendor plan updated successfully",
  "data": {
    "id": 4,
    "vendor_name": "callaxis",
    "plan_name": "premium",
    "price": "229.99",
    "updated_at": "2025-01-20T17:45:00.000Z"
  },
  "requestId": "req_abc123xyz"
}
```

---

### 6. Delete Vendor Plan

**Endpoint:** `DELETE /api/v1/vendor-plans/:id?vendorName=callaxis&planName=premium`

**Description:** Delete a vendor plan.

**Authentication:** Required (API Key)

**Query Parameters:** | Parameter | Type | Required | Description | |-----------|------|----------|-------------| | vendorName | string | Yes | Name of the vendor | | planName | string | Yes | Name of the plan |

**Success Response (200):**

```json
{
  "success": true,
  "code": 200,
  "message": "Vendor plan deleted successfully",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

**Error Response (404):**

```json
{
  "success": false,
  "code": 404,
  "message": "No plan exists for this vendor",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

---

## Postman Collection Examples

### Setup in Postman

1. Create a new Environment in Postman
2. Add the following variables:

```json
{
  "baseUrl": "http://localhost:9441/api/v1",
  "apiKey": "your-api-key-here",
  "email": "john.doe@example.com",
  "paymentProvider": "fabzsolutions"
}
```

### Collection JSON

Create a new Postman Collection and import the following:

```json
{
  "info": {
    "name": "Payment Service API",
    "version": "1.0.0"
  },
  "item": [
    {
      "name": "Payment Methods",
      "item": [
        {
          "name": "List Payment Methods",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"{{email}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/payments/payment-methods",
              "host": ["{{baseUrl}}"],
              "path": ["payments", "payment-methods"]
            }
          }
        },
        {
          "name": "Add Payment Method",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"payment_provider\": \"{{paymentProvider}}\",\n  \"email\": \"{{email}}\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"streetNumber\": \"123 Main Street\",\n  \"city\": \"New York\",\n  \"state\": \"NY\",\n  \"zipCode\": \"10001\",\n  \"country\": \"USA\",\n  \"phoneNumber\": \"2125551234\",\n  \"cardlast4\": \"1111\",\n  \"callbackSite\": \"realtoruplift\",\n  \"opaqueData\": {\n    \"dataDescriptor\": \"COMMON.ACCEPT.INAPP.PAYMENT\",\n    \"dataValue\": \"eyJkYXRhRGVzY3JpcHRvciI6IkNPTU1PTi5BQ0NFUlQuSU5BUFAuUEFZTUVOVCIsImRhdGFWYWx1ZSI6IjEyMzQ1Njc4OTAifQ==\"\n  }\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/payments/payment-methods",
              "host": ["{{baseUrl}}"],
              "path": ["payments", "payment-methods"]
            }
          }
        },
        {
          "name": "Charge Payment",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"payment_provider\": \"{{paymentProvider}}\",\n  \"email\": \"{{email}}\",\n  \"amount\": 99.99,\n  \"callbackSite\": \"realtoruplift\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/payments/charge",
              "host": ["{{baseUrl}}"],
              "path": ["payments", "charge"]
            }
          }
        },
        {
          "name": "Update Payment Method",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"payment_provider\": \"{{paymentProvider}}\",\n  \"email\": \"{{email}}\",\n  \"firstName\": \"John\",\n  \"lastName\": \"Doe\",\n  \"streetAddress\": \"456 Oak Avenue\",\n  \"city\": \"Boston\",\n  \"state\": \"MA\",\n  \"zipCode\": \"02101\",\n  \"country\": \"USA\",\n  \"phoneNumber\": \"6175551234\",\n  \"cardlast4\": \"4242\",\n  \"opaqueData\": {\n    \"dataDescriptor\": \"COMMON.ACCEPT.INAPP.PAYMENT\",\n    \"dataValue\": \"updated_payment_token\"\n  }\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/payments",
              "host": ["{{baseUrl}}"],
              "path": ["payments"]
            }
          }
        },
        {
          "name": "Delete Payment Method",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"payment_provider\": \"{{paymentProvider}}\",\n  \"email\": \"{{email}}\"\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/payments",
              "host": ["{{baseUrl}}"],
              "path": ["payments"]
            }
          }
        }
      ]
    },
    {
      "name": "Vendor Plans",
      "item": [
        {
          "name": "List All Plans",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/vendor-plans",
              "host": ["{{baseUrl}}"],
              "path": ["vendor-plans"]
            }
          }
        },
        {
          "name": "Get Plans by Vendor",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/vendor-plans/vendor?vendorName=callaxis",
              "host": ["{{baseUrl}}"],
              "path": ["vendor-plans", "vendor"],
              "query": [
                {
                  "key": "vendorName",
                  "value": "callaxis"
                }
              ]
            }
          }
        },
        {
          "name": "Get Plan by Name",
          "request": {
            "method": "GET",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/vendor-plans/starter",
              "host": ["{{baseUrl}}"],
              "path": ["vendor-plans", "starter"]
            }
          }
        },
        {
          "name": "Create Plan",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"vendorName\": \"callaxis\",\n  \"planName\": \"enterprise\",\n  \"price\": 499.99\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/vendor-plans",
              "host": ["{{baseUrl}}"],
              "path": ["vendor-plans"]
            }
          }
        },
        {
          "name": "Update Plan",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              },
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"vendorName\": \"callaxis\",\n  \"planName\": \"enterprise\",\n  \"price\": 599.99\n}"
            },
            "url": {
              "raw": "{{baseUrl}}/vendor-plans/vendor",
              "host": ["{{baseUrl}}"],
              "path": ["vendor-plans", "vendor"]
            }
          }
        },
        {
          "name": "Delete Plan",
          "request": {
            "method": "DELETE",
            "header": [
              {
                "key": "X-API-Key",
                "value": "{{apiKey}}"
              }
            ],
            "url": {
              "raw": "{{baseUrl}}/vendor-plans/1?vendorName=callaxis&planName=enterprise",
              "host": ["{{baseUrl}}"],
              "path": ["vendor-plans", "1"],
              "query": [
                {
                  "key": "vendorName",
                  "value": "callaxis"
                },
                {
                  "key": "planName",
                  "value": "enterprise"
                }
              ]
            }
          }
        }
      ]
    }
  ]
}
```

---

## Error Handling

The API uses standardized error responses:

### Error Response Format

```json
{
  "success": false,
  "code": 400,
  "message": "Error description",
  "data": null,
  "requestId": "req_abc123xyz"
}
```

### HTTP Status Codes

| Code | Meaning      | Description                                      |
| ---- | ------------ | ------------------------------------------------ |
| 200  | OK           | Request succeeded                                |
| 201  | Created      | Resource created successfully                    |
| 400  | Bad Request  | Invalid input or missing parameters              |
| 401  | Unauthorized | Missing or invalid API key                       |
| 403  | Forbidden    | API key not authorized for this resource         |
| 404  | Not Found    | Resource not found                               |
| 409  | Conflict     | Resource already exists or duplicate transaction |
| 500  | Server Error | Internal server error                            |

### Common Error Messages

| Error | Status | Cause | Solution |
| --- | --- | --- | --- |
| API key missing | 401 | Header `X-API-Key` not provided | Add header with valid API key |
| Invalid API key | 403 | API key not in allowed list | Use valid API key from `.env` |
| Missing email | 400 | Email parameter not provided | Include `email` in request body |
| invalid email | 400 | Email format is invalid | Provide valid email address |
| Customer profile not found | 404 | No profile exists for email | Create payment method first |
| Payment profile not found | 404 | No payment method for customer | Add payment method first |
| Duplicate transaction | 409 | Same charge submitted twice | Use different transaction or wait |
| The credit card number is invalid | 400 | Card validation failed at gateway | Verify card details |

---

## Logging & Monitoring

### Request Logging

All incoming requests are logged with:

- Request ID (unique identifier)
- Timestamp
- HTTP method & endpoint
- Request parameters
- Response status code
- Response time

Logs are stored in the `./LOGS` directory.

### Error Logging

Errors are automatically logged with:

- Error message
- Stack trace
- Request context
- Timestamp

### Request Context

Every request includes a unique `requestId` in responses for tracing:

```json
{
  "success": true,
  "code": 200,
  "message": "Success",
  "data": {...},
  "requestId": "req_550e8400e29b41d4a716446655440000"
}
```

### Enable Log Streaming

View logs in real-time:

```bash
tail -f ./LOGS/payment-service.log
```

---

## Architecture & Design Patterns

### MVC Architecture

The project follows a **Model-View-Controller** pattern:

- **Controllers** (`src/controllers/`) - Handle request logic
- **Repositories** (`src/repositories/`) - Database access layer
- **Services** (`src/services/`) - Business logic & external integrations
- **Routes** (`src/routes/`) - Endpoint definitions
- **Middlewares** (`src/middlewares/`) - Cross-cutting concerns

### Repository Pattern

Data access is abstracted through repositories:

```typescript
// Example: CustomerProfilesRepository
await CustomerProfilesRepository.getByUserEmailId(email);
await CustomerProfilesRepository.create(providerId, email, profileId);
```

### Service Layer

Business logic and external integrations are in services:

```typescript
// AuthorizeNet Service - Handles payment gateway integration
await AuthorizeNetService.createCustomerProfile(...);
await AuthorizeNetService.chargePayment(...);
```

### Middleware Chain

Request flow through middleware:

1. `express.json()` - Parse JSON body
2. `requestLoggingMiddleware` - Log requests
3. `CorsMiddleware` - Handle CORS
4. `cookieParser()` - Parse cookies
5. `ApiKeyMiddleware` - Validate API key
6. `errorLoggingMiddleware` - Log errors
7. Route handler
8. Response sent

### TypeScript Types

Strong typing throughout with custom interfaces:

```typescript
// Express Request with auth context
interface AuthRequest extends Request {
  user?: { id: number; email?: string };
}

// Custom types in types/ directory
```

---

## Key Features

### 1. Multi-Provider Support

Support for multiple payment providers with per-provider Authorize.Net credentials:

- FabZ Solutions
- Care Business Consulting Solutions
- Chase Bank

### 2. Secure Payment Processing

- Opaque Data token handling (no direct card exposure)
- PCI DSS compliant token-based payments
- Duplicate transaction detection
- Comprehensive error handling

### 3. Customer Profile Management

- Customer profile creation and tracking
- Payment method storage
- Billing information management
- Profile deletion with cascading

### 4. Transaction Tracking

- All transactions logged to database
- Transaction status tracking (approved, declined, error, held_for_review)
- Invoice generation and email delivery
- Order and invoice number generation

### 5. Third-Party Integration

- RealtorUplift callback integration
- Payment profile synchronization
- Transaction record updates

### 6. Email Notifications

- Invoice email generation with HTML templates
- Nodemailer SMTP integration
- Customizable email templates
- Conditional sending (production only)

### 7. Comprehensive Logging

- Request/response logging with request IDs
- Error logging with stack traces
- File-based logging with date rotation
- Request context tracking

### 8. API Key Authentication

- Environment-based API key validation
- Per-endpoint key verification
- Unauthorized/Forbidden response codes

---

## Development Workflow

### Code Style

Code is formatted with Prettier:

```bash
npm run format
```

### TypeScript Compilation

Strict TypeScript checks enabled:

```bash
npm run build
```

### Hot Reload

Development mode watches for changes:

```bash
npm run dev
```

---

## Common Use Cases

### Use Case 1: Add a Payment Method

```bash
POST /api/v1/payments/payment-methods
X-API-Key: your-api-key

{
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
    "dataValue": "token_from_hosted_form"
  }
}
```

### Use Case 2: Charge a Payment

```bash
POST /api/v1/payments/charge
X-API-Key: your-api-key

{
  "payment_provider": "fabzsolutions",
  "email": "user@example.com",
  "amount": 99.99,
  "callbackSite": "realtoruplift"
}
```

**Result:** Transaction processed, invoice generated and emailed, RealtorUplift notified.

### Use Case 3: Create Vendor Plans

```bash
POST /api/v1/vendor-plans
X-API-Key: your-api-key

{
  "vendorName": "callaxis",
  "planName": "professional",
  "price": 99.99
}
```

### Use Case 4: List Available Plans

```bash
GET /api/v1/vendor-plans
X-API-Key: your-api-key
```

---

## Troubleshooting

### Database Connection Failed

**Error:** `Database connection refused`

**Solutions:**

- Verify PostgreSQL is running: `systemctl status postgresql`
- Check DB credentials in `.env`
- Ensure database exists: `createdb payment_service_db`
- Verify DB host/port: `psql -h localhost -U postgres`

### API Key Invalid

**Error:** `Invalid API key (403)`

**Solutions:**

- Verify header is spelled exactly `X-API-Key`
- Check API key in `.env` matches request
- Ensure API key is comma-separated if multiple

### Authorize.Net Connection Failed

**Error:** `Failed to create customer profile in Authorize.Net`

**Solutions:**

- Verify Authorize.Net credentials in `.env`
- Test with Sandbox first (`AUTHORIZE_NET_ENVIRONMENT=SANDBOX`)
- Check payment provider is registered in database
- Verify opaque data token format

### Email Not Sending

**Error:** `Invoice email failed`

**Solutions:**

- Enable "Less secure apps" if using Gmail
- Use App Password instead of regular password
- Verify SMTP credentials in `.env`
- Check email address is valid
- In development, emails won't send (only in production + approved transactions)

---

## Performance Optimization

### Database Indexing

Recommended indexes for production:

```sql
CREATE INDEX idx_customer_email ON customer_profiles(user_email_id);
CREATE INDEX idx_payment_profile_customer ON payment_profiles(customer_profile_id);
CREATE INDEX idx_transaction_email ON payment_transactions(user_email);
CREATE INDEX idx_transaction_status ON payment_transactions(transaction_status);
CREATE INDEX idx_vendor_plan ON vendor_plans(vendor_name, plan_name);
```

### Connection Pooling

PostgreSQL connection pooling is configured in `src/config/dataBase.ts`.

### Caching Opportunities

- Cache vendor plans (frequently accessed, rarely changed)
- Cache payment provider list
- Cache customer profiles during charge operations

---

## Security Considerations

### PCI DSS Compliance

- ✅ No direct card data stored
- ✅ Opaque Data token-based payments
- ✅ Authorize.Net handles PCI compliance
- ✅ HTTPS enforcement (configure in production)

### API Security

- ✅ API Key authentication on all endpoints
- ✅ Environment-based key management
- ✅ Request validation on all inputs
- ✅ Email validation for customer data

### Data Protection

- ✅ Password hashing (implement for admin endpoints)
- ✅ CORS restrictions
- ✅ Request logging for audit trail
- ✅ Error message sanitization (no sensitive data in errors)

### Production Recommendations

- [ ] Use HTTPS/TLS for all communications
- [ ] Implement rate limiting
- [ ] Add request size limits
- [ ] Use secrets management (AWS Secrets Manager, HashiCorp Vault)
- [ ] Enable database SSL
- [ ] Implement request signing for critical operations
- [ ] Add monitoring and alerting

---

## Support & Contribution

### Issue Reporting

Report issues with:

- Environment configuration
- Request/Response example
- Error logs and stack traces
- Steps to reproduce

### Contributing

1. Create a feature branch
2. Follow existing code patterns
3. Add/update tests
4. Run `npm run build && npm run format`
5. Submit pull request

---

## License

[Specify your license here]

---

## Contact & Support

- **Team:** Payment Systems Team
- **Email:** payments@callaxis.com
- **Documentation:** [Link to wiki/docs]
- **Support Portal:** [Link to support]

---

**Version:** 1.0.0  
**Last Updated:** January 21, 2025  
**Maintainers:** [Team names]
