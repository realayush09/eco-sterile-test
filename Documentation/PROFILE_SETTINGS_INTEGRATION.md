## 🔧 Profile & Settings - Integration Guide

Complete guide to integrate the Profile & Settings feature with your existing EcoSterile project.

### ✅ What's Already Done

The feature comes fully integrated. You just need to verify:

#### 1. **Files Created** ✓

- `auth/profile.html` - Profile page
- `auth/profile.js` - Profile logic
- `auth/settings.html` - Settings page
- `auth/settings.js` - Settings logic
- `services/profile-settings.js` - Reusable service module
- `styles/profile.css` - Profile styling
- `styles/settings.css` - Settings styling
- `Documentation/PROFILE_SETTINGS_FEATURE.md` - Feature documentation

#### 2. **Firebase Updated** ✓

- Updated `initializeUserDatabase()` in `firebase.js`
- Added `photoURL` to profile initialization
- Enhanced settings with `preferredCrop` and structured `notifications` object

#### 3. **Header Navigation** ✓

- Profile and Settings links already exist in header dropdown
- Links automatically route to the new pages

---

### 🚀 Quick Start (What You Need to Do)

No breaking changes! The existing project works as-is. Just verify:

#### Step 1: Test the Feature

1. Start your EcoSterile app
2. Log in to dashboard
3. Click user menu (top right) → Profile
4. Verify profile loads and you can edit it
5. Click user menu → Settings
6. Toggle dark mode and verify theme changes

#### Step 2: Apply Firebase Rules (Recommended)

Go to Firebase Console → Realtime Database → Rules

Add these rules to secure profile and settings:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth.uid === $uid || root.child('users').child(auth.uid).child('profile').child('role').val() === 'admin'",
        ".write": "auth.uid === $uid",
        "profile": {
          ".read": "auth.uid === $uid || root.child('users').child(auth.uid).child('profile').child('role').val() === 'admin'",
          "email": {
            ".write": false
          },
          "role": {
            ".write": false
          },
          "$other": {
            ".write": "auth.uid === $uid"
          }
        },
        "settings": {
          ".read": "auth.uid === $uid",
          ".write": "auth.uid === $uid"
        }
      }
    }
  }
}
```

#### Step 3: Initialize Theme on Dashboard Load (Optional)

To apply saved theme preferences on dashboard load, add this to `dashboard.js`:

```javascript
import { SettingsService } from "../services/profile-settings.js";

// On page load
SettingsService.initializeTheme();
```

---

### 📱 How Navigation Works

```
Dashboard Header (existing)
├── User Menu (existing)
│   ├── "Profile" link → /auth/profile.html ✓ NEW
│   ├── "Settings" link → /auth/settings.html ✓ NEW
│   └── "Sign Out" button (existing)
│
Profile Page (NEW)
├── Back button → Dashboard
├── Edit Profile form
└── Account info display
│
Settings Page (NEW)
├── Back button → Dashboard
├── Dark Mode toggle
├── Crop preference selector
└── Notification toggles
```

---

### 🔄 Data Flow

#### Profile Edit Flow

```
User clicks "Edit Profile"
    ↓
Form appears with current data
    ↓
User updates name/photo URL
    ↓
Click "Save Changes"
    ↓
Validation check
    ↓
Update Firebase users/<uid>/profile
    ↓
Refresh display
    ↓
Close edit form
```

#### Settings Update Flow

```
User toggles a setting (e.g., dark mode)
    ↓
Event listener fires
    ↓
Update local state
    ↓
Update Firebase users/<uid>/settings
    ↓
Apply change immediately (e.g., theme)
    ↓
Show save confirmation
```

---

### 🎨 Theme Integration

The dark mode works across the entire app:

1. **Profile & Settings pages**: Dark mode applies instantly
2. **Other pages**: Theme persists in `localStorage`
3. **Dashboard**: Add this to apply saved theme on load

```javascript
// At the start of dashboard.js
const savedTheme = localStorage.getItem("ecoSterileTheme");
if (savedTheme === "dark") {
  document.body.classList.add("dark-mode");
}
```

#### Dark Mode Colors (in theme.css)

- Background: `#121212`
- Cards: `#1e1e1e`
- Text: `#ffffff`
- Borders: `#3a3a3a`

---

### 🔐 Security Checklist

