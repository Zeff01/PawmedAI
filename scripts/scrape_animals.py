#!/usr/bin/env python3
"""
Scrapes featured animals from a-z-animals.com and saves to client/public/animals.json.
Fields: name, description, url, image, status, category, scientific_name,
        classification, quick_stats, features, measurements, facts,
        conservation, lifecycle, behavior

Usage:
    python3 scripts/scrape_animals.py
"""

import json
import time
import string
from pathlib import Path

import requests
from bs4 import BeautifulSoup

OUTPUT = Path(__file__).parent.parent / "client" / "public" / "animals.json"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    )
}

STATUS_MAP = {
    "ne": "Not Evaluated",
    "lc": "Least Concern",
    "nt": "Near Threatened",
    "vu": "Vulnerable",
    "en": "Endangered",
    "cr": "Critically Endangered",
    "ew": "Extinct in the Wild",
    "ex": "Extinct",
}

CLASS_TO_CATEGORY: dict[str, str] = {
    "Mammalia": "Mammals",
    "Aves": "Birds",
    "Reptilia": "Reptiles",
    "Amphibia": "Amphibians",
    "Actinopterygii": "Fish",
    "Chondrichthyes": "Fish",
    "Sarcopterygii": "Fish",
    "Myxini": "Fish",
    "Petromyzontida": "Fish",
    "Insecta": "Insects",
    "Arachnida": "Arachnids",
    "Malacostraca": "Crustaceans",
    "Gastropoda": "Mollusks",
    "Bivalvia": "Mollusks",
    "Cephalopoda": "Mollusks",
    "Echinoidea": "Echinoderms",
    "Asteroidea": "Echinoderms",
}

BASE_LETTER_URL = "https://a-z-animals.com/animals/animals-that-start-with-{}/"


def get(url: str, delay: float = 0.0) -> BeautifulSoup | None:
    if delay:
        time.sleep(delay)
    try:
        r = requests.get(url, headers=HEADERS, timeout=15)
        r.raise_for_status()
        return BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"  WARN: {url} → {e}")
        return None


def scrape_letter(letter: str) -> list[dict]:
    soup = get(BASE_LETTER_URL.format(letter), delay=0.6)
    if not soup:
        return []

    animals = []
    for article in soup.select("article.animal-card"):
        link = article.select_one("a.trackLink")
        name_el = article.select_one("h3.animal-card__name")
        desc_el = article.select_one("p.animal-card__scientific")
        img_el = article.select_one("img.animal-card__image")
        status_el = article.select_one("span[class*='animal-card__status--']")

        if not (link and name_el):
            continue

        status_code = ""
        if status_el:
            for cls in status_el.get("class", []):
                if cls.startswith("animal-card__status--"):
                    status_code = cls.replace("animal-card__status--", "")

        animals.append({
            "name": name_el.get_text(strip=True),
            "description": desc_el.get_text(strip=True) if desc_el else "",
            "url": link.get("href", ""),
            "image": img_el.get("src", "") if img_el else "",
            "status": STATUS_MAP.get(status_code, ""),
            "category": "",
            "scientific_name": "",
            "classification": {},
            "quick_stats": {},
            "features": [],
            "measurements": {},
            "facts": [],
            "conservation": {},
            "lifecycle": {},
            "behavior": {},
        })

    print(f"  [{letter.upper()}] {len(animals)} animals")
    return animals


