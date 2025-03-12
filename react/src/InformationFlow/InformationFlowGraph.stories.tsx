import { ComponentStory, ComponentMeta } from "@storybook/react";
import React from "react";

import { AttentionFlowGraphFn } from "./InformationFlowGraph";
import { mockAttention, mockTokens } from "./mocks/mockAttention";

export default {
  component: AttentionFlowGraphFn,
} as ComponentMeta<typeof AttentionFlowGraphFn>;

const Template: ComponentStory<typeof AttentionFlowGraphFn> = (args) => (
  <AttentionFlowGraphFn {...args} />
);



export const GraphViz: ComponentStory<typeof AttentionFlowGraphFn> =
  Template.bind({});
GraphViz.args = {
  tokens: mockTokens,
  attention: mockAttention
};
