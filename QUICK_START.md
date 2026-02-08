# Quick Start Guide

## Prerequisites Checklist

- [ ] XAMPP with PHP and MySQL installed
- [ ] Node.js and npm installed
- [ ] /etc/hosts configured with:
  - `127.0.0.1 instshopee.test`
  - `127.0.0.1 seller.instshopee.test`
  - `127.0.0.1 api.instshopee.test`

## Step-by-Step Startup

### 1. Start Laravel Backend (Terminal 1)
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/instshopee-lara
php artisan serve --host=api.instshopee.test --port=8000
```
✓ Should see: `Laravel development server started`

### 2. Start Buyer App (Terminal 2)
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/instshopee-main
npm run dev
```
✓ Should see: `ready - started server on 0.0.0.0:3000`

### 3. Start Seller Portal (Terminal 3)
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/sellerportal
npm run dev
```
✓ Should see: `ready - started server on 0.0.0.0:3001`

## Quick Test

1. Open browser: http://instshopee.test:3000
2. Click "Login" (top right)
3. Enter test credentials
4. After login, click "Seller Centre" in top nav
5. Should automatically be logged in at http://seller.instshopee.test:3001

## URLs

- **Buyer App**: http://instshopee.test:3000
- **Seller Portal**: http://seller.instshopee.test:3001
- **API**: http://api.instshopee.test:8000

## Troubleshooting

**Can't access sites?**
- Check /etc/hosts has the 3 domain entries
- Restart browser after editing /etc/hosts

**401 Errors?**
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/instshopee-lara
php artisan config:clear
php artisan cache:clear
# Restart Laravel server
```

**Build errors in seller portal?**
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/sellerportal
rm -rf node_modules
npm install
```

## Next Steps

- See `TESTING_GUIDE.md` for comprehensive testing
- See `IMPLEMENTATION_SUMMARY.md` for architecture details
- See `shopeedocs/plan-business-model.md` in instshopee-main for business logic