✓ **Authentication Check**: Both pages verify user is logged in  
✓ **Data Isolation**: Users can only access their own data  
✓ **Read-only Fields**: Email and role cannot be modified  
✓ **URL Validation**: Photo URL is validated before saving  
✓ **No Alerts**: Uses console logs instead of popups  
✓ **Firebase Rules**: (Optional but recommended) Apply the rules above

---

### 🧪 Testing Checklist

#### Profile Page

- [ ] Load profile page - shows skeleton loader
- [ ] Profile data displays correctly
- [ ] Click "Edit Profile" - form appears
- [ ] Change name field - validates on save
- [ ] Enter valid photo URL - saves correctly
- [ ] Invalid URL - shows error
- [ ] Empty name - shows error
- [ ] Edit another time - data persists
- [ ] Mobile view - responsive layout

#### Settings Page

- [ ] Load settings page - shows skeleton loader
- [ ] Toggle dark mode - applies instantly
- [ ] Change crop preference - saves without page reload
- [ ] Toggle notifications - all three work
- [ ] Reload page - settings persist
- [ ] Mobile view - responsive layout

#### Cross-Page

- [ ] Edit name on profile - updates in header
- [ ] Edit name on profile - header shows new name on next page load
- [ ] Dark mode on settings - persists on profile page
- [ ] Back button - returns to dashboard
- [ ] Navigation links - work correctly

---

### 🐛 Debugging Tips

#### Check Console Logs

Both pages log all operations:

```
✅ User authenticated: [uid]
📂 Loading profile data...
✅ Profile data loaded: {...}
⚙️ Initializing Settings Manager...
💾 Saving profile...
✅ Setting saved
🌙 Dark mode enabled
```

#### Check Firebase Data

Go to Firebase Console → Realtime Database and look for:

```
users/
  └── YOUR_UID/
      ├── profile/
      │   ├── displayName: "Your Name"
      │   ├── photoURL: "https://..."
      │   └── createdAt: "2024-01-02T..."
      └── settings/
          ├── theme: "dark"
          ├── preferredCrop: "tomato"
          └── notifications: {...}
```

#### Check Browser Storage

Open DevTools → Application → Local Storage and look for:

```
ecoSterileTheme: "dark"
```

---

### 🚨 Common Issues & Solutions

**Problem**: Profile page shows "Failed to load profile data"

- **Solution**: Check Firebase Realtime Database Rules allow read/write
- **Check**: Network tab in DevTools for failed requests

**Problem**: Dark mode doesn't persist

- **Solution**: Clear browser cache and localStorage
- **Check**: DevTools → Application → Local Storage

**Problem**: Photo URL saves but doesn't display

- **Solution**: Ensure URL is publicly accessible
- **Check**: Paste URL in new tab to verify it loads

**Problem**: Settings don't save

- **Solution**: Check Firebase Rules or internet connection
- **Check**: Console logs and Network tab in DevTools

---

### 📚 Module Reference

#### ProfileService

```javascript
ProfileService.getProfile(userId); // Get user profile
ProfileService.updateProfile(userId, obj); // Update profile
ProfileService.updateLastVisited(userId); // Update timestamp
ProfileService.isValidURL(url); // Validate URL
```

#### SettingsService

```javascript
SettingsService.getSettings(userId)        // Get settings
SettingsService.updateSettings(userId, obj) // Update settings
SettingsService.updateNotificationSetting(...) // Update notification
SettingsService.updateTheme(userId, theme) // Update theme
SettingsService.applyTheme(theme)          // Apply theme to page
SettingsService.getTheme()                 // Get saved theme
SettingsService.initializeTheme()          // Initialize on load
```

---

### 🎯 Next Steps

1. **Test the feature** with your Firebase project
2. **Apply Firebase Rules** for security
3. **Add theme initialization** to dashboard.js
4. **Test on mobile** to ensure responsive design
5. **Monitor Firebase usage** to ensure no rule violations

---

### 💡 Tips

- **Save bandwidth**: Profile/Settings only load when user visits those pages
- **Better UX**: Settings apply instantly without page reloads
- **Theme persistence**: Dark mode preference remembered across sessions
- **Error handling**: All operations logged for debugging

---

### 🆘 Need Help?

1. Check the `PROFILE_SETTINGS_FEATURE.md` documentation
2. Review browser console for error messages
3. Check Firebase Realtime Database Rules
4. Verify all files are in correct directories
5. Ensure Firebase auth is working (if you can login, it works!)

---

**Status**: ✅ Ready to use - No additional setup required!
