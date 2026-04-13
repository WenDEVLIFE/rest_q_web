"use client";

import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Clock,
  ShieldPlus,
  Siren,
  Info,
  ChevronRight,
  ShieldAlert,
  X,
  CloudRain,
  Wind,
  Phone,
  MapPin,
  Droplets,
  TriangleAlert,
  House,
  Waves,
  Stethoscope,
  Flame,
  HeartPulse,
  Hospital,
  Thermometer,
  Cloud,
  Car,
  Users
} from 'lucide-react';
import Image from 'next/image';

import { SidebarSearch } from './SidebarSearch';
import establishmentsData from '../../public/establishment.json';
import { Incident } from '../../src/types/incident';

interface RiskLevelPanelProps {
  onLocationSelect?: (lat: number, lng: number, label: string) => void;
  onReset?: () => void;
  selectedLocation?: { lat: number; lng: number; label?: string } | null;
  reportedIncidents?: Incident[];
  onToggleRadar?: (type: 'flood' | 'typhoon') => void;
  forceTab?: 'metrics' | 'advisory' | 'what-to-do' | 'facilities';
  forceOpen?: boolean;
}

type IncidentCategory = 'Fire Incident' | 'Health-Related Incident' | 'Flood Risk' | 'Typhoon Risk';
type RiskLevel = 'Low Risk' | 'Moderate Risk' | 'High Risk';

interface ActionStep {
  title: string;
  detail: string;
  imagePath?: string;
  icon: React.ReactNode;
}

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

