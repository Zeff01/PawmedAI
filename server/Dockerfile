FROM python:3.13-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV UV_LINK_MODE=copy
ENV UV_PROJECT_ENVIRONMENT=/opt/venv

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential ca-certificates \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

COPY pyproject.toml uv.lock ./
RUN uv sync --no-dev

COPY . .

ENV PATH="/opt/venv/bin:${PATH}"

EXPOSE 8000

RUN chmod +x /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "core.wsgi:application", "-c", "gunicorn.conf.py"]
