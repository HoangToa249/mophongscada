import json
from unittest.mock import patch
import pandapower as pp
import pytest
from app.engine import Simulator


def test_loadflow_and_islanding():
    sim = Simulator()
    initial = sim.solve()
    assert initial['status'] == 'normal'
    assert 2.8 < initial['p_mw'] < 3
    assert all(0.95 < f['vm_pu'] < 1.05 for f in initial['feeders'])
    sim.command('LT1', 'open')
    result = sim.solve()
    assert result['feeders'][0]['vm_pu'] == 0
    assert result['feeders'][0]['p_mw'] == 0
    assert result['feeders'][1]['energized']
    assert result['p_mw'] < initial['p_mw']
    json.dumps(result, allow_nan=False)


def test_fault_interlock_and_restore():
    sim = Simulator()
    sim.inject_fault('LT1')
    with pytest.raises(ValueError, match='Liên động'):
        sim.command('LT1', 'close')
    assert not sim.closed['LT1']
    sim.clear_fault('LT1')
    sim.command('LT1', 'close')
    assert sim.solve()['status'] == 'normal'


def test_overload_and_full_blackout():
    sim = Simulator(load_factor=1.6)
    assert sim.solve()['transformer_loading_percent'] > 100
    for target in sim.closed:
        sim.command(target, 'open')
    result = sim.solve()
    assert result['served_percent'] == 0
    assert all(not f['energized'] for f in result['feeders'])
    json.dumps(result, allow_nan=False)


def test_nonconvergence_is_reported():
    with patch('app.engine.pp.runpp', side_effect=pp.LoadflowNotConverged):
        result = Simulator().solve()
    assert result['status'] == 'collapse'
    assert 'SYSTEM COLLAPSE' in result['message']
