# FRONTEND ARCHITECTURE

## 1. Recommended Stack

- React
- TypeScript
- Vite
- Axios or fetch
- Leaflet / React-Leaflet

## 2. Directory Structure

```text
frontend/
|
+-- src/
|   +-- components/
|   |   +-- Header.tsx
|   |   +-- DecisionCard.tsx
|   |   +-- SensorCard.tsx
|   |   +-- MapView.tsx
|   |   +-- EvidencePanel.tsx
|   |   +-- LoadingState.tsx
|   |
|   +-- pages/
|   |   +-- CoordinatePage.tsx
|   |   +-- ImageMatchingPage.tsx
|   |
|   +-- services/
|   |   +-- api.ts
|   |
|   +-- types/
|   |   +-- api.ts
|   |
|   +-- hooks/
|   |   +-- useMatching.ts
|   |
|   +-- App.tsx
|
+-- package.json
+-- vite.config.ts
```

## 3. Main Components

### DecisionCard

Displays:

- decision
- consistency score
- explanation

### SensorCard

Displays:

- sensor name
- image
- observation ID
- coordinates

### MapView

Displays:

- map
- common point
- sensor locations

### EvidencePanel

Displays:

- pairwise distances
- match information
- geometric evidence

## 4. State

Application state should include:

- current mode
- latitude
- longitude
- OHRC file
- TMC-2 file
- IIRS file
- loading
- result
- error

## 5. API Abstraction

Create one frontend API service.

Suggested functions:

- searchCoordinate()
- matchThreeImages()
- getDemoPoint()
- getCommonPoint()

Components should call the API service rather than manually
constructing requests everywhere.
