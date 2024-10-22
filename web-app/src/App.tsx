import { TouchEvent, useEffect, useState } from 'react';
import { Button, FlexboxGrid, Panel, Tabs, Uploader } from 'rsuite';
import 'rsuite-color-picker/lib/styles.less';
import 'rsuite/dist/rsuite.min.css';
import { FileType } from 'rsuite/esm/Uploader';
import './App.css';
import CalendarView from './Calendar';
import { compare_eventbase, compare_milestone, create_eventbase, create_milestone_next, Data, dbVersion, Eventbase, get_reminder_stop_datetime, get_uid, in_process, is_base, Milestone, MilestoneStateRemind, with_added_reminder } from './data_base';
import { file_load, file_save } from './data_file';
import { firestore_delete_eventbase, firestore_delete_milestone, firestore_put_eventbase, firestore_put_milestone } from './data_firestore';
import { indexeddb_delete_eventbase, indexeddb_delete_milestone, indexeddb_init, indexeddb_load, indexeddb_put_eventbase, indexeddb_put_milestone, indexeddb_save } from './data_indexeddb';
import EventbaseListView, { EventbaseEditView } from './EventbaseListView';
import MilestoneListView, { MilestoneEditView } from './MilestoneListView';
import MilestoneListViewComplex from './MilestoneListViewComplex';


