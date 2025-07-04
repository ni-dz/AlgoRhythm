"use client";

import Head from "next/head";
import dynamic from "next/dynamic";
import styles from "./Home.module.css";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { useState, useEffect } from "react";

const TinderCard = dynamic(() => import("react-tinder-card"), { ssr: false });

const DRAG_TYPE_SELECTION = "SONG_SELECTION";
const DRAG_TYPE_LIST = "SONG_LIST";

const initialMood = {
  Acousticness: 0.5,
  Danceability: 0.5,
  Energy: 0.5,
  Instrumentalness: 0.5,
  Valence: 0.5,
  Tempo: 125,
  Liveness: 0.5,
  Loudness: -25,
  Speechiness: 0.5,
};

const moodDescriptions = {
  Acousticness: "Confidence measure of whether a track is acoustic (1 = yes).",
  Danceability:
    "Describes how suitable a track is for dancing based on tempo and rhythm stability.",
  Energy:
    "Measures intensity and activity. Energetic tracks feel fast, loud, and noisy.",
  Instrumentalness:
    "Likelihood a track contains no vocals. Closer to 1 means more instrumental.",
  Valence: "Describes musical positiveness. High = happy, low = sad or angry.",
  Tempo: "Speed of the track in beats per minute (BPM).",
  Liveness:
    "Detects the presence of an audience. Higher means more 'live' sounding.",
  Loudness: "Overall loudness in decibels (dB). Higher = louder.",
  Speechiness: "Detects the presence of spoken words in the track.",
};

