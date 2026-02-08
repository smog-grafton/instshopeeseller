# Testing Guide: Cross-Domain Cookie Authentication

## Prerequisites

### 1. Verify /etc/hosts Configuration

Open `/etc/hosts` and ensure you have:

```
127.0.0.1 instshopee.test
127.0.0.1 seller.instshopee.test
127.0.0.1 api.instshopee.test
```

### 2. Verify Laravel Configuration

Check `/Applications/XAMPP/xamppfiles/htdocs/instshopee-lara/.env`:

```env
SESSION_DOMAIN=.instshopee.test
SANCTUM_STATEFUL_DOMAINS=instshopee.test,seller.instshopee.test
SESSION_DRIVER=database
SESSION_SECURE_COOKIE=false
APP_URL=http://api.instshopee.test
```

### 3. Verify CORS Configuration

Check `/Applications/XAMPP/xamppfiles/htdocs/instshopee-lara/config/cors.php`:

```php
'allowed_origins' => [
    'http://instshopee.test:3000',
    'http://seller.instshopee.test:3001',
],
'supports_credentials' => true,
```

## Starting All Services

Open 3 terminal windows/tabs:

### Terminal 1: Laravel Backend
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/instshopee-lara
php artisan serve --host=api.instshopee.test --port=8000
```

Expected output: `Laravel development server started: http://api.instshopee.test:8000`

### Terminal 2: Buyer App
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/instshopee-main
npm run dev
```

Expected output: `ready - started server on 0.0.0.0:3000, url: http://localhost:3000`

### Terminal 3: Seller Portal
```bash
cd /Applications/XAMPP/xamppfiles/htdocs/sellerportal
npm run dev
```

Expected output: `ready - started server on 0.0.0.0:3001, url: http://localhost:3001`

## Test Scenarios

### Test 1: Cookie Creation on Login

1. Open browser in Incognito/Private mode
2. Visit: `http://instshopee.test:3000`
3. Click "Login" (top right)
4. Enter credentials:
   - Email: `ashiimmusoke60721@gmail.com`
   - Password: (your password)
5. Click "LOGIN"

**Expected Result:**
- Redirect to home page
- User is logged in

**Verification:**
1. Open DevTools (F12)
2. Go to Application → Cookies → `http://instshopee.test:3000`
3. Look for cookies with `Domain: .instshopee.test`
4. You should see session cookies (e.g., `instshopee_session`, `XSRF-TOKEN`)

### Test 2: Cookie Sharing Across Subdomains

1. While still logged in from Test 1
2. In the top navigation bar, click "Seller Centre"

**Expected Result:**
- Browser navigates to `http://seller.instshopee.test:3001`
- You are AUTOMATICALLY logged in (no login required)
- Redirected to `/portal/my-onboarding` (welcome page)

**Verification:**
1. Check DevTools → Network tab
2. Look for request to `/api/v1/auth/me`
3. Request should succeed with status 200
4. No 401 Unauthorized errors

### Test 3: No Login - Redirect Flow

1. Open a NEW incognito/private window
2. Visit: `http://seller.instshopee.test:3001` directly

**Expected Result:**
- No session cookie exists
- Automatically redirected to: `http://instshopee.test:3000/login?next=http://seller.instshopee.test:3001`

**After logging in:**
- Redirected back to `http://seller.instshopee.test:3001`
- Session cookie is shared
- You're logged in automatically

### Test 4: Logout from Seller Portal

1. While logged in to seller portal
2. Click on your avatar/name in top right
3. Click "Logout"

**Expected Result:**
- Session destroyed
- Redirected to `http://instshopee.test:3000`
- If you visit buyer app, you're logged out there too

### Test 5: Cookie Inspection

**Check Cookie Properties:**

1. DevTools → Application → Cookies
2. Inspect `instshopee_session` cookie:
   - **Domain:** `.instshopee.test` ✓
   - **Path:** `/` ✓
   - **HttpOnly:** `true` ✓
   - **Secure:** `false` (development only) ✓
   - **SameSite:** `Lax` or `None` ✓

## Troubleshooting

### Issue: 401 Unauthorized when accessing seller portal

**Possible Causes:**
1. Cookie not being sent
2. CORS misconfiguration
3. Session domain mismatch

**Solutions:**
```bash
# Clear Laravel cache
cd /Applications/XAMPP/xamppfiles/htdocs/instshopee-lara
php artisan config:clear
php artisan cache:clear

# Restart Laravel server
```

### Issue: Cookie has wrong domain

**Check:**
- `.env` file has `SESSION_DOMAIN=.instshopee.test`
- Not `SESSION_DOMAIN=instshopee.test` (missing dot)

### Issue: CORS errors in browser console

**Error:** `Access-Control-Allow-Origin` 

**Solution:**
1. Check `config/cors.php` has both origins
2. Ensure `supports_credentials` is `true`
3. Restart Laravel server

### Issue: Fetch requests don't include credentials

**Check Frontend Code:**
```typescript
// MUST have credentials: "include"
fetch(url, {
  credentials: "include", // ← This is critical!
})
```

### Issue: Session cookie not persisting

**Check:**
1. Browser is not blocking cookies
2. Database sessions table exists:
   ```bash
   php artisan session:table
   php artisan migrate
   ```

## Success Indicators

### ✅ Working Correctly:

1. Login on buyer site → see cookie with Domain=`.instshopee.test`
2. Click "Seller Centre" → automatically logged in
3. DevTools Network shows cookie sent with every request
4. No 401 errors
5. No CORS errors
6. Logout from one site logs out from both

### ❌ Not Working:

1. Cookie has Domain=`instshopee.test` (no dot prefix)
2. 401 errors when accessing seller portal
3. CORS errors in console
4. Redirected to login despite being logged in
5. Cookie not visible in DevTools

## API Testing with curl

Test cookie-based authentication:

```bash
# Get CSRF cookie
curl -c cookies.txt -X GET http://api.instshopee.test:8000/sanctum/csrf-cookie

# Login (session cookie set)
curl -b cookies.txt -c cookies.txt \
  -X POST http://api.instshopee.test:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Requested-With: XMLHttpRequest" \
  -d '{"email":"test@example.com","password":"password"}'

# Check authentication (should use session cookie)
curl -b cookies.txt \
  -X GET http://api.instshopee.test:8000/api/v1/auth/me \
  -H "X-Requested-With: XMLHttpRequest"
```

## Production Checklist

When deploying to production:

### Update .env:
```env
SESSION_DOMAIN=.instshopee.com
SESSION_SECURE_COOKIE=true
SANCTUM_STATEFUL_DOMAINS=instshopee.com,seller.instshopee.com
```

### Update CORS:
```php
'allowed_origins' => [
    'https://instshopee.com',
    'https://seller.instshopee.com',
],
```

### SSL Certificates:
- Ensure SSL certificate covers `*.instshopee.com` (wildcard)
- Or individual certificates for each subdomain

### DNS Configuration:
```
A    instshopee.com           → your_server_ip
A    seller.instshopee.com    → your_server_ip
A    api.instshopee.com       → your_server_ip
```

## References

- Laravel Sanctum Docs: https://laravel.com/docs/sanctum
- Cookie Domain Spec: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies
- CORS Guide: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
