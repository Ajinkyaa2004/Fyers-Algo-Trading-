# Fixing Redirect URI Mismatch (Fyers)

The error `redirectUrl mismatch` happens when the **Redirect URI** in your Fyers Dashboard does not match the one in our code.

## 🛠️ Step-by-Step Fix

1.  Go to the [Fyers API Dashboard](https://api.fyers.in/dashboard/).
2.  Select your App (**3XL42TP2PU-100**).
3.  Look for the **Redirect URI** field.
4.  Copy and paste this exact URL:
    `http://localhost:8000/api/auth/callback`
5.  **Save** the changes.
6.  Go back to [http://localhost:3000](http://localhost:3000) and try logging in again.

> [!IMPORTANT]
> Ensure there are no extra spaces or trailing slashes. It must be exactly `http://localhost:8000/api/auth/callback`.

---

## 🔍 Validation
If you have already set the URL above and still see the error, please check:
- Is the **App ID** in the dashboard exactly `3XL42TP2PU-100`?
- Did you click **Save** after updating the URL?
