# Coffee Shop Backend with M-Pesa Integration

A robust Node.js backend application for processing coffee shop payments using M-Pesa STK Push. This application provides a secure and efficient way to handle mobile payments through Safaricom's M-Pesa service.

## 🚀 Features

- **M-Pesa STK Push Integration**
  - Secure payment processing
  - Real-time payment status updates
  - Automated payment confirmation handling

- **Database Management**
  - MySQL database for transaction storage
  - Efficient payment tracking and history
  - Transaction status monitoring

- **Security Features**
  - Helmet.js for security headers
  - CORS protection
  - Rate limiting (100 requests per 15 minutes per IP)
  - Input validation and sanitization
  - Secure logging with Winston

- **Error Handling**
  - Comprehensive error logging
  - User-friendly error messages
  - Transaction rollback support

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- M-Pesa API credentials (Sandbox or Production)
- ngrok (for local development and testing)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd coffee-shop-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory with the following variables:
   ```env
   PORT=3000
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DATABASE=cafe
   MPESA_CONSUMER_KEY=your_consumer_key
   MPESA_CONSUMER_SECRET=your_consumer_secret
   MPESA_SHORTCODE=your_shortcode
   MPESA_PASSKEY=your_passkey
   ```

4. **Set up the database**
   ```bash
   mysql -u root -p < database.sql
   ```

5. **Start ngrok for local development**
   ```bash
   ngrok http 3000
   ```
   Update the `CallBackURL` in `routes/paymentRoutes.js` with your ngrok URL.

## 🔧 Configuration

### M-Pesa API Configuration
- Update the `.env` file with your M-Pesa API credentials
- For sandbox testing, use the provided sandbox credentials
- For production, replace with your production credentials

### Database Configuration
- The application uses MySQL for data storage
- The database schema is defined in `database.sql`
- Configure your database connection in the `.env` file

### Security Configuration
- Rate limiting is set to 100 requests per 15 minutes per IP
- CORS is enabled for cross-origin requests
- Helmet.js is configured for security headers

## 📡 API Endpoints

### 1. Initiate Payment
```
POST /api/pay
Content-Type: application/json

Request Body:
{
  "number": "+254712345678",
  "amount": 500
}

Response:
{
  "message": "Payment initiated",
  "payment_id": "uuid",
  "checkout_request_id": "ws_CO_..."
}
```

### 2. Payment Callback (M-Pesa)
```
POST /api/callback
Content-Type: application/json

Request Body:
{
  "Body": {
    "stkCallback": {
      "ResultDesc": "The service request is processed successfully.",
      "CheckoutRequestID": "ws_CO_...",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 500 },
          { "Name": "MpesaReceiptNumber", "Value": "NLJ7RT61SV" },
          { "Name": "PhoneNumber", "Value": "254712345678" }
        ]
      }
    }
  }
}
```

## 🔍 Database Schema

```sql
CREATE TABLE payments (
    payment_id VARCHAR(36) PRIMARY KEY,
    number VARCHAR(15) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    transaction_id VARCHAR(50) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_transaction_id (transaction_id)
);
```

## 🚨 Error Handling

The application includes comprehensive error handling:
- Input validation errors (400)
- Authentication errors (401)
- Payment processing errors (500)
- Database errors (500)
- Rate limiting errors (429)

All errors are logged using Winston with different log levels:
- Error logs: `error.log`
- Combined logs: `combined.log`
- Console output for development

## 🔒 Security Considerations

1. **API Security**
   - Rate limiting to prevent abuse
   - Input validation and sanitization
   - Secure headers with Helmet.js
   - CORS protection

2. **Data Security**
   - Secure database connections
   - Encrypted environment variables
   - Secure logging practices

3. **Payment Security**
   - Secure token generation
   - Encrypted password generation
   - Secure callback handling

## 🧪 Testing

1. **Local Testing**
   ```bash
   # Start the application
   npm start

   # Test payment endpoint
   curl -X POST http://localhost:3000/api/pay \
   -H "Content-Type: application/json" \
   -d '{"number": "+254712345678", "amount": 500}'
   ```

2. **Production Testing**
   - Use the M-Pesa sandbox environment
   - Test with real phone numbers
   - Verify callback handling
   - Check database updates

## 📝 Logging

The application uses Winston for logging:
- Error logs: `error.log`
- Combined logs: `combined.log`
- Console output for development

Log format:
```json
{
  "level": "info",
  "message": "Payment initiated",
  "timestamp": "2024-02-20T12:00:00.000Z",
  "metadata": {
    "number": "+254712345678",
    "amount": 500
  }
}
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support, please open an issue in the GitHub repository or contact the maintainers.

## 🙏 Acknowledgments

- Safaricom M-Pesa API
- Node.js and Express.js communities
- MySQL community 