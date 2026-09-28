export const SPORT_GROUPS = {
  run: { label: "Carrera", color: "#e4572e" },
  ride: { label: "Bici", color: "#2f80ed" },
  swim: { label: "Natación", color: "#00b8a9" },
  strength: { label: "Fuerza", color: "#9b51e0" },
  other: { label: "Otros", color: "#8a8f98" },
};

const GROUP_BY_SPORT = {
  Run: "run",
  TrailRun: "run",
  VirtualRun: "run",
  Ride: "ride",
  MountainBikeRide: "ride",
  GravelRide: "ride",
  EBikeRide: "ride",
  EMountainBikeRide: "ride",
  VirtualRide: "ride",
  Swim: "swim",
  WeightTraining: "strength",
  Crossfit: "strength",
  Workout: "strength",
};

const SPORT_LABELS = {
  Run: "Carrera",
  TrailRun: "Trail",
  VirtualRun: "Cinta",
  Ride: "Bici",
  MountainBikeRide: "BTT",
  GravelRide: "Gravel",
  EBikeRide: "E-bike",
  VirtualRide: "Rodillo",
  Swim: "Natación",
  WeightTraining: "Fuerza",
  Workout: "Entreno",
  Walk: "Caminata",
  Hike: "Senderismo",
  Yoga: "Yoga",
};

export function getSportGroup(sportType) {
  return GROUP_BY_SPORT[sportType] ?? "other";
}

export function getSportLabel(sportType) {
  return SPORT_LABELS[sportType] ?? sportType;
}
