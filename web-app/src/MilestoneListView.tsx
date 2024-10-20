import { useState } from 'react';
import { Badge, Button, DatePicker, Divider, FlexboxGrid, HStack, Input, Message, Panel, Text, useToaster, VStack } from 'rsuite';
import { get_uid, Milestone, MilestoneStateBase, MilestoneStateDone, MilestoneStateIgnore, MilestoneStateRemind } from './data';
import { EventbaseView } from './EventbaseListView';

function state_type_to_color(state_type: string) {
  if (state_type === "done") return "green";
  if (state_type === "ignore") return "red";
  if (state_type === "remind") return "yellow";
  return "violet";
};

interface MilestoneParam {
  milestone: Milestone;
  on_edit?: () => void;
}

export function MilestoneView({ milestone, on_edit }: MilestoneParam) {
  const [stateType] = useState<string>(milestone.state.type);

  return (
    <HStack>
      <Input plaintext value={milestone.date_year + "."} />
      <EventbaseView eventbase={milestone.eventbase} />
      {stateType !== "base" && <Badge color={state_type_to_color(stateType)} content={stateType} />}
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
  const default_reminder_duration = 2 * 60 * 60 * 1000;
  const next_reminder_datetime = milestone.state.type === "remind" ? milestone.state.next_reminder_datetime.getTime() : (new Date()).getTime() + default_reminder_duration;
  const next_reminder_duration = milestone.state.type === "remind" ? milestone.state.next_reminder_datetime.getTime() - (new Date()).getTime() : default_reminder_duration;

  const [nextReminderDatetime, setNextReminderDatetime] = useState<number>(next_reminder_datetime);
  const [nextReminderDuration, setNextReminderDuration] = useState<number>(next_reminder_duration);
  const [stateType, setStateType] = useState<string>(milestone.state.type);
  const [story, setStory] = useState<string>(milestone.story || "");

  const toaster = useToaster();

  function nextReminderDatetimeChangeHandler(value: Date | null) {
    if (!value) return;

    const next_reminder_datetime = value.getTime();
    const next_reminder_duration = next_reminder_datetime - (new Date()).getTime();
    setNextReminderDatetime(next_reminder_datetime);
    setNextReminderDuration(next_reminder_duration);
  }

  function nextReminderDurationChangeHandler(value: Date | null) {
    if (!value) return;

    const next_reminder_duration = value.getTime();
    const next_reminder_datetime = (new Date()).getTime() + next_reminder_duration;
    setNextReminderDuration(next_reminder_duration);
    setNextReminderDatetime(next_reminder_datetime);
  }

  const StateView = () => {
    return (
      <VStack alignItems="center">
        <Text>after</Text>
        <DatePicker cleanable={false} format="HH:mm" onChange={nextReminderDurationChangeHandler} value={new Date(nextReminderDuration)} />
        <Text>at</Text>
        <DatePicker cleanable={false} format="yyyy.MM.dd HH:mm" onChange={nextReminderDatetimeChangeHandler} value={new Date(nextReminderDatetime)} />
      </VStack>
    )
  };

  const handleApplyClick = () => {
    if (stateType === "remind" && nextReminderDatetime < (new Date()).getTime()) {
      toaster.push((
        <Message showIcon type="error" closable>next reminder datetime must be more then now.</Message>
      ), { duration: 5000 });
      return;
    }

    const state = stateType === "base" ? { type: "base" } as MilestoneStateBase :
      stateType === "done" ? { type: "done" } as MilestoneStateDone :
        stateType === "ignore" ? { type: "ignore" } as MilestoneStateIgnore :
          { next_reminder_datetime: new Date(nextReminderDatetime), type: "remind" } as MilestoneStateRemind;

    on_apply(
      {
        ...milestone,
        state: state,
        story: story !== "" ? story : undefined,
      }
    );
  }

  const handleCancelClick = () => {
    if (milestone.state.type === "remind" && milestone.state.next_reminder_datetime.getTime() < (new Date()).getTime()) { // or base and in interval
      toaster.push((
        <Message showIcon type="error" closable>next reminder datetime must be more then now.</Message>
      ), { duration: 5000 });
      return;
    }
    on_cancel();
  }

  return (
    <Panel>
      <FlexboxGrid justify="space-between">
        <Button onClick={handleApplyClick}>apply</Button>
        <Button onClick={handleCancelClick}>cancel</Button>
        <Button onClick={on_delete}>delete</Button>
      </FlexboxGrid>
      <Divider />
      <Panel>
        <FlexboxGrid justify="center">
          <HStack>
            <Input plaintext value={milestone.date_year + "."} />
            <EventbaseView eventbase={milestone.eventbase} />
          </HStack>
        </FlexboxGrid>
      </Panel>
      <Panel>
        <FlexboxGrid justify="center">
          <Badge color={state_type_to_color(stateType)} content={stateType} />
        </FlexboxGrid>
      </Panel>
      {stateType === "remind" && <StateView />}
      <Panel>
        <FlexboxGrid justify="space-between">
          <Button onClick={() => setStateType("done")}>done</Button>
          <Button onClick={() => setStateType("ignore")}>ignore</Button>
          <Button onClick={() => setStateType("remind")}>remind</Button>
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
