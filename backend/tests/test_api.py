from fastapi.testclient import TestClient
import pytest
from app import main
from app.storage import AuditStore


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setattr(main, 'store', AuditStore(f'sqlite:///{tmp_path}/test.db'))
    monkeypatch.setattr(main, 'sessions', {})
    with TestClient(main.app) as client:
        yield client


def test_training_flow_and_websocket(client):
    created = client.post('/api/sessions', json={'scenario': 'fault_lt1'})
    assert created.status_code == 201
    state = created.json()
    sid = state['session_id']
    with client.websocket_connect(f'/ws/{sid}') as ws:
        assert ws.receive_json()['feeders'][0]['fault']
    response = client.post(f'/api/sessions/{sid}/commands', json={
        'action': 'close', 'target': 'LT1', 'revision': state['revision']})
    assert response.status_code == 409
    state = client.get(f'/api/sessions/{sid}').json()
    assert state['mistakes'] == 1
    for action in ('clear_fault', 'close'):
        response = client.post(f'/api/sessions/{sid}/commands', json={
            'action': action, 'target': 'LT1', 'revision': state['revision']})
        assert response.status_code == 200
        state = response.json()
    assert state['status'] == 'normal'
    assert state['completed_seconds'] is not None
    report = client.get(f'/api/sessions/{sid}/report').json()
    assert report['score'] == 90
    assert len(report['logs']) == 4


def test_validation_stale_commands_and_isolation(client):
    a = client.post('/api/sessions', json={}).json()
    b = client.post('/api/sessions', json={}).json()
    url = f"/api/sessions/{a['session_id']}/commands"
    command = {'action': 'open', 'target': 'LT2', 'revision': 0}
    assert client.post(url, json=command).status_code == 200
    assert client.post(url, json=command).status_code == 409
    assert client.get(f"/api/sessions/{b['session_id']}").json()['feeders'][1]['closed']
    assert client.post(url, json={'action': 'set_load', 'value': 99, 'revision': 1}).status_code == 422
    assert client.get('/api/sessions/missing').status_code == 404


def test_audit_persists_across_connections(tmp_path):
    url = f'sqlite:///{tmp_path}/persist.db'
    AuditStore(url).append('training-1', 'Cắt LT1')
    assert AuditStore(url).logs('training-1')[0]['message'] == 'Cắt LT1'
