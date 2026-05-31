from __future__ import annotations

import argparse
import re
from pathlib import Path

KEY_RE = re.compile(r"^[A-Z0-9]+(?:_[A-Z0-9]+)+$")
TABLE_ROW_RE = re.compile(r"^\|(.+)\|$")
URL_RE = re.compile(r"^https?://", re.IGNORECASE)
SEPARATOR_ROW_RE = re.compile(r"^[:\-\s]+$")


def parse_env(path: Path) -> dict[str, str]:
    entries: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.removeprefix("export ").strip()
        entries[key] = value.strip().strip('"').strip("'")
    return entries


def parse_table(path: Path) -> list[tuple[str, str, str]]:
    rows: list[tuple[str, str, str]] = []
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not TABLE_ROW_RE.match(line):
            continue
        # split into cells and trim common surrounding characters (backticks/quotes)
        cells = [
            cell.strip().strip("`\"'") for cell in line.strip().strip("|").split("|")
        ]
        if len(cells) < 3:
            continue
        if all(SEPARATOR_ROW_RE.match(cell) for cell in cells):
            continue
        # ignore obvious English header in first column
        if cells[0].lower() in {"displayname", "name"}:
            continue
        # ignore rows where the example-key column isn't an env-style key
        example_key = cells[1]
        if not example_key or not KEY_RE.match(example_key):
            continue
        rows.append((cells[0], example_key, cells[2]))
    return rows


def service_prefix(key: str) -> str:
    return key.split("_", 1)[0] if key else ""


def redact(value: str) -> str:
    return value if URL_RE.match(value) else "<redacted>"


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Dry-run check for AFFiNE secret key names"
    )
    parser.add_argument("--env", default=".env", type=Path)
    parser.add_argument(
        "--affine-md", type=Path, help="Optional exported AFFiNE markdown table"
    )
    args = parser.parse_args()

    env_entries = parse_env(args.env)
    invalid_keys = sorted(key for key in env_entries if not KEY_RE.match(key))
    valid_entries = {
        key: value for key, value in env_entries.items() if KEY_RE.match(key)
    }
    services = sorted({service_prefix(key) for key in valid_entries})

    print(f"Loaded {len(env_entries)} keys from {args.env}")
    if invalid_keys:
        print("Malformed keys:")
        for key in invalid_keys:
            print(f"- {key}")

    if not args.affine_md:
        print("No AFFiNE export provided; showing local services only:")
        for service in services:
            sample_key = next(
                key for key in valid_entries if service_prefix(key) == service
            )
            print(f"- {service}: {sample_key} ({redact(valid_entries[sample_key])})")
        return 0

    rows = parse_table(args.affine_md)
    affine_services = {service_prefix(example) for _, example, _ in rows}

    missing = [service for service in services if service not in affine_services]
    stale = [
        display
        for display, example, _ in rows
        if service_prefix(example) not in services
    ]

    print(f"Loaded {len(rows)} AFFiNE rows from {args.affine_md}")
    print(
        f"Summary: {len(services)} local services, {len(missing)} missing in AFFiNE, {len(stale)} AFFiNE-only rows"
    )
    print("Missing in AFFiNE:")
    for service in missing:
        sample_key = next(
            key for key in valid_entries if service_prefix(key) == service
        )
        print(f"- {service}: {sample_key} ({redact(valid_entries[sample_key])})")

    print("AFFiNE-only rows:")
    for display in stale:
        print(f"- {display}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
