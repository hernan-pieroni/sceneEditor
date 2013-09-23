var textures = '{"textures":[{"name":"Marmol"}, {"name":"Madera"}, {"name":"Metal"}, {"name":"Egypt"}, {"name":"Chess 1"}, {"name":"Chess2"}, {"name":"Thron 1"}, {"name":"Thron 2"}, {"name":"Thron 3"}]}';

var unitLength = 12;

var SIMPLE_EVENT_STRATEGY_ANIMATION = {
    mousedown: true,
    mouseover: false,
    mouseout: false
},
COMPLEX_EVENT_STRATEGY_ANIMATION = {
    mousedown: true,
    mouseover: true,
    mouseout: true
},
editionBoardDrawer;

var sceneObjects;
$(document).ready(function creteSceneObjectContainer() {
    sceneObjects = {
        collection: [],
        nextPosition: function () {
            return this.collection.length;
        },
        add: function (sceneObject) {
            this.collection[this.nextPosition()] = sceneObject;
        },
        remove: function (sceneObjectToRemove) {
            this.collection = _.reject(this.collection, function (sceneObject) {
                return sceneObject == sceneObjectToRemove;
            });
        },
		findSceneObject: function(initialRow, initialColumn){
			return _.find(this.collection, function(sceneObject){
				return sceneObject.initialRow == initialRow && sceneObject.initialColumn == initialColumn;
			});
		},
		removeOnPosition: function(initialRow, initialColumn) { 
			this.remove(this.findSceneObject(initialRow, initialColumn));
		},
        reset: function () {
            this.collection = [];
        },
        objectsToExportOnJSONFormat: function () {
            return _.map(this.collection, function (sceneObject) {
                return sceneObject.objectToExportForJSONFormat();
            });
        },
        objectsToExportOnXMLFormat: function () {
            return _.map(this.collection, function (sceneObject) {
                return sceneObject.objectToExportForXMLFormat();
            });
        }
    };
});

function toInt(aString){
	return parseInt(aString, 10);
};

var newElementContextMenuItemDisabled = true;
var initialAndFinalPositionContextMenuItemDisabled = false;


function initializeSceneEditor() {
    var rows = toInt($('#initialConfigurationRowField').val()),
        columns = ($('#initialConfigurationColumnField').val()),
        squareSideSize = 70,
        strokeWidth = 2;

    if (rows <= 0 || columns <= 0) {
        $.alert('Los campos: "Filas" y "columnas" deben ser mayores a 0', "Valores inválidos");
        return;
    }

    editionBoardDrawer = new EditionBoardDrawer('boardContainer', rows, columns, squareSideSize, strokeWidth);

    drawBoardIndexNumbers({
        elementId: "topBoardColumnIndexNumbersContainer",
        position: "top",
        repetitions: columns,
        indexSeparation: squareSideSize
    });

    drawBoardIndexNumbers({
        elementId: "leftBoardRowIndexNumbersContainer",
        position: "left",
        repetitions: rows,
        indexSeparation: squareSideSize
    });

    drawBoardIndexNumbers({
        elementId: "rightBoardRowIndexNumbersContainer",
        position: "right",
        repetitions: rows,
        indexSeparation: squareSideSize
    });

    drawBoardIndexNumbers({
        elementId: "bottomBoardColumnIndexNumbersContainer",
        position: "bottom",
        repetitions: columns,
        indexSeparation: squareSideSize
    });

    var boardEventHandler = new BoardEventHandler(editionBoardDrawer, COMPLEX_EVENT_STRATEGY_ANIMATION);

    document.initialConfigurationForm.initialConfigurationRowField.disabled = true;
    document.initialConfigurationForm.initialConfigurationColumnField.disabled = true;
    document.getElementById("initButton").disabled = true;
    document.getElementById("cleanButton").disabled = false;
}

function drawBoardIndexNumbers(drawingConfiguration) {
    var repetitions = drawingConfiguration.repetitions,
        indexSeparation = drawingConfiguration.indexSeparation,
        position = drawingConfiguration.position,
        canvas = document.createElement("canvas"),
        canvasContext = canvas.getContext("2d");

    if (position == "top" || position == "bottom") {
        canvas.height = 20;
        canvas.width = repetitions * indexSeparation;
        canvasContext.font = "20px Verdana open sans";
        canvasContext.fillStyle = "white";
        canvasContext.strokeStyle = "white";
        for (var columnIndex = 0; columnIndex < repetitions; columnIndex++) {
            canvasContext.strokeText(columnIndex, (columnIndex * indexSeparation) + (indexSeparation / 2), canvas.height);
        }
    } else if (position == "left" || position == "right") {
        canvas.height = repetitions * indexSeparation;
        canvas.width = 20;
        canvasContext.font = "20px Verdana open-sans";
        canvasContext.fillStyle = "white";
        canvasContext.strokeStyle = "white";
        for (var rowIndex = 0; rowIndex < repetitions; rowIndex++) {
            canvasContext.strokeText(rowIndex, 0, (rowIndex * indexSeparation) + (indexSeparation / 2));
        }
    }

    var boardIndexNumbersContainer = document.getElementById(drawingConfiguration.elementId);
    boardIndexNumbersContainer.appendChild(canvas);
}

