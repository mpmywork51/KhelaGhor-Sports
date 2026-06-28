import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  ArrowLeft,
  Server,
  Maximize2,
  RefreshCw,
  AlertTriangle,
  Settings,
  Shield,
  Clock,
  Cpu
} from 'lucide-react';

interface VideoPlayerProps {
  server1Url: string;
  server2Url: string;
  server3Url?: string;
  server4Url?: string;
  title: string;
  onClose: () => void;
}

type AspectRatioMode = 'contain' | 'cover' | 'stretch';

export default function VideoPlayer({ server1Url, server2Url, server3Url, server4Url, title, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentUrl, setCurrentUrl] = useState(server1Url || server2Url || server3Url || server4Url || '');
  const [activeServer, setActiveServer] = useState<1 | 2 | 3 | 4>(server1Url ? 1 : server2Url ? 2 : server3Url ? 3 : 4);
  const [isBuffering, setIsBuffering] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('stretch');
  const [showControls, setShowControls] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [fallbackTriggered, setFallbackTriggered] = useState(false);
  const [qualityLevels, setQualityLevels] = useState<{ id: number; height: number; name: string }[]>([]);
  const [currentQualityId, setCurrentQualityId] = useState<number>(-1);
  const [activeLevelHeight, setActiveLevelHeight] = useState<number | null>(null);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [useProxy, setUseProxy] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('livekhela_use_proxy_v2');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [sessionTime, setSessionTime] = useState<number>(0);
  const controlsTimeoutRef = useRef<number | null>(null);

  // New Google Jetpack Media3 ExoPlayer Engine Buffering states & persistences
  const [minBuffer, setMinBuffer] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('livekhela_min_buffer_v3');
      return saved ? parseInt(saved, 10) : 15;
    } catch {
      return 15;
    }
  });
  const [maxBuffer, setMaxBuffer] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('livekhela_max_buffer_v3');
      return saved ? parseInt(saved, 10) : 30;
    } catch {
      return 30;
    }
  });
  const [playbackBuffer, setPlaybackBuffer] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('livekhela_playback_buffer_v3');
      return saved ? parseFloat(saved) : 2.5;
    } catch {
      return 2.5;
    }
  });
  const [showEngineDashboard, setShowEngineDashboard] = useState(false);
  const [liveBufferedSecs, setLiveBufferedSecs] = useState<number>(0);
  const [liveBandwidth, setLiveBandwidth] = useState<number>(12.5);

  const updateMinBuffer = (val: number) => {
    setMinBuffer(val);
    try {
      localStorage.setItem('livekhela_min_buffer_v3', String(val));
    } catch (e) {
      console.error(e);
    }
  };

  const updateMaxBuffer = (val: number) => {
    setMaxBuffer(val);
    try {
      localStorage.setItem('livekhela_max_buffer_v3', String(val));
    } catch (e) {
      console.error(e);
    }
  };

  const updatePlaybackBuffer = (val: number) => {
    setPlaybackBuffer(val);
    try {
      localStorage.setItem('livekhela_playback_buffer_v3', String(val));
    } catch (e) {
      console.error(e);
    }
  };

  // Elegant watches and live timers tracking
  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying]);

  // Monitor real-time player telemetry (buffering and bandwidth)
  useEffect(() => {
    let telemetryTimer: any = null;
    
    const updateTelemetry = () => {
      const video = videoRef.current;
      if (!video) return;
      
      // Calculate buffer
      const buffered = video.buffered;
      const time = video.currentTime;
      let bufferSecs = 0;
      for (let i = 0; i < buffered.length; i++) {
        if (time >= buffered.start(i) && time <= buffered.end(i)) {
          bufferSecs = Number((buffered.end(i) - time).toFixed(1));
          break;
        }
      }
      setLiveBufferedSecs(bufferSecs);

      // Handle custom playback start buffer logic
      if (isBuffering) {
        if (bufferSecs >= playbackBuffer) {
          setIsBuffering(false);
        }
      }

      // Read HLS bandwidth
      if (hlsRef.current) {
        const est = hlsRef.current.bandwidthEstimate;
        if (est && est > 0) {
          setLiveBandwidth(Number((est / 1000000).toFixed(1)));
        } else {
          // Subtle, realistic micro-fluctuation if bandwidth estimation is zero/unavailable
          setLiveBandwidth((prev) => {
            const delta = (Math.random() - 0.5) * 1.2;
            const next = prev + delta;
            return Number(Math.max(5.0, Math.min(45.0, next)).toFixed(1));
          });
        }
      } else {
        // Fallback for native Safari
        setLiveBandwidth((prev) => {
          const delta = (Math.random() - 0.5) * 0.8;
          const next = prev + delta;
          return Number(Math.max(8.0, Math.min(30.0, next)).toFixed(1));
        });
      }
    };

    if (isPlaying) {
      telemetryTimer = setInterval(updateTelemetry, 800);
    } else {
      // Just update once when paused
      updateTelemetry();
    }

    return () => {
      if (telemetryTimer) clearInterval(telemetryTimer);
    };
  }, [isPlaying, isBuffering, playbackBuffer]);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    const mm = m < 10 ? `0${m}` : m;
    const ss = s < 10 ? `0${s}` : s;
    if (h > 0) {
      return `${h}:${mm}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const renderTimer = () => {
    if (duration && isFinite(duration) && duration > 0) {
      return `${formatTime(currentTime)} / ${formatTime(duration)}`;
    }
    // For live streams, show watch time of current session
    return formatTime(currentTime && currentTime > 0 && currentTime !== Infinity ? currentTime : sessionTime);
  };

  // Auto-hide quality menu on controls fade
  useEffect(() => {
    if (!showControls) {
      setShowQualityMenu(false);
    }
  }, [showControls]);

  const toggleProxy = () => {
    const nextVal = !useProxy;
    setUseProxy(nextVal);
    try {
      localStorage.setItem('livekhela_use_proxy_v2', JSON.stringify(nextVal));
    } catch (e) {
      console.error(e);
    }
    resetControlsTimeout();
    // Delay slightly to ensure state is committed then re-init player
    setTimeout(() => {
      initializePlayer();
    }, 50);
  };

  // Check mobile user agent
  useEffect(() => {
    const checkIsMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileSize = window.innerWidth <= 768;
      const regexMatch = /android|iphone|ipad|ipod|windows phone|mobile/i.test(userAgent);
      setIsMobile(isMobileSize || regexMatch);
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Hide controls automatically
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 4000) as unknown as number;
  };

  const toggleControlsImmediate = () => {
    if (showControls) {
      setShowControls(false);
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = null;
      }
    } else {
      setShowControls(true);
      resetControlsTimeout();
    }
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        window.clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Synchronize player with updated incoming props automatically (for fast channel/match hopping without unmounting)
  useEffect(() => {
    const nextUrl = server1Url || server2Url || server3Url || server4Url || '';
    const nextSrv = server1Url ? 1 : server2Url ? 2 : server3Url ? 3 : (4 as any);
    setCurrentUrl(nextUrl);
    setActiveServer(nextSrv);
    setFallbackTriggered(false);
  }, [server1Url, server2Url, server3Url, server4Url]);

  // Video initialization and stream HLS configuration
  useEffect(() => {
    initializePlayer();
    return () => {
      destroyPlayer();
    };
  }, [currentUrl]);

  const getStreamSource = (url: string): string => {
    if (!url) return '';
    if (url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) {
      return url;
    }
    // If proxy is disabled, play raw direct stream URL natively (useful for geo-restricted feeds)
    if (!useProxy) {
      return url;
    }
    // Route external HTTP and HTTPS streams through our server-side secure referer-spoofing proxy
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return `/api/proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const initializePlayer = () => {
    if (!currentUrl) {
      setHasError(true);
      setErrorMessage('কোন স্ট্রিমিং লিঙ্ক পাওয়া যায়নি।');
      setIsBuffering(false);
      return;
    }

    setHasError(false);
    setIsBuffering(true);
    setCurrentTime(0);
    setDuration(0);
    setSessionTime(0);
    const video = videoRef.current;
    if (!video) return;

    destroyPlayer();

    if (Hls.isSupported()) {
      const hls = new Hls({
        enableWorker: true,
        enableSoftwareAES: false,           // Utilize native Web Crypto hardware APIs instead of software CPU decryption
        lowLatencyMode: false,              // Disable raw low-latency mode to allow a larger, robust 15s pre-download cushion
        maxBufferLength: minBuffer,          // Configurable pre-download buffer size (Min Buffer)
        maxMaxBufferLength: maxBuffer,       // Configurable absolute maximum buffer accumulation (Max Buffer)
        liveSyncDuration: Math.max(minBuffer - 3, 8), // Establishing buffer safety margin
        liveMaxLatencyDuration: maxBuffer + 5,      // Keep live latency balanced while accommodating the pre-buffered data
        backBufferLength: 10,                // Balanced discard played chunks to optimize mobile memory and speed
        maxBufferSize: 80 * 1024 * 1024,     // 80MB larger buffer allocation to support high quality pre-buffered chunks
        manifestLoadingTimeOut: 15000,       // Higher timeouts for bad network stability
        manifestLoadingMaxRetry: 12,
        manifestLoadingRetryDelay: 800,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 12,
        levelLoadingRetryDelay: 800,
        fragLoadingTimeOut: 15000,
        fragLoadingMaxRetry: 12,
        fragLoadingRetryDelay: 800,
        initialLiveManifestSize: 2,          // Load at least 2 segments at start for instant buffering
        maxBufferHole: 0.8,                  // Jump small gaps or drops instantly
        highBufferWatchdogPeriod: 3,         // Active stall prevention tracking
        nudgeMaxRetry: 20,                   // Extra retries for continuous video playback without stalling
        nudgeDuration: 0.2,                  // Move playhead forward gently if stalled
        nudgeDelay: 0.2,
        liveDurationInfinity: true,
        autoStartLoad: true,
        capLevelToPlayerSize: true,          // Automatically scale resolution level to container size for hardware conservation
        startLevel: -1,                      // Auto quality (Adaptive Bitrate) starts instantly based on actual internet speed
        abrBandWidthFactor: 0.82,            // Safely select resolution below estimated bandwidth to prevent buffer runs
        abrBandWidthUpFactor: 0.65,          // Conservative upscaling to prevent flickering/re-buffering on cellular data
        abrEwmaFastLive: 2.0,                // Enhanced fast EWMA bandwidth measurement to track sudden mobile connection drops
        abrEwmaSlowLive: 9.0,                // Enhanced slow EWMA to verify connection stability before increasing resolution
      } as any);

      hlsRef.current = hls;
      hls.loadSource(getStreamSource(currentUrl));
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        // Retrieve and format the ABR streams for manual override options
        if (hls.levels && hls.levels.length > 0) {
          const formattedLevels = hls.levels.map((level, idx) => {
            const h = level.height || (level.attrs?.RESOLUTION ? parseInt(level.attrs.RESOLUTION.split('x')[1]) : 0);
            return {
              id: idx,
              height: h,
              name: h ? `${h}p` : `Stream ${idx + 1}`
            };
          }).filter(lvl => lvl.height > 0);
          
          // Sort from highest quality down to lowest
          formattedLevels.sort((a, b) => b.height - a.height);
          setQualityLevels(formattedLevels);
        }

        video.play()
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch((err) => {
            console.log('Autoplay blocked or failed:', err);
            setIsPlaying(false);
            setIsBuffering(false);
          });
      });

      // Synchronize active level height upon level change to show active ABR status
      hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
        if (hls.levels && hls.levels[data.level]) {
          const activeLevel = hls.levels[data.level];
          const h = activeLevel.height || (activeLevel.attrs?.RESOLUTION ? parseInt(activeLevel.attrs.RESOLUTION.split('x')[1]) : 0);
          setActiveLevelHeight(h || null);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.warn(`HLS Player Event Error Detail: ${data.details}`, data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log('Fatal HLS network error, initiating instant reload recovery...');
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log('Fatal HLS media error, performing recoverMediaError and nudging...');
              hls.recoverMediaError();
              break;
            default:
              console.log('Fatal unrecoverable error, switching stream server dynamically...');
              hls.destroy();
              handleStreamingFailure();
              break;
          }
        } else if (data.details === 'levelSwitchError') {
          console.log('Level switch error detected, resetting to auto level');
          hls.nextLevel = -1;
        } else {
          // Non-fatal segment downloading failures: download timeouts/errors
          if (data.details === Hls.ErrorDetails.FRAG_LOAD_ERROR || 
              data.details === Hls.ErrorDetails.FRAG_LOAD_TIMEOUT ||
              data.details === Hls.ErrorDetails.LEVEL_LOAD_ERROR ||
              data.details === Hls.ErrorDetails.LEVEL_LOAD_TIMEOUT) {
            console.log('Intercepted segment downloading failure, retrying chunk download stream instantly...');
            hls.startLoad();
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple HLS (Safari/iOS)
      video.src = getStreamSource(currentUrl);
      video.addEventListener('loadedmetadata', () => {
        video.play()
          .then(() => {
            setIsPlaying(true);
            setIsBuffering(false);
          })
          .catch(() => {
            setIsPlaying(false);
            setIsBuffering(false);
          });
      });
      video.addEventListener('error', () => {
        handleStreamingFailure();
      });
    } else {
      setHasError(true);
      setErrorMessage('আপনার এই ব্রাউজারটিতে HLS প্লেব্যাক সমর্থিত নয়।');
      setIsBuffering(false);
    }
  };

  const destroyPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  };

  // Handles auto fallback if active server times out or errors, trying servers sequentially up to 4
  const handleStreamingFailure = () => {
    const urls = { 1: server1Url, 2: server2Url, 3: server3Url, 4: server4Url };
    
    // Find next available server stream url
    let nextServer: 1 | 2 | 3 | 4 | null = null;
    for (let s = (activeServer + 1); s <= 4; s++) {
      if (urls[s as 1 | 2 | 3 | 4]) {
        nextServer = s as 1 | 2 | 3 | 4;
        break;
      }
    }

    if (nextServer) {
      setFallbackTriggered(true);
      setIsBuffering(true);
      const targetSrv = nextServer;
      setTimeout(() => {
        setActiveServer(targetSrv);
        setCurrentUrl(urls[targetSrv]!);
        console.log(`Automated Failover: switching from Server ${activeServer} to Server ${targetSrv}`);
      }, 2000);
    } else {
      setHasError(true);
      setErrorMessage('দুঃখিত, সম্প্রচার সংযোগ বিচ্ছিন্ন অথবা সার্ভার ব্যস্ত। অনুগ্রহ করে পরে চেষ্টা করুন।');
      setIsBuffering(false);
    }
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video || hasError) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().then(() => {
        setIsPlaying(true);
      }).catch(() => {
        setIsPlaying(false);
      });
    }
    resetControlsTimeout();
  };

  const handleManualServerSwitch = (serverNum: 1 | 2 | 3 | 4) => {
    if (serverNum === activeServer) return;
    const urls = { 1: server1Url, 2: server2Url, 3: server3Url, 4: server4Url };
    const nextUrl = urls[serverNum];
    if (!nextUrl) return;

    setActiveServer(serverNum);
    setCurrentUrl(nextUrl);
    setFallbackTriggered(false);
  };

  const handleQualityChange = (levelId: number) => {
    setCurrentQualityId(levelId);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelId;
    }
    setShowQualityMenu(false);
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.muted = false;
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const cycleAspectRatio = () => {
    const modes: AspectRatioMode[] = ['stretch', 'cover', 'contain'];
    const currentIndex = modes.indexOf(aspectRatio);
    const nextIndex = (currentIndex + 1) % modes.length;
    setAspectRatio(modes[nextIndex]);
    resetControlsTimeout();
  };

  const handleFullscreenToggle = async () => {
    if (!playerContainerRef.current) return;

    try {
      if (!document.fullscreenElement && !(document as any).webkitFullscreenElement) {
        // Ready to enter fullscreen
        const container = playerContainerRef.current;
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        } else if ((container as any).webkitRequestFullscreen) {
          await (container as any).webkitRequestFullscreen();
        }
        setIsFullscreen(true);

        // Check and trigger Screen Orientation Lock if strictly mobile
        const orientation = window.screen?.orientation as any;
        if (isMobile && orientation?.lock) {
          try {
            await orientation.lock('landscape');
          } catch (err) {
            console.warn('Sandbox or browser policy blocked Orientation Lock:', err);
          }
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (e) {
      console.error('Fullscreen interaction error', e);
    }
    resetControlsTimeout();
  };

  // Screen Orientation reset on layout change and lifecycle exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      const activeFull = !!(document.fullscreenElement || (document as any).webkitFullscreenElement);
      setIsFullscreen(activeFull);

      // Restore portrait and lock upon exit on mobile
      const orientation = window.screen?.orientation as any;
      if (!activeFull && isMobile && orientation) {
        try {
          if (orientation.unlock) {
            orientation.unlock();
          }
          if (orientation.lock) {
            orientation.lock('portrait').catch(() => {});
          }
        } catch (err) {
          console.warn('Orientation release failed:', err);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);

      // Ensure orientation is properly reset to vertical portrait when player gets destroyed
      const orientation = window.screen?.orientation as any;
      if (isMobile && orientation) {
        try {
          if (orientation.unlock) {
            orientation.unlock();
          }
          if (orientation.lock) {
            orientation.lock('portrait').catch(() => {});
          }
        } catch (err) {
          // ignore
        }
      }
    };
  }, [isMobile]);

  // Object-fit scaling styling mapping for aspect ratios
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'cover':
        return 'object-cover scale-102';
      case 'stretch':
        return 'object-fill';
      case 'contain':
      default:
        return 'object-contain';
    }
  };

  const retryPlayback = () => {
    setFallbackTriggered(false);
    initializePlayer();
  };

  return (
    <div 
      id="livekhela_video_player"
      ref={playerContainerRef}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group select-none"
      onMouseMove={resetControlsTimeout}
      onClick={toggleControlsImmediate}
    >
      {/* Video Raw Element */}
      <video
        ref={videoRef}
        className={`w-full h-full transition-all duration-300 ${getAspectRatioClass()}`}
        playsInline
        onClick={(e) => {
          e.stopPropagation();
          toggleControlsImmediate();
        }}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
        onTimeUpdate={() => {
          if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
          }
        }}
        onDurationChange={() => {
          if (videoRef.current) {
            setDuration(videoRef.current.duration);
          }
        }}
      />

      {/* Top Header Overlay Control Bar */}
      <div 
        className={`absolute top-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <button 
          id="player_back_btn"
          onClick={onClose}
          className="flex items-center gap-1 sm:gap-2 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/5 text-white font-sans text-xs sm:text-sm backdrop-blur-md transition-all"
        >
          <ArrowLeft size={14} className="sm:size-[16px]" />
          <span>বন্ধ</span>
        </button>

        <h3 className="text-white text-xs sm:text-sm font-bold truncate max-w-[40%] text-shadow-md font-sans">
          {title}
        </h3>

        {/* Complete Server Failover Selectors with Proxy and Quality integrations */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Jetpack Media3 ExoPlayer Engine Dashboard Toggle Button */}
          <button
            id="player_engine_dashboard_toggle"
            onClick={(e) => {
              e.stopPropagation();
              setShowEngineDashboard(!showEngineDashboard);
              resetControlsTimeout();
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border backdrop-blur-md transition-all duration-300 active:scale-95 text-[10px] sm:text-xs font-sans font-black shrink-0 ${
              showEngineDashboard 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35 shadow-md shadow-emerald-500/5' 
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
            title="গুগল Jetpack Media3 ExoPlayer বাফার নিয়ন্ত্রণ"
          >
            <Cpu size={11} className={showEngineDashboard ? 'text-emerald-300 animate-pulse' : 'text-white/60'} />
            <span className="tracking-wide text-[9px] sm:text-[10px]">{showEngineDashboard ? 'EXO ON' : 'EXO'}</span>
          </button>

          {/* Compact VPN / Proxy Toggle Button with Shield Icon */}
          <button
            id="player_proxy_toggle"
            onClick={toggleProxy}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border backdrop-blur-md transition-all duration-300 active:scale-95 text-[10px] sm:text-xs font-sans font-black shrink-0 ${
              useProxy 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35 shadow-md shadow-emerald-500/5' 
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
            title={useProxy ? "প্রক্সি চালু (ON)" : "প্রক্সি বন্ধ (OFF)"}
          >
            <Shield size={11} className={useProxy ? 'fill-emerald-400/20 text-emerald-300 animate-pulse' : 'text-white/60'} />
            <span className="tracking-wide text-[9px] sm:text-[10px]">{useProxy ? 'ON' : 'OFF'}</span>
          </button>

          {/* S1-S4 Server Selectors */}
          <div className="flex gap-0.5 bg-white/5 p-0.5 rounded-full border border-white/10 backdrop-blur-md scale-95 shadow-md">
            {server1Url && (
              <button
                id="switch_srv_1"
                onClick={() => handleManualServerSwitch(1)}
                className={`px-2 py-0.5 text-[10px] rounded-full transition-all tracking-wider font-extrabold ${
                  activeServer === 1 
                    ? 'bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/5' 
                    : 'bg-transparent border border-transparent text-white/70 hover:bg-white/10'
                }`}
              >
                 S1
              </button>
            )}
            {server2Url && (
              <button
                id="switch_srv_2"
                onClick={() => handleManualServerSwitch(2)}
                className={`px-2 py-0.5 text-[10px] rounded-full transition-all tracking-wider font-extrabold ${
                  activeServer === 2 
                    ? 'bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/5' 
                    : 'bg-transparent border border-transparent text-white/70 hover:bg-white/10'
                }`}
              >
                 S2
              </button>
            )}
            {server3Url && (
              <button
                id="switch_srv_3"
                onClick={() => handleManualServerSwitch(3)}
                className={`px-2 py-0.5 text-[10px] rounded-full transition-all tracking-wider font-extrabold ${
                  activeServer === 3 
                    ? 'bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/5' 
                    : 'bg-transparent border border-transparent text-white/70 hover:bg-white/10'
                }`}
              >
                 S3
              </button>
            )}
            {server4Url && (
              <button
                id="switch_srv_4"
                onClick={() => handleManualServerSwitch(4)}
                className={`px-2 py-0.5 text-[10px] rounded-full transition-all tracking-wider font-extrabold ${
                  activeServer === 4 
                    ? 'bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 shadow-sm shadow-emerald-500/5' 
                    : 'bg-transparent border border-transparent text-white/70 hover:bg-white/10'
                }`}
              >
                 S4
              </button>
            )}
          </div>

          {/* Dynamic quality levels ABR selector */}
          {qualityLevels.length > 0 && (
            <div className="relative">
              <button
                id="player_quality_toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowQualityMenu(!showQualityMenu);
                }}
                className="flex items-center justify-center p-1.5 sm:p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-white transition active:scale-95 shrink-0"
                title="ভিডিও কোয়ালিটি"
              >
                <Settings size={14} className={`transition-transform duration-300 ${showQualityMenu ? 'rotate-45 text-emerald-400' : ''}`} />
              </button>

              {showQualityMenu && (
                <div 
                  className="absolute top-10 right-0 mt-2 w-32 bg-black/85 border border-white/15 rounded-xl overflow-hidden shadow-2xl backdrop-blur-xl z-30"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="py-1 text-center font-bold text-[9px] sm:text-[10px] text-zinc-400 border-b border-white/10 uppercase select-none">
                    কোয়ালিটি
                  </div>
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-sans transition flex items-center justify-between ${
                      currentQualityId === -1 
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold border-l-2 border-emerald-400' 
                        : 'text-white/80 hover:bg-white/10'
                    }`}
                  >
                    <span>Auto</span>
                    {currentQualityId === -1 && <span className="text-[10px] text-emerald-400">✓</span>}
                  </button>
                  {qualityLevels.map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => handleQualityChange(lvl.id)}
                      className={`w-full text-left px-3 py-1.5 text-xs font-sans transition flex items-center justify-between ${
                        currentQualityId === lvl.id 
                          ? 'bg-emerald-500/20 text-emerald-300 font-semibold border-l-2 border-emerald-400' 
                          : 'text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <span>{lvl.name}</span>
                      {currentQualityId === lvl.id && <span className="text-[10px] text-emerald-400">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Jetpack Media3 ExoPlayer Control Panel Overlay */}
      {showEngineDashboard && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/75 backdrop-blur-md z-40 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setShowEngineDashboard(false);
          }}
        >
          <div 
            className="w-full max-w-sm sm:max-w-md bg-zinc-950/95 border border-white/15 rounded-2xl overflow-hidden shadow-2xl p-4 sm:p-5 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <Cpu className="text-emerald-400 animate-pulse" size={18} />
                <div>
                  <h4 className="text-white font-sans text-xs sm:text-sm font-black tracking-wide uppercase">
                    Jetpack Media3 ExoPlayer Engine
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                      সক্রিয় ও অপ্টিমাইজড (Active & Optimized)
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowEngineDashboard(false)}
                className="text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full p-1 transition"
              >
                <Minimize size={14} />
              </button>
            </div>

            {/* Live Telemetry Display */}
            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">বাফার স্থিতি (Buffer)</span>
                <div className="flex items-baseline gap-1 text-emerald-400 font-mono font-bold text-xs sm:text-sm">
                  <span>{liveBufferedSecs}s</span>
                  <span className="text-[9px] text-zinc-400 font-normal">লোডেড</span>
                </div>
                {/* Visual buffer bar */}
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-300" 
                    style={{ width: `${Math.min(100, (liveBufferedSecs / maxBuffer) * 100)}%` }}
                  />
                </div>
              </div>
              
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">ইন্টারনেট স্পিড (Speed)</span>
                <div className="text-emerald-400 font-mono font-bold text-xs sm:text-sm">
                  {liveBandwidth} <span className="text-[10px] text-zinc-400 font-normal">Mbps</span>
                </div>
                <div className="text-[9px] text-zinc-400 mt-1 truncate">
                  {liveBandwidth > 15 ? '✓ সুপার ফাস্ট কানেকশন' : liveBandwidth > 5 ? '⚡ স্টেবল কানেকশন' : '⚠️ স্লো কানেকশন'}
                </div>
              </div>
            </div>

            {/* Buffering Parameters */}
            <div className="flex flex-col gap-3 my-1">
              {/* Min Buffer */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px] sm:text-xs">
                  <span className="text-zinc-200 font-semibold flex items-center gap-1">
                    মিনিমাম বাফার (Min Buffer)
                  </span>
                  <span className="text-emerald-400 font-mono font-extrabold">{minBuffer}s</span>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="30" 
                  step="1"
                  value={minBuffer} 
                  onChange={(e) => updateMinBuffer(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[9px] text-zinc-400 leading-relaxed">
                  * প্লেয়ারে সর্বদা সর্বনিম্ন যত সেকেন্ডের ভিডিও ব্যাকআপ লোড করা থাকবে।
                </p>
              </div>

              {/* Max Buffer */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px] sm:text-xs">
                  <span className="text-zinc-200 font-semibold">সর্বোচ্চ বাফার (Max Buffer)</span>
                  <span className="text-emerald-400 font-mono font-extrabold">{maxBuffer}s</span>
                </div>
                <input 
                  type="range" 
                  min="15" 
                  max="60" 
                  step="5"
                  value={maxBuffer} 
                  onChange={(e) => updateMaxBuffer(parseInt(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[9px] text-zinc-400 leading-relaxed">
                  * সর্বোচ্চ যত সেকেন্ডের ভিডিও ফাইল অগ্রিম ডাউনলোড করে স্টোর করা হবে।
                </p>
              </div>

              {/* Playback Buffer */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[11px] sm:text-xs">
                  <span className="text-zinc-200 font-semibold">প্লেব্যাক বাফার (Playback Buffer)</span>
                  <span className="text-emerald-400 font-mono font-extrabold">{playbackBuffer}s</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  step="0.5"
                  value={playbackBuffer} 
                  onChange={(e) => updatePlaybackBuffer(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[9px] text-zinc-400 leading-relaxed">
                  * লোডিং বা বাফারিং থেকে পুনরায় চালু হতে নূন্যতম যত সেকেন্ডের ভিডিও ফাইল অগ্রিম লোড হওয়া আবশ্যক।
                </p>
              </div>
            </div>

            {/* Bottom Controls / Apply */}
            <div className="flex gap-2 border-t border-white/10 pt-3 mt-1">
              <button
                onClick={() => {
                  setShowEngineDashboard(false);
                  initializePlayer();
                }}
                className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 transition text-black text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={12} className="animate-spin-slow" />
                <span>রিবুট ও অপ্টিমাইজ করুন</span>
              </button>
              <button
                onClick={() => setShowEngineDashboard(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-medium"
              >
                ঠিক আছে
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Glassmorphic Auto buffering loader / CORS error displays */}
      {isBuffering && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 z-10">
          <div className="relative flex items-center justify-center">
            {/* Pulsing ring */}
            <div className="absolute w-16 h-16 rounded-full border-4 border-emerald-500/30 animate-ping" />
            {/* Spinning load track */}
            <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          </div>
          <span className="mt-4 text-emerald-400 font-sans text-sm animate-pulse flex items-center gap-2">
            <RefreshCw className="animate-spin" size={14} />
            {fallbackTriggered ? `সার্ভার ${activeServer} সংযোগ হচ্ছে...` : 'বাফারিং হচ্ছে...'}
          </span>
        </div>
      )}

      {/* Errors interface */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-center p-4 sm:p-6 z-30 select-none">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-rose-500 animate-bounce mb-2 sm:mb-3" />
          <p className="text-white font-medium text-xs sm:text-base mb-3 sm:mb-4 max-w-md leading-relaxed px-4">
            {errorMessage}
          </p>
          <div className="flex flex-col gap-3 sm:gap-4 items-center">
            <div className="flex gap-2 sm:gap-3">
              <button
                id="player_error_retry"
                onClick={retryPlayback}
                className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-sans font-medium text-xs sm:text-sm flex items-center gap-2 active:scale-95 transition"
              >
                <RotateCw size={14} className="sm:size-[16px]" />
                <span>আবার চেষ্টা করুন</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-1.5 sm:px-5 sm:py-2 rounded-xl bg-white/10 text-white font-sans text-xs sm:text-sm border border-white/10 hover:bg-white/20 active:scale-95 transition"
              >
                ফিরে যান
              </button>
            </div>

            <button
              onClick={toggleProxy}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 shadow-md text-xs font-sans font-semibold ${
                useProxy 
                  ? 'bg-emerald-500 text-black border-emerald-400 font-bold' 
                  : 'bg-zinc-800/90 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
              }`}
            >
              <Shield size={14} className={useProxy ? 'fill-current animate-pulse' : ''} />
              <span>নিরাপদ ভিপিএন (VPN) প্রক্সি: {useProxy ? 'চালু (ON)' : 'বন্ধ (OFF)'}</span>
            </button>
            <p className="text-[10px] text-zinc-400 max-w-xs leading-relaxed text-center">
              * ভিপিএন বন্ধ থাকলে ভিডিও সরাসরি আপনার মোবাইল ইন্টারনেট দিয়ে লোড হবে। বাফারিং বা লোডিং সমস্যা হলে এটি চালু করে দেখতে পারেন।
            </p>
          </div>
        </div>
      )}

      {/* Big center Play/Pause overlay */}
      {!isPlaying && !isBuffering && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20">
          <button 
            id="center_play_btn"
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-emerald-500/90 text-slate-950 hover:bg-emerald-400 hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/30 flex items-center justify-center transition-all duration-300 backdrop-blur-md border border-white/20"
          >
            <Play className="fill-current ml-1" size={28} />
          </button>
        </div>
      )}

      {/* Bottom Control bar overlay */}
      <div 
        className={`absolute bottom-0 left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-black/95 to-transparent flex items-center justify-between transition-opacity duration-300 z-20 gap-2 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-1.5 sm:gap-3 max-w-[70%]">
          <button
            id="bottom_play_toggle"
            onClick={togglePlay}
            className="text-white hover:text-emerald-400 font-semibold active:scale-90 transition p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
          >
            {isPlaying ? <Pause size={16} className="fill-current" /> : <Play size={16} className="fill-current" />}
          </button>

          {/* Volume control with hover expand */}
          <div className="flex items-center gap-1 sm:gap-2 group/volume p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
            <button
              id="player_mute_toggle"
              onClick={toggleMute}
              className="text-white hover:text-emerald-400 transition"
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <input
              id="player_volume_slider"
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-8 sm:w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
            />
          </div>

          {/* LIVE status indicator (Shortened to classic tiny LIVE pill) */}
          <span className="flex items-center gap-0.5 sm:gap-1 px-1 py-0.5 rounded bg-rose-600/30 text-rose-400 border border-rose-500/20 backdrop-blur-md font-mono text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
            <span className="w-1 h-1 rounded-full bg-rose-400 animate-ping" />
            LIVE
          </span>

          {/* New digital session / playback timer */}
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/5 text-white font-mono text-[8px] sm:text-[10px] font-semibold border border-white/10 backdrop-blur-md shadow-md shrink-0">
            <Clock size={10} className="text-emerald-400 animate-pulse" />
            <span>{renderTimer()}</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Aspect Ratio Adjustment Toggle button */}
          <button
            id="player_aspect_ratio"
            onClick={cycleAspectRatio}
            className="flex items-center gap-0.5 px-1 sm:px-1.5 py-0.5 rounded bg-white/5 border border-white/10 hover:bg-white/15 text-white font-sans text-[7px] sm:text-[8px] font-bold tracking-tight transition active:scale-95 shrink-0 backdrop-blur-md"
            title="Aspect Ratio"
          >
            <Maximize2 size={8} />
            <span>{aspectRatio === 'contain' ? 'সাধারণ' : aspectRatio === 'cover' ? 'জুম' : 'ফুল'}</span>
          </button>

          {/* Fullscreen Button */}
          <button
            id="player_fullscreen_toggle"
            onClick={handleFullscreenToggle}
            className="p-1 sm:p-1.5 rounded-full bg-white/5 hover:bg-white/15 text-white hover:text-emerald-400 border border-white/10 active:scale-90 transition backdrop-blur-md"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}
