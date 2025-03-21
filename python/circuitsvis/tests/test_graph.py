import circuitsvis
import circuitsvis.utils.render
import numpy as np
from circuitsvis.graph import information_flow_graph

class TestInformationFlowGraph:
    def test_matches_snapshot(self, snapshot, monkeypatch):
        monkeypatch.setattr(circuitsvis.utils.render, "uuid4", lambda: "mock")

        attention = np.array([[[[0, 1], [0, 1]]]])
        res = information_flow_graph(
            tokens=["a", "b"],
            attention=attention,
            model_name="gpt2-small"
        )
        assert 4 == len(attention.shape)
        snapshot.assert_match(str(res))
