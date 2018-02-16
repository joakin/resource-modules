import { Node } from "acorn";
import * as acorn from "acorn";
import * as acornWalk from "acorn/dist/walk";
import { Visitor, VisitorMap } from "acorn/dist/walk";
import {
  fileAnalysis,
  FileAnalysis,
  DisabledLines,
  State
} from "./visitors/types";

import { getSources, Sources } from "./fs";

export interface Analysis {
  files: { [file: string]: FileAnalysis };
}

export function analyzeFiles(
  dir: string,
  jsFiles: string[],
  visitors: VisitorMap<State>,
  noisy: boolean
): Promise<Analysis> {
  return getSources(dir, jsFiles).then((files: Sources) => {
    let analysis: Analysis = { files: {} };
    Object.keys(files).forEach(f => {
      analysis.files[f] = walk(visitors, files[f].source, f, noisy);
    });
    return analysis;
  });
}

export function parse(source: string): { ast: Node; disabled: DisabledLines } {
  const comments: acorn$Comment[] = [];
  const ast = acorn.parse(source, { locations: true, onComment: comments });
  return { ast, disabled: getDisabledLines(comments) };
}

export function walk(
  visitors: VisitorMap<State>,
  source: string,
  file: string,
  noisy: boolean = false
): FileAnalysis {
  try {
    const parsedData = parse(source);
    const state: State = {
      disabledLines: parsedData.disabled,
      file,
      data: fileAnalysis({ source }),
      analysisErrors: []
    };
    const disableableVisitors = mapVisitors(makeVisitorDisableable, visitors);
    acornWalk.ancestor(parsedData.ast, disableableVisitors, null, state);
    if (noisy) {
      state.analysisErrors.forEach(e => console.error(e));
    }
    return state.data;
  } catch (e) {
    throw new Error(`Failed to walk ${file}\n${e.message}`);
  }
}

function getDisabledLines(comments: acorn$Comment[]): DisabledLines {
  return comments.reduce((lines: DisabledLines, comment: acorn$Comment) => {
    if (comment.value.trim() === "resource-modules-disable-line" && comment.loc)
      lines.push({ start: comment.loc.start.line, end: comment.loc.end.line });
    return lines;
  }, []);
}

function mapVisitors(
  fn: (v: Visitor<State>) => Visitor<State>,
  visitors: VisitorMap<State>
): VisitorMap<State> {
  return Object.keys(visitors).reduce((vs: VisitorMap<State>, key: string) => {
    const visitor = visitors[key];
    vs[key] = fn(visitor);
    return vs;
  }, {});
}

function makeVisitorDisableable(visitor: Visitor<State>): Visitor<State> {
  return (node: Node, state: State, ancestors: Node[]): void => {
    if (isNodeInDisabledLine(node.loc, state.disabledLines)) return;
    visitor(node, state, ancestors);
  };
}

function isNodeInDisabledLine(
  loc: acorn$Location,
  disabledLines: DisabledLines
) {
  const line = loc.start.line;
  return disabledLines.some(({ start, end }) => line === start);
}
