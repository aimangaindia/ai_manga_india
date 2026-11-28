"""GET /api/health — tells you whether the backend is deployed and mail is configured. Never returns secrets."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from _common import JsonHandler, mail_config


class handler(JsonHandler):
    def do_GET(self):
        self._send(200, {"ok": True, "mail_configured": mail_config() is not None})
