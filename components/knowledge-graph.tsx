"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { motion } from "framer-motion";
import { Loader2, RefreshCw, Network } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { GraphData, GraphNode, GraphLink } from "@/types";

interface SimNode extends GraphNode, d3.SimulationNodeDatum {}
interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  similarity: number;
}

const COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
  "#f97316",
  "#06b6d4",
];

export function KnowledgeGraph() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/graph");
      if (!response.ok) throw new Error("Failed to load graph");
      const data = await response.json();
      setGraphData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  useEffect(() => {
    if (!graphData || !svgRef.current || graphData.nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const nodes: SimNode[] = graphData.nodes.map((n) => ({ ...n }));
    const links: SimLink[] = graphData.links.map((l) => ({
      source: l.source,
      target: l.target,
      similarity: l.similarity,
    }));

    // Create container with zoom
    const g = svg.append("g");
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => g.attr("transform", event.transform));
    svg.call(zoom);

    // Force simulation
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance((d) => 120 - d.similarity * 60)
      )
      .force("charge", d3.forceManyBody().strength(-200))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide().radius((d) => (d as SimNode).size + 5)
      );

    // Draw links
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#6366f1")
      .attr("stroke-opacity", (d) => d.similarity * 0.4)
      .attr("stroke-width", (d) => d.similarity * 3);

    // Draw nodes with glow effect
    const defs = svg.append("defs");
    COLORS.forEach((color, i) => {
      const filter = defs
        .append("filter")
        .attr("id", `glow-${i}`)
        .attr("x", "-50%")
        .attr("y", "-50%")
        .attr("width", "200%")
        .attr("height", "200%");
      filter
        .append("feGaussianBlur")
        .attr("stdDeviation", 3)
        .attr("result", "coloredBlur");
      const feMerge = filter.append("feMerge");
      feMerge.append("feMergeNode").attr("in", "coloredBlur");
      feMerge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    const node = g
      .append("g")
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => d.size)
      .attr("fill", (d) => COLORS[d.group % COLORS.length])
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .attr("filter", (d) => `url(#glow-${d.group % COLORS.length})`)
      .attr("opacity", 0.9)
      .on("mouseover", function (_, d) {
        d3.select(this).attr("opacity", 1).attr("stroke-width", 3);
        setHoveredNode(d);
      })
      .on("mouseout", function () {
        d3.select(this).attr("opacity", 0.9).attr("stroke-width", 2);
        setHoveredNode(null);
      });

    // Labels for document nodes
    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes.filter((n) => n.type === "document"))
      .join("text")
      .text((d) =>
        d.label.length > 25 ? d.label.slice(0, 25) + "..." : d.label
      )
      .attr("font-size", 11)
      .attr("font-weight", 500)
      .attr("dx", (d) => d.size + 6)
      .attr("dy", 4)
      .attr("fill", "currentColor")
      .attr("opacity", 0.8);

    // Drag behavior
    const drag = d3
      .drag<SVGCircleElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(drag);

    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as SimNode).x!)
        .attr("y1", (d) => (d.source as SimNode).y!)
        .attr("x2", (d) => (d.target as SimNode).x!)
        .attr("y2", (d) => (d.target as SimNode).y!);

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!);
      label.attr("x", (d) => d.x!).attr("y", (d) => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [graphData]);

  if (loading) {
    return (
      <Card className="flex items-center justify-center h-[350px] sm:h-[500px] border-border/50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
          <p className="text-sm text-muted-foreground">Loading graph...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="flex flex-col items-center justify-center h-[350px] sm:h-[500px] gap-3 border-border/50">
        <p className="text-muted-foreground">{error}</p>
        <Button
          variant="outline"
          onClick={fetchGraph}
          className="gap-2 rounded-xl"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </Card>
    );
  }

  if (!graphData || graphData.nodes.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center h-[350px] sm:h-[500px] border-border/50">
        <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 p-5 mb-4">
          <Network className="h-8 w-8 text-primary/50" />
        </div>
        <p className="text-muted-foreground font-medium">
          Upload documents to see the knowledge graph
        </p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Connections between documents will appear here
        </p>
      </Card>
    );
  }

  return (
    <Card
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl border-border/50"
    >
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchGraph}
          className="gap-1.5 rounded-xl bg-background/80 backdrop-blur-sm"
        >
          <RefreshCw className="h-3 w-3" />
          <span className="hidden sm:inline">Refresh</span>
        </Button>
      </div>

      <svg
        ref={svgRef}
        className="w-full h-[350px] sm:h-[500px]"
        style={{ background: "transparent" }}
      />

      {hoveredNode && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 left-3 right-3"
        >
          <Card className="p-3 bg-background/90 backdrop-blur-md border-border/50 shadow-lg">
            <p className="text-sm font-semibold">{hoveredNode.label}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {hoveredNode.type}
            </p>
          </Card>
        </motion.div>
      )}
    </Card>
  );
}
