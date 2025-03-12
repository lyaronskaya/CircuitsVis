"use client";

import React, { useState, useEffect, useRef, ChangeEvent, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import sampleAttentionData from '../mocks/sample-attention.json';

export interface AttentionPattern {
  sourceLayer: number;
  sourceToken: number;
  destLayer: number;
  destToken: number;
  weight: number;
  head: number;
}

export interface HeadPair {
  layer: number;
  head: number;
}

export interface HeadGroup {
  id: number;
  name: string;
  heads: HeadPair[];
}

export interface GraphData {
  numLayers: number;
  numTokens: number;
  numHeads: number;
  attentionPatterns: AttentionPattern[];
  tokens?: string[];
}

interface Node {
  id: string;
  layer: number;
  token: number;
  x: number;
  y: number;
}

interface Link {
  source: string;
  target: string;
  weight: number;
  head: number;
  groupId: number;
}

interface PredefinedGroup {
  name: string;
  vertices: [number, number][];
}

const AttentionFlowGraph: React.FC = ({ initialData }) => {
  const [data, setData] = useState<GraphData>(
  initialData || {
    numLayers: 4,
    numTokens: 5,
    numHeads: 4,
    attentionPatterns: [],
    tokens: Array(5).fill('token')
  });
  const [threshold, setThreshold] = useState(0.4);
  const [selectedHeads, setSelectedHeads] = useState<HeadPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [headGroups, setHeadGroups] = useState<HeadGroup[]>([]);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Graph dimensions and padding – adjust as needed.
  const graphDimensions = {
    width: 1000,
    height: 700,
    padding: {
      top: 40,
      right: 180,
      bottom: 60,
      left: 60
    }
  };

  // Predefined groups for head selection (wrapped in useMemo so they don’t change on every render)
  const predefinedGroups = useMemo<PredefinedGroup[]>(() => [
    { name: "Name Mover", vertices: [[9, 9], [10, 0], [9, 6]] },
    { name: "Negative", vertices: [[10, 7], [11, 10]] },
    { name: "S Inhibition", vertices: [[8, 10], [7, 9], [8, 6], [7, 3]] },
    { name: "Induction", vertices: [[5, 5], [5, 9], [6, 9], [5, 8]] },
    { name: "Duplicate Token", vertices: [[0, 1], [0, 10], [3, 0]] },
    { name: "Previous Token", vertices: [[4, 11], [2, 2]] },
    { name: "Backup Name Mover", vertices: [[11, 2], [10, 6], [10, 10], [10, 2], [9, 7], [10, 1], [11, 9], [9, 0]] }
  ], []);

  // Utility functions wrapped in useCallback
  const getHeadGroup = useCallback((layer: number, head: number): number | null => {
    const group = headGroups.find(g => g.heads.some(h => h.layer === layer && h.head === head));
    return group ? group.id : null;
  }, [headGroups]);

  const getVisibleHeads = useCallback((): HeadPair[] => {
    const groupedHeads = headGroups.flatMap(group => group.heads);
    const individualHeads = selectedHeads.filter(h =>
      !groupedHeads.some(gh => gh.layer === h.layer && gh.head === h.head)
    );
    return [...individualHeads, ...groupedHeads];
  }, [headGroups, selectedHeads]);

  const fetchAttentionData = useCallback(async (text: string) => {
    try {
      setError(null);
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch attention data');
      }
      const fetchedData = await response.json();
      setData(fetchedData);
    } catch (err) {
      console.error('Error fetching attention data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch attention data');
    } finally {
      setLoading(false);
    }
  }, []);

  const debouncedFetchAttentionData = useCallback((text: string) => {
    if (text.trim()) {
      fetchAttentionData(text);
    }
  }, [fetchAttentionData]);

  // Initialize head groups from predefined groups
  useEffect(() => {
    const initialGroups = predefinedGroups.map((group, index) => ({
      id: index,
      name: group.name,
      heads: group.vertices.map(([layer, head]) => ({ layer, head }))
    }));
    setHeadGroups(initialGroups);
  }, [predefinedGroups]);

  // Check backend health on mount
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        const response = await fetch(`${apiUrl}/health`);
        setBackendAvailable(response.ok);
      } catch (err) {
        console.warn('Backend not available:', err);
        setBackendAvailable(false);
      }
    };
    checkBackend();
  }, []);

  // Load attention data – if backend is not available, use sample data.
  useEffect(() => {
     if (initialData) {
      setData(initialData);
      setSelectedHeads([{ layer: 0, head: 0 }]);
     }
    else if (backendAvailable === false) {
      setData(sampleAttentionData);
      setSelectedHeads([{ layer: 0, head: 0 }]);
    } else if (backendAvailable === true) {
      const defaultText = "When Mary and John went to the store, John gave a drink to";
      fetchAttentionData(defaultText);
    }
  }, [backendAvailable, fetchAttentionData]);

  // Handlers for threshold and head selection
  const handleThresholdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setThreshold(parseFloat(e.target.value));
  };

  const handleHeadSelection = (input: string) => {
    try {
      const line = input.trim().split('\n')[0];
      if (!line) return;
      const parts = line.split(',');
      if (parts.length !== 2) {
        setError("Invalid format. Please use 'layer,head' format (e.g., '0,1')");
        return;
      }
      const [layer, head] = parts.map(num => parseInt(num.trim()));
      if (isNaN(layer) || isNaN(head)) {
        setError("Layer and head must be numbers");
        return;
      }
      if (layer < 0 || head < 0 || layer >= data.numLayers || head >= data.numHeads) {
        setError(`Layer must be 0-${data.numLayers - 1} and head must be 0-${data.numHeads - 1}`);
        return;
      }
      if (getHeadGroup(layer, head) === null && !selectedHeads.some(h => h.layer === layer && h.head === head)) {
        setSelectedHeads(prev => [...prev, { layer, head }]);
        setError(null);
      } else if (getHeadGroup(layer, head) !== null) {
        setError("This head is already part of a group");
      } else {
        setError("This head is already selected");
      }
    } catch {
      setError("Invalid input format");
    }
  };

  const addHeadToGroup = (layer: number, head: number, groupId: number) => {
    setHeadGroups(prev =>
      prev.map(group =>
        group.id === groupId
          ? {
              ...group,
              heads: group.heads.some(h => h.layer === layer && h.head === head)
                ? group.heads.filter(h => !(h.layer === layer && h.head === head))
                : [...group.heads, { layer, head }]
            }
          : group
      )
    );
  };

  const removeHead = (layer: number, head: number) => {
    setSelectedHeads(prev => prev.filter(h => !(h.layer === layer && h.head === head)));
  };

  // Draw graph using d3 – memoized to prevent unnecessary redraws.
  const drawGraph = useCallback(() => {
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const { width, height, padding } = graphDimensions;
    const legendWidth = padding.right;
    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;
    const tokenWidth = graphWidth / data.numTokens;
    const layerHeight = graphHeight / (data.numLayers - 1);

    // Create nodes array
    const nodes: Node[] = [];
    for (let l = 0; l < data.numLayers; l++) {
      for (let t = 0; t < data.numTokens; t++) {
        nodes.push({
          id: `${l}-${t}`,
          layer: l,
          token: t,
          x: padding.left + t * tokenWidth + tokenWidth / 2,
          y: height - (padding.bottom + l * layerHeight)
        });
      }
    }

    // Define color scales for groups and individual heads.
    const groupColorScale = d3.scaleOrdinal(d3.schemeTableau10)
      .domain(headGroups.map(g => g.id.toString()));
    const individualHeadColorScale = d3.scaleOrdinal(d3.schemePaired)
      .domain(Array.from({ length: data.numHeads }, (_, i) => i.toString()));

    // Filter edges based on threshold and visible heads.
    const visibleHeadPairs = getVisibleHeads();
    const links: Link[] = data.attentionPatterns
      .filter(edge => {
        const isVisible = visibleHeadPairs.some(h => 
          h.layer === edge.sourceLayer && h.head === edge.head
        );
        return edge.weight >= threshold && isVisible;
      })
      .map(edge => ({
        source: `${edge.sourceLayer}-${edge.sourceToken}`,
        target: `${edge.destLayer}-${edge.destToken}`,
        weight: edge.weight,
        head: edge.head,
        groupId: getHeadGroup(edge.sourceLayer, edge.head) ?? -1
      }));

    const g = svg.append("g");

    // Draw layer labels on y-axis.
    for (let l = 0; l < data.numLayers; l++) {
      g.append("text")
        .attr("x", padding.left / 2 + 25)
        .attr("y", height - (padding.bottom + l * layerHeight))
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(l.toString());
    }
    g.append("text")
      .attr("x", padding.left / 2)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("transform", `rotate(-90, ${padding.left / 2}, ${height / 2})`)
      .attr("font-size", "14px")
      .attr("font-weight", "medium")
      .text("Layer");

    // Draw token labels on x-axis.
    for (let t = 0; t < data.numTokens; t++) {
      g.append("text")
        .attr("x", padding.left + t * tokenWidth + tokenWidth / 2)
        .attr("y", height - padding.bottom / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(data.tokens?.[t] || `T${t}`);
    }
    g.append("text")
      .attr("x", width / 2)
      .attr("y", height - padding.bottom / 4)
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .attr("font-size", "14px")
      .attr("font-weight", "medium")
      .text("Token");

    // Draw edges (links) behind nodes.
    g.selectAll("path")
      .data(links)
      .enter()
      .append("path")
      .attr("d", (d: Link) => {
        const source = nodes.find(n => n.id === d.source)!;
        const target = nodes.find(n => n.id === d.target)!;
        const dx = target.x - source.x;
        const cp1x = source.x + dx * 0.5;
        const cp2x = target.x - dx * 0.5;
        return `M ${source.x} ${source.y} C ${cp1x} ${source.y}, ${cp2x} ${target.y}, ${target.x} ${target.y}`;
      })
      .attr("fill", "none")
      .attr("stroke", (d: Link) =>
        d.groupId === -1
          ? individualHeadColorScale(d.head.toString())
          : groupColorScale(d.groupId.toString())
      )
      .attr("stroke-width", 4)
      .attr("opacity", 0.6)
      .on("mouseover", function() {
        d3.select(this)
          .attr("opacity", 1)
          .attr("stroke-width", 6);
      })
      .on("mouseout", function() {
        d3.select(this)
          .attr("opacity", 0.6)
          .attr("stroke-width", 4);
      });

    // Draw nodes as circles.
    g.selectAll("circle.node")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 6)
      .attr("fill", "#e5e7eb")
      .on("mouseover", function(event, d) {
        d3.select(this).attr("r", 8).attr("fill", "#d1d5db");
        // Show tooltip
        d3.select("#graph-tooltip")
          .style("display", "block")
          .html(`Layer ${d.layer}, Token ${d.token}`)
          .style("left", (event.pageX + 10) + "px")
          .style("top", (event.pageY - 10) + "px");
      })
      .on("mouseout", function(event, d) {
        d3.select(this).attr("r", 6).attr("fill", "#e5e7eb");
        d3.select("#graph-tooltip").style("display", "none");
      });

    // Draw legend for head groups and individual heads.
    const legend = svg.append("g")
      .attr("transform", `translate(${width - padding.right + 20}, ${padding.top})`);
    legend.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .attr("font-size", "14px")
      .attr("font-weight", "bold")
      .text("Legend");
    headGroups.forEach((group, i) => {
      const y = 30 + i * 25;
      legend.append("rect")
        .attr("x", 0)
        .attr("y", y)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", groupColorScale(group.id.toString()));
      legend.append("text")
        .attr("x", 25)
        .attr("y", y + 12)
        .attr("font-size", "12px")
        .text(group.name);
    });
    // Legend for individual heads.
    const sepY = 30 + headGroups.length * 25 + 10;
    legend.append("line")
      .attr("x1", 0)
      .attr("x2", legendWidth - padding.left)
      .attr("y1", sepY)
      .attr("y2", sepY)
      .attr("stroke", "#e5e7eb")
      .attr("stroke-width", 2);
    legend.append("text")
      .attr("x", 0)
      .attr("y", sepY + 25)
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text("Individual Heads");
    const visibleIndividualHeads = selectedHeads.filter(h =>
      !headGroups.some(g => g.heads.some(gh => gh.layer === h.layer && gh.head === h.head))
    );
    visibleIndividualHeads.forEach((head, i) => {
      const y = sepY + 40 + i * 25;
      legend.append("rect")
        .attr("x", 0)
        .attr("y", y)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", individualHeadColorScale(head.head.toString()));
      legend.append("text")
        .attr("x", 25)
        .attr("y", y + 12)
        .attr("font-size", "12px")
        .text(`Layer ${head.layer}, Head ${head.head}`);
    });

    // Ensure tooltip container exists.
    if (!document.getElementById("graph-tooltip")) {
      const tooltipDiv = document.createElement("div");
      tooltipDiv.id = "graph-tooltip";
      tooltipDiv.style.position = "absolute";
      tooltipDiv.style.background = "white";
      tooltipDiv.style.padding = "5px";
      tooltipDiv.style.border = "1px solid #ccc";
      tooltipDiv.style.borderRadius = "4px";
      tooltipDiv.style.fontSize = "12px";
      tooltipDiv.style.pointerEvents = "none";
      tooltipDiv.style.display = "none";
      document.body.appendChild(tooltipDiv);
    }
  }, [
    data, threshold, selectedHeads, headGroups, getHeadGroup, getVisibleHeads,
    graphDimensions, data.numLayers, data.numTokens, data.numHeads, data.tokens
  ]);

  useEffect(() => {
    if (!data.attentionPatterns.length) return;
    drawGraph();
  }, [data, threshold, selectedHeads, headGroups, drawGraph]);

  return (
    <div className="flex flex-col gap-4 p-4 max-w-[1200px] mx-auto">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <h2 className="text-white text-2xl font-medium-bold mb-3">Attention Flow Graph</h2>
          {backendAvailable === null ? (
            <div className="text-blue-500 text-sm">Checking backend availability...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {/* Controls Section */}
              <div className="grid grid-cols-2 gap-4">
                {/* Head Groups Control */}
                <div className="p-3 border rounded bg-gray-50">
                  <label className="text-sm font-medium">Head Groups</label>
                  <div className="space-y-2 mt-2 max-h-[200px] overflow-y-auto">
                    {headGroups.map(group => {
                      const predefinedGroup = predefinedGroups.find(g => g.name === group.name);
                      if (!predefinedGroup) return null;
                      return (
                        <div key={group.id} className="p-2 border rounded bg-white">
                          <div className="font-medium text-sm mb-2">{group.name}</div>
                          <div className="flex flex-wrap gap-1.5">
                            {predefinedGroup.vertices.map(([layer, head]) => (
                              <button
                                key={`${layer}-${head}`}
                                onClick={() => addHeadToGroup(layer, head, group.id)}
                                className="px-2 py-0.5 rounded text-xs transition-colors duration-200"
                                style={{
                                  backgroundColor: group.heads.some(h => h.layer === layer && h.head === head)
                                    ? d3.schemeTableau10[group.id % 10]
                                    : '#f3f4f6',
                                  color: group.heads.some(h => h.layer === layer && h.head === head)
                                    ? 'white'
                                    : '#374151'
                                }}
                              >
                                {layer},{head}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Individual Heads Control */}
                <div className="p-3 border rounded bg-gray-50">
                  <label className="text-sm font-medium">Individual Heads</label>
                  <div className="space-y-3 mt-2">
                    <div>
                      <div className="text-xs text-gray-600 mb-2">Selected heads:</div>
                      <div className="flex flex-wrap gap-1.5 min-h-[28px] p-2 bg-white rounded border">
                        {selectedHeads.map(({ layer, head }) => (
                          <button
                            key={`${layer}-${head}`}
                            onClick={() => removeHead(layer, head)}
                            className="px-2 py-0.5 rounded text-white text-xs hover:opacity-80"
                            style={{
                              backgroundColor: d3.schemePaired[head % 12]
                            }}
                          >
                            {layer},{head}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const input = e.currentTarget.querySelector('input') as HTMLInputElement;
                        handleHeadSelection(input.value);
                        input.value = '';
                      }}>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="flex-1 px-2 py-1.5 border rounded text-xs font-mono bg-white"
                            placeholder="layer,head (e.g. 0,1)"
                          />
                          <button
                            type="submit"
                            className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      </form>
                      {error && (
                        <div className="text-xs text-red-500 mt-1.5">{error}</div>
                      )}
                      <div className="text-xs text-gray-600 mt-1.5">
                        Valid: Layer (0-{data.numLayers - 1}), Head (0-{data.numHeads - 1})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Edge Threshold Control */}
              <div className="p-3 border rounded bg-gray-50">
                <label className="text-sm font-medium">Edge Weight Threshold</label>
                <div className="flex items-center gap-3 mt-2">
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={threshold} 
                    onChange={handleThresholdChange}
                    className="flex-1" 
                  />
                  <span className="text-xs font-mono w-12 text-right bg-white px-2 py-1 rounded border">
                    {threshold.toFixed(2)}
                  </span>
                </div>
              </div>
              {/* Text Input for Attention Data */}
              {backendAvailable && (
                <div className="p-3 border rounded bg-gray-50">
                  <label className="text-sm font-medium">Input Text</label>
                  <textarea
                    className="w-full p-2 border rounded mt-2 text-sm bg-white"
                    rows={2}
                    placeholder="Enter text to analyze attention patterns..."
                    onChange={(e) => debouncedFetchAttentionData(e.target.value)}
                    disabled={loading}
                    defaultValue="When Mary and John went to the store, John gave a drink to"
                  />
                  {loading && (
                    <div className="text-xs text-blue-500 mt-1.5">Loading attention patterns...</div>
                  )}
                  {error && (
                    <div className="text-xs text-red-500 mt-1.5">{error}</div>
                  )}
                </div>
              )}
              {!backendAvailable && (
                <div className="p-3 border rounded bg-yellow-50 text-xs">
                  <p className="text-yellow-800">
                    Backend is not available. Showing sample attention patterns.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {/* Graph Display */}
      {loading ? (
        <div className="flex justify-center items-center h-[700px] border rounded bg-gray-50">
          <div className="text-sm">Loading...</div>
        </div>
      ) : (
        <div className="border rounded bg-white overflow-hidden">
          <svg ref={svgRef} width={graphDimensions.width} height={graphDimensions.height}></svg>
        </div>
      )}
    </div>
  );
};

export default AttentionFlowGraph;
