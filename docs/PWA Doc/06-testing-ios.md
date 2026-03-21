# 6) Testing on iOS

Push on iOS requires:

- iOS 16.4+
- HTTPS
- PWA installed to Home Screen
- Permissions granted in installed app

Safari tabs on iOS do not receive push.

---

## iOS Test Steps

1. Deploy to HTTPS (or use a tunnel like ngrok).
2. Open in Safari.
3. Share → Add to Home Screen.
4. Open the installed app.
5. Enable notifications.
6. Send a test push.

