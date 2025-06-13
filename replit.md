# نظام الأصدقاء للتخليص الكمركي - Customs Clearance Accounting System

## Overview

This is a comprehensive accounting system for a customs clearance business in Arabic, built with Flask and PostgreSQL. The system manages merchant records, debt tracking, partner profit distribution, and financial reporting. It features a professional Arabic RTL interface inspired by governmental design standards.

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python 3.11)
- **Database**: PostgreSQL 16 with SQLAlchemy ORM
- **Authentication**: Flask-Login for user management
- **Deployment**: Gunicorn WSGI server on Replit with autoscale deployment

### Frontend Architecture
- **UI Framework**: Bootstrap 5.3 RTL
- **Font**: Cairo Google Font for Arabic text
- **Icons**: Font Awesome 6.0+
- **Styling**: Custom CSS with governmental design theme
- **JavaScript**: Vanilla JS with modern async/await patterns

### Database Schema
The system uses several interconnected tables:
- `merchant_records`: Core business transactions
- `naber_account`: Cross-border account management (fees + advances only)
- `merchant_payments`: Payment tracking for merchants
- `partners`: Partnership management
- `partner_transactions`: Partner profit distributions
- `withdrawals`: External expense tracking
- `users`: User authentication and role management

## Key Components

### 1. Merchant Record Management
- **Purpose**: Track all customs clearance transactions
- **Key Fields**: Merchant names, drivers, vehicles, goods type, financial amounts
- **Business Logic**: 
  - Total debt = fees + advances + clearance costs
  - Naber account = fees + advances only (cross-border transactions)
  - Profit for partnership = clearance costs only

### 2. Financial Tracking System
- **Debt Management**: Automatic calculation of merchant debts
- **Payment Processing**: Record and track merchant payments
- **Balance Calculation**: Real-time balance updates with before/after amounts

### 3. Partnership Management
- **Partner Profiles**: Manage partner information and profit percentages
- **Profit Distribution**: Both automatic and manual profit distribution
- **Partner Statements**: Individual partner account tracking

### 4. Reporting System
- **Financial Reports**: Comprehensive financial performance analysis
- **Merchant Reports**: Individual merchant debt and payment history
- **Partner Reports**: Partnership profit distribution reports
- **Print System**: Enhanced printing with Arabic RTL support

## Data Flow

1. **Transaction Entry**: Merchant records are created with financial details
2. **Automatic Calculations**: System calculates debts, naber amounts, and available profits
3. **Payment Processing**: Merchant payments update balances and debt status
4. **Profit Distribution**: Available profits are distributed among partners based on percentages
5. **Reporting**: Real-time financial dashboards and detailed reports

## External Dependencies

### Production Dependencies
- Flask 3.1.1+ (web framework)
- Flask-SQLAlchemy 3.1.1+ (database ORM)
- Flask-Login 0.6.3+ (authentication)
- psycopg2-binary 2.9.10+ (PostgreSQL adapter)
- Gunicorn 23.0.0+ (WSGI server)
- Werkzeug 3.1.3+ (utilities)

### Frontend Dependencies
- Bootstrap 5.3 RTL (UI framework)
- Font Awesome 6.0+ (icons)
- Cairo Google Font (Arabic typography)

### Development Tools
- psutil 7.0.0+ (system monitoring)
- requests 2.32.3+ (HTTP client)
- schedule 1.2.2+ (automated tasks)

## Deployment Strategy

### Current Setup (Replit)
- **Platform**: Replit with PostgreSQL 16 module
- **Server**: Gunicorn with autoscale deployment
- **Port Configuration**: Internal 5000, external 80
- **SSL**: Automatic HTTPS through Replit
- **Custom Domain**: Configured for drsindst.com

### Environment Configuration
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: Flask session security key
- `FLASK_ENV`: Production environment setting

### Monitoring and Backup
- **Health Monitoring**: Automated server health checks
- **Backup System**: Automated SQL backup generation
- **System Monitoring**: Memory and connection monitoring
- **Financial Protection**: Data integrity validation

### Scaling Options
1. **Stay with Replit**: Upgrade Neon database ($39/month total)
2. **Migrate to DigitalOcean**: Better control and performance ($21/month)
3. **Cloud Migration**: AWS/Google Cloud for enterprise scale ($25-50/month)

## Changelog
- June 12, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.