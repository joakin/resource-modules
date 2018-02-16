import * as fs from "fs";
import * as path from "path";
import readDir = require("recursive-readdir");

export function getJSFiles(
  dir: string,
  assetsFolder: string
): Promise<string[]> {
  return (
    getFiles(path.join(dir, assetsFolder))
      // Remove folder prefix and filter only JS files
      .then((files: string[]): string[] =>
        files.map(replace(dir + path.sep, "")).filter(isValidJSFile)
      )
  );
}

// Curried replace function
function replace(rpl: string, s: string) {
  return (str: string): string => str.replace(rpl, s);
}

const ignoreFiles = [/qunit/];

function isValidJSFile(name: string) {
  return (
    name.slice(name.length - 3) === ".js" &&
    name.indexOf("-skip.js") === -1 &&
    !ignoreFiles.some(r => r.test(name))
  );
}

export function getFiles(dir: string): Promise<string[]> {
  return new Promise((resolve, reject) =>
    readDir(dir, (err, files) => (err ? reject(err) : resolve(files)))
  );
}

interface Source {
  source: string;
}
export interface Sources {
  [key: string]: Source;
}

export function getSources(dir: string, files: string[]): Promise<Sources> {
  let mfiles: Sources = {};
  return Promise.all(
    files.map(f =>
      getSource(dir, f).then((source: string): void => {
        mfiles[f] = { source };
      })
    )
  ).then(() => mfiles);
}

export function getSource(folder: string, file: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const filePath = path.resolve(path.join(folder, file));
    fs.readFile(
      filePath,
      (err, contents) => (err ? reject(err) : resolve(contents.toString()))
    );
  });
}

export function getJSON(folder: string, file: string): Promise<Object> {
  return getSource(folder, file).then(contents => JSON.parse(contents));
}
