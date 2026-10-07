import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import WebView from 'react-native-webview';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { AppText } from '../../Components/ui/appcomponents';
import { COLORS, SIZES } from '../../Utills/AppTheme';
import type { Coordinates, Showroom } from './showroomData';

interface Props {
  branches: Showroom[];
  location: Coordinates | null;
  nearestId?: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onLocate: () => void;
}

export function createMapHtml(branches: Showroom[], location: Coordinates | null, nearestId?: string) {
  const data = JSON.stringify({ branches, location, nearestId }).replace(/</g, '\\u003c');
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
    <style>html,body,#map{height:100%;width:100%;margin:0}body{font-family:Arial,sans-serif}
    .branch-pin{width:28px;height:28px;background:${COLORS.brand};border:2px solid white;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 5px #0005;display:flex;align-items:center;justify-content:center}
    .branch-pin span{transform:rotate(45deg);color:white;font-weight:bold}.nearest{background:${COLORS.accentDeep}}.nearest span{color:${COLORS.contentPrimary}}
    .leaflet-popup-content{line-height:1.5;font-size:13px}.leaflet-control-attribution{font-size:9px}</style></head>
    <body><div id="map"></div><script>
    function send(data){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(data));}
    </script><script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" onerror="send({type:'error'})"></script><script>
    try{
      const data=${data};
      const map=L.map('map',{zoomControl:true}).setView([13.15,79.77],10);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{
        maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map).on('tileerror',()=>send({type:'tiles-error'}));
      const markers={},bounds=[];
      data.branches.forEach((branch,index)=>{
        const point=[branch.latitude,branch.longitude];bounds.push(point);
        const nearest=branch.id===data.nearestId;
        const icon=L.divIcon({className:'',html:'<div class="branch-pin '+(nearest?'nearest':'')+'"><span>'+(index+1)+'</span></div>',iconSize:[32,40],iconAnchor:[16,38]});
        const popup=document.createElement('div');
        const title=document.createElement('strong');title.textContent=branch.name;popup.appendChild(title);
        const city=document.createElement('div');city.textContent=branch.city+(nearest?' · Nearest showroom':'');popup.appendChild(city);
        const marker=L.marker(point,{icon}).addTo(map).bindPopup(popup);
        marker.on('click',()=>send({type:'select',id:branch.id}));markers[branch.id]=marker;
      });
      if(data.location){const point=[data.location.latitude,data.location.longitude];bounds.push(point);L.circleMarker(point,{radius:8,color:'#fff',weight:3,fillColor:'#2274D4',fillOpacity:1}).addTo(map).bindPopup('Your current location');}
      if(bounds.length)map.fitBounds(bounds,{padding:[35,35],maxZoom:15});
      window.selectBranch=function(id){const marker=markers[id];if(marker){map.panTo(marker.getLatLng());marker.openPopup();}};
      setTimeout(()=>{map.invalidateSize();send({type:'ready'});},150);
    }catch(error){send({type:'error'});}
    </script></body></html>`;
}

export default function ShowroomMap({ branches, location, nearestId, selectedId, onSelect, onLocate }: Props) {
  const ref = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [reload, setReload] = useState(0);
  const html = useMemo(() => createMapHtml(branches, location, nearestId), [branches, location, nearestId]);
  const source = useMemo(() => ({ html, baseUrl: 'https://www.openstreetmap.org' }), [html]);

  useEffect(() => {
    setReady(false); setFailed(false); setTileError(false);
    timeoutRef.current = setTimeout(() => setFailed(true), 20000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [html, reload]);

  // Cancel the loading timeout once the Leaflet map is initialized.
  useEffect(() => {
    if (!ready || !selectedId) return;
    ref.current?.injectJavaScript(`window.selectBranch && window.selectBranch(${JSON.stringify(selectedId)});true;`);
  }, [ready, selectedId]);

  return (
    <View>
      <View style={styles.frame}>
        <WebView key={reload} ref={ref} source={source} style={styles.map} javaScriptEnabled scrollEnabled={false}
          onError={() => setFailed(true)}
          onShouldStartLoadWithRequest={(request) => request.url === 'about:blank' || request.url.startsWith('https://www.openstreetmap.org')}
          onMessage={({ nativeEvent }) => {
            try {
              const message = JSON.parse(nativeEvent.data);
              if (message.type === 'ready') {
                if (timeoutRef.current) clearTimeout(timeoutRef.current);
                setReady(true); setFailed(false);
              }
              if (message.type === 'error') setFailed(true);
              if (message.type === 'tiles-error') setTileError(true);
              if (message.type === 'select' && branches.some((branch) => branch.id === message.id)) onSelect(message.id);
            } catch { /* Ignore messages outside the map bridge. */ }
          }}
        />
        {!ready && !failed && <View pointerEvents="none" style={styles.overlay}><ActivityIndicator color={COLORS.brand} /><AppText variant="caption">Loading branch map...</AppText></View>}
        {failed && <View style={styles.overlay}>
          <AppText variant="bodySmall" align="center">Map unavailable. You can still view branches and open directions below.</AppText>
          <Pressable accessibilityRole="button" onPress={() => setReload((value) => value + 1)} style={styles.retry}><AppText variant="bodyBold" color={COLORS.brand}>Retry map</AppText></Pressable>
        </View>}
        {ready && !failed && <Pressable accessibilityRole="button" accessibilityLabel="Find my current location" onPress={onLocate} style={styles.locate}><MaterialCommunityIcons name="crosshairs-gps" size={24} color={COLORS.brand} /></Pressable>}
      </View>
      {tileError && <AppText variant="caption" color={COLORS.contentMuted}>Some map tiles could not load. Check your internet connection.</AppText>}
      <View style={styles.legend}><View style={[styles.dot, { backgroundColor: COLORS.brand }]} /><AppText variant="caption">Showrooms</AppText><View style={[styles.dot, { backgroundColor: COLORS.accentDeep }]} /><AppText variant="caption">Nearest</AppText><View style={[styles.dot, { backgroundColor: '#2274D4' }]} /><AppText variant="caption">You</AppText></View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { height: 360, overflow: 'hidden', borderRadius: SIZES.radius.lg, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surfaceMuted },
  map: { flex: 1, backgroundColor: COLORS.surfaceMuted },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: COLORS.surfaceMuted, alignItems: 'center', justifyContent: 'center', padding: SIZES.space.lg, gap: SIZES.space.sm },
  locate: { position: 'absolute', top: 12, right: 12, width: 44, height: 44, borderRadius: SIZES.radius.sm, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },
  retry: { padding: SIZES.space.md },
  legend: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginVertical: SIZES.space.md },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: SIZES.space.xs },
});
