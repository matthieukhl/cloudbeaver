/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionInfoResource, ConnectionsManagerService, IConnectionExecutorData } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { INodeNavigationData, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';
import { resourceKeyList } from '@cloudbeaver/core-resource';
import { ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { DBObjectPageService, IObjectViewerTabState, isObjectViewerTab, ObjectPage, ObjectViewerTabService } from '@cloudbeaver/plugin-object-viewer';

import { DataViewerPanel } from './DataViewerPage/DataViewerPanel';
import { DataViewerTab } from './DataViewerPage/DataViewerTab';
import type { IDataViewerPageState } from './IDataViewerPageState';
import { TableViewerStorageService } from './TableViewer/TableViewerStorageService';

@injectable()
export class DataViewerTabService {
  readonly page: ObjectPage<IDataViewerPageState>;

  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly objectViewerTabService: ObjectViewerTabService,
    private readonly dbObjectPageService: DBObjectPageService,
    private readonly notificationService: NotificationService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly tableViewerStorageService: TableViewerStorageService,
  ) {
    this.page = this.dbObjectPageService.register({
      key: 'data_viewer_data',
      priority: 2,
      order: 2,
      getTabComponent: () => DataViewerTab,
      getPanelComponent: () => DataViewerPanel,
      onRestore: this.handleTabRestore.bind(this),
      canClose: this.handleTabCanClose.bind(this),
      onClose: this.handleTabClose.bind(this),
    });
  }

  register() {
    this.connectionsManagerService.onDisconnect.addHandler(this.disconnectHandler.bind(this));
  }

  registerTabHandler(): void {
    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  private async disconnectHandler(data: IConnectionExecutorData, contexts: IExecutionContextProvider<IConnectionExecutorData>) {
    const connectionsKey = resourceKeyList(data.connections);
    if (data.state === 'before') {
      const tabs = Array.from(
        this.navigationTabsService.findTabs(
          isObjectViewerTab(tab => {
            if (!tab.handlerState.connectionKey) {
              return false;
            }
            return this.connectionInfoResource.isIntersect(connectionsKey, tab.handlerState.connectionKey);
          }),
        ),
      );

      for (const tab of tabs) {
        const canDisconnect = await this.handleTabCanClose(tab);

        if (!canDisconnect) {
          ExecutorInterrupter.interrupt(contexts);
          return;
        }
      }
    }
  }

  private async navigationHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
    try {
      const { nodeInfo, tabInfo, initTab, trySwitchPage } = contexts.getContext(this.objectViewerTabService.objectViewerTabContext);

      const node = await this.navNodeManagerService.loadNode(nodeInfo);

      if (!this.navNodeManagerService.isNodeHasData(node)) {
        return;
      }

      await initTab();

      if (tabInfo.isNewlyCreated) {
        trySwitchPage(this.page);
      }
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Data Viewer Error', 'Error in Data Viewer while processing action with database node');
    }
  }

  private async handleTabRestore(tab: ITab<IObjectViewerTabState>) {
    return true;
  }

  private async handleTabCanClose(tab: ITab<IObjectViewerTabState>): Promise<boolean> {
    const model = this.tableViewerStorageService.get(tab.handlerState.tableId || '');

    if (model) {
      let canClose = false;
      try {
        await model.requestDataAction(() => {
          canClose = true;
        });
      } catch {}

      return canClose;
    }

    return true;
  }

  private async handleTabClose(tab: ITab<IObjectViewerTabState>) {
    const tableId = tab.handlerState.tableId;

    if (tableId) {
      const model = this.tableViewerStorageService.get(tableId);

      if (model) {
        this.tableViewerStorageService.remove(tableId);
        await model.dispose();
      }
    }
  }
}
