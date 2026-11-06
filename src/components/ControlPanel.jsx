import React from 'react';
import { formatTime } from '../constants';

export const ControlPanel = ({ 
  showUI, setShowUI, selectedUrl, setSelectedUrl, 
  songList, loadMidi, togglePlay, playback, setPlayback 
}) => {
  const handleRangeChange = (e) => {
    const t = parseFloat(e.target.value);
    setPlayback(p => ({ ...p, current: t }));
    // Tone.Transport.seconds 제어는 부모(App.jsx) 또는 hook에서 처리하도록 의존성 분리
    if (window.Tone && window.Tone.Transport) {
        window.Tone.Transport.seconds = t;
    }
  };

  return (
    <>
      <style>{`
        .control-panel-container {
          position: absolute;
          bottom: ${showUI ? '0' : '-150px'};
          left: 0;
          width: 100vw;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          padding: 20px 40px;
          box-sizing: border-box;
          border-top: 1px solid rgba(0,0,0,0.1);
          z-index: 100;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          gap: 20px;
        }
        .control-panel-right {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 15px;
          max-width: 800px;
        }
        .btn {
          padding: 8px 16px;
          background: rgba(0,0,0,0.05);
          color: #333;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 6px;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          letter-spacing: 0.5px;
          font-weight: 500;
          white-space: nowrap;
        }
        .btn:active { background: rgba(0,0,0,0.1); }
        .select-box {
          flex: 1;
          padding: 10px;
          background: rgba(255,255,255,0.7);
          color: #333;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 6px;
          outline: none;
          font-weight: 500;
          min-width: 150px;
        }
        .slider-container {
          flex: 2;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-width: 150px;
        }
        
        /* 모바일 반응형 처리 */
        @media (max-width: 768px) {
          .control-panel-container {
            flex-direction: column;
            padding: 15px 20px;
            align-items: stretch;
            bottom: ${showUI ? '0' : '-200px'};
          }
          .header-group {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .control-panel-right {
            flex-direction: column;
            align-items: stretch;
            max-width: 100%;
          }
          .btn-group {
            display: flex;
            gap: 10px;
          }
          .btn-group button { flex: 1; }
        }
      `}</style>

      <div className="control-panel-container">
        <div className="header-group" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '500', letterSpacing: '2px' }}>Catpera</h1>
          <button className="btn" onClick={() => setShowUI(false)} style={{ color: '#666' }}>Hide</button>
        </div>
        
        <div className="control-panel-right">
          <select className="select-box" value={selectedUrl} onChange={e => setSelectedUrl(e.target.value)}>
            {songList.map((s, i) => <option key={i} value={s.url}>{s.name}</option>)}
          </select>
          
          <div className="btn-group">
            <button className="btn" onClick={loadMidi}>Load</button>
            <button 
              className="btn" 
              onClick={togglePlay} 
              style={{ background: playback.isPlaying ? 'rgba(0,0,0,0.1)' : '#fff', color: '#333' }}
            >
              {playback.isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>

          <div className="slider-container">
            <input 
              type="range" min="0" max={playback.duration || 100} step="0.1" 
              value={playback.current} 
              onChange={handleRangeChange} 
              style={{ width: '100%', accentColor: '#a8c6a8', cursor: 'pointer', height: '4px' }} 
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#555', letterSpacing: '1px' }}>
              <span>{formatTime(playback.current)}</span>
              <span>{formatTime(playback.duration)}</span>
            </div>
          </div>
        </div>
      </div>

      {!showUI && (
        <button 
          className="btn" 
          onClick={() => setShowUI(true)} 
          style={{ position: 'absolute', bottom: '20px', right: '30px', zIndex: 101, background: 'rgba(255,255,255,0.9)' }}
        >
          Show UI
        </button>
      )}
    </>
  );
};
