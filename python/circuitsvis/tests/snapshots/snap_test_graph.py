# -*- coding: utf-8 -*-
# snapshottest: v1 - https://goo.gl/zC4yUc
from __future__ import unicode_literals

from snapshottest import Snapshot


snapshots = Snapshot()

snapshots['TestInformationFlowGraph.test_matches_snapshot 1'] = '''<div id="circuits-vis-mock" style="margin: 15px 0;"/>
    <script crossorigin type="module">
    import { render, InformationFlowGraph } from "https://unpkg.com/circuitsvis@0.0.0/dist/cdn/esm.js";
    render(
      "circuits-vis-mock",
      InformationFlowGraph,
      {"numLayers": 1, "numTokens": 2, "numHeads": 1, "attentionPatterns": [[[[0, 1], [0, 1]]]], "tokens": ["a", "b"], "model_name": "gpt2-small"}
    )
    </script>'''