export const RiskLevelPanel = ({ onLocationSelect, onReset, selectedLocation, reportedIncidents = [], onToggleRadar, forceTab, forceOpen }: RiskLevelPanelProps) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'advisory' | 'what-to-do' | 'facilities'>('metrics');
  const [manualIncidentType, setManualIncidentType] = useState<IncidentCategory>('Fire Incident');
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [weatherData, setWeatherData] = useState<any>(null);

  // Fetch Live Weather when a location is selected
  useEffect(() => {
    if (!selectedLocation) {
      setWeatherData(null);
      return;
    }
    const fetchWeather = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_OPEN_WEATHER_API_KEY;
        if (!apiKey) return;
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${selectedLocation.lat}&lon=${selectedLocation.lng}&appid=${apiKey}&units=metric`);
        if (!res.ok) throw new Error('Weather fetch failed');
        const data = await res.json();
        setWeatherData(data);
      } catch (err) {
        console.error("Failed to fetch location weather", err);
      }
    };
    fetchWeather();
  }, [selectedLocation]);

  // Sync with external control props
  useEffect(() => {
    if (forceTab) setActiveTab(forceTab);
  }, [forceTab]);

  useEffect(() => {
    if (forceOpen) setIsCollapsed(false);
  }, [forceOpen]);

  const nearestReportedIncident = useMemo(() => {
    if (!selectedLocation || reportedIncidents.length === 0) return null;

    const withDistance = reportedIncidents.map((incident) => ({
      incident,
      distanceKm: calculateDistance(
        selectedLocation.lat,
        selectedLocation.lng,
        incident.location.lat,
        incident.location.lng
      )
    }));

    const sorted = withDistance.sort((a, b) => a.distanceKm - b.distanceKm);
    return sorted[0] ?? null;
  }, [selectedLocation, reportedIncidents]);

  const nearbyReportRadiusKm = 3;
  const nearbyReportedIncident = nearestReportedIncident && nearestReportedIncident.distanceKm <= nearbyReportRadiusKm
    ? nearestReportedIncident
    : null;

  const reportDrivenIncidentType: IncidentCategory | null = nearbyReportedIncident
    ? nearbyReportedIncident.incident.type === 'fire'
      ? 'Fire Incident'
      : nearbyReportedIncident.incident.type === 'health'
        ? 'Health-Related Incident'
        : null
    : null;

  const incidentType = reportDrivenIncidentType || manualIncidentType;

  const hazardFactor =
    incidentType === 'Typhoon Risk' ? 5 :
      incidentType === 'Flood Risk' ? 4 :
        incidentType === 'Fire Incident' ? 3 : 2;

  const reportSeverityFactor =
    nearbyReportedIncident?.incident.severity === 'high' ? 4 :
      nearbyReportedIncident?.incident.severity === 'medium' ? 2 :
        nearbyReportedIncident?.incident.severity === 'low' ? 1 : 0;

  const incidentDistanceFactor = nearbyReportedIncident
    ? nearbyReportedIncident.distanceKm <= 1
      ? 3
      : nearbyReportedIncident.distanceKm <= 2
        ? 2
        : 1
    : 0;

  const nearestEmergencyDistanceKm = selectedLocation
    ? establishmentsData
      .filter((est) => est["Establishment Type"] === 'Emergency Service')
      .map((est) =>
        calculateDistance(
          selectedLocation.lat,
          selectedLocation.lng,
          est.Latitude,
          est.Longitude
        )
      )
      .sort((a, b) => a - b)[0] ?? 5
    : 5;

  // Lightweight response-time estimation so the UI can classify risk consistently.
  const responseTimeMin = Math.max(
    6,
    Math.min(
      30,
      Math.round(6 + nearestEmergencyDistanceKm * 2.8 + hazardFactor + reportSeverityFactor + incidentDistanceFactor)
    )
  );

  const riskLevel: RiskLevel =
    responseTimeMin <= 10 ? 'Low Risk' : responseTimeMin <= 16 ? 'Moderate Risk' : 'High Risk';

  const advisoryText =
    riskLevel === 'High Risk'
      ? 'Critical delay possible. Coordinate responders now and clear access roads immediately.'
      : riskLevel === 'Moderate Risk'
        ? 'Manageable response window. Keep access routes open and prepare first-response actions.'
        : 'Fast response expected. Keep calm and follow standard emergency procedures.';

  const contactLine = useMemo(() => {
    if (incidentType === 'Fire Incident') return { label: 'Call Bureau of Fire Protection (BFP)', value: '09XXXXXXXXX' };
    if (incidentType === 'Health-Related Incident') return { label: 'Call Emergency Medical Services (EMS)', value: '09XXXXXXXXX' };
    if (incidentType === 'Flood Risk') return { label: 'Call MDRRMO / Rescue Desk', value: '09XXXXXXXXX' };
    return { label: 'Call MDRRMO / Typhoon Hotline', value: '09XXXXXXXXX' };
  }, [incidentType]);

  const actionSteps = useMemo<ActionStep[]>(() => {
    if (incidentType === 'Fire Incident') {
      if (riskLevel === 'Low Risk') {
        return [
          {
            title: 'Call the authorities immediately',
            detail: 'Report the initial signs of fire early before it spreads.',
            imagePath: '/Fire Incident/Low Risk/call.png',
            icon: <Phone className="w-8 h-8" />
          },
          {
            title: 'Initiate immediate evacuation',
            detail: 'Move everyone to the nearest safe exit and stay low if smoke is present.',
            imagePath: '/Fire Incident/Low Risk/evacuation.png',
            icon: <MapPin className="w-8 h-8" />
          },
          {
            title: 'Use fire extinguisher if manageable',
            detail: 'Use PASS method only for small, contained fire and with a clear exit behind you.',
            imagePath: '/Fire Incident/Low Risk/fire estinguisher.png',
            icon: <Flame className="w-8 h-8" />
          },
          {
            title: 'Turn off electricity and gas sources',
            detail: 'If safe to do so, isolate power and gas lines to reduce spread and explosion risk.',
            imagePath: '/Fire Incident/Low Risk/turn off button.png',
            icon: <TriangleAlert className="w-8 h-8" />
          },
          {
            title: 'Guide responders to the exact location',
            detail: 'Send landmark details and keep access roads clear for emergency vehicles.',
            imagePath: '/Fire Incident/Low Risk/exact location map.png',
            icon: <MapPin className="w-8 h-8" />
          }
        ];
      }

      if (riskLevel === 'Moderate Risk') {
        return [
          {
            title: 'Call the authorities immediately',
            detail: 'Report the fire to ensure professional help is on the way.',
            imagePath: '/Fire Incident/Moderate Risk/call .png',
            icon: <Phone className="w-8 h-8" />
          },
          {
            title: 'Alert nearby residents immediately',
            detail: 'Notify neighbors and building occupants so they can evacuate before fire escalates.',
            imagePath: '/Fire Incident/Moderate Risk/alert nearby residents.png',
            icon: <Phone className="w-8 h-8" />
          },
          {
            title: 'Initiate evacuation',
            detail: 'Start moving people away from the structure and surrounding vulnerable areas.',
            imagePath: '/Fire Incident/Moderate Risk/evacuation.png',
            icon: <MapPin className="w-8 h-8" />
          },
          {
            title: 'Attempt initial fire control',
            detail: 'Use extinguisher or water source only if the fire is still controllable.',
            imagePath: '/Fire Incident/Moderate Risk/attempt initial fire control.png',
            icon: <Flame className="w-8 h-8" />
          },
          {
            title: 'Prepare water',
            detail: 'Set up available water sources to dampen adjacent susceptible structures.',
            imagePath: '/Fire Incident/Moderate Risk/prepare water.png',
            icon: <House className="w-8 h-8" />
          },
          {
            title: 'Clear roads for responders',
            detail: 'Ensure the responder route remains completely unobstructed.',
            imagePath: '/Fire Incident/Moderate Risk/keep roads clear.png',
            icon: <Siren className="w-8 h-8" />
          }
        ];
      }

      // High Risk
      return [
        {
          title: 'Call BFP immediately',
          detail: 'Contact the Bureau of Fire Protection immediately for a massive fire response.',
          imagePath: '/Fire Incident/High Risk/call bfp.png',
          icon: <Phone className="w-8 h-8" />
        },
        {
          title: 'Evacuate immediately',
          detail: 'Evacuate everyone from the area without delay. Do not pack belongings.',
          imagePath: '/Fire Incident/High Risk/evacuation.png',
          icon: <MapPin className="w-8 h-8" />
        },
        {
          title: 'Move to safe open area now',
          detail: 'Do not stay near structures or enclosed spaces that can collapse or trap smoke.',
          imagePath: '/Fire Incident/High Risk/move to safe open area.png',
          icon: <MapPin className="w-8 h-8" />
        },
        {
          title: 'Do not attempt to suppress large fire',
          detail: 'Prioritize life safety. Wait for trained responders with full protective equipment.',
          imagePath: '/Fire Incident/High Risk/do not attempt to suppress large fire.png',
          icon: <TriangleAlert className="w-8 h-8" />
        },
        {
          title: 'Keep roads clear for responders',
          detail: 'Leave the immediate area and make way for fire trucks and medical teams.',
          imagePath: '/Fire Incident/High Risk/keep raods clear .png',
          icon: <Siren className="w-8 h-8" />
        }
      ];
    }

    if (incidentType === 'Health-Related Incident') {
      if (riskLevel === 'Low Risk') {
        return [
          {
            title: 'Check responsiveness and breathing',
            detail: 'Assess patient status calmly and monitor changes while waiting for assistance.',
            imagePath: '/Health-Related Incident/Low Risk/Check responsiveness and breathing.png',
            icon: <HeartPulse className="w-8 h-8" />
          },
          {
            title: 'Provide basic first aid if needed',
            detail: 'Clean minor wounds and apply basic dressing while keeping patient comfortable.',
            imagePath: '/Health-Related Incident/Low Risk/Provide basic first aid (clean wounds, apply bandage if needed).png',
            icon: <Stethoscope className="w-8 h-8" />
          },
          {
            title: 'Keep patient calm and still',
            detail: 'Avoid unnecessary movement and observe for dizziness, pain, or breathing changes.',
            imagePath: '/Health-Related Incident/Low Risk/Keep patient calm, comfortable, and still.png',
            icon: <ShieldAlert className="w-8 h-8" />
          }
        ];
      }

      if (riskLevel === 'Moderate Risk') {
        return [
          {
            title: 'Perform first aid or CPR if needed',
            detail: 'Begin trained interventions immediately while coordinating responder arrival.',
            imagePath: '/Health-Related Incident/Moderate Risk/Perform first aid or CPR if needed.png',
            icon: <HeartPulse className="w-8 h-8" />
          },
          {
            title: 'Control bleeding with direct pressure',
            detail: 'Use clean cloth or bandage and maintain firm pressure until help arrives.',
            imagePath: '/Health-Related Incident/Moderate Risk/Control bleeding using direct pressure.png',
            icon: <TriangleAlert className="w-8 h-8" />
          },
          {
            title: 'Prepare transport if response is delayed',
            detail: 'Coordinate safe transfer only when medically and logistically necessary.',
            imagePath: '/Health-Related Incident/Moderate Risk/Prepare transport if response is delayed.png',
            icon: <MapPin className="w-8 h-8" />
          }
        ];
      }

      return [
        {
          title: 'Start life-saving actions immediately',
          detail: 'If not breathing, start CPR and maintain rescue protocol until turnover.',
          imagePath: '/Health-Related Incident/High Risk/Perform life-saving actions immediately (CPR, control bleeding, rescue breathing if needed). If not breathing, start CPR (30 compressions _ 2 breaths).png',
          icon: <HeartPulse className="w-8 h-8" />
        },
        {
          title: 'Check breathing and recovery position',
          detail: 'If unconscious but breathing, place patient in recovery position and monitor airway.',
          imagePath: '/Health-Related Incident/High Risk/If unconscious but breathing, place in recovery position.png',
          icon: <Stethoscope className="w-8 h-8" />
        },
        {
          title: 'Do not move patient unnecessarily',
          detail: 'Suspected spinal or head injury requires immobilization until professionals arrive.',
          imagePath: '/Health-Related Incident/High Risk/Do not move the patient unnecessarily, especially if head_neck injury is suspected.png',
          icon: <TriangleAlert className="w-8 h-8" />
        }
      ];
    }

    if (incidentType === 'Flood Risk') {
      if (riskLevel === 'Low Risk') {
        return [
          {
            title: 'Move valuables to higher areas',
            detail: 'Protect documents, medicine, and electronics from possible water entry.',
            icon: <Droplets className="w-8 h-8" />
          },
          {
            title: 'Monitor barangay advisories',
            detail: 'Track official weather and river-level updates every 15 to 30 minutes.',
            icon: <CloudRain className="w-8 h-8" />
          },
          {
            title: 'Prepare go bag and flashlight',
            detail: 'Include battery lights, water, medicine, IDs, and emergency contacts.',
            icon: <ShieldAlert className="w-8 h-8" />
          }
        ];
      }

      if (riskLevel === 'Moderate Risk') {
        return [
          {
            title: 'Evacuate children and elders early',
            detail: 'Move vulnerable people first before flood depth increases.',
            icon: <House className="w-8 h-8" />
          },
          {
            title: 'Avoid crossing flooded streets',
            detail: 'Strong currents and hidden hazards can cause drowning and vehicle failure.',
            icon: <Waves className="w-8 h-8" />
          },
          {
            title: 'Cut power from main breaker',
            detail: 'Prevent electrocution by isolating electricity in flood-prone sections.',
            icon: <TriangleAlert className="w-8 h-8" />
          }
        ];
      }

      return [
        {
          title: 'Proceed to designated evacuation center',
          detail: 'Leave immediately through safe route and avoid low-lying roads.',
          icon: <MapPin className="w-8 h-8" />
        },
        {
          title: 'Do not wade in moving floodwater',
          detail: 'Even shallow water can knock down adults and carry contaminants.',
          icon: <Waves className="w-8 h-8" />
        },
        {
          title: 'Coordinate location with rescue teams',
          detail: 'Share exact landmark and number of people needing evacuation.',
          icon: <Phone className="w-8 h-8" />
        }
      ];
    }

    if (riskLevel === 'Low Risk') {
      return [
        {
          title: 'Secure light outdoor materials',
          detail: 'Tie down loose objects and close windows to prevent flying debris damage.',
          icon: <Wind className="w-8 h-8" />
        },
        {
          title: 'Keep communication lines open',
          detail: 'Charge devices and keep emergency contacts readily available.',
          icon: <Phone className="w-8 h-8" />
        },
        {
          title: 'Monitor typhoon bulletin regularly',
          detail: 'Follow official updates for track changes and wind intensification.',
          icon: <CloudRain className="w-8 h-8" />
        }
      ];
    }

    if (riskLevel === 'Moderate Risk') {
      return [
        {
          title: 'Suspend unnecessary travel',
          detail: 'Road hazards and debris can escalate quickly during strong winds.',
          icon: <MapPin className="w-8 h-8" />
        },
        {
          title: 'Stay in interior safe area',
          detail: 'Keep away from glass windows and unsecured roof sections.',
          icon: <House className="w-8 h-8" />
        },
        {
          title: 'Prepare emergency shelter transfer',
          detail: 'Coordinate relocation if wind or rainfall crosses warning threshold.',
          icon: <Wind className="w-8 h-8" />
        }
      ];
    }

    return [
      {
        title: 'Evacuate immediately if advised',
        detail: 'Do not wait for final hour when roads may become impassable.',
        icon: <TriangleAlert className="w-8 h-8" />
      },
      {
        title: 'Stay away from coastal and flood zones',
        detail: 'Storm surge and flash flooding can rapidly endanger communities.',
        icon: <Waves className="w-8 h-8" />
      },
      {
        title: 'Report trapped persons with exact location',
        detail: 'Provide address landmark and headcount to speed up rescue dispatch.',
        icon: <Phone className="w-8 h-8" />
      }
    ];
  }, [incidentType, riskLevel]);

  const handleReset = () => {
    setActiveTab('metrics');
    if (onReset) onReset();
  };

  let nearbyFacilities: any[] = [];
  if (selectedLocation && activeTab === 'facilities') {
    nearbyFacilities = establishmentsData.map(est => {
      const dist = calculateDistance(
        selectedLocation.lat,
        selectedLocation.lng,
        est.Latitude,
        est.Longitude
      );
      return { ...est, distance: dist };
    })
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 5); // top 5 nearest
  }

  return (
    <div className={`relative w-full bg-white/95 backdrop-blur-3xl rounded-[40px] shadow-[0_32px_80px_-15px_rgba(0,0,0,0.25)] border border-white/40 flex flex-col h-[calc(100vh-160px)] transition-all duration-500 ease-in-out ${isCollapsed ? 'translate-x-[calc(100%-60px)] scale-[0.98] opacity-90' : 'translate-x-0'}`}>

      {/* Floating Toggle Tab (Google Maps Style) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={`absolute -left-12 top-1/2 -translate-y-1/2 w-12 h-24 bg-white border border-slate-200 rounded-l-3xl shadow-[-12px_0_30px_rgba(0,0,0,0.15)] flex flex-col items-center justify-center group z-50 hover:bg-slate-50 transition-all active:scale-95 ${isCollapsed ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}
        title={isCollapsed ? "Expand Place Sheet" : "Collapse Place Sheet"}
      >
        <div className="w-1 h-8 bg-slate-100 rounded-full mb-2 group-hover:bg-primary/20 transition-colors" />
        <ChevronRight className={`w-6 h-6 text-slate-400 group-hover:text-primary transition-transform duration-500 ${isCollapsed ? 'rotate-180' : 'rotate-0'}`} />
        <div className="w-1 h-8 bg-slate-100 rounded-full mt-2 group-hover:bg-primary/20 transition-colors" />
      </button>

      <div className="w-full h-full flex flex-col overflow-hidden rounded-[40px]">
        {/* Unified Header with Search */}
        <div className="p-8 pb-6 border-b border-slate-100/50 bg-white/50 backdrop-blur-md">
          <SidebarSearch 
            onLocationSelect={onLocationSelect} 
            onReset={handleReset} 
            initialValue={selectedLocation?.label} 
          />

          {selectedLocation && activeTab !== 'facilities' && (
            <div className="mt-8 flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.25em] mb-1.5">Selected Focus</p>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-tight max-w-[260px]">
                  {selectedLocation.label || "San Fernando City, Pampanga"}
                </h2>
              </div>
              <button
                onClick={() => {
                  handleReset();
                  onToggleRadar && onToggleRadar('none' as any);
                }}
                className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                title="Clear focus"
              >
                <X className="w-5 h-5 transition-transform group-hover:rotate-90" />
              </button>
            </div>
          )}
        </div>

        {/* Main Content (Emergency Metrics or Facilities) */}
        <div className="p-8 pt-8 overflow-y-auto flex-1 custom-scrollbar">
          {!selectedLocation ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
              <div className="w-16 h-16 bg-slate-100 rounded-3xl flex items-center justify-center">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <div>
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Search to view risk level</p>
                <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">Real-time telemetry pending</p>
              </div>
            </div>
          ) : activeTab === 'facilities' ? (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setActiveTab('metrics')} className="p-2 -ml-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-500 rotate-180" />
                </button>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Nearest Facilities
                </h3>
              </div>

              <div className="space-y-4">
                {nearbyFacilities.map((est, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${est["Establishment Type"] === 'Healthcare Facility' ? 'bg-rose-50 text-rose-500' :
                          est["Establishment Type"] === 'Emergency Service' ? 'bg-red-50 text-red-500' :
                            'bg-blue-50 text-blue-500'
                          }`}>
                          {est["Establishment Type"] === 'Healthcare Facility' ? <Hospital className="w-6 h-6" /> :
                            est["Establishment Type"] === 'Emergency Service' ? <Siren className="w-6 h-6" /> :
                              <ShieldPlus className="w-6 h-6" />
                          }
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900 leading-tight">{est.Name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{est["Establishment Type"]}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-emerald-600 tracking-tighter">{est.distance.toFixed(2)} km</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 italic">Active Path</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'advisory' ? (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="flex items-center gap-4 mb-4">
                <button 
                  onClick={() => setActiveTab('metrics')} 
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all active:scale-90"
                >
                  <ChevronRight className="w-5 h-5 text-slate-500 rotate-180" />
                </button>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
                  Advisory
                </h3>
              </div>

              <div className="space-y-8 px-2">
                {/* Traffic Advisory */}
                <div className="flex items-center justify-between group cursor-pointer">
                  <span className="text-xl font-bold text-slate-700 leading-tight flex-1 pr-4">
                    Traffic at Dolores Intersection
                  </span>
                  <div className="w-20 h-20 flex items-center justify-center text-primary transform transition-transform group-hover:scale-110">
                    <Car className="w-16 h-16 stroke-[1.5]" />
                  </div>
                </div>

                {/* Flood Depth Advisory */}
                <div className="flex items-center justify-between group cursor-pointer border-y border-slate-50 py-8">
                  <div className="w-20 h-20 flex items-center justify-center text-blue-500 transform transition-transform group-hover:scale-110">
                    <Waves className="w-16 h-16 stroke-[1.5]" />
                  </div>
                  <span className="text-xl font-bold text-slate-700 leading-tight flex-1 pl-4 text-right">
                    Flood depth in (indicate the area)
                  </span>
                </div>

                {/* Pedestrian Advisory */}
                <div className="flex items-center justify-between group cursor-pointer">
                  <span className="text-xl font-bold text-slate-700 leading-tight flex-1 pr-4">
                    High Pedestrian Volume
                  </span>
                  <div className="w-20 h-20 flex items-center justify-center text-indigo-500 transform transition-transform group-hover:scale-110">
                    <Users className="w-16 h-16 stroke-[1.5]" />
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'what-to-do' ? (
            <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
              <div className="flex items-center gap-4 mb-4">
                <button onClick={() => setActiveTab('metrics')} className="p-2 -ml-2 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                  <ChevronRight className="w-5 h-5 text-slate-500 rotate-180" />
                </button>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  What To Do
                </h3>
              </div>

              <div className="rounded-3xl border border-transparent p-6 space-y-6 bg-slate-50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 mt-1">{riskLevel} Actions</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">{contactLine.label} <span className="text-emerald-600">{contactLine.value}</span></p>
                  </div>
                  <Image src="/Risk Level LOGO.png" alt="Risk Level" width={64} height={64} className="object-contain" />
                </div>

                <div className="flex flex-wrap gap-2 bg-white p-1 rounded-xl border border-slate-100">
                  <button
                    onClick={() => setManualIncidentType('Fire Incident')}
                    className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${incidentType === 'Fire Incident' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                  >
                    Fire
                  </button>
                  <button
                    onClick={() => setManualIncidentType('Health-Related Incident')}
                    className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${incidentType === 'Health-Related Incident' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                  >
                    Health
                  </button>
                  <button
                    onClick={() => setManualIncidentType('Flood Risk')}
                    className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${incidentType === 'Flood Risk' ? 'bg-cyan-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                  >
                    Flood
                  </button>
                  <button
                    onClick={() => setManualIncidentType('Typhoon Risk')}
                    className={`px-3 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${incidentType === 'Typhoon Risk' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                  >
                    Typhoon
                  </button>
                </div>

                {reportDrivenIncidentType && (
                  <p className="text-[11px] font-bold text-red-600">
                    Incident type is auto-selected from nearby report at this address.
                  </p>
                )}

                <div className="space-y-4">
                  {actionSteps.map((step, idx) => (
                    <div key={`${incidentType}-${riskLevel}-${idx}`} className={`bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex items-center gap-4 ${idx % 2 === 1 ? 'flex-row-reverse' : ''}`}>
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        {step.imagePath ? (
                          <Image
                            src={step.imagePath}
                            alt={step.title}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          step.icon
                        )}
                      </div>

                      <div className={`flex-1 ${idx % 2 === 1 ? 'text-right' : 'text-left'}`}>
                        <p className="text-sm font-black text-slate-800 leading-tight">{step.title}</p>
                        <p className="text-[11px] font-semibold text-slate-500 mt-1 leading-relaxed">{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-left-8 duration-300">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8">
                Emergency Risk Level
              </h3>

              <div className="space-y-5">
                <RiskCard
                  icon={<Clock className="w-8 h-8" />}
                  title="Generated Response Time"
                  subtext={`${responseTimeMin} minutes`}
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                  iconColor="text-blue-600"
                  accentColor="border-blue-500"
                  onClick={() => setActiveTab('advisory')}
                />
                <RiskCard
                  icon={<ShieldPlus className="w-8 h-8" />}
                  title="Risk Level"
                  subtext={`${riskLevel} - ${incidentType}`}
                  color="text-amber-600"
                  bgColor="bg-blue-50"
                  iconColor="text-blue-600"
                  accentColor="border-amber-500"
                  onClick={() => setActiveTab('what-to-do')}
                />
                <RiskCard
                  icon={<Siren className="w-8 h-8" />}
                  title="Nearest Facilities"
                  subtext="Ready for Dispatch"
                  color="text-slate-900"
                  bgColor="bg-white"
                  iconColor="text-red-500"
                  accentColor="border-red-500"
                  borderedIcon
                  onClick={() => setActiveTab('facilities')}
                />
                <RiskCard
                  icon={<Waves className="w-8 h-8" />}
                  title="Flood Risk Radar"
                  subtext="Live NOAH Telemetry"
                  color="text-blue-600"
                  bgColor="bg-blue-50"
                  iconColor="text-blue-500"
                  accentColor="border-blue-500"
                  onClick={() => {
                    onToggleRadar && onToggleRadar('flood');
                    setActiveTab('advisory');
                  }}
                />
                <RiskCard
                  icon={<Wind className="w-8 h-8" />}
                  title="Typhoon Risk Radar"
                  subtext="Live NOAH Telemetry"
                  color="text-red-600"
                  bgColor="bg-red-50"
                  iconColor="text-red-500"
                  accentColor="border-red-500"
                  onClick={() => {
                    onToggleRadar && onToggleRadar('typhoon');
                    setActiveTab('advisory');
                  }}
                />

                {/* --- REAL-TIME WEATHER FORECAST WIDGET --- */}
                {weatherData && (
                  <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-[28px] p-6 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Cloud className="w-24 h-24 text-white" />
                    </div>
                    <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
                      <div>
                        <p className="text-[10px] font-black tracking-[0.2em] uppercase text-slate-400 mb-1 flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-emerald-400" /> Live Environment
                        </p>
                        <h4 className="text-xl font-bold text-white capitalize">{weatherData.weather[0]?.description}</h4>
                      </div>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div className="flex flex-col bg-white/5 rounded-xl p-3 border border-white/5">
                          <div className="flex items-center gap-1.5 mb-1 text-slate-300">
                            <Thermometer className="w-3.5 h-3.5" />
                            <span className="text-[9px] uppercase tracking-wider font-bold">Temp</span>
                          </div>
                          <span className="text-lg font-black text-white">{Math.round(weatherData.main.temp)}°C</span>
                        </div>
                        <div className="flex flex-col bg-white/5 rounded-xl p-3 border border-white/5">
                          <div className="flex items-center gap-1.5 mb-1 text-slate-300">
                            <Wind className="w-3.5 h-3.5" />
                            <span className="text-[9px] uppercase tracking-wider font-bold">Wind</span>
                          </div>
                          <span className="text-lg font-black text-white">{weatherData.wind.speed} m/s</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface RiskCardProps {
  icon: React.ReactNode;
  title: string;
  subtext: string;
  color: string;
  bgColor: string;
  iconColor: string;
  accentColor: string;
  borderedIcon?: boolean;
  onClick?: () => void;
}

const RiskCard = ({ icon, title, subtext, color, bgColor, iconColor, accentColor, borderedIcon, onClick }: RiskCardProps) => (
  <div onClick={onClick} className="group relative bg-white border border-slate-100 rounded-[28px] p-6 flex items-center justify-between shadow-sm hover:shadow-xl transition-all cursor-pointer overflow-hidden border-r-8 border-r-transparent hover:border-r-amber-400">
    <div className="flex items-center gap-6">
      <div className={`w-16 h-16 ${bgColor} ${iconColor} rounded-[20px] flex items-center justify-center shadow-sm border ${borderedIcon ? 'border-red-100' : 'border-blue-100'}`}>
        {icon}
      </div>
      <div>
        <h4 className="text-xl font-black text-slate-900 leading-tight tracking-tight">{title}</h4>
        <p className={`text-base font-black mt-1 ${color}`}>{subtext}</p>
      </div>
    </div>
    <div className="flex items-center gap-4">
      <Info className="w-6 h-6 text-slate-200 group-hover:text-slate-400 transition-colors" />
      <div className={`w-2 h-20 rounded-full ${accentColor} absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity`} />
    </div>
  </div>
);
