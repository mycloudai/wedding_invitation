import os
import json
import uuid
import functools
from pathlib import Path
from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    jsonify,
    send_from_directory,
    session,
    abort,
)
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(
    __name__,
    template_folder=os.path.join(os.path.dirname(__file__), "..", "templates"),
    static_folder=os.path.join(os.path.dirname(__file__), "..", "static"),
)
app.secret_key = os.environ.get("SECRET_KEY", "wedding-secret-key-change-me")

# Fix for reverse proxy to correctly detect HTTPS
app.wsgi_app = ProxyFix(
    app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=0
)


# ---------------------------------------------------------------------------
# Environment-based configuration
# ---------------------------------------------------------------------------
def get_config():
    """Read all configurable values from environment variables with defaults."""
    return {
        # Core info
        "groom_name": os.environ.get("GROOM_NAME", "新郎"),
        "bride_name": os.environ.get("BRIDE_NAME", "新娘"),
        "wedding_date": os.environ.get("WEDDING_DATE", "2026年10月01日"),
        "wedding_date_weekday": os.environ.get("WEDDING_DATE_WEEKDAY", "星期四"),
        "banquet_time": os.environ.get("BANQUET_TIME", "18:00"),
        "ceremony_time": os.environ.get("CEREMONY_TIME", "16:00"),
        "wedding_venue": os.environ.get("WEDDING_VENUE", "某某酒店·草坪厅"),
        "wedding_address": os.environ.get("WEDDING_ADDRESS", ""),
        # Texts – all overridable
        "cover_subtitle": os.environ.get("COVER_SUBTITLE", "WE ARE GETTING MARRIED"),
        "invite_title": os.environ.get("INVITE_TITLE", "诚挚邀请"),
        "invite_text": os.environ.get(
            "INVITE_TEXT",
            "谨定于{wedding_date}（{wedding_date_weekday}）\n"
            "为我俩举行婚礼\n"
            "诚邀您拨冗出席\n"
            "共同见证我们的幸福时刻",
        ),
        "story_title": os.environ.get("STORY_TITLE", "我们的故事"),
        "story_text": os.environ.get(
            "STORY_TEXT",
            "从相遇到相知，从相知到相爱\n"
            "感谢命运让我们在茫茫人海中找到彼此\n"
            "感谢一路走来所有的温暖与陪伴\n"
            "如今我们即将携手步入婚姻的殿堂\n"
            "愿与你们一起分享这份喜悦\n"
            "往后余生，风雪是你，平淡是你\n"
            "愿我们的爱情故事 成为最美的篇章",
        ),
        "details_title": os.environ.get("DETAILS_TITLE", "婚礼详情"),
        "ceremony_label": os.environ.get("CEREMONY_LABEL", "草坪仪式"),
        "banquet_label": os.environ.get("BANQUET_LABEL", "婚宴时间"),
        "venue_label": os.environ.get("VENUE_LABEL", "婚宴地点"),
        "closing_text": os.environ.get(
            "CLOSING_TEXT",
            "你们的每一次微笑与祝福\n"
            "都是我们最珍贵的礼物\n"
            "期待与您共同见证这美好时刻",
        ),
        "footer_text": os.environ.get("FOOTER_TEXT", "感恩相遇 · 期待重逢"),
        # Ceremony invitation text (shown when guest is invited to lawn ceremony)
        "ceremony_invite_text": os.environ.get(
            "CEREMONY_INVITE_TEXT",
            "我们诚挚地邀请您参加下午的草坪婚礼仪式\n"
            "在蓝天白云下，一起见证爱与承诺的美好瞬间",
        ),
        # Photo
        "cover_photo": os.environ.get("COVER_PHOTO", "cover.jpg"),
        # BGM
        "bgm_filename": os.environ.get("BGM_FILENAME", "bgm.ogg"),
        # Admin
        "admin_password": os.environ.get("ADMIN_PASSWORD", "admin123"),
    }


# ---------------------------------------------------------------------------
# Data persistence
# ---------------------------------------------------------------------------
DATA_DIR = os.environ.get("DATA_DIR", "/app/data")
MUSIC_DIR_EXTERNAL = os.environ.get("MUSIC_DIR", "/app/data/music")
MUSIC_DIR_DEFAULT = os.path.join(os.path.dirname(__file__), "..", "music")
PHOTO_DIR_EXTERNAL = os.environ.get("PHOTO_DIR", "/app/data/photo")
PHOTO_DIR_DEFAULT = os.path.join(os.path.dirname(__file__), "..", "photo")


