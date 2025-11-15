# Terms of Service

**Last Updated: 2025/11/15**

## 1. Acceptance of Terms

By using the M'naago Discord Bot ("the Bot"), you agree to be bound by these Terms of Service ("Terms"). If you do not
agree to these Terms, please do not use the Bot.

## 2. Description of Service

The M'naago Discord Bot is a Discord bot that provides Final Fantasy XIV character profile information and automated
Lodestone news notifications. The Bot offers the following commands:

### Character Profile

- `/profile me` - View your verified character's profile
- `/profile find` - View anyone's character profile by name and server
- `/profile favorite` - View a favorite character's profile

### Verification

- `/verify add` - Verify your character by linking it to your Discord account
- `/verify remove` - Unlink your character and delete all stored data

### Informational

- `/help` - Provides information about the Bot and its usage
- `/maintenance` - View current maintenances if any

### Favorites

- `/favorite add` - Add a character to your favorites (up to 25)
- `/favorite remove` - Remove a character from your favorites

### Setup

- `/setup theme` - Set a theme for your verified character's profile
- `/setup lodestone` - Configure channels to receive automated Lodestone news notifications

## 3. User Responsibilities

### 3.1 Appropriate Use

You agree to use the Bot only for lawful purposes and in accordance with:

- Discord's Terms of Service
- These Terms of Service

### 3.2 Prohibited Activities

You may not:

- Use the Bot to violate any applicable laws or regulations
- Use the Bot in a manner that could damage, disable, or impair the service
- Attempt to gain unauthorized access to the Bot or its systems
- Use the Bot to impersonate other users or characters
- Abuse the verification system or attempt to verify characters you do not own

## 4. Data Storage and Privacy

### 4.1 Data We Store

The Bot stores the following data:

**User Data:**

- **User ID** - Your Discord user's unique identifier
- **Character ID** - Your verified Final Fantasy XIV character's unique identifier
- **Verification Code** - Temporary code used for character verification
- **Verification Status** - Whether your character is verified

**Character Data:**

- **Character ID** - Final Fantasy XIV character's unique identifier
- **Character Data** - Cached character information from Lodestone (JSON format)
- **Latest Update** - Timestamp of when character data was last fetched

**Important Note on Character IDs:**

All references to "Character ID" in this document refer to the **public Lodestone character ID** (visible in Lodestone
URLs, e.g., `https://na.finalfantasyxiv.com/lodestone/character/12345/`). This is **NOT** the internal game account ID
or any other private identifier. The Bot only uses public Lodestone character IDs that are already visible to anyone who
views a character's Lodestone profile.

**Favorites:**

- **User ID** - Your Discord user's unique identifier
- **Character ID** - Favorite character's unique identifier

**Profile Settings:**

- **User ID** - Your Discord user's unique identifier
- **Character ID** - Character ID associated with profile settings
- **Theme** - Selected profile theme preference
- **Profile Page** - Current profile page view preference

**Guild Configuration:**

- **Guild ID** - Your Discord server's unique identifier
- **Channel ID** - The channel where Lodestone news notifications should be sent
- **Notification Type** - Types of notifications enabled (Topics, Notices, Maintenances, Updates, Statuses)

### 4.2 Data Deletion

Your data is automatically deleted when:

- You use the `/verify remove` command (deletes all user data)
- You remove channels via `/setup lodestone` (deleted the channels you remove)
- You kick the bot from your server (deleted all server data)

The Bot also performs periodic cleanup to remove invalid or outdated data.

### 4.3 Character Data Caching

Character data is cached for up to 10 minutes to reduce API load and improve response times. When you request character
information, the Bot will use cached data if available and recent, or fetch fresh data from Lodestone if the cache is
expired or missing.

### 4.4 Privacy

For full privacy details, see our Privacy Policy. By using the Bot, you also agree to our Privacy Policy.

## 5. Third-Party Services

The Bot integrates with:

