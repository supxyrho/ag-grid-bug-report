import { useState, useRef, useMemo, useCallback } from "react";

import { AgGridReact } from "ag-grid-react"; // React Data Grid Component

import {
  ClientSideRowModelModule,
  CheckboxEditorModule,
  ModuleRegistry,
  ValidationModule,
  themeQuartz,
} from "ag-grid-community";

import {
  AllEnterpriseModule,
  LicenseManager,
} from "ag-grid-enterprise";

import rowDataSource from './rowData.json'
ModuleRegistry.registerModules([AllEnterpriseModule]);
LicenseManager.setLicenseKey("<your license key>");

const themeOfFileExplorer = themeQuartz
    .withParams({
        fontFamily: 'JetBrains Mono',
        headerFontFamily: 'JetBrains Mono',
        cellFontFamily: 'JetBrains Mono',
        selectedRowBackgroundColor: 'rgba(0, 255, 0, 0.1)'
    })

function App() {
  const gridRef = useRef(null)

  
  const [rowData, setRowData] = useState(rowDataSource)

  const onHandleClickRow = (row) => {

  }

  const onHandleChangeSelectedRows = (selectedNodes) => {
      
  }

  return <AgGrid
    width="100%"
    height="100%"
    gridRef={gridRef}
    rowData={rowData}
    onHandleClickRow={onHandleClickRow}
    onHandleChangeSelectedRows={onHandleChangeSelectedRows}
  />
}

export default App;


const AgGrid = ({ width, height, gridRef, rowData, onHandleClickRow, onHandleChangeSelectedRows }) => {
  const [activeId, setActiveId] = useState(null)

  const headerHeihgt = 38
  const rowHeight = 24
  const treeDataChildrenField = 'subRows';
  const groupDisplayType = 'singleColumn';
  const containerStyle = {
      width,
      height 
  }

  const gridStyle = {
      margin: '0px auto',
      width,
      height: '100%'
  }

  const defaultColDef = {
      resizable: true,
      sortable: true,
      filter: true,
      flex: 1,
      minWidth: 100
  }

  const statusOptions = [
    {text: 'Not Generated', value: 'NOT GENERATED'},
    {text: 'Generated', value: 'GENERATED'},
    {text: 'Options Applied', value: 'OPTIONS APPLIED'},
    {text: 'Success', value: 'SUCCESS'}, 
    {text: 'Failed', value: 'FAILED'}, 
    {text: 'Crashed', value: 'CRASH'},
    {text: 'Driver Compile Failed', value: 'DRIVER COMPILE FAILED'},
    {text: 'Tc gen. failed with timeout', value: 'TIMEOUT REACHED'},
  ]

  const columnDefs = [
      {
          headerName: 'status',
          field: 'status',
          valueGetter: (row) => {
              return row.data?.status ?? ''
          },
          cellStyle: (params) => {
            return {color: params.value === 'CRASH' ? 'red' : 'black'}
          },
          filter: "agSetColumnFilter",
          filterParams: {
            values: statusOptions.map(option => option.value),
            valueFormatter: (params) => {
              const option = statusOptions.find(option => option.value === params.value);
              return option ? option.text : params.value;  
            },
            comparator: (a, b) => {
              const options = ['Not Generated', 'Generated', 'Options Applied', 'Success', 'Failed', 'Crashed', 'Driver Compile Failed', 'Tc gen. failed with timeout'];
              return options.indexOf(a) - options.indexOf(b);
            }
          },
          flex: 2,
          minWidth: 130,
      },
      {
        headerName: 'Array Length',
        field: 'arrayLength',
        filter: 'agNumberColumnFilter',
        valueGetter: (row) => {
            const value = row?.data?.harnessGeneratorInput?.arrayLength

            return !isNaN(value) ? value : ''
        },
        flex: 2,
        minWidth: 130,
        cellStyle: {textAlign: 'right'}
      },
      {
        headerName: 'StubReturnValueType',
        field: 'stubReturnValueType',
        filter: "agSetColumnFilter",
        filterParams: {
          values: ['Identicial-value', 'diversing-value', 'various-value'] 
        },
        valueGetter: (row) => {
            return row?.data?.harnessGeneratorInput?.stubType ?? ''
        },
        flex: 2,
        minWidth: 130
      },
      {
        headerName: 'SetStubParamAsSymVar',
        field: 'setStubParamAsSymVar',
        filter: "agSetColumnFilter",
        filterParams: {
          values: ['true', 'false'] 
        },
        valueGetter: (row) => {
            return row.data?.harnessGeneratorInput?.setStubParamAsSymVar ?? ''
        },
        flex: 2,
        minWidth: 130
      },
  ]

  const autoGroupColumnDef = useMemo(() => {
      return {
          headerName:'name',
          field: 'name',
          flex: 3,
          cellEditor: "agCheckboxCellEditor",
          cellRendererParams: {
            suppressCount: true,
          },
          minWidth: 600,
          cellStyle: {left: '28px' },
          headerStyle: { paddingLeft: '22px' }
      };
  }, []);

  const rowSelection = useMemo(() => {
    return { 
      mode: "multiRow", 
      headerCheckbox: true, 
      groupSelects: 'descendants' 
    };
  }, []);

  const onSelectionChanged = useCallback((event) => {
    const selectedNodes = gridRef.current.api.getSelectedNodes();
    onHandleChangeSelectedRows(selectedNodes);
  }, []);

  const makeFullPathByRowData = (node) => [node.location, node.fileName, node.name ].join('/').replace('.c/', '.')

  const sendToClipboard = (content) => {
    const textArea = document.createElement('textarea');
    textArea.value = content;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  return <div style={containerStyle}>
    <div style={gridStyle}>
      <AgGridReact
        ref={gridRef}
        treeData={true}
        defaultColDef={defaultColDef}
        columnDefs={columnDefs}
        theme={themeOfFileExplorer}
        rowData={rowData}
        treeDataChildrenField={treeDataChildrenField}
        rowHeight={rowHeight}
        headerHeight={headerHeihgt}
        autoGroupColumnDef={autoGroupColumnDef}
        groupDefaultExpanded={-1}
        groupDisplayType={groupDisplayType}
        rowSelection={rowSelection}
        getContextMenuItems={() => { return [] }}
        onSelectionChanged={onSelectionChanged}
        onRowClicked={(event) => { 
          process.env.__MODE__ === 'dev' && 
            sendToClipboard(makeFullPathByRowData(event.data))
          
          if(event.data.type === 'FUNCTION') {
            onHandleClickRow(event.data) 
            setActiveId(event.data.id)
          }
        }}
        getRowStyle={(params)=> {
          if(params.data.id === activeId) {
            return {backgroundColor: '#e1f5fe'}
          } else {
            return null
          }
        }}
      />
    </div>
  </div>
}