import React from "react";
import { Col, Container, Row } from "react-grid-system";
import AttentionFlowGraph, {GraphData} from "./components/AttentionFlowGraph";
import { useHoverLock, UseHoverLockState } from "./components/useHoverLock";

export function AttentionFlowGraphFn({ tokens, attention, model_name }: AttentionFlowGraphFnProps) {
  const initialData = {
    numLayers: attention.length,
    numTokens: tokens.length,
    numHeads: attention[0].length,
    attentionPatterns: convertAttentionToPatterns(attention),
    tokens: tokens,
    model_name: model_name
  };

  return (
    <Container>
      <Row>
        <Col>
          <AttentionFlowGraph initialData={initialData} />
        </Col>
      </Row>
    </Container>
  );
}

export interface AttentionFlowGraphFnProps {
  /**
   * List of tokens
   *
   * Must be the same length as the list of values.
   */
  tokens: string[];

  /**
   * Attention heads activations
   *
   * Of the shape [ layers x heads x dest_pos x src_pos ]
   */
  attention: number[][][][];

  /**
   * Name of the model
   *
   * Can only be one of two values: "gpt2-small" or "pythia-2.8b"
   */
  model_name: "gpt2-small" | "pythia-2.8b";
}

function convertAttentionToPatterns(attention: number[][][][]): any[] {
  const patterns: any[] = [];
  const numLayers = attention.length;
  for (let l = 0; l < numLayers; l++) {
    const layerAtt = attention[l]; // shape: [heads][dest_pos][src_pos]
    const numHeads = layerAtt.length;
    const seqLen = layerAtt[0].length; // assuming square matrices for attention
    for (let h = 0; h < numHeads; h++) {
      for (let d = 0; d < seqLen; d++) {
        for (let s = 0; s < seqLen; s++) {
          patterns.push({
            sourceLayer: l,
            sourceToken: s,
            destLayer: l + 1,
            destToken: d,
            weight: layerAtt[h][d][s],
            head: h,
          });
        }
      }
    }
  }
  return patterns;
}