/**
 * EcoSterile Dashboard - Main Application
 * Orchestrates all components and handles core logic
 */

import {
  authService,
  phService,
  pumpService,
  userService,
  systemService,
} from "../services/firebase.js";
import { weatherService } from "../services/weather.js";
import { HeaderComponent } from "../components/header.js";
import { StatusIndicatorComponent } from "../components/status-indicator.js";
import { PumpLogComponent } from "../components/pump-log.js";
import { CropCardsComponent } from "../components/crop-cards.js";

// ==========================================
// Global Application State
// ==========================================
const appState = {
  user: null,
  profile: null,
  currentCrop: null,
  phReadings: [],
  pumpLogs: [],
  systemStatus: {
    arduinoConnected: false,
    systemOnline: true,
    lastUpdate: new Date(),
    pumpStatus: "idle",
  },
  optimalPHMin: 6.5,
  optimalPHMax: 7.5,
  chart: null,
};

// ==========================================
// Crop Database
// ==========================================
const CROPS_DATABASE = [
  // Cereals
  { value: "rice", label: "Rice (Dhaan)", minPH: 5.5, maxPH: 6.5 },
  { value: "wheat", label: "Wheat (Gehun)", minPH: 6.0, maxPH: 7.5 },
  { value: "maize", label: "Maize/Corn", minPH: 5.5, maxPH: 7.5 },
  // Pulses
  { value: "chickpea", label: "Chickpea (Chana)", minPH: 6.0, maxPH: 7.5 },
  { value: "pigeon_pea", label: "Pigeon Pea (Arhar)", minPH: 5.5, maxPH: 7.0 },
  // Vegetables
  { value: "tomato", label: "Tomato", minPH: 5.5, maxPH: 6.8 },
  { value: "potato", label: "Potato", minPH: 5.0, maxPH: 6.0 },
  { value: "onion", label: "Onion", minPH: 6.0, maxPH: 7.0 },
  { value: "cabbage", label: "Cabbage", minPH: 6.0, maxPH: 7.5 },
  { value: "carrot", label: "Carrot", minPH: 6.0, maxPH: 7.0 },
  // Fruits
  { value: "mango", label: "Mango", minPH: 5.5, maxPH: 7.5 },
  { value: "banana", label: "Banana", minPH: 5.5, maxPH: 7.0 },
  { value: "apple", label: "Apple", minPH: 5.5, maxPH: 6.5 },
  // Cash Crops
  { value: "cotton", label: "Cotton", minPH: 5.5, maxPH: 7.5 },
  { value: "sugarcane", label: "Sugarcane", minPH: 6.0, maxPH: 7.5 },
];

// ==========================================
// Component Instances
// ==========================================
let headerComponent = null;
let statusComponent = null;
let pumpLogComponent = null;
let cropCardsComponent = null;

// ==========================================
// Initialization
// ==========================================
async function initializeDashboard() {
  // Check authentication
  authService.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "../auth/signin.html";
      return;
    }

    appState.user = user;
    await loadUserProfile();
    initializeComponents();
    startMonitoring();
    setupEventListeners();
  });
}

