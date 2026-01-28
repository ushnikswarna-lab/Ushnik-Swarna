# API Documentation

Complete API reference for P2tEcostay Resort application.

## Base URL

All API routes are prefixed with `/api`:
- Development: `http://localhost:3000/api`
- Production: `https://yourdomain.com/api`

## Authentication

Admin API routes require authentication via Firebase Auth token. Include the token in the request headers:

```typescript
headers: {
  'Authorization': `Bearer ${firebaseToken}`
}
```

## Public APIs

### Products

#### GET `/api/products`
Get all products.

**Response:**
```json
[
  {
    "id": "string",
    "name": "string",
    "url": "string",
    "description": "string",
    "image": "string",
    "category": "string"
  }
]
```

#### GET `/api/products/[url]`
Get products by category URL.

**Parameters:**
- `url` (string): Category URL slug

**Response:**
```json
{
  "category": "string",
  "products": [...]
}
```

#### GET `/api/products/[url]/[productUrl]`
Get single product details.

**Parameters:**
- `url` (string): Category URL slug
- `productUrl` (string): Product URL slug

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "url": "string",
  "description": "string",
  "image": "string",
  "specifications": {...}
}
```

### Services

#### GET `/api/services`
Get all services.

#### GET `/api/services/[url]`
Get single service by URL.

### Solutions

#### GET `/api/solutions`
Get all solutions.

#### GET `/api/solutions/[url]`
Get single solution by URL.

### Industries

#### GET `/api/industries`
Get all industries.

#### GET `/api/industries/[url]`
Get single industry by URL.

### Careers

#### GET `/api/careers`
Get all active career postings.

**Response:**
```json
[
  {
    "id": "string",
    "jobTitle": "string",
    "location": "string",
    "workType": "string",
    "status": "open" | "taking-applications" | "closed"
  }
]
```

### Contact Forms

#### POST `/api/contact`
Submit contact form.

**Request Body:**
```json
{
  "name": "string",
  "company": "string",
  "email": "string",
  "phone": "string",
  "projectRequirement": "string",
  "recaptchaToken": "string" // optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

### Quick Contact

#### POST `/api/quick-contact`
Submit quick contact form.

**Request Body:**
```json
{
  "name": "string",
  "phone": "string"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Thank you for your interest"
}
```

## Admin APIs

All admin APIs require authentication and admin/manager role.

### Products (Admin)

#### GET `/api/admin/products`
Get all products (admin).

#### POST `/api/admin/products`
Create new product.

**Request Body:**
```json
{
  "name": "string",
  "url": "string",
  "description": "string",
  "image": "string",
  "category": "string",
  "order": number
}
```

#### PATCH `/api/admin/products/[id]`
Update product.

#### DELETE `/api/admin/products/[id]`
Delete product.

#### POST `/api/admin/products/order`
Reorder products.

**Request Body:**
```json
{
  "items": [
    { "id": "string", "order": number }
  ]
}
```

### Product Types (Admin)

#### GET `/api/admin/producttypes`
Get all product types.

#### POST `/api/admin/producttypes`
Create product type.

#### PATCH `/api/admin/producttypes/[id]`
Update product type.

#### DELETE `/api/admin/producttypes/[id]`
Delete product type.

#### POST `/api/admin/producttypes/reorder`
Reorder product types.

### Services (Admin)

Similar structure to Products API:
- `GET /api/admin/services`
- `POST /api/admin/services`
- `PATCH /api/admin/services/[id]`
- `DELETE /api/admin/services/[id]`
- `POST /api/admin/services/order`

### Solutions (Admin)

Similar structure to Products API:
- `GET /api/admin/solutions`
- `POST /api/admin/solutions`
- `PATCH /api/admin/solutions/[id]`
- `DELETE /api/admin/solutions/[id]`
- `POST /api/admin/solutions/order`

### Solution Types (Admin)

Similar structure to Product Types API.

### Industries (Admin)

Similar structure to Products API.

### Careers (Admin)

#### GET `/api/admin/careers`
Get all career postings.

#### POST `/api/admin/careers`
Create career posting.

**Request Body:**
```json
{
  "jobTitle": "string",
  "location": "string",
  "workType": "string",
  "jobDescription": "string",
  "keyResponsibilities": ["string"],
  "requiredQualifications": ["string"],
  "experienceLevel": "string",
  "salaryRange": "string",
  "applicationLink": "string",
  "applicationDeadline": "string | null",
  "status": "open" | "taking-applications" | "closed"
}
```

#### PATCH `/api/admin/careers/[id]`
Update career posting.

#### DELETE `/api/admin/careers/[id]`
Delete career posting.

### Quick Contacts (Admin)

#### GET `/api/admin/quick-contacts`
Get all quick contact submissions.

#### PATCH `/api/admin/quick-contacts/[id]`
Mark quick contact as read.

**Request Body:**
```json
{
  "read": true
}
```

#### DELETE `/api/admin/quick-contacts/[id]`
Delete quick contact.

### Contact Forms (Admin)

#### GET `/api/admin/contact-forms`
Get all contact form submissions.

#### PATCH `/api/admin/contact-forms/[id]`
Update contact form (mark as read, add reply).

**Request Body:**
```json
{
  "read": true,
  "reply": "string" // optional
}
```

### Users (Admin)

#### GET `/api/users`
Get all users (admin only).

#### POST `/api/users`
Create new user (admin only).

**Request Body:**
```json
{
  "email": "string",
  "password": "string",
  "role": "admin" | "manager",
  "disabled": boolean,
  "displayName": "string" // optional
}
```

#### PATCH `/api/users/[id]`
Update user.

**Request Body:**
```json
{
  "role": "admin" | "manager",
  "disabled": boolean,
  "displayName": "string"
}
```

### Analytics

#### GET `/api/analytics`
Get Google Analytics data.

**Response:**
```json
{
  "realtime": number,
  "sessionsUsers": [
    {
      "date": "string",
      "sessions": number,
      "users": number
    }
  ],
  "engagement": number
}
```

## Error Responses

All APIs return standard error responses:

```json
{
  "error": "Error message",
  "details": [...] // optional, for validation errors
}
```

**Status Codes:**
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Rate Limiting

Public APIs (contact forms, quick contact) have rate limiting:
- **Contact Form**: 1 submission per day per IP
- **Quick Contact**: 5 submissions per hour per IP

Rate limit errors return `429` status with message.

