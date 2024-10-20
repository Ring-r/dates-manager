import { useEffect, useState } from 'react';
import 'rsuite/dist/rsuite.min.css';
import MilestoneListView from './MilestoneListView';
import { compare_milestone, create_milestone, Eventbase, eventbase_range_contains, get_uid, in_process, Milestone, milestone_range_contains, settings } from './data';

function get_day_milestone_list(eventbase_list: Eventbase[], milestone_list: Milestone[], date: Date) {
  const day_interval = settings.intervals.day; // todo: or use data from event settings
  return Array.from(new Map([
    ...eventbase_list
      .filter(eventbase => eventbase_range_contains(eventbase, day_interval, date))
      .map(eventbase => create_milestone(date.getFullYear(), eventbase)),
    ...milestone_list
      .filter(milestone => milestone_range_contains(milestone, day_interval, date)),
  ].map(milestone => [get_uid(milestone), milestone])).values()
  )
    .sort(compare_milestone);
}

function get_timeline_milestone_list(eventbase_list: Eventbase[], milestone_list: Milestone[], date: Date) {
  const timeline_interval = settings.intervals.timeline; // todo: or use data from event settings
  return Array.from(new Map([
    ...eventbase_list
      .filter(eventbase => eventbase_range_contains(eventbase, timeline_interval, date))
      .map(eventbase => create_milestone(date.getFullYear(), eventbase)),
    ...milestone_list
      .filter(milestone => milestone_range_contains(milestone, timeline_interval, date)),
    ...milestone_list
      .filter(milestone => in_process(milestone)),
  ].map(milestone => [get_uid(milestone), milestone])).values()
  )
    .sort(compare_milestone);
}

interface MilestoneListParamComplex {
  date: Date;
  eventbase_list: Eventbase[];
  milestone_list: Milestone[];
  on_edit: (milestone: Milestone) => void;
}

function MilestoneListViewComplex({ date, eventbase_list, milestone_list, on_edit }: MilestoneListParamComplex) {
  const [shownMilestoneList, setShownMilestoneList] = useState<Milestone[]>();

  useEffect(() => {
    // if (settings) const prepared_milestone_list = prepare_day_milestone_list(eventbase_list, milestone_list, date); esleO
    const prepared_milestone_list = get_timeline_milestone_list(eventbase_list, milestone_list, date);
    setShownMilestoneList(prepared_milestone_list);
  }, [date, eventbase_list, milestone_list]);

  return (
    <>
      {shownMilestoneList && <MilestoneListView milestone_list={shownMilestoneList} on_edit={on_edit} />}
    </>
  );
}

export default MilestoneListViewComplex;
