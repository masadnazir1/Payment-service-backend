# API Integration Guide - Payment Service

Complete integration guide for developers implementing the Payment Service API.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Request/Response Format](#requestresponse-format)
4. [Common Integration Patterns](#common-integration-patterns)
5. [Code Examples](#code-examples)
6. [Webhook Integration](#webhook-integration)
7. [Error Handling](#error-handling)
8. [Rate Limiting](#rate-limiting)
9. [Testing & Debugging](#testing--debugging)

---

## Quick Start

### 1. Get Your API Key

Request an API key from your PaymentService administrator:

```bash
API_KEY=your-api-key-here
```

### 2. Set Environment

```bash
export API_URL=http://localhost:9441/api/v1
export API_KEY=your-api-key-here
```

### 3. Make Your First Request

```bash
curl -X GET ${API_URL}/vendor-plans \
  -H "X-API-Key: ${API_KEY}" \
  -H "Content-Type: application/json"
```

---

## Authentication

### API Key Authentication

All endpoints require API Key in header:

```
X-API-Key: your-api-key-here
```

### Multiple API Keys

For security, you can manage multiple API keys:

```env
# .env
API_KEYS=key-for-frontend,key-for-mobile,key-for-backend
```

### Rotating API Keys

1. Generate new key
2. Add to API_KEYS (comma-separated)
3. Update client applications
4. Remove old key from API_KEYS
5. Restart server

---

## Request/Response Format

### Standard Request Headers

```http
GET /api/v1/vendor-plans HTTP/1.1
Host: localhost:9441
X-API-Key: your-api-key-here
Content-Type: application/json
Accept: application/json
```

### Standard Response Format

All responses follow this structure:

```json
{
  "success": true,
  "code": 200,
  "message": "Operation succeeded",
  "data": { "id": 1, "name": "value" },
  "requestId": "req_550e8400e29b41d4a716446655440000"
}
```

### Response Fields

| Field       | Type    | Description                           |
| ----------- | ------- | ------------------------------------- |
| `success`   | boolean | Whether operation succeeded           |
| `code`      | number  | HTTP status code                      |
| `message`   | string  | Human-readable message                |
| `data`      | any     | Response payload (null if empty)      |
| `requestId` | string  | Unique request identifier for tracing |

### Status Codes

| Code | Meaning      |
| ---- | ------------ |
| 200  | Success      |
| 201  | Created      |
| 400  | Bad Request  |
| 401  | Unauthorized |
| 403  | Forbidden    |
| 404  | Not Found    |
| 409  | Conflict     |
| 500  | Server Error |

---

## Common Integration Patterns

### Pattern 1: Add Payment Method

**Scenario:** User adds a new credit card

**Flow:**

1. User fills out payment form
2. Form tokenizes card (Authorize.Net Accept Hosted)
3. Send opaque data token to backend
4. Backend creates customer profile
5. Backend stores payment profile

**Code:**

```javascript
async function addPaymentMethod(userEmail, cardToken) {
  const response = await fetch('http://localhost:9441/api/v1/payments/payment-methods', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_provider: 'fabzsolutions',
      email: userEmail,
      firstName: 'John',
      lastName: 'Doe',
      streetNumber: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      phoneNumber: '2125551234',
      cardlast4: cardToken.last4,
      opaqueData: {
        dataDescriptor: cardToken.dataDescriptor,
        dataValue: cardToken.dataValue,
      },
    }),
  });

  const result = await response.json();
  if (result.success) {
    console.log('Payment profile created:', result.data.id);
  } else {
    console.error('Error:', result.message);
  }
  return result;
}
```

### Pattern 2: Charge a Payment

**Scenario:** User completes purchase

**Flow:**

1. User confirms purchase amount
2. Backend charges stored payment method
3. Transaction processed by Authorize.Net
4. Invoice generated and emailed
5. Third-party service notified

**Code:**

```javascript
async function chargePayment(userEmail, amount) {
  const response = await fetch('http://localhost:9441/api/v1/payments/charge', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_provider: 'fabzsolutions',
      email: userEmail,
      amount: amount,
      callbackSite: 'realtoruplift',
    }),
  });

  const result = await response.json();
  if (result.success) {
    const transaction = result.data;
    if (transaction.transaction_status === 'approved') {
      console.log('Payment approved. Invoice sent to:', userEmail);
    } else {
      console.log('Payment status:', transaction.transaction_status);
    }
  }
  return result;
}
```

### Pattern 3: Manage Vendor Plans

**Scenario:** Admin creates and manages pricing plans

**Code:**

```javascript
// List all plans
async function getPlans() {
  const response = await fetch('http://localhost:9441/api/v1/vendor-plans', {
    headers: { 'X-API-Key': 'your-api-key' },
  });
  return response.json();
}

// Create new plan
async function createPlan(vendorName, planName, price) {
  const response = await fetch('http://localhost:9441/api/v1/vendor-plans', {
    method: 'POST',
    headers: {
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vendorName,
      planName,
      price,
    }),
  });
  return response.json();
}

// Update plan pricing
async function updatePlanPrice(vendorName, planName, newPrice) {
  const response = await fetch('http://localhost:9441/api/v1/vendor-plans/vendor', {
    method: 'PUT',
    headers: {
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vendorName,
      planName,
      price: newPrice,
    }),
  });
  return response.json();
}
```

---

## Code Examples

### JavaScript/Node.js

#### Using Fetch API

```javascript
class PaymentServiceClient {
  constructor(apiKey, baseUrl = 'http://localhost:9441/api/v1') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request(method, endpoint, body = null) {
    const options = {
      method,
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, options);
      const data = await response.json();

      if (!data.success) {
        throw new Error(`${response.status}: ${data.message}`);
      }

      return data;
    } catch (error) {
      console.error('API Error:', error.message);
      throw error;
    }
  }

  // Payment Methods
  async listPaymentMethods(email) {
    return this.request('GET', '/payments/payment-methods', { email });
  }

  async addPaymentMethod(paymentData) {
    return this.request('POST', '/payments/payment-methods', paymentData);
  }

  async chargePayment(chargeData) {
    return this.request('POST', '/payments/charge', chargeData);
  }

  async updatePaymentMethod(updateData) {
    return this.request('PUT', '/payments', updateData);
  }

  async deletePaymentMethod(email, paymentProvider) {
    return this.request('DELETE', '/payments', {
      email,
      payment_provider: paymentProvider,
    });
  }

  // Vendor Plans
  async listPlans() {
    return this.request('GET', '/vendor-plans');
  }

  async getPlansByVendor(vendorName) {
    return this.request('GET', `/vendor-plans/vendor?vendorName=${vendorName}`);
  }

  async getPlanByName(planName) {
    return this.request('GET', `/vendor-plans/${planName}`);
  }

  async createPlan(vendorName, planName, price) {
    return this.request('POST', '/vendor-plans', {
      vendorName,
      planName,
      price,
    });
  }

  async updatePlan(vendorName, planName, price) {
    return this.request('PUT', '/vendor-plans/vendor', {
      vendorName,
      planName,
      price,
    });
  }

  async deletePlan(id, vendorName, planName) {
    return this.request(
      'DELETE',
      `/vendor-plans/${id}?vendorName=${vendorName}&planName=${planName}`,
    );
  }
}

// Usage
const client = new PaymentServiceClient('your-api-key-here');

// Add payment method
client
  .addPaymentMethod({
    payment_provider: 'fabzsolutions',
    email: 'user@example.com',
    firstName: 'John',
    lastName: 'Doe',
    streetNumber: '123 Main St',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    phoneNumber: '2125551234',
    cardlast4: '1111',
    opaqueData: {
      dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT',
      dataValue: 'token_here',
    },
  })
  .then((result) => {
    console.log('Payment method added:', result.data);
  })
  .catch((error) => {
    console.error('Failed:', error.message);
  });
```

#### Using Axios

```javascript
const axios = require('axios');

class PaymentServiceClient {
  constructor(apiKey, baseUrl = 'http://localhost:9441/api/v1') {
    this.client = axios.create({
      baseURL: baseUrl,
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });
  }

  async chargePayment(email, amount, provider = 'fabzsolutions') {
    try {
      const response = await this.client.post('/payments/charge', {
        payment_provider: provider,
        email,
        amount,
        callbackSite: 'realtoruplift',
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }

  async getPlans() {
    try {
      const response = await this.client.get('/vendor-plans');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response.data.message);
    }
  }
}

// Usage
const client = new PaymentServiceClient('your-api-key-here');

client
  .chargePayment('user@example.com', 99.99)
  .then((result) => {
    if (result.data.transaction_status === 'approved') {
      console.log('Payment successful!');
    }
  })
  .catch((error) => {
    console.error(error.message);
  });
```

### Python

```python
import requests
from typing import Dict, Any, Optional

class PaymentServiceClient:
    def __init__(self, api_key: str, base_url: str = 'http://localhost:9441/api/v1'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }

    def _request(self, method: str, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make HTTP request to API"""
        url = f"{self.base_url}{endpoint}"

        try:
            if method == 'GET':
                response = requests.get(url, headers=self.headers, json=data)
            elif method == 'POST':
                response = requests.post(url, headers=self.headers, json=data)
            elif method == 'PUT':
                response = requests.put(url, headers=self.headers, json=data)
            elif method == 'DELETE':
                response = requests.delete(url, headers=self.headers, json=data)

            response.raise_for_status()
            result = response.json()

            if not result.get('success'):
                raise Exception(f"API Error: {result.get('message')}")

            return result
        except requests.exceptions.RequestException as e:
            raise Exception(f"Request failed: {str(e)}")

    def charge_payment(self, email: str, amount: float, provider: str = 'fabzsolutions') -> Dict:
        """Process a payment charge"""
        return self._request('POST', '/payments/charge', {
            'payment_provider': provider,
            'email': email,
            'amount': amount,
            'callbackSite': 'realtoruplift'
        })

    def add_payment_method(self, email: str, first_name: str, last_name: str,
                           opaque_data: Dict, provider: str = 'fabzsolutions') -> Dict:
        """Add a new payment method"""
        return self._request('POST', '/payments/payment-methods', {
            'payment_provider': provider,
            'email': email,
            'firstName': first_name,
            'lastName': last_name,
            'streetNumber': '123 Main St',
            'city': 'New York',
            'state': 'NY',
            'zipCode': '10001',
            'country': 'USA',
            'phoneNumber': '2125551234',
            'cardlast4': opaque_data.get('last4'),
            'opaqueData': {
                'dataDescriptor': opaque_data.get('dataDescriptor'),
                'dataValue': opaque_data.get('dataValue')
            }
        })

    def list_plans(self) -> list:
        """Get all vendor plans"""
        result = self._request('GET', '/vendor-plans')
        return result.get('data', [])

    def create_plan(self, vendor_name: str, plan_name: str, price: float) -> Dict:
        """Create a new vendor plan"""
        return self._request('POST', '/vendor-plans', {
            'vendorName': vendor_name,
            'planName': plan_name,
            'price': price
        })

# Usage
client = PaymentServiceClient('your-api-key-here')

# Charge payment
try:
    result = client.charge_payment('user@example.com', 99.99)
    print(f"Payment processed: {result['data']['transaction_id']}")
except Exception as e:
    print(f"Payment failed: {e}")

# Get plans
plans = client.list_plans()
for plan in plans:
    print(f"{plan['vendor_name']}: {plan['plan_name']} - ${plan['price']}")
```

### cURL Examples

```bash
# Get all plans
curl -X GET http://localhost:9441/api/v1/vendor-plans \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json"

# List payment methods
curl -X GET http://localhost:9441/api/v1/payments/payment-methods \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'

# Charge payment
curl -X POST http://localhost:9441/api/v1/payments/charge \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_provider": "fabzsolutions",
    "email": "user@example.com",
    "amount": 99.99,
    "callbackSite": "realtoruplift"
  }'

# Create plan
curl -X POST http://localhost:9441/api/v1/vendor-plans \
  -H "X-API-Key: your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "vendorName": "callaxis",
    "planName": "professional",
    "price": 99.99
  }'
```

---

## Webhook Integration

### Setting Up Callbacks

The payment service can notify third-party systems (e.g., RealtorUplift) of payment events.

### Supported Events

1. **Payment Profile Created**
   - Event: User adds new payment method
   - Action: Sync payment profile to third party

2. **Transaction Completed**
   - Event: Payment charge processed
   - Action: Update transaction record

### Implementing Webhook Receiver

```javascript
// Express webhook receiver
app.post('/webhook/payment-notification', (req, res) => {
  const { event, data, timestamp } = req.body;

  // Verify webhook signature (optional but recommended)
  // const signature = req.headers['x-webhook-signature'];
  // if (!verifySignature(signature, JSON.stringify(req.body))) {
  //   return res.status(403).json({ error: 'Invalid signature' });
  // }

  try {
    switch (event) {
      case 'payment.created':
        console.log('Payment profile created:', data);
        // Update your database
        break;

      case 'transaction.completed':
        console.log('Transaction completed:', data);
        // Update inventory, send confirmation, etc.
        break;

      default:
        console.log('Unknown event:', event);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});
```

### Setting Callback URL

Configure in environment:

```env
REALTOR_UPLIFT_API_URL=https://your-domain.com/webhook/payment-notification
REALTOR_UPLIFT_API_KEY=your-webhook-secret
```

---

## Error Handling

### Handling Common Errors

```javascript
async function chargePaymentWithErrorHandling(email, amount) {
  try {
    const response = await fetch('http://localhost:9441/api/v1/payments/charge', {
      method: 'POST',
      headers: {
        'X-API-Key': 'your-api-key',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment_provider: 'fabzsolutions',
        email,
        amount,
      }),
    });

    const result = await response.json();

    if (!result.success) {
      // Handle different error codes
      switch (result.code) {
        case 400:
          // Validation error - invalid input
          console.error('Invalid input:', result.message);
          // Example: "amount must be >= 1"
          break;

        case 401:
          // Unauthorized - missing API key
          console.error('Missing API key');
          break;

        case 403:
          // Forbidden - invalid API key
          console.error('Invalid API key');
          break;

        case 404:
          // Not found - customer or payment profile doesn't exist
          console.error('Customer not found - add payment method first');
          break;

        case 409:
          // Conflict - duplicate transaction
          console.error('Duplicate transaction detected');
          break;

        default:
          console.error('Unknown error:', result.message);
      }

      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

### Retry Logic

```javascript
async function chargeWithRetry(email, amount, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await chargePayment(email, amount);
      if (result.success) {
        return result;
      }

      // Don't retry on client errors
      if (result.code >= 400 && result.code < 500) {
        throw new Error(`Client error: ${result.message}`);
      }

      // Retry on server errors
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
}
```

---

## Rate Limiting

### Current Limits

- **No built-in rate limiting** (can be added in production)
- Recommended: 100 requests per minute per API key

### Implementing Client-Side Rate Limiting

```javascript
class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async checkLimit() {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      throw new Error(`Rate limit exceeded. Wait ${waitTime}ms`);
    }

    this.requests.push(now);
  }
}

// Usage
const limiter = new RateLimiter(100, 60000); // 100 per minute

async function apiCall() {
  await limiter.checkLimit();
  // Make API request
}
```

---

## Testing & Debugging

### Enable Request Logging

```javascript
// Log all requests
const client = new PaymentServiceClient('your-api-key');

// Add logging middleware
client.addInterceptor((config) => {
  console.log(`[${new Date().toISOString()}] ${config.method} ${config.url}`);
  return config;
});
```

### Debug Response

```javascript
async function debugRequest(email) {
  const response = await fetch('http://localhost:9441/api/v1/payments/payment-methods', {
    method: 'GET',
    headers: {
      'X-API-Key': 'your-api-key',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  console.log('Status:', response.status);
  console.log('Headers:', Object.fromEntries(response.headers));

  const data = await response.json();
  console.log('Request ID:', data.requestId); // Use for debugging
  console.log('Response:', JSON.stringify(data, null, 2));

  return data;
}
```

### Testing with Sandbox Environment

```bash
# Set environment variable
export AUTHORIZE_NET_ENVIRONMENT=SANDBOX

# Use sandbox credentials for testing
export AUTHORIZE_NET_API_LOGIN_ID_TEST=your_sandbox_login_id
export AUTHORIZE_NET_TRANSACTION_KEY_TEST=your_sandbox_key

# Run server
npm run dev
```

### Test Payment Cards (Authorize.Net Sandbox)

| Card     | Number           | Exp Date | Result   |
| -------- | ---------------- | -------- | -------- |
| Visa     | 4111111111111111 | 12/2025  | Approved |
| Visa     | 4222222222222220 | 12/2025  | Declined |
| Amex     | 371449635398431  | 12/2025  | Approved |
| Discover | 6011111111111117 | 12/2025  | Approved |

---

## Support & Resources

- **API Documentation**: See README.md
- **Postman Collection**: Import Postman_Collection.json
- **Status Codes**: See API documentation section
- **Troubleshooting**: Check README.md troubleshooting section

---

**Version:** 1.0.0  
**Last Updated:** January 21, 2025
