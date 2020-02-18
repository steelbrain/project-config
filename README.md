Project Config
==============

Project Config is an [Atom][atom] package that helps you maintain project-specific configurations.
You can commit such configurations in VCS and share them around in your teams.

### Installation

```
apm install project-config
```

### Usage

Project Config looks for `.atom/config.json` in the workspace, if you have added multiple paths to your Atom Project, it'll always use the first one. Any changes made to the configuration file are applied on the fly (within 5s).

Here's an example config file that enables format on save on `prettier-atom` inside a project:

```json
{
  "prettier-atom": {
    "formatOnSaveOptions": {
      "enabled": true
    }
  }
}
```

You can find the names and schema of configs of packages by opening up the Developer Console in Atom and doing `atom.config.get('package-slug')`.

### License

The contents of this package are licensed under the terms of the MIT License. See LICENSE file for more info.

[atom]: https://atom.io/
