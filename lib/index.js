'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var atom$1 = require('atom');
var fs = _interopDefault(require('fs'));
var path = _interopDefault(require('path'));
var os = _interopDefault(require('os'));

const homeDirectory = os.homedir();

var tildify = absolutePath => {
	const normalizedPath = path.normalize(absolutePath) + path.sep;

	return (normalizedPath.indexOf(homeDirectory) === 0 ?
		normalizedPath.replace(homeDirectory + path.sep, `~${path.sep}`) :
		normalizedPath).slice(0, -1);
};

function fileRead(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', function (err, res) {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  });
}
function fileExists(filePath) {
  return new Promise(resolve => {
    fs.access(filePath, fs.constants.R_OK, err => {
      resolve(err === null);
    });
  });
}

const CONFIG_PATH = '.atom/config.json';

class ProjectConfig {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
    this.disposed = false;
    this.subscriptions = new atom$1.CompositeDisposable();
    this.configPath = path.join(rootDirectory, CONFIG_PATH);
  }

  async activate() {
    if (this.disposed) {
      throw new Error('Cannot activate a disposed ProjectConfig');
    }

    const config = await this.readConfig();

    if (config != null) {
      this.applyConfig(config);
    }

    const watcher = () => {
      console.log(`Config file updated at ${this.configPath}. Reloading.`);
      this.readConfig().then(newConfig => {
        this.applyConfig(newConfig || {});
      }).catch(error => {
        console.error(`Error reloading Config File at ${this.configPath}`, {
          error
        });
      });
    };

    fs.watchFile(this.configPath, {
      persistent: false,
      interval: 5000
    }, watcher);
    this.subscriptions.add(new atom$1.Disposable(() => {
      fs.unwatchFile(this.configPath, watcher);
    }));
  }

  applyConfig(config) {
    // @ts-ignore
    atom.project.replace({
      originPath: this.configPath,
      paths: atom.project.getPaths(),
      config
    });
  }

  async readConfig() {
    if (!(await fileExists(this.configPath))) {
      return null;
    }

    let rawContents;

    try {
      rawContents = await fileRead(this.configPath);
    } catch (_) {
      /* No Op */
      return null;
    } // Ignore "empty" file


    if (rawContents === '') {
      return {};
    }

    let contents;

    try {
      contents = JSON.parse(rawContents);

      if (typeof contents !== 'object' || contents == null) {
        throw new Error('JSON value is not an object');
      }
    } catch (error) {
      const message = 'Error reading Project Config file';
      const detail = `Malformed JSON found at ${CONFIG_PATH} in ${tildify(this.rootDirectory)}`;
      console.error(message, {
        detail,
        error
      });
      atom.notifications.addError(message, {
        detail,
        dismissable: true
      });
      return {};
    }

    return contents;
  }

  dispose() {
    this.disposed = true;
    this.subscriptions.dispose();
  }

}

let subscriptions = null;
function activate() {
  if (subscriptions) {
    subscriptions.dispose();
    subscriptions = null;
  }

  let projectConfig;
  const newSubscriptions = new atom$1.CompositeDisposable();
  newSubscriptions.add(new atom$1.Disposable(() => {
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
    const newProjectConfig = new ProjectConfig(path);
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

exports.activate = activate;
exports.deactivate = deactivate;
