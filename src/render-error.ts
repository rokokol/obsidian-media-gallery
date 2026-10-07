const renderError = (container: HTMLElement, error: string): void => {
  const wrapper = container.createDiv()
  wrapper.addClass('media-gallery-error')

  const title = wrapper.createDiv({ text: 'Media gallery error' })
  title.addClass('media-gallery-error-title')

  const description = wrapper.createDiv({ text: error })
  description.addClass('media-gallery-error-message')
}

export default renderError
