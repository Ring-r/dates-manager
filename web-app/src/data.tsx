export const dbName = "dates-manager";
export const dbEventbaseStoreName = "eventbase_data";
export const dbMilestoneStoreName = "milestone_data";
export const dbVersion = 1;

export const data_filename = "dates.json";


export interface Eventbase {
  uid: number; // auto

  // date: Date;
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
    // date: date,
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
  next_reminder_datetime: Date;
  type: "remind";
}

export type MilestoneState = MilestoneStateBase | MilestoneStateDone | MilestoneStateIgnore | MilestoneStateRemind;

export interface Milestone {
  date: Date; // period_id
  eventbase: Eventbase;

  // action_list?: MilestoneAction[];

  state: MilestoneState; // "no information" ("base", "virtual", "not stored yet"); remind_next_datetime; "remind" ("in_process"); "ignore", "done"
  story?: string;
}

export function compare_milestone(a: Milestone, b: Milestone): number {
  if (a.date.getDay() !== b.date.getDay()) return a.date.getDay() - b.date.getDay();

  return compare_eventbase(a.eventbase, b.eventbase);
};

export function create_milestone(date: Date, eventbase: Eventbase): Milestone {
  return {
    date: get_milestone_date(eventbase, date),
    eventbase: eventbase,
    state: { type: "base" },
  };
}

export function with_added_reminder(milestone: Milestone) {
  const datetime_start = get_reminder_start_datetime(milestone);
  const datetime_next = datetime_start;

  milestone.state = {
    next_reminder_datetime: datetime_next,
    type: "remind",
  };


  return milestone;
}

export function get_reminder_start_datetime(milestone: Milestone) {
  const reminder_interval = settings.intervals.reminder; // todo: `milestone.eventbase.settings?.intervals?.reminder || settings.intervals.reminder`
  return new Date(milestone.date.getTime() - reminder_interval.to_start);
}

export function get_reminder_stop_datetime(milestone: Milestone) {
  const reminder_interval = settings.intervals.reminder; // todo: `milestone.eventbase.settings?.intervals?.reminder || settings.intervals.reminder`
  return new Date(milestone.date.getTime() + reminder_interval.to_stop);
}

export function get_uid(milestone: Milestone) {
  return [milestone.date.getTime(), milestone.eventbase.uid].join(" ");
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
  return _range_contains(milestone.date, range_interval, date);
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

// storage

export function db_put_all(db: IDBDatabase, data: Data) {
  // todo: ask to update if exist;
  const transaction = db.transaction([dbEventbaseStoreName, dbMilestoneStoreName], "readwrite");
  transaction.onerror = function (event: Event) {
    console.error("Unable to clear store and put all data", this.error);
  };
  const eventbaseStore = transaction.objectStore(dbEventbaseStoreName);
  data.eventbase_list.forEach(eventbase => {
    if (!eventbaseStore.getKey(eventbase.uid)) {
      eventbaseStore.add(eventbase);
    }
  });
  const milestoneStore = transaction.objectStore(dbEventbaseStoreName);
  data.milestone_list.forEach(milestone => {
    const uid = get_uid(milestone);
    if (!milestoneStore.getKey(uid)) {
      milestoneStore.add(milestone, uid)
    }
  });
}

export function db_delete_and_put_eventbase(db: IDBDatabase, old_eventbase: Eventbase, new_eventbase: Eventbase | null) {
  const transaction = db.transaction([dbEventbaseStoreName], "readwrite");
  transaction.onerror = function (event: Event) {
    console.error("Unable to delete old data or put new data", this.error);
  };
  transaction.oncomplete = function (event: Event) {
  };
  const objectStore = transaction.objectStore(dbEventbaseStoreName);
  objectStore.delete(old_eventbase.uid)
    .onsuccess = function () {
      if (!new_eventbase) return;

      objectStore.put(new_eventbase);
    }
}

export function db_delete_and_put_milestone(db: IDBDatabase, old_milestone: Milestone, new_milestone: Milestone | null) {
  const transaction = db.transaction([dbMilestoneStoreName], "readwrite");
  transaction.onerror = function (event: Event) {
    console.error("Unable to delete old data or put new data", this.error);
  };
  transaction.oncomplete = function (event: Event) {
  };
  const objectStore = transaction.objectStore(dbMilestoneStoreName);
  objectStore.delete(get_uid(old_milestone))
    .onsuccess = function () {
      if (!new_milestone) return;

      objectStore.put(new_milestone, get_uid(new_milestone));
    }
}
