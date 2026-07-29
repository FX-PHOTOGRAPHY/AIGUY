export type ProgrammeCategory = "morning" | "music" | "culture" | "specialist" | "night";

export interface Programme {
  id: string;
  title: string;
  presenter: string;
  description: string;
  startTime: string;
  endTime: string;
  category: ProgrammeCategory;
  artworkGradient: string;
}

export interface ProgrammeWithStatus extends Programme {
  startsAt: Date;
  endsAt: Date;
  progress: number;
}
