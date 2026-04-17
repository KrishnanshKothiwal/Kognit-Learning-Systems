import sqlite3

for db in ['edunudge.db', 'test.db', 'test_kognit_pytest.db']:
    try:
        conn = sqlite3.connect(db)
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = c.fetchall()
        print(f"{db} tables: {tables}")
        quiz_tables = [t[0] for t in tables if 'quiz' in t[0].lower()]
        print(f"  Quiz-related: {quiz_tables}")
        for t in quiz_tables:
            c.execute(f"SELECT COUNT(*) FROM {t}")
            print(f"    {t}: {c.fetchone()[0]} rows")
        conn.close()
    except Exception as e:
        print(f"{db} error: {e}")
