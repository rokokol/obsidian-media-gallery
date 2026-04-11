const renderError = (container: HTMLElement, error: string): void => {
  const wrapper = container.createEl('div')
  wrapper.addClass('media-gallery-error')

  const title = wrapper.createEl('div', { text: 'Media gallery error' })
  title.addClass('media-gallery-error-title')

  const description = wrapper.createEl('div', { text: error })
  description.addClass('media-gallery-error-message')
}

export default renderError
