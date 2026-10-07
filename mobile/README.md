# AgentForge AI — Android app

A native Android shell (Capacitor 8) that opens **https://www.aiagentforge.in** inside the app.
It replaces the first wrapper app (`aiagentforge-mobile` folder) and keeps its package name `in.aiagentforge.mobile`, so it takes that app's place on the phone (if Android refuses to install over the old test APK, uninstall the old one first — test builds made on different machines are signed with different keys).
Same website, same Supabase database, same login, same credits. When the website changes, the app changes too — no new APK needed.

## How it fits together

| Part | Where | What it does |
|---|---|---|
| Android shell | `mobile/` (this folder) | Splash, icon, loads the site, adds `AgentForgeApp/1.0` to the user-agent, gives the site access to share / save file / camera / back button |
| App mode switch | `lib/appMode.ts`, `lib/useAppMode.ts` | Detects the app and turns on "app mode" |
| Native bridge | `lib/native.ts` | Google login, save image, share, camera, Google Play purchases |
| App screens | `app/components/appshell/` | Top bar, bottom tabs, Home, Agents, Creations, Credits |

Preview app mode in any browser (no APK): open `https://www.aiagentforge.in/?source=app` (`?source=web` switches back).

## Build the test APK

One-time: copy `mobile/github-workflow-android-app.yml` to `.github/workflows/android-app.yml` in the repo root and push.
After that every push that touches `mobile/` builds the app (or GitHub → Actions → **Android app** → Run workflow). Download `agentforge-test-apk` from the run and install it on a phone.

On this PC (Windows, needs Node.js + Android Studio): double-click `mobile/build-test-apk.bat`. It writes `build-log.txt` and, when it works, `AgentForge-test.apk` in the same folder.

Manual local build (needs Android Studio + JDK 21):

```
cd mobile
npm ci
npx cap sync android
npx cap open android
```

## Build the Play Store bundle (.aab)

On this PC: double-click `mobile/build-play-bundle.bat`.

- First run asks you to choose a password and creates the upload key: `android/upload-keystore.jks` and `android/keystore.properties`. **Keep a copy of both files and the password somewhere safe** — every later update must be signed with the same key. They are never sent to git.
- Result: `AgentForge-play.aab` in this folder (log in `build-log.txt`). Upload it in Play Console → Test and release.
- Every run gets a new version code from the date and hour (for example `26100711`), because Play Store refuses a version code it has already seen. Two builds in the same hour share a number — wait for the next hour before building a second upload.

## One-time setup outside the code

1. **Supabase → Authentication → URL Configuration → Redirect URLs**: add `agentforge://auth/callback` (needed for Google login inside the app).
2. **Play Store bundle from GitHub Actions (optional — the .bat above does the same on the PC)**: add the four `ANDROID_*` secrets listed at the top of the workflow file. The workflow then also produces `agentforge-play-bundle` (.aab).

## Buying credits inside the app (Google Play Billing)

Play Store only allows Google Play Billing for digital credits, so the app sells the three packs through Play and the website keeps Razorpay. Both add to the same balance.

How it works: Credits screen (`app/components/appshell/AppCredits.tsx`) → Google Play payment sheet → `POST /api/play-billing/verify` checks the purchase with Google and adds credits through the same `add_credits_for_payment` function the website uses → Google Play purchase is consumed so the pack can be bought again. Pack list and product IDs: `lib/playBilling.ts`.

Until the steps below are done the Credits screen simply shows the "buy on the website" note — nothing breaks.

1. **Play Console account**: pay the one-time US$25 registration and finish identity verification. A personal account created after 13 Nov 2023 must run a closed test with 12 testers for 14 days before it can publish to production (Google states this rule for personal accounts).
2. **Create the app** with package name `in.aiagentforge.mobile` and upload a signed `.aab` (it contains the billing library) to **Internal testing**.
3. **Payments profile**: Play Console → Settings → Payments profile (bank account, tax details).
4. **Create 3 in-app products** (Monetize → Products → In-app products), each *active*:

   | Product ID | Pack | Credits |
   |---|---|---|
   | `credits_starter_1800` | Starter | 1,800 |
   | `credits_pro_9000` | Pro Creator | 9,000 |
   | `credits_empire_36000` | Empire | 36,000 |

   Set the price of each in Play Console (the app shows whatever price is set there). Product IDs cannot be changed later.
5. **Service account for the server**: in Google Cloud create a service account + JSON key and enable "Google Play Android Developer API"; in Play Console → Users and permissions invite the service-account e-mail with *View financial data* and *Manage orders and subscriptions* for this app.
6. **Server env vars** (`.env.local` on the PC and on the VPS, then rebuild + `pm2 restart agentforge`):

   ```
   GOOGLE_PLAY_SA_EMAIL=...@....iam.gserviceaccount.com
   GOOGLE_PLAY_SA_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   GOOGLE_PLAY_PACKAGE_NAME=in.aiagentforge.mobile
   ```
7. **Test**: Play Console → Settings → License testing → add your Gmail. Install the app from the internal-testing link and buy a pack — a licence tester is not charged.

Notes:
- In the admin panel these payments have a payment id starting with `gplay:`. Refund them in Play Console, then record the refund as *Manual* (not *Via Razorpay*).
- A refund made in Play Console does not remove credits automatically.
- `amount` in `lib/playBilling.ts` is the website list price recorded on the payment row; Google's commission is not deducted there.

## Settings you may change

- `capacitor.config.json` → `appId` (Play Store package name; cannot change after first upload), `server.url`.
- `android/app/build.gradle` → `versionName` (shown to users). `versionCode` is passed in by `build-play-bundle.bat`.
- `lib/appMode.ts` → `APP_PURCHASES_ENABLED` (website Razorpay checkout inside the app — keep off for a Play Store build), `APP_CAMERA_CHOOSER`.

After changing anything in this folder run `npx cap sync android` (the GitHub workflow does this itself).
