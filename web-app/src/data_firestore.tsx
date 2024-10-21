import { compare_eventbase, dbVersion, Eventbase, Milestone, MilestoneState } from "./data_base";

export interface FirestoreData {
  dbVersion: number;
  eventbase_list: FirestoreEventbase[];
};

export interface FirestoreEventbase {
  uid: number; // unique

  date_year?: number;
  date_month: number;
  date_day: number;
  title: string;
  actor?: string;

  milestone_list?: FirestoreMilestone[];
};

export interface FirestoreMilestone {
  date_year: number; // unique

  state: MilestoneState;
  story?: string;
};

let data: FirestoreData = {
  dbVersion,
  eventbase_list: [],
};

export function firestore_load(): void {
  // todo: load to data;
};

export function firestore_save(): void {
  // todo: save data;
  console.log("firestore: ", data);
};

export function firestore_delete_eventbase(eventbase: Eventbase) {
  data.eventbase_list = data.eventbase_list.filter(item => item.uid !== eventbase.uid);
  firestore_save();
};

export function firestore_put_eventbase(eventbase: Eventbase) {
  const old_eventbase = data.eventbase_list.find(item => item.uid === eventbase.uid);
  data.eventbase_list = [
    ...data.eventbase_list.filter(item => item.uid !== eventbase.uid),
    {
      ...eventbase,
      milestone_list: old_eventbase?.milestone_list,
    },
  ].sort(compare_eventbase);
  firestore_save();
};

export function firestore_delete_milestone(milestone: Milestone) {
  const eventbase = data.eventbase_list.find(item => item.uid === milestone.eventbase.uid);
  if (!eventbase) return; // todo: error?

  eventbase.milestone_list = eventbase.milestone_list?.filter(item => item.date_year === milestone.date_year);
  firestore_save();
};

export function firestore_put_milestone(milestone: Milestone) {
  const eventbase = data.eventbase_list.find(item => item.uid === milestone.eventbase.uid);
  if (!eventbase) return; // todo: error?

  eventbase.milestone_list = [
    ...eventbase.milestone_list?.filter(item => item.date_year === milestone.date_year) || [],
    {
      date_year: milestone.date_year,
      state: milestone.state,
      story: milestone.story,
    },
  ].sort((a, b) => a.date_year - b.date_year);
  firestore_save();
};
