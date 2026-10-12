// Home social cards. Add verified audience counts to subtitle when available.
export const REVIEW_LOCATIONS = [
  { name: 'JN Road', url: 'https://search.google.com/local/writereview?placeid=ChIJgYOCaGiRUjoR_pSoIIiNXBM' },
  { name: 'Tirutani', url: 'https://search.google.com/local/writereview?placeid=ChIJDRjoI42lUjoR87CAQ9ArGkI' },
  { name: 'Kakkalur Bypass', url: 'https://search.google.com/local/writereview?placeid=ChIJ2e2yiR-QUjoRAhdVW1Ae1jE' },
];

export const SOCIAL_CHANNELS = [
  { label: 'WhatsApp', icon: 'whatsapp', color: '#20B65A', field: 'WHATSAPPLINK', subtitle: 'Our jewellery community', action: 'Get daily offers on Jewellery', url: '' },
  { label: 'Instagram', icon: 'instagram', color: '#C13584', field: 'INSTALINK', subtitle: 'Collections & inspiration', action: 'Get market updates & deals', url: 'https://www.instagram.com/jaigurujewellers_?srtk=MXkxcDkxbnFhc3JhYg%3D%3D&utm_source=qr' },
  { label: 'YouTube', icon: 'youtube', color: '#F12828', field: 'YOUTUBELINK', subtitle: 'Stories & collections', action: 'Get your queries answered', url: 'https://www.youtube.com/@jaigurujewellers' },
  { label: 'Facebook', icon: 'facebook', color: '#1877F2', field: 'FACEBOOKLINK', subtitle: 'News & celebrations', action: 'Stay close to our community', url: 'https://www.facebook.com/share/1FCUh1vaAV/?mibextid=wwXIfr' },
  { label: 'Google Review', icon: 'google', color: '#B7791F', field: 'GOOGLEBUSINESSLINK', subtitle: 'Your experience matters', action: 'Review your nearest showroom', url: '' },
] as const;
