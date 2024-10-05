import { useEffect, useState } from 'react';
import { Button, HStack, Input, SelectPicker } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';


export interface AssigneeInfo {
    uid: number; // auto
    name: string;  // title, summary? not unique.
    description: string;
    // items?: AssigneeInfo[]  // search better naming as `items`
}

let assignee_infos: AssigneeInfo[] = [
  {uid: 0, name: "person 0", description: "person 0 description", },
  {uid: 1, name: "person 1", description: "person 1 description", },
  {uid: 2, name: "familly 0", description: "familly 0 description", },
]

const addAssigneeInfo = (name: string, description: string) => {
  const autoIndex = assignee_infos.length>0? assignee_infos[assignee_infos.length - 1].uid + 1: 0;

  assignee_infos.push(
    {
      uid: autoIndex,
      name: name,
      description: description,
      // todo: items: items,
    }
  )
  return autoIndex;
}

const setAssigneeInfo = (uid: number, name: string, description: string) => {
  const assignee_info = getAssigneeInfo(uid);
  if (assignee_info) {
    assignee_info.name = name;
    assignee_info.description = description;
  }
  else {
    console.error(`assignee (${uid}) doesn't exist`);
    // todo: resolve this issue. what to show in ui?
  }
}

const getAssigneeInfo = (uid: number | null) => {
  if (uid === null) return null;

  return assignee_infos.find(item => item.uid === uid);
}

const delAssigneeInfo = (uid: number | null) => {
  if (uid === null) return;

  assignee_infos = assignee_infos.filter(item => item.uid !== uid);
}

function AssigneeView({uid_param}: {uid_param?: number}) {
  const [uid, setUid] = useState<number | null>(uid_param !== undefined? uid_param: null);

  const [name, setName] = useState<string | null>();
  const [description, setDescription] = useState<string | null>();

  const [editMode, setEditMode] = useState<boolean>(false);

  useEffect(() => {
    const assignee_info = getAssigneeInfo(uid);
    if (assignee_info) {
      setName(assignee_info.name);
      setDescription(assignee_info.description);
      // todo: setItems(items);
    }
    else {
      setName(null);
      setDescription(null);
      // todo: setItems(null);
    }
  }, [uid]);
  
  const assignee_info_elements = assignee_infos.map(item => ({ label: item.name, value: item.uid }));  // todo: it would be good to use name and description here

  const onClickAddNew = () => {
    setUid(null);
    setName(null);
    setDescription(null);

    setEditMode(true);
  }

  const onClickEdit = () => {
    setEditMode(true);
  }
  
  const onClickRemove = () => {
    if (uid === null) return;

    delAssigneeInfo(uid);
    setUid(null);
  }

  const onNameChange = (value: string) => {
    setName(value);
  }

  const onDescriptionChange = (value: string) => {
    setDescription(value);
  }

  const onClickSave = () => {
    if (uid === null) {
      const uid = addAssigneeInfo(name??"", description??"");
      setUid(uid);
    }
    else {
      setAssigneeInfo(uid, name??"", description??"");
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
          <SelectPicker data={assignee_info_elements} defaultValue={uid} placeholder="assignee" onChange={value=>{setUid(value)}} />
          <Button onClick={onClickAddNew}>add new</Button>
          {uid !== null && <Button onClick={onClickEdit}>edit</Button>}
          {uid !== null && <Button onClick={onClickRemove}>remove</Button>}
        </HStack>
      )}

      {editMode && (
        // run in separate window
        <HStack style={{ width: '100%' }}>
          <Input placeholder="assignee_name" defaultValue={name??""} onChange={onNameChange} />
          <Input as="textarea" placeholder="assignee_description" defaultValue={description??""} onChange={onDescriptionChange} />
          <Button onClick={onClickSave}>save</Button>
          <Button onClick={onClickCancel}>cancel</Button>
        </HStack>
      )}
    </>
  )
}

export default AssigneeView;
