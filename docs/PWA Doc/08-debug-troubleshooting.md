# 8) Debug & Troubleshooting

---

## Clear subscriptions

```bash
python manage.py shell -c "from notifications.models import PushSubscription; PushSubscription.objects.all().delete()"
```

---

## Check subscription in browser

```js
await navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription())
```

---

## Common Errors

- `410 Gone`: subscription is stale. Clear and re-subscribe.
- `No Service Worker`: check `client/src/main.tsx` and DevTools.
- `No permissions`: check browser permissions or system focus mode.