function cleanSceneEditor() {
    var elementsToRemove = ["topBoardColumnIndexNumbersContainer", "leftBoardRowIndexNumbersContainer", "boardContainer", "rightBoardRowIndexNumbersContainer", "bottomBoardColumnIndexNumbersContainer"];

    sceneObjects.reset();
    _.each(elementsToRemove, function removeContentFrom(elementId) {
        document.getElementById(elementId).innerHTML = "";
    });

    //Eliminar objetos del escenario creados
    document.initialConfigurationForm.initialConfigurationRowField.disabled = false;
    document.initialConfigurationForm.initialConfigurationColumnField.disabled = false;
    document.getElementById("initButton").disabled = false;
    document.getElementById("cleanButton").disabled = true;

    newElementContextMenuItemDisabled = true;
    initialAndFinalPositionContextMenuItemDisabled = false;
}


function EditionBoardDrawer(container, rows, columns, squareSideSize, strokeWidth) {
    this.rows = rows;
    this.columns = columns;
    this.squareSideSize = squareSideSize,
    this.strokeWidth = strokeWidth;

    this.initialize = function (aContainer) {
        var findSquareFunction = function (rowIndex, columnIndex) {
            var squares = this.getChildren();
            return _.findWhere(squares, { 
                row: rowIndex,
                column: columnIndex
            });
        };
        this.initialLayer = new Kinetic.Layer();
        this.sceneObjectsLayer = new Kinetic.Layer();
        this.sceneObjectsLayer.findSquare = findSquareFunction;

        this.stage = new Kinetic.Stage({
            container: aContainer,
            width: this.columns * squareSideSize + 1,
            height: this.rows * squareSideSize + 1
        });

        this.drawInitialBoard();
        this.stage.add(this.initialLayer);
        this.stage.add(this.sceneObjectsLayer);
    };

    this.drawInitialBoard = function () {
        for (var rowIndex = 0; rowIndex < this.rows; rowIndex++) {
            this.drawInitialRow(rowIndex);
        }
    };

    this.drawInitialRow = function (row) {
        for (var column = 0; column < this.columns; column++) {
            this.drawInitialSquare(row, column);
        }
    };

    this.drawInitialSquare = function (rowIndex, columnIndex) {
        var square = new Kinetic.Rect({
            x: columnIndex * this.squareSideSize,
            y: rowIndex * this.squareSideSize,
            width: this.squareSideSize,
            height: this.squareSideSize,
            strokeWidth: this.strokeWidth,
            stroke: "grey"
        });

        this.initialLayer.add(square);
    };

    this.drawSceneObject = function (sceneObject) {
        // Crear un objeto que encapsule mis cuadrados 
        var group = new Kinetic.Group({
            x: sceneObject.initialColumn * this.squareSideSize,
            y: sceneObject.initialRow * this.squareSideSize,
        });
		group.row = sceneObject.initialRow;
		group.column = sceneObject.initialColumn;
		
        var text = new Kinetic.Text({
            text: sceneObject.labelForEditionBoard(),
            strokeWidth: 1,
            fill: 'black',
            fontSize: 12,
            fontFamily: 'Calibri',
            width: (sceneObject.targetColumn - sceneObject.initialColumn + 1) * this.squareSideSize,
            padding: 10,
            align: 'center'
        });

        var square = new Kinetic.Rect({
            name: 'rectangle',
            width: (sceneObject.targetColumn - sceneObject.initialColumn + 1) * this.squareSideSize,
            height: (sceneObject.targetRow - sceneObject.initialRow + 1) * this.squareSideSize,
            strokeWidth: this.strokeWidth,
            fill: sceneObject.sceneObjectColor
        });

        group.add(square);
        group.add(text);
        this.sceneObjectsLayer.add(group);
        this.initialLayer.draw();
        this.sceneObjectsLayer.draw();
    };

    this.removeSceneObjectOnPosition = function (rowIndex, columnIndex) {
        this.sceneObjectsLayer.findSquare(rowIndex, columnIndex).remove();
		this.sceneObjectsLayer.draw();
    };

    this.highlightRectangle = function (currentRectangle, strokeWidthFactor) {
        currentRectangle.setStrokeWidth(strokeWidthFactor * this.strokeWidth);
        this.sceneObjectsLayer.draw();
    };

    this.highlightSelectedSquare = function (selectedRectangle, previousSelectedRectangle, strokeWidthFactor) {
        this.highlightRectangle(previousSelectedRectangle, 1);
        this.highlightRectangle(selectedRectangle, strokeWidthFactor);
    };

    this.initialize(container);
}


