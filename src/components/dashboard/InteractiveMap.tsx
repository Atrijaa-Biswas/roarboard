import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const center = {
  lat: 22.5646,
  lng: 88.3433 // Eden Gardens placeholder
};

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#0a0a0a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#161b22" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#e6edf3" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#D85A30" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1D9E75" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#161b22" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a1a1a" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8b949e" }] }
];

export default function InteractiveMap() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  if (!isLoaded) return <div className="w-full h-full bg-surface animate-pulse rounded-lg flex items-center justify-center text-textSecondary text-sm uppercase tracking-wider font-bold">Loading Live Map...</div>;

  return (
    <div className="w-full h-full min-h-[400px] rounded-lg overflow-hidden border border-borderSecondary">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={17}
        options={{
          styles: mapStyles,
          disableDefaultUI: true,
        }}
      >
        <Marker position={center} title="Stadium Center" icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/orange-dot.png' }} />
      </GoogleMap>
    </div>
  );
}
