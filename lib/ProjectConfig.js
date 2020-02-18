"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _sbFs = _interopRequireDefault(require("sb-fs"));

var _path = _interopRequireDefault(require("path"));

var _tildify = _interopRequireDefault(require("tildify"));

var _atom = require("atom");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const CONFIG_PATH = '.atom/config.json';

class ProjectConfig {
  constructor(rootDirectory) {
    this.rootDirectory = rootDirectory;
    this.disposed = false;
    this.subscriptions = new _atom.CompositeDisposable();
    this.configPath = _path.default.join(rootDirectory, CONFIG_PATH);
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

    _fs.default.watchFile(this.configPath, {
      persistent: false,
      interval: 5000
    }, watcher);

    this.subscriptions.add(new _atom.Disposable(() => {
      _fs.default.unwatchFile(this.configPath, watcher);
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
    if (!(await _sbFs.default.exists(this.configPath))) {
      return null;
    }

    let rawContents;

    try {
      rawContents = await _sbFs.default.readFile(this.configPath, 'utf8');
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
      const detail = `Malformed JSON found at ${CONFIG_PATH} in ${(0, _tildify.default)(this.rootDirectory)}`;
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

var _default = ProjectConfig;
exports.default = _default;