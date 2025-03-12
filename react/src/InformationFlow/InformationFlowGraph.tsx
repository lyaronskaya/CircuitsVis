import React from "react";
import { Col, Container, Row } from "react-grid-system";
import AttentionFlowGraph from "./components/AttentionFlowGraph";
import { useHoverLock, UseHoverLockState } from "./components/useHoverLock";

export function AttentionFlowGraphFn({ tokens, attention }: AttentionFlowGraphFnProps) {
  return (
    <Container>
      <Row>
        <Col>
          <AttentionFlowGraph/>
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
            destLayer: l,
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