function BoardEventHandler(aEditionBoardDrawer, eventsConfiguration) {
    this.editionBoardDrawer = aEditionBoardDrawer;
    this.previousSelectedRectangle = null;

    this.initialize = function (eventsConfiguration) {
        var eventsHandlingFunctions = {
            mousedown: this.handleMouseDown,
            mouseover: this.handleMouseOver,
            mouseout: this.handleMouseOut
        };

        for (var event in eventsHandlingFunctions) {
            if (eventsConfiguration[event]) {
                this.editionBoardDrawer.sceneObjectsLayer.on(event, _.bind(eventsHandlingFunctions[event], this));
            }
        }
    };

    this.handleMouseDown = function (event) {
        if (event.targetNode.getName() == 'rectangle') {
            if (this.previousSelectedRectangle === null) {
                this.previousSelectedRectangle = event.targetNode;
                this.editionBoardDrawer.highlightSelectedSquare(event.targetNode, this.previousSelectedRectangle, 3);
                this.previousSelectedRectangle = event.targetNode;
            }
        }
    };

    this.handleMouseOver = function (event) {
        if (event.targetNode.getName() == 'rectangle') {
            this.editionBoardDrawer.highlightRectangle(event.targetNode, 2);
        }
    };

    this.handleMouseOut = function (event) {
        if (event.targetNode.getName() == 'rectangle') {
            this.editionBoardDrawer.highlightRectangle(event.targetNode, 1);
        }
    };

    this.initialize(eventsConfiguration);
}

function generateJSONCodeToExport() {
    var scene = {
        escenario: sceneObjects.objectsToExportOnJSONFormat()
    };
    return JSON.stringify(scene, null, 2);
}

function generateXMLCodeToExport() {
    var scene = {
        elementoEscenario: sceneObjects.objectsToExportOnXMLFormat()
    };
    var xml = '<escenario>' + x2js.json2xml_str(scene) + '</escenario>';
    return formatXml(xml);
}

function displayGeneratedJSONCode() {
	if(document.getElementById('generatedJSONCodePreTag') != null){	
		document.getElementById('generatedJSONCode').removeChild(document.getElementById('generatedJSONCodePreTag'));
	}
    var pre = document.createElement('pre');
	pre.setAttribute('id', 'generatedJSONCodePreTag');
	pre.setAttribute('class', 'brush: js');
	document.getElementById('generatedJSONCode').appendChild(pre);
	$("#generatedJSONCodePreTag").html(generateJSONCodeToExport());
}

function displayGeneratedXMLCode() {
	if(document.getElementById('generatedXMLCodePreTag') != null){	
		document.getElementById('generatedXMLCode').removeChild(document.getElementById('generatedXMLCodePreTag'));
		}
	var pre = document.createElement('pre');
	pre.setAttribute('id', 'generatedXMLCodePreTag');
	pre.setAttribute('class', 'brush: xml');
	document.getElementById('generatedXMLCode').appendChild(pre);
	$("#generatedXMLCodePreTag").text(generateXMLCodeToExport());
    
}

function displayGeneratedCode() {
    displayGeneratedJSONCode();
    displayGeneratedXMLCode();
	SyntaxHighlighter.highlight();
}

function saveGeneratedSceneFile() {
    var filename = $("#scene-filename").val();
    var blob = new Blob([generateXMLCodeToExport()], {
        type: "application/xml;charset=utf-8"
    });

    if (filename === "") {
        $.alert("Se debe especificar un nombre de archivo", "Nombre de archivo inválido");
    } else {
        saveAs(blob, filename + ".xml");
    }
}


$.extend({
    alert: function (message, title) {
        $("<div></div>").dialog({
            buttons: {
                "Aceptar": function () {
                    $(this).dialog("close");
                }
            },
            close: function (event, ui) {
                $(this).remove();
            },
            resizable: false,
            title: title,
            modal: true
        }).text(message);
    }
});

$(function () {
    $("#tabs").tabs();
});


function openCreateElementForm() {
    initializeSceneObjectTypeForm();
    $("#newElement-form").dialog("open");
}

function openDeleteElementForm() {
    $(".validateTips").text("Todos los campos son requeridos.");
    $("#deleteElement-form").dialog("open");
}

function openInitialAndFinalPositionForm() {
    $(".validateTips").text("Todos los campos son requeridos.");
    $("#initialAndFinalPosition-form").dialog("open");
}

function resetEditionBoard() {
    newElementContextMenuItemDisabled = true;
    initialAndFinalPositionContextMenuItemDisabled = false;
    cleanSceneEditor();
    initializeSceneEditor();
}


