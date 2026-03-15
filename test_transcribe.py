import requests
try:
    response = requests.post('http://localhost:8000/transcribe', files={'file': open(r'd:\inksight\voice-agent-server\main.py', 'rb')})
    print(response.status_code)
    print(response.text)
except Exception as e:
    print(e)
