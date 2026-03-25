# ADR-006: Background Location Strategy

> **Status:** Accepted
> **Date:** March 2026
> **Decision:** Mode-based background location with expo-location, foreground service (Android), and significant-change API (iOS)

---

## Context

Karavyn's core value in Drive mode is showing convoy members' real-time positions while they're actively driving. This means the app must track location even when the phone screen is off or the app is backgrounded.

Background location is the most technically constrained and policy-sensitive feature in the entire product:
- iOS aggressively suspends background apps and throttles location updates
- Android requires a foreground service with persistent notification for continuous background location
- Both Apple App Store and Google Play require explicit justification for background location access
- Battery drain from continuous GPS is a legitimate user concern
- Privacy regulators and app store reviewers scrutinize background location heavily

## Decision

Implement **mode-based background location** using `expo-location`:

| Mode | Background Behavior |
|---|---|
| **Drive** | Active background location: foreground service (Android) + continuous background updates (iOS) |
| **Walk** | Significant-change monitoring only (both platforms) |
| **Hang** | No background location. Geofence-based arrived/left events only. |

## Rationale

### Drive Mode: Active Background Location

Convoy tracking is the beachhead use case and the strongest justification for background location. A driving session where members disappear from the map when they lock their phone is broken.

- **Android:** Use `expo-location`'s `startLocationUpdatesAsync` with a foreground service. Android displays a persistent notification: "Karavyn: Sharing your location in [Session Name]." This is the standard, Google-approved pattern.
- **iOS:** Request `Always` location permission. Use `expo-location`'s background location task. iOS will allow continuous updates when the app has `UIBackgroundModes: location` in Info.plist. App Store review requires strong justification — our justification is: "Core feature: real-time group coordination during active driving sessions. Location sharing is session-scoped and stops automatically when the session ends."

### Walk Mode: Significant-Change Only

Walking groups don't need 3-5 second GPS updates. The significant-change API (iOS `CLLocationManager.startMonitoringSignificantLocationChanges`, Android equivalent) provides updates when the device moves ~100-500m. This is sufficient to show "roughly where" someone is while being extremely battery-efficient.

### Hang Mode: No Background Location

At a party or static gathering, continuous location tracking adds no value and creates privacy concerns. Use a geofence around the session location to detect arrived/left transitions only.

## Consequences

- **Positive:** Full real-time tracking in Drive mode (the highest-value use case).
- **Positive:** Minimal battery impact in Walk/Hang modes.
- **Positive:** Clear, defensible privacy story: background location is only active during driving sessions and stops when the session ends.
- **Negative:** App Store and Play Store review will scrutinize the background location permission. Must prepare detailed privacy disclosures and purpose strings. Initial rejection is possible — budget 1-2 weeks for review iteration.
- **Negative:** iOS may still throttle or kill the background task under memory pressure. Must handle gracefully (show "last seen" timestamps, degrade to significant-change).
- **Negative:** Android OEMs (Samsung, Xiaomi, Huawei, OnePlus) have custom battery optimization that can kill foreground services. Must detect and guide users to disable battery optimization for Karavyn.

## Implementation Notes

### Permission Request Flow

1. On first session join, request `foregroundPermission` (always needed for map).
2. When user joins or starts a **Drive mode** session, request `backgroundPermission` with explanation: "Karavyn needs background location to show your position on the group map while driving. Location sharing stops when the session ends."
3. If denied, show a non-blocking notice: "Background location is off. Your position may not update when the app is backgrounded." Allow the user to continue — don't block the experience.

### Privacy Policy Requirements

- App Store: NSLocationAlwaysAndWhenInUseUsageDescription must clearly explain the purpose
- Play Store: Background Location Declaration must be submitted with a video demo showing the feature
- Both: Privacy policy must disclose location data collection, purpose, retention (7 days then purged), and that it's session-scoped

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **No background location at all** | Breaks the convoy use case entirely. Members disappear from the map when they lock their phone while driving. Unacceptable. |
| **Background location in all modes** | Unnecessary battery drain and privacy exposure in Walk/Hang modes. Harder to justify to app store reviewers. Over-requesting permissions reduces approval probability. |
| **Third-party location SDK (e.g., Radar, HyperTrack)** | Adds vendor dependency and cost for a feature that `expo-location` handles adequately. Consider only if background reliability becomes a major issue in production. |
