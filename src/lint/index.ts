import { Analysis } from "../analyze";
import { Errors, Module } from "./types";
import { ResourceModules } from "../types";

import getMissingMessagesErrors from "./missing-messages";
import getMissingTemplatesErrors from "./missing-templates";
import getUnusedDefinesErrors from "./unused-defines";
import getDependenciesErrors from "./dependencies";
import getGlobalDependenciesErrors from "./global-dependencies";

export default function lint(
  analysis: Analysis,
  coreAnalysis: Analysis,
  resourceModules: ResourceModules
): Errors {
  const fullAnalysis: Analysis = [coreAnalysis, analysis].reduce(
    (all, ana) => ({
      files: Object.assign(all.files, ana.files)
    }),
    { files: {} }
  );

  // Match analysis info with extension.json info
  let errors: Errors = {
    skippedBecauseNotInResourceModules: [],
    files: {}
  };

  Object.keys(analysis.files).forEach((file: string) => {
    const inModules: Module[] = getResourceModulesWithFile(
      file,
      resourceModules
    );

    // Check that analysis data is included in resourceModules
    if (inModules.length < 1) {
      errors.skippedBecauseNotInResourceModules.push(file);
    } else {
      const ana = analysis.files[file];
      errors.files[file] = {
        missingMessages: getMissingMessagesErrors(
          ana,
          inModules,
          resourceModules
        ),
        missingTemplates: getMissingTemplatesErrors(
          ana,
          inModules,
          resourceModules
        ),
        unusedDefines: getUnusedDefinesErrors(ana, inModules, fullAnalysis),
        dependencies: getDependenciesErrors(
          ana,
          inModules,
          fullAnalysis,
          file,
          resourceModules
        ).concat(
          getGlobalDependenciesErrors(
            ana,
            inModules,
            fullAnalysis,
            file,
            resourceModules
          )
        )
      };
    }
  });

  return errors;
}

function getResourceModulesWithFile(
  file: string,
  resourceModules: ResourceModules
): Module[] {
  return Object.keys(resourceModules)
    .filter(
      (rk: string): boolean =>
        (resourceModules[rk].scripts || []).indexOf(file.replace(/^\//, "")) >
        -1
    )
    .map((rk: string): Module => [rk, resourceModules[rk]]);
}
