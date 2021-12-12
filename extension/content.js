"use strict";
var helpers = {
    isSpace: function (char) {
        return /\s/.test(char);
    },
    isBlock: function (el) {
        if (el instanceof HTMLElement) {
            return ['block', 'flex'].indexOf(el.style.display) > -1;
        }
        return false;
    }
};
var App = (function () {
    function App() {
        var _this = this;
        this.win = window;
        window.onkeydown = function (e) {
            if (!e.altKey) {
                return;
            }
            var moveByWord = e.ctrlKey;
            switch (e.code) {
                case 'KeyI':
                    _this.moveUp();
                    break;
                case 'KeyK':
                    _this.moveDown();
                    break;
                case 'KeyJ':
                    _this.moveLeft(moveByWord);
                    break;
                case 'KeyL':
                    _this.moveRight(moveByWord);
                    break;
                case 'KeyA':
                    _this.moveToStartOfLine();
                    break;
                case 'KeyE':
                    _this.moveToEndOfLine();
                    break;
            }
        };
        console.log('ready');
    }
    App.prototype.moveToEndOfLine = function () {
        throw new Error("Method not implemented.");
    };
    App.prototype.moveToStartOfLine = function () {
        throw new Error("Method not implemented.");
    };
    App.prototype.moveUp = function () {
        this.moveCursorVertically(-1);
    };
    App.prototype.moveDown = function () {
        this.moveCursorVertically(1);
    };
    App.prototype.moveLeft = function (byWord) {
        this.moveCursorHorizontally(-1, byWord);
    };
    App.prototype.moveRight = function (byWord) {
        this.moveCursorHorizontally(1, byWord);
    };
    App.prototype.moveCursorVertically = function (direction) {
        console.log('move caret horizontally', direction);
    };
    App.prototype.moveCursorHorizontally = function (direction, byWord) {
        console.log('move caret horizontally', direction, byWord);
        var sel = this.win.getSelection();
        if (!sel || sel.rangeCount <= 0) {
            return;
        }
        var textNode = sel.focusNode;
        if (!(textNode instanceof Text)) {
            return;
        }
        if (direction == 1 && sel.focusOffset >= textNode.length) {
            this.moveToNextNode(sel, byWord);
            return;
        }
        if (direction == -1 && sel.focusOffset <= 0) {
            this.moveToPreviousNode(sel, byWord);
            return;
        }
        var offset = -1;
        if (byWord) {
            var text = textNode.nodeValue;
            var wordMarks = this.findWordMarks(text, direction);
            if (direction == 1) {
                for (var i = 0; i < wordMarks.length; i++) {
                    if (wordMarks[i] > sel.focusOffset) {
                        offset = wordMarks[i];
                        break;
                    }
                }
                if (offset == -1) {
                    offset = text.length;
                }
            }
            else {
                for (var i = wordMarks.length - 1; i >= 0; i--) {
                    if (wordMarks[i] < sel.focusOffset) {
                        offset = wordMarks[i];
                        break;
                    }
                }
                if (offset == -1) {
                    offset = 0;
                }
            }
        }
        else {
            offset = sel.focusOffset + direction;
        }
        sel.collapse(textNode, offset);
    };
    App.prototype.moveToPreviousNode = function (sel, byWord) {
        var focusNode = sel.focusNode;
        var sameLine = true;
        var node = null;
        $($(focusNode).parents().addBack().toArray().reverse()).each(function () {
            if (helpers.isBlock(this)) {
                sameLine = false;
            }
            if (this.previousSibling) {
                node = this.previousSibling;
                return false;
            }
        });
        if (!node) {
            return;
        }
        var text = node.nodeType == Node.TEXT_NODE ?
            node : $(node).find("*").addBack().contents().filter(function () {
            return this.nodeType == Node.TEXT_NODE && this.nodeValue.length > 0;
        }).last()[0];
        if (!text) {
            return;
        }
        sel.collapse(text, text.nodeValue.length);
        if (sameLine) {
            this.moveLeft(byWord);
        }
    };
    App.prototype.moveToNextNode = function (sel, byWord) {
        var focusNode = sel.focusNode;
        var sameLine = true;
        var node = null;
        $($(focusNode).parents().addBack().toArray().reverse()).each(function () {
            if (helpers.isBlock(this)) {
                sameLine = false;
            }
            if (this.nextSibling) {
                node = this.nextSibling;
                return false;
            }
        });
        if (!node) {
            return;
        }
        var text = node.nodeType == Node.TEXT_NODE ?
            node : $(node).find("*").addBack().contents().filter(function () {
            return this.nodeType == Node.TEXT_NODE && this.nodeValue.length > 0;
        })[0];
        if (!text) {
            return;
        }
        sel.collapse(text, 0);
        if (sameLine) {
            this.moveRight(byWord);
        }
    };
    App.prototype.findWordMarks = function (text, direction) {
        var wordMarks = [];
        var wordStarted = !helpers.isSpace(text[0]);
        for (var i = 0; i < text.length; i++) {
            var isSpace = helpers.isSpace(text[i]);
            if (wordStarted && isSpace) {
                wordStarted = false;
            }
            if (!wordStarted && !isSpace) {
                wordStarted = true;
                wordMarks.push(i);
            }
        }
        if (direction == 1 && wordMarks.length > 0 && helpers.isSpace(text[text.length - 1])) {
            wordMarks.push(/(\s+)$/.exec(text).index);
        }
        return wordMarks;
    };
    return App;
}());
new App();
