#!/usr/bin/env python3
"""
Migração Chef Control entre projectos Supabase (PostgreSQL).

Uso típico:
  1. Criar projecto novo no Supabase (região à escolha).
  2. Copiar backend/supabase.new.env.example → backend/supabase.new.env e preencher credenciais.
  3. Esquema (sem dados):
       python backend/scripts/migrate_supabase.py schema --target supabase.new.env
  4. Dados (da base antiga para a nova):
       python backend/scripts/migrate_supabase.py data --source supabase.local.env --target supabase.new.env
  5. Verificar contagens:
       python backend/scripts/migrate_supabase.py verify --source supabase.local.env --target supabase.new.env
  6. Actualizar Railway + supabase.local.env com as credenciais da base nova.

Requer: psycopg2-binary (pip install psycopg2-binary)
"""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path

try:
    import psycopg2
    from psycopg2 import sql
    from psycopg2.extras import Json
except ImportError:
    print("Instale: pip install psycopg2-binary", file=sys.stderr)
    sys.exit(1)

SCRIPTS_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPTS_DIR.parent

MOTHER_MIGRATIONS = [
    "01_schema.sql",
    "02_add_is_admin_and_admin_user.sql",
    "03_create_orders_table.sql",
    "04_migrations_alteracoes_tabelas.sql",
    "05_license_transactions.sql",
    "06_reminders.sql",
    "07_withdrawals.sql",
    "08_access_logs.sql",
    "09_system_notifications.sql",
    "10_user_feedback.sql",
    "11_phone_change_requests.sql",
    "13_user_store_settings.sql",
    "14_store_settings_more_fields.sql",
    "15_license_payment_columns.sql",
    "16_mpesa_payments_table.sql",
    "17_drop_legacy_orders_tables.sql",
    "18_mpesa_simulation_channel.sql",
    "19_trial_license_status.sql",
    "20_reminders_notify_days_before.sql",
    "21_landing_suggestions.sql",
    "22_security_access.sql",
    "23_operational_expenses.sql",
    "24_fix_nullable_columns.sql",
    "25_order_closure.sql",
    "26_fix_cancelled_charged.sql",
    "27_system_notifications_maintenance.sql",
    "28_notification_audience.sql",
    "29_user_onboarding.sql",
    "30_treasury_cash_reserve.sql",
    "31_treasury_platform.sql",
    "32_user_activity.sql",
    "33_user_feedback_would_recommend.sql",
]

MOTHER_SCRIPT = SCRIPTS_DIR / "script-mother.sql"
POST_MOTHER = [
    "34_mpesa_payment_rejection.sql",
    "35_mpesa_payment_operator_ref.sql",
    "36_license_transaction_receipt.sql",
    "37_license_transaction_valid_until_backfill.sql",
    "38_password_reset_otps.sql",
    "39_contact_messages.sql",
]

# Ordem respeitando FKs (pais antes dos filhos)
DATA_TABLE_ORDER = [
    "users",
    "user_licenses",
    "user_store_settings",
    "orders",
    "order_ingredient_ids",
    "license_transactions",
    "mpesa_payments",
    "reminders",
    "withdrawals",
    "access_logs",
    "system_notifications",
    "user_notification_dismissals",
    "user_feedback",
    "phone_change_requests",
    "landing_suggestions",
    "security_events",
    "operational_expenses",
    "platform_admin_settings",
    "treasury_investments",
    "treasury_allocation_suggestions",
    "user_activity_logs",
    "password_reset_otps",
    "contact_messages",
]