export default function Home() {
  const [screen, setScreen] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSongs, setSelectedSongs] = useState([]);
  const [allSongs, setAllSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mood, setMood] = useState(initialMood);
  const [recommendationList, setRecommendationList] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const [acceptedSongs, setAcceptedSongs] = useState([]);
  const [averageVector, setAverageVector] = useState([]);
  const [swipePool, setSwipePool] = useState([]); // alle noch nicht geswipten Songs
  const [swipeCount, setSwipeCount] = useState(0);
  const [rejectedSongs, setRejectedSongs] = useState([]);

  const fetchSongs = async (query = "") => {
    const res = await fetch(
      `/api/songs${query ? `?q=${encodeURIComponent(query)}` : ""}`
    );
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let loaded = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop();
      for (const line of lines) {
        try {
          const song = JSON.parse(line);
          loaded.push(song);
        } catch {}
      }
    }
    setAllSongs(loaded);
    setScreen(1);
  };

  useEffect(() => {
    fetchSongs();
  }, []);
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchSongs(searchTerm);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const keys = [
    "Danceability",
    "Energy",
    "Loudness",
    "Speechiness",
    "Acousticness",
    "Instrumentalness",
    "Liveness",
    "Valence",
    "Tempo",
  ];

  const normalize = (val, min, max) => (val - min) / (max - min);

  const cosineSim = (a, b) => {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (magA * magB);
  };

  const computeRecommendation = () => {
    const moodVec = keys.map((key) => {
      const val = mood[key];
      if (key === "Tempo") return normalize(val, 0, 250);
      if (key === "Loudness") return normalize(val, -60, 7.234);
      return val;
    });
    const songVecs = selectedSongs.map((song) =>
      keys.map((key) => song[key.toLowerCase()])
    );
    const avgVec = keys.map((_, i) => {
      const vals = [moodVec[i], ...songVecs.map((s) => s[i])];
      return vals.reduce((sum, v) => sum + v, 0) / vals.length;
    });

    const cosineSim = (a, b) => {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dot / (magA * magB);
    };

    const candidates = allSongs.filter(
      (s) => !selectedSongs.find((sel) => sel.id === s.id)
    );
    const sims = candidates.map((song) => {
      const vec = keys.map((key) => song[key.toLowerCase()]);
      return { song, sim: cosineSim(avgVec, vec) };
    });
    sims.sort((a, b) => b.sim - a.sim);
    setRecommendationList(sims.slice(0, 10).map((s) => s.song));
    setCurrentIndex(0);
  };

  const getTop1Recommendation = (avgVec, pool) => {
    const cosineSim = (a, b) => {
      const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
      const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
      const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
      return dot / (normA * normB);
    };

    const scored = allFiltered
      .filter((s) => s.url) // <--- sicherstellen, dass die URL vorhanden ist
      .map((song) => {
        const vec = keys.map((key) => song[key.toLowerCase()]);
        const score = (vec, averageList);
        return { ...song, score };
      });

    scored.sort((a, b) => b.score - a.score);
    return scored.length > 0 ? scored[0].song : null;
  };

  const handleSwipe = (liked) => {
    if (liked)
      setLikedSongs((prev) => [...prev, recommendationList[currentIndex]]);
    const next = currentIndex + 1;
    if (next < recommendationList.length) setCurrentIndex(next);
    else setScreen(3);
  };

  const filteredSongs = allSongs
    .filter((s) => s.name && s.artist && s.url)
    .sort((a, b) => a.name.localeCompare(b.name));

  const moveSong = (dragIndex, hoverIndex) => {
    const updated = [...selectedSongs];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, removed);
    setSelectedSongs(updated);
    cosineSim;
  };

  const handleAddSong = (song) => {
    if (
      selectedSongs.length < 3 &&
      !selectedSongs.find((s) => s.id === song.id)
    ) {
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const handleDrop = (isAccepted) => {
    const song = swipeSongs[currentIndex];
    if (isAccepted) {
      setAcceptedSongs((prev) => [...prev, song]);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < swipeSongs.length) {
      setCurrentIndex(nextIndex);
    } else {
      setScreen(3);
    }
  };

  const DraggableSong = ({ song, index, isInSelection = false }) => {
    const [{ isDragging }, drag] = useDrag(
      () => ({
        type: isInSelection ? DRAG_TYPE_SELECTION : DRAG_TYPE_LIST,
        item: { song, index },
        collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
      }),
      [song, index]
    );

    const [, drop] = useDrop({
      accept: DRAG_TYPE_SELECTION,
      hover: (item) => {
        if (isInSelection && item.index !== index) {
          moveSong(item.index, index);
          item.index = index;
        }
      },
    });

    return (
      <div
        ref={isInSelection ? (node) => drag(drop(node)) : drag}
        className={styles.draggableSong}
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        {song.name} - {song.artist}
      </div>
    );
  };

  const DropZone = () => {
    const [, drop] = useDrop({
      accept: DRAG_TYPE_LIST,
      drop: (item) => handleAddSong(item.song),
    });

    return (
      <div ref={drop} className={styles.dropZone}>
        <h4>Deine Auswahl ({selectedSongs.length}/3)</h4>
        {selectedSongs.map((song, index) => (
          <DraggableSong
            key={song.id}
            song={song}
            index={index}
            isInSelection={true}
          />
        ))}
      </div>
    );
  };

  const TrashZone = () => {
    const [, drop] = useDrop({
      accept: DRAG_TYPE_SELECTION,
      drop: (item) => {
        setSelectedSongs((prev) => prev.filter((s) => s.id !== item.song.id));
      },
    });

    return (
      <div ref={drop} className={styles.trashZone}>
        Hierhin ziehen zum Entfernen
      </div>
    );
  };

  const DraggableCard = ({ song }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
      type: "SONG_CARD",
      item: { song },
      collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
    }));

    return (
      <div
        ref={drag}
        className={styles.videoCard}
        style={{ opacity: isDragging ? 0.5 : 1 }}
      >
        <iframe
          title={`spotify-track-${song.id}`}
          src={`${song.url}&theme=0&transparent=true`}
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </div>
    );
  };

  const SwipeDropZone = ({ type, onDrop, children }) => {
    const [{ isOver }, drop] = useDrop(() => ({
      accept: "SONG_CARD",
      drop: () => onDrop(type === "accept"),
      collect: (monitor) => ({ isOver: !!monitor.isOver() }),
    }));

    return (
      <div
        ref={drop}
        className={`${styles.dropArea} ${
          type === "accept" ? styles.acceptZone : styles.rejectZone
        } ${isOver ? styles.active : ""}`}
      >
        {children}
      </div>
    );
  };

  const getEmoji = (key, value) => {
    switch (key) {
      case "Energy":
        return value < 0.33 ? "😴" : value < 0.66 ? "😐" : "⚡️";
      case "Valence":
        return value < 0.33 ? "😢" : value < 0.66 ? "😐" : "😄";
      case "Danceability":
        return value < 0.33 ? "🪩" : value < 0.66 ? "💃" : "🕺";
      case "Loudness":
        return value < -40 ? "🤫" : value < -10 ? "🔈" : "🔊";
      case "Speechiness":
        return value < 0.33 ? "🤐" : value < 0.66 ? "🗣️" : "🎤";
      case "Acousticness":
        return value < 0.33 ? "🎸" : value < 0.66 ? "🎻" : "🌿";
      case "Instrumentalness":
        return value < 0.33 ? "🎶" : value < 0.66 ? "🎷" : "🔇";
      case "Liveness":
        return value < 0.33 ? "🏠" : value < 0.66 ? "👥" : "👨‍🎤";
      case "Tempo":
        return value < 90 ? "🐢" : value < 150 ? "🚶" : "🏃";
      default:
        return "";
    }
  };

  const renderMoodSliders = () => (
    <div className={styles.moodSliders}>
      <h3> Trage hier deine aktuelle Stimmung ein:</h3>
      {Object.keys(mood).map((key) => {
        const { min, max, step } =
          key === "Danceability"
            ? { min: 0, max: 1, step: 0.01 }
            : key === "Energy"
            ? { min: 0, max: 1, step: 0.01 }
            : key === "Loudness"
            ? { min: -60, max: 7.234, step: 0.1 }
            : key === "Speechiness"
            ? { min: 0, max: 1, step: 0.01 }
            : key === "Acousticness"
            ? { min: 0, max: 1, step: 0.01 }
            : key === "Instrumentalness"
            ? { min: 0, max: 1, step: 0.01 }
            : key === "Liveness"
            ? { min: 0, max: 1, step: 0.01 }
            : key === "Valence"
            ? { min: 0, max: 1, step: 0.01 }
            : key === "Tempo"
            ? { min: 0, max: 250, step: 1 }
            : { min: 0, max: 1, step: 0.01 }; // Fallback

        return (
          <div key={key} className={styles.sliderGroup}>
            <label htmlFor={key}>{key}</label>
            <p className={styles.sliderDescription}>{moodDescriptions[key]}</p>
            <input
              type="range"
              id={key}
              min={min}
              max={max}
              step={step}
              value={mood[key]}
              onChange={(e) =>
                setMood((prev) => ({
                  ...prev,
                  [key]: parseFloat(e.target.value),
                }))
              }
            />
            <span className={styles.emoji}>
              {getEmoji(key, mood[key])} {mood[key].toFixed(2)}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <DndProvider backend={HTML5Backend}>
      <div className={styles.container}>
        <Head>
          <title>AlgoRhythm</title>
          <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        </Head>

        <main className={styles.main}>
          <img
            src="/logo.png" // Passe den Pfad zu deinem Bild an!
            alt="AlgoRhythm Logo"
            className={styles.logo}
          />

          {screen === 0 && (
            <div className={styles.card}>
              <h2>📦 Lade zufällige Songs...</h2>
              <p>Lade Datenbankinhalte...</p>
            </div>
          )}

          {screen === 1 && (
            <div className={styles.card}>
              {renderMoodSliders()}
              <h2>Wähle deine Top 3 Songs passend zu deinem Mood:</h2>
              <input
                type="text"
                placeholder="Song suchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.input}
              />
              <div className={styles.selectionLayout}>
                <div className={styles.songList}>
                  {filteredSongs.map((song) => (
                    <DraggableSong key={song.id} song={song} />
                  ))}
                </div>
                <div className={styles.selectionColumn}>
                  <DropZone />
                  <TrashZone />
                </div>
              </div>
              {selectedSongs.length === 3 && (
                <button
                  className={styles.primaryButton}
                  onClick={async () => {
                    const keys = [
                      "Danceability",
                      "Energy",
                      "Loudness",
                      "Speechiness",
                      "Acousticness",
                      "Instrumentalness",
                      "Liveness",
                      "Valence",
                      "Tempo",
                    ];

                    const normalize = (val, min, max) =>
                      (val - min) / (max - min);

                    const moodList = keys.map((key) => {
                      const value = mood[key];
                      if (key === "Tempo") return normalize(value, 0, 250);
                      if (key === "Loudness")
                        return normalize(value, -60, 7.234);
                      return value;
                    });

                    const songVecs = selectedSongs.map((song) =>
                      keys.map((key) => song[key.toLowerCase()])
                    );

                    const avgVec = keys.map((_, i) => {
                      const values = [
                        moodList[i],
                        ...songVecs.map((s) => s[i]),
                      ];
                      return (
                        values.reduce((sum, val) => sum + val, 0) /
                        values.length
                      );
                    });

                    const cosineSim = (a, b) => {
                      const dot = a.reduce(
                        (sum, val, i) => sum + val * b[i],
                        0
                      );
                      const magA = Math.sqrt(
                        a.reduce((sum, val) => sum + val * val, 0)
                      );
                      const magB = Math.sqrt(
                        b.reduce((sum, val) => sum + val * val, 0)
                      );
                      return dot / (magA * magB);
                    };

                    const pool = allSongs.filter(
                      (s) =>
                        !selectedSongs.find((sel) => sel.id === s.id) &&
                        !likedSongs.find((liked) => liked.id === s.id) &&
                        !rejectedSongs.find((rej) => rej.id === s.id) &&
                        s.url
                    );

                    const scored = pool.map((song) => {
                      const vec = keys.map((key) => song[key.toLowerCase()]);
                      return { ...song, score: cosineSim(avgVec, vec) }; // ✅ avgVec ist richtig
                    });

                    scored.sort((a, b) => b.score - a.score);

                    setAverageVector(avgVec);
                    setSwipePool(pool);
                    setRecommendationList(scored.slice(0, 10));
                    setCurrentIndex(0);
                    setLikedSongs([]);
                    setScreen(2);
                  }}
                >
                  ➔ Weiter
                </button>
              )}
            </div>
          )}

          {screen === 2 && (
            <div className={styles.card}>
              <h2>Gefällt dir der Song?</h2>

              {/* Fortschrittsanzeige */}
              {recommendationList.length > 0 && (
                <div className={styles.progressContainer}>
                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${(swipeCount / 10) * 100}%` }}
                    ></div>
                  </div>
                  <div className={styles.progressText}>
                    {swipeCount} von 10 Songs geswiped (
                    {Math.round(
                      (swipeCount / recommendationList.length) * 100
                    )}
                    %)
                  </div>
                </div>
              )}

              {/* Swipe-Zonen */}
              <div className={styles.swipeStage}>
                <SwipeDropZone
                  type="reject"
                  onDrop={() => {
                    const rejected = recommendationList[currentIndex];
                    setRejectedSongs((prev) => [...prev, rejected]);

                    // Neues: entferne den abgelehnten Song aus dem Pool und aktualisiere die Liste
                    const updatedPool = swipePool.filter(
                      (s) => s.id !== rejected.id
                    );
                    const rescored = updatedPool.map((song) => {
                      const vec = keys.map((key) => song[key.toLowerCase()]);
                      const score = cosineSim(averageVector, vec);
                      return { ...song, score };
                    });
                    rescored.sort((a, b) => b.score - a.score);

                    setSwipePool(updatedPool);
                    setRecommendationList(rescored.slice(0, 10));
                    setSwipeCount((prev) => {
                      const next = prev + 1;
                      if (next >= 10) {
                        setScreen(3);
                      }
                      return next;
                    });
                    setCurrentIndex(0);

                    if (rescored.length === 0) setScreen(3);

                    console.log(
                      "Aktueller Durchschnittsvektor (left swiped):",
                      averageVector
                    );
                  }}
                >
                  ✖️
                </SwipeDropZone>

                {currentIndex < recommendationList.length && (
                  <DraggableCard song={recommendationList[currentIndex]} />
                )}
                <SwipeDropZone
                  type="accept"
                  onDrop={() => {
                    const liked = recommendationList[currentIndex];
                    setLikedSongs((prev) => [...prev, liked]);

                    const vec = keys.map((key) => liked[key.toLowerCase()]);
                    const all = [...likedSongs, liked];
                    const allVecs = all.map((song) =>
                      keys.map((key) => song[key.toLowerCase()])
                    );

                    const newAvg = keys.map((_, i) => {
                      const vals = allVecs.map((v) => v[i]);
                      return (
                        vals.reduce((sum, val) => sum + val, 0) / vals.length
                      );
                    });

                    const updatedPool = swipePool.filter(
                      (s) => s.id !== liked.id
                    );
                    const rescored = updatedPool.map((song) => {
                      const vec = keys.map((key) => song[key.toLowerCase()]);
                      const score = cosineSim(newAvg, vec);
                      return { ...song, score };
                    });

                    rescored.sort((a, b) => b.score - a.score);

                    setAverageVector(newAvg);
                    console.log(
                      "Neuer Durchschnittsvektor (right swiped):",
                      newAvg
                    );
                    setSwipePool(updatedPool);
                    setRecommendationList(rescored.slice(0, 10));
                    setSwipeCount((prev) => {
                      const next = prev + 1;
                      if (next >= 10) {
                        setScreen(3);
                      }
                      return next;
                    });
                    setCurrentIndex(0);

                    if (rescored.length === 0) setScreen(3);
                  }}
                >
                  ✔️
                </SwipeDropZone>
              </div>

              <button
                className={styles.primaryButton}
                onClick={() => {
                  setScreen(1);
                  setSelectedSongs([]);
                  setCurrentIndex(0);
                  setAcceptedSongs([]); // Reset
                }}
              >
                Abbrechen
              </button>
            </div>
          )}

          {screen === 3 && (
            <div className={styles.card}>
              <h1> Deine Favoriten</h1>
              {likedSongs.length === 0 ? (
                <p>Du hast keine Songs nach rechts geswiped.</p>
              ) : (
                <div className={styles.songGrid}>
                  {likedSongs.map((song) => (
                    <div key={song.id} className={styles.videoCard}>
                      <iframe
                        title={`spotify-track-${song.id}`}
                        src={`${song.url}&theme=0&transparent=true`}
                        width="100%"
                        height="152"
                        frameBorder="0"
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                      ></iframe>
                    </div>
                  ))}
                </div>
              )}
              <button
                className={styles.primaryButton}
                onClick={() => {
                  setScreen(1);
                  setSelectedSongs([]);
                  setCurrentIndex(0);
                  setAcceptedSongs([]); // Reset
                }}
              >
                Erneut starten
              </button>
            </div>
          )}
        </main>
      </div>
    </DndProvider>
  );
}
