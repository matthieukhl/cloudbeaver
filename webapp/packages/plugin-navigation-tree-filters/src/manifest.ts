/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

export const navigationTreeFiltersPlugin: PluginManifest = {
  info: {
    name: 'Navigation tree filters plugin',
  },

  providers: [
    () => import('./LocaleService').then(m => m.LocaleService),
    () => import('./NavigationTreeFiltersBootstrap').then(m => m.NavigationTreeFiltersBootstrap),
  ],
};