def _guests_file():
    return os.path.join(DATA_DIR, "guests.json")


def _load_guests() -> dict:
    path = _guests_file()
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def _save_guests(data: dict):
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(_guests_file(), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def admin_required(f):
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)

    return wrapper


# ---------------------------------------------------------------------------
# Routes – Music
# ---------------------------------------------------------------------------
@app.route("/music/<path:filename>")
def serve_music(filename):
    """Serve music file. Priority: external dir > built-in default dir."""
    ext_path = os.path.join(MUSIC_DIR_EXTERNAL, filename)
    if os.path.isfile(ext_path):
        return send_from_directory(MUSIC_DIR_EXTERNAL, filename)
    default_path = os.path.join(MUSIC_DIR_DEFAULT, filename)
    if os.path.isfile(default_path):
        return send_from_directory(MUSIC_DIR_DEFAULT, filename)
    abort(404)


# ---------------------------------------------------------------------------
# Routes – Photo
# ---------------------------------------------------------------------------
@app.route("/photo/<path:filename>")
def serve_photo(filename):
    """Serve photo file. Priority: external dir > built-in default dir."""
    ext_path = os.path.join(PHOTO_DIR_EXTERNAL, filename)
    if os.path.isfile(ext_path):
        return send_from_directory(PHOTO_DIR_EXTERNAL, filename)
    default_path = os.path.join(PHOTO_DIR_DEFAULT, filename)
    if os.path.isfile(default_path):
        return send_from_directory(PHOTO_DIR_DEFAULT, filename)
    abort(404)


# ---------------------------------------------------------------------------
# Routes – Invitation (Frontend)
# ---------------------------------------------------------------------------
@app.route("/")
def index():
    """Root is not accessible – only personalised URLs work."""
    abort(404)


@app.route("/i/<code>")
def invitation(code):
    """Personalised invitation for a specific guest."""
    guests = _load_guests()
    guest = guests.get(code)
    if not guest:
        abort(404)
    config = get_config()
    config["invite_text_rendered"] = config["invite_text"].format(**config)
    invite_ceremony = guest.get("ceremony", False)
    return render_template(
        "invitation.html",
        config=config,
        guest_name=guest["name"],
        invite_ceremony=invite_ceremony,
    )


# ---------------------------------------------------------------------------
# Routes – Admin (Backend)
# ---------------------------------------------------------------------------
@app.route("/admin", methods=["GET", "POST"])
def admin_login():
    config = get_config()
    error = None
    if request.method == "POST":
        password = request.form.get("password", "")
        if password == config["admin_password"]:
            session["admin_logged_in"] = True
            return redirect(url_for("admin_dashboard"))
        error = "密码错误，请重试"
    return render_template("admin_login.html", error=error)


@app.route("/admin/logout")
def admin_logout():
    session.pop("admin_logged_in", None)
    return redirect(url_for("admin_login"))


@app.route("/admin/dashboard")
@admin_required
def admin_dashboard():
    guests = _load_guests()
    config = get_config()
    return render_template("admin_dashboard.html", guests=guests, config=config)


@app.route("/api/guests", methods=["POST"])
@admin_required
def create_guest():
    """Create a new guest entry and return the unique URL."""
    data = request.get_json(force=True)
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"error": "请输入宾客姓名"}), 400

    guests = _load_guests()
    ceremony = bool(data.get("ceremony", False))

    # Check for duplicate names – update existing entry (last submission wins)
    existing_code = None
    for code, info in guests.items():
        if info["name"] == name:
            existing_code = code
            break

    if existing_code:
        # Update existing guest (e.g. ceremony flag changed)
        guests[existing_code]["ceremony"] = ceremony
        _save_guests(guests)
        return (
            jsonify(
                {
                    "code": existing_code,
                    "name": name,
                    "ceremony": ceremony,
                    "url": url_for("invitation", code=existing_code, _external=True),
                    "updated": True,
                }
            ),
            200,
        )

    code = uuid.uuid4().hex[:8]
    guests[code] = {"name": name, "ceremony": ceremony}
    _save_guests(guests)

    return (
        jsonify(
            {
                "code": code,
                "name": name,
                "ceremony": ceremony,
                "url": url_for("invitation", code=code, _external=True),
            }
        ),
        201,
    )


@app.route("/api/guests/<code>", methods=["DELETE"])
@admin_required
def delete_guest(code):
    guests = _load_guests()
    if code not in guests:
        return jsonify({"error": "未找到该宾客"}), 404
    del guests[code]
    _save_guests(guests)
    return jsonify({"ok": True})


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5050)), debug=True)
