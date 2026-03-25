# Karavyn Design System: Electric Minimalism

This document outlines the comprehensive style spec and design system for the **Karavyn** mobile application, blending the vibrant, live energy of Zenly with the premium, restrained glassmorphism of modern startup minimalism (like Notion, Linear, or Apple Maps).

---

## 1. Design Direction

**The Philosophy: "Electric Minimalism"**
We are designing a spatial interface, not a flat app. The map is the canvas, and the UI consists of floating, translucent panes of glass hovering above it. We want the user to feel the pulse of their Karavyn without being overwhelmed by visual noise. It should feel like a premium, tactical HUD for social coordination—alive, responsive, but entirely out of your way.

**Explicit Comparison (Zenly vs. Karavyn):**

*   **KEEP:** The live map dominance, floating user avatars, social presence, real-time feedback, and bottom-sheet-driven architecture.
*   **REMOVE:** The chaotic rainbow gradients, cluttered 3D emojis, heavy drop shadows, full-screen color washes, and erratic typography sizing.
*   **EVOLVE:**
    *   *Surfaces:* From opaque/gradient blobs ➔ to high-blur, frosted glass (`expo-blur`).
    *   *Spacing:* From tightly packed UI ➔ to breathable, structured margins.
    *   *Typography:* From playful/bouncy fonts ➔ to geometric, stark, modern sans-serifs.
    *   *Vibe:* From "teen toy" ➔ to "premium social utility."

---

## 2. Visual Identity

*   **Aesthetic:** Minimal but highly expressive. The personality comes from *motion and presence*, not from static colors.
*   **Dark-First:** The app natively lives in a dark mode to allow glowing status indicators and glass layers to pop, saving battery and reducing glare during night drives or late meetups.
*   **Materiality:** UI elements do not have solid backgrounds. They are defined by their blur effect, a very subtle dark translucent fill, and a 1px inner light border to simulate light hitting the edge of a glass pane.
*   **Color as Status:** Color is reserved strictly for semantic meaning (who is online, who is speaking, where is the destination). The chrome of the app is completely neutral.

---

## 3. Color System (Glassmorphic)

### Base

*   **Background (Map):** Muted, deep charcoal/navy custom map style (e.g., Mapbox Dark with desaturated landmasses and subtle road outlines).
*   **UI Canvas:** Transparent (allowing map to show through).

### Glass Layers (React Native Ready)

*   **Glass Dark (Primary Surfaces):** `rgba(15, 15, 15, 0.4)` with Blur Intensity 80.
*   **Glass Light (Highlights/Active):** `rgba(255, 255, 255, 0.08)` with Blur Intensity 50.
*   **Glass Border (Edge Glow):** `rgba(255, 255, 255, 0.12)` (applied as a 1px border).

### Accent Colors

Strictly limited to 2 primary accents to maintain the "Linear/startup" polish.

*   **Primary Accent (Electric Blue):** `#3B8BFF` — Used for active user tracking, primary CTA, and selected states.
*   **Secondary Accent (Neon Mint):** `#00F59B` — Used for live presence ("online now"), successful grouping, and active movement.
*   **Alert (Radical Red):** `#FF3366` — Used for disconnected users, traffic alerts, or SOS/urgency.

### Map Overlay Colors

*   **User Markers:** White borders with user photo inside.
*   **Routes:** Glowing line using Primary Accent (`#3B8BFF`) with an opacity gradient fading into the map.
*   **Group Clusters:** Frosted glass pills with overlapping mini-avatars.

---

## 4. Typography

**Font Family:** `SF Pro Display` (iOS) / `Inter` (Cross-platform).

*   **Weight:** Use primarily Medium (500) for body, and Semibold (600) for headers.
*   **Tracking:** Tighter tracking (-0.02em) on large headers for that modern startup look; slightly looser on tiny metadata for legibility.

**Hierarchy Rules:**

*   **H1 (Karavyn Title/Location):** 28px, Semibold, White, -0.02em tracking.
*   **H2 (Sheet Titles):** 20px, Semibold, White.
*   **Body (Primary):** 16px, Medium, `rgba(255,255,255, 0.9)`.
*   **Caption (Status/Distance):** 13px, Medium, `rgba(255,255,255, 0.5)`.

---

