import circuitsvis
import circuitsvis.utils.render
import numpy as np
from circuitsvis.graph import information_flow_graph

class TestInformationFlowGraph:
    def test_matches_snapshot(self, snapshot, monkeypatch):
        monkeypatch.setattr(circuitsvis.utils.render, "uuid4", lambda: "mock")

        res = information_flow_graph(
            tokens=["a", "b"],
            attention=np.array([[[[0, 1], [0, 1]]]]),
            model_name="test_model"
        )
        snapshot.assert_match(str(res))
