# How to Run the Complaint Management System

Follow these steps to run both the Spring Boot backend and the React/Vite frontend.

## 1. Prerequisites
Ensure that your local **PostgreSQL** database server is running on port `5432` before starting the application. The backend requires this database connection to initialize successfully.

## 2. Running the Backend (Spring Boot)

Since your system's default Java version for Maven might be pointing to an older version (Java 8), we need to tell Maven to use Java 23 for this project.

1. Open a new **PowerShell** terminal.
2. Navigate to the root directory of the project:
   ```powershell
   cd c:\Users\suraj\Downloads\complaint-management-system\complaint-management-system
   ```
3. Run the following command to temporarily set the correct Java version and start the backend:
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Java\jdk-23"; .\mvnw.cmd spring-boot:run
   ```
4. Wait for the application to initialize. The backend server will start on `http://localhost:8080`.

## 3. Running the Frontend (React / Vite)

1. Open a **second, separate terminal** (keep the first terminal running the backend).
2. Navigate to the frontend directory:
   ```powershell
   cd c:\Users\suraj\Downloads\complaint-management-system\complaint-management-system\frontend
   ```
3. Start the Vite development server:
   ```powershell
   npm run dev
   ```
4. Open your browser and go to the local URL provided in the terminal (usually `http://localhost:5173/`).

---

**Tip:** If you permanently update your Windows `JAVA_HOME` environment variable to point to `C:\Program Files\Java\jdk-23`, you can simplify the backend command in the future to just: `.\mvnw.cmd spring-boot:run`.