// ==========================================
// Load User Profile
// ==========================================
async function loadUserProfile() {
  console.log("📊 Loading user profile for:", appState.user.uid);

  const result = await userService.getProfile(appState.user.uid);

  if (result.success) {
    console.log("✅ Profile retrieved:", result.profile);
    appState.profile = result.profile;

    // Ensure location node exists (migration for legacy accounts)
    console.log("🔄 Checking if location node exists...");
    const ensureResult = await userService.ensureLocationExists(
      appState.user.uid
    );
    if (ensureResult.created) {
      console.log("✨ Location node was created for legacy account");
    }

    // Get user location from persistent location object
    console.log("📍 Getting location from database...");
    const locationResult = await userService.getLocation(appState.user.uid);
    console.log("📍 Location result:", JSON.stringify(locationResult));

    // Defensive: Handle location result properly
    let location = "Karimganj, Assam"; // Default fallback

    if (locationResult.success) {
      // Check if location is genuinely provided (not empty object)
      const displayLoc = locationResult.location;

      // Only use non-"Not provided" values
      if (
        displayLoc &&
        displayLoc !== "Not provided" &&
        displayLoc.trim() !== ""
      ) {
        location = displayLoc;
        console.log("✅ Using location from database:", location);
      } else {
        console.log("⚠️  Location is empty, using default:", location);
        console.log("   isEmpty flag:", locationResult.isEmpty);
      }
    } else {
      console.warn("⚠️  Error retrieving location:", locationResult.error);
      console.log("   Using default fallback:", location);
    }

    console.log("📍 Final location to display:", location);
    document.getElementById("farmLocation").textContent = location;

    // Format and display last visited
    if (result.profile.lastVisited) {
      const lastVisitDate = new Date(result.profile.lastVisited);
      document.getElementById("lastVisit").textContent =
        lastVisitDate.toLocaleDateString() +
        " " +
        lastVisitDate.toLocaleTimeString();
    } else {
      document.getElementById("lastVisit").textContent = "First visit";
    }

    // Load weather for the location
    await loadWeather(location);

    appState.optimalPHMin = parseFloat(result.profile.cropMinPH) || 6.5;
    appState.optimalPHMax = parseFloat(result.profile.cropMaxPH) || 7.5;
    console.log(
      "🌾 Crop pH range set:",
      appState.optimalPHMin,
      "-",
      appState.optimalPHMax
    );

    // Set current crop if saved
    if (result.profile.currentCrop) {
      const crop = CROPS_DATABASE.find(
        (c) => c.value === result.profile.currentCrop
      );
      if (crop) {
        appState.currentCrop = crop;
      }
    }
  }
}

// ==========================================
// Load Weather
// ==========================================
async function loadWeather(location) {
  const weather = await weatherService.getWeather(location);

  if (weather.success) {
    document.getElementById("weatherIcon").textContent = weather.icon;
    document.getElementById("weatherTemp").textContent = weather.temp + "°C";
    document.getElementById("weatherDesc").textContent = weather.description;
    document.getElementById("weatherLocation").textContent = weather.location;
    document.getElementById("weatherHumidity").textContent =
      weather.humidity + "%";
    document.getElementById("weatherWind").textContent =
      weather.windSpeed + " km/h";
  }
}

// ==========================================
// Initialize Components
// ==========================================
function initializeComponents() {
  // Header Component
  headerComponent = new HeaderComponent("headerComponent");
  headerComponent.init(appState.user);

  // Status Indicator Component
  statusComponent = new StatusIndicatorComponent("statusComponent");
  statusComponent.render(appState.systemStatus);

  // Pump Log Component
  pumpLogComponent = new PumpLogComponent("pumpLogComponent");
  pumpLogComponent.render([]);

  // Crop Cards Component
  cropCardsComponent = new CropCardsComponent("cropCardsComponent");
  cropCardsComponent.render(CROPS_DATABASE, appState.currentCrop);

  // Initialize pH Chart
  initializePHChart();

  // Load initial data
  loadPhReadings();
  loadPumpLogs();

  // Set optimal pH display
  updateOptimalPHDisplay();
}

// ==========================================
// pH Chart Initialization
// ==========================================
function initializePHChart() {
  const ctx = document.getElementById("phChart").getContext("2d");

  appState.chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "pH Level",
          data: [],
          borderColor: "var(--primary-color)",
          backgroundColor: "rgba(16, 185, 129, 0.1)",
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "var(--primary-color)",
          pointBorderColor: "white",
          pointBorderWidth: 1,
          pointHoverRadius: 5,
          pointHoverBackgroundColor: "var(--accent-teal)",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "var(--text-secondary)",
            font: { size: 12 },
          },
        },
      },
      scales: {
        y: {
          min: 0,
          max: 14,
          ticks: {
            color: "var(--text-tertiary)",
            stepSize: 1,
          },
          grid: {
            color: "rgba(15, 23, 42, 0.1)",
          },
        },
        x: {
          ticks: {
            color: "var(--text-tertiary)",
          },
          grid: {
            color: "rgba(15, 23, 42, 0.1)",
          },
        },
      },
    },
  });
}