## 5. Glassmorphism System

*Note: In React Native, this is achieved using `expo-blur` wrapped in a `View` with `overflow: 'hidden'` and a subtle `borderColor`.*

### Glass Card (Members, Updates)

*   **Blur:** `dark` tint, intensity 50.
*   **Background Color:** `rgba(20, 20, 20, 0.4)`.
*   **Border:** 1px solid `rgba(255, 255, 255, 0.1)`.
*   **Shadow:** `0px 8px 32px rgba(0, 0, 0, 0.4)` (provides depth separating glass from the map).

### Glass Bottom Sheet (Main Control Center)

*   **Blur:** `dark` tint, intensity 80 (stronger blur so scrolling content underneath is obscured but colors bleed through).
*   **Gradient Tint:** Linear gradient from `rgba(10, 10, 10, 0.8)` at bottom to `rgba(10, 10, 10, 0.4)` at top.
*   **Handle:** 4px high, 32px wide, `rgba(255, 255, 255, 0.3)`, fully rounded.

### Floating Controls (Map Tools, FAB)

*   **Shape:** Perfect circles or heavily rounded squares (`borderRadius: 16`).
*   **Style:** `expo-blur` with `light` tint, intensity 30, `rgba(255,255,255,0.05)` fill.
*   **Icon Emphasis:** Crisp white SVGs with a very subtle drop shadow to pop against the blur.

---

## 6. Map UI Style

The map is the hero. Zenly maps were bright and chaotic; ours is a sleek, tactical radar.

*   **Map Style:** Midnight theme. Roads are dark gray, land is charcoal, water is pitch black. No points-of-interest (POIs) unless relevant to the Karavyn.
*   **Avatars (The "Pulse"):**
    *   Clean circular crop.
    *   2px border (`rgba(255,255,255,0.8)`).
    *   **Status Indicator:** Instead of a separate icon, the border pulses Neon Mint when actively moving/driving.
*   **Movement:**
    *   Avatars slide with smooth interpolation (no jumping).
    *   Optional: A very faint, fading 5-second path "tail" behind fast-moving users, drawn using a gradient.
*   **Clustering:**
    *   When users zoom out, avatars snap together into a glass pill `[ Avatar1 | Avatar2 | +3 ]` instead of overlapping chaotically.
*   **Labels:**
    *   Text labels under avatars ONLY show on tap or when the user is the active focus. Otherwise, just the face.

---

## 7. Core Components

1.  **Floating Action Button (Quick Ping):** Bottom right. Glass circle. Long-press expands into a glass radial menu (Ping, Regroup, Share ETA).
2.  **Map Controls (Compass/Focus):** Top right, stacked vertically. Minimal glass squares (40x40).
3.  **Session Panel (Bottom Sheet):** The core hub. Swipes up in 3 detents (15%, 50%, 90%). Contains destination, ETA ring, and member list.
4.  **Member List Items:** Horizontal rows inside the bottom sheet. Avatar on left, Name & ETA in center, Quick-action (message/call) on right. No backgrounds on the rows, just dividers (`rgba(255,255,255,0.05)`).
5.  **Chat Entry:** A floating glass pill pinned to the keyboard. Blurs the map behind it when typing.

---

## 8. Motion & Animation

*   **Physics:** Use `react-native-reanimated` with spring physics (`withSpring`).
*   **Damping:** High damping, low stiffness. We want fluid, swift movements that settle immediately. **No toy-like rubber-banding.**
*   **Transitions:**
    *   Sheet dragging should strictly follow finger velocity.
    *   Avatars entering the map fade in and scale up from 0.8 to 1.0.
    *   Presence updates (e.g., user starts driving) trigger a subtle ripple ring around their avatar that fades out.

---

## 9. Interaction Principles

*   **One-Hand Usage:** All critical actions (focusing on a user, sending a ping, checking ETA) must be reachable in the bottom 40% of the screen.
*   **Map > UI:** Tapping anywhere outside a glass panel dismisses/minimizes the UI and returns full focus to the map.
*   **Glanceability (Driving Safe):** ETAs and distances must be the highest-contrast text elements on the screen.
*   **Gestures over Buttons:** Swipe down to close, swipe left on a user to ping, long-press to open radial menus.

---

