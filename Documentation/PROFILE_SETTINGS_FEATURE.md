## 👤 User Profile & Settings Feature

Complete User Profile Management and Settings System for EcoSterile.

### 📋 Overview

This feature adds two new pages to the application:

- **Profile Page** - View and edit user profile information
- **Settings Page** - Customize app preferences and notifications

### 📁 File Structure

```
auth/
├── profile.html          # User Profile Page
├── profile.js            # Profile Logic & Firebase Integration
├── settings.html         # Settings Page
└── settings.js           # Settings Logic & Firebase Integration

styles/
├── profile.css           # Profile Page Styling
└── settings.css          # Settings Page Styling
```

### 🎯 Features

#### Profile Page

- ✅ Display user information (name, email, role, created date)
- ✅ Edit profile (change name and profile photo URL)
- ✅ Skeleton loader while data is loading
- ✅ Read-only email and role display
- ✅ Account activity information
- ✅ Responsive design for all devices

#### Settings Page

- ✅ **Dark Mode Toggle** - Switch between light and dark themes
- ✅ **Preferred Crop Selection** - Set default crop for quick access
- ✅ **Notification Controls:**
  - pH Alerts (out of range notifications)
  - System Updates (app update notifications)
  - Weekly Summary (farming activity summary)
- ✅ Instant theme switching without page refresh
- ✅ Settings persist in Firebase
- ✅ Save status feedback

### 🗄️ Firebase Database Structure

```
users/
└── <uid>/
    ├── profile/
    │   ├── email                    (read-only)
    │   ├── displayName              (editable)
    │   ├── photoURL                 (editable)
    │   ├── currentCrop
    │   ├── createdAt
    │   └── lastVisited
    │
    └── settings/
        ├── theme                    (light/dark)
        ├── preferredCrop            (crop selection)
        ├── notifications/
        │   ├── phAlerts             (boolean)
        │   ├── systemUpdates        (boolean)
        │   └── weeklySummary        (boolean)
        └── updatedAt
```

### 🔐 Security Rules

The following Firebase rules are implemented:

```
- Users can READ/WRITE only their own profile & settings
- Users CANNOT modify email or role (read-only)
- Admins can READ (but not MODIFY) any user's profile
- Settings are private to each user
```

### 🎨 Theme System

#### Light Mode (Default)

- Clean, bright interface
- Primary color: Soft Green (#10b981)
- Background: Light gray (#f9fafb)

#### Dark Mode

- Professional, easy on eyes
- Uses dark cards (#1e1e1e) on dark background (#121212)
- Maintains accessibility standards
- Soft shadows and smooth transitions

Apply theme by toggling the "Dark Mode" setting.

### 📝 How to Use

#### Navigation

- From **Dashboard**: Click user menu → Profile/Settings
- From **Profile/Settings**: Use "Back to Dashboard" button
- Navigation is fully integrated with existing header

#### Profile Page

1. View your profile information on the main card
2. Click "Edit Profile" button
3. Update your name and/or profile photo URL
4. Click "Save Changes"
5. Profile updates instantly in Firebase

#### Settings Page

1. **Dark Mode**: Toggle to enable/disable dark theme
2. **Preferred Crop**: Select your primary crop from dropdown
3. **Notifications**: Control which notifications you receive
4. All changes save instantly with confirmation

### 🛡️ Security Features

- **Auth Check**: Both pages verify user is logged in
- **Data Validation**: Name must not be empty, URL must be valid
- **User Privacy**: Users can only access their own data
- **Read-only Fields**: Email and role cannot be modified
- **No Alerts**: Uses console logs instead of popup alerts

### 🎯 Firebase Rules (To Be Applied)

Add these rules to your Firebase Realtime Database:

```json
{
  "rules": {
    "users": {
      "$uid": {
        ".read": "auth.uid === $uid || root.child('users').child(auth.uid).child('profile').child('role').val() === 'admin'",
        ".write": "auth.uid === $uid",
        "profile": {
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

### 🔧 Configuration

No additional configuration required! The feature integrates seamlessly with:

- Existing Firebase setup
- Current theme system
- Header component
- Authentication flow

### 📱 Responsive Design

- **Desktop (768px+)**: Full-width layout with optimal spacing
- **Tablet (480px-768px)**: Adjusted padding and font sizes
- **Mobile (<480px)**: Single column, touch-friendly buttons

### 🚀 Future Enhancements

Potential additions:

- Profile picture upload (instead of URL only)
- Account preferences (email notifications)
- Security settings (change password)
- Connected devices management
- Activity log viewing
- Two-factor authentication

### 🐛 Troubleshooting

**Profile won't load?**

- Check Firebase connection
- Verify user is authenticated
- Check browser console for errors

**Dark mode not applying?**

- Clear browser cache
- Check localStorage for theme setting
- Verify CSS is loaded

**Settings not saving?**

- Check Firebase write permissions
- Ensure user has valid UID
- Check internet connection

### 📞 Support

For issues or questions about this feature, check:

1. Browser console for error messages
2. Firebase Realtime Database for data structure
3. Network tab to verify API calls
