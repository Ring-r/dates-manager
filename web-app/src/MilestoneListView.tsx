import { useState } from 'react';
import { Badge, Button, DateInput, DatePicker, Divider, FlexboxGrid, HStack, Input, Panel, Text, VStack } from 'rsuite';
import { get_uid, Milestone } from './data';
import { EventbaseView } from './EventbaseListView';

interface MilestoneParam {
  milestone: Milestone;
  on_edit?: () => void;
}

export function MilestoneView({ milestone, on_edit }: MilestoneParam) {
  const state_type = milestone.state.type;
  const color =
    state_type === "done" ? "green" :
      state_type === "ignore" ? "red" :
        state_type === "remind" ? "yellow" :
          "violet";

  return (
    <HStack>
      <DateInput plaintext value={milestone.date} format='yyyy.MM.dd' />
      <Input plaintext value={milestone.eventbase.title} />
      {milestone.eventbase.actor && <Input plaintext value={milestone.eventbase.actor} />}
      {state_type !== "base" && <Badge color={color} content={state_type} />}
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
  const [nextReminderDatetime, setNextReminderDatetime] = useState<Date>(milestone.state.type === "remind" ? milestone.state.next_reminder_datetime : new Date());
  const [stateType, setStateType] = useState<string>(milestone.state.type);
  const [story, setStory] = useState<string>(milestone.story || "");

  const color =
    stateType === "done" ? "green" :
      stateType === "ignore" ? "red" :
        stateType === "remind" ? "yellow" :
          "violet";

  const StateView = () => {
    const next_reminder_duration = new Date(nextReminderDatetime.getTime() - (new Date()).getTime());
    return (
      <VStack alignItems="center">
        <Text>after</Text>
        <DatePicker cleanable={false} format="HH:mm" value={next_reminder_duration} />
        <Text>at</Text>
        <DatePicker cleanable={false} format="yyyy.MM.dd HH:mm" value={nextReminderDatetime} />
      </VStack>
    )
  }

  const handleApplyClick = () => {
    on_apply(
      {
        ...milestone,
        story: story !== "" ? story : undefined,
      }
    );
  }

  return (
    <Panel>
      <FlexboxGrid justify="space-between">
        <Button onClick={handleApplyClick}>apply</Button>
        <Button onClick={on_cancel}>cancel</Button>
        <Button onClick={on_delete}>delete</Button>
      </FlexboxGrid>
      <Divider />
      <Panel>
        <FlexboxGrid justify="center">
          <HStack>
            <Input plaintext value={milestone.date.getFullYear() + "."} />
            <EventbaseView eventbase={milestone.eventbase} />
          </HStack>
        </FlexboxGrid>
      </Panel>
      <Panel>
        <FlexboxGrid justify="center">
          <Badge color={color} content={stateType} />
        </FlexboxGrid>
      </Panel>
      {stateType === "remind" && <StateView />}
      <Panel>
        <FlexboxGrid justify="space-between">
          <Button>done</Button>
          <Button>ignore</Button>
          <Button>remind</Button>
        </FlexboxGrid>
      </Panel>
      <Divider />
      <Input as="textarea" onChange={setStory} placeholder="tell me a story" value={story} />
    </Panel>
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
