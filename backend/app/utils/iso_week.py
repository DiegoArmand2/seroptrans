"""Semanas ISO 8601 (misma regla que el frontend)."""


def iso_weeks_in_iso_year(iso_year: int) -> int:
    p = (iso_year + iso_year // 4 - iso_year // 100 + iso_year // 400) % 7
    return 53 if p in (4, 3) else 52
