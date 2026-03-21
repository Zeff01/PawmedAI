# 4) Environment Variables

This section lists the environment variables required for PWA + push.

---

## Server

Set in server env files:

```
VAPID_PUBLIC_KEY=YOUR_PUBLIC_KEY
VAPID_PRIVATE_KEY=YOUR_PRIVATE_KEY
VAPID_SUBJECT=mailto:your-email@example.com
```

Notes:

- `VAPID_SUBJECT` should be a real email you monitor.

### Generate VAPID Keys

Run this command to generate the VAPID public/private keys:

```bash
npx web-push generate-vapid-keys
```

It will output:

- Public Key → `VAPID_PUBLIC_KEY`
- Private Key → `VAPID_PRIVATE_KEY`

---

## Client

Set in client env files:

```
VITE_API_BASE_URL=http://localhost:8000
VITE_SITE_URL=http://localhost:3000
```
