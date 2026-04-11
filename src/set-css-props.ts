type CssValue = string | number | null | undefined

const setCssProps = (element: HTMLElement, props: Record<string, CssValue>) => {
  Object.entries(props).forEach(([name, value]) => {
    if (value === null || value === undefined) {
      element.style.removeProperty(name)
      return
    }

    element.style.setProperty(name, String(value))
  })
}

export default setCssProps