$(document).ready(function initializeContextMenu() {
    $.contextMenu({
        selector: '.boardContainer',
        items: {
            "createNewElement": {
                name: "Nuevo elemento del escenario",
                disabled: function (key, opt) {
                    return newElementContextMenuItemDisabled;
                },
                icon: "add",
                accesskey: "N",
                callback: openCreateElementForm
            },
			"deleteElement": {
                name: "Borrar elemento del escenario",
                icon: "delete",
                accesskey: "B",
                callback: openDeleteElementForm
			},
            "InitialAndFinalPosition": {
                name: "Posición inicial y final",
                disabled: function (key, opt) {
                    return initialAndFinalPositionContextMenuItemDisabled;
                },
                icon: "edit",
                accesskey: "E",
                callback: openInitialAndFinalPositionForm
            },
            "reset": {
                name: "Borrar todo",
                icon: "cut",
                accesskey: "T",
                callback: resetEditionBoard
            },
            "sep1": "---------",
            "quit": {
                name: "Salir",
                icon: "quit",
                accesskey: "S",
                callback: function (key, options) {}
            }
        }
    });
});



function updateTips(errorDescription) {
    var tips = $(".validateTips");
    tips.text(errorDescription)
        .addClass("ui-state-highlight");
    setTimeout(function () {
        tips.removeClass("ui-state-highlight", 3000);
    }, 500);
}

function displayErrorMessageOnForm() {
    this.input.addClass("ui-state-error");
    updateTips(this.errorDescription);
}

function displayErrorMessageOnAlert() {
    $.alert(this.errorDescription, this.errorTitle);
}

function checkLengthMinMax(input, min, max) {
    if (toInt(input.val()) > max || toInt(input.val()) < min) {
        throw {
            input: input,
            errorDescription: "El Numero debe estar entre " + min + " y " + max + ".",
            handleError: displayErrorMessageOnForm
        };
    }
}

function checkLengthMin(input, min) {
    if (toInt(input.val()) < min) {
        throw {
            input: input,
            errorDescription: "El Numero debe mayor a " + min + ".",
            handleError: displayErrorMessageOnForm
        };
    }
}

function checkRegexp(input, regexp) {
    if (!(regexp.test(input.val()))) {
        throw {
            input: input,
            errorDescription: "El campo debe ser numerico",
            handleError: displayErrorMessageOnForm
        };
    }
}

function checkCorrectOrientation(initialRow, initialColumn, targetRow, targetColumn) {
    if (targetRow < initialRow || targetColumn < initialColumn) {
        throw {
            errorTitle: "Orientación incorrecta",
            errorDescription: "La orientación debe ser de izquierda a derecha y de arriba hacia abajo",
            handleError: displayErrorMessageOnAlert
        };
    }
}

function checkNumericFieldMinMax(numericInput, min, max) {
    checkLengthMinMax(numericInput, min, max);
    checkRegexp(numericInput, /^[0-9]+$/i);
}

function checkNumericFieldMin(numericInput, min) {
    checkLengthMin(numericInput, min);
    checkRegexp(numericInput, /^[0-9]+$/i);
}

function checkIntersectionWithOtherSceneObjects(initialRow, initialColumn, targetRow, targetColumn) {
    if (_.some(sceneObjects.collection, function (sceneObject) {
        return sceneObject.targetRow >= initialRow && sceneObject.initialRow <= targetRow && sceneObject.targetColumn >= initialColumn && sceneObject.initialColumn <= targetColumn;
    })) {
        throw {
            errorTitle: "Ubicación incorrecta",
            errorDescription: "El objeto que se desea ingresar intersecta con otros elementos del escenario",
            handleError: displayErrorMessageOnAlert
        };
    }
}


function objectToExportBase(initialRow, targetRow, initialColumn, targetColumn) {
    return {
        verticeSuperiorIzquierdo: {
            x: initialColumn * unitLength,
            y: initialRow * unitLength,
            z: 0
        },
        verticeSuperiorDerecho: {
            x: targetColumn * unitLength + unitLength,
            y: initialRow * unitLength,
            z: 0
        },
        verticeInferiorIzquierdo: {
            x: initialColumn * unitLength,
            y: targetRow * unitLength + unitLength,
            z: 0
        },
        verticeInferiorDerecho: {
            x: targetColumn * unitLength + unitLength,
            y: targetRow * unitLength + unitLength,
            z: 0
        }
    };
}


function obtainCoordenatesFromVertexBase(aVertexBase) {
    return aVertexBase.x + "," + aVertexBase.y + "," + aVertexBase.z;
}

