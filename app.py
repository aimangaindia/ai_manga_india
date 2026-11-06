"""AI MANGA INDIA — entry point.   Dev:  python app.py    Prod:  gunicorn app:app"""
import core
import routes  # noqa: F401  (registers public + commerce routes)
import admin  # noqa: F401  (registers /admin routes)

core.init_db()
admin.bootstrap_admin()
app = core.app

if __name__ == "__main__":
    import os
    app.run(host=os.environ.get("HOST", "127.0.0.1"), port=int(os.environ.get("PORT", "5000")), debug=os.environ.get("FLASK_DEBUG") == "1")
