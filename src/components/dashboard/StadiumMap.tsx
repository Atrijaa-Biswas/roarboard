import { useState, useEffect, useMemo } from 'react';
import { useVenueStore } from '../../store/useVenueStore';
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet's default icon paths statically
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Custom Node Icons
const createUserIcon = () => L.divIcon({
  className: 'bg-transparent',
  html: `<div class="relative flex h-5 w-5 -ml-2.5 -mt-2.5">
          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span class="relative inline-flex rounded-full h-5 w-5 bg-blue-600 border-2 border-white shadow-lg shadow-blue-500/50"></span>
         </div>`,
  iconSize: [20, 20]
});

const createGateIcon = (name: string, isFastest: boolean) => L.divIcon({
  className: 'bg-transparent',
  html: `<div class="flex flex-col items-center -ml-6 -mt-8 pointer-events-none">
            <div class="${isFastest ? 'bg-accentSuccess text-pureBlack' : 'bg-surface border-borderSecondary text-textPrimary'} border-2 font-bold text-xs rounded-lg px-2 py-1 shadow-xl whitespace-nowrap transition-colors duration-500">
               ${name}
            </div>
            <div class="w-1.5 h-1.5 rounded-full ${isFastest ? 'bg-accentSuccess' : 'bg-borderSecondary'} mt-1 shadow-md"></div>
         </div>`,
  iconSize: [48, 32]
});

// Mock Venue Geographic Boundaries (e.g., Eden Gardens)
const VENUE_CENTER: L.LatLngTuple = [22.5646, 88.3433];
// Bounds to normalize user GPS if they aren't physically at the stadium
const BOUNDS = {
  minLat: 22.5630, maxLat: 22.5660,
  minLng: 88.3415, maxLng: 88.3450
};

// Map logical section keys to realistic Geo coordinates
const GEO_MAPPING: Record<string, L.LatLngTuple> = {
  n1: [22.5655, 88.3433],
  s1: [22.5637, 88.3433],
  e1: [22.5646, 88.3444],
  w1: [22.5646, 88.3422],
  gA: [22.5646, 88.3417],
  gB: [22.5658, 88.3441],
  gC: [22.5634, 88.3433],
  gD: [22.5634, 88.3441],
  gE: [22.5658, 88.3425],
  gF: [22.5646, 88.3449],
};

function MapController({ center, followMode }: { center: L.LatLngTuple, followMode: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (followMode) {
      map.flyTo(center, 18, { animate: true, duration: 1.5 });
    }
  }, [center, followMode, map]);
  return null;
}

