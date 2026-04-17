import sqlite3

conn = sqlite3.connect('edunudge.db')
cur = conn.cursor()

# List all tables
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall()]
print("Tables in edunudge.db:", tables)

# Delete quiz attempts if the table exists
if 'user_quiz_attempts' in tables:
    cur.execute('DELETE FROM user_quiz_attempts')
    conn.commit()
    print(f'Deleted {cur.rowcount} quiz attempt records.')
else:
    # Try to find the right table name
    quiz_tables = [t for t in tables if 'quiz' in t.lower() or 'attempt' in t.lower()]
    print("Quiz-related tables found:", quiz_tables)

conn.close()
