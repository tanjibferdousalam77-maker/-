# Dhaka Snack Ready! (ঢাকা স্ন্যাকস রেডি) - 3D Arcade Idle Tycoon

An isometric 3D arcade idle restaurant management game inspired by *Pizza Ready!*, set in a bustling Dhaka street food cafe serving authentic Bangladeshi street snacks: **পুরি (Puri), সিঙ্গারা (Singara), সমুচা (Samosa), and গরম জিলাপি (Hot Jilapi)**.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following product decisions were confirmed during the interactive interview:
> - **Visual Style**: Isometric 3D arcade style with clean stylized low-poly PBR models, dynamic item stacking, and fluid animations mirroring the hit mobile title *Pizza Ready!*.
> - **Setting & Theme**: Dhaka street food cafe featuring dine-in tables, outdoor street ambience, Taka (৳) currency, and a colorful Rickshaw Takeaway / Delivery counter.
> - **Control Scheme**: Dual controls supporting virtual touch joystick for mobile/touch screens, mouse drag, and desktop WASD / Arrow keys with tactile movement feedback.

- **Confirmed Decision 1**: Authentic Bengali street food menu unlocked progressively: **পুরি (Puri) ➔ সিঙ্গারা (Singara) ➔ সমুচা (Samosa) ➔ জিলাপি (Jilapi)**, plus a traditional **দুধ চা (Spiced Milk Tea)** stall.
- **Confirmed Decision 2**: Core arcade idle loop includes food frying, tall item stacking on the player's hands/head, serving counter orders, clearing dine-in customer tables, picking up ৳ Taka bills, hiring "Mama" staff (waiters and fry chefs), and expanding floor space via standing upgrade pads.
- **Confirmed Decision 3**: Real-time sound effects generated procedurally via the Web Audio API (frying sizzle, stack pops with rising pitches, coin drops, cash register chimes, eating munch sounds) requiring zero external media files.

---

## 1. Overview & Core Concept

- **What It Does**: The player controls a vibrant Bangladeshi snack cafe manager running around an isometric 3D shop. Fresh puri and singara fry in sizzling oil vats, drop onto pick-up warmers, and stack onto the player's arms. The player rushes to serve queuing counter customers and seated dine-in tables, collects ৳ Taka tips, cleans up empty trays, and steps onto glowing upgrade pads to expand the restaurant, unlock samosas and jilapi, hire automated helper staff ("Mama" workers), and service rickshaw delivery orders.
- **Target Audience / Persona**: Fans of arcade idle games (like *Pizza Ready!*, *Burger Please!*, *My Mini Mart*), casual gamers, and anyone who loves Bengali street food culture.
- **Key Value**: Delivers the tactile, satisfying stacking and tycoon expansion gameplay loop of *Pizza Ready!* paired with the charming, authentic street culture and flavors of Bangladesh.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Starting the Stall**: The player starts with 1 Puri fryer and a cash register counter. Walking near the fryer warmer stacks golden puffed puris onto the player. Walking to the register serves the waiting customers, who drop crisp ৳ Taka notes on the floor.
2. **Expanding the Dining Area**: Stepping on the glowing ৳50 pad unlocks Table 1. Customers can now dine in, enjoy their tea and snacks, and leave extra tips plus empty plates that need clearing into the waste bin.
3. **Unlocking Menu Items & Stations**:
   - ৳150 ➔ Unlocks the **সিঙ্গারা (Singara)** station with spiced potato filling.
   - ৳300 ➔ Unlocks Table 2 & Table 3.
   - ৳500 ➔ Unlocks the **সমুচা (Samosa)** crispy triangle station.
   - ৳800 ➔ Unlocks the **রিকশা টেকঅ্যাওয়ে (Rickshaw Delivery Counter)** where bulk orders pull up for massive bonus payouts.
   - ৳1,200 ➔ Unlocks the **জিলাপি (Jilapi)** hot spiral sweet station & Spiced Cha stall.
4. **Hiring Automated Staff ("Mama" Workers)**:
   - **বাবুর্চি মামা (Fryer Chef Mama)**: Speeds up snack cooking and warmer refilling.
   - **সার্ভিস বয় মামা (Waiter Mama)**: Carries food from warmers to the counter and tables.
   - **ক্লিনার মামা (Cleaner Mama)**: Cleans dining tables and empties trash.
5. **Afternoon Rush Hour ("বিকেলের নাস্তার ভিড়")**: Periodic rush events double customer traffic and tips for 30 seconds, accompanied by celebratory confetti and bustling street sounds.