export default function StadiumMap() {
  const sections      = useVenueStore((state) => state.sections);
  const gatesDict     = useVenueStore((state) => state.gates);
  const activePath    = useVenueStore((state) => state.activePath);
  const setActivePath = useVenueStore((state) => state.setActivePath);
  const followMode    = useVenueStore((state) => state.isFollowMode);
  const setFollowMode = useVenueStore((state) => state.setFollowMode);

  const [userLoc, setUserLoc] = useState<L.LatLngTuple>(VENUE_CENTER);

  // Statically find fastest gate (memoized, no re-sort on every tick)
  const fastestGateStr = useMemo(() => {
    const gates = Object.values(gatesDict).sort((a, b) => a.waitMinutes - b.waitMinutes);
    return gates[0]?.name || '';
  }, [gatesDict]);

  useEffect(() => {
     if (navigator.geolocation) {
       const watchId = navigator.geolocation.watchPosition((pos) => {
         const lat = pos.coords.latitude;
         const lng = pos.coords.longitude;
         
         // Normalize logic: If user is far away, project them into the stadium bounds dynamically
         // This guarantees the UI functions correctly regardless of physical location
         let normLat = lat;
         let normLng = lng;
         if (lat < BOUNDS.minLat || lat > BOUNDS.maxLat) {
            normLat = BOUNDS.minLat + (Math.random() * (BOUNDS.maxLat - BOUNDS.minLat));
         }
         if (lng < BOUNDS.minLng || lng > BOUNDS.maxLng) {
            normLng = BOUNDS.minLng + (Math.random() * (BOUNDS.maxLng - BOUNDS.minLng));
         }

         setUserLoc([normLat, normLng]);
       }, (err) => {
          console.warn("Geolocation denied, utilizing static bounds", err);
          setUserLoc([VENUE_CENTER[0] - 0.0005, VENUE_CENTER[1] - 0.0005]);
       }, { enableHighAccuracy: true });

       return () => navigator.geolocation.clearWatch(watchId);
     }
  }, []);

  const getHeatColor = (density: number) => {
     if (density > 75) return '#EF4444'; // Red
     if (density > 50) return '#EAB308'; // Yellow
     return '#22C55E'; // Green
  };

  return (
    <div id="heatmap-target" className="bg-surface border border-borderSecondary rounded-xl p-4 flex flex-col h-full min-h-[300px] scroll-mt-20 relative">
      <div className="flex justify-between items-center mb-4 z-[400] relative">
         <h2 className="text-xs uppercase tracking-[0.06em] text-textSecondary font-semibold">
           Live Stadium Map
         </h2>
         <button 
           onClick={() => setFollowMode(!followMode)}
           className={`text-[10px] uppercase font-bold px-3 py-1.5 rounded-lg transition-all ${
             followMode
               ? 'bg-accentBlue text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
               : 'bg-borderPrimary text-textSecondary hover:text-white'
           }`}
         >
           {followMode ? '⦿ Follow ON' : '○ Follow OFF'}
         </button>
      </div>
      
      <div className="flex-1 w-full bg-borderPrimary rounded-lg relative overflow-hidden z-0">
        <MapContainer 
          center={VENUE_CENTER} 
          zoom={17} 
          scrollWheelZoom={true} 
          className="w-full h-full z-0 leaflet-dark-container"
          zoomControl={false}
        >
           {/* Dynamic Tile Layer (Dark Matter or standard OSM with CSS inversion fallback) */}
           <TileLayer
             attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
             url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
           />

           <MapController center={userLoc} followMode={followMode} />

           {/* User Location Marker */}
           <Marker position={userLoc} icon={createUserIcon()} zIndexOffset={1000} />

           {/* AI / UI Dynamic Polyline Route */}
           {activePath && activePath.length > 0 && (
             <Polyline 
               positions={[userLoc, GEO_MAPPING[activePath[activePath.length - 1]] || VENUE_CENTER]} 
               color="#3B82F6" 
               weight={5} 
               dashArray="10, 10" 
               className="animate-pulse"
             />
           )}

           {/* Draw Gate Markers statically */}
           {['gA', 'gB', 'gC', 'gD', 'gE', 'gF'].map(gateKey => {
               const g = gatesDict[gateKey];
               if(!g) return null;
               const isOptimal = g.name === fastestGateStr;
               return (
                   <Marker 
                     key={gateKey} 
                     position={GEO_MAPPING[gateKey]} 
                     icon={createGateIcon(g.name, isOptimal)} 
                     zIndexOffset={isOptimal ? 500 : 100}
                   />
               );
           })}

           {/* Draw Heat Zones (Circles) over Section Coordinates */}
           {Object.keys(sections).map(secKey => {
              const sec = sections[secKey];
              const coords = GEO_MAPPING[secKey];
              if(!sec || !coords) return null;
              
              const color = getHeatColor(sec.density);

              return (
                 <Circle 
                   key={secKey}
                   center={coords} 
                   radius={30 + (sec.density / 3)} // Radius pulses organically with density
                   pathOptions={{ 
                     color: color, 
                     fillColor: color, 
                     fillOpacity: 0.25,
                     weight: 0 
                   }}
                   className="transition-all duration-1000 ease-in-out"
                 />
              );
           })}

          {/* Live Navigation UI Toast (Wow Factor) */}
          {activePath && activePath.length > 0 && (
             <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-pureBlack/90 backdrop-blur-md border border-accentBlue text-white px-4 py-2 rounded-full shadow-[0_0_20px_-3px_rgba(59,130,246,0.5)] font-bold text-xs flex items-center gap-2 animate-in slide-in-from-top-4 duration-500 pointer-events-auto">
                <span className="w-2 h-2 rounded-full bg-accentBlue animate-pulse"></span>
                Navigating to {gatesDict[activePath[activePath.length - 1]]?.name || 'Destination'} (Optimal Route)
                
                <button 
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setActivePath([]); }} 
                  className="ml-4 bg-white/10 hover:bg-white/20 transition-colors px-2 py-1 rounded-full text-[9px] uppercase tracking-wider border border-white/20 pointer-events-auto"
                >
                   Exit
                </button>
             </div>
          )}

        </MapContainer>
      </div>
      
      {/* Absolute Leaflet CSS filter injection to force dark mode if tiles fail */}
      <style>{`
        .leaflet-container { background: #0d1117; font-family: 'Inter', sans-serif;}
        .leaflet-control-attribution { background: rgba(0,0,0,0.5) !important; color: #8b949e !important;}
      `}</style>
    </div>
  );
}
