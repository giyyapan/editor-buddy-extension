"use strict";
var CONTENTEDITABLE_SELECTOR = '[contenteditable=true]';
var helpers = {
    isSpace: function (char) {
        return /\s/.test(char);
    },
    isBlock: function (el) {
        if (el instanceof HTMLElement) {
            return ['block', 'flex'].indexOf(el.style.display) > -1;
        }
        return false;
    },
    findSelectableInNode: function (node) {
        var contentEditableList = [];
        var res = node.nodeType == Node.TEXT_NODE ?
            $(node) : $(node).find("*").addBack().contents().filter(function () {
            if (this.isContentEditable) {
                contentEditableList.push(this);
            }
            return this.nodeType == Node.TEXT_NODE;
        });
        if (res.length == 0) {
            return $(contentEditableList);
        }
        return res;
    },
    eachSelfAndParents: function (node, handler) {
        return $($(node).parents().addBack().toArray().reverse()).each(handler);
    },
    isEditable: function (node) {
        if (node.nodeType == Node.TEXT_NODE) {
            return true;
        }
        if (node instanceof HTMLElement) {
            if (node.isContentEditable) {
                return true;
            }
            if (node.querySelectorAll(CONTENTEDITABLE_SELECTOR).length > 0) {
                return true;
            }
        }
        return false;
    }
};
var EditorBuddyContent = (function () {
    function EditorBuddyContent() {
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
    EditorBuddyContent.prototype.moveToEndOfLine = function () {
        throw new Error("Method not implemented.");
    };
    EditorBuddyContent.prototype.moveToStartOfLine = function () {
        throw new Error("Method not implemented.");
    };
    EditorBuddyContent.prototype.moveUp = function () {
        this.moveCursorVertically(-1);
    };
    EditorBuddyContent.prototype.moveDown = function () {
        this.moveCursorVertically(1);
    };
    EditorBuddyContent.prototype.moveLeft = function (byWord) {
        this.moveCursorHorizontally(-1, byWord);
    };
    EditorBuddyContent.prototype.moveRight = function (byWord) {
        this.moveCursorHorizontally(1, byWord);
    };
    EditorBuddyContent.prototype.moveCursorVertically = function (direction) {
        console.log('move cursor vertically', direction);
        var sel = this.win.getSelection();
        if (!sel || sel.rangeCount <= 0) {
            return;
        }
        var textNode = sel.focusNode;
        if (!(textNode instanceof Text)) {
            return;
        }
    };
    EditorBuddyContent.prototype.moveCursorHorizontally = function (direction, byWord) {
        console.log('move cursor horizontally', direction, byWord);
        var sel = this.win.getSelection();
        if (!sel || sel.rangeCount <= 0) {
            return;
        }
        var node = sel.focusNode;
        var text = node instanceof HTMLElement ? node.innerText : node.nodeValue;
        if (direction == 1 && sel.focusOffset >= text.length) {
            this.moveToNextNode(sel, byWord);
            return;
        }
        if (direction == -1 && sel.focusOffset <= 0) {
            this.moveToPreviousNode(sel, byWord);
            return;
        }
        var offset = -1;
        if (byWord) {
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
        sel.collapse(node, offset);
    };
    EditorBuddyContent.prototype.moveToPreviousNode = function (sel, byWord) {
        var sameBlock = true;
        var node = null;
        helpers.eachSelfAndParents(sel.focusNode, function () {
            if (helpers.isBlock(this)) {
                sameBlock = false;
            }
            if (this.previousSibling && helpers.isEditable(this.previousSibling)) {
                node = this.previousSibling;
                return false;
            }
        });
        if (!node) {
            return;
        }
        var selectable = helpers.findSelectableInNode(node).last()[0];
        if (!selectable) {
            this.moveToPreviousNode(sel, byWord);
            return;
        }
        var len = selectable instanceof HTMLElement ? selectable.innerText.length : selectable.nodeValue.length;
        sel.collapse(selectable, len);
        if (sameBlock) {
            this.moveLeft(byWord);
        }
    };
    EditorBuddyContent.prototype.moveToNextNode = function (sel, byWord) {
        var sameBlock = true;
        var focusNode = sel.focusNode;
        var selectable = null;
        selectable = helpers
            .findSelectableInNode(focusNode)
            .filter(function () { return this != focusNode; })[0];
        if (!selectable) {
            var node_1 = null;
            helpers.eachSelfAndParents(focusNode, function () {
                if (helpers.isBlock(this)) {
                    sameBlock = false;
                }
                if (this.nextSibling && helpers.isEditable(this.nextSibling)) {
                    node_1 = this.nextSibling;
                    return false;
                }
            });
            if (!node_1) {
                return;
            }
            node_1 = node_1;
            selectable = helpers.findSelectableInNode(node_1)[0];
            if (!selectable) {
                this.moveToNextNode(sel, byWord);
                return;
            }
        }
        sel.collapse(selectable, 0);
        if (sameBlock) {
            this.moveRight(byWord);
        }
    };
    EditorBuddyContent.prototype.findWordMarks = function (text, direction) {
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
    return EditorBuddyContent;
}());
new EditorBuddyContent();