function StartingGamePosition(startingGameColumn, startingGameRow, hightCubeField) {
    this.initialRow = startingGameRow;
    this.targetRow = startingGameRow;
    this.initialColumn = startingGameColumn;
    this.targetColumn = startingGameColumn;
    this.hightCubeField = hightCubeField;
	this.objectType = "inicio";
    this.sceneObjectColor = "#99FF99";

    this.labelForEditionBoard = function () {
        return "INICIO\nH: " + this.hightCubeField;
    };

    this.objectToExportForJSONFormat = function () {
        var object = {
            tipo: this.objectType,
			nombreMaterial: "Inicio",
            base: objectToExportBase(this.initialRow, this.initialRow, this.initialColumn, this.initialColumn),
            altura: this.hightCubeField
        };
        return object;
    };

    this.objectToExportForXMLFormat = function () {
        //Se crea el objeto que posteriormente se conviertirá automaticamente en xml
        var base = objectToExportBase(this.initialRow, this.targetRow, this.initialColumn, this.targetColumn);
        var object = {
            tipo: this.objectType,
			nombreMaterial: "Inicio",
            verticeSuperiorIzquierdo: obtainCoordenatesFromVertexBase(base.verticeSuperiorIzquierdo),
            verticeSuperiorDerecho: obtainCoordenatesFromVertexBase(base.verticeSuperiorDerecho),
            verticeInferiorIzquierdo: obtainCoordenatesFromVertexBase(base.verticeInferiorIzquierdo),
            verticeInferiorDerecho: obtainCoordenatesFromVertexBase(base.verticeInferiorDerecho),
            altura: this.hightCubeField
        };
        return object;
    };
}

function EndingGamePosition(endingGameColumn, endingGameRow, hightCubeField) {
    this.initialRow = endingGameRow;
    this.targetRow = endingGameRow;
    this.initialColumn = endingGameColumn;
    this.targetColumn = endingGameColumn;
    this.hightCubeField = hightCubeField;
	this.objectType = "fin";
    this.sceneObjectColor = "#CC3333";

    this.labelForEditionBoard = function () {
        return "FIN\nH: " + this.hightCubeField;
    };

    this.objectToExportForJSONFormat = function () {
        var object = {
            tipo: this.objectType,
			nombreMaterial: "Fin",
            base: objectToExportBase(this.initialRow, this.initialRow, this.initialColumn, this.initialColumn),
            altura: this.hightCubeField
        };
        return object;
    };

    this.objectToExportForXMLFormat = function () {
        //Se crea el objeto que posteriormente se conviertirá automaticamente en xml
        var base = objectToExportBase(this.initialRow, this.targetRow, this.initialColumn, this.targetColumn);
        var object = {
            tipo: this.objectType,
			nombreMaterial: "Fin",
            verticeSuperiorIzquierdo: obtainCoordenatesFromVertexBase(base.verticeSuperiorIzquierdo),
            verticeSuperiorDerecho: obtainCoordenatesFromVertexBase(base.verticeSuperiorDerecho),
            verticeInferiorIzquierdo: obtainCoordenatesFromVertexBase(base.verticeInferiorIzquierdo),
            verticeInferiorDerecho: obtainCoordenatesFromVertexBase(base.verticeInferiorDerecho),
            altura: this.hightCubeField
        };
        return object;
    };

}

$(document).ready(function initializeDeleteElementForm() {
	var startingDeleteColumnField = $("#startingDeleteColumnField"),
		startingDeleteRowField = $("#startingDeleteRowField"),
		allFields = $([]).add(startingDeleteColumnField).add(startingDeleteRowField);
	
	function checkElementToDelete(){
		var minRow = 0,
            minColumn = 0,
            maxRow = toInt($('#initialConfigurationRowField').val()) - 1,
            maxColumn = toInt($('#initialConfigurationColumnField').val()) - 1;

        allFields.removeClass("ui-state-error");
        checkNumericFieldMinMax(startingDeleteColumnField, minColumn, maxColumn);
        checkNumericFieldMinMax(startingDeleteRowField, minRow, maxRow);
		
		var elementToDelete = sceneObjects.findSceneObject(toInt(startingDeleteRowField.val()), toInt(startingDeleteColumnField.val()));
	   
		if (elementToDelete == null){
			throw {
                errorTitle: "Elemento inválido",
                errorDescription: "No existe ningún elemento en la posición indicada",
                handleError: displayErrorMessageOnAlert
            };
		}
		
		if(elementToDelete.objectType == "inicio" || elementToDelete.objectType == "fin"){
			throw {
				errorTitle: "Elemento inválido",
                errorDescription: "El inicio y fin del juego no se pueden borrar",
                handleError: displayErrorMessageOnAlert
            };
		}
    }
	
	function deleteSceneObject() {
		var startingDeleteRow = toInt(startingDeleteRowField.val()),
			startinhDeleteColumn = toInt(startingDeleteColumnField.val());
			
		sceneObjects.removeOnPosition(startingDeleteRow, startinhDeleteColumn);
		editionBoardDrawer.removeSceneObjectOnPosition(startingDeleteRow, startinhDeleteColumn);
	}

	$("#deleteElement-form").dialog({
		autoOpen: false,
        height: 300,
        width: 280,
        modal: true,
        buttons: {
            Aceptar: function () {
                try {
                    checkElementToDelete();
                    deleteSceneObject();
                    $(this).dialog("close");
                } catch (error) {
                    error.handleError();
                }
            },
            Cancelar: function () {
                $(this).dialog("close");
            }
        },
        close: function () {
            allFields.val("").removeClass("ui-state-error");
        }
	});
});

