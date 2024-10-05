import { useEffect, useState } from 'react';
import 'rsuite/dist/rsuite.min.css';
import MilestoneListView from './MilestoneListView';
import { create_milestone, Eventbase, eventbase_range_contains, get_uid, in_process, Milestone, milestone_range_contains, settings } from './data';

interface TimelineParam {
  date: Date;
  eventbase_list: Eventbase[];
  milestone_list: Milestone[];
  on_edit: (milestone: Milestone) => void;
}

function TimelineView({ date, eventbase_list, milestone_list, on_edit }: TimelineParam) {
  const [timelineMilestoneList, setTimelineMilestoneList] = useState<Milestone[]>();

  useEffect(() => {
    function prepare_milestone_list() {
      const range_interval = settings.intervals.timeline; // todo: or use data from event settings
      const milestone_map = new Map([
        ...eventbase_list
          .filter(eventbase => eventbase_range_contains(eventbase, range_interval, date))
          .map(eventbase => create_milestone(date, eventbase)),
        ...milestone_list
          .filter(milestone => milestone_range_contains(milestone, range_interval, date)),
        ...milestone_list
          .filter(milestone => in_process(milestone)),
      ].map(milestone => [get_uid(milestone), milestone]));
      return Array.from(milestone_map.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    setTimelineMilestoneList(prepare_milestone_list());
  }, [date, eventbase_list, milestone_list]);

  return (
    <>
      {timelineMilestoneList && <MilestoneListView milestone_list={timelineMilestoneList} on_edit={on_edit} />}
    </>
  );
}

export default TimelineView;
