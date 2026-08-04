// jsdom (the test DOM) doesn't implement `matchMedia`. ThemeService relies on
// it to read the OS color-scheme preference, so any test that constructs it
// (directly, or indirectly via Header/Shell) needs this polyfill.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
