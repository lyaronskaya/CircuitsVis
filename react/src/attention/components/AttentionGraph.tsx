import React from "react";
import CytoscapeComponent from "react-cytoscapejs";

interface GraphProps {
  graphData: any;
  threshold: number;
}

const AttentionGraph: React.FC<GraphProps> = ({ graphData, threshold }) => {
  const filteredEdges = graphData.edges.filter(
    (edge: any) => edge.data.weight >= threshold
  );

  const elements = [
    ...graphData.nodes,
    ...filteredEdges
  ];

  return (
    <CytoscapeComponent
      elements={elements}
      style={{ width: "100%", height: "500px" }}
      layout={{ name: "dagre" }}
      stylesheet={[
        {
          selector: "node",
          style: { "background-color": "#6FA8DC", label: "data(label)" }
        },
        {
          selector: "edge",
          style: { "width": "data(weight)", "line-color": "#D3D3D3" }
        }
      ]}
    />
  );
};

export default AttentionGraph;
