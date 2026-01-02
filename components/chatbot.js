/**
 * Chatbot Component
 * Provides helpful assistance for crop selection, pH management, and farming tips
 */

export class ChatbotComponent {
  constructor(containerId = "chatbotContainer") {
    this.containerId = containerId;
    this.isOpen = false;
    this.messages = [];
    this.container = null;

    // Predefined responses for common questions
    this.responses = {
      greetings: [
        "Hello! 👋 I'm your EcoSterile assistant. How can I help you today?",
        "Hi there! 🌾 Need help with crop selection, pH management, or farming tips?",
        "Welcome! 🚜 Ask me about crops, pH levels, watering, or how to use any dashboard features!",
      ],
      crop_selection: [
        "To select a crop, go to the 'Crop Type Selection' section and browse through the categories. You can filter by Cereals, Pulses, Vegetables, Fruits, Cash Crops, or Spices. Look at the recommended crops at the top - they're perfect for your region and season!",
        "The recommended crops section shows the best crops for your location and current season. If you want to explore more options, use the category tabs or search bar.",
        "To change your crop: 1) Go to 'Crop Type Selection' 2) Click on a crop card 3) Confirm the change in the modal 4) The system will update your optimal pH range automatically!",
      ],
      ph_management: [
        "pH management is crucial! The optimal range for most crops is 6.5-7.5. You can monitor real-time pH levels on your dashboard and use the pump system to maintain the ideal balance.",
        "If your pH is too high (alkaline), use the acidic pump. If it's too low (acidic), use the basic pump. The dashboard shows your pH trend in the graph below the monitoring panel.",
        "To view pH levels: Look at the 'Real-time pH Monitoring' section on your dashboard. You'll see your current pH value, status (🟢 Optimal/🟡 Caution/🔴 Critical), and a 24-hour trend graph.",
      ],
      watering: [
        "Different crops need different water amounts. The recommended crops section suggests crops suitable for your region's rainfall patterns. Always check the weather forecast on your dashboard!",
        "Regular monitoring helps you understand your crop's water needs. The pH levels can indicate water stress in some crops.",
      ],
      profile_settings: [
        "To update your profile: 1) Click on your profile icon in the header 2) Go to 'Settings' 3) Update your farm name, location, or other details 4) Save changes. Your recommendations will automatically adjust based on your location!",
        "To change your farm name: Go to Settings → Profile and edit the farm name field. This helps personalize your dashboard experience.",
        "To set your farm location: In Settings, update 'Farm Location'. This is important because it helps us recommend crops that grow best in your region!",
      ],
      weather: [
        "Your current weather is displayed at the top of the dashboard. You'll see temperature, humidity, wind speed, and your farm location. This helps you plan irrigation and crop activities!",
        "To check weather: Look at the Weather Card section which shows ☀️ current conditions, 🌡️ temperature, 💨 wind speed, and 💧 humidity.",
      ],
      pump_logs: [
        "The Pump Activity Timeline shows when your pumps have been used. You can see: ⏱️ timestamps, 🔧 which pump was used (basic or acidic), and 📊 the effect on pH. Scroll down to see the full history!",
        "To understand pump logs: Each entry shows when the pump ran and how much it adjusted your pH. This helps you track your farm's management history.",
      ],
      dashboard_navigation: [
        "Your dashboard has several sections: 1) Weather Card - shows current conditions 2) Real-time pH Monitoring - tracks pH levels 3) Pump Activity Timeline - shows pump usage 4) Crop Type Selection - choose your crops. Scroll down to see all!",
        "At the top you'll see the header with your farm info and settings. The main content area shows all your farm metrics in real-time. Use the scroll to explore all sections!",
      ],
      status_indicators: [
        "The Status Indicators show your system health: 🟢 Arduino Connected, System Status (Online/Offline), and Last Update time. This tells you if your monitoring system is working properly.",
        "Check status indicators to ensure your Arduino device is connected and your system is online. This is important for real-time monitoring!",
      ],
      account: [
        "To sign out: Click on your profile icon in the header and select 'Sign Out'. You'll be logged out of your EcoSterile account.",
        "To access account settings: Click on your profile name in the header to see options for settings, profile, and sign out.",
      ],
      general_help: [
        "I can help you with: 🌾 Crop selection, 📊 pH monitoring, 💧 Watering tips, 📱 Dashboard navigation, ⚙️ Settings, 📈 Reading charts, and more!",
        "The dashboard tracks your farm's health in real-time. You can monitor pH, track pump usage, and get crop recommendations all in one place!",
        "Not sure where to find something? Just ask me! I can guide you through any feature on the dashboard.",
      ],
    };
  }

