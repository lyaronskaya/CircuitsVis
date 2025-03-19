import { ComponentMeta, ComponentStory } from "@storybook/react";
import React from "react";

import { InformationFlowGraph } from "./InformationFlowGraph";
import { mockAttention, mockTokens } from "./mocks/mockAttention";

export default {
  component: InformationFlowGraph,
} as ComponentMeta<typeof InformationFlowGraph>;

const Template: ComponentStory<typeof InformationFlowGraph> = (args) => (
  <InformationFlowGraph {...args} />
);



export const GraphViz: ComponentStory<typeof InformationFlowGraph> =
  Template.bind({});
GraphViz.args = {
  tokens: mockTokens,
  attention: mockAttention
};
