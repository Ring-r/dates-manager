import { useEffect, useState } from 'react';
import 'rsuite/dist/rsuite.min.css';
import MilestoneListView from './MilestoneListView';
import { create_milestone, Eventbase, eventbase_range_contains, get_uid, in_process, Milestone, milestone_range_contains, settings } from './data';

interface MilestoneListParamComplex {
  date: Date;
  eventbase_list: Eventbase[];
  milestone_list: Milestone[];
  on_edit: (milestone: Milestone) => void;
}

function MilestoneListViewComplex({ date, eventbase_list, milestone_list, on_edit }: MilestoneListParamComplex) {
  const [shownMilestoneList, setShownMilestoneList] = useState<Milestone[]>();

  useEffect(() => {
    function prepare_day_milestone_list() {
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

    function prepare_range_milestone_list() {
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

    // const prepared_milestone_list = prepare_day_milestone_list();
    const prepared_milestone_list = prepare_range_milestone_list();
    setShownMilestoneList(prepared_milestone_list);
  }, [date, eventbase_list, milestone_list]);

  return (
    <>
      {shownMilestoneList && <MilestoneListView milestone_list={shownMilestoneList} on_edit={on_edit} />}
    </>
  );
}

export default MilestoneListViewComplex;
