# WhatsApp (Meta Cloud API) setup

What the integration does once configured:

1. **Registration OTP** — `/register` asks for the mobile number first, sends a
   6-digit code on WhatsApp, and only then lets the customer set name, email
   and password. Accounts can't be created on unverified numbers.
2. **Order placed → customer** — a WhatsApp confirmation ("your order
   WOW… has been placed successfully") to the shipping-address number.
3. **Order placed → admin** — a WhatsApp alert with order number, units,
   total and customer details to `ADMIN_WHATSAPP_NUMBER`, alongside the
   existing admin-bell notification.

Everything degrades safely: with no WhatsApp env vars set, order pings are
skipped and the register flow prints its OTP to the dev-server terminal (and
shows it on the page) so you can build and test without Meta.

---

## 1. Credentials (`WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`)

In [Meta for Developers](https://developers.facebook.com/) → your app →
**WhatsApp → API Setup**:

- **Phone number ID** — the numeric id shown under the "From" number picker
  (it is *not* the phone number itself). → `WHATSAPP_PHONE_NUMBER_ID`
- The temporary access token on that page **expires in 24 hours**. For real
  use create a permanent one: **Business settings → Users → System users →
  Add** (admin role) → **Generate new token** → select your app → grant
  `whatsapp_business_messaging` + `whatsapp_business_management` → set
  expiry "never". → `WHATSAPP_ACCESS_TOKEN`

While the app is in development you can only message the up-to-5 **test
recipient numbers** you add on the API Setup page — add your own number
there and verify it.

## 2. Webhook (the "Configure Webhooks" screen you have open)

On **WhatsApp → Configuration → Webhooks** (the Step 2 "Production setup"
card):

| Field | Value |
| --- | --- |
| **Callback URL** | `https://wowlifestyle.online/api/whatsapp/webhook` |
| **Verify token** | the value of `WHATSAPP_VERIFY_TOKEN` in `.env` (already generated for you) |

Click **Verify and save** — Meta calls the URL with a challenge and the app
echoes it back. **The deployed site must be running that route first**, so
deploy this code before clicking. (For local-only testing you'd need a
tunnel like ngrok pointing at your dev server and would paste the tunnel URL
instead.)

Then under **Webhook fields**, subscribe to **`messages`** — that delivers
both incoming customer messages and sent/delivered/read/failed statuses,
which the route logs.

Finally set `WHATSAPP_APP_SECRET` from **App settings → Basic → App secret**
so webhook calls are signature-checked (recommended for production).

Note from that screen's banner: until the app is **published/live**, Meta
only delivers test webhook events — use the dashboard's "Test" buttons or
test numbers while developing.

## 3. Message templates (needed for production delivery)

WhatsApp only delivers **free-form** text inside the 24-hour window after a
customer last messaged you. OTPs and order notifications are
business-initiated, so outside that window they need **approved templates**.
The code tries the configured template first and falls back to free-form
text (which is what makes test-number development work before approval).

Create these under **WhatsApp Manager → Message templates** (language must
match `WHATSAPP_TEMPLATE_LANG`, default `en_US`):

### a. OTP — category **Authentication** → `WHATSAPP_OTP_TEMPLATE`

Suggested name: `wow_otp`. Use the standard authentication layout ("Copy
code" button, code expiry 5 minutes). Meta fixes the wording; the app sends
the code as body parameter `{{1}}` and as the copy-button parameter.

### b. Customer order confirmation — category **Utility** → `WHATSAPP_ORDER_USER_TEMPLATE`

Suggested name: `wow_order_confirmed`, body:

```
Hi {{1}}! 🎉 Your order {{2}} has been placed successfully.
Order total: {{3}}.
We'll message you here as soon as it ships. Thank you for shopping with WOW Lifestyle!
```

Parameters the app sends: `{{1}}` customer name · `{{2}}` order number ·
`{{3}}` total (e.g. ₹2,499).

### c. Admin new-order alert — category **Utility** → `WHATSAPP_ORDER_ADMIN_TEMPLATE`

Suggested name: `wow_new_order`, body:

```
🛒 New order {{1}}
Units: {{2}} · Total: {{3}}
Customer: {{4}} ({{5}})
```

Parameters: `{{1}}` order number · `{{2}}` units · `{{3}}` total ·
`{{4}}` customer name · `{{5}}` customer phone.

Once approved, put each template's exact name into `.env`. Approval is
usually minutes for Authentication, up to a day for Utility.

## 4. Env summary

```
WHATSAPP_ACCESS_TOKEN          permanent system-user token
WHATSAPP_PHONE_NUMBER_ID       numeric id from API Setup
WHATSAPP_VERIFY_TOKEN          webhook handshake string (any random value)
WHATSAPP_APP_SECRET            app secret, enables webhook signature checks
ADMIN_WHATSAPP_NUMBER          e.g. 919876543210 — gets new-order alerts
WHATSAPP_OTP_TEMPLATE          e.g. wow_otp            (blank = free-form)
WHATSAPP_ORDER_USER_TEMPLATE   e.g. wow_order_confirmed (blank = free-form)
WHATSAPP_ORDER_ADMIN_TEMPLATE  e.g. wow_new_order       (blank = free-form)
WHATSAPP_TEMPLATE_LANG         en_US
```

## 5. Test checklist

1. `.env` filled in → restart the server.
2. Your personal number added as a test recipient (while app is unpublished).
3. `/register` → enter your number → code arrives on WhatsApp → finish signup.
4. Place a test order → you get the confirmation, `ADMIN_WHATSAPP_NUMBER`
   gets the alert. Delivery failures appear in the server log (`WhatsApp order
   notification failed: …`) and in webhook `failed` statuses — the order
   itself always goes through regardless.
5. Going live: complete **Step 3 Business verification** in the dashboard,
   publish the app, and switch templates on.
