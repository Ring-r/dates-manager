import { useEffect, useState } from 'react';
import { Button, Divider, FlexboxGrid, HStack, Input, InputNumber, InputPicker, Message, Panel, SelectPicker, useToaster, VStack } from 'rsuite';
import { create_eventbase, Eventbase } from './data_base';

interface EventbaseParam {
  eventbase: Eventbase;
  on_edit?: () => void;
}

export function EventbaseView({ eventbase, on_edit }: EventbaseParam) {
  return (
    <HStack>
      <Input plaintext value={("0" + eventbase.date_month).slice(-2) + "." + ("0" + eventbase.date_day).slice(-2)} />
      <Input plaintext value={eventbase.title} />
      {eventbase.actor && <Input plaintext value={eventbase.actor} />}
      {on_edit && <Button onClick={on_edit}>edit</Button>}
    </HStack>
  );
}

interface EventbaseEditParam {
  eventbase: Eventbase;
  on_apply: (eventbase: Eventbase) => void;
  on_cancel: () => void;
  on_delete: () => void;

  eventbase_title_list?: string[];
  eventbase_actor_list?: string[];
}

export function EventbaseEditView({ eventbase, on_apply, on_cancel, on_delete, eventbase_title_list, eventbase_actor_list }: EventbaseEditParam) {
  const [dateYear, setDateYear] = useState<string | number | null>(eventbase.date_year || null);
  const [dateMonth, setDateMonth] = useState<number | null>(eventbase.date_month);
  const [dateDay, setDateDay] = useState<number | null>(eventbase.date_day);
  const [title, setTitle] = useState<string>(eventbase.title);
  const [actor, setActor] = useState<string>(eventbase.actor || "");
  const toaster = useToaster();

  const data_month = Array.from({ length: 12 }, (x, i) => i + 1).map(item => ({ label: item, value: item }));
  const data_day = Array.from({ length: 31 }, (x, i) => i + 1).map(item => ({ label: item, value: item }));

  useEffect(() => {
    // todo: change style of date components if they are not correct date
  }, [dateYear, dateMonth, dateDay])

  const handleTodayClick = () => {
    const today = new Date();
    setDateMonth(today.getMonth() + 1);
    setDateDay(today.getDate());
  }

  const handleApplyClick = () => {
    const date_year = dateYear !== null ? Number(dateYear) : undefined;
    if (date_year !== undefined && !Number.isInteger(date_year)) {
      toaster.push((
        <Message showIcon type="error" closable>`year` must be integer number or empty.</Message>
      ), { duration: 5000 })
      return;
    }
    if (dateMonth === null || !Number.isInteger(dateMonth)) {
      toaster.push((
        <Message showIcon type="error" closable>`month` must be integer number.</Message>
      ), { duration: 5000 })
      return;
    }
    if (dateDay === null || !Number.isInteger(dateDay)) {
      toaster.push((
        <Message showIcon type="error" closable>`month` must be integer number.</Message>
      ), { duration: 5000 })
      return;
    }
    try {
      new Date(date_year || 2000, dateMonth - 1, dateDay); // 2000 is a leap year
    }
    catch {
      toaster.push((
        <Message showIcon type="error" closable>the date is incorrect.</Message>
      ), { duration: 5000 })
      return;
    }

    on_apply(
      create_eventbase(
        eventbase.uid,
        date_year,
        dateMonth,
        dateDay,
        title,
        actor !== "" ? actor : undefined,
      )
    );
  }

  const data_eventbase_title_list = (eventbase_title_list || []).map(item => ({ label: item, value: item }));
  const data_eventbase_actor_list = (eventbase_actor_list || []).map(item => ({ label: item, value: item }));

  return (
    <Panel>
      <FlexboxGrid justify="space-between">
        <Button onClick={handleApplyClick}>apply</Button>
        <Button onClick={on_cancel}>cancel</Button>
        <Button onClick={on_delete}>delete</Button>
      </FlexboxGrid>
      <Divider />

      <VStack>
        <HStack>
          <InputNumber placeholder="year" value={dateYear} onChange={setDateYear} />
          <Button onClick={() => setDateYear(new Date().getFullYear())}>current</Button>
          <Button onClick={() => setDateYear(null)}>clear</Button>
        </HStack>
        <HStack>
          {/* it is better to use InputPicker but it is broken. and it is better to use something like DatePicker with Time format */}
          <SelectPicker cleanable={false} data={data_month} placeholder="month" value={dateMonth} onChange={setDateMonth} />
          <SelectPicker cleanable={false} data={data_day} placeholder="day" value={dateDay} onChange={setDateDay} />
          <Button onClick={handleTodayClick}>today</Button>
        </HStack>
        <HStack>
          <InputPicker creatable data={data_eventbase_title_list} placeholder="title" value={title} onChange={setTitle} />
        </HStack>
        <InputPicker creatable data={data_eventbase_actor_list} placeholder="actor" value={actor} onChange={setActor} />
      </VStack>
    </Panel>
  );
}

interface EventbaseListParam {
  eventbaseList: Eventbase[];
  on_edit?: (eventbase: Eventbase) => void;
}

function EventbaseListView({ eventbaseList, on_edit }: EventbaseListParam) {
  return (
    <VStack>
      {
        eventbaseList.sort((a, b) => a.date_month !== b.date_month ? a.date_month - b.date_month : a.date_day - b.date_day).map(eventbase =>
          <EventbaseView key={eventbase.uid} eventbase={eventbase} on_edit={on_edit ? () => on_edit(eventbase) : undefined} />
        )
      }
    </VStack>
  );
}

export default EventbaseListView;