// ==========================================
// Load pH Readings
// ==========================================
async function loadPhReadings() {
  console.log("Loading pH readings for user:", appState.user.uid);
  const result = await phService.getReadings(appState.user.uid, 500);

  if (result.success) {
    appState.phReadings = result.readings;
    console.log("pH readings loaded successfully:", appState.phReadings.length);
    updatePHChart("24h");
    updatePHStats();
  } else {
    console.error("Failed to load pH readings:", result.error);
  }

  // Listen for real-time updates
  phService.onReadingsUpdate(appState.user.uid, (readings) => {
    appState.phReadings = readings;
    console.log("pH readings updated in real-time:", readings.length);

    // Update display with latest reading
    if (readings.length > 0) {
      const latest = readings[readings.length - 1];
      updatePHDisplay(parseFloat(latest.value));
    }

    updatePHChart("24h");
    updatePHStats();
  });
}

// ==========================================
// Load Pump Logs
// ==========================================
async function loadPumpLogs() {
  console.log("Loading pump logs for user:", appState.user.uid);
  const result = await pumpService.getLogs(appState.user.uid, 100);

  if (result.success) {
    appState.pumpLogs = result.logs;
    console.log("Pump logs loaded successfully:", appState.pumpLogs.length);
    pumpLogComponent.render(appState.pumpLogs);
  } else {
    console.error("Failed to load pump logs:", result.error);
  }

  // Listen for real-time updates
  pumpService.onLogsUpdate(appState.user.uid, (logs) => {
    appState.pumpLogs = logs;
    console.log("Pump logs updated in real-time:", logs.length);
    pumpLogComponent.render(appState.pumpLogs);
  });
}

// ==========================================
// pH Display Functions
// ==========================================
function updatePHDisplay(pH) {
  const phValue = document.getElementById("phValue");
  const phStatus = document.getElementById("phStatus");
  const phIndicator = document.getElementById("phIndicator");

  // Update value
  phValue.textContent = pH.toFixed(1);

  // Update status based on optimal range
  if (pH < appState.optimalPHMin) {
    phStatus.textContent = "🔴 Too Acidic";
    phStatus.style.color = "var(--danger-color)";
  } else if (pH > appState.optimalPHMax) {
    phStatus.textContent = "🔵 Too Basic";
    phStatus.style.color = "var(--info-color)";
  } else {
    phStatus.textContent = "🟢 Optimal";
    phStatus.style.color = "var(--success-color)";
  }

  // Update indicator position
  const percentage = (pH / 14) * 100;
  phIndicator.style.left = percentage + "%";
}

// ==========================================
// Update Optimal pH Display
// ==========================================
function updateOptimalPHDisplay() {
  const display = document.getElementById("optimalRangeDisplay");
  if (display) {
    display.textContent = `${appState.optimalPHMin} - ${appState.optimalPHMax}`;
  }
}

