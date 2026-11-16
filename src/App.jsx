import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { computeLayout, getTrackInfo } from './music';
import { ControlPanel } from './components/ControlPanel';
import './app.css';

const OrchestraScene = lazy(() => import('./OrchestraScene'));

class SceneBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed
      ? <p role="status">3D 무대를 열지 못했습니다. 아래에서 음악을 재생할 수 있습니다.</p>
      : this.props.children;
  }
}

const MIDI_MODULES = import.meta.glob('/src/assets/midi/*.mid', { eager: true, query: '?url', import: 'default' });
const SONG_LIST = Object.keys(MIDI_MODULES).map((path) => ({ name: decodeURIComponent(path.split('/').pop().replace('.mid', '')), url: MIDI_MODULES[path] }));

export default function App() {
  const [playback, setPlayback] = useState({ isPlaying: false, current: 0, duration: 0 });
  const [parsedTracks, setParsedTracks] = useState([]);
  const [selectedUrl, setSelectedUrl] = useState(SONG_LIST[0]?.url || '');
  const [showUI, setShowUI] = useState(true);

  const [loading, setLoading] = useState(false);
  const [sceneOpen, setSceneOpen] = useState(false);
  const [error, setError] = useState('');
  const audio = useRef(null);
  const getCurrentTime = useCallback(() => audio.current?.Transport.seconds ?? 0, []);
  const seek = (current) => {
    if (!audio.current) return;
    audio.current.Transport.seconds = current;
    setPlayback(p => ({ ...p, current }));
  };

  const synths = useRef([]);
  const parts = useRef([]);

  const { rows, settings: layoutSettings } = useMemo(() => computeLayout(parsedTracks), [parsedTracks]);
  const currentPage = Math.min(Math.floor((playback.duration ? playback.current / playback.duration : 0) * 10), 9);

  const loadMidi = async () => {
    if (!selectedUrl || loading) return;
    setSceneOpen(true);
    setLoading(true);
    setError('');
    try {
      const [Tone, { Midi }] = await Promise.all([import('tone'), import('@tonejs/midi')]);
      audio.current = Tone;
      if (playback.isPlaying) { Tone.Transport.stop(); Tone.Transport.cancel(); }
      const midi = await Midi.fromUrl(selectedUrl); 
      const rawTracks = midi.tracks.filter(t => t.notes.length > 0);
      const mappedTracks = rawTracks.map(t => ({ ...t, info: getTrackInfo(t) }));
      mappedTracks.sort((a, b) => a.info.order - b.info.order);
      const maxD = Math.max(...mappedTracks.map(t => t.notes[t.notes.length - 1]?.time + t.notes[t.notes.length - 1]?.duration || 0));
      
      setPlayback({ isPlaying: false, current: 0, duration: maxD + 1 });
      setParsedTracks(mappedTracks);
      Tone.Transport.seconds = 0;
      
      synths.current.forEach(s => s.dispose());
      parts.current.forEach(p => p.dispose());
      synths.current = mappedTracks.map(() => {
        const synth = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "triangle" } });
        return synth.toDestination();
      });
      Tone.getDestination().volume.value = -18;      
      parts.current = mappedTracks.map((track, index) => {
        const p = new Tone.Part((time, note) => {
          synths.current[index].triggerAttackRelease(note.name, note.duration, time, note.velocity * 0.7);
        }, track.notes);
        p.start(0); return p;
      });
    } catch {
      setError('MIDI를 불러오지 못했습니다. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = async () => {
    const Tone = audio.current;
    if (!Tone || !playback.duration || loading) return;
    await Tone.start(); 
    if (playback.isPlaying) { 
      Tone.Transport.pause(); 
      synths.current.forEach(s => s.releaseAll()); 
    } else { 
      if (playback.current >= playback.duration) Tone.Transport.seconds = 0; 
      Tone.Transport.start(); 
    }
    setPlayback(p => ({ ...p, isPlaying: !p.isPlaying }));
  };

  useEffect(() => {
    let rafId; let lastUiUpdateTime = 0;
    if (!playback.isPlaying) return;
    const Tone = audio.current;
    const loop = (time) => {
      const curr = Tone.Transport.seconds;
      if (playback.duration > 0 && curr >= playback.duration) {
        Tone.Transport.stop(); synths.current.forEach(s => s.releaseAll());
        setPlayback(p => ({ ...p, isPlaying: false, current: 0 })); return;
      }
      if (time - lastUiUpdateTime > 100) { setPlayback(p => ({ ...p, current: curr })); lastUiUpdateTime = time; }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [playback.isPlaying, playback.duration]);

  return (
    <main className="orchestra">
      <div className="orchestra-stage">
        {sceneOpen ? (
          <SceneBoundary>
            <Suspense fallback={<p role="status">3D 무대를 준비하는 중입니다.</p>}>
              <OrchestraScene rows={rows} layoutSettings={layoutSettings} currentPage={currentPage}
                isPlaying={playback.isPlaying} getCurrentTime={getCurrentTime} />
            </Suspense>
          </SceneBoundary>
        ) : (
          <section className="orchestra-intro">
            <h1>Catpera Symphony</h1>
            <p>MIDI에 맞춰 움직이는 고양이 오케스트라</p>
            <button className="btn" onClick={loadMidi}>무대 열기</button>
          </section>
        )}
      </div>
      {error && <p className="orchestra-error" role="alert">{error}</p>}
      <ControlPanel
        showUI={showUI} setShowUI={setShowUI}
        selectedUrl={selectedUrl} setSelectedUrl={setSelectedUrl}
        songList={SONG_LIST} loadMidi={loadMidi} togglePlay={togglePlay}
        playback={playback} seek={seek} loading={loading}
      />
    </main>
  );
}
