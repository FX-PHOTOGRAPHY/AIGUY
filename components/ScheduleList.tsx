import { dailySchedule } from "@/data/schedule";

export function ScheduleList() {
  return <section className="schedule-panel"><div className="section-heading"><p className="eyebrow">Today</p><h2>Broadcast schedule</h2></div><div className="schedule-list">{dailySchedule.map((programme) => <article className="schedule-item" key={programme.id}><time>{programme.startTime}</time><div><h3>{programme.title}</h3><p>{programme.presenter}</p></div><span>{programme.endTime}</span></article>)}</div></section>;
}
