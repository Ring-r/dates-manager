import { useEffect, useState } from 'react';
import { Avatar, Button, HStack, Input, SelectPicker } from 'rsuite';
import { TypeAttributes } from 'rsuite/esm/internals/types';


export interface TypeInfo {
  uid: number;  // todo: it is good to avoid using `uid` in gloabl storage
  name: string;  // optional but can be useful - "birthday. <when>. <whom>.". `default=""`?.
  icon?: string;  // enum, inage, url. `default=name.length>0? name[0]: ""`?
  color?: TypeAttributes.Color;  // default=?
  summary?: string;  // details, description?
}

let type_infos: TypeInfo[] = [
  {uid: 0, name: "birthday (general)", summary: "birthday", },
  {uid: 1, name: "birthday (friends)", color: "red", icon: "b", summary: "birthday", },
  {uid: 2, name: "marriage", color: "yellow", icon: "m", summary: "marriage", },
]

const addTypeInfo = (name: string, icon?: string, color?: TypeAttributes.Color, summary?: string) => {
  const autoIndex = type_infos.length>0? type_infos[type_infos.length - 1].uid + 1: 0;

  type_infos.push(
    {
      uid: autoIndex,
      name: name,
      icon: icon,
      color: color,
      summary: summary,
    }
  )
  return autoIndex;
}

const setTypeInfo = (uid: number, name: string, icon?: string, color?: TypeAttributes.Color, summary?: string) => {
  const type_info = getTypeInfo(uid);
  if (type_info) {
    type_info.name = name;  // todo: check is name is unique. empty should be error.
    type_info.icon = icon;
    type_info.color = color;
    type_info.summary = summary;

  }
  else {
    console.error(`type (${uid}) doesn't exist`);
    // todo: resolve this issue. what to show in ui?
  }
}

const getTypeInfo = (uid: number | null) => {
  if (uid === null) return null;

  return type_infos.find(item => item.uid === uid);
}

const delTypeInfo = (uid: number | null) => {
  if (uid === null) return;

  type_infos = type_infos.filter(item => item.uid !== uid);
}

function TypeView({uid_param}: {uid_param?: number}) {
  const [uid, setUid] = useState<number | null>(uid_param !== undefined? uid_param: null);

  const [name, setName] = useState<string | null>();
  const [icon, setIcon] = useState<string | null>();
  const [color, setColor] = useState<TypeAttributes.Color | null>();
  const [summary, setSummary] = useState<string | null>();

  const [editMode, setEditMode] = useState<boolean>(false);

  useEffect(() => {
    const type_info = getTypeInfo(uid);
    if (type_info) {
      setName(type_info.name);
      setIcon(type_info.icon);
      setColor(type_info.color);
      setSummary(type_info.summary);
    }
    else {
      setName(null);
      setIcon(null);
      setColor(null);
      setSummary(null);
    }
  }, [uid]);
  
  const colors = ['red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'violet'].map(item => ({ label: item, value: item }));
  const type_info_elements = type_infos.map(item => ({ label: item.name, value: item.uid }));  // todo: it would be good to use icon and color here

  const onClickAddNew = () => {
    setUid(null);
    setName(null);
    setIcon(null);
    setColor(null);
    setSummary(null);

    setEditMode(true);
  }

  const onClickEdit = () => {
    setEditMode(true);
  }
  
  const onClickRemove = () => {
    if (uid === null) return;

    delTypeInfo(uid);
    setUid(null);
  }

  const onColorChange = (value: TypeAttributes.Color | null) => {
    setColor(value);
  }

  const onIconChange = (value: string) => {
    setIcon(value);
  }

  const onNameChange = (value: string) => {
    setName(value);
    // todo: checl value is unique
  }

  const onSummaryChange = (value: string) => {
    // todo: trim value by whitespaces
    setSummary(value);
  }

  const onClickSave = () => {
    if (uid === null) {
      const uid = addTypeInfo(name??"", icon??undefined, color??undefined, summary??undefined);
      setUid(uid);
    }
    else {
      setTypeInfo(uid, name??"", icon??undefined, color??undefined, summary??undefined);
    }
    setEditMode(false);
  }

  const onClickCancel = () => {
    setEditMode(false);
  }

  return (
    <>
      {!editMode && (
        <HStack style={{ width: '100%' }}>
          {color && icon && <Avatar color={color} size="xs">{icon}</Avatar>}
          <SelectPicker data={type_info_elements} defaultValue={uid} placeholder="type" onChange={value=>{setUid(value)}} />
          <Button onClick={onClickAddNew}>add new</Button>
          {uid !== null && <Button onClick={onClickEdit}>edit</Button>}
          {uid !== null && <Button onClick={onClickRemove}>remove</Button>}
        </HStack>
      )}

      {editMode && (
        // run in separate window
        <HStack style={{ width: '100%' }}>
          <SelectPicker placeholder="type_color" data={colors} defaultValue={color??null} />
          <Input placeholder="type_icon" defaultValue={icon??""} onChange={onIconChange} />
          <Input placeholder="type_name" defaultValue={name??""} onChange={onNameChange} />
          <Input placeholder="type_summary" defaultValue={summary??""} onChange={onSummaryChange} />
          <Button onClick={onClickSave}>save</Button>
          <Button onClick={onClickCancel}>cancel</Button>
        </HStack>
      )}
    </>
  )
}

export default TypeView;