### Visual Identity & Theme
- **Aesthetic Direction**: Stylized low-poly 3D isometric arcade with warm golden lighting, smooth pastel tiles, wooden cafe tables, stainless steel street fryers, and authentic Bangladeshi rickshaw art motifs.
- **Color Palette**:
  - Dominant Canvas: Warm neutral street cafe concrete and terracotta clay floor tiles (`#E8DFD8` / `#D4C5B9`).
  - Structural Surfaces: Stainless steel fryers (`#94A3B8`), dark warm teakwood counter & tables (`#5C3D2E`), brass tea samovar (`#D97706`).
  - Food Accents: Golden Puri (`#F59E0B`), Crispy Singara (`#D97706`), Brown Samosa (`#B45309`), Bright Saffron Jilapi (`#EA580C`), Fresh Mint Chutney Green (`#10B981`).
  - Currency & HUD: Bangladesh Taka Teal & Emerald Green (`#059669`), Golden Star XP badges.
- **Typography & Hierarchy**:
  - Display Header: `Plus Jakarta Sans` / Bengali font display with clear dual-language titling (`ঢাকা স্ন্যাকস রেডি · Dhaka Snack Ready`).
  - Currency & Metric HUD: `tabular-nums font-mono` for Taka balances (`৳ 2,450`), carry capacity counters (`8 / 12`), and customer timers.
- **Interactive Feedback & Motion**:
  - Elastic item stack wobble as the player turns and runs.
  - Parabolic arc trajectory for items flying into the stack and cash popping onto the counter.
  - Stepping on circular floor upgrade pads fills a radial progress meter with tactile ticking sound.
  - Floating ৳ Taka bill particles that fly smoothly into the wallet counter in the HUD.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Procedural 3D Models via Three.js Groups**
  - *Chosen Approach*: Build composite 3–8 part procedural 3D models for all characters, fryers, tables, rickshaw, and food items (Puri, Singara, Samosa, Jilapi, Cha cups) using Three.js geometries and PBR materials with studio lighting and soft shadows.
  - *Why*: Guarantees zero 404 asset dependencies, ultra-fast load times, and complete freedom to customize animations, wobble kinematics, and colors.
  - *Alternatives Considered*: External GLTF/GLB downloads; rejected due to external network flakiness, asset mismatch, and licensing.
- **Decision 2: Dual On-Screen Touch Joystick + Desktop Keyboard Controls**
  - *Chosen Approach*: Floating virtual joystick for touch/mouse drag plus direct WASD / Arrow key listeners for keyboard players, with instant direction normalization and smooth character acceleration.
  - *Why*: Allows seamless play on both mobile devices and desktop browsers without mode switching.
- **Decision 3: Procedural Web Audio API Sound System**
  - *Chosen Approach*: Real-time synthesized audio using Web Audio oscillators and noise nodes for bubbling oil, stacking pops with progressive harmonic intervals, coin chimes, and rush sirens.
  - *Why*: Zero audio lag, zero external mp3 files, full pitch-shifting responsiveness based on stack height.
- **Decision 4: LocalStorage Persistent Game State**
  - *Chosen Approach*: Auto-save player money, unlocked stations, staff levels, and upgrades to browser `localStorage` every 3 seconds and upon milestone events.
  - *Why*: Players can refresh or return anytime without losing their bustling snack empire.

---

## 4. Technical Architecture & Data Strategy

### System Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          Dhaka Snack Ready                             │
│                                                                        │
│  ┌───────────────────────────┐     ┌────────────────────────────────┐  │
│  │   Top HUD Overlay         │     │   Quick Action Toolbar         │  │
│  │   - ৳ Taka Balance        │     │   - Sound Mute / Unmute        │  │
│  │   - Stack Capacity (4/12) │     │   - Stats & Upgrades Modal     │  │
│  │   - Rush Hour Progress    │     │   - Reset / Save State         │  │
│  └─────────────┬─────────────┘     └───────────────┬────────────────┘  │
│                │                                   │                   │
│  ┌─────────────▼───────────────────────────────────▼────────────────┐  │
│  │                Isometric 3D Canvas (Three.js)                    │  │
│  │                                                                  │  │
│  │   ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐  │  │
│  │   │  Snack Kitchen   │  │  Service Counter │  │ Seating Area  │  │  │
│  │   │  - Puri Fryer    │  │  - Register Pos  │  │ - Table 1..4  │  │  │
│  │   │  - Singara Fryer │  │  - Customer Line │  │ - Eating Nom  │  │  │
│  │   │  - Samosa Vat    │  │  - Cash Drop Piles  - Trash Clearing│  │
│  │   │  - Jilapi Pan    │  │                  │  │ - Big Tips    │  │  │
│  │   └────────┬─────────┘  └────────┬─────────┘  └───────┬───────┘  │  │
│  │            │                     │                    │          │  │
│  │   ┌────────▼─────────────────────▼────────────────────▼───────┐  │  │
│  │   │         Dynamic Actors & Entity Simulation Loop           │  │  │
│  │   │   - Player (Wobbly stack physics, Joy/WASD controller)    │  │  │
│  │   │   - Customers (FSM: Enter -> Queue -> Order -> Eat/Leave) │  │  │
│  │   │   - Hired Mamas (Pathfinding to warmers/tables/counter)   │  │  │
│  │   │   - Rickshaw Delivery (Arrives at window for bulk orders) │  │  │
│  │   └──────────────────────────────┬────────────────────────────┘  │  │
│  └──────────────────────────────────┼───────────────────────────────┘  │
│                                     │                                  │
│  ┌──────────────────────────────────▼───────────────────────────────┐  │
│  │                      Bottom Interaction Dock                     │  │
│  │  - Virtual Touch Joystick (Mobile & Mouse Drag)                  │  │
│  │  - Upgrades Panel Drawer (Player Speed, Stack, Mamas, Stations)  │  │
│  │  - Rush Hour "বিকেলের নাস্তার ভিড়" Trigger                       │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### Core Data Models & State Architecture

