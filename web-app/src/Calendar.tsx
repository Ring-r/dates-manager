import { useEffect, useState } from 'react';
import { Badge, Calendar } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import MilestoneListView from './MilestoneListView';
import { create_milestone, Eventbase, eventbase_range_contains, get_uid, Milestone, milestone_range_contains, settings } from './data';

interface CalendarParam {
  date: Date;
  set_date: (date: Date) => void;
  eventbase_list: Eventbase[];
  milestone_list: Milestone[];
  on_edit: (milestone: Milestone) => void;
}

function CalendarView({ date, eventbase_list, milestone_list, on_edit, set_date }: CalendarParam) {
  const [dayMilestoneList, setDayMilestoneList] = useState<Milestone[]>();

  function renderCell(date: Date) {
    const range_interval = settings.intervals.day; // todo: or use data from event settings
    const day_range_eventbase_list = eventbase_list.filter(eventbase => eventbase_range_contains(eventbase, range_interval, date));

    if (day_range_eventbase_list.length) {
      return <Badge content={day_range_eventbase_list.length} />;
    }

    return null;
  }

  useEffect(() => {
    function prepare_milestone_list() {
      const range_interval = settings.intervals.day; // todo: or use data from event settings

      const milestone_map = new Map([
        ...eventbase_list
          .filter(eventbase => eventbase_range_contains(eventbase, range_interval, date))
          .map(eventbase => create_milestone(date, eventbase)),
        ...milestone_list
          .filter(milestone => milestone_range_contains(milestone, range_interval, date)),
      ].map(milestone => [get_uid(milestone), milestone]));
      return Array.from(milestone_map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    setDayMilestoneList(prepare_milestone_list());
  }, [date, eventbase_list, milestone_list]);

  return (
    <>
      <Calendar bordered compact renderCell={renderCell} value={date} onChange={set_date} />
      {dayMilestoneList && <MilestoneListView milestone_list={dayMilestoneList} on_edit={on_edit} />}
    </>
  )
}

export default CalendarView;
