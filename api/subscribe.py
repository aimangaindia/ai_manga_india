"""POST /api/subscribe — newsletter sign-up. Validates the address and e-mails it to the site owner (no database)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import EMAIL_RE, ApiError, JsonHandler, clean, send_mail


class handler(JsonHandler):
    def process(self, data):
        email = clean(data.get("email"), 200).lower()
        if not EMAIL_RE.match(email): raise ApiError(422, "invalid", "Please enter a valid email address.")
        send_mail("New newsletter subscriber", f"New newsletter sign-up from the AI MANGA INDIA website:\n\n{email}\n", reply_to=email)
        return {"ok": True}
