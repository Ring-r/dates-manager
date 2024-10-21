export const dbVersion = 1;


export interface Eventbase {
  uid: number; // auto

  date_year?: number;
  date_month: number;
  date_day: number;
  title: string;
  actor?: string;
}

export function compare_eventbase(a: Eventbase, b: Eventbase): number {
  if (a.date_month !== b.date_month) return a.date_month - b.date_month;
  if (a.date_day !== b.date_day) return a.date_day - b.date_day;
  if (a.title !== b.title) return a.title < b.title ? -1 : 1;

  if (!a.actor) return -1;
  if (!b.actor) return +1;

  return a.actor < b.actor ? -1 : 1;
}

export function create_eventbase(uid: number, date_year: number | undefined, date_month: number, date_day: number, title: string, actor?: string) {
  return {
    uid: uid,

    date_year: date_year,
    date_month: date_month,
    date_day: date_day,
    title: title,
    actor: actor,
  }
}

export function get_milestone_date(eventbase: Eventbase, date: Date) {
  return new Date(date.getFullYear(), eventbase.date_month - 1, eventbase.date_day);
}


export interface MilestoneStateBase {
  type: "base";
}

export interface MilestoneStateDone {
  type: "done";
}

export interface MilestoneStateIgnore {
  type: "ignore";
}

export interface MilestoneStateRemind {
  next_reminder_datetime_posix: number;
  type: "remind";
}

export type MilestoneState = MilestoneStateBase | MilestoneStateDone | MilestoneStateIgnore | MilestoneStateRemind;


export interface Milestone {
  date_year: number;
  eventbase: Eventbase;

  state: MilestoneState; // "no information" ("base", "virtual", "not stored yet"); remind_next_datetime; "remind" ("in_process"); "ignore", "done"
  story?: string;
}

export function compare_milestone(a: Milestone, b: Milestone): number {
  if (a.date_year !== b.date_year) return a.date_year - b.date_year;

  return compare_eventbase(a.eventbase, b.eventbase);
};

export function create_milestone(date_year: number, eventbase: Eventbase): Milestone {
  return {
    date_year: date_year,
    eventbase: eventbase,
    state: { type: "base" },
  };
}

export function create_milestone_next(date: Date, eventbase: Eventbase): Milestone {
  const milestone = create_milestone(date.getFullYear(), eventbase);
  if (get_reminder_stop_datetime(milestone) <= date) {
    milestone.date_year += 1;
  }
  return milestone;
}

export function with_added_reminder(milestone: Milestone) {
  const datetime_start_posix = get_reminder_start_datetime(milestone).getTime();
  const datetime_next_posix = datetime_start_posix;

  milestone.state = {
    next_reminder_datetime_posix: datetime_next_posix,
    type: "remind",
  };


  return milestone;
}

export function get_date(milestone: Milestone) {
  // todo: what to do with leap year and 29.02?
  return new Date(milestone.date_year, milestone.eventbase.date_month - 1, milestone.eventbase.date_day);
}

export function get_reminder_start_datetime(milestone: Milestone) {
  const reminder_interval = settings.intervals.reminder; // todo: `milestone.eventbase.settings?.intervals?.reminder || settings.intervals.reminder`
  return new Date(get_date(milestone).getTime() - reminder_interval.to_start);
}

export function get_reminder_stop_datetime(milestone: Milestone) {
  const reminder_interval = settings.intervals.reminder; // todo: `milestone.eventbase.settings?.intervals?.reminder || settings.intervals.reminder`
  return new Date(get_date(milestone).getTime() + reminder_interval.to_stop);
}

export function get_uid(milestone: Milestone) {
  return [milestone.date_year, milestone.eventbase.uid].join(" ");
}

export function in_process(milestone: Milestone) {
  return milestone.state.type === "remind";
}

export function is_base(milestone: Milestone) {
  return milestone.state.type === "base";
}


export interface Data {
  dbVersion: number;
  eventbase_list: Eventbase[];
  milestone_list: Milestone[];
}


interface RangeInterval {
  to_start: number;
  to_stop: number;
}

function _range_contains(range_date: Date, range_interval: RangeInterval, date: Date) {
  const posix_range_date = range_date.getTime();
  const range_start = posix_range_date - range_interval.to_start;
  const range_stop = posix_range_date + range_interval.to_stop;

  const date_ = date.getTime();
  return range_start <= date_ && date_ < range_stop;
}

export function eventbase_range_contains(eventbase: Eventbase, range_interval: RangeInterval, date: Date) {
  return _range_contains(get_milestone_date(eventbase, date), range_interval, date);
}

export function milestone_range_contains(milestone: Milestone, range_interval: RangeInterval, date: Date) {
  return _range_contains(get_date(milestone), range_interval, date);
}


export const settings = {
  intervals: {
    day: {
      to_start: 0 * 24 * 60 * 60 * 1000, // 0 days before
      to_stop: 1 * 24 * 60 * 60 * 1000, // 0 days after
    },
    reminder: {
      to_start: 0 * 24 * 60 * 60 * 1000, // 0 days before
      to_stop: 4 * 24 * 60 * 60 * 1000, // 3 days after
    },
    timeline: {
      to_start: 7 * 24 * 60 * 60 * 1000, // 7 days before
      to_stop: 8 * 24 * 60 * 60 * 1000, // 7 days after
    },
  }
}