1. **Snack Definitions**:
   - `PURI`: { id: 'puri', nameBn: 'পুরি', nameEn: 'Puri', fryTime: 1.8s, price: ৳15, color: '#f59e0b' }
   - `SINGARA`: { id: 'singara', nameBn: 'সিঙ্গারা', nameEn: 'Singara', fryTime: 2.5s, price: ৳25, color: '#d97706' }
   - `SAMOSA`: { id: 'samosa', nameBn: 'সমুচা', nameEn: 'Samosa', fryTime: 3.0s, price: ৳35, color: '#b45309' }
   - `JILAPI`: { id: 'jilapi', nameBn: 'জিলাপি', nameEn: 'Jilapi', fryTime: 3.5s, price: ৳50, color: '#ea580c' }

2. **Player & Upgrades State**:
   - `money`: Current ৳ Taka in hand
   - `speed`: Movement speed multiplier (Level 1..5)
   - `capacity`: Maximum stacked food units (4, 6, 8, 12, 16, 20)
   - `unlockedStations`: ['puri', 'singara', 'samosa', 'jilapi']
   - `unlockedTables`: count of active tables (1 to 4)
   - `rickshawUnlocked`: boolean
   - `hiredStaff`:
     - `chefMama`: Level (0 = none, 1..3 = faster cooking)
     - `waiterMama`: Level (0 = none, 1..3 = faster runner)
     - `cleanerMama`: Level (0 = none, 1 = active)

3. **Customer Entity State Machine**:
   - `SPAWNED` ➔ `WALKING_TO_COUNTER` / `WALKING_TO_TABLE` ➔ `WAITING_FOR_FOOD` ➔ `EATING` ➔ `LEAVING_WITH_CASH_DROP`

---

## 5. Implementation Roadmap (Phases for Execution)

1. **Step 1: Dependencies & Base Setup**:
   - Install `three` and `@types/three`, `canvas-confetti` and `@types/canvas-confetti`.
   - Update `metadata.json` and `index.html` with proper Bengali-English game branding, viewport settings, and fonts.
2. **Step 2: 3D Scene & Procedural Restaurant World**:
   - Isometric camera with smooth damping following the player.
   - Floor layout with warm tiles, wall partitions, decorative street trees, Dhaka street backdrop.
   - 3D models for Snack Fryers, Cash Counter, Dining Tables, Rickshaw delivery bay, and Trash Bin.
3. **Step 3: Procedural Bangladeshi Food Items & Stacking System**:
   - 3D meshes for Puri (puffy disc), Singara (pyramidal tetrahedron), Samosa (flat triangle), Jilapi (golden coil).
   - Dynamic wobbling vertical stack atop the player's hands with Spring kinematics.
4. **Step 4: AI Customer Lifecycle & Orders**:
   - Diverse procedural Bengali customer models (panjabi, sari, casual street outfits).
   - Order speech bubbles with snack icons and quantity countdowns.
   - Money dropping mechanics with smooth bill physics and collection triggers.
5. **Step 5: Hired "Mama" Staff & Standing Upgrade Pads**:
   - Interactive circular floor pads that automatically deduct Taka and unlock tables/fryers/rickshaw when standing inside.
   - AI Worker Mamas with aprons running automated pickup, delivery, and table wiping tasks.
6. **Step 6: HUD, Controls, Audio & Polish**:
   - Virtual on-screen joystick + WASD navigation.
   - Collapsible upgrade dock and sound toggle.
   - Web Audio sound effects engine (fry sizzle, plop stack, ding, eat crunch, celebratory fanfare).
   - LocalStorage auto-save and reset option.
