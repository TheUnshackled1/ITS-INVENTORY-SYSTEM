# 🌐 Production Deployment Guide — PythonAnywhere & Linux

> Comprehensive, step-by-step production deployment guide for the **ITS Inventory Management System** on **PythonAnywhere** and Linux servers (Nginx + Gunicorn + PostgreSQL).

---

## 📋 Table of Contents

- [Live Demo Target](#-live-demo-target)
- [Prerequisites](#-prerequisites)
- [PythonAnywhere Deployment](#-pythonanywhere-deployment)
  - [Step 1: Clone the Repository](#step-1-clone-the-repository)
  - [Step 2: Create & Activate Virtual Environment](#step-2-create--activate-virtual-environment)
  - [Step 3: Install Dependencies](#step-3-install-dependencies)
  - [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
  - [Step 5: Database Setup & Migrations](#step-5-database-setup--migrations)
  - [Step 6: Collect Static Files](#step-6-collect-static-files)
  - [Step 7: Configure PythonAnywhere Web Tab & WSGI](#step-7-configure-pythonanywhere-web-tab--wsgi)
  - [Step 8: Configure Static File Mappings](#step-8-configure-static-file-mappings)
  - [Step 9: Enable HTTPS / SSL](#step-9-enable-https--ssl)
- [Linux VPS Deployment (Nginx + Gunicorn + PostgreSQL)](#-linux-vps-deployment-nginx--gunicorn--postgresql)
- [Post-Deployment Health Check](#-post-deployment-health-check)

---

## 🌐 Live Demo Target

The official live production instance is deployed at:  
**`http://itsinventory.pythonanywhere.com/`**

---

## ✅ Prerequisites

Before deploying, ensure you have:
- A **PythonAnywhere Account** (Free or Paid Plan).
- A valid **Gmail Account & App Password** for sending 6-digit registration/recovery OTPs via SMTP.
- Python **3.13** selected as the default web application environment.

---

## ☁️ PythonAnywhere Deployment

### Step 1: Clone the Repository

Log into PythonAnywhere, open a **Bash Console**, and clone the project into your home directory:

```bash
cd ~
git clone https://github.com/TheUnshackled1/ITS-INVENTORY-SYSTEM.git system
cd system
```

---

### Step 2: Create & Activate Virtual Environment

Create a dedicated virtual environment using Python 3.13:

```bash
python3.13 -m venv env
source env/bin/activate
```

---

### Step 3: Install Dependencies

Upgrade `pip` and install all required packages:

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

This installs Django 5.2, `openpyxl`, `pandas`, `numpy`, `Pillow`, `django-admin-interface`, and related dependencies.

---

### Step 4: Configure Environment Variables

Create a `.env` file in the project root (`~/system/.env`) or export environment variables in PythonAnywhere:

```bash
nano ~/system/.env
```

Add the following production configuration:

```env
DEBUG=False
SECRET_KEY=your-secure-random-production-secret-key-here
ALLOWED_HOSTS=itsinventory.pythonanywhere.com,localhost,127.0.0.1
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_gmail_app_password
```

---

### Step 5: Database Setup & Migrations

Run database migrations and create an admin superuser:

```bash
python manage.py migrate
python manage.py createsuperuser
```

---

### Step 6: Collect Static Files

Gather all static assets (CSS, JS, images, admin assets) into the `staticfiles` directory:

```bash
python manage.py collectstatic --noinput
```

---

### Step 7: Configure PythonAnywhere Web Tab & WSGI

1. Navigate to the **Web Tab** in your PythonAnywhere dashboard.
2. Select or create a **Manual Configuration** app selecting **Python 3.13**.
3. Set **Virtualenv Path**:
   ```
   /home/yourusername/system/env
   ```
4. Set **Source Code Path**:
   ```
   /home/yourusername/system
   ```
5. Click on the **WSGI Configuration File** link (`/var/www/yourusername_pythonanywhere_com_wsgi.py`) and replace its content with:

```python
import os
import sys

# Path to your project directory
path = '/home/yourusername/system'
if path not in sys.path:
    sys.path.append(path)

# Set environment variables if using .env
from dotenv import load_dotenv
load_dotenv(os.path.join(path, '.env'))

os.environ['DJANGO_SETTINGS_MODULE'] = 'its_inventory.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

*(Replace `yourusername` with your actual PythonAnywhere username).*

---

### Step 8: Configure Static File Mappings

In the **Web Tab** under **Static Files**, configure the URL-to-directory mappings:

| URL | Directory Path |
|---|---|
| `/static/` | `/home/yourusername/system/static/` |
| `/staticfiles/` | `/home/yourusername/system/staticfiles/` |

---

### Step 9: Enable HTTPS / SSL

1. In the **Web Tab**, scroll down to the **Security** section.
2. Turn ON **"Force HTTPS"**.
3. Click the green **"Reload yourusername.pythonanywhere.com"** button at the top of the Web Tab.

---

## 🐧 Linux VPS Deployment (Nginx + Gunicorn + PostgreSQL)

For production deployments on Ubuntu/Debian Linux VPS instances:

### 1. Install System Packages
```bash
sudo apt update && sudo apt install -y python3.13 python3.13-venv postgresql postgresql-contrib nginx curl git
```

### 2. Configure PostgreSQL
```sql
CREATE DATABASE system_db;
CREATE USER system_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE system_db TO system_user;
```

### 3. Gunicorn Systemd Service (`/etc/systemd/system/gunicorn.service`)
```ini
[Unit]
Description=gunicorn daemon for ITS Inventory System
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/system
ExecStart=/var/www/system/env/bin/gunicorn --access-logfile - --workers 3 --bind unix:/var/www/system/system.sock its_inventory.wsgi:application

[Install]
WantedBy=multi-user.target
```

### 4. Nginx Server Block (`/etc/nginx/sites-available/system`)
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /static/ {
        alias /var/www/system/staticfiles/;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/var/www/system/system.sock;
    }
}
```

---

## 🧪 Post-Deployment Health Check

After reloading the application, verify the following:

1. **Dashboard & Views**: Visit `https://itsinventory.pythonanywhere.com/` — verify that CSS styling, fonts, and icons render correctly.
2. **Database Integrity**: Log in via `https://itsinventory.pythonanywhere.com/login/` and test creating/editing an inventory item.
3. **Email & OTP Delivery**: Perform a test user signup or password recovery to confirm 6-digit OTP codes arrive in your inbox within 5 seconds.
4. **Excel Import**: Test uploading a sample `.xlsx` or `.csv` spreadsheet via the upload modal.
5. **System Logs**: Run `python manage.py check` to verify zero system issues reported.