function createStartingAndEndingSceneObject() {
    var startingGameColumn = toInt($("#startingGameColumnField").val()),
        startingGameRow = toInt($("#startingGameRowField").val()),
        startingGameHight = toInt($("#hightCubeField-startingGame").val()),
        endingGameColumn = toInt($("#endingGameColumnField").val()),
        endingGameRow = toInt($("#endingGameRowField").val()),
        endingGameHight = toInt($("#hightCubeField-endingGame").val());

    var startingGamePosition = new StartingGamePosition(startingGameColumn, startingGameRow, startingGameHight);
    sceneObjects.add(startingGamePosition);
    editionBoardDrawer.drawSceneObject(startingGamePosition);

    var endingGamePosition = new EndingGamePosition(endingGameColumn, endingGameRow, endingGameHight);
    sceneObjects.add(endingGamePosition);
    editionBoardDrawer.drawSceneObject(endingGamePosition);
}

$(document).ready(function initializeStartingAndEndingGamePositionForm() {
    var startingGameColumnField = $("#startingGameColumnField"),
        startingGameRowField = $("#startingGameRowField"),
        startingGameHightField = $("#hightCubeField-startingGame"),
        endingGameColumnField = $("#endingGameColumnField"),
        endingGameRowField = $("#endingGameRowField"),
        endingGameHightField = $("#hightCubeField-endingGame"),
        allFields = $([]).add(startingGameColumnField).add(startingGameRowField).add(startingGameHightField).add(endingGameColumnField).add(endingGameRowField).add(endingGameHightField);

    function checkInitialAndFinalPositionFields(input) {
        var minRow = 0,
            minColumn = 0,
            maxRow = toInt($('#initialConfigurationRowField').val()) - 1,
            maxColumn = toInt($('#initialConfigurationColumnField').val()) - 1;

        allFields.removeClass("ui-state-error");
        checkNumericFieldMinMax(startingGameColumnField, minColumn, maxColumn);
        checkNumericFieldMinMax(startingGameRowField, minRow, maxRow);
        checkNumericFieldMin(startingGameHightField, 1);
        checkNumericFieldMinMax(endingGameColumnField, minColumn, maxColumn);
        checkNumericFieldMinMax(endingGameRowField, minRow, maxRow);
        checkNumericFieldMin(endingGameHightField, 1);
        checkIntersectionWithOtherSceneObjects(toInt(startingGameRowField.val()), toInt(startingGameColumnField.val()), toInt(startingGameRowField.val()), toInt(startingGameColumnField.val()));
        checkIntersectionWithOtherSceneObjects(toInt(endingGameRowField.val()), toInt(endingGameColumnField.val()), toInt(endingGameRowField.val()), toInt(endingGameColumnField.val()));

        if (startingGameColumnField.val() == endingGameColumnField.val() && startingGameRowField.val() == endingGameRowField.val()) {
            throw {
                errorTitle: "Posiciones iguales",
                errorDescription: "El inicio y fin del juego no pueden ser el mismo",
                handleError: displayErrorMessageOnAlert
            };
        }
    }

    $("#initialAndFinalPosition-form").dialog({
        autoOpen: false,
        height: 500,
        width: 280,
        modal: true,
        buttons: {
            Aceptar: function () {
                try {
                    checkInitialAndFinalPositionFields();
                    createStartingAndEndingSceneObject();
                    $(this).dialog("close");
                    initialAndFinalPositionContextMenuItemDisabled = true;
                    newElementContextMenuItemDisabled = false;
                } catch (error) {
                    error.handleError();
                }
            },
            Cancelar: function () {
                $(this).dialog("close");
            }
        },
        close: function () {
            allFields.val("").removeClass("ui-state-error");
        }
    });
});


function initializeSceneObjectTypeForm() {
    $(".validateTips").text("Todos los campos son requeridos.");
    $("#objectSceneTypeRadioButtons").buttonset();
    $("#rampOrientationRadioButtons").buttonset();

    $("input[name$='sceneObjectType']").click(function () {
        var value = $(this).val();
        if (value == 'rectType') {
            $("#rectForm").show();
            $("#rampForm").hide();
        } else if (value == 'rampType') {
            $("#rampForm").show();
            $("#rectForm").hide();
        }
    });
    $("#cubeForm").show();
    $("#rampForm").hide();
}