  /**
   * Initialize and render the chatbot
   */
  init() {
    // Create container if it doesn't exist
    let container = document.getElementById(this.containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = this.containerId;
      document.body.appendChild(container);
    }

    this.container = container;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render chatbot UI
   */
  render() {
    this.container.innerHTML = `
      <div class="chatbot-wrapper">
        <!-- Floating Chat Button -->
        <button class="chatbot-button" id="chatbotToggle" title="Open Assistant">
          💬
        </button>

        <!-- Chat Window -->
        <div class="chatbot-window ${
          this.isOpen ? "open" : ""
        }" id="chatbotWindow">
          <div class="chatbot-header">
            <h3>🤖 EcoSterile Assistant</h3>
            <button class="chatbot-close" id="chatbotClose">✕</button>
          </div>

          <div class="chatbot-messages" id="chatbotMessages">
            <!-- Messages will be rendered here -->
          </div>

          <div class="chatbot-input-area">
            <input 
              type="text" 
              id="chatbotInput" 
              class="chatbot-input" 
              placeholder="Ask me anything..."
              autocomplete="off"
            >
            <button class="chatbot-send" id="chatbotSend">Send</button>
          </div>
        </div>
      </div>
    `;

    this.renderMessages();
  }

  /**
   * Render all messages in the chat
   */
  renderMessages() {
    const messagesContainer = document.getElementById("chatbotMessages");
    if (!messagesContainer) return;

    const messagesHTML = this.messages
      .map(
        (msg) => `
      <div class="chatbot-message ${msg.sender}">
        <div class="chatbot-message-content">
          ${this.escapeHtml(msg.text)}
        </div>
        <div class="chatbot-message-time">${msg.time}</div>
      </div>
    `
      )
      .join("");

    messagesContainer.innerHTML = messagesHTML;

    // Auto-scroll to bottom
    setTimeout(() => {
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }, 0);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Toggle chat window
    const toggleBtn = document.getElementById("chatbotToggle");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => this.toggleChat());
    }

    // Close chat window
    const closeBtn = document.getElementById("chatbotClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeChat());
    }

    // Send message
    const sendBtn = document.getElementById("chatbotSend");
    if (sendBtn) {
      sendBtn.addEventListener("click", () => this.sendMessage());
    }

