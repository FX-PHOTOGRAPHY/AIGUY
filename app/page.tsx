import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ProgrammeCard } from "@/components/ProgrammeCard";
import { ScheduleList } from "@/components/ScheduleList";
import { getCurrentProgramme, getNextProgramme } from "@/lib/schedule";

export default function Home() {
  const currentProgramme = getCurrentProgramme();
  const nextProgramme = getNextProgramme();

  return <main className="page-shell"><Header /><section className="hero"><div><p className="eyebrow">Streaming now</p><h2>Curated broadcasts for independent music culture.</h2><p className="hero-copy">A responsive control-room view of what is live, what is next and how the day sounds across Ai RECORDS.</p></div></section><section className="dashboard-grid"><ProgrammeCard programme={currentProgramme} label="Now playing" featured /><ProgrammeCard programme={nextProgramme} label="Next up" /></section><ScheduleList /><Footer /></main>;
}