function createSceneObject() {
    var sceneObjectType = $("input:radio[name=sceneObjectType]:checked").val(),
        initialRow = toInt($("#initialRowField").val()),
        initialColumn = toInt($("#initialColumnField").val()),
        targetRow = toInt($("#targetRowField").val()),
        targetColumn = toInt($("#targetColumnField").val()),
        textures = $("#selectingTexture")[0],
        selectedTexture = textures.options[textures.selectedIndex].text,
        sceneObject;

    if (sceneObjectType == 'rectType') {
        var hightCubeField = toInt($("#hightCubeField").val());
		var enemySphere = $('#bolaEnemigaCheckBox').prop('checked');
        sceneObject = new Rect(initialRow, targetRow, initialColumn, targetColumn, hightCubeField, selectedTexture, enemySphere);
    } else if (sceneObjectType == 'rampType') {
        var minHightRampField = toInt($("#minHightRampField").val()),
            maxHightRampField = toInt($("#maxHightRampField").val()),
            rampOrientation = $("input:radio[name=rampOrientation]:checked").val();
        sceneObject = new Ramp(initialRow, targetRow, initialColumn, targetColumn, minHightRampField, maxHightRampField, rampOrientation, selectedTexture);
    }
    sceneObjects.add(sceneObject);
    editionBoardDrawer.drawSceneObject(sceneObject);
}


function Rect(initialRow, targetRow, initialColumn, targetColumn, hightCube, texture, enemySphere) {
    this.initialRow = initialRow;
    this.targetRow = targetRow;
    this.initialColumn = initialColumn;
    this.targetColumn = targetColumn;
    this.hightCube = hightCube;
    this.texture = texture;
	this.enemySphere = enemySphere;
	this.objectType = "cubo";
    this.sceneObjectColor = "#B9D3EE";

    this.labelForEditionBoard = function () {
        var enemySphereLabel;
		if(this.enemySphere){
			enemySphereLabel = "(BE)";
		}
		else {
			enemySphereLabel = "";
		}
		return "CUBO\nH: " + this.hightCube + "\n" + this.texture + "\n" + enemySphereLabel;
    };

    this.objectToExportForJSONFormat = function () {
        var object = {
            tipo: this.objectType,
            nombreMaterial: this.texture,
            base: objectToExportBase(this.initialRow, this.targetRow, this.initialColumn, this.targetColumn),
            altura: this.hightCube,
			bolaEnemiga: this.enemySphere
        };
        return object;
    };

    this.objectToExportForXMLFormat = function () {
        //Se crea el objeto que posteriormente se conviertirá automaticamente en xml
        var base = objectToExportBase(this.initialRow, this.targetRow, this.initialColumn, this.targetColumn);
        var object = {
            tipo: this.objectType,
            nombreMaterial: this.texture,
            verticeSuperiorIzquierdo: obtainCoordenatesFromVertexBase(base.verticeSuperiorIzquierdo),
            verticeSuperiorDerecho: obtainCoordenatesFromVertexBase(base.verticeSuperiorDerecho),
            verticeInferiorIzquierdo: obtainCoordenatesFromVertexBase(base.verticeInferiorIzquierdo),
            verticeInferiorDerecho: obtainCoordenatesFromVertexBase(base.verticeInferiorDerecho),
            altura: this.hightCube,
			bolaEnemiga: this.enemySphere
        };
        return object;
    };
}

