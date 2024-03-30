// FIXME: what is the type of `obj`?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extractObj(obj: any, path: string): any {
  const keys = path.split('.')
  let current = obj
  for (const key of keys) {
    if (current === undefined) {
      return undefined
    }
    current = current[key]
  }
  return current
}
