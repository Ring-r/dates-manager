import { useEffect, useState } from 'react';
import { Button, DateInput, DatePicker, HStack, Input, Message, SelectPicker, useToaster, VStack } from 'rsuite';
import { MilestoneAction } from './data';

interface MilestoneActionParam {
  milestone_action: MilestoneAction;
  onEdit?: () => void;
}

function MilestoneActionView({ milestone_action, onEdit }: MilestoneActionParam) {
  return (
    <HStack>
      <DateInput plaintext value={milestone_action.date} format='yyyy.MM.dd' />
      <Input plaintext value={milestone_action.title} />
      {milestone_action.title === "remind" && <DateInput plaintext value={milestone_action.date} format='yyyy.MM.dd HH:mm' />}
      {onEdit && <Button onClick={onEdit}>edit</Button>}
    </HStack>
  );
}

interface MilestoneActionEditParam {
  milestone_action: MilestoneAction;

  onApply: (milestone_action: MilestoneAction) => void;
  onCancel: () => void;
  onDelete: () => void;
}

function MilestoneActionEditView({ milestone_action, onApply, onCancel, onDelete }: MilestoneActionEditParam) {
  const [date, setDate] = useState<Date | null>(milestone_action.date);
  const [title, setTitle] = useState<string | null>(milestone_action.title);
  const [dateNext, setDateNext] = useState<Date | null>(milestone_action.title === "remind" ? milestone_action.date_next : null);
  const toaster = useToaster();

  const title_choise_list = ['done', 'ignore', 'remind',].map(item => ({ label: item, value: item }));

  const handleApplyClick = () => {
    if (!date) return;
    if (!title) return;

    if (title === "done") {
      onApply(
        {
          date: date,
          title: title,
        }
      );
      return;
    }

    if (title === "ignore") {
      onApply(
        {
          date: date,
          title: title,
        }
      );
      return;
    }

    if (title === "remind") {
      if (!dateNext) {
        toaster.push((
          <Message showIcon type="error" closable>Set next remind date.</Message>
        ), { duration: 5000 })
        return;
      }

      onApply(
        {
          date: date,
          title: title,
          date_next: dateNext,
        }
      )
      return;
    }
  }

  return (
    <VStack>
      <DatePicker cleanable={false} format="yyyy.MM.dd HH:mm" onChange={setDate} value={date} />
      <SelectPicker cleanable={false} data={title_choise_list} onChange={setTitle} searchable={false} value={title} />
      {title === "remind" && <DatePicker format="yyyy.MM.dd HH:mm" onChange={setDateNext} value={dateNext} />}
      <HStack>
        <Button onClick={handleApplyClick}>apply</Button>
        <Button onClick={onCancel}>cancel</Button>
        <Button onClick={onDelete}>delete</Button>
      </HStack>
    </VStack>
  );
}

interface MilestoneActionListParam {
  milestone_action_list?: MilestoneAction[];
  set_milestone_action_list: (milestone_action_list: MilestoneAction[]) => void;
  setEditMode: (editMode: boolean) => void;
}

function MilestoneActionListView({ milestone_action_list, set_milestone_action_list, setEditMode }: MilestoneActionListParam) {
  const [editing, setEditing] = useState<MilestoneAction | null>(null);

  useEffect(() => {
    setEditMode(editing != null);
  }, [editing]);

  const handleAdd = () => {
    setEditing({ date: new Date(), title: "remind", date_next: new Date() });
  }

  const handleEdit = (milestone_action: MilestoneAction) => {
    setEditing(milestone_action);
  }

  const handleApply = (milestone_action: MilestoneAction) => {
    if (editing === null) return;

    set_milestone_action_list(
      [
        ...(milestone_action_list || [])
          .filter(milestone_action => milestone_action.date.getTime() !== editing.date.getTime()),
        milestone_action,
      ].sort((a, b) => a.date.getDay() - b.date.getDay()));
    setEditing(null);
  }

  const handleCancel = () => {
    setEditing(null);
  }

  const handleDelete = () => {
    if (milestone_action_list === undefined) return;
    if (editing === null) return;

    set_milestone_action_list(
      milestone_action_list
        .filter(milestone_action => milestone_action.date.getTime() !== editing.date.getTime())
    );
    setEditing(null);
  }

  return (
    <>
      {editing
        ?
        <MilestoneActionEditView milestone_action={editing} onApply={handleApply} onCancel={handleCancel} onDelete={handleDelete} />
        :
        <VStack>
          <Button onClick={handleAdd}>add milestone action</Button>
          {milestone_action_list &&
            milestone_action_list.map(milestone_action =>
              <MilestoneActionView key={milestone_action.date.getTime()} milestone_action={milestone_action} onEdit={() => handleEdit(milestone_action)} />
            )
          }
        </VStack>
      }
    </>
  );
}

export default MilestoneActionListView;