def load_env_file(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


def connect(env_path: Path):
    env = load_env_file(env_path)
    required = ("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")
    missing = [k for k in required if k not in env or not env[k]]
    if missing:
        raise SystemExit(f"Faltam variáveis em {env_path}: {', '.join(missing)}")
    sslmode = env.get("DB_SSLMODE", "require")
    return psycopg2.connect(
        host=env["DB_HOST"],
        port=int(env["DB_PORT"]),
        dbname=env["DB_NAME"],
        user=env["DB_USER"],
        password=env["DB_PASSWORD"],
        sslmode=sslmode,
    )


def find_psql() -> str | None:
    try:
        r = subprocess.run(["psql", "--version"], capture_output=True, text=True)
        if r.returncode == 0:
            return "psql"
    except FileNotFoundError:
        pass
    try:
        r = subprocess.run(["docker", "info"], capture_output=True, text=True)
        if r.returncode == 0:
            return "docker"
    except FileNotFoundError:
        pass
    return None


def run_sql_file_psql(env_path: Path, sql_file: Path) -> None:
    env = load_env_file(env_path)
    mode = find_psql()
    if mode == "psql":
        conninfo = (
            f"host={env['DB_HOST']} port={env['DB_PORT']} dbname={env['DB_NAME']} "
            f"user={env['DB_USER']} sslmode={env.get('DB_SSLMODE', 'require')}"
        )
        cmd = [
            "psql",
            conninfo,
            "-v",
            "ON_ERROR_STOP=1",
            "-f",
            str(sql_file),
        ]
        subprocess.run(cmd, check=True, env={**dict(__import__("os").environ), "PGPASSWORD": env["DB_PASSWORD"]})
        return
    if mode == "docker":
        scripts_mount = SCRIPTS_DIR.resolve().as_posix()
        inner = f"/scripts/{sql_file.name}"
        uri = (
            f"postgresql://{env['DB_USER']}:{env['DB_PASSWORD']}"
            f"@{env['DB_HOST']}:{env['DB_PORT']}/{env['DB_NAME']}?sslmode={env.get('DB_SSLMODE', 'require')}"
        )
        subprocess.run(
            [
                "docker",
                "run",
                "--rm",
                "-v",
                f"{scripts_mount}:/scripts",
                "postgres:16-alpine",
                "psql",
                uri,
                "-v",
                "ON_ERROR_STOP=1",
                "-f",
                inner,
            ],
            check=True,
        )
        return
    raise SystemExit("Nem psql nem docker encontrados. Instale PostgreSQL client ou Docker.")


def run_sql_text(conn, text: str, label: str) -> None:
    print(f">> {label}")
    with conn.cursor() as cur:
        cur.execute(text)
    conn.commit()


def apply_schema_python(target_env: Path) -> None:
    conn = connect(target_env)
    try:
        print("=== script-mother via Python (01–33) ===")
        for name in MOTHER_MIGRATIONS:
            path = SCRIPTS_DIR / name
            if not path.is_file():
                raise SystemExit(f"Migração em falta: {path}")
            run_sql_text(conn, path.read_text(encoding="utf-8"), name)
        for name in POST_MOTHER:
            path = SCRIPTS_DIR / name
            if not path.is_file():
                raise SystemExit(f"Migração em falta: {path}")
            run_sql_text(conn, path.read_text(encoding="utf-8"), name)
    finally:
        conn.close()
    print("Esquema aplicado com sucesso.")


def apply_schema(target_env: Path) -> None:
    mode = find_psql()
    if mode in ("psql", "docker"):
        if not MOTHER_SCRIPT.is_file():
            raise SystemExit(f"Não encontrado: {MOTHER_SCRIPT}")
        print("=== script-mother (01–33) ===")
        run_sql_file_psql(target_env, MOTHER_SCRIPT)
        conn = connect(target_env)
        try:
            for name in POST_MOTHER:
                path = SCRIPTS_DIR / name
                if not path.is_file():
                    raise SystemExit(f"Migração em falta: {path}")
                run_sql_text(conn, path.read_text(encoding="utf-8"), name)
        finally:
            conn.close()
        print("Esquema aplicado com sucesso.")
        return
    print("psql/docker indisponível — a usar psycopg2.")
    apply_schema_python(target_env)


def list_public_tables(conn) -> list[str]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
            ORDER BY table_name
            """
        )
        return [r[0] for r in cur.fetchall()]


def table_counts(conn, tables: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    with conn.cursor() as cur:
        for table in tables:
            cur.execute(sql.SQL("SELECT COUNT(*) FROM {}").format(sql.Identifier(table)))
            counts[table] = cur.fetchone()[0]
    return counts


def cmd_schema(args: argparse.Namespace) -> None:
    apply_schema(Path(args.target))


def cmd_counts(args: argparse.Namespace) -> None:
    conn = connect(Path(args.env))
    try:
        tables = list_public_tables(conn)
        counts = table_counts(conn, tables)
        print(f"Base: {args.env} ({len(tables)} tabelas)")
        for t in tables:
            print(f"  {t}: {counts[t]}")
    finally:
        conn.close()


def cmd_verify(args: argparse.Namespace) -> None:
    src = connect(Path(args.source))
    tgt = connect(Path(args.target))
    try:
        src_tables = set(list_public_tables(src))
        tgt_tables = set(list_public_tables(tgt))
        only_src = sorted(src_tables - tgt_tables)
        only_tgt = sorted(tgt_tables - src_tables)
        if only_src:
            print("Só na origem:", ", ".join(only_src))
        if only_tgt:
            print("Só no destino:", ", ".join(only_tgt))
        common = sorted(src_tables & tgt_tables)
        src_counts = table_counts(src, common)
        tgt_counts = table_counts(tgt, common)
        mismatches = []
        print(f"\n{'Tabela':<35} {'Origem':>8} {'Destino':>8}")
        print("-" * 55)
        for t in common:
            s, d = src_counts[t], tgt_counts[t]
            mark = "  ***" if s != d else ""
            if s != d:
                mismatches.append(t)
            print(f"{t:<35} {s:>8} {d:>8}{mark}")
        if mismatches:
            print(f"\nDiferenças em {len(mismatches)} tabela(s).")
            sys.exit(1)
        print("\nContagens iguais em todas as tabelas comuns.")
    finally:
        src.close()
        tgt.close()


def adapt_row(row: tuple) -> tuple:
    return tuple(Json(v) if isinstance(v, (dict, list)) else v for v in row)


def copy_table_data(src, tgt, table: str) -> int:
    with src.cursor() as sc:
        sc.execute(sql.SQL("SELECT * FROM {}").format(sql.Identifier(table)))
        rows = sc.fetchall()
        if not rows:
            return 0
        cols = [d[0] for d in sc.description]
    adapted = [adapt_row(r) for r in rows]
    with tgt.cursor() as tc:
        placeholders = sql.SQL(", ").join(sql.Placeholder() * len(cols))
        insert = sql.SQL("INSERT INTO {} ({}) VALUES ({})").format(
            sql.Identifier(table),
            sql.SQL(", ").join(map(sql.Identifier, cols)),
            placeholders,
        )
        tc.executemany(insert, adapted)
    return len(rows)


def truncate_target_tables(tgt, tables: list[str]) -> None:
    if not tables:
        return
    with tgt.cursor() as cur:
        cur.execute(
            sql.SQL("TRUNCATE {} RESTART IDENTITY CASCADE").format(
                sql.SQL(", ").join(map(sql.Identifier, tables))
            )
        )
    tgt.commit()


def cmd_data(args: argparse.Namespace) -> None:
    src_path = Path(args.source)
    tgt_path = Path(args.target)
    src = connect(src_path)
    tgt = connect(tgt_path)
    try:
        src_tables = set(list_public_tables(src))
        ordered = [t for t in DATA_TABLE_ORDER if t in src_tables]
        extra = sorted(src_tables - set(ordered))
        if extra:
            print("Tabelas extra (copiadas no fim):", ", ".join(extra))
            ordered.extend(extra)
        print("A limpar destino e copiar dados...")
        with tgt.cursor() as cur:
            cur.execute("SET session_replication_role = replica")
        tgt.commit()
        truncate_target_tables(tgt, ordered)
        total = 0
        for table in ordered:
            n = copy_table_data(src, tgt, table)
            tgt.commit()
            if n:
                print(f"  {table}: {n} linhas")
                total += n
        with tgt.cursor() as cur:
            cur.execute("SET session_replication_role = DEFAULT")
        tgt.commit()
        print(f"Total: {total} linhas copiadas.")
    finally:
        src.close()
        tgt.close()


def cmd_print_railway_env(args: argparse.Namespace) -> None:
    env = load_env_file(Path(args.env))
    ref_match = re.search(r"postgres\.([a-z0-9]+)", env.get("DB_USER", ""))
    ref = ref_match.group(1) if ref_match else "<PROJECT_REF>"
    host = env["DB_HOST"]
    print("\n# Variáveis para Railway (backend):")
    print(f"DB_HOST={host}")
    print(f"DB_PORT={env['DB_PORT']}")
    print(f"DB_NAME={env['DB_NAME']}")
    print(f"DB_USER={env['DB_USER']}")
    print("DB_PASSWORD=<a mesma senha do Supabase>")
    print(f"DB_SSLMODE={env.get('DB_SSLMODE', 'require')}")
    print(
        f"DATABASE_JDBC_URL=jdbc:postgresql://{host}:{env['DB_PORT']}/{env['DB_NAME']}?sslmode={env.get('DB_SSLMODE', 'require')}"
    )
    print(f"\n# Project ref Supabase: {ref}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Migração Supabase Chef Control")
    sub = parser.add_subparsers(dest="command", required=True)

    p_schema = sub.add_parser("schema", help="Aplicar esquema (script-mother + 34–39)")
    p_schema.add_argument("--target", default=str(BACKEND_DIR / "supabase.new.env"))
    p_schema.set_defaults(func=cmd_schema)

    p_counts = sub.add_parser("counts", help="Contar linhas por tabela")
    p_counts.add_argument("--env", default=str(BACKEND_DIR / "supabase.local.env"))
    p_counts.set_defaults(func=cmd_counts)

    p_data = sub.add_parser("data", help="Copiar dados origem → destino")
    p_data.add_argument("--source", default=str(BACKEND_DIR / "supabase.local.env"))
    p_data.add_argument("--target", default=str(BACKEND_DIR / "supabase.new.env"))
    p_data.set_defaults(func=cmd_data)

    p_verify = sub.add_parser("verify", help="Comparar contagens origem vs destino")
    p_verify.add_argument("--source", default=str(BACKEND_DIR / "supabase.local.env"))
    p_verify.add_argument("--target", default=str(BACKEND_DIR / "supabase.new.env"))
    p_verify.set_defaults(func=cmd_verify)

    p_railway = sub.add_parser("railway-env", help="Imprimir variáveis para Railway")
    p_railway.add_argument("--env", default=str(BACKEND_DIR / "supabase.new.env"))
    p_railway.set_defaults(func=cmd_print_railway_env)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
