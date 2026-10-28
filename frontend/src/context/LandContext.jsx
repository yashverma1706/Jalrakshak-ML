import React, { createContext, useContext, useState, useEffect } from 'react';

const LandContext = createContext(null);

// Versioned key to ensure Barabanki, UP locations load fresh
const STORAGE_KEY_LANDS = 'jalrakshak_farmer_lands_v3';
const STORAGE_KEY_SELECTED = 'jalrakshak_selected_land_id_v3';
const STORAGE_KEY_HISTORY = 'jalrakshak_prediction_history_v3';

// Barabanki, Uttar Pradesh, India coordinates
const BARABANKI_DEFAULT_LAT = 26.93;
const BARABANKI_DEFAULT_LON = 81.18;

const DEFAULT_LANDS = [
  {
    id: 'land-1',
    name: 'Barabanki Central Farm (Tubewell)',
    locationName: 'Barabanki, Uttar Pradesh, India',
    areaAcres: 3.5,
    cropType: 'Rice',
    growthStage: 'Vegetative',
    soilType: 'Clay',
    latitude: 26.93,
    longitude: 81.18,
    soilMoisture: 22.0,
    latestPrediction: {
      need: 'High',
      action: 'REVIEW_RECOMMENDED',
      rainfall24h: 0.0,
      timestamp: new Date().toISOString(),
      reason: 'Low soil moisture for vegetative Rice on Clay soil in Barabanki.',
    },
  },
  {
    id: 'land-2',
    name: 'Dewa Sharif Block Field',
    locationName: 'Dewa, Barabanki, Uttar Pradesh, India',
    areaAcres: 5.0,
    cropType: 'Wheat',
    growthStage: 'Flowering',
    soilType: 'Loamy',
    latitude: 27.03,
    longitude: 81.16,
    soilMoisture: 38.0,
    latestPrediction: {
      need: 'Low',
      action: 'REVIEW_RECOMMENDED',
      rainfall24h: 0.0,
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      reason: 'Adequate soil moisture for flowering Wheat.',
    },
  },
  {
    id: 'land-3',
    name: 'Fatehpur Tehsil Farm',
    locationName: 'Fatehpur, Barabanki, Uttar Pradesh, India',
    areaAcres: 6.2,
    cropType: 'Sugarcane',
    growthStage: 'Vegetative',
    soilType: 'Silt',
    latitude: 27.02,
    longitude: 81.22,
    soilMoisture: 28.0,
    latestPrediction: null,
  },
  {
    id: 'land-4',
    name: 'Ram Sanehi Ghat Plot',
    locationName: 'Ram Sanehi Ghat, Barabanki, Uttar Pradesh, India',
    areaAcres: 2.5,
    cropType: 'Potato',
    growthStage: 'Sowing',
    soilType: 'Sandy',
    latitude: 26.75,
    longitude: 81.34,
    soilMoisture: 19.0,
    latestPrediction: null,
  },
];

export function LandProvider({ children }) {
  const [lands, setLands] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LANDS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed reading lands from storage', e);
    }
    return DEFAULT_LANDS;
  });

  const [selectedLandId, setSelectedLandId] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SELECTED);
      if (saved && lands.some((l) => l.id === saved)) return saved;
    } catch {}
    return lands[0]?.id || '';
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_HISTORY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LANDS, JSON.stringify(lands));
    } catch (e) {
      console.warn('Failed saving lands', e);
    }
  }, [lands]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SELECTED, selectedLandId);
    } catch {}
  }, [selectedLandId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    } catch {}
  }, [history]);

  const selectedLand = lands.find((l) => l.id === selectedLandId) || lands[0] || null;

  function addLand(newLandData) {
    const newId = 'land-' + Date.now();
    const newLand = {
      ...newLandData,
      id: newId,
      locationName: newLandData.locationName || 'Barabanki, Uttar Pradesh, India',
      soilMoisture: Number(newLandData.soilMoisture) || 25,
      areaAcres: Number(newLandData.areaAcres) || 1,
      latitude: Number(newLandData.latitude) || BARABANKI_DEFAULT_LAT,
      longitude: Number(newLandData.longitude) || BARABANKI_DEFAULT_LON,
      latestPrediction: null,
    };
    setLands((prev) => [newLand, ...prev]);
    setSelectedLandId(newId);
    return newLand;
  }

  function updateLand(id, fields) {
    setLands((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...fields } : l))
    );
  }

  function deleteLand(id) {
    setLands((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      if (selectedLandId === id) {
        setSelectedLandId(updated[0]?.id || '');
      }
      return updated;
    });
  }

  function recordPrediction(landId, moisture, result) {
    const predictionSummary = {
      need: result.prediction?.irrigation_need || 'Unknown',
      action: result.decision?.action || 'REVIEW_RECOMMENDED',
      rainfall24h: result.weather?.rainfall_next_24h_mm ?? 0,
      temperature: result.weather?.temperature_c,
      humidity: result.weather?.humidity_percent,
      reason: result.decision?.reason || '',
      timestamp: new Date().toISOString(),
    };

    updateLand(landId, {
      soilMoisture: moisture,
      latestPrediction: predictionSummary,
    });

    const targetLand = lands.find((l) => l.id === landId);
    const historyItem = {
      id: 'hist-' + Date.now(),
      landId,
      landName: targetLand?.name || 'Land Plot',
      locationName: targetLand?.locationName || 'Barabanki, UP, India',
      cropType: targetLand?.cropType || 'N/A',
      soilType: targetLand?.soilType || 'N/A',
      growthStage: targetLand?.growthStage || 'N/A',
      moisture,
      prediction: predictionSummary,
      timestamp: new Date().toISOString(),
    };

    setHistory((prev) => [historyItem, ...prev.slice(0, 49)]);
  }

  return (
    <LandContext.Provider
      value={{
        lands,
        selectedLand,
        selectedLandId,
        setSelectedLandId,
        addLand,
        updateLand,
        deleteLand,
        recordPrediction,
        history,
      }}
    >
      {children}
    </LandContext.Provider>
  );
}

export function useLand() {
  const context = useContext(LandContext);
  if (!context) {
    throw new Error('useLand must be used within a LandProvider');
  }
  return context;
}
