import { useState } from 'react';
import { Badge, Button, DateInput, DatePicker, HStack, Input, VStack } from 'rsuite';
import { Eventbase, get_last_action, get_uid, Milestone, MilestoneAction } from './data';
import { EventbaseView } from './EventbaseListView';
import MilestoneActionListView from './MilestoneActionListView';

interface MilestoneParam {
  milestone: Milestone;
  on_edit?: () => void;
}

export function MilestoneView({ milestone, on_edit }: MilestoneParam) {
  const last_action = get_last_action(milestone);

  return (
    <HStack>
      <DateInput plaintext value={milestone.date} format='yyyy.MM.dd' />
      <Input plaintext value={milestone.eventbase.title} />
      {milestone.eventbase.actor && <Input plaintext value={milestone.eventbase.actor} />}
      <Badge content={last_action ? last_action.title : "no information or empty"} />
      {on_edit && <Button onClick={on_edit}>edit</Button>}
    </HStack>
  );
}

interface MilestoneEditParam {
  milestone: Milestone;
  on_apply: (milestone: Milestone) => void;
  on_cancel: () => void;
  on_delete: () => void;
}

export function MilestoneEditView({ milestone, on_apply, on_cancel, on_delete }: MilestoneEditParam) {
  const [date, setDate] = useState<Date | null>(milestone.date);
  const [eventbase, setEventbase] = useState<Eventbase>(milestone.eventbase); // todo: | null 
  const [actionList, setActionList] = useState<MilestoneAction[] | undefined>(milestone.action_list);
  const [milestoneActionEditMode, setMilestoneActionEditMode] = useState<boolean>(false);


  const handleApplyClick = () => {
    if (!date) return;
    // if (!title) return;

    on_apply(
      {
        date: date,
        eventbase: eventbase,
        action_list: actionList,
      }
    );
  }

  return (
    <VStack>
      {!milestoneActionEditMode && <DatePicker cleanable={false} format="yyyy" value={date} onChange={setDate} />}
      {!milestoneActionEditMode && <EventbaseView eventbase={eventbase} />}
      <MilestoneActionListView milestone_action_list={actionList} set_milestone_action_list={setActionList} setEditMode={setMilestoneActionEditMode} />
      {!milestoneActionEditMode &&
        <HStack>
          <Button onClick={handleApplyClick}>apply</Button>
          <Button onClick={on_cancel}>cancel</Button>
          <Button onClick={on_delete}>delete</Button>
        </HStack>
      }
    </VStack>
  );
}

interface MilestoneListParam {
  milestone_list: Milestone[];
  on_edit?: (milestone: Milestone) => void;
}

function MilestoneListView({ milestone_list, on_edit }: MilestoneListParam) {
  return (
    <VStack>
      {
        milestone_list.map(milestone =>
          <MilestoneView key={get_uid(milestone)} milestone={milestone} on_edit={on_edit ? () => on_edit(milestone) : undefined} />
        )
      }
    </VStack>
  );
}

export default MilestoneListView;
