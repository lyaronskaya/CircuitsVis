import CytoscapeComponent from "react-cytoscapejs";

const AttentionGraph = ({ graphData, threshold }) => {
  const filteredEdges = graphData.edges.filter(edge => edge.data.weight >= threshold);

  return (
    <CytoscapeComponent
      elements={[...graphData.nodes, ...filteredEdges]}
      style={{ width: "100%", height: "500px" }}
      layout={{ name: "dagre" }} // Hierarchical DAG layout
      stylesheet={[
        {
          selector: "node",
          style: { "background-color": "#6FA8DC", "label": "data(label)" }
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
