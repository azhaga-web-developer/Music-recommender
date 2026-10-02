import { useState, useEffect, useRef } from 'react';
import {
  Music, Sparkles, Home as HomeIcon, Loader2, Play, Pause,
  Library, User, LogOut, AlertCircle, Heart, SkipForward,
  FastForward, Rewind, Volume2, VolumeX,
  Info, Mail, Github, Twitter, MessageSquare, Search, X
} from 'lucide-react';
// ✅ SAFE IMPORT (handles Vite issue)
import ReactPlayerImport from 'react-player/lazy';

// Fix: ensure it's a valid component
const ReactPlayer = ReactPlayerImport?.default || ReactPlayerImport;
import './App.css';

// Mock Data for the normal music app section
const MOCK_CATEGORIES = [
  {
    title: "Trending Tamil Hits",
    tracks: [
      { id: 't1', title: "Hukum", artist: "Anirudh Ravichander", cover: "placeholder" },
      { id: 't2', title: "Naa Ready", artist: "Anirudh", cover: "placeholder" },
      { id: 't3', title: "Ranjithame", artist: "Thaman S", cover: "placeholder" },
      { id: 't4', title: "Arabic Kuthu", artist: "Anirudh", cover: "placeholder" },
      { id: 't5', title: "Kaavaalaa", artist: "Anirudh", cover: "placeholder" },
      { id: 't6', title: "Tum Tum", artist: "Thaman S", cover: "placeholder" },
      { id: 't7', title: "Enjoy Enjaami", artist: "Dhee", cover: "placeholder" },
      { id: 't8', title: "Rowdy Baby", artist: "Yuvan Shankar Raja", cover: "placeholder" },
      { id: 't9', title: "Why This Kolaveri Di", artist: "Anirudh", cover: "placeholder" },
      { id: 't10', title: "Vaseegara", artist: "Harris Jayaraj", cover: "placeholder" },
      { id: 't11', title: "Munbe Vaa", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't12', title: "Oru Manam", artist: "Harris Jayaraj", cover: "placeholder" },
      { id: 't13', title: "Thumbi Thullal", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't14', title: "Naan Pizhai", artist: "Anirudh", cover: "placeholder" },
      { id: 't15', title: "Idhazhin Oram", artist: "Anirudh", cover: "placeholder" },
      { id: 't31', title: "Megham Karukatha", artist: "Dhanush", cover: "placeholder" }
    ]
  },
  {
    title: "Evergreen Tamil Classics",
    tracks: [
      { id: 't16', title: "Kanmani Anbodu", artist: "Ilaiyaraaja", cover: "placeholder" },
      { id: 't17', title: "Ennodu Nee Irundhaal", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't18', title: "Uyir Urugudhey", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't19', title: "Moongil Thottam", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't20', title: "Neethanae", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't21', title: "Ondra Renda Aasaigal", artist: "Harris Jayaraj", cover: "placeholder" },
      { id: 't22', title: "Aalaporan Thamizhan", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't23', title: "Nallai Allai", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't24', title: "Maruvaarthai", artist: "Darbuka Siva", cover: "placeholder" },
      { id: 't25', title: "En Kadhal Solla", artist: "Yuvan", cover: "placeholder" },
      { id: 't26', title: "Thalli Pogathey", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't27', title: "Andha Kanna Paathaakaa", artist: "Anirudh", cover: "placeholder" },
      { id: 't28', title: "Innum Konjam Naeram", artist: "A.R. Rahman", cover: "placeholder" },
      { id: 't29', title: "Adhaaru Adhaaru", artist: "Harris Jayaraj", cover: "placeholder" },
      { id: 't30', title: "Verithanam", artist: "A.R. Rahman", cover: "placeholder" }
    ]
  }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');

  const [activeTab, setActiveTab] = useState('home'); // 'home' | 'aidj' | 'chatbot' | 'library' | 'profile'
  const [likedTracks, setLikedTracks] = useState(() => {
    const saved = localStorage.getItem('likedTracks');
    return saved ? JSON.parse(saved) : [];
  });
  const [playQueue, setPlayQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchableTracks = Array.from(new Map(
    [...MOCK_CATEGORIES.flatMap(category => category.tracks), ...likedTracks]
      .map(track => [track.id || `${track.title}-${track.artist}`, track])
  ).values());
  const searchResults = searchQuery.trim()
    ? searchableTracks.filter(track => `${track.title} ${track.artist}`.toLowerCase().includes(searchQuery.trim().toLowerCase())).slice(0, 8)
    : [];

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('likedTracks', JSON.stringify(likedTracks));
  }, [likedTracks]);

  // YouTube Full Audio Player State
  const [currentTrack, setCurrentTrack] = useState(null); // { title, artist, cover, videoId }
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const playerRef = useRef(null);

  // Scrubber & Volume State
  const [playedSeconds, setPlayedSeconds] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [seeking, setSeeking] = useState(false);

  // Clear player state on auth change
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentTrack(null);
      setIsPlaying(false);
      setPlayedSeconds(0);
      setAudioLoading(false);
    }
  }, [isAuthenticated]);

  const toggleLike = (e, track) => {
    e.stopPropagation();
    const normalizedTrack = { ...track, id: track.id || track.title };
    if (likedTracks.some(t => t.id === normalizedTrack.id)) {
      setLikedTracks(likedTracks.filter(t => t.id !== normalizedTrack.id));
    } else {
      setLikedTracks([...likedTracks, normalizedTrack]);
    }
  };

  const playAudio = async (trackInfo, tracks = [trackInfo], forcePlay = false, requestedIndex = null) => {
    const nextQueue = Array.isArray(tracks) && tracks.length ? tracks : [trackInfo];
    const trackId = trackInfo.id || trackInfo.title;
    const nextIndex = requestedIndex ?? Math.max(0, nextQueue.findIndex(track => (track.id || track.title) === trackId));

    if (currentTrack?.title === trackInfo.title && !forcePlay) {
      setIsPlaying(!isPlaying);
      return;
    }

    setPlayQueue(nextQueue);
    setQueueIndex(nextIndex);
    setAudioLoading(true);
    setCurrentTrack(trackInfo);
    setIsPlaying(false);
    setPlayedSeconds(0);

    try {
      // The API key stays on the server; the browser calls the same-origin endpoint.
      const q = encodeURIComponent(`${trackInfo.title} ${trackInfo.artist} audio`);
      const res = await fetch(`/api/youtube-search?q=${q}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "YouTube search failed.");

      if (data.items && data.items.length > 0) {
        // Explicitly find an item that is actually a video (prevents playlist/channel IDs causing undefined)
        const videoItem = data.items.find(item => item.id && item.id.videoId);

        if (videoItem) {
          const videoId = videoItem.id.videoId;
          setCurrentTrack({
            ...trackInfo,
            videoId
          });
          setIsPlaying(true);
        } else {
          alert("Sorry, we couldn't resolve a valid audio stream for this track.");
          setCurrentTrack(null);
        }
      } else {
        alert("Sorry, no full audio track found.");
        setCurrentTrack(null);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to fetch full audio track.");
      setCurrentTrack(null);
    } finally {
      setAudioLoading(false);
    }
  };

  const playNext = () => {
    if (queueIndex < 0 || queueIndex >= playQueue.length - 1) return;
    const nextIndex = queueIndex + 1;
    playAudio(playQueue[nextIndex], playQueue, true, nextIndex);
  };

  const handleTrackEnded = () => {
    if (queueIndex >= 0 && queueIndex < playQueue.length - 1) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  };

  const togglePlayPause = () => {
    if (!currentTrack) return;
    setIsPlaying(!isPlaying);
  };

  const handleSeekMouseDown = () => { setSeeking(true); };
  const handleSeekChange = (e) => { setPlayedSeconds(parseFloat(e.target.value)); };
  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    if (playerRef.current) {
      playerRef.current.seekTo(parseFloat(e.target.value));
    }
  };

  const fastForward = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(playedSeconds + 10);
    }
  };

  const rewind = () => {
    if (playerRef.current) {
      playerRef.current.seekTo(playedSeconds - 10);
    }
  };

  const toggleMute = () => setIsMuted(!isMuted);

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
    if (parseFloat(e.target.value) > 0) {
      setIsMuted(false);
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const num = Math.floor(seconds);
    const m = Math.floor(num / 60);
    const s = (num % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!isAuthenticated) {
    return <AuthView onLogin={(name) => { setUsername(name); setIsAuthenticated(true); }} />;
  }

  return (
    <div className="app-layout animate-fade-in">
      {/* Hidden React Player acts as our complete audio engine */}
      {isAuthenticated && currentTrack && (
        <ReactPlayer
          key={currentTrack.videoId}
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${currentTrack.videoId}`}
          playing={isPlaying}
          volume={volume}
          muted={isMuted}
          width="1px"
          height="1px"
          style={{ position: 'absolute', top: '-1000px', left: '-1000px', opacity: 0, pointerEvents: 'none' }}
          onReady={() => console.log('Player loaded successfully')}
          onError={(e) => {
            if (isPlaying) {
              alert("Playback Error: Video blocked from embedding or unavailable. Please try another song.");
              setIsPlaying(false);
            }
          }}
          onProgress={({ playedSeconds: p }) => { if (!seeking) setPlayedSeconds(p); }}
          onDuration={(d) => setDuration(d)}
          onEnded={handleTrackEnded}
          config={{ youtube: { playerVars: { origin: window.location.origin, playsinline: 1, autoplay: 0 } } }}
        />
      )}

      <aside className="sidebar">
        <div className="sidebar-logo">
          <Music className="logo-icon" size={28} />
          <span>Aura<span className="text-gradient">Beats</span></span>
        </div>

        <div className="nav-links">
          <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
            <HomeIcon size={20} />
            <span>Home</span>
          </div>
          <div className={`nav-item ${activeTab === 'aidj' ? 'active' : ''}`} onClick={() => setActiveTab('aidj')}>
            <Sparkles size={20} />
            <span>AI DJ</span>
          </div>
          <div className={`nav-item ${activeTab === 'chatbot' ? 'active' : ''}`} onClick={() => setActiveTab('chatbot')}>
            <MessageSquare size={20} />
            <span>Chatbot</span>
          </div>
          <div className={`nav-item ${activeTab === 'library' ? 'active' : ''}`} onClick={() => setActiveTab('library')}>
            <Library size={20} />
            <span>Your Library</span>
          </div>
        </div>

        <div className="sidebar-bottom">
          <div className="nav-item logout" onClick={() => {
            setIsAuthenticated(false);
            setCurrentTrack(null);
            setIsPlaying(false);
          }}>
            <LogOut size={20} />
            <span>Logout</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-header animate-fade-in">
          <div className="greeting">Good evening, {username}</div>
          <div className="song-search">
            <div className="search-field">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search songs and artists"
                placeholder="Search songs or artists..."
                value={searchQuery}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 120)}
                onChange={event => {
                  setSearchQuery(event.target.value);
                  setSearchOpen(true);
                }}
                onKeyDown={event => {
                  if (event.key === 'Enter' && searchResults.length) {
                    event.preventDefault();
                    playAudio(searchResults[0], searchResults);
                    setSearchQuery('');
                    setSearchOpen(false);
                    event.currentTarget.blur();
                  }
                  if (event.key === 'Escape') setSearchOpen(false);
                }}
              />
              {searchQuery && (
                <button className="search-clear" type="button" aria-label="Clear search" onMouseDown={event => event.preventDefault()} onClick={() => setSearchQuery('')}>
                  <X size={16} />
                </button>
              )}
            </div>
            {searchOpen && searchQuery.trim() && (
              <div className="search-results" role="listbox" aria-label="Song search results">
                {searchResults.length ? searchResults.map(track => (
                  <button
                    className="search-result"
                    type="button"
                    key={track.id || `${track.title}-${track.artist}`}
                    role="option"
                    aria-selected="false"
                    onMouseDown={event => event.preventDefault()}
                    onClick={() => {
                      playAudio(track, searchResults);
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                  >
                    <span className="search-result-icon"><Play size={14} fill="currentColor" /></span>
                    <span className="search-result-copy"><strong>{track.title}</strong><small>{track.artist}</small></span>
                  </button>
                )) : <div className="search-empty">No matching songs found</div>}
              </div>
            )}
          </div>
          <div className="user-profile" onClick={() => setActiveTab('profile')}>
            <User size={18} />
            {username}
          </div>
        </header>

        {activeTab === 'home' && (
          <HomeView currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playAudio} audioLoading={audioLoading} toggleLike={toggleLike} likedTracks={likedTracks} />
        )}
        {activeTab === 'aidj' && (
          <AIDJView currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playAudio} audioLoading={audioLoading} toggleLike={toggleLike} likedTracks={likedTracks} />
        )}
        {activeTab === 'chatbot' && (
          <ChatbotView />
        )}
        {activeTab === 'library' && (
          <LibraryView likedTracks={likedTracks} currentTrack={currentTrack} isPlaying={isPlaying} onPlay={playAudio} audioLoading={audioLoading} toggleLike={toggleLike} />
        )}
        {activeTab === 'profile' && (
          <ProfileView username={username} likedTracks={likedTracks} />
        )}

        <Footer />
      </main>

      {/* Full Control Player Bar */}
      {currentTrack && (
        <div className="player-bar animate-fade-in">
          <div className="player-left">
            <div className="player-cover">
              {audioLoading ? (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Loader2 className="spinner" size={20} color="var(--primary)" />
                </div>
              ) : (
                <TrackCover title={currentTrack.title} artist={currentTrack.artist} />
              )}
            </div>
            <div className="player-info">
              <div className="player-title">{currentTrack.title}</div>
              <div className="player-artist">{currentTrack.artist}</div>
            </div>
            <div className="player-actions" style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
              <button
                className={`player-action-btn ${likedTracks.some(t => t.id === (currentTrack.id || currentTrack.title)) ? 'active' : ''}`}
                onClick={(e) => toggleLike(e, currentTrack)}
              >
                <Heart size={20} fill={likedTracks.some(t => t.id === (currentTrack.id || currentTrack.title)) ? "currentColor" : "none"} />
              </button>
            </div>
          </div>

          <div className="player-controls">
            <div className="control-buttons">
              <button className="ctrl-btn" onClick={rewind}><Rewind size={20} /></button>
              <button className="ctrl-btn play-pause-btn" onClick={togglePlayPause} disabled={audioLoading}>
                {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '3px' }} />}
              </button>
              <button className="ctrl-btn" onClick={fastForward} title="Skip forward 10 seconds" aria-label="Skip forward 10 seconds"><FastForward size={20} /></button>
              <button className="ctrl-btn" onClick={playNext} disabled={queueIndex < 0 || queueIndex >= playQueue.length - 1} title="Next song" aria-label="Next song"><SkipForward size={20} /></button>
            </div>
            {/* Range Scrubber */}
            <div className="scrubber-container">
              <span className="time-text">{formatTime(playedSeconds)}</span>
              <input
                type="range" className="scrubber"
                min={0} max={duration}
                step="any"
                value={playedSeconds}
                onMouseDown={handleSeekMouseDown}
                onChange={handleSeekChange}
                onMouseUp={handleSeekMouseUp}
              />
              <span className="time-text">{formatTime(duration)}</span>
            </div>
          </div>

          <div className="player-right">
            <button className="ctrl-btn" onClick={toggleMute}>
              {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <input
              type="range" className="vol-slider"
              min={0} max={1} step={0.01}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// iTunes Cover Fetch
function TrackCover({ title, artist }) {
  const [cover, setCover] = useState('https://images.unsplash.com/photo-1614613535808-37c223aeb964?w=300&q=80');

  useEffect(() => {
    let isMounted = true;
    const fetchCover = async () => {
      try {
        const q = encodeURIComponent(`${title} ${artist}`);
        const res = await fetch(`https://itunes.apple.com/search?term=${q}&media=music&entity=song&limit=1`);
        const data = await res.json();
        if (data.results && data.results.length > 0 && isMounted) {
          setCover(data.results[0].artworkUrl100.replace('100x100bb', '300x300bb').replace('100x100', '300x300'));
        }
      } catch (err) { }
    };

    const timer = setTimeout(() => { fetchCover(); }, 100);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [title, artist]);

  return <img src={cover} alt={title} />;
}

// 1. Mock Authentication Component
function AuthView({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    setError('');
    onLogin(username);
  };

  return (
    <div className="auth-container">
      <div className="auth-card animate-fade-in">
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <Music size={48} color="var(--primary)" />
        </div>
        <h2>Welcome Back</h2>
        <p>Log in to access your music</p>

        {error && <div className="error-msg"><AlertCircle size={16} /> {error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Username</label>
            <input type="text" placeholder="Enter username" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div className="input-group">
            <label>Password</label>
            <input type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. Normal Music App Home View
function HomeView({ onPlay, currentTrack, isPlaying, audioLoading, toggleLike, likedTracks }) {
  return (
    <div className="animate-fade-in">
      {MOCK_CATEGORIES.map((category, idx) => (
        <div key={idx}>
          <h2 className="section-header">{category.title}</h2>
          <div className="music-grid">
            {category.tracks.map((track) => {
              const isActive = currentTrack?.title === track.title;
              const normalizedTrack = { ...track, id: track.id || track.title };
              const isLiked = likedTracks.some(t => t.id === normalizedTrack.id);
              return (
                <div key={track.id} className="music-card" onClick={() => onPlay(track, category.tracks)}>
                  <div className="card-actions">
                    <button className={`card-action-btn ${isLiked ? 'active' : ''}`} onClick={(e) => toggleLike(e, track)}>
                      <Heart fill={isLiked ? "currentColor" : "none"} size={18} />
                    </button>
                  </div>
                  <div className="cover-img-wrapper">
                    <TrackCover title={track.title} artist={track.artist} />
                    <div className="play-overlay">
                      <button className="play-btn">
                        {isActive && audioLoading ? (
                          <Loader2 className="spinner" size={24} />
                        ) : isActive && isPlaying ? (
                          <Pause fill="white" />
                        ) : (
                          <Play fill="white" style={{ marginLeft: '3px' }} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// 3. AI DJ View
function AIDJView({ onPlay, currentTrack, isPlaying, audioLoading, toggleLike, likedTracks }) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recommendations, setRecommendations] = useState([]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("Enter a prompt");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "recommendations", prompt })
      });

      if (!res.ok) {
        const result = await res.json().catch(() => ({}));
        throw new Error(result.error || "Groq request failed");
      }

      const data = await res.json();
      const text = data?.content;

      if (!text) throw new Error("Empty response");

      // ✅ SAFE JSON parsing
      let parsed;

      try {
        // Extract JSON block
        const match = text.match(/```json\s*([\s\S]*?)\s*```/);

        if (match) {
          parsed = JSON.parse(match[1]);
        } else {
          // fallback: try normal JSON extraction
          const cleanMatch = text.match(/\{[\s\S]*\}/);
          parsed = cleanMatch ? JSON.parse(cleanMatch[0]) : null;
        }

      } catch (err) {
        console.error("JSON parse error:", err);
        throw new Error("Invalid AI response format");
      }

      if (!Array.isArray(parsed?.recommendations) || parsed.recommendations.length === 0) {
        throw new Error("The AI response did not contain any recommendations.");
      }
      setRecommendations(parsed.recommendations);

    } catch (err) {
      console.error(err);
      setError(err.message || "Could not generate recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="dj-hero">
        <h1>Your Personal <span className="text-gradient">AI DJ</span></h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>
          Describe a deeply specific mood, scenario, or feeling. Our AI will curate tracks for you.
        </p>
      </div>

      <div className="prompt-box-container">
        <textarea
          className="prompt-textarea"
          placeholder="Describe the mood, language, genre, pace, artists you like, or songs to avoid..."
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && e.ctrlKey && handleGenerate()}
        />
        <div className="prompt-actions">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Add your language, genre, pace, or favorite artists for closer matches. Press Ctrl + Enter to generate.</span>
          <button className="btn-generate" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="spinner" size={20} /> : <Sparkles size={20} />}
            Generate Vibe
          </button>
        </div>
      </div>

      {error && (
        <div className="error-msg" style={{ marginBottom: '2rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="ai-results">
          <h2 className="section-header">Your Curated Vibe</h2>
          <div className="music-grid">
            {recommendations.map((track, i) => {
              const isActive = currentTrack?.title === track.title;
              const normalizedTrack = { ...track, id: track.title };
              const isLiked = likedTracks.some(t => t.id === normalizedTrack.id);

              return (
                <div key={i} className="music-card" onClick={() => onPlay(normalizedTrack, recommendations)} style={{ animationDelay: (i * 0.1) + 's' }}>
                  <div className="card-actions">
                    <button className={`card-action-btn ${isLiked ? 'active' : ''}`} onClick={(e) => toggleLike(e, normalizedTrack)}>
                      <Heart fill={isLiked ? "currentColor" : "none"} size={18} />
                    </button>
                  </div>
                  <div className="cover-img-wrapper">
                    <TrackCover title={track.title} artist={track.artist} />
                    <div className="play-overlay">
                      <button className="play-btn">
                        {isActive && audioLoading ? (
                          <Loader2 className="spinner" size={24} />
                        ) : isActive && isPlaying ? (
                          <Pause fill="white" />
                        ) : (
                          <Play fill="white" style={{ marginLeft: '3px' }} />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="track-info">
                    <div className="track-title">{track.title}</div>
                    <div className="track-artist">{track.artist}</div>
                  </div>
                  <div className="ai-reason">
                    {track.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// 4. Library View
function LibraryView({ likedTracks, onPlay, currentTrack, isPlaying, audioLoading, toggleLike }) {
  if (likedTracks.length === 0) {
    return (
      <div className="empty-state animate-fade-in">
        <Heart size={48} color="var(--text-muted)" style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
        <h2 className="section-header" style={{ marginBottom: '1rem' }}>Your Library is empty</h2>
        <p>Save tracks you love by clicking the heart icon on any song.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h2 className="section-header">Liked Songs</h2>
      <div className="music-grid">
        {likedTracks.map((track) => {
          const isActive = currentTrack?.title === track.title;
          const normalizedTrack = { ...track, id: track.id || track.title };
          return (
            <div key={track.id} className="music-card" onClick={() => onPlay(track, likedTracks)}>
              <div className="card-actions">
                <button className="card-action-btn active" onClick={(e) => toggleLike(e, track)}>
                  <Heart fill="currentColor" size={18} />
                </button>
              </div>
              <div className="cover-img-wrapper">
                <TrackCover title={track.title} artist={track.artist} />
                <div className="play-overlay">
                  <button className="play-btn">
                    {isActive && audioLoading ? (
                      <Loader2 className="spinner" size={24} />
                    ) : isActive && isPlaying ? (
                      <Pause fill="white" />
                    ) : (
                      <Play fill="white" style={{ marginLeft: '3px' }} />
                    )}
                  </button>
                </div>
              </div>
              <div className="track-info">
                <div className="track-title">{track.title}</div>
                <div className="track-artist">{track.artist}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 5. Chatbot View
function ChatbotView() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Hello! I'm Aura Assistant. How can I help you today? You can ask me about music recommendations, artists, or anything related to AuraBeats!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "chat", messages: [...messages, userMsg] })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to fetch response");

      const botMsg = { role: 'assistant', content: data.content };
      if (!botMsg.content) throw new Error("The assistant returned an empty response.");
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: err.message || "Sorry, I'm having trouble connecting right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chatbot-container animate-fade-in">
      <div className="chatbot-header">
        <div className="bot-info">
          <div className="bot-avatar">
            <MessageSquare size={24} />
          </div>
          <div>
            <h3>Aura Assistant</h3>
            <span className="status">Online</span>
          </div>
        </div>
      </div>

      <div className="chat-messages" ref={scrollRef}>
        {messages.map((msg, i) => (
          <div key={i} className={`message-wrapper ${msg.role}`}>
            <div className="message-bubble">
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message-wrapper assistant">
            <div className="message-bubble loading">
              <Loader2 className="spinner" size={16} /> thinking...
            </div>
          </div>
        )}
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Ask Aura Assistant..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" disabled={!input.trim() || loading}>
          {loading ? <Loader2 className="spinner" size={20} /> : "Send"}
        </button>
      </form>
    </div>
  );
}

// 7. Profile View
function ProfileView({ username, likedTracks }) {
  return (
    <div className="profile-container animate-fade-in">
      <div className="profile-header">
        <div className="profile-avatar">
          <User size={80} />
        </div>
        <div className="profile-info">
          <h1>{username}</h1>
          <p>Tamil Music Enthusiast • Member since March 2024</p>
        </div>
      </div>

      <div className="profile-stats">
        <div className="stat-card">
          <span className="stat-value">{likedTracks.length}</span>
          <span className="stat-label">Liked Songs</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">Tamil</span>
          <span className="stat-label">Primary Language</span>
        </div>
      </div>

      <div className="profile-details-grid">
        <section className="profile-section">
          <h3>Top Genres</h3>
          <div className="genre-tags">
            {["Tamil Pop", "Kuthu", "Melody", "Cinematic"].map(g => <span key={g} className="tag">{g}</span>)}
          </div>
        </section>

        <section className="profile-section">
          <h3>Account Settings</h3>
          <div className="settings-list">
            <div className="setting-item">
              <span>Account Type</span>
              <strong>Premium User</strong>
            </div>
            <div className="setting-item">
              <span>Primary Email</span>
              <strong>{username.toLowerCase()}@example.com</strong>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// 7. Footer Component
function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-brand">
          <div className="sidebar-logo" style={{ marginBottom: '1rem', padding: 0 }}>
            <Music className="logo-icon" size={24} />
            <span>Aura<span className="text-gradient">Beats</span></span>
          </div>
          <p>Experience the future of music recommendation powered by AI.</p>
        </div>

        <div className="footer-links">
          <div className="footer-column">
            <h4>Quick Links</h4>
            <ul>
              <li>Home</li>
              <li>AI DJ</li>
              <li>Library</li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Support</h4>
            <ul>
              <li>Help Center</li>
              <li>Privacy Policy</li>
              <li>Contact Us</li>
            </ul>
          </div>
        </div>

        <div className="footer-social">
          <div className="social-icons">
            <Github size={20} />
            <Twitter size={20} />
            <Mail size={20} />
          </div>
          <p>© 2026 AuraBeats Inc. Made with ❤️ in India.</p>
        </div>
      </div>
    </footer>
  );
}