def enrich_animal(animal: dict) -> None:
    soup = get(animal["url"], delay=0.5)
    if not soup:
        return

    # --- Classification ---
    classification: dict[str, str] = {}
    for row in soup.select(".enc-classification__rank"):
        label = row.select_one("dt")
        value = row.select_one("dd")
        if label and value:
            classification[label.get_text(strip=True)] = value.get_text(strip=True)
    animal["classification"] = classification
    animal["scientific_name"] = classification.get("Species", "")
    taxon_class = classification.get("Class", "")
    animal["category"] = CLASS_TO_CATEGORY.get(taxon_class, "Other")

    # --- Distinguishing features ---
    feat_el = soup.select_one(".enc-classification__features-list")
    if feat_el:
        animal["features"] = [
            li.get_text(strip=True)
            for li in feat_el.select("li")
            if li.get_text(strip=True)
        ]

    # --- Quick stats ---
    quick: dict[str, str] = {}
    for item in soup.select(".enc-quick-stats__item"):
        label = item.select_one(".enc-quick-stats__label")
        value = item.select_one(".enc-quick-stats__value")
        if label and value:
            quick[label.get_text(strip=True)] = value.get_text(strip=True)
    animal["quick_stats"] = quick

    # --- Physical measurements ---
    measurements: dict[str, str] = {}
    for item in soup.select(".enc-measure__item"):
        label = item.select_one(".enc-measure__item-label")
        primary = item.select_one(".enc-measure__item-value")
        rng = item.select_one(".enc-measure__range")
        if label:
            val = (primary.get_text(strip=True) if primary else "") or ""
            if rng:
                val = f"{val} {rng.get_text(strip=True)}".strip()
            measurements[label.get_text(strip=True)] = val
    animal["measurements"] = measurements

    # --- Did You Know facts ---
    animal["facts"] = [
        p.get_text(strip=True)
        for p in soup.select(".enc-facts__card-text")
        if p.get_text(strip=True)
    ]

    # --- Conservation ---
    cons: dict[str, str] = {}
    cons_desc = soup.select_one(".enc-conservation__description")
    if cons_desc:
        cons["description"] = cons_desc.get_text(strip=True)
    cons_trend = soup.select_one(".enc-conservation__trend")
    if cons_trend:
        cons["trend"] = cons_trend.get_text(strip=True)
    protected = soup.select(".enc-conservation__protection-item")
    if protected:
        cons["protected_under"] = [p.get_text(strip=True) for p in protected]
    animal["conservation"] = cons

    # --- Life cycle ---
    lc: dict = {}
    # Stages (Birth count, Lifespan)
    stages: dict[str, str] = {}
    for stage in soup.select(".enc-lifecycle__stage"):
        name = stage.select_one(".enc-lifecycle__stage-name")
        dur = stage.select_one(".enc-lifecycle__stage-duration")
        if name and dur:
            stages[name.get_text(strip=True)] = dur.get_text(strip=True)
    lc["stages"] = stages

    # Lifespan in the wild
    lifespans: list[dict[str, str]] = []
    for bar in soup.select(".enc-lifecycle__lifespan-bar"):
        label = bar.select_one(".enc-lifecycle__lifespan-label")
        value = bar.select_one(".enc-lifecycle__lifespan-value")
        if label and value:
            lifespans.append({
                "label": label.get_text(strip=True),
                "value": value.get_text(strip=True),
            })
    lc["lifespans"] = lifespans

    # Reproduction details
    repro: dict[str, str] = {}
    for item in soup.select(".enc-lifecycle__reproduction-item"):
        label = item.select_one(".enc-lifecycle__reproduction-label")
        value = item.select_one(".enc-lifecycle__reproduction-value")
        if label and value:
            repro[label.get_text(strip=True)] = value.get_text(strip=True)
    lc["reproduction"] = repro

    repro_desc = soup.select_one(".enc-lifecycle__reproduction-desc")
    if repro_desc:
        lc["reproduction_description"] = repro_desc.get_text(strip=True)

    animal["lifecycle"] = lc

    # --- Behavior & Ecology ---
    behavior: dict[str, str] = {}
    for section in soup.select(".enc-fieldnotes__section"):
        title_el = section.select_one(".enc-fieldnotes__section-title")
        if not title_el:
            continue
        title = title_el.get_text(strip=True)
        # Body text is in sibling elements after the header
        header = section.select_one(".enc-fieldnotes__section-header")
        body_parts = []
        if header:
            for sib in header.find_next_siblings():
                txt = sib.get_text(strip=True)
                if txt:
                    body_parts.append(txt)
        behavior[title] = " ".join(body_parts)[:500]
    animal["behavior"] = behavior


def main():
    all_animals: list[dict] = []
    print("Phase 1: scraping 26 letter pages…")
    for letter in string.ascii_lowercase:
        all_animals.extend(scrape_letter(letter))

    # Deduplicate by name
    seen: set[str] = set()
    unique: list[dict] = []
    for a in all_animals:
        key = a["name"].lower()
        if key not in seen:
            seen.add(key)
            unique.append(a)

    print(f"\nPhase 2: enriching {len(unique)} animals with full details…")
    for i, animal in enumerate(unique, 1):
        print(f"  [{i}/{len(unique)}] {animal['name']}", end="", flush=True)
        enrich_animal(animal)
        print(f" → {animal['category']}")

    unique.sort(key=lambda a: a["name"].lower())

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(unique, indent=2, ensure_ascii=False))

    cats: dict[str, int] = {}
    for a in unique:
        cats[a["category"]] = cats.get(a["category"], 0) + 1
    print(f"\nCategories: {cats}")
    print(f"Saved {len(unique)} animals → {OUTPUT}")


if __name__ == "__main__":
    main()
