import React from 'react';
import { formatTime } from '../music';

export const ControlPanel = ({ 
  showUI, setShowUI, selectedUrl, setSelectedUrl, 
  songList, loadMidi, togglePlay, playback, seek, loading
}) => {
  return (
    <>
      <style>{`
        .control-panel-container {
          width: 100%;
          padding: 14px 24px;
          box-sizing: border-box;
          background: #fff;
          border-top: 1px solid #c4d7df;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }
        .control-panel-container[hidden] { display: none; }
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
            flex-wrap: wrap;
            padding: 8px 12px calc(8px + env(safe-area-inset-bottom));
            gap: 8px;
          }
          .control-panel-right {
            flex: 1 1 100%;
            flex-wrap: wrap;
            gap: 8px;
          }
          .slider-container { flex: 1 1 100%; }
          .select-box { min-width: 0; }
          .btn { min-height: 40px; padding-inline: 12px; }
        }
      `}</style>

      <div className="control-panel-container" hidden={!showUI}>
        <div className="header-group" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <h1 style={{ margin: 0, fontSize: '18px', color: '#333', fontWeight: '500', letterSpacing: '2px' }}>Catpera</h1>
          <button className="btn" onClick={() => setShowUI(false)} style={{ color: '#666' }}>Hide</button>
        </div>
        
        <div className="control-panel-right">
          <select aria-label="MIDI 곡" className="select-box" value={selectedUrl} onChange={e => setSelectedUrl(e.target.value)}>
            {songList.map((s, i) => <option key={i} value={s.url}>{s.name}</option>)}
          </select>
          
          <div className="btn-group">
            <button className="btn" onClick={loadMidi} disabled={loading}>{loading ? "Loading…" : "Load"}</button>
            <button 
              className="btn" 
              onClick={togglePlay}
              disabled={loading || !playback.duration}
              style={{ background: playback.isPlaying ? 'rgba(0,0,0,0.1)' : '#fff', color: '#333' }}
            >
              {playback.isPlaying ? 'Pause' : 'Play'}
            </button>
          </div>

          <div className="slider-container">
            <input 
              type="range" min="0" max={playback.duration || 100} step="0.1" 
              value={playback.current} 
              aria-label="재생 위치"
              disabled={loading || !playback.duration}
              onChange={event => seek(Number(event.target.value))}
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
          style={{ alignSelf: "flex-end", margin: "8px 12px" }}
        >
          Show UI
        </button>
      )}
    </>
  );
};
