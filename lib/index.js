"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.activate = activate;
exports.deactivate = deactivate;

var _atom = require("atom");

var _ProjectConfig = _interopRequireDefault(require("./ProjectConfig"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

let subscriptions = null;

function activate() {
  if (subscriptions) {
    subscriptions.dispose();
    subscriptions = null;
  }

  let projectConfig;
  const newSubscriptions = new _atom.CompositeDisposable();
  newSubscriptions.add(new _atom.Disposable(() => {
    if (projectConfig != null) {
      projectConfig.dispose();
      projectConfig = null;
    }
  }));
  let newPath = null;

  function handleProjectPath(path) {
    if (path === newPath) {
      // Nothing has changed
      return;
    } // Dispose of last project config


    if (projectConfig != null) {
      projectConfig.dispose();
      projectConfig = null;
    }

    if (typeof path !== 'string') {
      return;
    }

    newPath = path;
    const newProjectConfig = new _ProjectConfig.default(path);
    projectConfig = newProjectConfig;
    newProjectConfig.activate().catch(error => {
      console.log(`Error activating Project Config at ${path}`, {
        error
      });
    });
  }

  newSubscriptions.add(atom.project.onDidChangePaths(([projectPath]) => {
    handleProjectPath(projectPath);
  }));
  handleProjectPath(atom.project.getPaths()[0]);
  subscriptions = newSubscriptions;
}

function deactivate() {
  if (subscriptions) {
    subscriptions.dispose();
  }

  subscriptions = null;
}