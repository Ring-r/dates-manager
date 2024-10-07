import React, { useEffect, useState } from 'react';
import { Button, FlexboxGrid, Tabs, Uploader } from 'rsuite';
import 'rsuite-color-picker/lib/styles.less';
import 'rsuite/dist/rsuite.min.css';
import { FileType } from 'rsuite/esm/Uploader';
import './App.css';
import CalendarView from './Calendar';
import { create_eventbase, Data, data_filename, dbName, dbStoreName, dbVersion, Eventbase, get_uid, Milestone, put_all } from './data';
import EventbaseListView, { EventbaseEditView } from './EventbaseListView';
import { MilestoneEditView } from './MilestoneListView';
import MilestoneListViewComplex from './MilestoneListViewComplex';
import MilestoneWithReminderNotificationView from './MilestoneWithReminderListView';


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

      request.onerror = () => {
        console.error("Database error:", request.error);
      };

      request.onsuccess = () => {
        const db_ = request.result;
        setDB(db_);
      };

      request.onupgradeneeded = function () {
        const db_ = request.result;
        if (!db_.objectStoreNames.contains(dbStoreName)) {
          db_.createObjectStore(dbStoreName, { keyPath: "uid" });
          console.log("Object store created");
        }
      }
    }
    initDB();
  }, []);

  useEffect(() => {
    function initData() {
      if (!db) return;

      const request = db.transaction([dbStoreName], "readonly").objectStore(dbStoreName).getAll();
      request.onsuccess = () => {
        const data = request.result ?? [];
        setEventbaseList(data);
      };
      request.onerror = () => {
        console.error("Unable to retrieve data:", request.error);
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
        put_all(db, data);
        setEventbaseList(data.eventbase_list);
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
    const date = new Date();
    setEditingEventbase(
      create_eventbase(
        eventbaseList.length > 0 ? Math.max(...eventbaseList.map(item => item.uid)) + 1 : 0,
        undefined, date.getMonth(), date.getDate(),
        ""
      )
    );
  }

  const handleEditEventbase = (eventbase: Eventbase) => {
    setEditingEventbase(eventbase);
  }

  const handleApplyEventbase = (eventbase: Eventbase) => {
    if (editingEventbase === null) return;

    setEventbaseList(
      [
        ...eventbaseList
          .filter(eventbase => eventbase.uid !== editingEventbase.uid),
        eventbase,
      ].sort((a, b) => a.date_month !== b.date_month ? a.date_month - b.date_month : a.date_day - b.date_day));
    setEditingEventbase(null);
  }

  const handleCancelEventbase = () => {
    setEditingEventbase(null);
  }

  const handleDeleteEventbase = () => {
    if (eventbaseList === undefined) return;
    if (editingEventbase === null) return;

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
    setEditingMilestone(
      {
        date: new Date(),
        eventbase: eventbaseList[0],
      }
    );
  }

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
  }

  const handleApplyMilestone = (milestone: Milestone) => {
    if (editingMilestone === null) return;

    setMilestoneList(
      [
        ...milestoneList
          .filter(milestone => get_uid(milestone) !== get_uid(editingMilestone)),
        milestone,
      ].sort((a, b) => a.date.getDay() - b.date.getDay())
    );
    setEditingMilestone(null);
  }

  const handleCancelMilestone = () => {
    setEditingMilestone(null);
  }

  const handleDeleteMilestone = () => {
    if (editingMilestone === null) return;

    setMilestoneList(
      milestoneList
        .filter(milestone => get_uid(milestone) !== get_uid(editingMilestone))
    );
    setEditingMilestone(null);
  }


  // ---
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const step = e.deltaY > 0 ? 1 : -1;
    setDate(new Date(date.getTime() + step * 1 * 24 * 60 * 60 * 1000));
  }

  return (
    <div className="App" onWheel={(e) => handleWheel(e)} >
      {
        editingEventbase ? <EventbaseEditView eventbase={editingEventbase} on_apply={handleApplyEventbase} on_cancel={handleCancelEventbase} on_delete={handleDeleteEventbase} /> :
          editingMilestone ? <MilestoneEditView milestone={editingMilestone} on_apply={handleApplyMilestone} on_cancel={handleCancelMilestone} on_delete={handleDeleteMilestone} /> :
            <>
              <Tabs activeKey={activeKey} onSelect={setActiveKey}>
                <Tabs.Tab eventKey="1" title="calendar">
                  <CalendarView date={date} eventbase_list={eventbaseList} set_date={setDate} />
                  <Button onClick={handleAddEventbase}>add date</Button>
                  <MilestoneListViewComplex date={date} eventbase_list={eventbaseList} milestone_list={milestoneList} on_edit={handleEditMilestone} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="2" title="events">
                  <Button onClick={handleAddEventbase}>add event</Button>
                  <EventbaseListView eventbaseList={eventbaseList} on_edit={handleEditEventbase} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="3" title="settings">
                  <FlexboxGrid justify="space-around">
                    <Uploader accept=".json" action="" fileListVisible={false} onChange={load} removable={false}>
                      <Button appearance="primary" color="orange">Upload data from local file...</Button>
                    </Uploader>
                    <Button onClick={save}>Download data as file</Button>
                  </FlexboxGrid>
                  [others will be soon]
                </Tabs.Tab>
                <Tabs.Tab eventKey="4" title="debug">
                  <Button onClick={handleAddMilestone}>add milestone</Button>
                  <MilestoneWithReminderNotificationView date={new Date()} eventbase_list={eventbaseList} milestone_list={milestoneList} set_milestone_list={setMilestoneList} />
                </Tabs.Tab>
              </Tabs>
            </>
      }
    </div>
  );
}

export default App;
