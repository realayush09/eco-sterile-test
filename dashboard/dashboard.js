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
import { ChatbotComponent } from "../components/chatbot.js";
import { CropRecommendationEngine } from "../services/crop-recommendations.js";
import {
  getDatabase,
  ref,
  get,
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-database.js";

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
  currentTimeRange: "24h", // Track current time filter
  chart: null,
};

// ==========================================
// Crop Database - Comprehensive List with pH Ranges and Images
// ==========================================
const CROPS_DATABASE = [
  // ===== CEREALS =====
  {
    value: "rice",
    label: "Rice (Dhaan)",
    minPH: 5.5,
    maxPH: 6.5,
    image: "rice.png",
  },
  {
    value: "wheat",
    label: "Wheat (Gehun)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "wheat.png",
  },
  {
    value: "maize",
    label: "Maize/Corn",
    minPH: 5.5,
    maxPH: 7.5,
    image: "maize.png",
  },
  {
    value: "barley",
    label: "Barley",
    minPH: 6.5,
    maxPH: 7.5,
    image: "barley.png",
  },
  { value: "oats", label: "Oats", minPH: 5.5, maxPH: 7.0, image: "rice.png" },
  { value: "rye", label: "Rye", minPH: 5.5, maxPH: 7.0, image: "wheat.png" },
  {
    value: "millet",
    label: "Millet (Bajra)",
    minPH: 5.5,
    maxPH: 7.5,
    image: "pearl_millet.png",
  },
  {
    value: "sorghum",
    label: "Sorghum (Jowar)",
    minPH: 5.5,
    maxPH: 8.0,
    image: "sorghum.png",
  },

  // ===== PULSES =====
  {
    value: "chickpea",
    label: "Chickpea (Chana)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "chickpea.png",
  },
  {
    value: "pigeon_pea",
    label: "Pigeon Pea (Arhar)",
    minPH: 5.5,
    maxPH: 7.0,
    image: "pigeon_pea.png",
  },
  {
    value: "lentil",
    label: "Lentil (Masoor)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "lentil.png",
  },
  {
    value: "moong",
    label: "Moong Bean (Mung)",
    minPH: 5.5,
    maxPH: 7.0,
    image: "green_gram.png",
  },
  {
    value: "urad",
    label: "Urad Bean",
    minPH: 5.5,
    maxPH: 7.0,
    image: "black_gram.png",
  },
  {
    value: "peas",
    label: "Peas (Matar)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "kidney_bean.png",
  },
  {
    value: "beans",
    label: "Beans",
    minPH: 6.0,
    maxPH: 7.0,
    image: "kidney_bean.png",
  },

  // ===== VEGETABLES - Leafy =====
  {
    value: "spinach",
    label: "Spinach",
    minPH: 6.5,
    maxPH: 7.0,
    image: "spinach.png",
  },
  {
    value: "lettuce",
    label: "Lettuce",
    minPH: 6.0,
    maxPH: 7.0,
    image: "lettuce.png",
  },
  {
    value: "cabbage",
    label: "Cabbage",
    minPH: 6.0,
    maxPH: 7.5,
    image: "cabbage.png",
  },
  {
    value: "cauliflower",
    label: "Cauliflower",
    minPH: 6.0,
    maxPH: 7.5,
    image: "cauliflower.png",
  },
  {
    value: "broccoli",
    label: "Broccoli",
    minPH: 6.0,
    maxPH: 7.0,
    image: "cauliflower.png",
  },
  {
    value: "kale",
    label: "Kale",
    minPH: 6.0,
    maxPH: 7.5,
    image: "spinach.png",
  },
  {
    value: "mustard",
    label: "Mustard Greens",
    minPH: 6.0,
    maxPH: 7.5,
    image: "mustard.png",
  },

  // ===== VEGETABLES - Root =====
  {
    value: "potato",
    label: "Potato",
    minPH: 5.0,
    maxPH: 6.0,
    image: "potato.png",
  },
  {
    value: "carrot",
    label: "Carrot",
    minPH: 6.0,
    maxPH: 7.0,
    image: "carrot.png",
  },
  {
    value: "radish",
    label: "Radish",
    minPH: 6.0,
    maxPH: 7.0,
    image: "carrot.png",
  },
  {
    value: "turnip",
    label: "Turnip",
    minPH: 6.0,
    maxPH: 7.5,
    image: "carrot.png",
  },
  {
    value: "beet",
    label: "Beet (Chukandar)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "carrot.png",
  },
  {
    value: "parsnip",
    label: "Parsnip",
    minPH: 6.0,
    maxPH: 7.5,
    image: "carrot.png",
  },

  // ===== VEGETABLES - Other =====
  {
    value: "tomato",
    label: "Tomato",
    minPH: 5.5,
    maxPH: 6.8,
    image: "tomato.png",
  },
  {
    value: "cucumber",
    label: "Cucumber",
    minPH: 6.0,
    maxPH: 7.0,
    image: "bottle_gourd.png",
  },
  {
    value: "squash",
    label: "Squash",
    minPH: 6.0,
    maxPH: 7.0,
    image: "pumpkin.png",
  },
  {
    value: "zucchini",
    label: "Zucchini",
    minPH: 6.0,
    maxPH: 7.0,
    image: "bottle_gourd.png",
  },
  {
    value: "pumpkin",
    label: "Pumpkin",
    minPH: 6.0,
    maxPH: 7.0,
    image: "pumpkin.png",
  },
  {
    value: "eggplant",
    label: "Eggplant",
    minPH: 5.5,
    maxPH: 7.0,
    image: "brinjal.png",
  },
  {
    value: "pepper",
    label: "Pepper/Capsicum",
    minPH: 5.5,
    maxPH: 6.8,
    image: "capsicum.png",
  },
  {
    value: "chili",
    label: "Chili Pepper",
    minPH: 5.5,
    maxPH: 6.8,
    image: "capsicum.png",
  },
  {
    value: "onion",
    label: "Onion",
    minPH: 6.0,
    maxPH: 7.0,
    image: "onion.png",
  },
  {
    value: "garlic",
    label: "Garlic",
    minPH: 6.0,
    maxPH: 7.5,
    image: "onion.png",
  },
  { value: "leek", label: "Leek", minPH: 6.0, maxPH: 7.0, image: "onion.png" },
  {
    value: "okra",
    label: "Okra (Bhindi)",
    minPH: 6.0,
    maxPH: 7.0,
    image: "okra.png",
  },
  {
    value: "bottle_gourd",
    label: "Bottle Gourd",
    minPH: 6.0,
    maxPH: 7.0,
    image: "bottle_gourd.png",
  },
  {
    value: "bitter_melon",
    label: "Bitter Melon (Karela)",
    minPH: 6.0,
    maxPH: 7.0,
    image: "bitter_gourd.png",
  },

  // ===== FRUITS =====
  {
    value: "mango",
    label: "Mango",
    minPH: 5.5,
    maxPH: 7.5,
    image: "mango.png",
  },
  {
    value: "banana",
    label: "Banana",
    minPH: 5.5,
    maxPH: 7.0,
    image: "banana.png",
  },
  {
    value: "apple",
    label: "Apple",
    minPH: 5.5,
    maxPH: 6.5,
    image: "apple.png",
  },
  {
    value: "orange",
    label: "Orange",
    minPH: 5.5,
    maxPH: 6.5,
    image: "orange.png",
  },
  {
    value: "lemon",
    label: "Lemon",
    minPH: 5.5,
    maxPH: 6.5,
    image: "lemon.png",
  },
  {
    value: "grape",
    label: "Grapes",
    minPH: 5.5,
    maxPH: 7.0,
    image: "orange.png",
  },
  {
    value: "strawberry",
    label: "Strawberry",
    minPH: 5.5,
    maxPH: 6.5,
    image: "apple.png",
  },
  {
    value: "guava",
    label: "Guava",
    minPH: 5.5,
    maxPH: 7.0,
    image: "guava.png",
  },
  {
    value: "papaya",
    label: "Papaya",
    minPH: 5.5,
    maxPH: 7.0,
    image: "papaya.png",
  },
  {
    value: "pineapple",
    label: "Pineapple",
    minPH: 4.5,
    maxPH: 5.5,
    image: "orange.png",
  },
  {
    value: "coconut",
    label: "Coconut",
    minPH: 5.5,
    maxPH: 6.5,
    image: "coconut.png",
  },
  {
    value: "pomegranate",
    label: "Pomegranate",
    minPH: 5.5,
    maxPH: 7.5,
    image: "pomegranate.png",
  },
  {
    value: "peach",
    label: "Peach",
    minPH: 5.5,
    maxPH: 6.5,
    image: "apple.png",
  },
  { value: "plum", label: "Plum", minPH: 5.5, maxPH: 6.5, image: "apple.png" },
  {
    value: "cherry",
    label: "Cherry",
    minPH: 5.5,
    maxPH: 6.5,
    image: "apple.png",
  },
  {
    value: "watermelon",
    label: "Watermelon",
    minPH: 5.5,
    maxPH: 7.0,
    image: "watermelon.png",
  },
  {
    value: "muskmelon",
    label: "Muskmelon",
    minPH: 6.0,
    maxPH: 7.0,
    image: "pumpkin.png",
  },

  // ===== CASH CROPS =====
  {
    value: "cotton",
    label: "Cotton",
    minPH: 5.5,
    maxPH: 7.5,
    image: "cotton.png",
  },
  {
    value: "sugarcane",
    label: "Sugarcane",
    minPH: 6.0,
    maxPH: 7.5,
    image: "sugarcane.png",
  },
  {
    value: "tobacco",
    label: "Tobacco",
    minPH: 5.5,
    maxPH: 6.5,
    image: "cotton.png",
  },
  { value: "jute", label: "Jute", minPH: 5.5, maxPH: 7.0, image: "cotton.png" },
  { value: "tea", label: "Tea", minPH: 5.0, maxPH: 5.5, image: "coffee.png" },
  {
    value: "coffee",
    label: "Coffee",
    minPH: 5.5,
    maxPH: 6.5,
    image: "coffee.png",
  },
  {
    value: "cocoa",
    label: "Cocoa",
    minPH: 5.5,
    maxPH: 7.0,
    image: "coffee.png",
  },

  // ===== SPICES & CONDIMENTS =====
  {
    value: "turmeric",
    label: "Turmeric",
    minPH: 5.5,
    maxPH: 7.5,
    image: "turmeric.png",
  },
  {
    value: "ginger",
    label: "Ginger",
    minPH: 5.5,
    maxPH: 7.0,
    image: "ginger.png",
  },
  {
    value: "coriander",
    label: "Coriander",
    minPH: 6.0,
    maxPH: 7.0,
    image: "coriander.png",
  },
  {
    value: "cumin",
    label: "Cumin",
    minPH: 6.0,
    maxPH: 7.5,
    image: "coriander.png",
  },
  {
    value: "fenugreek",
    label: "Fenugreek (Methi)",
    minPH: 6.0,
    maxPH: 7.0,
    image: "fenugreek.png",
  },
  {
    value: "black_pepper",
    label: "Black Pepper",
    minPH: 5.5,
    maxPH: 6.5,
    image: "black_pepper.png",
  },
  {
    value: "cardamom",
    label: "Cardamom",
    minPH: 5.5,
    maxPH: 6.5,
    image: "cardamom.png",
  },
  {
    value: "cinnamon",
    label: "Cinnamon",
    minPH: 5.5,
    maxPH: 6.5,
    image: "cinnamon.png",
  },
  {
    value: "clove",
    label: "Clove",
    minPH: 5.5,
    maxPH: 6.5,
    image: "cinnamon.png",
  },

  // ===== OIL CROPS =====
  {
    value: "soybean",
    label: "Soybean",
    minPH: 6.0,
    maxPH: 7.0,
    image: "soybean.png",
  },
  {
    value: "groundnut",
    label: "Groundnut (Peanut)",
    minPH: 5.5,
    maxPH: 6.5,
    image: "groundnut.png",
  },
  {
    value: "sunflower",
    label: "Sunflower",
    minPH: 6.0,
    maxPH: 7.5,
    image: "sunflower.png",
  },
  {
    value: "mustard",
    label: "Mustard (Oil)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "mustard.png",
  },
  {
    value: "sesame",
    label: "Sesame (Til)",
    minPH: 5.5,
    maxPH: 7.0,
    image: "sesame.png",
  },
  {
    value: "safflower",
    label: "Safflower",
    minPH: 5.5,
    maxPH: 7.5,
    image: "sunflower.png",
  },

  // ===== OTHERS =====
  {
    value: "aloe",
    label: "Aloe Vera",
    minPH: 6.5,
    maxPH: 7.5,
    image: "spinach.png",
  },
  {
    value: "stevia",
    label: "Stevia",
    minPH: 6.0,
    maxPH: 7.0,
    image: "spinach.png",
  },
  {
    value: "mint",
    label: "Mint (Pudina)",
    minPH: 6.0,
    maxPH: 7.5,
    image: "spinach.png",
  },
  {
    value: "basil",
    label: "Basil (Tulsi)",
    minPH: 6.0,
    maxPH: 7.0,
    image: "spinach.png",
  },
  {
    value: "oregano",
    label: "Oregano",
    minPH: 6.0,
    maxPH: 7.0,
    image: "spinach.png",
  },
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
  // Check authentication and profile completion
  authService.onAuthStateChanged(async (user) => {
    if (!user) {
      window.location.href = "../auth/signin.html";
      return;
    }

    // Check if profile and location are complete
    try {
      const db = getDatabase();
      const profileSnap = await get(ref(db, `users/${user.uid}/profile`));
      const locationSnap = await get(ref(db, `users/${user.uid}/location`));

      const hasProfile = profileSnap.exists();
      const hasLocation = locationSnap.exists();

      if (!hasProfile || !hasLocation) {
        // Profile incomplete, redirect to completion page
        console.warn(
          "⚠️ Profile incomplete. Redirecting to complete-profile.html"
        );
        window.location.href = "../auth/complete-profile.html";
        return;
      }
    } catch (error) {
      console.error("Error checking profile completeness:", error);
      // On error, allow access (safer than blocking)
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
        // Update optimal pH to match the crop's range
        appState.optimalPHMin = crop.minPH;
        appState.optimalPHMax = crop.maxPH;
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

  // Crop Cards Component with Recommendations
  const recommendationEngine = new CropRecommendationEngine();
  cropCardsComponent = new CropCardsComponent(
    "cropCardsComponent",
    recommendationEngine
  );

  // Build user profile for recommendations
  const userProfileForRecommendations = {
    farmLocation: appState.profile?.farmLocation || "",
    // Add other relevant profile data as needed
  };

  cropCardsComponent.render(
    CROPS_DATABASE,
    appState.currentCrop,
    appState.profile?.cropLocked || false,
    userProfileForRecommendations
  );

  // Chatbot Component
  const chatbot = new ChatbotComponent("chatbotContainer");
  chatbot.init();

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
  // Fetch more readings to support 30-day filter (assuming ~1 reading per minute = ~43,200 per 30 days)
  // Limiting to 2000 for performance while ensuring 7d/30d have adequate data
  const result = await phService.getReadings(appState.user.uid, 2000);

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

    // Update chart with the currently selected time range
    updatePHChart(appState.currentTimeRange);
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
// Update pH Chart
// ==========================================
function updatePHChart(timeRange = "24h") {
  if (!appState.chart) return;

  // Use numeric timestamps (milliseconds) for reliable comparison
  const now = Date.now();
  let cutoffTime;

  switch (timeRange) {
    case "24h":
      cutoffTime = now - 24 * 60 * 60 * 1000;
      break;
    case "7d":
      cutoffTime = now - 7 * 24 * 60 * 60 * 1000;
      break;
    case "30d":
      cutoffTime = now - 30 * 24 * 60 * 60 * 1000;
      break;
    default:
      cutoffTime = now - 24 * 60 * 60 * 1000;
  }

  // Filter readings by time range using numeric timestamp comparison
  // This ensures ISO string parsing issues don't prevent multi-day filtering
  const filteredReadings = appState.phReadings.filter((reading) => {
    const readingTimestamp =
      typeof reading.timestamp === "number"
        ? reading.timestamp
        : new Date(reading.timestamp).getTime(); // Fallback for legacy data
    return readingTimestamp > cutoffTime;
  });

  // Generate smart labels based on time range to avoid overcrowding
  let labels;
  if (timeRange === "24h") {
    // For 24h: show time labels every 2-4 entries (hourly approximation)
    const step = Math.max(1, Math.floor(filteredReadings.length / 6));
    labels = filteredReadings.map((reading, index) => {
      if (index % step === 0) {
        const timestamp =
          typeof reading.timestamp === "number"
            ? reading.timestamp
            : new Date(reading.timestamp).getTime();
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      return "";
    });
  } else if (timeRange === "7d") {
    // For 7d: show daily labels with dates (format: "DD Mon") so previous days are visible
    const step = Math.max(1, Math.floor(filteredReadings.length / 7));
    labels = filteredReadings.map((reading, index) => {
      if (index % step === 0) {
        const timestamp =
          typeof reading.timestamp === "number"
            ? reading.timestamp
            : new Date(reading.timestamp).getTime();
        const date = new Date(timestamp);
        return date.toLocaleDateString([], { day: "2-digit", month: "short" });
      }
      return "";
    });
  } else {
    // For 30d: show weekly labels with dates (format: "DD Mon")
    const step = Math.max(1, Math.floor(filteredReadings.length / 5));
    labels = filteredReadings.map((reading, index) => {
      if (index % step === 0) {
        const timestamp =
          typeof reading.timestamp === "number"
            ? reading.timestamp
            : new Date(reading.timestamp).getTime();
        const date = new Date(timestamp);
        return date.toLocaleDateString([], { day: "2-digit", month: "short" });
      }
      return "";
    });
  }

  // Update chart with new labels and data
  appState.chart.data.labels = labels;
  appState.chart.data.datasets[0].data = filteredReadings.map(
    (reading) => reading.value
  );
  appState.chart.update();

  // Update the pH Range label text to reflect current filter
  updatePHRangeLabel(timeRange, filteredReadings);
}

// ==========================================
// Update pH Range Label Based on Time Filter
// ==========================================
function updatePHRangeLabel(timeRange, filteredReadings = null) {
  // Use specific ID to target only the pH Range label, not Average pH
  const phRangeLabelEl = document.getElementById("phRangeLabel");
  if (!phRangeLabelEl) return;

  let timeLabel = "24h";
  switch (timeRange) {
    case "7d":
      timeLabel = "7 Days";
      break;
    case "30d":
      timeLabel = "30 Days";
      break;
  }
  phRangeLabelEl.textContent = `pH Range (${timeLabel})`;

  // Update pH range values if filtered readings provided
  if (filteredReadings && filteredReadings.length > 0) {
    const phRangeEl = document.getElementById("phRange");
    const values = filteredReadings.map((r) => r.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    phRangeEl.textContent = `${min.toFixed(1)} - ${max.toFixed(1)}`;
  }
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
    // Average pH (calculated from all loaded readings for consistency)
    const avg =
      appState.phReadings.reduce((sum, reading) => sum + reading.value, 0) /
      appState.phReadings.length;
    avgPhEl.textContent = avg.toFixed(2);

    // pH Range (updated via updatePHRangeLabel when chart updates)
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
// ==========================================
// Arduino Web Serial Connection
// ==========================================
let currentPort = null;

async function connectArduino() {
  if (!("serial" in navigator)) {
    showNotification(
      "Web Serial API not supported. Use Chrome, Edge, or Opera.",
      "error"
    );
    return;
  }

  try {
    console.log("🔌 Requesting serial port...");
    const port = await navigator.serial.requestPort();

    if (!port) {
      console.log("User cancelled port selection.");
      return;
    }

    console.log("🔌 Opening port at 9600 baud...");
    await port.open({ baudRate: 9600 });
    console.log("✅ Port opened successfully.");
    currentPort = port;

    appState.systemStatus.arduinoConnected = true;
    updateArduinoStatus(true);
    showNotification("✅ Arduino connected! Reading live data...", "success");

    const textDecoder = new TextDecoder();
    const reader = port.readable.getReader();

    let buffer = "";

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          console.log("Serial port closed.");
          break;
        }
        if (!value) continue;

        buffer += textDecoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop();

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;

          try {
            const obj = JSON.parse(line);

            // pH reading from Arduino
            if (obj.pH !== undefined) {
              const pH = parseFloat(obj.pH);
              if (!isNaN(pH)) {
                addPHReading(pH);
                console.log("🔌 Arduino pH reading:", pH);
              }
            }

            // Pump activity reported by Arduino
            if (obj.pump) {
              const pumpRaw = obj.pump.toLowerCase();
              let pumpType = null;

              if (pumpRaw.includes("basic")) pumpType = "basic";
              else if (pumpRaw.includes("acidic")) pumpType = "acidic";

              if (pumpType && pumpType !== "off") {
                logPumpActivity(pumpType, "1%");
                appState.systemStatus.pumpStatus = pumpType;
                console.log("🔌 Arduino pump:", pumpType);
              }
            }
          } catch (parseError) {
            console.log("Non-JSON from Arduino:", line);
          }
        }
      }
    } finally {
      try {
        reader.releaseLock();
      } catch (e) {}
    }

    // Close port and cleanup
    try {
      await port.close();
    } catch (e) {}
    currentPort = null;
    appState.systemStatus.arduinoConnected = false;
    updateArduinoStatus(false);
    showNotification("⚠️ Arduino disconnected.", "warning");
  } catch (error) {
    console.error("Serial error:", error);
    const errorMsg = error.message || error.toString();

    if (!errorMsg.includes("cancelled")) {
      showNotification("Arduino connection failed: " + errorMsg, "error");
    }
    currentPort = null;
    appState.systemStatus.arduinoConnected = false;
    updateArduinoStatus(false);
  }
}

async function disconnectArduino() {
  if (currentPort) {
    try {
      await currentPort.close();
      currentPort = null;
      appState.systemStatus.arduinoConnected = false;
      updateArduinoStatus(false);
      showNotification("✅ Arduino disconnected.", "success");
    } catch (error) {
      console.error("Error closing port:", error);
    }
  }
}

function updateArduinoStatus(isConnected) {
  appState.systemStatus.arduinoConnected = isConnected;
  appState.systemStatus.lastUpdate = new Date();
  statusComponent.render(appState.systemStatus);

  // Re-attach button listener after re-rendering
  const connectBtn = document.getElementById("connectArduinoBtn");
  if (connectBtn) {
    connectBtn.onclick = () => {
      if (appState.systemStatus.arduinoConnected) {
        disconnectArduino();
      } else {
        connectArduino();
      }
    };
  }
}

// ==========================================
function setupEventListeners() {
  // Arduino Connect Button
  const connectBtn = document.getElementById("connectArduinoBtn");
  if (connectBtn) {
    connectBtn.addEventListener("click", () => {
      if (appState.systemStatus.arduinoConnected) {
        disconnectArduino();
      } else {
        connectArduino();
      }
    });
  }

  // Time filter buttons with improved visual feedback
  document.querySelectorAll(".time-filter-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Remove active class from all buttons
      document
        .querySelectorAll(".time-filter-btn")
        .forEach((b) => b.classList.remove("active"));
      // Add active class to clicked button for clear visual feedback
      e.target.classList.add("active");
      const timeRange = e.target.dataset.range;
      appState.currentTimeRange = timeRange; // Save selected time range persistently
      // Update chart with new time range, smart labels, and dynamic pH range label
      updatePHChart(timeRange);
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
