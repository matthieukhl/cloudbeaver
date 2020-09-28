/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';

import { DataModelWrapper } from './TableViewer/DataModelWrapper';

export interface IDataPresentationProps {
  tableModel: DataModelWrapper;
  className?: string;
}

export type DataPresentationComponent = React.FunctionComponent<IDataPresentationProps>

export type DataPresentationOptions = {
  component: DataPresentationComponent;
}

@injectable()
export class DataPresentationService {
  get default(): DataPresentationOptions | undefined {
    return this.dataPresentations[0];
  }

  private dataPresentations: DataPresentationOptions[]

  constructor() {
    this.dataPresentations = [];
  }

  add(options: DataPresentationOptions) {
    this.dataPresentations.push(options);
  }
}
