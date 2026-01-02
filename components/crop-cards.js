/**
 * Crop Selection Cards Component
 * Displays available crops with selection and confirmation modal
 * Features:
 * - Recommended crops section (top priority)
 * - Category tabs (YouTube-style, scrollable)
 * - Limited visibility with "Show More" buttons
 * - Sticky search/tabs for better UX
 */

export class CropCardsComponent {
  constructor(containerId, recommendationEngine = null) {
    this.container = document.getElementById(containerId);
    this.currentCrop = null;
    this.isLocked = false;
    this.recommendationEngine = recommendationEngine;
    this.allCrops = [];
    this.recommendedCrops = [];
    this.cropsPerPage = 10; // Show 10 crops initially
    this.expandedCategories = new Set(); // Track which categories are expanded
    this.activeTab = "all"; // Currently selected category tab
    this.userProfile = null; // For recommendation logic

    // Crop categories mapping
    this.categories = {
      all: "All Crops",
      cereals: "Cereals",
      pulses: "Pulses",
      vegetables: "Vegetables",
      fruits: "Fruits",
      cash_crops: "Cash Crops",
      spices: "Spices",
    };

    // Map crop values to categories
    this.cropCategories = new Map();
  }

  /**
   * Render crop selector interface with tabs and recommendations
   */
  render(crops = [], currentCrop = null, isLocked = false, userProfile = null) {
    this.currentCrop = currentCrop;
    this.isLocked = isLocked;
    this.allCrops = crops;
    this.userProfile = userProfile;

    // Build crop category map
    this.buildCropCategoryMap();

    // Get recommended crops if engine is available
    if (this.recommendationEngine && this.userProfile) {
      this.recommendedCrops = this.recommendationEngine.getRecommendations(
        this.userProfile,
        crops,
        10
      );
    } else {
      // Fallback: use first 10 crops if no recommendation engine
      this.recommendedCrops = crops.slice(0, 10);
    }

    this.container.innerHTML = `
      <div class="crop-selector">
        <!-- STICKY HEADER: Search Box Only -->
        <div class="crop-header sticky">
          <input 
            type="text" 
            id="cropSearch" 
            class="crop-search" 
            placeholder="Search crops..."
          >
        </div>

        <!-- STICKY TABS: Category selection (YouTube-style, horizontally scrollable) -->
        <div class="crop-tabs-wrapper sticky">
          <div class="crop-tabs-container">
            <div class="crop-tabs">
              ${Object.entries(this.categories)
                .map(
                  ([value, label]) =>
                    `<button class="crop-tab ${
                      value === "all" ? "active" : ""
                    }" data-category="${value}">
                      ${label}
                    </button>`
                )
                .join("")}
            </div>
          </div>
        </div>

        <!-- RECOMMENDED CROPS SECTION (only visible on "all" tab and has content) -->
        <div id="recommendedSection" class="crop-recommended-section" style="display: ${
          this.activeTab === "all" && this.recommendedCrops.length > 0
            ? "block"
            : "none"
        }">
          <h4 class="section-subtitle">⭐ Recommended for Your Region & Season</h4>
          <div id="recommendedCardsContainer" class="crop-cards-grid">
            <!-- Recommended crop cards rendered here -->
          </div>
          <hr class="crop-section-divider" />
        </div>

        <!-- ALL CROPS SECTION (filtered by tab) -->
        <div id="cropCardsContainer" class="crop-cards-container">
          <div id="cropCardsGrid" class="crop-cards-grid">
            <!-- Cards will be rendered here -->
          </div>
          <button id="showMoreBtn" class="btn-show-more" style="display: none;">
            + Show More Crops
          </button>
        </div>
      </div>
    `;