function Ramp(initialRow, targetRow, initialColumn, targetColumn, minHightRamp, maxHightRamp, rampOrientation, texture) {
    this.initialRow = initialRow;
    this.targetRow = targetRow;
    this.initialColumn = initialColumn;
    this.targetColumn = targetColumn;
    this.minHightRamp = minHightRamp;
    this.maxHightRamp = maxHightRamp;
    this.rampOrientation = rampOrientation;
    this.texture = texture;
	this.objectType = "rampa";
    this.sceneObjectColor = "#FAFAD2";

    this.rampOrientationLabel = function () {
        var orientation;
        switch (this.rampOrientation) {
            case "descendingRight":
                orientation = "►";
                break;
            case "descendingDown":
                orientation = "▼";
                break;
            case "descendingLeft":
                orientation = "◄";
                break;
            case "descendingUp":
                orientation = "▲";
                break;
            default:
                orientation = "?";
        }
        return orientation;
    };

    this.labelForEditionBoard = function () {
        return "RAMPA" + "\n" + this.rampOrientationLabel() + "\nHm: " + this.minHightRamp + "\nHM: " + this.maxHightRamp + "\n" + this.texture;
    };

    this.objectToExportForJSONFormat = function () {
        var object = {
            tipo: this.objectType,
            orientacionDescenso: this.rampOrientation,
            nombreMaterial: this.texture,
            base: objectToExportBase(this.initialRow, this.targetRow, this.initialColumn, this.targetColumn),
            alturaMinima: this.minHightRamp,
            alturaMaxima: this.maxHightRamp
        };
        return object;
    };

    this.objectToExportForXMLFormat = function () {
        //Se crea el objeto que posteriormente se conviertirá automaticamente en xml
        var base = objectToExportBase(this.initialRow, this.targetRow, this.initialColumn, this.targetColumn);
        var object = {
            tipo: this.objectType,
            nombreMaterial: this.texture,
            orientacionDescenso: this.rampOrientation,
            verticeSuperiorIzquierdo: obtainCoordenatesFromVertexBase(base.verticeSuperiorIzquierdo),
            verticeSuperiorDerecho: obtainCoordenatesFromVertexBase(base.verticeSuperiorDerecho),
            verticeInferiorIzquierdo: obtainCoordenatesFromVertexBase(base.verticeInferiorIzquierdo),
            verticeInferiorDerecho: obtainCoordenatesFromVertexBase(base.verticeInferiorDerecho),
            altura: this.minHightRamp,
            alturaMaxima: this.maxHightRamp
        };
        return object;
    };
}

$(document).ready(function initializeNewSceneElementForm() {
    var initialRowField = $("#initialRowField"),
        initialColumnField = $("#initialColumnField"),
        targetRowField = $("#targetRowField"),
        targetColumnField = $("#targetColumnField"),
        hightCubeField = $("#hightCubeField"),
        minHightRampField = $("#minHightRampField"),
        maxHightRampField = $("#maxHightRampField"),
        allFields = $([]).add(initialRowField).add(initialColumnField).add(targetRowField).add(targetColumnField).add(hightCubeField).add(minHightRampField).add(maxHightRampField);

	var textureObjects = JSON.parse(textures);
    var selectingTexture = $("#selectingTexture")[0];

    for (var index = 0; index < textureObjects.textures.length; index++) {
        var texture = textureObjects.textures[index];
        selectingTexture.options.add(new Option(texture.name));
    }


    function checkNewElementFormFields(input) {
        var minRow = 0,
            minColumn = 0,
            maxRow = toInt($('#initialConfigurationRowField').val()) - 1,
            maxColumn = toInt($('#initialConfigurationColumnField').val()) - 1;

        allFields.removeClass("ui-state-error");
        checkNumericFieldMinMax(initialColumnField, minColumn, maxColumn);
        checkNumericFieldMinMax(initialRowField, minRow, maxRow);
        checkNumericFieldMinMax(targetColumnField, minColumn, maxColumn);
        checkNumericFieldMinMax(targetRowField, minRow, maxRow);
        checkCorrectOrientation(toInt(initialRowField.val()), toInt(initialColumnField.val()), toInt(targetRowField.val()), toInt(targetColumnField.val()));
        checkIntersectionWithOtherSceneObjects(toInt(initialRowField.val()), toInt(initialColumnField.val()), toInt(targetRowField.val()), toInt(targetColumnField.val()));

        if ($('#rectForm').is(":visible")) {
            checkNumericFieldMin(hightCubeField, 1);
        } else if ($('#rampForm').is(":visible")) {
            checkNumericFieldMin(minHightRampField, 1);
            checkNumericFieldMin(maxHightRampField, 1);
        }
    }

    $("#newElement-form").dialog({
        autoOpen: false,
        height: 600,
        width: 280,
        modal: true,
        buttons: {
            Aceptar: function () {
                try {
                    checkNewElementFormFields();
                    createSceneObject();
                    $(this).dialog("close");
                } catch (error) {
                    error.handleError();
                }
            },
            Cancelar: function () {
                $(this).dialog("close");
            }
        },
        close: function () {
            allFields.val("").removeClass("ui-state-error");
        }
    });
});

function formatXml(xml) {
    var formatted = '';
    var reg = /(>)(<)(\/*)/g;
    xml = xml.replace(reg, '$1\r\n$2$3');
    var pad = 0;
    jQuery.each(xml.split('\r\n'), function (index, node) {
        var indent = 0;
        if (node.match(/.+<\/\w[^>]*>$/)) {
            indent = 0;
        } else if (node.match(/^<\/\w/)) {
            if (pad != 0) {
                pad -= 1;
            }
        } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
            indent = 1;
        } else {
            indent = 0;
        }

        var padding = '';
        for (var i = 0; i < pad; i++) {
            padding += '  ';
        }

        formatted += padding + node + '\r\n';
        pad += indent;
    });

    return formatted;
}