function App() {
  const [indexeddb, setIndexeddb] = useState<IDBDatabase>();

  const [date, setDate] = useState<Date>(new Date());
  const [eventbaseList, setEventbaseList] = useState<Eventbase[]>([]);
  const [milestoneList, setMilestoneList] = useState<Milestone[]>([]);

  function state_delete_eventbase(eventbase: Eventbase) {
    setEventbaseList(
      eventbaseList
        .filter(item => item.uid !== eventbase.uid),
    );
    setMilestoneList(
      milestoneList
        .filter(item => item.eventbase.uid !== eventbase.uid),
    );
  }

  function state_put_eventbase(eventbase: Eventbase) {
    setEventbaseList(
      [
        ...eventbaseList
          .filter(item => item.uid !== eventbase.uid),
        eventbase,
      ].sort(compare_eventbase)
    );
  }

  function state_delete_milestone(milestone: Milestone) {
    setMilestoneList(
      milestoneList
        .filter(item => get_uid(item) !== get_uid(milestone)),
    );
  }

  function state_put_milestone(milestone: Milestone) {
    setMilestoneList(
      [
        ...milestoneList
          .filter(item => get_uid(item) !== get_uid(milestone)),
        milestone,
      ].sort(compare_milestone)
    );
  }

  const [activeKey, setActiveKey] = useState<string | number | undefined>("calendar");

  // indexeddb

  useEffect(() => {
    // inner db (idb); outer db (odb)
    // if idb doesn't exist then odb -> idb;
    // if idb exist then idb -> odb;
    // actions: idb->odb; odb->idb;
    // data for states get from idb; idb -> state
    // data from states send to odb and idb
    indexeddb_init()
      .then(db => setIndexeddb(db));
  }, []);

  useEffect(() => {
    async function initData() {
      if (!indexeddb) return;

      const data = await indexeddb_load(indexeddb);
      setEventbaseList(data.eventbase_list);
      setMilestoneList(data.milestone_list);
    }
    initData();
  }, [indexeddb]);

  // file

  const load = async (fileList: FileType[]) => {
    const data = await file_load(fileList[0]);
    setEventbaseList(data.eventbase_list);
    setMilestoneList(data.milestone_list);

    // clear; add; put; update
    indexeddb && indexeddb_save(indexeddb, data);
  }

  const save = () => {
    const data: Data = {
      dbVersion: dbVersion,
      eventbase_list: eventbaseList,
      milestone_list: milestoneList,
    }
    file_save(data);
  }

  // editingEventbase

  const [editingEventbase, setEditingEventbase] = useState<Eventbase | null>(null);

  const [eventbaseTitleList, setEventbaseTitleList] = useState<string[]>([]);
  const [eventbaseActorList, setEventbaseActorList] = useState<string[]>([]);

  useEffect(() => {
    setEventbaseTitleList(Array.from((new Set(eventbaseList.map(eventbase => eventbase.title))).values()));
    setEventbaseActorList(Array.from((new Set(eventbaseList.filter(eventbase => eventbase.actor !== undefined).map(eventbase => eventbase.actor as string))).values()));
  }, [eventbaseList]);

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
    if (!indexeddb) return;

    firestore_put_eventbase(eventbase);
    indexeddb_put_eventbase(indexeddb, eventbase);
    state_put_eventbase(eventbase);

    setEditingEventbase(null);
  }

  const handleCancelEventbase = () => {
    setEditingEventbase(null);
  }

  const handleDeleteEventbase = () => {
    if (!indexeddb) return;
    if (editingEventbase === null) return;

    firestore_delete_eventbase(editingEventbase);
    indexeddb_delete_eventbase(indexeddb, editingEventbase);
    state_delete_eventbase(editingEventbase);

    setEditingEventbase(null);
  }

  // editingMilestone

  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
  }

  const handleApplyMilestone = (milestone: Milestone) => {
    if (!indexeddb) return;

    firestore_put_milestone(milestone);
    indexeddb_put_milestone(indexeddb, milestone);
    state_put_milestone(milestone);

    setEditingMilestone(null);
  }

  const handleCancelMilestone = () => {
    setEditingMilestone(null);
  }

  const handleDeleteMilestone = () => {
    if (!indexeddb) return;
    if (editingMilestone === null) return;

    firestore_delete_milestone(editingMilestone);
    indexeddb_delete_milestone(indexeddb, editingMilestone);
    state_delete_milestone(editingMilestone);

    setEditingMilestone(null);
  }

  // reminder

  const [reminderMilestoneList, setReminderMilestoneList] = useState<Milestone[]>([]); // temporary; to debug only
  const [reminderTimeoutId, setReminderTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (editingMilestone !== null) return;

    recalc_milestone_with_reminder_list();
  }, [editingMilestone]);

  useEffect(() => {
    recalc_milestone_with_reminder_list();
  }, [eventbaseList, milestoneList]);

  function get_next_milestone_list(eventbase_list: Eventbase[], milestone_list: Milestone[], date: Date) {
    return Array.from(new Map(
      [
        ...eventbase_list
          .map(eventbase => create_milestone_next(date, eventbase)),
        ...milestone_list,
      ].map(milestone => [get_uid(milestone), milestone])).values()
    )
      .filter(milestone => {
        if (in_process(milestone)) return true;
        if (is_base(milestone) && date <= get_reminder_stop_datetime(milestone)) return true;
        return false;
      })
      .map(milestone => is_base(milestone) ? with_added_reminder(milestone) : milestone)
      .sort((a, b) => {
        const a_date = (a.state as MilestoneStateRemind).next_reminder_datetime_posix;
        const b_date = (b.state as MilestoneStateRemind).next_reminder_datetime_posix;
        return a_date - b_date;
      });
  }

  function recalc_milestone_with_reminder_list() {
    clearTimeout(reminderTimeoutId);

    const now = new Date();

    const reminder_milestone_list = get_next_milestone_list(eventbaseList, milestoneList, now);

    setReminderMilestoneList(reminder_milestone_list);

    const reminder_milestone = reminder_milestone_list.length > 0 ? reminder_milestone_list[0] : null;

    if (!reminder_milestone) {
      setEditingMilestone(null);
      return;
    }

    const remind_next_datetime_posix = (reminder_milestone.state as MilestoneStateRemind).next_reminder_datetime_posix;
    if (remind_next_datetime_posix <= now.getTime()) {
      setEditingMilestone(reminder_milestone);
    }
    else {
      const target_datetime_posix = remind_next_datetime_posix;

      const now = new Date();
      const timeDifference = target_datetime_posix - now.getTime();
      const maxTimeout = 2147483647; // Max value for setTimeout (approx. 24.8 days)
      const timeout_id = setTimeout(recalc_milestone_with_reminder_list, Math.min(timeDifference, maxTimeout));
      setReminderTimeoutId(timeout_id);
    }
  }

  // swipe

  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)

  // the required distance between touchStart and touchEnd to be detected as a swipe
  const minSwipeDistance = 50

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    setTouchEnd(null) // otherwise the swipe is fired even with usual touch events
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => setTouchEnd(e.targetTouches[0].clientX)

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe || isRightSwipe) {
      if (activeKey === "calendar") {
        const month_inc = isLeftSwipe ? +1 : -1;
        setDate(new Date(date.getFullYear(), date.getMonth() + month_inc, date.getDate()));
      }
    }
  }

  return (
    <div className="App" onTouchEnd={onTouchEnd} onTouchMove={onTouchMove} onTouchStart={onTouchStart} >
      {
        editingEventbase ? <EventbaseEditView eventbase={editingEventbase} on_apply={handleApplyEventbase} on_cancel={handleCancelEventbase} on_delete={handleDeleteEventbase} eventbase_title_list={eventbaseTitleList} eventbase_actor_list={eventbaseActorList} /> :
          editingMilestone ? <MilestoneEditView milestone={editingMilestone} on_apply={handleApplyMilestone} on_cancel={handleCancelMilestone} on_delete={handleDeleteMilestone} /> :
            <>
              <Tabs activeKey={activeKey} onSelect={setActiveKey}>
                <Tabs.Tab eventKey="calendar" title="calendar">
                  <CalendarView date={date} eventbase_list={eventbaseList} set_date={setDate} />
                  <Button onClick={handleAddEventbase}>add event</Button>
                  <MilestoneListViewComplex date={date} eventbase_list={eventbaseList} milestone_list={milestoneList} on_edit={handleEditMilestone} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="events" title="events">
                  <Button onClick={handleAddEventbase}>add event</Button>
                  <EventbaseListView eventbaseList={eventbaseList} on_edit={handleEditEventbase} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="settings" title="settings">
                  <Panel>
                    <FlexboxGrid justify="space-between">
                      <Button onClick={save}>Save data to local file</Button>
                      <Uploader accept=".json" action="" fileListVisible={false} onChange={load} removable={false}>
                        <Button appearance="primary" color="orange">Load data from local file (add if not exist)</Button>
                      </Uploader>
                    </FlexboxGrid>
                  </Panel>
                </Tabs.Tab>
                <Tabs.Tab eventKey="debug" title="debug">
                  <MilestoneListView milestone_list={reminderMilestoneList} />
                </Tabs.Tab>
              </Tabs>
            </>
      }
    </div>
  );
}

export default App;
