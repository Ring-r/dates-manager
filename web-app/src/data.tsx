export const dbName = "dates-manager";
export const dbStoreName = "data";
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

export interface Milestone {
  date: Date; // period_id
  eventbase: Eventbase;

  // "no_information" - undefined; "information is empty" - null; "remind" ("in_process"), "ignore", "done"
  action_list?: MilestoneAction[];
}

export function create_milestone(date: Date, eventbase: Eventbase, state?: string) {
  return {
    date: get_milestone_date(eventbase, date),
    eventbase: eventbase,
    state: state !== undefined ? state : "no information",
  };
}

export function create_milestone_with_reminder(date: Date, eventbase: Eventbase) {
  const milestone = create_milestone(date, eventbase);

  const posix_date = milestone.date.getTime();
  const posix_date_start = posix_date - 0 * 24 * 60 * 60 * 1000;  // 0 days // todo: use settings
  const posix_date_next = posix_date_start;

  return {
    ...milestone,
    state: "in process",

    action_list: [],
    date_next: new Date(posix_date_next),
  };
}

export function get_uid(milestone: Milestone) {
  return [milestone.date.getTime(), milestone.eventbase.uid].join(" ");
}


export interface MilestoneActionDone {
  date: Date;
  title: "done";
}

export interface MilestoneActionIgnore {
  date: Date;
  title: "ignore";
}

export interface MilestoneActionReminder {
  date: Date;
  date_next: Date;
  title: "remind";
}

export type MilestoneAction = MilestoneActionDone | MilestoneActionIgnore | MilestoneActionReminder;

export function get_last_action(milestone: Milestone) {
  if (milestone.action_list === undefined) return undefined;
  if (milestone.action_list.length === 0) return null;

  return milestone.action_list[milestone.action_list.length - 1];
}

export function in_process(milestone: Milestone) {
  const last_action = get_last_action(milestone);
  return last_action && last_action.title === "remind";
}

export interface Data {
  dbVersion: number;
  eventbase_list: Eventbase[];
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

export function put_all(db: IDBDatabase, data: Data) {
  const transaction = db.transaction([dbStoreName], "readwrite");
  const objectStore = transaction.objectStore(dbStoreName);
  try {
    const request_clear = objectStore.clear();
    request_clear.onsuccess = function () {
      data.eventbase_list.forEach(eventbase => {
        const request_put = objectStore.add(eventbase);
        request_put.onerror = function () {
          console.error("Unable to add data:", this.error);
        };
      });
    };
    request_clear.onerror = function () {
      console.error("Unable to clear store:", this.error);
    };
  }
  catch {
    transaction.abort()
  }
}

export function change(db: IDBDatabase, old_eventbase: Eventbase, new_eventbase: Eventbase | null) {
  const objectStore = db.transaction([dbStoreName], "readwrite").objectStore(dbStoreName);
  objectStore.delete(old_eventbase.uid);
  new_eventbase && objectStore.put(new_eventbase);
}
