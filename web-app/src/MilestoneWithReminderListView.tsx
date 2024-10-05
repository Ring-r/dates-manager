import { useEffect, useState } from 'react';
import { Button, ButtonToolbar, Notification } from 'rsuite';
import { create_milestone, create_milestone_with_reminder, Eventbase, eventbase_range_contains, get_last_action, get_uid, Milestone, milestone_range_contains, settings } from './data';
import { EventbaseView } from './EventbaseListView';
import MilestoneListView from './MilestoneListView';

interface MilestoneWithReminderListParam {
  date: Date;
  eventbase_list: Eventbase[];
  milestone_list: Milestone[];
  set_milestone_list: (milestoneWithReminderList: Milestone[]) => void;
}

function MilestoneWithReminderListView({ date, eventbase_list, milestone_list, set_milestone_list }: MilestoneWithReminderListParam) {
  const [milestoneWithReminder, setMilestoneWithReminder] = useState<Milestone | null>(null);
  const [milestoneWithReminderList, setMilestoneWithReminderList] = useState<Milestone[]>([]);

  useEffect(() => {
    function recalc_milestone_with_reminder_list() {
      if (!milestoneWithReminder) return;

      const range_interval = settings.intervals.reminder; // todo: or use data from event settings

      const filtered_by_date_event_ext_reminder_map = new Set(
        milestone_list
          .filter(milestone => milestone_range_contains(milestone, range_interval, date))
          .map(milestone => get_uid(milestone))
      );

      const milestone_with_reminder_candidate_list = eventbase_list
        .filter(eventbase => eventbase_range_contains(eventbase, range_interval, date))
        .map(eventbase => create_milestone(date, eventbase))
        .filter(milestone => !filtered_by_date_event_ext_reminder_map.has(get_uid(milestone)))
        .map(milestone => create_milestone_with_reminder(date, milestone.eventbase));

      const milestoneWithReminderList_ = [...milestone_list, ...milestone_with_reminder_candidate_list]
        .sort((a, b) => a.date.getTime() - b.date.getTime());
      setMilestoneWithReminderList(milestoneWithReminderList_);

      const now = new Date();
      const milestoneWithReminder_ = milestoneWithReminderList_
        .find(milestone_with_reminder => {
          const last_action = get_last_action(milestone_with_reminder);
          return last_action && (last_action.title === "remind") && (last_action.date_next.getTime() < now.getTime());
        }) || null;
      setMilestoneWithReminder(milestoneWithReminder_);
    }

    recalc_milestone_with_reminder_list();
  }, [date, eventbase_list, milestone_list, milestoneWithReminder]);

  const handleDoneClick = () => {
    if (!milestoneWithReminder) return;

    milestoneWithReminder.action_list = [
      ...(milestoneWithReminder.action_list || []),
      {
        date: new Date(),
        title: "done",
      }
    ];
    set_milestone_list([...milestone_list.filter(item => item !== milestoneWithReminder), milestoneWithReminder]);
    setMilestoneWithReminder(null);
  }

  const handleIgnoreClick = () => {
    if (!milestoneWithReminder) return;

    milestoneWithReminder.action_list = [
      ...(milestoneWithReminder.action_list || []),
      {
        date: new Date(),
        title: "ignore",
      }
    ];
    set_milestone_list([...milestone_list.filter(item => item !== milestoneWithReminder), milestoneWithReminder]);
    setMilestoneWithReminder(null);
  }

  const handleRemindClick = () => {
    if (!milestoneWithReminder) return;

    const next_remind_date = new Date((new Date()).getTime() + 1 * 60 * 60 * 1000); // TODO: use correct calculation
    milestoneWithReminder.action_list = [
      ...(milestoneWithReminder.action_list || []),
      {
        date: new Date(),
        date_next: next_remind_date,
        title: "remind",
      }
    ];
    set_milestone_list([...milestone_list.filter(item => item !== milestoneWithReminder), milestoneWithReminder]);
    setMilestoneWithReminder(null);
  }

  return (
    <>
      {milestoneWithReminder ?
        <Notification>
          <p>You have a reminder, please check it.</p>
          <hr />
          <EventbaseView eventbase={milestoneWithReminder.eventbase} />
          <ButtonToolbar>
            <Button onClick={handleDoneClick} appearance="primary">Done</Button>
            <Button onClick={handleIgnoreClick} appearance="default">Ignore</Button>
            <Button onClick={handleRemindClick} appearance="default">Remind</Button>
          </ButtonToolbar>
        </Notification>
        :
        <MilestoneListView milestone_list={milestoneWithReminderList} />
      }
    </>
  );
}

export default MilestoneWithReminderListView;
