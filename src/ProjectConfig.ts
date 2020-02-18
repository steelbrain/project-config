import fs from 'fs'
import sbFs from 'sb-fs'
import path from 'path'
import tildify from 'tildify'
import { CompositeDisposable, Disposable } from 'atom'

const CONFIG_PATH = '.atom/config.json'

class ProjectConfig {
  private disposed: boolean
  private subscriptions: CompositeDisposable
  private configPath: string
  public constructor(private rootDirectory: string) {
    this.disposed = false
    this.subscriptions = new CompositeDisposable()

    this.configPath = path.join(rootDirectory, CONFIG_PATH)
  }

  public async activate() {
    if (this.disposed) {
      throw new Error('Cannot activate a disposed ProjectConfig')
    }

    const config = await this.readConfig()
    if (config != null) {
      this.applyConfig(config)
    }

    const watcher = () => {
      console.log(`Config file updated at ${this.configPath}. Reloading.`)
      this.readConfig()
        .then(newConfig => {
          this.applyConfig(newConfig || {})
        })
        .catch(error => {
          console.error(`Error reloading Config File at ${this.configPath}`, { error })
        })
    }

    fs.watchFile(this.configPath, { persistent: false, interval: 5000 }, watcher)
    this.subscriptions.add(
      new Disposable(() => {
        fs.unwatchFile(this.configPath, watcher)
      }),
    )
  }

  private applyConfig(config: Record<string, any>) {
    // @ts-ignore
    atom.project.replace({
      originPath: this.configPath,
      paths: atom.project.getPaths(),
      config,
    })
  }

  private async readConfig(): Promise<null | Record<string, any>> {
    if (!(await sbFs.exists(this.configPath))) {
      return null
    }
    let rawContents
    try {
      rawContents = await sbFs.readFile(this.configPath, 'utf8')
    } catch (_) {
      /* No Op */
      return null
    }

    // Ignore "empty" file
    if (rawContents === '') {
      return {}
    }

    let contents
    try {
      contents = JSON.parse(rawContents)
    } catch (error) {
      const message = 'Error reading Project Config file'
      const detail = `Malformed JSON found at ${CONFIG_PATH} in ${tildify(this.rootDirectory)}`

      console.error(message, {
        detail,
        error,
      })

      atom.notifications.addError(message, {
        detail,
        dismissable: true,
      })

      return {}
    }

    return contents
  }

  public dispose() {
    this.disposed = true
    this.subscriptions.dispose()
  }
}

export default ProjectConfig
