import { useState } from 'react';
import { Button, DateInput, DatePicker, HStack, Input, VStack } from 'rsuite';
import { Eventbase } from './data';

interface EventbaseParam {
  eventbase: Eventbase;
  on_edit?: () => void;
}

export function EventbaseView({ eventbase, on_edit }: EventbaseParam) {
  return (
    <HStack>
      <DateInput plaintext value={eventbase.date} />
      <Input plaintext value={eventbase.title} />
      {eventbase.actor && <Input plaintext value={eventbase.actor} />}
      {on_edit && <Button onClick={on_edit}>edit</Button>}
    </HStack>
  );
}

interface EventbaseEditParam {
  eventbase: Eventbase;
  on_apply?: () => void;
  on_cancel?: () => void;
  on_delete?: () => void;
}

export function EventbaseEditView({ eventbase, on_apply, on_cancel, on_delete }: EventbaseEditParam) {
  const [date, setDate] = useState<Date | null>(eventbase.date);
  const [title, setTitle] = useState<string>(eventbase.title);
  const [actor, setActor] = useState<string | undefined>(eventbase.actor);

  const handleChangeDate = (value: Date | null) => {
    setDate(value);

    if (value === null) return
    eventbase.date = value;
  }

  const handleChangeTitle = (value: string) => {
    setTitle(value);
    eventbase.title = value;
  }

  const handleChangeActor = (value: string) => {
    setActor(value);

    eventbase.actor = value !== "" ? value : undefined;
  }

  return (
    <VStack key={eventbase.uid}>
      <DatePicker cleanable={false} format="yyyy.MM.dd" value={date} onChange={handleChangeDate} />
      <Input placeholder="title" value={title} onChange={handleChangeTitle} />
      <Input placeholder="actor" value={actor} onChange={handleChangeActor} />
      <Button onClick={on_apply}>apply</Button>
      <Button onClick={on_cancel}>cancel</Button>
      <Button onClick={on_delete}>delete</Button>
    </VStack>
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
        eventbaseList.sort((a, b) => a.date.getTime() - b.date.getTime()).map(eventbase =>
          <EventbaseView key={eventbase.uid} eventbase={eventbase} on_edit={on_edit ? () => on_edit(eventbase) : undefined} />
        )
      }
    </VStack>
  );
}

export default EventbaseListView;
