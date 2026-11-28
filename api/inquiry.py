"""POST /api/inquiry — project inquiry form. Validates server-side, then e-mails the site owner."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import JsonHandler, send_mail, validate_inquiry


class handler(JsonHandler):
    def process(self, data):
        q = validate_inquiry(data)
        body = (f"New project inquiry from the AI MANGA INDIA website\n\nName: {q['name']}\nEmail: {q['email']}\n"
                f"Brand / company: {q['brand'] or '-'}\nService: {q['service']}\nBudget: {q['budget'] or 'Prefer to discuss'}\n"
                f"Deadline: {q['deadline'] or '-'}\nReference links: {q['links'] or '-'}\n\nProject description:\n{q['message']}\n")
        send_mail(f"Project inquiry: {q['service']} - {q['name']}", body, reply_to=q["email"])
        return {"ok": True}
