# 🚀 ITS Inventory Management System — Setup Instructions

> Detailed step-by-step guide for setting up the project on **Windows** with **Python 3.13+**.

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [1. Clone the Repository](#1-clone-the-repository)
- [2. Set Up a Virtual Environment](#2-set-up-a-virtual-environment)
- [3. Install Dependencies](#3-install-dependencies)
- [4. Configure the Database](#4-configure-the-database)
  - [Option A — SQLite (Default)](#option-a--sqlite-default)
  - [Option B — PostgreSQL (Production)](#option-b--postgresql-production)
- [5. Run Migrations](#5-run-migrations)
- [6. Create a Superuser](#6-create-a-superuser)
- [7. Collect Static Files](#7-collect-static-files-optional)
- [8. Start the Development Server](#8-start-the-development-server)
- [Troubleshooting](#-troubleshooting)
- [Running in Production](#-running-in-production)

---

## ✅ Prerequisites

Make sure the following are installed on your Windows machine before you begin:

| Tool | Minimum Version | Download |
|---|---|---|
| **Python** | 3.13 | https://www.python.org/downloads/ |
| **pip** | Latest | Bundled with Python |
| **Git** | Any | https://git-scm.com/download/win |
| **PostgreSQL** *(optional)* | 14+ | https://www.postgresql.org/download/windows/ |

> 💡 During Python installation, check **"Add Python to PATH"** to ensure `python` and `pip` are available in PowerShell.

---

## 1. Clone the Repository

Open **PowerShell** and run:

```powershell
git clone <repository-url>
cd system
```

Replace `<repository-url>` with the actual GitHub URL of this project.

---

## 2. Set Up a Virtual Environment

It is strongly recommended to use a virtual environment to isolate project dependencies.

```powershell
# Create the virtual environment
python -m venv env

# Activate it (PowerShell)
.\env\Scripts\Activate
```

You should see `(env)` prepended to your shell prompt, confirming activation.

> ⚠️ If you see a script execution policy error, run this first:
> ```powershell
> Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

To deactivate the environment at any time:
```powershell
deactivate
```

---

## 3. Install Dependencies

With your virtual environment active, install all required packages:

```powershell
pip install -r requirements.txt
```

This installs:
- Django 6.0.6 (Web framework)
- openpyxl 3.1.5 (Excel file parsing for `.xlsx` bulk imports)
- asgiref 3.11.1 (Async support)
- sqlparse 0.5.5 (SQL formatting)
- et-xmlfile 2.0.0 (openpyxl dependency)
- tzdata 2026.2 (Timezone data for `Asia/Manila`)

> 💡 If you encounter errors, ensure your pip is up to date:
> ```powershell
> python -m pip install --upgrade pip
> ```

---

## 4. Configure the Database

### Option A — SQLite *(Default)*

SQLite requires **zero configuration** and is perfect for local development. The project is pre-configured to use SQLite out of the box.

No environment variables or database setup needed — just run migrations and you're ready to go.

> The `db.sqlite3` file will be created automatically in the project root when you run migrations.

---

### Option B — PostgreSQL *(Production)*

For production deployments, PostgreSQL is recommended for reliability and concurrency.

**Step 1 — Install the PostgreSQL adapter:**

```powershell
pip install psycopg[binary]
```

**Step 2 — Create the database and user in psql:**

```sql
CREATE DATABASE its_inventory_db;
CREATE USER its_user WITH PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE its_inventory_db TO its_user;
```

**Step 3 — Update `its_inventory/settings.py`:**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'its_inventory_db',
        'USER': 'its_user',
        'PASSWORD': 'your_strong_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

> ⚠️ Never commit database passwords to version control. Use environment variables or a `.env` file in production.

---

## 5. Run Migrations

Apply all database migrations to set up the schema:

```powershell
python manage.py migrate
```

Expected output: a list of applied migrations ending with `OK`.

The following tables will be created:
- `inventory_inventory` — Equipment records (type, brand, model, serial, status, location, etc.)
- `inventory_issuancelog` — Borrowing transactions (borrower, dates, quantities, status)
- `inventory_auditlog` — Activity trail (actions, before/after snapshots, user attribution)

---

## 6. Create a Superuser

Create the first admin account:

```powershell
python manage.py createsuperuser
```

You will be prompted to enter:
- **Username** — choose any username
- **Email** — optional but recommended
- **Password** — must meet Django's password strength requirements

> This account is used to log in to both the main application at `/login/` and the Django Admin panel at `/admin/`.

---

## 7. Collect Static Files *(Optional)*

Only required if you are testing static file serving with WhiteNoise or deploying to production:

```powershell
python manage.py collectstatic --noinput
```

> For local development with `DEBUG = True`, Django serves static files automatically — no collection needed.

---

## 8. Start the Development Server

```powershell
python manage.py runserver
```

The application will be available at:

| URL | Description |
|---|---|
| **http://127.0.0.1:8000/** | Inventory Dashboard (redirects to login if not authenticated) |
| **http://127.0.0.1:8000/login/** | Login page |
| **http://127.0.0.1:8000/borrowing/** | Borrowing Tracker |
| **http://127.0.0.1:8000/activity-log/** | Activity Log (full audit trail) |
| **http://127.0.0.1:8000/upload/** | Excel/CSV bulk import |
| **http://127.0.0.1:8000/admin/** | Django Admin panel |

Log in at `/login/` with the superuser credentials you just created. The sidebar navigation provides access to all three main views: **Dashboard**, **Borrowing**, and **Activity Logs**.

---

## 🔧 Troubleshooting

### `'python' is not recognized as an internal or external command`
Python is not on your PATH. Re-install Python and check **"Add Python to PATH"**, or use the full path: `C:\Users\<you>\AppData\Local\Programs\Python\Python313\python.exe`.

---

### `ModuleNotFoundError: No module named 'django'`
Your virtual environment is not activated. Run:
```powershell
.\env\Scripts\Activate
```

---

### `django.db.utils.OperationalError: no such table`
You have not run migrations yet. Run:
```powershell
python manage.py migrate
```

---

### Script execution policy error on `Activate`
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

### Static files not loading in browser
Ensure `DEBUG = True` in `its_inventory/settings.py` for local development. Django serves static files automatically in debug mode. If deploying, run `python manage.py collectstatic` and configure WhiteNoise.

---

### `pip install` fails on `openpyxl`
Try upgrading pip first:
```powershell
python -m pip install --upgrade pip
pip install openpyxl
```

---

### Excel upload fails or skips rows
The bulk import expects data starting from **row 4** of the spreadsheet (rows 1–3 are treated as headers). Ensure your `.xlsx` or `.csv` file follows the expected column order:

| Column | A | B | C | D | E | F | G | H | I | J | K |
|---|---|---|---|---|---|---|---|---|---|---|---|
| **Field** | Item Type | Description | Brand | Model | Serial No. | Qty | Disposal Date | Inventory Date | Location | Status | Defect Info |

---

### `psycopg.OperationalError: connection refused` *(PostgreSQL only)*
PostgreSQL is not running. Start it via **Services** (`services.msc`) or:
```powershell
net start postgresql-x64-16
```
Or switch back to SQLite by reverting the `DATABASES` setting in `settings.py`.

---

## 🌐 Running in Production

> ⚠️ Review all security settings before exposing this to the internet.

**1. Set environment variables:**
```powershell
$env:DEBUG = "False"
$env:SECRET_KEY = "your-random-secret-key-here"
$env:ALLOWED_HOSTS = "yourdomain.com,www.yourdomain.com"
```

**2. Install a production WSGI server:**
```powershell
pip install gunicorn
```

**3. Run with Gunicorn:**
```bash
gunicorn its_inventory.wsgi:application --bind 0.0.0.0:8000 --workers 3
```

**4. Serve static files with WhiteNoise:**
```powershell
pip install whitenoise
```
Add to `MIDDLEWARE` in `settings.py`:
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this line
    # ... rest of middleware
]
```

**5. Use PostgreSQL** — do not use SQLite in production.

**6. Recommended: manage secrets with `django-environ`:**
```powershell
pip install django-environ
```
Then load from a `.env` file in `settings.py`:
```python
import environ
env = environ.Env()
environ.Env.read_env()

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', default=False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=[])
```

---

## 🗂️ Quick Reference

```powershell
# Full setup from scratch (PowerShell)
git clone <repo-url> && cd system
python -m venv env
.\env\Scripts\Activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

---

*For an overview of the system and its features, see [README.md](README.md).*
