export const CONFIG = {
  STAGE_ARC: 110 * (Math.PI / 180),
  CAT_ARC: 80 * (Math.PI / 180),
  ROW_Z_GAP: 2.6,
  FIRST_ROW_RADIUS: 9.0,
  HEIGHT_STEP: 0.7,
  PEBBLE_COUNT: 30,
  PILLAR_THICKNESS: 2.8,
};

export const formatTime = (t) => isNaN(t) ? "00:00" : `${Math.floor(t / 60).toString().padStart(2, '0')}:${Math.floor(t % 60).toString().padStart(2, '0')}`;

export const getTrackInfo = (track) => {
  if (track.isPercussion) return { color: '#f75b4f', order: 3 };
  const family = (track.instrument?.family || '').toLowerCase();
  if (['piano', 'string', 'guitar', 'ensemble'].some(k => family.includes(k))) return { color: '#4facf7', order: 1 };
  if (['brass', 'reed', 'pipe', 'wind'].some(k => family.includes(k))) return { color: '#f7d04f', order: 2 };
  if (family.includes('bass')) return { color: '#b64ff7', order: 3 };
  return { color: '#ffffff', order: 4 };
};


export const computeLayout = (tracks) => {
  if (!tracks || tracks.length === 0) return { rows: [], settings: [] };
  const rows = []; let rem = tracks.length, cap = 3; while (rem > 0) { const c = Math.min(rem, cap); rows.push(c); rem -= c; cap += 2; }
  const settings = []; let trackIdx = 0;
  rows.forEach((count, r) => {
    const gap = count > 1 ? CONFIG.CAT_ARC / (count - 1) : 0;
    const rad = CONFIG.FIRST_ROW_RADIUS + r * CONFIG.ROW_Z_GAP;
    const y = (r + 1) * CONFIG.HEIGHT_STEP;
    for (let i = 0; i < count; i++) {
      const th = (i - (count - 1) / 2) * gap + Math.PI / 2;
      settings.push({ position: [Math.cos(th) * rad, y, Math.sin(th) * rad], rotation: [0, -th - Math.PI / 2, 0], color: tracks[trackIdx]?.info?.color || '#ffffff', notes: tracks[trackIdx]?.notes || [] });
      trackIdx++;
    }
  });
  return { rows, settings };
};
