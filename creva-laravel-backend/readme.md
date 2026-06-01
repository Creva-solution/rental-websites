# Creva Webzz - Laravel PHP + PostgreSQL API Backend

This is the fully custom, manual backend built specifically for the **Creva Webzz** application to transition away from Supabase into a self-hosted premium architecture using PHP and PostgreSQL.

---

## 🚀 Fast Setup Instructions

### 1. Database Setup (PostgreSQL)
1. Open your PostgreSQL client (e.g., pgAdmin, DBeaver, or command line).
2. Create a new database named `creva_webzz`:
   ```sql
   CREATE DATABASE creva_webzz;
   ```
3. Import the schema and seed data directly from the [database.sql](./database.sql) file.

### 2. Configure Environment Variables
Create a `.env` file in the root of the Laravel backend:
```env
APP_NAME="Creva Webzz API"
APP_ENV=local
APP_KEY=base64:crevawebzzsecretkeyhere1234567890
APP_DEBUG=true
APP_URL=http://localhost:8000

LOG_CHANNEL=stack

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=creva_webzz
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
```

### 3. Run the Development Server
Run the local PHP development server:
```bash
php artisan serve
```
By default, this runs on **`http://localhost:8000`**. The Next.js frontend has been configured to connect directly to this endpoint via our high-fidelity emulation layer.
