export interface Coordinates { latitude: number; longitude: number }
export interface Showroom extends Coordinates {
  id: string;
  order: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  map: string;
  placeId: string;
}

// Coordinates verified against the Google Maps place IDs supplied for each branch.
export const SHOWROOMS: Showroom[] = [
  {
    id: 'tiruvallur', order: '1st Showroom', name: 'Tiruvallur Showroom', city: 'Tiruvallur',
    address: '712, TNHB, Kakkalur Bye Pass Road,\nNear Old Collector Office,\nTiruvallur - 602001',
    phone: '9600972227', latitude: 13.1371766, longitude: 79.9166188,
    placeId: 'ChIJ2e2yiR-QUjoRAhdVW1Ae1jE',
    map: 'https://www.google.com/maps?q=Jai+Guru+Jewellers,+712,+kakkalur+bye+pass+Road,+near+Old+collector+office,+Tamil+Nadu+602001&ftid=0x3a52901f89b2edd9:0x31d61e505b551702&entry=gps',
  },
  {
    id: 'tiruttani', order: '2nd Showroom', name: 'Tiruttani Showroom', city: 'Tiruttani',
    address: '321/322, Ma. Po. Si. Salai,\nOpp. to Tiruttani Railway Station,\nTiruttani, Tamil Nadu - 631209',
    phone: '9169161469', latitude: 13.1776562, longitude: 79.6128679,
    placeId: 'ChIJDRjoI42lUjoR87CAQ9ArGkI',
    map: 'https://www.google.com/maps?q=Jai+Guru+Jewellers,+Railway+Station,+321/322+Ma.+Po.+Si+Salai,+Tiruttani,+opp.+to+Tiruttani,+Thiruttani,+Tamil+Nadu+631209&ftid=0x3a52a58d23e8180d:0x421a2bd04380b0f3&entry=gps',
  },
  {
    id: 'jn-road', order: '3rd Showroom', name: 'JN Road Showroom', city: 'Tiruvallur',
    address: '10, JN Road, Near Satya Electronics,\nHariram Nagar, V.M Nagar,\nTiruvallur, Tamil Nadu - 602001',
    phone: '8220771862', latitude: 13.1332878, longitude: 79.9091119,
    placeId: 'ChIJgYOCaGiRUjoR_pSoIIiNXBM',
    map: 'https://www.google.com/maps?q=Jai+guru+Jewellers+-+JN+Road+Showroom,+10,+JN+Rd,+near+Satya+Electronics,+Hariram+Nagar,+V.M+Nagar,+Tiruvallur,+Tiruvaloor,+Tamil+Nadu+602001&ftid=0x3a52916868828381:0x135c8d8820a894fe&entry=gps',
  },
];

export function distanceKm(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(to.latitude - from.latitude);
  const dLng = radians(to.longitude - from.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function rankShowrooms(location: Coordinates) {
  return SHOWROOMS.map((branch) => ({ ...branch, distance: distanceKm(location, branch) }))
    .sort((a, b) => a.distance - b.distance);
}

export function directionsUrl(branch: Showroom, location: Coordinates | null): string {
  const params = [
    'api=1', 'travelmode=driving',
    `destination=${encodeURIComponent(`${branch.latitude},${branch.longitude}`)}`,
    `destination_place_id=${encodeURIComponent(branch.placeId)}`,
  ];
  if (location) params.push(`origin=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`);
  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}
