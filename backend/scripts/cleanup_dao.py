#!/usr/bin/env python3
"""Script CLI pour nettoyer / archiver les fichiers DAO.
Usage:
  python3 cleanup_dao.py [--days DAYS] [--action archive|delete] [--apply]

Par défaut le script fait un dry-run (liste les fichiers qui seraient affectés).
--apply pour effectuer l'action.
"""
import os
import shutil
import argparse
import datetime
import json

BASE_DIR = os.path.join(os.getcwd(), "files", "uploads", "dao")
ARCHIVE_DIR_NAME = "archive"
IGNORED_DIRS = {"generated", ARCHIVE_DIR_NAME}


def find_candidates(days: int):
    cutoff = datetime.datetime.now() - datetime.timedelta(days=days)
    candidates = []
    if not os.path.exists(BASE_DIR):
        return candidates
    for name in os.listdir(BASE_DIR):
        if name in IGNORED_DIRS:
            continue
        path = os.path.join(BASE_DIR, name)
        if os.path.isdir(path):
            continue
        try:
            mtime = datetime.datetime.fromtimestamp(os.path.getmtime(path))
        except Exception:
            continue
        if mtime < cutoff:
            candidates.append(path)
    return candidates


def perform_action(paths, action: str):
    os.makedirs(os.path.join(BASE_DIR, ARCHIVE_DIR_NAME), exist_ok=True)
    moved = []
    deleted = []
    errors = []
    for p in paths:
        try:
            if action == "delete":
                os.remove(p)
                deleted.append(p)
            else:
                dest = os.path.join(BASE_DIR, ARCHIVE_DIR_NAME, os.path.basename(p))
                shutil.move(p, dest)
                moved.append(dest)
        except Exception as e:
            errors.append({"path": p, "error": str(e)})
    return {"moved": moved, "deleted": deleted, "errors": errors}


def main():
    parser = argparse.ArgumentParser(description="Cleanup/archive old DAO uploads")
    parser.add_argument("--days", type=int, default=30, help="Age en jours au-delà duquel traiter les fichiers")
    parser.add_argument("--action", choices=["archive", "delete"], default="archive")
    parser.add_argument("--apply", action="store_true", help="Appliquer l'action (sinon dry-run)")
    parser.add_argument("--output-json", help="Chemin fichier pour écrire le résumé JSON")
    args = parser.parse_args()

    candidates = find_candidates(args.days)
    summary = {"candidates_count": len(candidates), "candidates": candidates, "days": args.days, "action": args.action}

    if not args.apply:
        print("DRY RUN - fichiers qui seraient traités:")
        for p in candidates:
            print(p)
        if args.output_json:
            with open(args.output_json, "w", encoding="utf-8") as fh:
                json.dump(summary, fh, indent=2, ensure_ascii=False)
        return

    result = perform_action(candidates, args.action)
    summary.update(result)
    print("Action effectuée:")
    print(json.dumps(summary, indent=2, ensure_ascii=False))
    if args.output_json:
        with open(args.output_json, "w", encoding="utf-8") as fh:
            json.dump(summary, fh, indent=2, ensure_ascii=False)


if __name__ == "__main__":
    main()
