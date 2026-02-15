import os
import re
import json
import uuid
import functools
import time
import fcntl
from datetime import datetime
from pathlib import Path
from urllib.parse import quote
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
    Response,
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
    config = {
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
        # RSVP
        "rsvp_title": os.environ.get("RSVP_TITLE", "期待您的回复"),
        "rsvp_subtitle": os.environ.get("RSVP_SUBTITLE", "请告知我们您是否能够出席"),
        "rsvp_question": os.environ.get("RSVP_QUESTION", "您是否能够出席我们的婚礼？"),
        "rsvp_yes_text": os.environ.get("RSVP_YES_TEXT", "我会参加"),
        "rsvp_no_text": os.environ.get("RSVP_NO_TEXT", "无法出席"),
        "rsvp_guest_count_label": os.environ.get("RSVP_GUEST_COUNT_LABEL", "请选择参加人数："),
        "rsvp_submit_text": os.environ.get("RSVP_SUBMIT_TEXT", "确认提交"),
        "rsvp_change_text": os.environ.get("RSVP_CHANGE_TEXT", "修改回复"),
        "rsvp_thank_you": os.environ.get("RSVP_THANK_YOU", "感谢您来见证我们的幸福时刻！"),
        "rsvp_regret": os.environ.get("RSVP_REGRET", "很遗憾您无法出席。"),
    }

    # Derived: map navigation links (auto-generated from venue/address, or overridden)
    keyword = config["wedding_venue"]
    if config["wedding_address"]:
        keyword += " " + config["wedding_address"]
    kw_enc = quote(keyword)
    config["map_link_amap"] = os.environ.get(
        "MAP_LINK_AMAP",
        f"https://uri.amap.com/search?keyword={kw_enc}&src=webapp.wedding",
    )
    config["map_link_baidu"] = os.environ.get(
        "MAP_LINK_BAIDU",
        f"http://api.map.baidu.com/geocoder?address={kw_enc}&output=html&src=webapp.wedding",
    )
    return config


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


def _theme_file():
    return os.path.join(DATA_DIR, "theme.json")


def _load_guests() -> dict:
    """Load guests with retry mechanism for concurrent access."""
    path = _guests_file()
    if not os.path.exists(path):
        return {}

    max_retries = 5
    retry_delay = 0.05  # 50ms

    for attempt in range(max_retries):
        try:
            with open(path, "r", encoding="utf-8") as f:
                # Acquire shared lock for reading
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                try:
                    data = json.load(f)
                    return data
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except (IOError, json.JSONDecodeError) as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
            else:
                # Last attempt failed, return empty dict
                return {}
    return {}


def _save_guests(data: dict):
    """Save guests with retry mechanism and file locking."""
    os.makedirs(DATA_DIR, exist_ok=True)
    path = _guests_file()

    max_retries = 5
    retry_delay = 0.05  # 50ms

    for attempt in range(max_retries):
        try:
            with open(path, "w", encoding="utf-8") as f:
                # Acquire exclusive lock for writing
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    return  # Success
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except IOError as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))  # Exponential backoff
            else:
                raise  # Re-raise on final attempt


def _load_theme() -> dict:
    """Load theme settings from theme.json."""
    path = _theme_file()
    if not os.path.exists(path):
        # First time - create default theme.json
        default_theme = {"theme": "classic"}
        _save_theme(default_theme)
        return default_theme

    max_retries = 5
    retry_delay = 0.05

    for attempt in range(max_retries):
        try:
            with open(path, "r", encoding="utf-8") as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_SH)
                try:
                    data = json.load(f)
                    return data
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except (IOError, json.JSONDecodeError) as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
            else:
                return {"theme": "classic"}
    return {"theme": "classic"}


def _save_theme(data: dict):
    """Save theme settings to theme.json with file locking."""
    os.makedirs(DATA_DIR, exist_ok=True)
    path = _theme_file()

    max_retries = 5
    retry_delay = 0.05

    for attempt in range(max_retries):
        try:
            with open(path, "w", encoding="utf-8") as f:
                fcntl.flock(f.fileno(), fcntl.LOCK_EX)
                try:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                    return
                finally:
                    fcntl.flock(f.fileno(), fcntl.LOCK_UN)
        except IOError as e:
            if attempt < max_retries - 1:
                time.sleep(retry_delay * (attempt + 1))
            else:
                raise


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

    # Track visit
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
    if not guest.get("first_viewed_at"):
        guests[code]["first_viewed_at"] = now
    guests[code]["view_count"] = guest.get("view_count", 0) + 1
    _save_guests(guests)

    config = get_config()
    config["invite_text_rendered"] = config["invite_text"].format(**config)
    invite_ceremony = guest.get("ceremony", False)

    # Load RSVP response if exists
    rsvp_response = guest.get("rsvp", {})
    is_attending = rsvp_response.get("is_attending")
    guest_count = rsvp_response.get("guest_count", 0)

    # Load theme
    theme_data = _load_theme()
    theme = theme_data.get("theme", "classic")

    return render_template(
        "invitation.html",
        config=config,
        guest_name=guest["name"],
        invite_ceremony=invite_ceremony,
        guest_code=code,
        is_attending=is_attending,
        guest_count=guest_count,
        theme=theme,
    )


