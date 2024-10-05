import React, { ChangeEvent, useState } from 'react';
import { Button, DatePicker, FlexboxGrid, HStack, Tabs } from 'rsuite';
import 'rsuite-color-picker/lib/styles.less';
import 'rsuite/dist/rsuite.min.css';
import './App.css';
import CalendarView from './Calendar';
import { create_eventbase, data_filename, Eventbase, get_uid, Milestone } from './data';
import { EventbaseEditView } from './EventbaseListView';
import { MilestoneEditView } from './MilestoneListView';
import MilestoneWithReminderNotificationView from './MilestoneWithReminderListView';
import TimelineView from './Timeline';


function App() {
  const [date, setDate] = useState<Date>(new Date());
  const [eventbaseList, setEventbaseList] = useState<Eventbase[]>([]);
  const [milestoneList, setMilestoneList] = useState<Milestone[]>([]);

  // load/save
  const load = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result as string;
        const data = JSON.parse(result, (k, v) => k === "date" ? new Date(v) : v);
        setEventbaseList(data);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };
    reader.readAsText(file);
  };

  const save = () => {
    const json = JSON.stringify(eventbaseList);
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
    setEditingEventbase(create_eventbase(eventbaseList.length > 0 ? Math.max(...eventbaseList.map(item => item.uid)) + 1 : 0, new Date(), ""));
  }

  const handleEditEventbase = (eventbase: Eventbase) => {
    setEditingEventbase(eventbase);
  }

  const handleApplyEventbase = async () => {
    if (editingEventbase === null) return;

    setEventbaseList(
      [
        ...eventbaseList
          .filter(eventbase => eventbase.uid !== editingEventbase.uid),
        editingEventbase,
      ].sort((a, b) => a.date.getDay() - b.date.getDay()));
    setEditingEventbase(null);
  }

  const handleCancelEventbase = () => {
    setEditingEventbase(null);
  }

  const handleDeleteEventbase = async () => {
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
              <FlexboxGrid justify="end">
                <input accept="application/json" onChange={load} type="file" />
                <Button onClick={save}>save</Button>
              </FlexboxGrid>
              <HStack>
                <Button onClick={handleAddEventbase}>add eventbase</Button>
                <Button onClick={handleAddMilestone}>add milestone</Button>
              </HStack>
              <DatePicker cleanable={false} format='yyyy.MM.dd' onChange={value => value && setDate(value)} value={date} />
              <Tabs defaultActiveKey="1">
                <Tabs.Tab eventKey="1" title="calendar">
                  <CalendarView date={date} eventbase_list={eventbaseList} milestone_list={milestoneList} on_edit={setEditingMilestone} set_date={setDate} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="2" title="timeline">
                  <TimelineView date={date} eventbase_list={eventbaseList} milestone_list={milestoneList} on_edit={setEditingMilestone} />
                </Tabs.Tab>
                <Tabs.Tab eventKey="3" title="reminders and notifications">
                  <MilestoneWithReminderNotificationView date={new Date()} eventbase_list={eventbaseList} milestone_list={milestoneList} set_milestone_list={setMilestoneList} />
                </Tabs.Tab>
              </Tabs>
            </>
      }
    </div>
  );
}

export default App;
