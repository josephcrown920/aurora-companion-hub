import { useState } from "react";
import { Eye, EyeOff, GripVertical, Image as ImageIcon, Lock, LockOpen, Music2, Plus, Trash2, Type, Video, Layers3 } from "lucide-react";

export type LayerItem = {
  id: string;
  type: "video" | "image" | "text" | "audio" | "overlay";
  name: string;
  visible: boolean;
  locked: boolean;
  opacity: number;
  x: number;
  y: number;
  scale: number;
};

const ICONS = { video: Video, image: ImageIcon, text: Type, audio: Music2, overlay: Layers3 };

export function LayersEditor() {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const add = (type: LayerItem["type"]) => {
    const layer = { id: crypto.randomUUID(), type, name: `${type[0]!.toUpperCase()}${type.slice(1)} ${layers.length + 1}`, visible: true, locked: false, opacity: 1, x: 0, y: 0, scale: 1 };
    setLayers((v) => [...v, layer]); setSelected(layer.id);
  };
  const patch = (id: string, p: Partial<LayerItem>) => setLayers((v) => v.map((x) => x.id === id ? { ...x, ...p } : x));
  const remove = (id: string) => { setLayers((v) => v.filter((x) => x.id !== id)); if (selected === id) setSelected(null); };
  const move = (id: string, d: -1 | 1) => setLayers((v) => { const i=v.findIndex(x=>x.id===id), j=i+d; if(i<0||j<0||j>=v.length)return v; const n=[...v]; [n[i],n[j]]=[n[j]!,n[i]!]; return n; });
  const active = layers.find(x => x.id === selected);

  return <section className="aurora-layers-panel">
    <div className="aurora-layers-head"><div><strong>Layers / Compositor</strong><small>Build editable video compositions before generation or export.</small></div><span>{layers.length}</span></div>
    <div className="aurora-layer-adds">
      {(Object.keys(ICONS) as LayerItem["type"][]).map(type => { const Icon=ICONS[type]; return <button key={type} onClick={()=>add(type)}><Icon/>{type}</button>; })}
    </div>
    <div className="aurora-layer-body">
      <div className="aurora-layer-list">
        {layers.length===0 ? <div className="aurora-layer-empty"><Plus/>Add video, image, text, audio or overlay layers.</div> : [...layers].reverse().map(layer => { const Icon=ICONS[layer.type]; return <div key={layer.id} className={`aurora-layer-row ${selected===layer.id?"active":""}`} onClick={()=>setSelected(layer.id)}>
          <GripVertical/><Icon/><span>{layer.name}</span>
          <button onClick={(e)=>{e.stopPropagation();patch(layer.id,{visible:!layer.visible})}}>{layer.visible?<Eye/>:<EyeOff/>}</button>
          <button onClick={(e)=>{e.stopPropagation();patch(layer.id,{locked:!layer.locked})}}>{layer.locked?<Lock/>:<LockOpen/>}</button>
          <button onClick={(e)=>{e.stopPropagation();remove(layer.id)}}><Trash2/></button>
        </div>})}
      </div>
      {active && <div className="aurora-layer-inspector">
        <div className="aurora-layer-order"><button onClick={()=>move(active.id,-1)}>↑</button><button onClick={()=>move(active.id,1)}>↓</button></div>
        <input value={active.name} disabled={active.locked} onChange={e=>patch(active.id,{name:e.target.value})}/>
        {([["opacity",active.opacity,0,1,.05],["scale",active.scale,.1,4,.05],["x",active.x,-100,100,1],["y",active.y,-100,100,1]] as const).map(([key,value,min,max,step])=><label key={key}>{key}<input type="range" min={min} max={max} step={step} value={value} disabled={active.locked} onChange={e=>patch(active.id,{[key]:Number(e.target.value)})}/></label>)}
      </div>}
    </div>
  </section>;
}