## 10. Design Tokens (Implementation-Ready)

Here is a JSON/Tailwind-compatible token structure for React Native / Expo:

```json
{
  "theme": {
    "colors": {
      "base": {
        "map": "#0A0B0E",
        "textPrimary": "#FFFFFF",
        "textSecondary": "rgba(255, 255, 255, 0.55)",
        "textDisabled": "rgba(255, 255, 255, 0.3)"
      },
      "accent": {
        "primary": "#3B8BFF",
        "active": "#00F59B",
        "alert": "#FF3366"
      },
      "glass": {
        "bgDark": "rgba(15, 15, 15, 0.4)",
        "bgLight": "rgba(255, 255, 255, 0.08)",
        "border": "rgba(255, 255, 255, 0.12)",
        "divider": "rgba(255, 255, 255, 0.06)"
      }
    },
    "blur": {
      "sm": 20,
      "md": 50,
      "lg": 80,
      "tint": "dark"
    },
    "spacing": {
      "xs": 4,
      "sm": 8,
      "md": 16,
      "lg": 24,
      "xl": 32,
      "safeAreaBottom": 34
    },
    "radii": {
      "sm": 8,
      "md": 16,
      "lg": 24,
      "pill": 9999
    },
    "typography": {
      "h1": { "fontSize": 28, "fontWeight": "600", "letterSpacing": -0.5 },
      "h2": { "fontSize": 20, "fontWeight": "600", "letterSpacing": -0.3 },
      "body": { "fontSize": 16, "fontWeight": "500", "letterSpacing": 0 },
      "caption": { "fontSize": 13, "fontWeight": "500", "letterSpacing": 0.2 }
    }
  }
}
```

*Note for Expo: Use `expo-blur` component where `intensity` maps to `blur.md`, `tint` maps to `blur.tint`, wrapped inside a View with `borderRadius: radii.md` and `borderColor: colors.glass.border`.*

---

## 11. What to Avoid

*   **🚫 Rainbow/Gradient Backgrounds:** Do not wash the screen in gradient meshes. Gradients are ONLY for route lines or very subtle accent glows.
*   **🚫 Opaque UI Blocks:** Never use a solid `#1C1C1E` (iOS dark mode) block if it covers the map. If it covers the map, it MUST be glass.
*   **🚫 Heavy Drop Shadows:** Avoid dark, spread-out drop shadows on UI elements. The blur itself provides the depth.
*   **🚫 Cluttered Map Data:** Turn off POIs (restaurants, shops) in the map provider settings. We only care about the users and the roads.
*   **🚫 Excessive Text:** Do not spell out "Estimated Time of Arrival: 5 mins". Use "5m". Keep the cognitive load near zero.

---

## 12. Final Overview

1.  **Design Direction:** "Electric Minimalism." A tactical, dark-first spatial HUD utilizing frosted glass, relying on motion and high-contrast accents over a muted map to create a premium, real-time social experience.
2.  **Full Token System:** Provided above, optimized for React Native StyleSheet / Tailwind config using `expo-blur`.
3.  **Top 5 Components to Build First:**
    *   **GlassBottomSheet:** The core layout wrapper (`gorhom/bottom-sheet` + `expo-blur`).
    *   **MapAvatar:** The pulsing, moving user icon on the map.
    *   **GlassButton:** Floating circular/pill controls.
    *   **MemberRow:** The reusable list item for users in the Karavyn.
    *   **RouteLine:** The glowing path interpolator on the map.
4.  **Biggest UI/UX Risks:**
    *   *Performance:* Rendering multiple `expo-blur` views over a moving map can drop frame rates on older Androids. *Mitigation:* Fallback to solid `rgba(20,20,20, 0.9)` on low-end devices.
    *   *Legibility:* Text over glass over a map can become unreadable if the map underneath is too bright. *Mitigation:* Ensure map base style is strictly dark, and use a dark background tint in the BlurView.
5.  **How this stands out from Zenly:**
    Zenly felt like a video game for teenagers—loud, colorful, and chaotic. **Karavyn feels like a high-end tool for modern adults.** By replacing opaque gradients with frosted glass, strict geometric typography, and a dark-first palette, it retains the "live" feeling but introduces a startup-level premium polish akin to Apple Maps or Linear.