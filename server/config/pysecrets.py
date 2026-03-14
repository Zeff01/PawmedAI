import os
from urllib.parse import urlencode, urlparse, urlunparse, parse_qsl
from pathlib import Path

from dotenv import load_dotenv

# Prefer explicit env file or .env.development when present, fallback to .env
env_file = os.getenv("ENV_FILE")
if env_file:
    load_dotenv(env_file)
else:
    base_dir = Path(__file__).resolve().parents[1]
    dev_env = base_dir / ".env.development"
    default_env = base_dir / ".env"
    if dev_env.exists():
        load_dotenv(dev_env)
    else:
        load_dotenv(default_env)

GAPI_KEY = os.getenv("GOOGLE_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL")

HUGGING_FACE_KEY = os.getenv("HUGGING_FACE_KEY")
HUGGING_FACE_MODEL = os.getenv(
    "HUGGING_FACE_MODEL", "Salesforce/blip-image-captioning-base"
)
HUGGING_FACE_ENDPOINT_URL = os.getenv("HUGGING_FACE_ENDPOINT_URL")

# Supabase / Postgres
SB_HOST = os.getenv("SB_HOST")
SB_PORT = os.getenv("SB_PORT")
SB_DB = os.getenv("SB_DB")
SB_USER = os.getenv("SB_USER")
SB_PWD = os.getenv("SB_PWD")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL and all([SB_HOST, SB_PORT, SB_DB, SB_USER, SB_PWD]):
    DATABASE_URL = (
        f"postgresql://{SB_USER}:{SB_PWD}@{SB_HOST}:{SB_PORT}/{SB_DB}"
    )

# Ensure SSL is required for Supabase (pgbouncer typically needs it).
if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    parsed = urlparse(DATABASE_URL)
    query = dict(parse_qsl(parsed.query))
    query.setdefault("sslmode", "require")
    DATABASE_URL = urlunparse(
        parsed._replace(query=urlencode(query))
    )

DJANGO_SECRET_KEY = os.getenv("DJANGO_SECRET_KEY")
DJANGO_DEBUG = os.getenv("DJANGO_DEBUG", "false").lower() == "true"
DJANGO_ALLOWED_HOSTS = os.getenv("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
DJANGO_CORS_ALLOWED_ORIGINS = os.getenv("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",")
DJANGO_CSRF_TRUSTED_ORIGINS = os.getenv("DJANGO_CSRF_TRUSTED_ORIGINS", "").split(",")
DJANGO_SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "false").lower() == "true"
DJANGO_SESSION_COOKIE_SECURE = os.getenv("DJANGO_SESSION_COOKIE_SECURE", "true").lower() == "true"
DJANGO_CSRF_COOKIE_SECURE = os.getenv("DJANGO_CSRF_COOKIE_SECURE", "true").lower() == "true"
