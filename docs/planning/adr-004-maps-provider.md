# ADR-004: Maps Provider

> **Status:** Accepted
> **Date:** March 2026
> **Decision:** Google Maps Platform with react-native-maps

---

## Context

Karavyn's primary screen is a live map showing session members. The maps provider must support:
- Mobile rendering on iOS and Android via React Native
- Custom markers (member avatars, status indicators, destination pins)
- Place/POI search for destination pinning
- Geocoding (address ↔ coordinates)
- Smooth performance with 15-20+ updating markers
- Reasonable cost at MVP scale

## Decision

Use **Google Maps Platform** (Maps SDK for iOS/Android, Places API, Geocoding API) via the **react-native-maps** library.

## Rationale

- **Best POI and Places data.** Destination search is a core feature. Google Places has the most comprehensive, accurate, and up-to-date database of businesses, venues, and locations worldwide.
- **$200/month free credit.** Google Maps Platform provides $200 in free usage monthly. For MVP-scale usage (a few thousand map loads, a few hundred place searches), this covers the cost entirely.
- **`react-native-maps` default provider.** The library uses Google Maps as the default on Android and supports it on iOS. Well-maintained, widely used, extensively documented.
- **Familiar API.** Google Maps API is the most widely documented maps API. Debugging and troubleshooting is easier with Google's ecosystem.
- **Custom markers.** `react-native-maps` supports fully custom marker components, needed for member avatars with status badges and directional indicators.

## Consequences

- **Positive:** Best-in-class POI data for destination search. Familiar APIs. Strong free tier covers development and early production.
- **Negative:** Google Maps Platform requires an API key and billing account (even with free credit). Must protect the API key (restrict to mobile app bundle IDs).
- **Negative:** If usage grows significantly, costs can increase. Google Maps pricing is usage-based: $7 per 1,000 Dynamic Maps loads (mobile), $17 per 1,000 Places requests. At scale, this needs monitoring.

## Alternatives Considered

| Alternative | Why Rejected |
|---|---|
| **Mapbox** | Better map customization and styling. But weaker POI data for destination search — the use case that matters most. Free tier (25k MAU) is generous but pricing is less transparent at scale. |
| **Apple MapKit** | iOS only. Not viable for cross-platform. |
| **OpenStreetMap (Leaflet/MapLibre)** | Free and open source. But no built-in Places search, requires separate geocoding provider, and `react-native-maps` support is limited compared to Google Maps. |
