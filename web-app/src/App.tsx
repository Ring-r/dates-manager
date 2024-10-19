import { useEffect, useState } from 'react';
import { Button, FlexboxGrid, Panel, Tabs, Uploader } from 'rsuite';
import 'rsuite-color-picker/lib/styles.less';
import 'rsuite/dist/rsuite.min.css';
import { FileType } from 'rsuite/esm/Uploader';
import './App.css';
import CalendarView from './Calendar';
import { compare_eventbase, compare_milestone, create_eventbase, create_milestone, Data, data_filename, db_delete_and_put_eventbase, db_delete_and_put_milestone, db_put_all, dbEventbaseStoreName, dbMilestoneStoreName, dbName, dbVersion, Eventbase, get_reminder_stop_datetime, get_uid, in_process, is_base, Milestone, MilestoneStateRemind, settings, with_added_reminder } from './data';
import EventbaseListView, { EventbaseEditView } from './EventbaseListView';
import MilestoneListView, { MilestoneEditView } from './MilestoneListView';
import MilestoneListViewComplex from './MilestoneListViewComplex';


function App() {
  const [db, setDB] = useState<IDBDatabase>();

  const [date, setDate] = useState<Date>(new Date());
  const [eventbaseList, setEventbaseList] = useState<Eventbase[]>([]);
  const [milestoneList, setMilestoneList] = useState<Milestone[]>([]);

  const [activeKey, setActiveKey] = useState<string | number | undefined>("1");

  // indexeddb

  useEffect(() => {
    function initDB() {
      const request = indexedDB.open(dbName, dbVersion);
      request.onerror = (event: Event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error("Database error:", error);
      };
      request.onsuccess = (event: Event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        setDB(db);
      };
      request.onupgradeneeded = function (event: IDBVersionChangeEvent) {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(dbEventbaseStoreName)) {
          db.createObjectStore(dbEventbaseStoreName, { keyPath: "uid" });
        }
        if (!db.objectStoreNames.contains(dbMilestoneStoreName)) {
          db.createObjectStore(dbMilestoneStoreName);
        }
      }
    }
    initDB();
  }, []);

  useEffect(() => {
    function initData() {
      if (!db) return;

      const request_eventbase = db.transaction([dbEventbaseStoreName], "readonly").objectStore(dbEventbaseStoreName).getAll();
      request_eventbase.onerror = (event: Event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error("Unable to retrieve data:", error);
      };
      request_eventbase.onsuccess = (event: Event) => {
        const data = (event.target as IDBRequest<Eventbase[]>).result;
        setEventbaseList(data);
      };
      const request_milestone = db.transaction([dbMilestoneStoreName], "readonly").objectStore(dbMilestoneStoreName).getAll();
      request_milestone.onerror = (event: Event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error("Unable to retrieve data:", error);
      };
      request_milestone.onsuccess = (event: Event) => {
        const data = (event.target as IDBRequest<Milestone[]>).result;
        setMilestoneList(data);
      };
    }
    initData();
  }, [db]);

  // load/save

  const load = (fileList: FileType[]) => {
    if (!db) return;

    const blob = fileList[0].blobFile;
    if (!blob) return;

    const reader = new FileReader();
    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        const result = event.target?.result as string;
        const data = JSON.parse(result, (k, v) => k === "date" ? new Date(v) : v) as Data;

        db_put_all(db, data);
        setEventbaseList(data.eventbase_list);
        setMilestoneList(data.milestone_list);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };
    reader.readAsText(blob);
  }

  const save = () => {
    const data: Data = {
      dbVersion: dbVersion,
      eventbase_list: eventbaseList,
      milestone_list: milestoneList,
    }
    const json = JSON.stringify(data);
    const blob = new Blob([json], { type: "text/json" });

    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = data_filename;

    // Append the anchor to the body (it must be in the DOM for the click to work in some browsers)
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // editingEventbase

  const [editingEventbase, setEditingEventbase] = useState<Eventbase | null>(null);

  const handleAddEventbase = () => {
    setEditingEventbase(
      create_eventbase(
        eventbaseList.length > 0 ? Math.max(...eventbaseList.map(item => item.uid)) + 1 : 0,
        undefined, date.getMonth() + 1, date.getDate(),
        ""
      )
    );
  }

  const handleEditEventbase = (eventbase: Eventbase) => {
    setEditingEventbase(eventbase);
  }

  const handleApplyEventbase = (eventbase: Eventbase) => {
    if (!db) return;
    if (editingEventbase === null) return;

    db_delete_and_put_eventbase(db, editingEventbase, eventbase)
    setEventbaseList(
      [
        ...eventbaseList
          .filter(eventbase => eventbase.uid !== editingEventbase.uid),
        eventbase,
      ].sort(compare_eventbase)
    );
    setEditingEventbase(null);
  }

  const handleCancelEventbase = () => {
    setEditingEventbase(null);
  }

  const handleDeleteEventbase = () => {
    if (!db) return;
    if (editingEventbase === null) return;

    db_delete_and_put_eventbase(db, editingEventbase, null);
    setEventbaseList(
      eventbaseList
        .filter(eventbase => eventbase.uid !== editingEventbase.uid)
    );
    setEditingEventbase(null);
  }

  // editingMilestone

  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const handleAddMilestone = () => {
    if (eventbaseList.length === 0) {
      // todo: show error message
      return;
    }
    setEditingMilestone(create_milestone(date, eventbaseList[0]));
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
  }

  const handleApplyMilestone = (milestone: Milestone) => {
    if (!db) return;
    if (editingMilestone === null) return;

    db_delete_and_put_milestone(db, editingMilestone, milestone);
    setMilestoneList(
      [
        ...milestoneList
          .filter(milestone => get_uid(milestone) !== get_uid(editingMilestone)),
        milestone,
      ].sort(compare_milestone)
    );
    setEditingMilestone(null);
  }

  const handleCancelMilestone = () => {
    setEditingMilestone(null);
  }

  const handleDeleteMilestone = () => {
    if (!db) return;
    if (editingMilestone === null) return;

    db_delete_and_put_milestone(db, editingMilestone, null);
    setMilestoneList(
      milestoneList
        .filter(milestone => get_uid(milestone) !== get_uid(editingMilestone))
    );
    setEditingMilestone(null);
  }

  // reminder

  const [milestoneWithReminderList, setMilestoneWithReminderList] = useState<Milestone[]>([]);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (editingMilestone !== null) return;

    recalc_milestone_with_reminder_list();
  }, [editingMilestone]);

  useEffect(() => {
    recalc_milestone_with_reminder_list();
  }, [eventbaseList, milestoneList]);

  function get_next_milestone_list(eventbase_list: Eventbase[], milestone_list: Milestone[], date: Date) {
    const reminder_interval = settings.intervals.reminder; // todo: or use data from event settings
    return Array.from(new Map(
      [
        ...eventbase_list
          .map(eventbase => {
            const milestone = create_milestone(date, eventbase);
            if (get_reminder_stop_datetime(milestone) <= date) {
              milestone.date.setFullYear(milestone.date.getFullYear() + 1);
            }
            return milestone;
          }),
        ...milestone_list,
      ].map(milestone => [get_uid(milestone), milestone])).values()
    )
      .filter(milestone => {
        if (in_process(milestone)) return true;
        if (is_base(milestone) && date.getTime() <= milestone.date.getTime() + reminder_interval.to_stop) return true;
        return false;
      })
      .map(milestone => is_base(milestone) ? with_added_reminder(milestone) : milestone)
      .sort((a, b) => {
        const a_date = (a.state as MilestoneStateRemind).next_reminder_datetime;
        const b_date = (b.state as MilestoneStateRemind).next_reminder_datetime;
        return a_date.getTime() - b_date.getTime();
      });
  }

  function recalc_milestone_with_reminder_list() {
    clearTimeout(timeoutId);

    const now = new Date();

    const milestoneWithReminderList_ = get_next_milestone_list(eventbaseList, milestoneList, now);

    setMilestoneWithReminderList(milestoneWithReminderList_);

    const milestoneWithReminder_ = milestoneWithReminderList_.length > 0 ? milestoneWithReminderList_[0] : null;

    if (!milestoneWithReminder_) {
      setEditingMilestone(null);
      return;
    }

    const remind_next_datetime = (milestoneWithReminder_.state as MilestoneStateRemind).next_reminder_datetime;
    if (remind_next_datetime.getTime() <= now.getTime()) {
      setEditingMilestone(milestoneWithReminder_);
    }
    else {
      const targetDate: Date = remind_next_datetime;

      const now = new Date();
      const timeDifference = targetDate.getTime() - now.getTime();
      const maxTimeout = 2147483647; // Max value for setTimeout (approx. 24.8 days)
      const timeoutId_ = setTimeout(recalc_milestone_with_reminder_list, Math.min(timeDifference, maxTimeout));
      setTimeoutId(timeoutId_);
    }
  }

  return (
    <div className="App" >
      {
        editingEventbase ? <EventbaseEditView eventbase={editingEventbase} on_apply={handleApplyEventbase} on_cancel={handleCancelEventbase} on_delete={handleDeleteEventbase} /> :
          editingMilestone ? <MilestoneEditView milestone={editingMilestone} on_apply={handleApplyMilestone} on_cancel={handleCancelMilestone} on_delete={handleDeleteMilestone} /> :
            <>
              <Tabs activeKey={activeKey} onSelect={setActiveKey}>
                <Tabs.Tab eventKey="1" title="calendar">
                  <CalendarView date={date} eventbase_list={eventbaseList} set_date={setDate} />
                  <Button onClick={handleAddEventbase}>add event</Button>
                  <MilestoneListViewComplex date={date} eventbase_list={eventbaseList} milestone_list={milestoneList} on_edit={handleEditMilestone} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="2" title="events">
                  <Button onClick={handleAddEventbase}>add event</Button>
                  <EventbaseListView eventbaseList={eventbaseList} on_edit={handleEditEventbase} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="3" title="settings">
                  <Panel>
                    <FlexboxGrid justify="space-between">
                      <Button onClick={save}>Save data to local file</Button>
                      <Uploader accept=".json" action="" fileListVisible={false} onChange={load} removable={false}>
                        <Button appearance="primary" color="orange">Load data from local file (add if not exist)</Button>
                      </Uploader>
                    </FlexboxGrid>
                  </Panel>
                </Tabs.Tab>
                <Tabs.Tab eventKey="4" title="debug">
                  <MilestoneListView milestone_list={milestoneWithReminderList} />
                </Tabs.Tab>
              </Tabs>
            </>
      }
    </div>
  );
}

export default App;
