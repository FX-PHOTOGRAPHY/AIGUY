import type { Programme } from "@/types/programme";

export const stationVersion = "Alpha 0.1";

export const dailySchedule: Programme[] = [
  { id: "after-hours", title: "After Hours Signal", presenter: "Ai RECORDS Automation", description: "Deep electronic cuts and nocturnal soundscapes for overnight listening.", startTime: "00:00", endTime: "06:00", category: "night", artworkGradient: "linear-gradient(135deg, #15162e, #4b1d7a)" },
  { id: "morning-frequency", title: "Morning Frequency", presenter: "Maya North", description: "New independent releases, bright catalogue picks and the first music brief of the day.", startTime: "06:00", endTime: "10:00", category: "morning", artworkGradient: "linear-gradient(135deg, #ff7a18, #af002d 70%)" },
  { id: "records-select", title: "Ai RECORDS Select", presenter: "Jon Bell", description: "A curated run through essential tracks from the Ai RECORDS network.", startTime: "10:00", endTime: "13:00", category: "music", artworkGradient: "linear-gradient(135deg, #00c6ff, #0072ff)" },
  { id: "midday-archive", title: "The Midday Archive", presenter: "Ella Reid", description: "Classic sessions, label stories and rediscovered recordings from the archive.", startTime: "13:00", endTime: "16:00", category: "culture", artworkGradient: "linear-gradient(135deg, #f7971e, #ffd200)" },
  { id: "drive-transmission", title: "Drive Transmission", presenter: "Kai Morgan", description: "High-energy new music, guest mixes and the releases powering the evening.", startTime: "16:00", endTime: "19:00", category: "music", artworkGradient: "linear-gradient(135deg, #8e2de2, #4a00e0)" },
  { id: "specialist-current", title: "Specialist Current", presenter: "Nia Stone", description: "Forward-facing club, ambient, jazz and experimental selections.", startTime: "19:00", endTime: "22:00", category: "specialist", artworkGradient: "linear-gradient(135deg, #11998e, #38ef7d)" },
  { id: "late-room", title: "The Late Room", presenter: "Ai RECORDS Residents", description: "Long-form mixes and leftfield records for late-night listening.", startTime: "22:00", endTime: "00:00", category: "night", artworkGradient: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" },
];
