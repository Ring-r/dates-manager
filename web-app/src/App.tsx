import { useState } from 'react';
import { Avatar, Button, Carousel, Checkbox, DatePicker, FlexboxGrid, HStack, Input, Panel, Radio, RadioGroup, SelectPicker, Tag, VStack } from 'rsuite';
import 'rsuite/dist/rsuite.min.css';
import './App.css';

function App() {
  const [previewMode, setPreviewMode] = useState<boolean>();
  const [isDateRecorded, setIsDateRecorded] = useState<boolean>();
  const [isSummaryOrDescriptionRecorded, setIsSummaryOrDescriptionRecorded] = useState<boolean>();
  const [isTargetDisabled, setIsTargetRecorded] = useState<boolean>();
  const [isPresentVisible, setIsPresentVisible] = useState<boolean>();
  const [isCardVisible, setIsCardVisible] = useState<boolean>();
  const [isTextVisible, setIsTextVisible] = useState<boolean>();

  const [presentState, setPresentState] = useState<boolean|undefined>();

  // mode: null - invisible, false - readonly, true - editable
  // {/* <ChangeMode /> */}<Button onClick={() => setDateMode(dateMode == null? false: dateMode == false? true: null)}>change mode</Button>

  return (
    <div className="App">
      {/* <Target> */}
        {/* <Name /> */}
        {/* <EmpyAndNotCurrentTargets /> */}
        {/* <Deacription /> */}
      {/* </Target> */}
      <VStack>
        <Checkbox checked={previewMode} onChange={() => setPreviewMode(!previewMode)}>preview mode</Checkbox>
        <Panel style={{ width: '100%' }}>
          {/* <TemplateContainer> */}<VStack style={{ width: '100%' }}>
            {/* <TemplateEventContainer> */}<HStack style={{ width: '100%' }}>
              {/* <TemplateSelect /> */}<SelectPicker cleanable={false} data={[{ label: "default template", value: 0 }]} defaultValue={0} style={{ width: '100%' }} />
              {/* <CopyTrigger /> */}<Button>clone</Button>
              {/* <EditTrigger /> */}<Button>edit</Button>
            {/* </TemplateEventContainer> */}</HStack>
            {/* <TemplateName /> */}{!previewMode && <Input placeholder='template name' />}
          {/* <TemplateContainer> */}</VStack>
          {/* color */}
          {/* icon */}
        </Panel>

        <Panel style={{ width: '100%' }}>
          {/* <DateContainer> */}<HStack style={{ width: '100%' }}>
            {/* <DatePicker /> */}<DatePicker style={{ width: '100%' }} disabled={previewMode && isDateRecorded} />

            {/* <RecordedCheckbox /> */}{!previewMode && <Checkbox checked={isDateRecorded} onChange={() => setIsDateRecorded(!isDateRecorded)}>recorded</Checkbox>}
          {/* </DateContainer> */}</HStack>

          {/* <SummaryOrDescriptionContainer> */}<HStack style={{ width: '100%' }}>
            {/* <SummaryOrDescription /> */}<Input placeholder="summary or description" disabled={previewMode && isSummaryOrDescriptionRecorded} />

            {/* <RecordedCheckbox /> */}{!previewMode && <Checkbox checked={isSummaryOrDescriptionRecorded} onChange={() => setIsSummaryOrDescriptionRecorded(!isSummaryOrDescriptionRecorded)}>recorded</Checkbox>}
          {/* </SummaryOrDescriptionContainer> */}</HStack>

          {/* <TargetContainer> */}<HStack style={{ width: '100%' }}>
            {/* <TargetSelect /> */}<SelectPicker data={[{ label: "target", value: 0 }]} style={{ width: '100%' }} disabled={previewMode && isTargetDisabled} />
            {/* <CopyTrigger /> */}{(!previewMode || !isTargetDisabled) && <Button>clone</Button>}
            {/* <EditTrigger /> */}{(!previewMode || !isTargetDisabled) && <Button>edit</Button>}

            {/* <RecordedCheckbox /> */}{!previewMode && <Checkbox checked={isTargetDisabled} onChange={() => setIsTargetRecorded(!isTargetDisabled)}>recorded</Checkbox>}
          {/* </TargetContainer> */}</HStack>
        </Panel>

        <Panel style={{ width: '100%' }}>
          {!previewMode && (
            <VStack style={{ width: '100%' }}>
                <HStack>
                  {/* <Slider />? https://rsuitejs.com/components/slider/ */}
                  <Input placeholder='display before duration' />
                  <Tag> : </Tag>
                  <Input placeholder='display after duration' />
                </HStack>
                <HStack>
                  {!previewMode && <Checkbox checked={isPresentVisible} onChange={() => setIsPresentVisible(!isPresentVisible)}>present</Checkbox>}
                  {!previewMode && isPresentVisible && (
                    <HStack>
                      <Input placeholder='remind before duration' /><Input placeholder='remind before frequency' />
                      <Tag> : </Tag>
                      <Input placeholder='remind after duration' /><Input placeholder='remind before frequency' />
                    </HStack>
                  )}
                </HStack>
                <HStack>
                  <VStack>
                    <Checkbox checked={isCardVisible} onChange={() => setIsCardVisible(!isCardVisible)}>card</Checkbox>
                    <Checkbox checked={isTextVisible} onChange={() => setIsTextVisible(!isTextVisible)}>text</Checkbox>
                  </VStack>
                  {(isCardVisible || isTextVisible) && (
                    <HStack>
                      <Input placeholder='remind before duration' /><Input placeholder='remind before frequency' />
                      <Tag> : </Tag>
                      <Input placeholder='remind after duration' /><Input placeholder='remind before frequency' />
                    </HStack>
                  )}
                </HStack>
            </VStack>
          )}
          {previewMode && (
            <>
              {isPresentVisible && (
                <Panel title='present' style={{ width: '100%' }}>
                  <Button>recommend</Button>
                  <HStack>
                    {/* it would be good to store all, show some of them, and one of them can be selected. */}
                    <Carousel className="custom-slider" style={{ width: '100%' }}>
                      <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=1" height="250" width="250" />
                      <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=2" height="250" width="250" />
                      <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=3" height="250" width="250" />
                      <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=4" height="250" width="250" />
                      <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=5" height="250" width="250" />
                      {/* <ImagesControlButton /><Button>add, edit, remove</Button> */}
                    </Carousel>
                    <Input as="textarea" placeholder="description (markdown)" rows={19} style={{ width: '100%' }} />

                  </HStack>
                  <FlexboxGrid justify="center">
                    <RadioGroup inline defaultValue="await">
                      <Radio value="await">await</Radio>
                      <Radio value="done">done</Radio>
                      <Radio value="ignore">ignore</Radio>
                    </RadioGroup>
                  </FlexboxGrid>
              </Panel>
              )}

              {(isCardVisible || isTextVisible) && (
                <Panel style={{ width: '100%' }}>
                  <HStack>
                    {isCardVisible && (
                      <Panel style={{ width: '100%' }}>
                        <Button>generate</Button>
                        <Carousel className="custom-slider">
                          {/* it would be good to store all, show some of them, and one of them can be selected. */}
                          <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=1" height="250" width="250" />
                          <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=2" height="250" width="250" />
                          <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=3" height="250" width="250" />
                          <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=4" height="250" width="250" />
                          <img src="https://via.placeholder.com/250x250/8f8e94/FFFFFF?text=5" height="250" width="250" />
                          {/* <ImagesControlButton /><Button>add, edit, remove</Button> */}
                        </Carousel>
                      </Panel>
                    )}

                    {isTextVisible && (
                      <Panel style={{ width: '100%' }}>
                        <Button>generate</Button>
                        {/* it would be good to store all changes to revert; store some time. */}
                        <Input as="textarea" placeholder="text (markdown)" rows={19} height="100%" />
                      </Panel>
                    )}
                  </HStack>

                  <Button>share</Button>
                  <FlexboxGrid justify="center">
                    <RadioGroup inline defaultValue="await">
                      <Radio value="await">await</Radio>
                      <Radio value="done">done</Radio>
                      <Radio value="ignore">ignore</Radio>
                    </RadioGroup>
                  </FlexboxGrid>

                </Panel>
              )}

              {/* <CreateUniqueEventTrigger /> */}<Button>create unique</Button>

            </>
          )}

        </Panel>
      </VStack>
    </div>
  );
}

export default App;