// ==========================================
// Update pH Chart
// ==========================================
function updatePHChart(timeRange = "24h") {
  if (!appState.chart) return;

  const now = new Date();
  let cutoffTime;

  switch (timeRange) {
    case "24h":
      cutoffTime = new Date(now - 24 * 60 * 60 * 1000);
      break;
    case "7d":
      cutoffTime = new Date(now - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      cutoffTime = new Date(now - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoffTime = new Date(now - 24 * 60 * 60 * 1000);
  }

  // Filter readings by time range
  const filteredReadings = appState.phReadings.filter((reading) => {
    const readingTime = new Date(reading.timestamp);
    return readingTime > cutoffTime;
  });

  // Update chart
  appState.chart.data.labels = filteredReadings.map((reading) => {
    const date = new Date(reading.timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });

  appState.chart.data.datasets[0].data = filteredReadings.map(
    (reading) => reading.value
  );
  appState.chart.update();
}

// ==========================================
// Update pH Statistics
// ==========================================
function updatePHStats() {
  const avgPhEl = document.getElementById("avgPH");
  const phRangeEl = document.getElementById("phRange");
  const basicCountEl = document.getElementById("basicPumpCount");
  const acidicCountEl = document.getElementById("acidicPumpCount");

  if (appState.phReadings.length > 0) {
    // Average pH
    const avg =
      appState.phReadings.reduce((sum, reading) => sum + reading.value, 0) /
      appState.phReadings.length;
    avgPhEl.textContent = avg.toFixed(2);

    // pH Range
    const values = appState.phReadings.map((r) => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    phRangeEl.textContent = `${min.toFixed(1)} - ${max.toFixed(1)}`;
  }

  // Pump counts
  const basicCount = appState.pumpLogs.filter(
    (log) => log.type === "basic"
  ).length;
  const acidicCount = appState.pumpLogs.filter(
    (log) => log.type === "acidic"
  ).length;

  basicCountEl.textContent = basicCount;
  acidicCountEl.textContent = acidicCount;
}

// ==========================================
// Start Monitoring (Simulation)
// ==========================================
function startMonitoring() {
  // Simulate pH readings
  setInterval(() => {
    // Generate realistic pH fluctuation
    const latestReading = appState.phReadings[appState.phReadings.length - 1];
    let currentPH = latestReading ? latestReading.value : 7.0;

    const change = (Math.random() - 0.5) * 0.2;
    currentPH = Math.max(4, Math.min(10, currentPH + change));

    // Add pH reading
    addPHReading(currentPH);

    // Check if pump should activate
    checkAndActivatePump(currentPH);
  }, 5000);
}

// ==========================================
// Add pH Reading
// ==========================================
async function addPHReading(pH) {
  const result = await phService.addReading(
    appState.user.uid,
    parseFloat(pH.toFixed(2))
  );

  if (!result.success) {
    console.error("Failed to add pH reading:", result.error);
  }
}

// ==========================================
// Check and Activate Pump
// ==========================================
async function checkAndActivatePump(pH) {
  const lastLog = appState.pumpLogs[appState.pumpLogs.length - 1];
  const timeSinceLastPump = lastLog
    ? Date.now() - new Date(lastLog.timestamp).getTime()
    : Infinity;

  // Avoid rapid consecutive pump activations
  if (timeSinceLastPump < 10000) return;

  if (pH < appState.optimalPHMin) {
    // Activate basic pump
    await pumpService.logActivity(
      appState.user.uid,
      "basic",
      "Ammonium Hydroxide (NH4OH)",
      "1%"
    );
  } else if (pH > appState.optimalPHMax) {
    // Activate acidic pump
    await pumpService.logActivity(
      appState.user.uid,
      "acidic",
      "Acetic Acid (CH3COOH)",
      "1%"
    );
  }
}

// ==========================================
// Setup Event Listeners
// ==========================================
function setupEventListeners() {
  // Time filter buttons
  document.querySelectorAll(".time-filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      document
        .querySelectorAll(".time-filter-btn")
        .forEach((b) => b.classList.remove("active"));
      e.target.classList.add("active");
      updatePHChart(e.target.dataset.range);
    });
  });

  // Set first button as active
  const firstTimeBtn = document.querySelector(".time-filter-btn");
  if (firstTimeBtn) firstTimeBtn.classList.add("active");

  // Logout event
  window.addEventListener("logout", async () => {
    const result = await authService.signOut();
    if (result.success) {
      window.location.href = "../auth/signin.html";
    }
  });

  // Crop selection event
  window.addEventListener("cropSelected", async (e) => {
    const cropValue = e.detail.cropValue;
    const selectedCrop = CROPS_DATABASE.find((c) => c.value === cropValue);

    if (!selectedCrop) return;

    // Show confirmation modal
    const confirmed = await cropCardsComponent.showConfirmationModal(
      selectedCrop
    );

    if (confirmed) {
      // Update crop in database
      const result = await userService.saveCropSelection(appState.user.uid, {
        value: selectedCrop.value,
        minPH: selectedCrop.minPH,
        maxPH: selectedCrop.maxPH,
      });

      if (result.success) {
        appState.currentCrop = selectedCrop;
        appState.optimalPHMin = selectedCrop.minPH;
        appState.optimalPHMax = selectedCrop.maxPH;

        updateOptimalPHDisplay();
        cropCardsComponent.updateCurrentCrop(selectedCrop);

        // Show success message
        showNotification(`Crop changed to ${selectedCrop.label}`, "success");
      }
    }
  });
}

// ==========================================
// Notification System
// ==========================================
function showNotification(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `alert alert-${type}`;
  toast.style.position = "fixed";
  toast.style.bottom = "20px";
  toast.style.right = "20px";
  toast.style.zIndex = "9999";
  toast.style.animation = "slideInUp var(--transition-base)";
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "slideInUp var(--transition-base) reverse";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ==========================================
// Start Application
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  initializeDashboard();
});

// Export for debugging
window.appState = appState;
