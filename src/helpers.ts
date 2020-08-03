import fs from 'fs'

export function fileRead(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', function(err, res) {
      if (err) {
        reject(err)
      } else {
        resolve(res)
      }
    })
  })
}

export function fileExists(filePath: string): Promise<boolean> {
  return new Promise(resolve => {
    fs.access(filePath, fs.constants.R_OK, err => {
      resolve(err === null)
    })
  })
}