@app.route("/api/rsvp/<code>", methods=["POST"])
def submit_rsvp(code):
    """Submit or update RSVP response for a guest."""
    guests = _load_guests()
    guest = guests.get(code)
    if not guest:
        return jsonify({"error": "无效的邀请码"}), 404

    data = request.get_json(force=True)
    is_attending = data.get("is_attending")

    if is_attending is None:
        return jsonify({"error": "请选择是否参加"}), 400

    guest_count = 0
    if is_attending:
        guest_count = int(data.get("guest_count", 1))
        if guest_count < 1 or guest_count > 5:
            return jsonify({"error": "参加人数必须在1-5人之间"}), 400

    # Update guest RSVP
    guests[code]["rsvp"] = {
        "is_attending": is_attending,
        "guest_count": guest_count,
    }
    _save_guests(guests)

    config = get_config()
    message = f"{config['groom_name']} & {config['bride_name']} {config['rsvp_thank_you']}" if is_attending else config['rsvp_regret']
    return jsonify({
        "ok": True,
        "is_attending": is_attending,
        "guest_count": guest_count,
        "message": message,
    })


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


@app.route("/i/<code>/calendar.ics")
def download_calendar(code):
    """Generate an ICS calendar file for the wedding event."""
    guests = _load_guests()
    if code not in guests:
        abort(404)
    config = get_config()

    # Parse wedding date from Chinese format (2026年10月01日) or ISO env override
    date_iso = os.environ.get("WEDDING_DATE_ISO", "")
    if date_iso:
        try:
            parts = date_iso.split("-")
            year, month, day = int(parts[0]), int(parts[1]), int(parts[2])
        except (ValueError, IndexError):
            abort(400)
    else:
        m = re.match(r"(\d{4})年(\d{1,2})月(\d{1,2})日", config["wedding_date"])
        if not m:
            abort(400)
        year, month, day = int(m.group(1)), int(m.group(2)), int(m.group(3))

    try:
        hour, minute = map(int, config["banquet_time"].split(":"))
    except ValueError:
        hour, minute = 18, 0

    dtstart = f"{year:04d}{month:02d}{day:02d}T{hour:02d}{minute:02d}00"
    dtend   = f"{year:04d}{month:02d}{day:02d}T{(hour+3)%24:02d}{minute:02d}00"

    venue    = config["wedding_venue"]
    address  = config.get("wedding_address", "")
    location = (venue + " " + address).strip()

    def esc(s):
        return s.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")

    ics = (
        "BEGIN:VCALENDAR\r\n"
        "VERSION:2.0\r\n"
        "PRODID:-//Wedding Invitation//CN\r\n"
        "CALSCALE:GREGORIAN\r\n"
        "METHOD:PUBLISH\r\n"
        "BEGIN:VEVENT\r\n"
        f"UID:wedding-{code}@invitation\r\n"
        f"DTSTART;TZID=Asia/Shanghai:{dtstart}\r\n"
        f"DTEND;TZID=Asia/Shanghai:{dtend}\r\n"
        f"SUMMARY:{esc(config['groom_name'] + ' & ' + config['bride_name'] + ' 婚礼')}\r\n"
        f"LOCATION:{esc(location)}\r\n"
        f"DESCRIPTION:{esc('诚邀您参加 ' + config['groom_name'] + ' 和 ' + config['bride_name'] + ' 的婚礼\\n' + location)}\r\n"
        f"URL:{url_for('invitation', code=code, _external=True)}\r\n"
        "END:VEVENT\r\n"
        "END:VCALENDAR\r\n"
    )
    return Response(
        ics,
        mimetype="text/calendar; charset=utf-8",
        headers={"Content-Disposition": 'attachment; filename="wedding.ics"'},
    )


@app.route("/api/guests/<code>", methods=["PATCH"])
@admin_required
def update_guest(code):
    """Update guest name."""
    guests = _load_guests()
    if code not in guests:
        return jsonify({"error": "未找到该宾客"}), 404

    data = request.get_json(force=True)
    new_name = data.get("name", "").strip()

    if not new_name:
        return jsonify({"error": "请输入宾客姓名"}), 400

    guests[code]["name"] = new_name
    _save_guests(guests)

    return jsonify({
        "ok": True,
        "code": code,
        "name": new_name,
        "url": url_for("invitation", code=code, _external=True)
    })


@app.route("/api/theme", methods=["GET"])
@admin_required
def get_theme():
    """Get current theme setting."""
    theme_data = _load_theme()
    return jsonify({"theme": theme_data.get("theme", "classic")})


@app.route("/api/theme", methods=["POST"])
@admin_required
def set_theme():
    """Set theme."""
    data = request.get_json(force=True)
    theme = data.get("theme", "classic")

    valid_themes = ["classic", "pink", "blue", "green", "lavender", "red"]
    if theme not in valid_themes:
        return jsonify({"error": "Invalid theme"}), 400

    theme_data = {"theme": theme}
    _save_theme(theme_data)

    return jsonify({"ok": True, "theme": theme})


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    os.makedirs(DATA_DIR, exist_ok=True)
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5050)), debug=True)
