import { 
  Bell, 
  Map as MapIcon, 
  AlertTriangle, 
  Activity, 
  Users, 
  Settings, 
  Search,
  Menu,
  ChevronRight
} from "lucide-react";

export default function Home() {
  const incidents = [
    { id: 1, type: "Critical Emergency", location: "5th and Main St", time: "2m ago", status: "Emergency", icon: <AlertTriangle className="w-5 h-5 text-emergency" /> },
    { id: 2, type: "Traffic Accident", location: "Highway 10 North", time: "12m ago", status: "Warning", icon: <Activity className="w-5 h-5 text-warning" /> },
    { id: 3, type: "EMS Arrival", location: "San Francisco Blvd", time: "15m ago", status: "Stable", icon: <Users className="w-5 h-5 text-stable" /> },
  ];

  const resources = [
    { name: "Ambulances", active: 14, total: 17, value: 82 },
    { name: "Fire Trucks", active: 8, total: 12, value: 66 },
    { name: "Police Units", active: 22, total: 30, value: 73 },
  ];

  return (
    <div className="flex h-screen bg-surface font-sans text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col hidden lg:flex">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Activity className="w-6 h-6" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 line-clamp-1">Res-Q</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1 mt-4">
          <NavItem icon={<MapIcon className="w-5 h-5" />} label="Dashboard" active />
          <NavItem icon={<AlertTriangle className="w-5 h-5" />} label="Incidents" count={1} />
          <NavItem icon={<Activity className="w-5 h-5" />} label="Response Agents" />
          <NavItem icon={<Users className="w-5 h-5" />} label="Resources" />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">System</div>
          <NavItem icon={<Settings className="w-5 h-5" />} label="Settings" />
        </nav>

        <div className="p-4 mt-auto border-t border-border">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 border border-slate-100">
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-white shadow-sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">Officer J. Doe</p>
              <p className="text-xs text-slate-500 truncate">Dispatch Commander</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-border px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1">
            <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search incidents, locations, or units..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-stable/10 border border-stable/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-stable animate-pulse" />
              <span className="text-xs font-bold text-stable uppercase tracking-wider">System Live</span>
            </div>
            <button className="relative p-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-emergency rounded-full border-2 border-white" />
            </button>
          </div>
        </header>

        {/* Dashboard Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full min-h-0">
            {/* Map Area */}
            <div className="xl:col-span-3 flex flex-col gap-6">
              <div className="flex-1 min-h-[400px] bg-slate-200 rounded-3xl border border-border overflow-hidden relative group">
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center grayscale opacity-50 group-hover:grayscale-0 transition-all duration-700" />
                <div className="absolute inset-0 bg-primary/5" />
                
                {/* Map Controls Mock */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <div className="p-2 bg-white/90 backdrop-blur-md border border-border rounded-xl shadow-lg flex flex-col">
                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-700 font-bold">+</button>
                    <div className="h-px bg-border mx-2" />
                    <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-700 font-bold">-</button>
                  </div>
                </div>

                {/* Map Markers Mock */}
                <MapMarker top="35%" left="45%" color="emergency" />
                <MapMarker top="60%" left="30%" color="warning" />
                <MapMarker top="20%" left="75%" color="stable" />

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/90 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Active Dispatch</p>
                      <p className="text-lg font-bold text-slate-900">Emergency Unit A-124</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-semibold text-slate-500">ETA to Scene</p>
                        <p className="text-sm font-mono font-bold text-primary">04:32 MIN</p>
                      </div>
                      <ChevronRight className="w-6 h-6 text-slate-300" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Resource Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6">
                {resources.map((res) => (
                  <div key={res.name} className="bg-white p-5 rounded-3xl border border-border shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <p className="text-sm font-semibold text-slate-500">{res.name}</p>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-50 rounded-lg text-slate-600 border border-slate-100">
                        {res.active}/{res.total}
                      </span>
                    </div>
                    <div className="flex items-end gap-3 mb-2">
                      <p className="text-3xl font-bold text-slate-900 font-mono tracking-tighter">{res.value}%</p>
                      <p className="text-xs text-slate-400 pb-1">Availability</p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${res.value > 80 ? 'bg-stable' : res.value > 60 ? 'bg-primary' : 'bg-warning'}`} 
                        style={{ width: `${res.value}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-border shadow-sm flex flex-col h-full overflow-hidden">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">Incident Feed</h3>
                  <button className="text-xs font-bold text-primary hover:underline">View All</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {incidents.map((incident) => (
                    <div 
                      key={incident.id} 
                      className={`group p-4 rounded-2xl border transition-all hover:shadow-md cursor-pointer ${
                        incident.status === 'Emergency' ? 'bg-emergency/5 border-emergency/20 hover:bg-emergency/10' :
                        incident.status === 'Warning' ? 'bg-warning/5 border-warning/20 hover:bg-warning/10' :
                        'bg-stable/5 border-stable/20 hover:bg-stable/10'
                      }`}
                    >
                      <div className="flex gap-4">
                        <div className={`p-2 rounded-xl transition-colors ${
                          incident.status === 'Emergency' ? 'bg-emergency text-white' :
                          incident.status === 'Warning' ? 'bg-warning text-white' :
                          'bg-stable text-white'
                        }`}>
                          {incident.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold uppercase tracking-wider opacity-70 italic">{incident.status}</span>
                            <span className="text-[10px] text-slate-400 font-medium">{incident.time}</span>
                          </div>
                          <p className="text-sm font-bold text-slate-900 truncate">{incident.type}</p>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{incident.location}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-4 bg-slate-50 border-t border-border mt-auto">
                  <button className="w-full py-3 bg-white border border-border rounded-xl text-sm font-bold text-slate-700 hover:bg-white/50 transition-colors shadow-sm active:scale-[0.98]">
                    Generate Daily Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  count?: number;
}

function NavItem({ icon, label, active = false, count = 0 }: NavItemProps) {
  return (
    <a 
      href="#" 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
        active 
          ? "bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]" 
          : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      <span className={`${active ? "text-white" : "text-slate-400 group-hover:text-primary transition-colors"}`}>
        {icon}
      </span>
      <span className="flex-1 font-semibold text-sm">{label}</span>
      {count > 0 && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-white text-primary' : 'bg-emergency text-white'}`}>
          {count}
        </span>
      )}
    </a>
  );
}

interface MapMarkerProps {
  top: string;
  left: string;
  color: "emergency" | "warning" | "stable";
}

function MapMarker({ top, left, color }: MapMarkerProps) {
  const bgClass = {
    emergency: "bg-emergency shadow-emergency/40",
    warning: "bg-warning shadow-warning/40",
    stable: "bg-stable shadow-stable/40"
  }[color];

  return (
    <div 
      className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center transition-transform hover:scale-125 cursor-pointer group z-20"
      style={{ top, left }}
    >
      <div className={`w-3 h-3 rounded-full ${bgClass} shadow-lg animate-pulse relative z-10`} />
      <div className={`absolute inset-0 rounded-full ${bgClass.split(' ')[0]} opacity-20 animate-ping`} />
      
      {/* Tooltip Mock */}
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-32 p-2 bg-white rounded-lg shadow-xl border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <p className="text-[10px] font-bold text-slate-900 text-center uppercase tracking-tighter">Unit Location</p>
        <p className="text-[9px] text-slate-400 text-center truncate">RT-04 Responder</p>
      </div>
    </div>
  );
}


