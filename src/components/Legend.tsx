import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const ITEMS = [
  { color: '#22c55e', label: 'Active / Processing', desc: 'Agent is actively working' },
  { color: '#3b82f6', label: 'Thinking', desc: 'Generating response' },
  { color: '#f59e0b', label: 'Waiting', desc: 'Awaiting API response' },
  { color: '#ef4444', label: 'Error', desc: 'Failure or timeout' },
  { color: '#64748b', label: 'Idle', desc: 'No recent activity' },
];

export function Legend() {
  const [open, setOpen] = useState(false);

  return (
    <div className="absolute bottom-4 left-4 z-20">
      <button
        onClick={() => setOpen(!open)}
        className="glass-panel rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <div className="flex gap-1">
          {ITEMS.map((item) => (
            <span key={item.color} className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
          ))}
        </div>
        Legend
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
      {open && (
        <div className="glass-panel rounded-lg mt-2 p-3 space-y-2 animate-in fade-in duration-200">
          {ITEMS.map((item) => (
            <div key={item.color} className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div>
                <span className="text-xs font-medium text-foreground">{item.label}</span>
                <span className="text-xs text-muted-foreground block">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