- **Final Fantasy XIV Lodestone** - Official Square Enix service for character data
  (https://eu.finalfantasyxiv.com/lodestone/)
- **Naagostone API** - First-party API service for Final Fantasy XIV character data

## 6. Intellectual Property

### 6.1 Bot Code

The Bot is open source and available under the MIT License. The source code can be found at:
https://github.com/Tancred423/Naago

### 6.2 Third-Party Content

- Final Fantasy XIV is a trademark of Square Enix Co., Ltd.
- The Bot is not affiliated with Square Enix or any third-party services
- All game-related content and trademarks belong to their respective owners
- Profile themes and visual assets are created for the Bot but may reference Final Fantasy XIV content

## 7. Disclaimers and Limitations

### 7.1 Service Availability

- The Bot is provided "as is" without warranties of any kind
- We do not guarantee uninterrupted service availability
- The Bot may be temporarily unavailable for maintenance or updates
- Service may be affected by Discord API outages or third-party service disruptions

### 7.2 Data Accuracy

- Character data is fetched from Final Fantasy XIV Lodestone and may not always be up-to-date
- The Bot caches character data for performance, which may result in slightly outdated information
- Character names and server information may change, and the Bot will update cached data when refreshed
- The Bot is not responsible for data accuracy as it only displays information provided by Square Enix's Lodestone
  service

### 7.3 Notification Accuracy

- Lodestone news notifications are based on automated checks and may not be instant
- We do not guarantee notification delivery timing or accuracy
- Technical issues may prevent notifications from being sent
- Notifications depend on the availability of Lodestone and third-party API services

### 7.4 Character Verification

- Character verification requires adding a verification code to your character's Lodestone biography
- False verification or impersonation may result in service termination

## 8. Modifications and Updates

### 8.1 Terms Updates

We reserve the right to modify these Terms at any time. Changes will be posted in this document with an updated "Last
Updated" date. Continued use of the Bot constitutes acceptance of the modified Terms.

### 8.2 Bot Updates

The Bot may be updated to improve functionality, fix bugs, or add new features. Updates are automatic and do not require
user action. Some updates may change or remove features with reasonable notice.

## 9. Termination

### 9.1 User Termination

You may stop using the Bot at any time by:

- Removing it from your Discord server (your server configuration will be automatically deleted)
- Using the `/verify remove` command (your user data will be automatically deleted)

### 9.2 Service Termination

We reserve the right to:

- Suspend or terminate the Bot service at any time
- Block access to users who violate these Terms
- Discontinue the service with reasonable notice
- Remove or modify features as needed

## 10. Discord Integration

### 10.1 Discord Terms Compliance

This Bot operates within Discord's platform and is subject to Discord's Terms of Service. Users must comply with both
Discord's Terms and these Terms.

### 10.2 Required Permissions

The Bot requires the following Discord permissions:

- **Create Slash Commands** - To register and use commands
- **Embed Links** - To display formatted information
- **Send Messages** - To send notifications and command responses
- **Use External Emojis** - To display game-related icons and visual elements
- **View Channels** - To see configured channels for notifications
- **Attach Files** - To send generated character profile images

## 11. Character Verification

### 11.1 Verification Process

To verify your character:

1. Use the `/verify add` command with your character name and server
2. Add the provided verification code to your character's Lodestone biography
3. Click the verification button in Discord
4. Your character will be linked to your Discord account

### 11.2 Verification Requirements

- You must have access to edit your character's Lodestone biography
- You can remove the verification code after successful verification

### 11.3 Verification Limitations

- Only one character can be verified per Discord account
- Verification can be changed by using `/verify add` with a different character
- Unverified users have limited access to certain Bot features

## 12. Favorites System

### 12.1 Favorites Limitations

- Users can save up to 25 characters as favorites
- Favorites are stored by character ID, not name
- Character names and servers in favorites are automatically updated when character data is refreshed
- Favorites may become unavailable if character data cannot be fetched

### 12.2 Favorites Management

- Use `/favorite add` to add characters to your favorites
- Use `/favorite remove` to remove characters from your favorites
- Favorites are user-specific and not shared between Discord accounts

## 13. Contact Information

For questions, concerns, or support regarding these Terms or the Bot:

- **GitHub Issues**: https://github.com/Tancred423/Naago/issues
- **Developer**: Tancred (GitHub: @Tancred423)

## 14. Governing Law

These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law
principles.

## 15. Severability

If any provision of these Terms is found to be unenforceable or invalid, the remaining provisions shall remain in full
force and effect.

---

**By using the M'naago Discord Bot, you acknowledge that you have read, understood, and agree to be bound by these Terms
of Service.**