    this.renderRecommendedCrops();
    this.renderCropCards(crops);
    this.attachEventListeners();
  }

  /**
   * Render individual crop cards
   */
  renderCropCards(crops = []) {
    const container = document.getElementById("cropCardsGrid");

    if (!crops || crops.length === 0) {
      container.innerHTML = '<p class="text-tertiary">No crops available</p>';
      return;
    }

    // Filter crops by active category tab
    const filteredCrops = this.filterCropsByCategory(crops, this.activeTab);

    // Determine how many to show (limited or all)
    const isExpanded = this.expandedCategories.has(this.activeTab);
    const cropsToShow = isExpanded
      ? filteredCrops
      : filteredCrops.slice(0, this.cropsPerPage);

    // Show "Show More" button if there are more crops to display
    const showMoreBtn = document.getElementById("showMoreBtn");
    if (showMoreBtn) {
      showMoreBtn.style.display =
        filteredCrops.length > this.cropsPerPage && !isExpanded
          ? "block"
          : "none";
    }

    const cardsHTML = cropsToShow
      .map((crop) => {
        const isSelected = this.currentCrop?.value === crop.value;
        const imageSrc = crop.image || `${crop.value}.png`;
        return `
        <div class="crop-card ${isSelected ? "selected" : ""}" data-value="${
          crop.value
        }">
          <div class="crop-image">
            <img src="../images/${imageSrc}" alt="${crop.label}" 
              onerror="this.src='https://via.placeholder.com/150?text=${encodeURIComponent(
                crop.label
              )}'">
          </div>
          <div class="crop-info">
            <h4>${crop.label}</h4>
            <p class="crop-ph">pH: ${crop.minPH} - ${crop.maxPH}</p>
            ${isSelected ? '<span class="crop-badge">✓ Selected</span>' : ""}
          </div>
        </div>
      `;
      })
      .join("");

    container.innerHTML = cardsHTML;
    this.attachCropCardListeners();
  }

  /**
   * Render recommended crops section
   */
  renderRecommendedCrops() {
    const container = document.getElementById("recommendedCardsContainer");
    if (!container) return;

    if (this.recommendedCrops.length === 0) {
      container.innerHTML =
        '<p class="text-tertiary">No recommendations available</p>';
      return;
    }

    const cardsHTML = this.recommendedCrops
      .slice(0, 8) // Show only 8 recommended crops
      .map((crop) => {
        const isSelected = this.currentCrop?.value === crop.value;
        const imageSrc = crop.image || `${crop.value}.png`;
        return `
        <div class="crop-card ${isSelected ? "selected" : ""}" data-value="${
          crop.value
        }">
          <div class="crop-image">
            <img src="../images/${imageSrc}" alt="${crop.label}" 
              onerror="this.src='https://via.placeholder.com/150?text=${encodeURIComponent(
                crop.label
              )}'">
          </div>
          <div class="crop-info">
            <h4>${crop.label}</h4>
            <p class="crop-ph">pH: ${crop.minPH} - ${crop.maxPH}</p>
            ${isSelected ? '<span class="crop-badge">✓ Selected</span>' : ""}
          </div>
        </div>
      `;
      })
      .join("");

    container.innerHTML = cardsHTML;
    this.attachCropCardListeners();
  }

  /**
   * Filter crops by category
   * @param {Array} crops - All crops
   * @param {string} category - Category to filter by
   * @returns {Array} Filtered crops
   */
  filterCropsByCategory(crops, category = "all") {
    if (category === "all") {
      return crops;
    }

    return crops.filter((crop) => {
      const cropCats = this.cropCategories.get(crop.value) || [];
      return cropCats.includes(category);
    });
  }

  /**
   * Build crop category map from crop data
   */
  buildCropCategoryMap() {
    // Clear existing map
    this.cropCategories.clear();

    // Category definitions based on crop values
    const categoryDefinitions = {
      cereals: [
        "rice",
        "wheat",
        "maize",
        "barley",
        "oats",
        "rye",
        "millet",
        "sorghum",
      ],
      pulses: [
        "chickpea",
        "pigeon_pea",
        "lentil",
        "moong",
        "urad",
        "peas",
        "beans",
      ],
      vegetables: [
        "spinach",
        "lettuce",
        "cabbage",
        "cauliflower",
        "broccoli",
        "kale",
        "mustard",
        "potato",
        "carrot",
        "radish",
        "turnip",
        "beet",
        "parsnip",
        "tomato",
        "cucumber",
        "squash",
        "zucchini",
        "pumpkin",
        "eggplant",
        "pepper",
        "chili",
        "onion",
        "garlic",
        "leek",
        "okra",
        "bottle_gourd",
        "bitter_melon",
      ],
      fruits: [
        "mango",
        "banana",
        "apple",
        "orange",
        "lemon",
        "grape",
        "strawberry",
        "guava",
        "papaya",
        "pineapple",
        "coconut",
        "pomegranate",
        "peach",
        "plum",
        "cherry",
        "watermelon",
        "muskmelon",
      ],
      cash_crops: [
        "cotton",
        "sugarcane",
        "tobacco",
        "jute",
        "tea",
        "coffee",
        "cocoa",
      ],
      spices: [
        "turmeric",
        "ginger",
        "coriander",
        "cumin",
        "fenugreek",
        "black_pepper",
        "clove",
        "nutmeg",
        "cinnamon",
        "cardamom",
        "asafetida",
        "mint",
        "basil",
        "sesame",
        "mustard_seed",
      ],
    };

    // Build map
    for (const [category, cropValues] of Object.entries(categoryDefinitions)) {
      cropValues.forEach((cropValue) => {
        const existing = this.cropCategories.get(cropValue) || [];
        existing.push(category);
        this.cropCategories.set(cropValue, existing);
      });
    }
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Crop search filter
    const searchInput = document.getElementById("cropSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.filterCrops(e.target.value);
      });
    }

    // Category tab switching
    document.querySelectorAll(".crop-tab").forEach((tab) => {
      tab.addEventListener("click", (e) => {
        this.switchCategory(e.target.dataset.category);
      });
    });

    // Show More button
    const showMoreBtn = document.getElementById("showMoreBtn");
    if (showMoreBtn) {
      showMoreBtn.addEventListener("click", () => {
        this.expandCategory(this.activeTab);
      });
    }

    // Crop card selection
    this.attachCropCardListeners();
  }

  /**
   * Attach listeners to crop cards
   */
  attachCropCardListeners() {
    document.querySelectorAll(".crop-card").forEach((card) => {
      card.addEventListener("click", () => {
        this.selectCrop(card.dataset.value);
      });
    });
  }

  /**
   * Switch to a different category tab
   * @param {string} category - Category to switch to
   */
  switchCategory(category) {
    this.activeTab = category;
    this.expandedCategories.delete(category); // Reset expansion state when switching tabs

    // Update active tab indicator
    document.querySelectorAll(".crop-tab").forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.category === category);
    });

    // Update recommended section visibility
    const recommendedSection = document.getElementById("recommendedSection");
    if (recommendedSection) {
      recommendedSection.style.display =
        category === "all" && this.recommendedCrops.length > 0
          ? "block"
          : "none";
    }

    // Re-render crops for new category
    this.renderCropCards(this.allCrops);

    // Auto-scroll to top of crop list
    const cardsContainer = document.getElementById("cropCardsContainer");
    if (cardsContainer) {
      cardsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  /**
   * Expand category to show all crops
   * @param {string} category - Category to expand
   */
  expandCategory(category) {
    this.expandedCategories.add(category);
    this.renderCropCards(this.allCrops);
  }

  /**
   * Filter crops by search term (searches label, value, and synonyms)
   */
  filterCrops(searchTerm) {
    const cards = document.querySelectorAll(".crop-card");
    const term = searchTerm.toLowerCase().trim();

    // If empty search, show all
    if (!term) {
      cards.forEach((card) => {
        card.style.display = "";
      });
      return;
    }

    cards.forEach((card) => {
      const label = card.querySelector("h4").textContent.toLowerCase();
      const value = card.getAttribute("data-value").toLowerCase();

      // Search in label and value
      const matches = label.includes(term) || value.includes(term);

      // Also check for synonyms/keywords
      const synonymMap = {
        dhaan: "rice",
        gehun: "wheat",
        chana: "chickpea",
        arhar: "pigeon_pea",
        masoor: "lentil",
        mung: "moong",
        matar: "peas",
        bhindi: "okra",
        karela: "bitter_melon",
        chukandar: "beet",
        pudina: "mint",
        tulsi: "basil",
        til: "sesame",
        methi: "fenugreek",
        jowar: "sorghum",
        bajra: "millet",
        peanut: "groundnut",
        bean: ["moong", "urad", "beans"],
        green: ["spinach", "lettuce", "kale"],
        root: ["carrot", "radish", "turnip", "beet", "potato"],
        leafy: ["spinach", "lettuce", "cabbage", "kale"],
        spice: [
          "turmeric",
          "ginger",
          "coriander",
          "cumin",
          "fenugreek",
          "black_pepper",
        ],
        oil: [
          "soybean",
          "groundnut",
          "sunflower",
          "mustard",
          "sesame",
          "safflower",
        ],
        cereal: [
          "rice",
          "wheat",
          "maize",
          "barley",
          "oats",
          "rye",
          "millet",
          "sorghum",
        ],
        pulse: [
          "chickpea",
          "pigeon_pea",
          "lentil",
          "moong",
          "urad",
          "peas",
          "beans",
        ],
        fruit: [
          "mango",
          "banana",
          "apple",
          "orange",
          "lemon",
          "grape",
          "strawberry",
          "guava",
          "papaya",
          "pineapple",
        ],
      };

      let hasMatch = matches;

      // Check synonyms
      if (!hasMatch) {
        for (const [keyword, crops] of Object.entries(synonymMap)) {
          if (term.includes(keyword)) {
            const cropList = Array.isArray(crops) ? crops : [crops];
            if (cropList.includes(value)) {
              hasMatch = true;
              break;
            }
          }
        }
      }

      card.style.display = hasMatch ? "" : "none";
    });
  }

  /**
   * Handle crop selection
   */
  selectCrop(cropValue) {
    // Dispatch event for parent to handle
    window.dispatchEvent(
      new CustomEvent("cropSelected", {
        detail: { cropValue },
      })
    );
  }

  /**
   * Toggle crop lock
   */
  toggleLock() {
    window.dispatchEvent(new CustomEvent("toggleCropLock"));
  }

  /**
   * Show confirmation modal
   */
  showConfirmationModal(cropData) {
    return new Promise((resolve) => {
      const modal = document.createElement("div");
      modal.className = "modal";
      modal.innerHTML = `
        <div class="modal-content scale-in">
          <div class="modal-header">
            <h2>Confirm Crop Change</h2>
            <button class="btn-close">✕</button>
          </div>
          <div class="modal-body">
            <p>You're about to change to <strong>${cropData.label}</strong></p>
            <div class="crop-details">
              <p><strong>Optimal pH Range:</strong> ${cropData.minPH} - ${cropData.maxPH}</p>
              <p class="warning">⚠️ This may trigger pump adjustments and affect your active monitoring</p>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancelBtn">Cancel</button>
            <button class="btn btn-primary" id="confirmBtn">Change Crop</button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);

      document.getElementById("cancelBtn").addEventListener("click", () => {
        modal.remove();
        resolve(false);
      });

      document.getElementById("confirmBtn").addEventListener("click", () => {
        modal.remove();
        resolve(true);
      });

      modal.querySelector(".btn-close").addEventListener("click", () => {
        modal.remove();
        resolve(false);
      });
    });
  }

  /**
   * Update current crop display
   */
  updateCurrentCrop(crop) {
    this.currentCrop = crop;
    document.querySelectorAll(".crop-card").forEach((card) => {
      card.classList.remove("selected");
    });
    const selectedCard = document.querySelector(`[data-value="${crop.value}"]`);
    if (selectedCard) {
      selectedCard.classList.add("selected");
    }
  }
}
