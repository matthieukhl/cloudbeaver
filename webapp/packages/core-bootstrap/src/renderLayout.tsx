/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Suspense } from 'react';
import { createRoot, Root } from 'react-dom/client';

import { BodyLazy } from '@cloudbeaver/core-app';
import { DisplayError, ErrorBoundary, Loader, s } from '@cloudbeaver/core-blocks';
import { AppContext, HideAppLoadingScreen, IServiceInjector } from '@cloudbeaver/core-di';

import styles from './renderLayout.module.css';

interface IRender {
  initRoot(): Root;
  renderApp(): void;
  renderError(exception?: any): void;
  unmount(): void;
}

export function renderLayout(serviceInjector: IServiceInjector): IRender {
  let root: Root | undefined;

  return {
    initRoot(): Root {
      this.unmount();
      let container = document.body.querySelector<HTMLDivElement>('div#root');
      if (!container) {
        container = document.createElement('div');
        container.id = 'root';

        document.body.prepend(container);
      }

      root = createRoot(container);

      return root;
    },
    unmount() {
      if (root) {
        root.unmount();
        root = undefined;
      }
    },
    renderApp() {
      this.initRoot().render(
        <ErrorBoundary fallback={<HideAppLoadingScreen />} simple>
          <AppContext app={serviceInjector}>
            <ErrorBoundary fallback={<HideAppLoadingScreen />} root>
              <Suspense fallback={<Loader className={s(styles, { loader: true })} />}>
                <BodyLazy />
                <HideAppLoadingScreen />
              </Suspense>
            </ErrorBoundary>
          </AppContext>
        </ErrorBoundary>,
      );
    },
    renderError(exception?: any) {
      if (exception) {
        console.error(exception);
      }
      this.initRoot().render(
        <ErrorBoundary fallback={<HideAppLoadingScreen />} simple>
          <AppContext app={serviceInjector}>
            <DisplayError error={exception} root />
            <HideAppLoadingScreen />
          </AppContext>
        </ErrorBoundary>,
      );
    },
  };
}
