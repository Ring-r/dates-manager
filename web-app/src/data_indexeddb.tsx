import { Data, dbVersion, Eventbase, get_uid, Milestone, MilestoneState } from "./data_base";

export const dbName = "dates-manager";
export const dbEventbaseStoreName = "eventbase_data";
export const dbMilestoneStoreName = "milestone_data";

export interface IndexeddbMilestone {
  uid: string; // unique

  date_year: number;
  eventbase_uid: number;

  state: MilestoneState;
  story?: string;
};

export interface IndexeddbData {
  dbVersion: number;
  eventbase_list: Eventbase[];
  milestone_list: IndexeddbMilestone[];
}

export function indexeddb_init(): Promise<IDBDatabase> {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion);
    request.onerror = (event: Event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error("Database error:", error);
      reject();
    };
    request.onsuccess = (event: Event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    request.onupgradeneeded = function (event: IDBVersionChangeEvent) {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(dbEventbaseStoreName)) {
        db.createObjectStore(dbEventbaseStoreName, { keyPath: "uid" });
      }
      if (!db.objectStoreNames.contains(dbMilestoneStoreName)) {
        db.createObjectStore(dbMilestoneStoreName, { keyPath: "uid" });
      }
    }
  });
}

export function indexeddb_load(db: IDBDatabase): Promise<Data> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([dbEventbaseStoreName, dbMilestoneStoreName], "readonly");
    transaction.onerror = function () {
      console.error("Unable to get data.", this.error);
      reject();
    };
    transaction.oncomplete = function () {
    };

    const request_eventbase = transaction.objectStore(dbEventbaseStoreName).getAll();
    request_eventbase.onsuccess = (event: Event) => {
      const eventbase_list = (event.target as IDBRequest<Eventbase[]>).result;
      const eventbase_map = new Map(eventbase_list.map(item => [item.uid, item]));

      const request_milestone = transaction.objectStore(dbMilestoneStoreName).getAll();
      request_milestone.onsuccess = (event: Event) => {
        const indexeddb_milestone_list = (event.target as IDBRequest<IndexeddbMilestone[]>).result;

        const milestone_list = indexeddb_milestone_list
          .filter(item => eventbase_map.has(item.eventbase_uid))
          .map(item => ({
            date_year: item.date_year,
            eventbase: eventbase_map.get(item.eventbase_uid) as Eventbase,

            state: item.state,
            story: item.story,

          }));

        resolve({
          dbVersion,
          eventbase_list,
          milestone_list,
        });
      };
    };
  });
};

export function indexeddb_save(db: IDBDatabase, data: Data): void {
  // todo: clear all before adding.
  // todo: convert to promise

  const transaction = db.transaction([dbEventbaseStoreName, dbMilestoneStoreName], "readwrite");
  transaction.onerror = function () {
    console.error("Unable to save data.", this.error);
  };
  const eventbaseStore = transaction.objectStore(dbEventbaseStoreName);
  data.eventbase_list
    .forEach(eventbase => {
      if (!eventbaseStore.getKey(eventbase.uid)) {
        eventbaseStore.add(eventbase);
      }
    });
  const milestoneStore = transaction.objectStore(dbEventbaseStoreName);
  data.milestone_list
    .map(item => ({
      uid: get_uid(item),

      date_year: item.date_year,
      eventbase_uid: item.eventbase.uid,

      state: item.state,
      story: item.story,
    } as IndexeddbMilestone))
    .forEach(item => {
      if (!milestoneStore.getKey(item.uid)) {
        milestoneStore.add(item)
      }
    });

  // todo: save data;
  console.log("indexeddb: ", data);
};

export function indexeddb_delete_eventbase(db: IDBDatabase, eventbase: Eventbase) {
  const transaction = db.transaction([dbEventbaseStoreName], "readwrite");
  transaction.onerror = function () {
    console.error("Unable to delete data.", this.error);
  };
  transaction.oncomplete = function () {
  };
  transaction.objectStore(dbEventbaseStoreName).delete(eventbase.uid);
  // todo: delete all related milestones
}

export function indexeddb_put_eventbase(db: IDBDatabase, eventbase: Eventbase) {
  const transaction = db.transaction([dbEventbaseStoreName], "readwrite");
  transaction.onerror = function () {
    console.error("Unable to put data.", this.error);
  };
  transaction.oncomplete = function () {
  };
  transaction.objectStore(dbEventbaseStoreName).put(eventbase);
}

export function indexeddb_delete_milestone(db: IDBDatabase, milestone: Milestone) {
  const transaction = db.transaction([dbMilestoneStoreName], "readwrite");
  transaction.onerror = function () {
    console.error("Unable to delete data.", this.error);
  };
  transaction.oncomplete = function () {
  };
  transaction.objectStore(dbMilestoneStoreName).delete(get_uid(milestone));
}

export function indexeddb_put_milestone(db: IDBDatabase, milestone: Milestone) {
  const transaction = db.transaction([dbMilestoneStoreName], "readwrite");
  transaction.onerror = function () {
    console.error("Unable to put data.", this.error);
  };
  transaction.oncomplete = function () {
  };
  transaction.objectStore(dbMilestoneStoreName).put({
    uid: get_uid(milestone),

    date_year: milestone.date_year,
    eventbase_uid: milestone.eventbase.uid,

    state: milestone.state,
    story: milestone.story,
  } as IndexeddbMilestone);
}
