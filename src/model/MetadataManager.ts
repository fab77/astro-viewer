import { ColumnType, MetadataColumn } from "./MetadataColumn.js"

export class MetadataManager {

    static STANDARD_SIZE: string = "STANDARD_SIZE"
    static STANDARD_HUE: string = "STANDARD_HUE"

    private _outlineColumnList: MetadataColumn[] = []
    private _raColumnList: MetadataColumn[] = []
    private _decColumnList: MetadataColumn[] = []
    private _shapeColumnList: MetadataColumn[] = []
    private _hueColumnList: MetadataColumn[] = []

    private _selectedOutlineColumn?: MetadataColumn
    private _selectedRaColumn?: MetadataColumn
    private _selectedDecColumn?: MetadataColumn
    private _selectedShapeColumn?: MetadataColumn
    private _selectedHueColumn?: MetadataColumn
    private _selectedNameColumn?: MetadataColumn

    private _columns: MetadataColumn[] = []

    constructor(metadataColumns: MetadataColumn[]) {
        metadataColumns.forEach(c => {
            if (c.columnType == ColumnType.NUMBER) {
                this.addHueColumn(c)
                this.addShapeColumn(c)
            }
            if (c.columnType == ColumnType.GEOM_RA) {
                this.addRaColumn(c)
            }
            if (c.columnType == ColumnType.GEOM_DEC) {
                this.addDecColumn(c)
            }
            if (c.columnType == ColumnType.GEOM_FOOTPRINT) {
                this.addOutlineColumn(c)
            }
            if (c.columnType == ColumnType.MAIN_NAME) {
                this._selectedNameColumn = c
            }

            this._columns.push(c)
        })

        // if (!this._selectedNameColumn) {
        //     throw new Error("No name column found")
        // }
    }

    addOutlineColumn(outlineColumn: MetadataColumn) {
        this._outlineColumnList.push(outlineColumn)
        this._selectedOutlineColumn = outlineColumn
    }

    addRaColumn(column: MetadataColumn) {
        this._selectedRaColumn = this._selectedRaColumn || column
        this._raColumnList.push(column)
    }

    addDecColumn(column: MetadataColumn) {
        this._selectedDecColumn = this._selectedDecColumn || column
        this._decColumnList.push(column)
    }

    addHueColumn(column: MetadataColumn) {
        this._hueColumnList.push(column)
    }

    addShapeColumn(column: MetadataColumn) {
        this._shapeColumnList.push(column)
    }

    get selectedRaColumn(): MetadataColumn | undefined {
        return this._selectedRaColumn
    }
    get selectedDecColumn(): MetadataColumn | undefined {
        return this._selectedDecColumn
    }
    get selectedHueColumn(): MetadataColumn | undefined {
        return this._selectedHueColumn
    }
    get selectedShapeColumn(): MetadataColumn | undefined {
        return this._selectedShapeColumn
    }
    get selectedOutlineColumn(): MetadataColumn | undefined {
        return this._selectedOutlineColumn
    }
    get selectedNameColumn(): MetadataColumn | undefined {
        return this._selectedNameColumn
    }
    get columns(): MetadataColumn[] {
        return this._columns
    }

    get raColumnList() {
        return this._raColumnList
    }
    get decColumnList() {
        return this._decColumnList
    }
    get outlineColumnList() {
        return this._outlineColumnList
    }
    get hueColumnList() {
        return this._hueColumnList
    }
    get shapeColumnList() {
        return this._shapeColumnList
    }

    set selectedRaColumn(columnName: string) {
        this._selectedRaColumn = this._raColumnList.find(c => c.name === columnName) || this._selectedRaColumn
    }
    set selectedDecColumn(columnName: string) {
        this._selectedDecColumn = this._decColumnList.find(c => c.name === columnName) || this._selectedDecColumn
    }
    set selectedHueColumn(columnName: string) {
        this._selectedHueColumn = this._hueColumnList.find(c => c.name === columnName)
    }
    set selectedShapeColumn(columnName: string) {
        this._selectedShapeColumn = this._shapeColumnList.find(c => c.name === columnName)
    }
    set selectedNameColumn(columnName: string) {
        this._selectedNameColumn = this._shapeColumnList.find(c => c.name === columnName)
    }

    resetShapeColumn() {
        this._selectedShapeColumn = undefined
    }

    resetHueColumn() {
        this._selectedHueColumn = undefined
    }


}