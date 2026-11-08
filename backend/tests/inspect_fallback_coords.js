const fs = require('fs');
const content = fs.readFileSync('frontend/src/components/views/ClimateMapView.tsx', 'utf8');

// Extract FALLBACK_PUNE_GEOJSON
const start = content.indexOf('export const FALLBACK_PUNE_GEOJSON: WardGeoJSONCollection = {');
const end = content.indexOf('export const PUNE_DISTRICT_BOUNDS');
const geojsonStr = content.slice(start, end);

// Let's parse features from this text
const matchFeatures = content.match(/features:\s*\[([\s\S]*?)\n\s*\]\s*,\s*\n\s*\}\s*;/);
console.log('Found features block:', !!matchFeatures);

// Let's evaluate or parse the coordinates
const coordMatches = [...content.matchAll(/code:\s*'(WRD-0\d)'[\s\S]*?coordinates:\s*\[\s*\[([\s\S]*?)\]\s*\]/g)];
console.log('Found wards with coordinates:', coordMatches.length);
for (const m of coordMatches) {
  const code = m[1];
  const rawCoords = m[2];
  const pts = rawCoords.trim().split(/\],\s*\[/).map(s => s.replace(/[\[\]\s]/g, '').split(',').map(Number));
  console.log(`Ward ${code}: ${pts.length} points`);
  console.log('  First point:', pts[0]);
  console.log('  Last point:', pts[pts.length - 1]);
  console.log('  Closed ring:', pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]);
  const lons = pts.map(p => p[0]);
  const lats = pts.map(p => p[1]);
  console.log(`  BBox: Lon [${Math.min(...lons)}, ${Math.max(...lons)}], Lat [${Math.min(...lats)}, ${Math.max(...lats)}]`);
}
