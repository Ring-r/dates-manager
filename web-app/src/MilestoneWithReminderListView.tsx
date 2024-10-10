import { useEffect, useState } from 'react';
import { Button, ButtonToolbar, Notification as SuiteNotification } from 'rsuite';
import { add_reminder, create_milestone, Eventbase, get_last_action, get_reminder_stop_datetime, get_uid, in_process, is_empty, Milestone, MilestoneActionReminder, settings } from './data';
import { EventbaseView } from './EventbaseListView';
import MilestoneListView from './MilestoneListView';

interface MilestoneWithReminderListParam {
  eventbase_list: Eventbase[];
  milestone_list: Milestone[];
  set_milestone_list: (milestoneWithReminderList: Milestone[]) => void;
}

function MilestoneWithReminderListView({ eventbase_list, milestone_list, set_milestone_list }: MilestoneWithReminderListParam) {
  const [milestoneWithReminder, setMilestoneWithReminder] = useState<Milestone | null>(null);
  const [milestoneWithReminderList, setMilestoneWithReminderList] = useState<Milestone[]>([]);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    if (milestoneWithReminder !== null) return;

    recalc_milestone_with_reminder_list();
  }, [milestoneWithReminder]);

  useEffect(() => {
    recalc_milestone_with_reminder_list();
  }, [eventbase_list, milestone_list]);

  function get_next_milestone_list(eventbase_list: Eventbase[], milestone_list: Milestone[], date: Date) {
    const next_year_date = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
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
        if (is_empty(milestone) && date.getTime() <= milestone.date.getTime() + reminder_interval.to_stop) return true;
        return false;
      })
      .map(milestone => is_empty(milestone) ? add_reminder(milestone) : milestone)
      .sort((a, b) => {
        const a_last_action = get_last_action(a);
        const a_date = a_last_action ? (a_last_action as MilestoneActionReminder).date_next : a.date;
        const b_last_action = get_last_action(b);
        const b_date = b_last_action ? (b_last_action as MilestoneActionReminder).date_next : b.date;
        return a_date.getTime() - b_date.getTime();
      });
  }

  function recalc_milestone_with_reminder_list() {
    clearTimeout(timeoutId);

    const now = new Date();

    const milestoneWithReminderList_ = get_next_milestone_list(eventbase_list, milestone_list, now);

    setMilestoneWithReminderList(milestoneWithReminderList_);

    const milestoneWithReminder_ = milestoneWithReminderList_.length > 0 ? milestoneWithReminderList_[0] : null;

    if (!milestoneWithReminder_) {
      setMilestoneWithReminder(null);
      return;
    }

    const last_action = get_last_action(milestoneWithReminder_) as MilestoneActionReminder;
    if (last_action.date_next.getTime() <= now.getTime()) {
      setMilestoneWithReminder(milestoneWithReminder_);
    }
    else {
      const targetDate: Date = (last_action as MilestoneActionReminder).date_next;

      const now = new Date();
      const timeDifference = targetDate.getTime() - now.getTime();
      const maxTimeout = 2147483647; // Max value for setTimeout (approx. 24.8 days)
      const timeoutId_ = setTimeout(recalc_milestone_with_reminder_list, Math.min(timeDifference, maxTimeout));
      setTimeoutId(timeoutId_);
    }
  }

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
    // todo: use something like `add_reminder(milestoneWithReminder, "after 1h")
    set_milestone_list([...milestone_list.filter(item => item !== milestoneWithReminder), milestoneWithReminder]);
    setMilestoneWithReminder(null);
  }

  return (
    <>
      {milestoneWithReminder ?
        <SuiteNotification>
          <p>You have a reminder, please check it.</p>
          <hr />
          <EventbaseView eventbase={milestoneWithReminder.eventbase} />
          <ButtonToolbar>
            <Button onClick={handleDoneClick} appearance="primary">Done</Button>
            <Button onClick={handleIgnoreClick} appearance="default">Ignore</Button>
            <Button onClick={handleRemindClick} appearance="default">Remind</Button>
          </ButtonToolbar>
        </SuiteNotification>
        :
        <MilestoneListView milestone_list={milestoneWithReminderList} />
      }
    </>
  );
}

export default MilestoneWithReminderListView;
