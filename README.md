  # HireSense - Unified Full-Stack Job Application Platform

  HireSense (Project-J) is a premium full-stack job board platform built with Spring Boot (Backend) and React (Frontend) that connects recruiters with candidates. 

  ## 🏗️ Architecture

  This project is built using a **single-port unified full-stack architecture**. When you package the backend using Maven, it downloads node/npm, compiles the React frontend assets, and copies the static bundle to the backend's resource folder to serve both the client application and the REST API endpoints from a single server port (`3000`). Redis is integrated as a caching layer to reduce redundant database queries and improve application performance.

  ### Tech Stack

  **Backend:**
  - Java 21 / 25
  - Spring Boot 3.2.3
  - Spring Security with JWT Authentication
  - Spring Data JPA & PostgreSQL
  - Redis (Application Caching)
  - Cloudinary (Resume Attachment Storage)
  - JavaMailSender (Shortlisting automated emails)
  - Maven

  **Frontend:**
  - React (Vite)
  - React Router DOM
  - Vanilla CSS (Tailwind-free premium themes)

  ## 📊 Database Schema

  ### Entities

  1. **User** - Base authentication entity
    - id, email, password, role (CANDIDATE/RECRUITER)

  2. **Recruiter** - Recruiter profile
    - id, name, email, companyName, designation
    - OneToOne relationship with User

  3. **Candidate** - Candidate profile
    - id, name, email, skills, experience, resumeUrl
    - OneToOne relationship with User

  4. **Job** - Job posting
    - id, role, description, skills, experience, postedAt
    - ManyToOne relationship with Recruiter

  5. **Application** - Job application
    - id, applicationStatus, resumeUrl, appliedAt
    - ManyToOne relationship with Candidate and Job
    - Unique constraint on (candidate_id, job_id)

  ### Enums
  - **Role**: CANDIDATE, RECRUITER
  - **ApplicationStatus**: PENDING, ACCEPTED, REJECTED

  ## 🔐 Authentication

  The application uses JWT (JSON Web Token) for authentication:
  - Token expiration: 5 minutes (configurable via `jwt.expiration`)
  - Secret key: Configured in application.properties
  - All endpoints except `/auth/**` require authentication
  - Token format: `Authorization: Bearer <token>`

  ## ⚡ Redis Caching & Performance

  Redis is used as an application-level caching layer to reduce repeated database queries for frequently accessed data.

  ### Caching Benefits
  - Reduces redundant PostgreSQL database queries
  - Improves response performance for cacheable operations
  - Offloads frequently requested data from the primary database
  - Supports faster retrieval of cached application data

  ### Load Test Results

  The application was load tested with Redis enabled using **20 virtual users**.

  | Metric | Result |
  |---|---:|
  | Virtual Users | 20 |
  | Total Requests | 4,220 |
  | Throughput | **122.93 req/s** |
  | Average Response Time | **134 ms** |
  | P90 Latency | 253 ms |
  | P95 Latency | 485 ms |
  | P99 Latency | 1,868 ms |
  | Error Rate | **0%** |
  | Failure Rate | **0%** |
  | Peak CPU Usage | 52.2% |
  | Peak Memory Usage | 97.7% |

  ### Performance Summary

  With Redis enabled, HireSense handled **4,220 requests at approximately 123 requests/sec with zero errors**, with an average response time of **134 ms**. The load test demonstrates stable request handling under the tested 20-user workload.

  > **Note:** These results represent the current Redis-enabled configuration. A PostgreSQL-only test using the same workload is required to quantify the performance improvement attributable specifically to Redis.

  ## 🚀 API Endpoints

  ### Base URL
  ```
  http://localhost:3000
  ```

  ### Public Endpoints

  #### Home
  ```http
  GET /
  ```
  **Response:**
  ```json
  {
    "message": "API is working",
    "statusCode": 200,
    "data": "Server is running...."
  }
  ```

  ---

  ### Authentication Endpoints (`/auth`)

  #### Register Candidate
  ```http
  POST /auth/register/candidate
  Content-Type: multipart/form-data
  ```
  **Request:**
  - `candidate` (JSON):
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "password123",
      "skills": ["Java", "Spring Boot"],
      "experience": 3
    }
    ```
  - `resume` (File): PDF/DOC file

  **Response:**
  ```json
  {
    "message": "Candidate registered successfully",
    "statusCode": 200,
    "data": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "skills": ["Java", "Spring Boot"],
      "experience": 3,
      "resumeUrl": "https://cloudinary.com/..."
    }
  }
  ```

  #### Register Recruiter
  ```http
  POST /auth/register/recruiter
  Content-Type: application/json
  ```
  **Request:**
  ```json
  {
    "name": "Jane Smith",
    "email": "jane@company.com",
    "password": "password123",
    "companyName": "Tech Corp",
    "designation": "HR Manager"
  }
  ```

  **Response:**
  ```json
  {
    "message": "Recruiter registered successfully",
    "statusCode": 200,
    "data": {
      "id": 1,
      "name": "Jane Smith",
      "email": "jane@company.com",
      "companyName": "Tech Corp",
      "designation": "HR Manager"
    }
  }
  ```

  #### Login
  ```http
  POST /auth/login
  Content-Type: application/json
  ```
  **Request:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

  **Response:**
  ```json
  {
    "message": "Login Success",
    "statusCode": 200,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiJ9...",
      "user": {
        "id": 1,
        "email": "user@example.com",
        "role": "CANDIDATE"
      }
    }
  }
  ```

  ---

  ### Recruiter Endpoints (`/recruiter`)
  **All endpoints require JWT authentication**

  #### Post a Job
  ```http
  POST /recruiter/post-job
  Authorization: Bearer <token>
  Content-Type: application/json
  ```
  **Request:**
  ```json
  {
    "role": "Senior Java Developer",
    "description": "Looking for experienced Java developer...",
    "skills": ["Java", "Spring Boot", "PostgreSQL"],
    "experience": 5
  }
  ```

  **Response:**
  ```json
  {
    "message": "Job posted Successfully",
    "statusCode": 200,
    "data": {
      "id": 1,
      "role": "Senior Java Developer",
      "description": "Looking for experienced Java developer...",
      "skills": ["Java", "Spring Boot", "PostgreSQL"],
      "experience": 5,
      "postedAt": "2026-03-27T18:30:00"
    }
  }
  ```

  **Note:** The recruiter is automatically extracted from the JWT token. Do not send recruiter information in the request body.

  #### Get Jobs Posted by Recruiter
  ```http
  GET /recruiter/get-jobs-posted/{recruiter_id}
  Authorization: Bearer <token>
  ```

  **Path Parameters:**
  - `recruiter_id` - ID of the recruiter

  **Response:**
  ```json
  {
    "message": "Jobs posted Successfully",
    "statusCode": 200,
    "data": [
      {
        "id": 1,
        "role": "Senior Java Developer",
        "description": "Looking for experienced Java developer...",
        "skills": ["Java", "Spring Boot", "PostgreSQL"],
        "experience": 5,
        "postedAt": "2026-03-27T18:30:00"
      }
    ]
  }
  ```

  #### Update Application Status
  ```http
  PATCH /recruiter/update-status/{application_id}?applicationStatus=ACCEPTED
  Authorization: Bearer <token>
  ```

  **Path Parameters:**
  - `application_id` - ID of the application

  **Query Parameters:**
  - `applicationStatus`: PENDING | ACCEPTED | REJECTED

  **Response:**
  ```json
  {
    "message": "Application updated successfully",
    "statusCode": 200,
    "data": {
      "id": 1,
      "applicationStatus": "ACCEPTED",
      "appliedAt": "2026-03-27T18:30:00"
    }
  }
  ```

  ---

  ### Candidate Endpoints (`/candidate`)
  **All endpoints require JWT authentication**

  #### Apply for a Job
  ```http
  POST /candidate/apply-job/{candidate_id}/{job_id}
  Authorization: Bearer <token>
  ```

  **Path Parameters:**
  - `candidate_id` - ID of the candidate
  - `job_id` - ID of the job

  **Response:**
  ```json
  {
    "message": "Application applied",
    "statusCode": 200,
    "data": {
      "id": 1,
      "applicationStatus": "PENDING",
      "resumeUrl": "https://cloudinary.com/...",
      "appliedAt": "2026-03-27T18:30:00"
    }
  }
  ```

  **Error Response (Duplicate Application):**
  ```json
  {
    "message": "Application not found",
    "statusCode": 400,
    "data": null
  }
  ```

  #### Get All Jobs
  ```http
  GET /candidate/get-all-jobs
  Authorization: Bearer <token>
  ```

  **Response:**
  ```json
  {
    "message": "Jobs found",
    "statusCode": 200,
    "data": [
      {
        "id": 1,
        "role": "Senior Java Developer",
        "description": "Looking for experienced Java developer...",
        "skills": ["Java", "Spring Boot", "PostgreSQL"],
        "experience": 5,
        "postedAt": "2026-03-27T18:30:00",
        "recruiter": {
          "id": 1,
          "name": "Jane Smith",
          "companyName": "Tech Corp"
        }
      }
    ]
  }
  ```

  #### Get All Applications by Candidate
  ```http
  GET /candidate/get-all-applications/{candidate_id}
  Authorization: Bearer <token>
  ```

  **Path Parameters:**
  - `candidate_id` - ID of the candidate

  **Response:**
  ```json
  {
    "message": "Job Applications found",
    "statusCode": 200,
    "data": [
      {
        "id": 1,
        "applicationStatus": "PENDING",
        "resumeUrl": "https://cloudinary.com/...",
        "appliedAt": "2026-03-27T18:30:00",
        "job": {
          "id": 1,
          "role": "Senior Java Developer",
          "companyName": "Tech Corp"
        }
      }
    ]
  }
  ```

  ---

  ## 🛠️ Setup Instructions

  ### Prerequisites
  - Java 21
  - Maven 3.6+
  - PostgreSQL (or Neon Database account)
  - Node.js 18+ and npm
  - Cloudinary account
  - Redis server (local or hosted)

  ### Backend Setup

  1. **Clone the repository**
    ```bash
    git clone <repository-url>
    cd Project-J/projectj-backend
    ```

  2. **Configure application.properties**
    
    Create or update `src/main/resources/application.properties`:
    ```properties
    # Application Configuration
    spring.application.name=projectj
    server.port=3000
    
    # Database Configuration
    spring.datasource.url=jdbc:postgresql://<your-db-host>/<database-name>?sslmode=require
    spring.datasource.username=<username>
    spring.datasource.password=<password>
    spring.datasource.driver-class-name=org.postgresql.Driver
    spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
    spring.jpa.hibernate.ddl-auto=update
    spring.jpa.show-sql=true
    
    # Cloudinary Configuration
    cloudinary.cloud_name=<your-cloud-name>
    cloudinary.api_key=<your-api-key>
    cloudinary.api_secret=<your-api-secret>
    
    # JWT Configuration
    jwt.secret=<your-secret-key-min-256-bits-long>
    jwt.expiration=300000
    
    # Logging
    logging.level.org.springframework.web=DEBUG
    logging.level.org.springframework.security=DEBUG
    ```

  3. **Build the project**
    ```bash
    mvn clean install
    ```

  4. **Run the application**
    ```bash
    mvn spring-boot:run
    ```

    Server will start on `http://localhost:3000`

  ### Frontend Setup

  1. **Navigate to frontend directory**
    ```bash
    cd ../projectj-frontend
    ```

  2. **Install dependencies**
    ```bash
    npm install
    ```

  3. **Configure API base URL**
    
    Update the API base URL in your frontend configuration to point to `http://localhost:3000`

  4. **Run development server**
    ```bash
    npm run dev
    ```

  ---

  ## 📁 Project Structure

  ```
  Project-J/
  ├── projectj-backend/
  │   ├── src/
  │   │   ├── main/
  │   │   │   ├── java/com/backend/
  │   │   │   │   ├── config/          # Security & JWT configuration
  │   │   │   │   │   ├── JWTFilter.java
  │   │   │   │   │   └── SecurityConfig.java
  │   │   │   │   ├── controllers/     # REST API controllers
  │   │   │   │   │   ├── AuthController.java
  │   │   │   │   │   ├── CandidateController.java
  │   │   │   │   │   ├── RecruiterController.java
  │   │   │   │   │   └── HomeController.java
  │   │   │   │   ├── dto/             # Data Transfer Objects
  │   │   │   │   │   ├── CandidateRequest.java
  │   │   │   │   │   ├── RecruiterRequest.java
  │   │   │   │   │   └── UserRequest.java
  │   │   │   │   ├── entities/        # JPA entities
  │   │   │   │   │   ├── User.java
  │   │   │   │   │   ├── Recruiter.java
  │   │   │   │   │   ├── Candidate.java
  │   │   │   │   │   ├── Job.java
  │   │   │   │   │   ├── Application.java
  │   │   │   │   │   ├── Role.java
  │   │   │   │   │   └── ApplicationStatus.java
  │   │   │   │   ├── repositories/    # Data access layer
  │   │   │   │   ├── security/        # Security services
  │   │   │   │   │   └── MyUserDetailsService.java
  │   │   │   │   └── services/        # Business logic
  │   │   │   │       ├── AuthService.java
  │   │   │   │       ├── JWTService.java
  │   │   │   │       ├── CandidateService.java
  │   │   │   │       └── RecruiterService.java
  │   │   │   └── resources/
  │   │   │       └── application.properties
  │   │   └── test/
  │   └── pom.xml
  ├── projectj-frontend/
  │   ├── src/
  │   │   ├── assets/
  │   │   ├── App.jsx
  │   │   ├── App.css
  │   │   ├── main.jsx
  │   │   └── index.css
  │   ├── public/
  │   ├── package.json
  │   └── vite.config.js
  ├── features.txt
  └── README.md
  ```

  ---

  ## 🔒 Security Features

  - **Password Encryption**: BCrypt hashing algorithm
  - **JWT Authentication**: Stateless token-based authentication
  - **Role-Based Access Control**: CANDIDATE and RECRUITER roles
  - **CORS Configuration**: Cross-origin resource sharing enabled
  - **Protected Endpoints**: Spring Security filter chain
  - **Token Expiration**: Automatic token invalidation after 5 minutes
  - **Secure File Upload**: Cloudinary integration with secure URLs

  ---

  ## 🌐 External Services

  ### PostgreSQL (Neon Database)
  - Cloud-hosted PostgreSQL database
  - Connection pooling enabled
  - SSL mode required for secure connections
  - Automatic schema updates via Hibernate

  ### Redis
  - Application-level caching layer
  - Reduces repeated database queries
  - Used to improve retrieval performance for cacheable data

  ### Cloudinary
  - Resume file storage and management
  - Secure file upload and retrieval
  - CDN-backed file delivery
  - Supported formats: PDF, DOC, DOCX

  ---

  ## 📝 Response Format

  All API responses follow this standardized structure:

  ```json
  {
    "message": "Description of the result",
    "statusCode": 200,
    "data": { /* Response data or null */ }
  }
  ```

  **Status Codes:**
  - `200` - Success
  - `400` - Bad Request / Validation Error / Duplicate Entry
  - `403` - Forbidden / Authentication Failed
  - `500` - Internal Server Error

  ---

  ## 🐛 Common Issues & Solutions

  ### 1. JWT Token Expired
  **Error:** `JWT expired X milliseconds ago`

  **Solution:** 
  - Tokens expire after 5 minutes by default
  - Login again to get a new token
  - Consider implementing refresh tokens for production

  ### 2. Signature Exception
  **Error:** `JWT signature does not match locally computed signature`

  **Solution:**
  - Ensure `jwt.secret` in application.properties is consistent
  - Don't use randomly generated keys that change on restart
  - Use a fixed secret key of at least 256 bits

  ### 3. Foreign Key Constraint Violation
  **Error:** `Key (recruiter_id)=(X) is not present in table "recruiter"`

  **Solution:**
  - Ensure the recruiter/candidate exists before creating related entities
  - The system now automatically extracts recruiter from JWT token
  - Don't manually set recruiter_id in job posting requests

  ### 4. Duplicate Application
  **Error:** Application already exists for this candidate and job

  **Solution:**
  - Check if candidate has already applied to this job
  - Database enforces unique constraint on (candidate_id, job_id)

  ### 5. File Upload Issues
  **Error:** Cloudinary upload failed

  **Solution:**
  - Verify Cloudinary credentials in application.properties
  - Check file size limits (default: 10MB)
  - Ensure file format is supported (PDF, DOC, DOCX)

  ---

  ## 🧪 Testing the API

  ### Using cURL

  **Login:**
  ```bash
  curl -X POST http://localhost:3000/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"user@example.com","password":"password123"}'
  ```

  **Get All Jobs (with token):**
  ```bash
  curl -X GET http://localhost:3000/candidate/get-all-jobs \
    -H "Authorization: Bearer YOUR_TOKEN_HERE"
  ```

  ### Using Postman

  1. Import the API endpoints
  2. Set up environment variables for base URL and token
  3. Use the login endpoint to get a token
  4. Add token to Authorization header for protected endpoints

  ---

  ## 🚀 Deployment

  ### Backend Deployment

  **Option 1: JAR Deployment**
  ```bash
  mvn clean package
  java -jar target/projectj-0.0.1-SNAPSHOT.jar
  ```

  **Option 2: Docker**
  ```dockerfile
  FROM openjdk:21-jdk-slim
  COPY target/projectj-0.0.1-SNAPSHOT.jar app.jar
  ENTRYPOINT ["java","-jar","/app.jar"]
  ```

  ### Frontend Deployment

  ```bash
  npm run build
  # Deploy the dist/ folder to your hosting service
  ```

  ### Environment Variables for Production

  Set these environment variables instead of hardcoding in application.properties:
  - `DATABASE_URL`
  - `DATABASE_USERNAME`
  - `DATABASE_PASSWORD`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`
  - `JWT_SECRET`
  - `JWT_EXPIRATION`
  - `REDIS_HOST`
  - `REDIS_PORT`

  ---

  ## 🚧 Future Enhancements

  - [ ] Refresh token implementation for extended sessions
  - [x] Email notifications for application status updates (Shortlist confirmation emails)
  - [x] Advanced job search with filters (Instant client-side search by title or skills)
  - [x] Recruiter analytics dashboard (Detailed application counts: Total, Approved, Rejected)
  - [ ] Resume parsing and skill extraction
  - [ ] Interview scheduling system
  - [ ] Real-time notifications using WebSockets
  - [ ] Job recommendation engine
  - [ ] Multi-language support
  - [ ] Mobile application (React Native)
  - [ ] Video interview integration
  - [ ] Applicant tracking system (ATS)

  ---

  ## 📚 API Documentation

  For detailed API documentation, consider integrating:
  - **Swagger/OpenAPI**: Auto-generated interactive API docs
  - **Postman Collection**: Shareable API collection

  ---

  ## 🤝 Contributing

  1. Fork the repository
  2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
  3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
  4. Push to the branch (`git push origin feature/AmazingFeature`)
  5. Open a Pull Request

  ---

  ## 📄 License

  This project is licensed under the MIT License - see the LICENSE file for details.

  ---


  ---

  ## 🙏 Acknowledgments

  - Spring Boot Documentation
  - JWT.io for JWT resources
  - Cloudinary for file storage
  - Neon Database for PostgreSQL hosting
  - React and Vite communities

  ---

  **Built with ❤️ using Spring Boot and React**
