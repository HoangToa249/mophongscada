import { ReactFlow, Background, Controls, Handle, Position } from '@xyflow/react';
import type { NodeProps, Node, Edge } from '@xyflow/react';
import { Zap, GitBranch, Power } from 'lucide-react';
import type { Telemetry } from './types';

type EquipmentData = {label: string; detail: string; kind: string; state: string; loading?: number};
type EquipmentNode = Node<EquipmentData>;
function Equipment({data}: NodeProps<EquipmentNode>) {
  return <div className={`equipment ${data.state}`}>
    <Handle type="target" position={Position.Top}/>
    <div className="equipment-heading">{data.kind === 'source' ? <Zap size={18}/> : data.kind === 'bus' ? <GitBranch size={18}/> : <Power size={18}/>}<span>{data.label}</span><i/></div>
    <div className="equipment-detail">{data.detail}</div>
    {data.loading !== undefined && <div className="loadbar"><span style={{width: `${Math.min(data.loading, 100)}%`}}/></div>}
    {data.kind === 'feeder' && <small>Nhấn để thao tác máy cắt</small>}
    <Handle type="source" position={Position.Bottom}/>
  </div>;
}
const nodeTypes = {equipment: Equipment};
export function Diagram({data, onSelect}: {data: Telemetry; onSelect: (id: string) => void}) {
  const nodes: EquipmentNode[] = [
    {id: 'source', type: 'equipment', position: {x: 260, y: 0}, data: {label: 'LƯỚI ĐIỆN 22 kV', detail: 'Nguồn vô hạn · 50 Hz', kind: 'source', state: 'live'}},
    {id: 'bus', type: 'equipment', position: {x: 260, y: 145}, data: {label: 'MBA T1 · 4 MVA', detail: `22 / 0.4 kV · U = ${data.bus_vm_pu.toFixed(3)} p.u.`, kind: 'bus', state: data.transformer_loading_percent > 100 ? 'warning' : 'live', loading: data.transformer_loading_percent}},
    ...data.feeders.map((f, i) => ({id: f.id, type: 'equipment', position: {x: i*260, y: 330}, data: {
      label: f.name, detail: `${f.vm_pu.toFixed(3)} p.u.  ·  ${f.p_mw.toFixed(2)} MW`, kind: 'feeder',
      state: f.fault ? 'fault' : !f.energized ? 'offline' : f.loading_percent > 100 || f.vm_pu < 0.95 ? 'warning' : 'live', loading: f.loading_percent,
    }})),
  ];
  const edges: Edge[] = [{id: 'incoming', source: 'source', target: 'bus', type: 'smoothstep', style: {stroke: '#38d8ad', strokeWidth: 3}},
    ...data.feeders.map(f => ({id: `line-${f.id}`, source: 'bus', target: f.id, type: 'smoothstep', animated: f.energized,
      style: {stroke: f.fault ? '#fb7185' : f.energized ? '#38d8ad' : '#465267', strokeWidth: 2.5},
      label: f.fault ? 'TRIP' : f.closed ? 'ĐÓNG' : 'CẮT', labelStyle: {fill: '#b9c8da', fontSize: 10}, labelBgStyle: {fill: '#111e30'},
    }))];
  return <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{padding: 0.2}}
    nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} minZoom={0.4} maxZoom={1.5}
    onNodeClick={(_, node) => {if (data.feeders.some(f => f.id === node.id)) onSelect(node.id);}}
    colorMode="dark"><Background color="#24334b" gap={24}/><Controls showInteractive={false}/></ReactFlow>;
}
