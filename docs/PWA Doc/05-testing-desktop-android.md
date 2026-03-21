# 5) Testing (Desktop + Android)

---

## Local Test (Desktop Chrome)

1. Run migrations:
   ```bash
   cd server
   python manage.py migrate
   ```
2. Start dev:
   ```bash
   docker compose --profile dev up -d --build
   ```
3. Open `http://localhost:3000`
4. Click **Enable notifications**
5. Click **Send test**

If no notification:

- Check OS Do Not Disturb
- Check DevTools → Application → Service Workers
- Check `/api/push/send-test/` response

---

## Android (Chrome)

1. Deploy to HTTPS (or use a tunnel like ngrok).
2. Open site in Chrome.
3. Install the app (Add to Home Screen).
4. Open the installed app.
5. Enable notifications.
6. Send a test push.

