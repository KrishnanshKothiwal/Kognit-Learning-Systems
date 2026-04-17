import asyncio, httpx, sys
sys.path.insert(0, '.')
from config import settings

key = settings.gemini_api_key

async def test():
    for model in ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro-latest', 'gemini-pro']:
        url = f'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}'
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.post(url, headers={'Content-Type': 'application/json'},
                json={'contents': [{'parts': [{'text': 'Say OK'}]}]})
            status = r.status_code
            if status == 200:
                text = r.json().get('candidates',[{}])[0].get('content',{}).get('parts',[{}])[0].get('text','')
                print(f'WORKING: {model} -> {text[:50]}')
                break
            else:
                err_msg = r.json().get('error',{}).get('message','')[:80]
                print(f'FAIL {status}: {model} -> {err_msg}')

asyncio.run(test())
