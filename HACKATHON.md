# Hackathon — 23 May (24h live)

**Surakhsa Core - Smart Healthcare Emergency Monitoring System**

## Is the app ready for the hackathon?

**Yes — good for demo and judging** if you deploy before 23 May and rehearse once.

| Ready | Not yet |
|-------|---------|
| Global HTTPS links (Render) | Real SMS OTP |
| Laptop + phone live vitals | Medical-grade security |
| Fall alert + GPS unlock | Permanent cloud DB |

---

## Timeline (do this before 23 May)

### By 20–21 May — Deploy

1. Push project to **GitHub** (no `node_modules`).
2. **Render.com** → New → Blueprint → connect repo.
3. Wait for deploy → note URL: `https://surakhsa-core-xxxx.onrender.com`
4. Open **`/demo`** → copy links for judges.

### By 22 May — Rehearse (15 min)

1. Laptop: register `demo@surakhsa.test` / password `Demo123!`
2. Dashboard → patient **HACK-2026**
3. Phone: `/patient` → same ID → Start sending
4. Laptop → Track → see vitals
5. Shake phone → fall alert + map

### 23 May — Event day

| Time | Action |
|------|--------|
| **2 hours before** | Open live URL once (warms Render; avoids 60s cold start) |
| **30 min before** | Test laptop + phone again on venue Wi‑Fi |
| **During pitch** | Show `/demo` page + 2-minute live flow |
| **Backup** | ngrok on laptop if Render is down |

---

## Links to put on your slide

```
Guardian:  https://YOUR-APP.onrender.com/
Patient:   https://YOUR-APP.onrender.com/patient
Demo hub:  https://YOUR-APP.onrender.com/demo
```

---

## 2-minute demo script (for judges)

1. **Problem:** Elderly falls — family needs real-time vitals + location in emergencies.
2. **Show login** → Email tab → sign in.
3. **Dashboard** → live heart rate, SpO2, battery.
4. **Phone** → patient page transmitting (second device or teammate).
5. **Shake phone** → fall detected → alert + GPS map unlocks.
6. **Admin** (optional): title 3× → `911` → global dispatch view.

---

## Login tips for judges

- **Best:** Email + password (register on the spot).
- **Phone OTP:** OTP appears in a **toast** on screen (`SHOW_DEMO_OTP=true` on server).

Pre-create account:

- Email: `judge@demo.com`
- Password: `Judge2026!`

---

## Keep server awake (free Render)

Free tier sleeps after ~15 min idle → first click is slow.

1. Sign up: https://uptimerobot.com (free)
2. Monitor: `https://YOUR-APP.onrender.com/api/health`
3. Interval: **5 minutes**

---

## Backup plan (if internet fails)

```powershell
npm run build
$env:NODE_ENV="production"
$env:JWT_SECRET="hackathon-secret"
$env:SHOW_DEMO_OTP="true"
npm start
# Second terminal:
ngrok http 5001
```

Share the **https** ngrok URL + `/patient`.

---

## What to say if judges ask hard questions

| Question | Answer |
|----------|--------|
| Native app? | Web app — works on any phone browser; no install. |
| Real smart band? | MVP uses phone sensors + manual vitals; band-ready API design. |
| HIPAA? | University prototype; production would need compliance review. |
| Scale? | Next step: MongoDB + Twilio + device auth. |

---

## Team roles during 24h

- **Person A:** Laptop demo + dashboard
- **Person B:** Phone patient app + fall demo
- **Person C:** Slides + `/demo` link QR code

Good luck at the hackathon.