    // Send on Enter key
    const input = document.getElementById("chatbotInput");
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          this.sendMessage();
        }
      });
    }

    // Close chat when clicking outside
    document.addEventListener("click", (e) => {
      const chatbot = document.querySelector(".chatbot-wrapper");
      if (chatbot && !chatbot.contains(e.target) && this.isOpen) {
        this.closeChat();
      }
    });
  }

  /**
   * Toggle chat window open/closed
   */
  toggleChat() {
    if (this.isOpen) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  /**
   * Open chat window
   */
  openChat() {
    this.isOpen = true;
    const window = document.getElementById("chatbotWindow");
    if (window) {
      window.classList.add("open");
    }

    // Show greeting if no messages
    if (this.messages.length === 0) {
      this.addBotMessage(this.getRandomResponse("greetings"));
    }

    // Focus input
    setTimeout(() => {
      const input = document.getElementById("chatbotInput");
      if (input) input.focus();
    }, 100);
  }

  /**
   * Close chat window
   */
  closeChat() {
    this.isOpen = false;
    const window = document.getElementById("chatbotWindow");
    if (window) {
      window.classList.remove("open");
    }
  }

  /**
   * Send user message
   */
  sendMessage() {
    const input = document.getElementById("chatbotInput");
    if (!input) return;

    const message = input.value.trim();
    if (!message) return;

    // Add user message
    this.addUserMessage(message);
    input.value = "";

    // Get bot response
    setTimeout(() => {
      const response = this.getBotResponse(message);
      this.addBotMessage(response);
    }, 500);
  }

  /**
   * Add user message to chat
   */
  addUserMessage(text) {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    this.messages.push({
      sender: "user",
      text: text,
      time: time,
    });

    this.renderMessages();
  }

  /**
   * Add bot message to chat
   */
  addBotMessage(text) {
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    this.messages.push({
      sender: "bot",
      text: text,
      time: time,
    });

    this.renderMessages();
  }

  /**
   * Get bot response based on user message
   */
  getBotResponse(userMessage) {
    const message = userMessage.toLowerCase();

    // Keyword matching for different topics

    // Crop selection & changing crops
    if (
      message.includes("crop") ||
      message.includes("select") ||
      message.includes("grow") ||
      message.includes("change crop") ||
      message.includes("recommend")
    ) {
      return this.getRandomResponse("crop_selection");
    }

    // pH related queries
    if (
      message.includes("ph") ||
      message.includes("acid") ||
      message.includes("basic") ||
      message.includes("alkaline") ||
      message.includes("see ph") ||
      message.includes("view ph") ||
      message.includes("monitor ph")
    ) {
      return this.getRandomResponse("ph_management");
    }

    // Watering & water related
    if (
      message.includes("water") ||
      message.includes("rain") ||
      message.includes("moisture") ||
      message.includes("irrigation")
    ) {
      return this.getRandomResponse("watering");
    }

    // Profile & settings related
    if (
      message.includes("name") ||
      message.includes("profile") ||
      message.includes("setting") ||
      message.includes("farm location") ||
      message.includes("update profile") ||
      message.includes("change name") ||
      message.includes("location")
    ) {
      return this.getRandomResponse("profile_settings");
    }

    // Weather related
    if (
      message.includes("weather") ||
      message.includes("temperature") ||
      message.includes("humidity") ||
      message.includes("wind") ||
      message.includes("forecast")
    ) {
      return this.getRandomResponse("weather");
    }

    // Pump logs
    if (
      message.includes("pump") ||
      message.includes("activity") ||
      message.includes("log") ||
      message.includes("timeline") ||
      message.includes("pump usage")
    ) {
      return this.getRandomResponse("pump_logs");
    }

    // Dashboard navigation
    if (
      message.includes("dashboard") ||
      message.includes("navigate") ||
      message.includes("find") ||
      message.includes("where") ||
      message.includes("section") ||
      message.includes("feature")
    ) {
      return this.getRandomResponse("dashboard_navigation");
    }

    // Status & health
    if (
      message.includes("status") ||
      message.includes("health") ||
      message.includes("online") ||
      message.includes("connected") ||
      message.includes("arduino")
    ) {
      return this.getRandomResponse("status_indicators");
    }

    // Account & sign out
    if (
      message.includes("sign out") ||
      message.includes("logout") ||
      message.includes("account") ||
      message.includes("log out") ||
      message.includes("exit")
    ) {
      return this.getRandomResponse("account");
    }

    // Greetings
    if (
      message.includes("hello") ||
      message.includes("hi") ||
      message.includes("hey") ||
      message.includes("greet") ||
      message.includes("thanks") ||
      message.includes("thank you")
    ) {
      return this.getRandomResponse("greetings");
    }

    // Default response
    const defaultResponses = [
      "That's a great question! I can help you with: 🌾 Crop selection, 📊 pH management, 💧 Watering, 📱 Dashboard features, ⚙️ Settings, and more. What would you like to know?",
      "I'm here to help! You can ask me about crops, pH levels, farming tips, settings, weather, pump logs, or how to use any dashboard feature. What interests you?",
      "Good question! I can guide you through changing your name, viewing pH levels, selecting crops, checking weather, or navigating the dashboard. What would you like help with?",
      "I'm your EcoSterile guide! Ask me about profile settings, crop recommendations, pH monitoring, pump activity, or any dashboard feature. What can I help with?",
      "That's outside my current expertise, but I can definitely help with farming and dashboard navigation! 🌾 What would you like to know?",
    ];

    return defaultResponses[
      Math.floor(Math.random() * defaultResponses.length)
    ];
  }

  /**
   * Get random response from category
   */
  getRandomResponse(category) {
    const responses = this.responses[category] || this.responses.general_help;
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Escape HTML special characters
   */
  escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear chat history
   */
  clearMessages() {
    this.messages = [];
    this.renderMessages();
  }
}
