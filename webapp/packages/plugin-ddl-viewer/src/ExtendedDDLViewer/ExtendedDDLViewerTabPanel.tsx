/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useResource, useS } from '@cloudbeaver/core-blocks';
import {
  ConnectionDialectResource,
  ConnectionInfoActiveProjectKey,
  ConnectionInfoResource,
  createConnectionParam,
} from '@cloudbeaver/core-connections';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { useCodemirrorExtensions } from '@cloudbeaver/plugin-codemirror6';
import type { NavNodeTransformViewComponent } from '@cloudbeaver/plugin-navigation-tree';
import { SQLCodeEditorLoader, useSqlDialectExtension } from '@cloudbeaver/plugin-sql-editor-new';

import { DATA_CONTEXT_DDL_VIEWER_NODE } from '../DdlViewer/DATA_CONTEXT_DDL_VIEWER_NODE';
import { DATA_CONTEXT_DDL_VIEWER_VALUE } from '../DdlViewer/DATA_CONTEXT_DDL_VIEWER_VALUE';
import style from '../DdlViewer/DDLViewerTabPanel.module.css';
import { MENU_DDL_VIEWER_FOOTER } from '../DdlViewer/MENU_DDL_VIEWER_FOOTER';
import { ExtendedDDLResource } from './ExtendedDDLResource';

export const ExtendedDDLViewerTabPanel: NavNodeTransformViewComponent = observer(function ExtendedDDLViewerTabPanel({ nodeId, folderId }) {
  const styles = useS(style);
  const menu = useMenu({ menu: MENU_DDL_VIEWER_FOOTER });

  const extendedDDLResource = useResource(ExtendedDDLViewerTabPanel, ExtendedDDLResource, nodeId);

  const connectionInfoResource = useResource(ExtendedDDLViewerTabPanel, ConnectionInfoResource, ConnectionInfoActiveProjectKey);
  const connection = connectionInfoResource.resource.getConnectionForNode(nodeId);
  const connectionParam = connection ? createConnectionParam(connection) : null;
  const connectionDialectResource = useResource(ExtendedDDLViewerTabPanel, ConnectionDialectResource, connectionParam);
  const sqlDialect = useSqlDialectExtension(connectionDialectResource.data);
  const extensions = useCodemirrorExtensions();
  extensions.set(...sqlDialect);

  menu.context.set(DATA_CONTEXT_DDL_VIEWER_NODE, nodeId);
  menu.context.set(DATA_CONTEXT_DDL_VIEWER_VALUE, extendedDDLResource.data);

  return (
    <div className={s(styles, { wrapper: true })}>
      <SQLCodeEditorLoader
        className={s(styles, { sqlCodeEditorLoader: true })}
        value={extendedDDLResource.data ?? ''}
        extensions={extensions}
        readonly
      />
      <MenuBar className={s(styles, { menuBar: true })} menu={menu} />
    </div>
  );
});
