# Android Build & Install Workflow

## IMPORTANT: When User Says "Install APK"

**ALWAYS uninstall first, then install.** This means:
1. Uninstall the existing app from the device
2. Build the APK (if needed)
3. Install the new APK

Never just run `adb install` alone - it causes cached/stale app state.

## Why Uninstall First?

Apps often appear cached after installing a new build because:

1. **APK Signature Matching** - Android only updates if signatures match, otherwise fails silently
2. **Build Cache** - Gradle's incremental builds reuse unchanged code (shows "UP-TO-DATE")
3. **Metro Bundler Cache** - JavaScript bundle can be stale even with new APK
4. **ADB Install `-r` flag** - Replace mode doesn't always refresh if APK hash unchanged

## Recommended Workflow (Fast + Fresh)

### Standard Build & Install (USE THIS BY DEFAULT)
```bash
# Step 1: Uninstall existing app
~/Library/Android/sdk/platform-tools/adb uninstall com.preetoshi.bounsight

# Step 2: Build new APK (uses incremental cache - fast)
export ANDROID_HOME=~/Library/Android/sdk && export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" && cd /Users/preetoshi/bounsight/android && ./gradlew assembleRelease

# Step 3: Install new APK
~/Library/Android/sdk/platform-tools/adb install /Users/preetoshi/bounsight/android/app/build/outputs/apk/release/app-release.apk
```

**One-liner version:**
```bash
~/Library/Android/sdk/platform-tools/adb uninstall com.preetoshi.bounsight && export ANDROID_HOME=~/Library/Android/sdk && export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" && cd /Users/preetoshi/bounsight/android && ./gradlew assembleRelease && cd .. && ~/Library/Android/sdk/platform-tools/adb install android/app/build/outputs/apk/release/app-release.apk
```

**Why this works:**
- Gradle's incremental build only rebuilds changed files (fast ⚡)
- Metro bundler runs fresh JS bundle each time
- Uninstall before install guarantees no cached app state on device
- No need for slow `clean` builds
- Uses `assembleRelease` which is faster than `assembleDebug` for incremental builds

### When to Use Clean Build

Only use `clean` when you suspect Gradle is confused (rare cases):

```bash
# Clean build (slow - rebuilds everything)
export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home" && cd android && ./gradlew clean assembleRelease
```

**When to clean:**
- After adding new native dependencies
- After changing native build config (build.gradle, AndroidManifest.xml)
- After Gradle cache corruption errors
- After switching branches with native changes

### Quick Commands

Check if app is installed:
```bash
~/Library/Android/sdk/platform-tools/adb shell pm list packages | grep bounsight
```

Check APK build timestamp:
```bash
ls -lh android/app/build/outputs/apk/release/app-release.apk
```

Force kill app on device:
```bash
~/Library/Android/sdk/platform-tools/adb shell am force-stop com.preetoshi.bounsight
```

## Key Insight

**The problem isn't the build cache, it's the install cache.**

By always uninstalling first, we get fresh app state while keeping fast incremental builds. This is the optimal balance of speed and reliability.

