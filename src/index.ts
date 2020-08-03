import { CompositeDisposable, Disposable } from 'atom'
import ProjectConfig from './ProjectConfig'

let subscriptions: CompositeDisposable | null = null

export function activate(): void {
  if (subscriptions) {
    subscriptions.dispose()
    subscriptions = null
  }

  let projectConfig: ProjectConfig | null
  const newSubscriptions = new CompositeDisposable()
  newSubscriptions.add(
    new Disposable(() => {
      if (projectConfig != null) {
        projectConfig.dispose()
        projectConfig = null
      }
    }),
  )

  let newPath: string | null = null
  function handleProjectPath(path: string | null | undefined) {
    if (path === newPath) {
      // Nothing has changed
      return
    }

    // Dispose of last project config
    if (projectConfig != null) {
      projectConfig.dispose()
      projectConfig = null
    }

    if (typeof path !== 'string') {
      return
    }
    newPath = path

    const newProjectConfig = new ProjectConfig(path)
    projectConfig = newProjectConfig

    newProjectConfig.activate().catch((error) => {
      console.log(`Error activating Project Config at ${path}`, {
        error,
      })
    })
  }

  newSubscriptions.add(
    atom.project.onDidChangePaths(([projectPath]) => {
      handleProjectPath(projectPath)
    }),
  )

  handleProjectPath(atom.project.getPaths()[0])

  subscriptions = newSubscriptions
}

export function deactivate(): void {
  if (subscriptions) {
    subscriptions.dispose()
  }
  subscriptions = null
}
