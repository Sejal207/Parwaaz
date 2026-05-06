import sys
from fastapi.testclient import TestClient
from app.main import app
import traceback

client = TestClient(app)
try:
    response = client.get('/api/sessions/')
    print('STATUS', response.status_code)
    print('BODY', response.text)
except Exception as e:
    traceback.print_exc()
