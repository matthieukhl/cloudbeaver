/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import type { Column } from 'react-data-grid';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { TextTools, uuid } from '@cloudbeaver/core-utils';
import { IDatabaseDataModel, IDatabaseResultSet, IResultSetRowKey, ResultSetDataAction, ResultSetDataKeysUtils, ResultSetEditAction, ResultSetFormatAction, ResultSetViewAction } from '@cloudbeaver/plugin-data-viewer';

import { IndexFormatter } from './Formatters/IndexFormatter';
import { TableColumnHeader } from './TableColumnHeader/TableColumnHeader';
import { TableIndexColumnHeader } from './TableColumnHeader/TableIndexColumnHeader';
import type { ITableData } from './TableDataContext';

export const indexColumn: Column<IResultSetRowKey, any> = {
  key: '#',
  columnDataIndex: null,
  name: '#',
  minWidth: 60,
  width: 60,
  resizable: false,
  frozen: true,
  headerRenderer: TableIndexColumnHeader,
  formatter: IndexFormatter,
};

export function useTableData(model: IDatabaseDataModel<any, IDatabaseResultSet>, resultIndex: number): ITableData {
  const format = model.source.getAction(resultIndex, ResultSetFormatAction);
  const data = model.source.getAction(resultIndex, ResultSetDataAction);
  const editor = model.source.getAction(resultIndex, ResultSetEditAction);
  const view = model.source.getAction(resultIndex, ResultSetViewAction);

  const props = useObjectRef({
    format,
    data,
    editor,
    view,
  },
  undefined,
  {
    format: observable.ref,
    data: observable.ref,
    editor: observable.ref,
    view: observable.ref,
  });

  return useObjectRef({
    get format() {
      return props.format;
    },
    get data() {
      return props.data;
    },
    get editor() {
      return props.editor;
    },
    get view() {
      return props.view;
    },
    get columnKeys() {
      return this.view.columnKeys;
    },
    get rows() {
      return this.view.rowKeys;
    },
    get columns() {
      if (this.columnKeys.length === 0) {
        return [];
      }
      const columnNames = this.format.getHeaders();
      const rowStrings = this.format.getLongestCells();

      // TODO: seems better to do not measure container size
      //       for detecting max columns size, better to use configurable variable
      const measuredCells = TextTools.getWidth({
        font: '400 14px Roboto',
        text: columnNames.map((cell, i) => {
          if (cell.length > (rowStrings[i] || '').length) {
            return cell;
          }
          return rowStrings[i];
        }),
      }).map(v => v + 16 + 32 + 20);

      const columns: Array<Column<IResultSetRowKey, any>> = this.columnKeys.map<Column<IResultSetRowKey, any>>(
        (col, index) => ({
          key: uuid(),
          columnDataIndex: { index },
          name: this.getColumnInfo(col)?.label || '?',
          editable: true,
          width: Math.min(300, measuredCells[index]),
          headerRenderer: TableColumnHeader,
        }));
      columns.unshift(indexColumn);

      return columns;
    },
    getRow(rowIndex) {
      return this.rows[rowIndex];
    },
    getColumn(columnIndex) {
      return this.columns[columnIndex];
    },
    getColumnByDataIndex(key) {
      return this.columns.find(column => (
        column.columnDataIndex !== null
        && ResultSetDataKeysUtils.isEqual(column.columnDataIndex, key)
      ))!;
    },
    getColumnInfo(key) {
      return this.data.getColumn(key);
    },
    getCellValue(key) {
      return this.view.getCellValue(key);
    },
    getColumnIndexFromKey(key) {
      return this.columns.findIndex(column => column.key === key);
    },
    getColumnIndexFromColumnKey(columnKey) {
      return this.columnKeys
        .findIndex(column => ResultSetDataKeysUtils.isEqual(columnKey, column));
    },
    getRowIndexFromKey(rowKey) {
      return this.rows.findIndex(row => ResultSetDataKeysUtils.isEqual(rowKey, row));
    },
    getColumnsInRange(startIndex, endIndex) {
      if (startIndex === endIndex) {
        return [this.columns[startIndex]];
      }

      const firstIndex = Math.min(startIndex, endIndex);
      const lastIndex = Math.max(startIndex, endIndex);
      return this.columns.slice(firstIndex, lastIndex + 1);
    },
    getEditionState(key) {
      return this.editor.getElementState(key);
    },
    isCellEdited(key) {
      return this.editor.isElementEdited(key);
    },
    isIndexColumn(columnKey) {
      return columnKey === indexColumn.key;
    },
    isIndexColumnInRange(columnsRange) {
      return columnsRange.some(column => this.isIndexColumn(column.key));
    },
    isReadOnly() {
      return this.columnKeys.every(column => this.getColumnInfo(column)?.readOnly);
    },
  }, null, {
    columns: computed,
    rows: computed,
    columnKeys: computed,
  });
}
