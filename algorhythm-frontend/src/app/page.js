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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [allSongs, setAllSongs] = useState([]);
  const [mood, setMood] = useState(initialMood);

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

  const filteredSongs = allSongs
    .filter((s) => s.name && s.artist && s.url)
    .sort((a, b) => a.name.localeCompare(b.name));

  const moveSong = (dragIndex, hoverIndex) => {
    const updated = [...selectedSongs];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(hoverIndex, 0, removed);
    setSelectedSongs(updated);
  };

  const handleAddSong = (song) => {
    if (
      selectedSongs.length < 3 &&
      !selectedSongs.find((s) => s.id === song.id)
    ) {
      setSelectedSongs([...selectedSongs, song]);
    }
  };

  const handleDrop = () => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < selectedSongs.length) {
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
        🗑️ Hierhin ziehen zum Entfernen
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
            <span>{mood[key]}</span>
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
        </Head>

        <main className={styles.main}>
          <h1 className={styles.headline}>AlgoRhythm 🎶</h1>

          {screen === 0 && (
            <div className={styles.card}>
              <h2>📦 Lade zufällige Songs...</h2>
              <p>Lade Datenbankinhalte...</p>
            </div>
          )}

          {screen === 1 && (
            <div className={styles.card}>
              {renderMoodSliders()}
              <h2>Wähle deine Top 3 Songs passend zu deinem Mood</h2>
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
                  onClick={() => {
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

                    // ✅ Mood normalisieren
                    const moodList = keys.map((key) => {
                      const value = mood[key];
                      if (key === "Tempo") return normalize(value, 0, 250);
                      if (key === "Loudness")
                        return normalize(value, -60, 7.234);
                      return value;
                    });

                    // ✅ Songs NICHT normalisieren (sind schon normalisiert in DB!)
                    const songLists = selectedSongs.map((song) =>
                      keys.map((key) => song[key.toLowerCase()])
                    );

                    const averageList = keys.map((_, i) => {
                      const values = [
                        moodList[i],
                        ...songLists.map((s) => s[i]),
                      ];
                      return (
                        values.reduce((sum, val) => sum + val, 0) /
                        values.length
                      );
                    });

                    console.log("🎯 Aktueller Mood (normalisiert):", moodList);
                    songLists.forEach((list, idx) => {
                      console.log(`🎵 Song ${idx + 1} (normalisiert):`, list);
                    });
                    console.log(
                      "📊 Durchschnitt aus Mood & Songs (normalisiert):",
                      averageList
                    );

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
              <h2>🎧 Swipen: Gefällt dir der Song?</h2>
              <div className={styles.swipeStage}>
                <SwipeDropZone type="reject" onDrop={handleDrop}>
                  ✖️
                </SwipeDropZone>
                {currentIndex < selectedSongs.length && (
                  <DraggableCard song={selectedSongs[currentIndex]} />
                )}
                <SwipeDropZone type="accept" onDrop={handleDrop}>
                  ✔️
                </SwipeDropZone>
              </div>
            </div>
          )}

          {screen === 3 && (
            <div className={styles.card}>
              <h2>✅ Danke für dein Feedback!</h2>
              <button
                className={styles.secondaryButton}
                onClick={() => {
                  setScreen(1);
                  setSelectedSongs([]);
                  setCurrentIndex(0);
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
