import type { ProgrammeWithStatus } from "@/types/programme";

interface ProgrammeCardProps { programme: ProgrammeWithStatus; label: string; featured?: boolean; }

export function ProgrammeCard({ programme, label, featured = false }: ProgrammeCardProps) {
  return <article className={featured ? "programme-card featured" : "programme-card"}>
    <div className="artwork" style={{ background: programme.artworkGradient }} aria-hidden="true" />
    <div className="programme-content"><p className="eyebrow">{label}</p><h2>{programme.title}</h2><p className="presenter">with {programme.presenter}</p><p>{programme.description}</p><div className="meta"><span>{programme.startTime}–{programme.endTime}</span><span>{programme.category}</span></div>{featured && <div className="progress"><span style={{ width: `${programme.progress}%` }} /></div>}</div>
  </article>;
}
