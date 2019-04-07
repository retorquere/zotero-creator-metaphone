declare const Zotero: any
declare const doubleMetaphone: (string) => [string, string]

function makeGenerator(type) {
  const next = Zotero[`next${type}`].bind(Zotero)
  return function*() {
    let obj
    while (obj = next()) {
      yield obj
    }
  }
}

const getItems = makeGenerator('Item')

function quote(value) {
  if (typeof value === 'number') return `${value}`
  if (!value) return ''
  if (!value.match(/[,"]/)) return value
  return `"${value.replace(/"/g, '""')}"`
}

function doExport() {
  const metaphones: { [key: string]: [string, string]} = {}
  const primary: { [key: string]: number } = {}

  for (const item of getItems()) {
    if (!item.creators) continue

    const names = (item.creators || [])
      .map(creator => creator.name ? creator.name : [creator.lastName, creator.firstName].filter(name => name).join(', '))
      .filter(name => name)
    for (const name of names) {
      if (metaphones[name]) continue
      metaphones[name] = doubleMetaphone(name.toLowerCase())
      primary[metaphones[name][0]] = (primary[metaphones[name][0]] || 0) + 1
    }
  }

  Zotero.write('Name,Primary,Secondary\n')
  for (const [name, dm] of Object.entries(metaphones)) {
    if (primary[dm[0]] > 1) Zotero.write([name].concat(dm).map(quote).join(',') + '\n')
  }
}
