from __future__ import annotations

import logging
from urllib.parse import unquote, urlparse

import requests
from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import serializers

DEFAULT_CDN_HOSTS = frozenset({"ucarecdn.com"})

DEFAULT_CDN_SUFFIXES = frozenset({"ucarecd.net"})

logger = logging.getLogger(__name__)

FETCH_TIMEOUT_SECONDS = 15
_CHUNK_BYTES = 64 * 1024


def _allowed_hosts() -> frozenset[str]:
    return frozenset(getattr(settings, "UPLOADCARE_CDN_HOSTS", DEFAULT_CDN_HOSTS))


def _allowed_suffixes() -> frozenset[str]:
    return frozenset(
        getattr(settings, "UPLOADCARE_CDN_SUFFIXES", DEFAULT_CDN_SUFFIXES)
    )


def is_uploadcare_url(url: str | None) -> bool:
    if not url:
        return False

    parsed = urlparse(url)
    if parsed.scheme != "https" or not parsed.hostname:
        return False

    host = parsed.hostname
    if host in _allowed_hosts():
        return True

    return any(
        host == suffix or host.endswith(f".{suffix}")
        for suffix in _allowed_suffixes()
    )


def _filename_from(url: str, fallback: str) -> str:
    name = unquote(urlparse(url).path.rstrip("/").rsplit("/", 1)[-1])
    if not name or "." not in name or "/" in name or "\\" in name:
        return fallback
    return name[:120]


def fetch_uploadcare_file(
    url: str,
    *,
    max_bytes: int,
    allowed_types: set[str] | None = None,
    field_name: str = "file",
    fallback_name: str = "upload",
) -> SimpleUploadedFile:
    if not is_uploadcare_url(url):
        logger.warning(
            "Refused a non-Uploadcare upload URL: scheme=%r host=%r "
            "allowed=%r suffixes=%r",
            urlparse(url).scheme,
            urlparse(url).hostname,
            sorted(_allowed_hosts()),
            sorted(_allowed_suffixes()),
        )
        raise serializers.ValidationError(
            {field_name: "That file link is not an Uploadcare upload."}
        )

    try:
        response = requests.get(
            url, timeout=FETCH_TIMEOUT_SECONDS, stream=True
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        raise serializers.ValidationError(
            {field_name: "That upload could not be retrieved. Please try again."}
        ) from exc

    if not is_uploadcare_url(response.url):
        response.close()
        logger.warning(
            "Upload URL redirected off the CDN, to host=%r",
            urlparse(response.url).hostname,
        )
        raise serializers.ValidationError(
            {field_name: "That upload redirected somewhere unexpected."}
        )

    content_type = (response.headers.get("Content-Type") or "").split(";")[0].strip()
    if allowed_types is not None and content_type not in allowed_types:
        response.close()
        raise serializers.ValidationError(
            {field_name: "Unsupported file type. Use JPEG, PNG, or WEBP."}
        )

    chunks: list[bytes] = []
    total = 0
    try:
        for chunk in response.iter_content(chunk_size=_CHUNK_BYTES):
            if not chunk:
                continue
            total += len(chunk)
            if total > max_bytes:
                raise serializers.ValidationError(
                    {
                        field_name: "That file is larger than "
                        f"{max_bytes // (1024 * 1024)} MB."
                    }
                )
            chunks.append(chunk)
    except requests.RequestException as exc:
        raise serializers.ValidationError(
            {field_name: "That upload could not be retrieved. Please try again."}
        ) from exc
    finally:
        response.close()

    if not total:
        raise serializers.ValidationError({field_name: "That upload was empty."})

    return SimpleUploadedFile(
        _filename_from(url, fallback_name),
        b"".join(chunks),
        content_type=content_type or "application/octet-stream",
    )
