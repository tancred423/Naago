# Privacy Policy

**Last Updated: 2025/12/26**

## 1. Introduction

This Privacy Policy explains how the M'naago Discord Bot ("the Bot") handles information. We are committed to protecting
your privacy and being transparent about our data practices.

## 2. Information We Collect

The Bot collects and stores data necessary to provide its services:

### 2.1 User Data

When you verify your character using `/verify add`, we store:

- **User ID** - Your Discord user's unique identifier
- **Character ID** - Your verified Final Fantasy XIV character's unique identifier
- **Verification Code** - Temporary code used during verification (stored until verification is complete)
- **Verification Status** - Whether your character is verified

### 2.2 Character Data

When character information is requested, we cache:

- **Character ID** - Final Fantasy XIV character's unique identifier
- **Character Data** - Cached character information from Lodestone in JSON format (includes name, server, equipment,
  stats, etc.)
- **Latest Update** - Timestamp of when character data was last fetched

**Important Note on Character IDs:**

All references to "Character ID" in this document refer to the **public Lodestone character ID** (visible in Lodestone
URLs, e.g., `https://eu.finalfantasyxiv.com/lodestone/character/12345/`). This is **NOT** the internal game account ID
or any other private identifier. The Bot only uses public Lodestone character IDs that are already visible to anyone who
views a character's Lodestone profile.

Character data is cached for up to 10 minutes to improve performance and reduce API load.

### 2.3 Favorites Data

When you add characters to favorites using `/favorite add`, we store:

- **User ID** - Your Discord user's unique identifier
- **Character ID** - Favorite character's unique identifier

You can save up to 25 favorite characters.

### 2.4 Profile Settings

When you configure your profile using `/setup theme`, we store:

- **User ID** - Your Discord user's unique identifier
- **Character ID** - Character ID associated with profile settings
- **Theme** - Selected profile theme preference
- **Profile Page** - Current profile page view preference

### 2.5 Guild Configuration

When you configure Lodestone notifications using `/setup lodestone`, we store:

- **Guild ID** - Your Discord server's unique identifier
- **Channel ID** - The text channel ID where you want to receive notifications
- **Notification Type** - Types of notifications enabled (Topics, Notices, Maintenances, Updates, Statuses)

### 2.6 Anonymous Statistics

The Bot collects anonymous usage statistics to understand service usage patterns:

- **Daily server count** - Total number of servers the bot is in
- **Daily active user count** - Number of unique users who interact with the bot (user IDs are hashed with SHA-256 and
  cannot be reversed)
- **Daily command usage counts** - Which commands are used and how often (not who uses them)
- **Daily profile button usage counts** - Which profile buttons are clicked and how often
- **Daily theme usage counts** - Which themes are used and how often
- **Daily lodestone news setup count** - How many servers have news notifications configured
- **Daily verified characters count** - Total number of verified characters

All statistics are completely anonymous. User IDs are hashed using SHA-256 with a salt, making it impossible to identify
individual users from the statistics data.

### 2.7 What We Do NOT Collect

The Bot does **not** collect, store, or process:

- **No message content** - We don't read or store any Discord messages
- **No personal information in statistics** - Statistics only contain anonymous counts and usage patterns
- **No identifiable user data in statistics** - User IDs are hashed and cannot be reversed

## 3. What the Bot Does

The Bot provides Final Fantasy XIV character profiles and Lodestone news:

- **Receives commands** from Discord users (e.g., `/profile`, `/verify`, `/favorite` commands)
- **Fetches character data** from Final Fantasy XIV Lodestone and Naagostone API
- **Generates profile images** based on character data and selected themes
- **Formats and displays** character information in Discord
- **Sends automated notifications** to configured channels when new Lodestone news is available
- **Caches character data** temporarily to improve performance

## 4. Why We Collect This Data

### 4.1 Purpose

Data is collected to:

- **Provide character verification** - Link your Discord account to your Final Fantasy XIV character
- **Display character profiles** - Show character information and generate profile images
- **Remember your preferences** - Store favorite characters, themes, and notification settings
- **Send notifications** - Deliver Lodestone news to configured channels
- **Improve performance** - Cache character data to reduce API calls

### 4.2 Legal Basis

Data collection is based on:

- **Consent** - You explicitly use commands that require data storage (e.g., `/verify add`, `/favorite add`,
  `/setup lodestone`)
- **Legitimate Interest** - Providing the services you request (character profiles, notifications)

## 5. Data Retention and Deletion

### 5.1 How Long We Keep Data

- **User data** - Kept while your character is verified
- **Character data** - Cached for up to 10 minutes, then refreshed when requested
- **Favorites** - Kept until you remove them or delete your verification
- **Profile settings** - Kept while your character is verified
- **Guild configuration** - Kept while the bot is in your server and the channel exists
- **Anonymous statistics** - Daily aggregated statistics are kept indefinitely; temporary tracking data (hashed user
  IDs) is deleted after 7 days

### 5.2 Automatic Deletion

Your data is **automatically deleted** when:

- **You use** `/verify remove` - Deletes all your user data, favorites, and profile settings
- **You remove the bot** from your server - Deletes guild configuration
- **The configured channel is deleted** - Guild configuration becomes invalid
- **Character data expires** - Cached data older than 10 minutes is refreshed on next request

### 5.3 Periodic Cleanup

The Bot performs automatic cleanup to remove:

- Guild configurations for servers the bot is no longer in
- Guild configurations for channels that no longer exist or are inaccessible

### 5.4 Manual Deletion

To manually delete your data:

1. **User data**: Use the `/verify remove` command to remove all user data
2. **Guild configuration**: Use `/setup lodestone` and remove all channels, or remove the bot from your server

## 6. Technical Information We May Log

The Bot may log the following technical information for debugging purposes:

### 6.1 Error Logging

- **Error messages and stack traces** - Technical details about what went wrong
- **Command execution errors** - When commands fail to execute properly
- **API connection issues** - Problems connecting to Lodestone or Naagostone API
- **System errors** - Bot startup issues or crashes
- **Database errors** - Issues with data storage or retrieval

### 6.2 What Error Logs Contain

- **No user information** - Error logs don't include Discord usernames (only technical error details)
- **Only technical details** - Exception types, error codes, and system information
- **Character IDs may appear** - Only in context of technical errors (e.g., "Failed to fetch character 12345")

### 6.3 Example of What We Log

```
ERROR: Failed to fetch character data from Lodestone API
Stack trace: [technical details only]
ERROR: Character data fetch failed for character ID: 12345
```

---

**This Privacy Policy is effective as of the date listed above and applies to all use of the M'naago Discord Bot.**
