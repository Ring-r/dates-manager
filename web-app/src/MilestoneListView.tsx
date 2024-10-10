import { useState } from 'react';
import { Badge, Button, DateInput, HStack, Input, VStack } from 'rsuite';
import { get_last_action, get_uid, in_process, Milestone, MilestoneActionReminder } from './data';
import { EventbaseView } from './EventbaseListView';

interface MilestoneParam {
  milestone: Milestone;
  on_edit?: () => void;
}

export function MilestoneView({ milestone, on_edit }: MilestoneParam) {
  const last_action = get_last_action(milestone);
  const color =
    !last_action ? undefined :
      last_action.title === "done" ? "green" :
        last_action.title === "ignore" ? "red" :
          last_action.title === "remind" ? "yellow" :
            "violet";

  return (
    <HStack>
      <DateInput plaintext value={milestone.date} format='yyyy.MM.dd' />
      <Input plaintext value={milestone.eventbase.title} />
      {milestone.eventbase.actor && <Input plaintext value={milestone.eventbase.actor} />}
      {last_action && <Badge color={color} content={last_action.title} />}
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
  const [description, setDescription] = useState<string>(milestone.description || "");

  const state = () => {
    const last_action = get_last_action(milestone);
    if (last_action === null) return "empty";
    if (last_action === undefined) return "no information";
    if (!in_process(milestone)) return last_action.title;
    const remind_next_datetime = (last_action as MilestoneActionReminder).date_next
    const remind_next_duration = new Date(remind_next_datetime.getTime() - (new Date()).getTime());
    return `remind after ${remind_next_duration.toLocaleTimeString()} at ${remind_next_datetime.toLocaleString()}`
  }

  const handleApplyClick = () => {
    on_apply(
      {
        ...milestone,
        description: description !== "" ? description : undefined,
      }
    );
  }

  return (
    <VStack>
      <HStack>
        <Input plaintext value={milestone.date.getFullYear() + "."} />
        <EventbaseView eventbase={milestone.eventbase} />
      </HStack>
      <Input as="textarea" onChange={setDescription} placeholder="description" value={description} />
      <Input plaintext value={state()} />
      <HStack>
        <Button onClick={handleApplyClick}>apply</Button>
        <Button onClick={on_cancel}>cancel</Button>
        <Button onClick={on_delete}>delete</Button>
      </HStack>
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
