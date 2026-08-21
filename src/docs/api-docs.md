# PulseChat API Documentation

## Authentication
### Login / Register
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "phone": "+8801700000000",
    "name": "John Doe"
  }